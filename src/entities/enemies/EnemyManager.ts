import {
  NES_PHYSICS,
  NES_WIDTH,
  TILE_SIZE,
} from '../../types/physics-constants.ts';
import { aabbIntersects, pxToSub } from '../../physics/SubPixelPhysics.ts';
import type {
  EnemySpawn,
  FireBarSpawn,
} from '../../types/level-schema.ts';
import type { EventBus } from '../../core/EventBus.ts';
import type { TileCollisionSolver } from '../../physics/TileCollisionSolver.ts';
import type { Mario } from '../player/Mario.ts';
import type { Camera } from '../../core/Camera.ts';
import { EnemyEntity } from './EnemyEntity.ts';
import { EnemyProjectile } from './EnemyProjectiles.ts';
import { FireBarHazard } from '../../world/FireBarHazard.ts';

interface PendingSpawnEntry {
  spawn: EnemySpawn;
  activated: boolean;
}

interface BridgeCollapseSequence {
  active: boolean;
  axeCol: number;
  currentCol: number;
  startCol: number;
  bridgeRow: number;
  frameTimer: number;
}

/**
 * Orchestrates all active enemies, projectiles (Hammers & Bowser Fire), rotating Fire-Bars,
 * combo chain scoring (consecutive stomps & sliding shells), and the Castle Bridge Collapse cutscene.
 */
export class EnemyManager {
  public readonly enemies: EnemyEntity[] = [];
  public readonly projectiles: EnemyProjectile[] = [];
  public readonly fireBars: FireBarHazard[] = [];

  private pendingSpawns: PendingSpawnEntry[] = [];
  private generators: EnemySpawn[] = [];
  private generatorTick = 0;

  // Mario consecutive airborne stomp chain counter
  public stompChainCount = 0;

  // Castle Axe -> Bridge Collapse state
  public bridgeCollapse: BridgeCollapseSequence | null = null;

  private eventBus: EventBus;
  private collisionSolver: TileCollisionSolver;

  constructor(eventBus: EventBus, collisionSolver: TileCollisionSolver) {
    this.eventBus = eventBus;
    this.collisionSolver = collisionSolver;
    this.bindEvents();
  }

  private bindEvents(): void {
    // 1. Knock upside-down any ground enemy standing on top of a bumped block (row - 1)
    this.eventBus.on('block-bumped', ({ col, row }) => {
      for (const enemy of this.enemies) {
        if (!enemy.alive || enemy.isIntangible()) continue;
        if (
          enemy.type === 'piranha-plant' ||
          enemy.type === 'lakitu' ||
          enemy.type === 'bullet-bill' ||
          enemy.type === 'podoboo'
        ) {
          continue;
        }

        const box = enemy.getAABB();
        const enemyBottomRow = Math.floor((box.y + box.height + 2) / TILE_SIZE);
        const enemyLeftCol = Math.floor(box.x / TILE_SIZE);
        const enemyRightCol = Math.floor((box.x + box.width - 1) / TILE_SIZE);

        if (
          enemyBottomRow === row &&
          col >= enemyLeftCol - 1 &&
          col <= enemyRightCol + 1
        ) {
          enemy.knockUpsideDown(1);
          this.awardComboScore(enemy.x, enemy.y, 'block-bump', enemy.type, 100, false);
        }
      }
    });

    // 2. Trigger Castle Bridge Collapse when Mario touches the Axe ('A')
    this.eventBus.on('castle-axe-touched', ({ axeCol, axeRow }) => {
      this.startBridgeCollapse(axeCol, axeRow);
    });
  }

  public loadAreaEnemies(
    spawns: EnemySpawn[],
    fireBarSpawns: FireBarSpawn[] = []
  ): void {
    this.enemies.length = 0;
    this.projectiles.length = 0;
    this.fireBars.length = 0;
    this.pendingSpawns = [];
    this.generators = [];
    this.generatorTick = 0;
    this.stompChainCount = 0;
    this.bridgeCollapse = null;

    for (const fb of fireBarSpawns) {
      this.fireBars.push(new FireBarHazard(fb));
    }

    for (const sp of spawns) {
      if (
        sp.type === 'bullet-bill-generator' ||
        sp.type === 'cheep-flying-generator'
      ) {
        this.generators.push(sp);
      } else {
        this.pendingSpawns.push({ spawn: sp, activated: false });
      }
    }
  }

  /** Direct helper to spawn an enemy immediately at a given tile or pixel coordinate */
  public spawnEnemyImmediate(spawn: EnemySpawn): EnemyEntity {
    const entity = new EnemyEntity(spawn, this.collisionSolver);
    this.enemies.push(entity);
    return entity;
  }

  public isBridgeCollapsing(): boolean {
    return this.bridgeCollapse !== null && this.bridgeCollapse.active;
  }

  private startBridgeCollapse(axeCol: number, axeRow: number): void {
    // Clear any bridge chain ('R') near the axe
    for (let r = Math.max(0, axeRow - 2); r <= Math.min(14, axeRow + 2); r++) {
      for (let c = Math.max(0, axeCol - 2); c <= axeCol; c++) {
        if (this.collisionSolver.getTile(c, r) === 'R') {
          this.collisionSolver.setTile(c, r, '.');
        }
      }
    }

    // Locate the bridge deck row ('=') to the left of the axe
    let bridgeRow = axeRow + 2;
    let rightMostBridgeCol = axeCol - 1;
    let leftMostBridgeCol = Math.max(0, axeCol - 14);

    for (let r = 0; r < 15; r++) {
      for (let c = axeCol - 1; c >= Math.max(0, axeCol - 16); c--) {
        if (this.collisionSolver.getTile(c, r) === '=') {
          bridgeRow = r;
          rightMostBridgeCol = Math.max(rightMostBridgeCol, c);
          leftMostBridgeCol = c;
        }
      }
    }

    this.bridgeCollapse = {
      active: true,
      axeCol,
      currentCol: rightMostBridgeCol,
      startCol: leftMostBridgeCol,
      bridgeRow,
      frameTimer: 0,
    };
  }

  private updateBridgeCollapse(): void {
    if (!this.bridgeCollapse || !this.bridgeCollapse.active) return;

    this.bridgeCollapse.frameTimer++;
    if (this.bridgeCollapse.frameTimer >= 4) {
      this.bridgeCollapse.frameTimer = 0;
      const col = this.bridgeCollapse.currentCol;
      const row = this.bridgeCollapse.bridgeRow;

      if (this.collisionSolver.getTile(col, row) === '=') {
        this.collisionSolver.setTile(col, row, '.');
      }
      this.bridgeCollapse.currentCol--;

      if (this.bridgeCollapse.currentCol < this.bridgeCollapse.startCol) {
        this.bridgeCollapse.active = false;
        // Drop Bowser into the lava pit!
        for (const enemy of this.enemies) {
          if (enemy.alive && enemy.type === 'bowser') {
            enemy.state = 'bridge-fall';
            enemy.vxSub = 0;
            enemy.vySub = pxToSub(0.5);
            this.awardComboScore(
              enemy.x,
              enemy.y,
              'bridge-collapse',
              'bowser',
              5000,
              false
            );
          }
        }
        this.eventBus.emit('bridge-collapse-completed', {
          axeCol: this.bridgeCollapse.axeCol,
        });
      }
    }
  }

  public update(mario: Mario, camera: Camera): void {
    // Reset Mario's consecutive stomp chain as soon as he touches the ground
    if (mario.grounded) {
      this.stompChainCount = 0;
    }

    if (this.isBridgeCollapsing()) {
      this.updateBridgeCollapse();
      return;
    }

    // 1. Activate pending enemies within camera lookahead window
    const activationRightPx = camera.x + NES_WIDTH + 48;
    for (const entry of this.pendingSpawns) {
      if (!entry.activated && entry.spawn.col * TILE_SIZE <= activationRightPx) {
        entry.activated = true;
        this.enemies.push(new EnemyEntity(entry.spawn, this.collisionSolver));
      }
    }

    // 2. Tick periodic enemy generators (Bullet Bill cannons & Flying Cheep-Cheeps)
    this.generatorTick++;
    if (this.generatorTick % 120 === 0) {
      for (const gen of this.generators) {
        const genX = gen.col * TILE_SIZE;
        if (genX < camera.x - 16 || genX > camera.x + NES_WIDTH + 32) continue;

        if (gen.type === 'bullet-bill-generator') {
          if (Math.abs(mario.x - genX) <= 24) continue;
          const bb = new EnemyEntity(
            { type: 'bullet-bill-generator', col: gen.col, row: gen.row },
            this.collisionSolver
          );
          bb.facing = mario.x < genX ? -1 : 1;
          bb.vxSub = bb.facing * pxToSub(1.8);
          this.enemies.push(bb);
        } else if (gen.type === 'cheep-flying-generator') {
          const cheep = new EnemyEntity(
            {
              type: 'cheep-flying-generator',
              col: Math.floor((camera.x + 32 + (this.generatorTick % 160)) / TILE_SIZE),
              row: 14,
            },
            this.collisionSolver
          );
          cheep.facing = 1;
          cheep.vxSub = pxToSub(1.3);
          cheep.vySub = -pxToSub(5.1);
          this.enemies.push(cheep);
        }
      }
    }

    // 3. Update Rotating Fire-Bar Hazards
    for (const fb of this.fireBars) {
      fb.update(mario);
    }

    // 4. Update Enemy Projectiles (Hammers & Bowser Fire Breath)
    const marioBox = mario.getAABB();
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update();
      if (!camera.isVisible(proj.getAABB(), 64)) {
        proj.alive = false;
      }
      if (proj.alive && mario.alive && aabbIntersects(marioBox, proj.getAABB())) {
        mario.takeDamage();
      }
      if (!proj.alive) {
        this.projectiles.splice(i, 1);
      }
    }

    // 5. Update Enemies
    const callbacks = {
      spawnProjectile: (proj: EnemyProjectile) => this.projectiles.push(proj),
      spawnMinion: (minion: EnemyEntity) => this.enemies.push(minion),
    };

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.updateAI(mario, callbacks);

      // Despawn enemies far behind the one-way camera
      if (
        enemy.type !== 'bowser' &&
        enemy.type !== 'lakitu' &&
        enemy.x < camera.x - 64
      ) {
        enemy.alive = false;
      }

      if (!enemy.alive) {
        this.enemies.splice(i, 1);
      }
    }

    // 6. Resolve Enemy-vs-Enemy, Sliding Shell-vs-Enemy, Fireball-vs-Enemy, and Mario-vs-Enemy Collisions
    this.resolveEnemyToEnemyCollisions();
    this.resolveFireballToEnemyCollisions(mario);
    this.resolveMarioToEnemyCollisions(mario);
  }

  private resolveEnemyToEnemyCollisions(): void {
    const count = this.enemies.length;
    for (let i = 0; i < count; i++) {
      const a = this.enemies[i];
      if (!a.alive || a.isIntangible()) continue;

      for (let j = i + 1; j < count; j++) {
        const b = this.enemies[j];
        if (!b.alive || b.isIntangible()) continue;

        if (!aabbIntersects(a.getAABB(), b.getAABB())) continue;

        // Case 1: Sliding Shell mows down other enemies!
        if (a.state === 'shell-sliding' && b.state !== 'shell-sliding') {
          b.knockUpsideDown(a.facing);
          this.awardShellChainScore(a, b);
          continue;
        }
        if (b.state === 'shell-sliding' && a.state !== 'shell-sliding') {
          a.knockUpsideDown(b.facing);
          this.awardShellChainScore(b, a);
          continue;
        }

        // Case 2: Two ground walkers bump into each other -> reverse directions
        if (
          a.state === 'normal' &&
          b.state === 'normal' &&
          a.grounded &&
          b.grounded
        ) {
          a.facing = a.x <= b.x ? -1 : 1;
          b.facing = a.x <= b.x ? 1 : -1;
        }
      }
    }
  }

  private resolveFireballToEnemyCollisions(mario: Mario): void {
    for (const fb of mario.fireballs) {
      if (!fb.alive || fb.exploding) continue;
      const fbBox = fb.getAABB();

      for (const enemy of this.enemies) {
        if (!enemy.alive || enemy.isIntangible()) continue;
        if (!aabbIntersects(fbBox, enemy.getAABB())) continue;

        fb.triggerExplosion();

        // Buzzy Beetle, Bullet Bill & Podoboo are fireproof!
        if (enemy.isFireproof()) {
          break;
        }

        // Bowser takes 5 fireball hits before flipping upside-down and revealing his true form
        if (enemy.type === 'bowser') {
          enemy.hp--;
          if (enemy.hp <= 0) {
            enemy.knockUpsideDown(fb.direction);
            this.awardComboScore(
              enemy.x,
              enemy.y,
              'fireball',
              'bowser',
              2000,
              false
            );
          }
          break;
        }

        enemy.knockUpsideDown(fb.direction);
        const pts =
          enemy.type === 'hammer-bro' || enemy.type === 'lakitu' ? 1000 : 200;
        this.awardComboScore(
          enemy.x,
          enemy.y,
          'fireball',
          enemy.type,
          pts,
          false
        );
        break;
      }
    }
  }

  private resolveMarioToEnemyCollisions(mario: Mario): void {
    if (!mario.alive) return;
    const marioBox = mario.getAABB();

    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.isIntangible()) continue;
      const enemyBox = enemy.getAABB();
      if (!aabbIntersects(marioBox, enemyBox)) continue;

      // 1. Starman Invincibility -> instant flip KO on contact (except Podoboo)
      if (mario.starmanTimer > 0 && enemy.type !== 'podoboo') {
        enemy.knockUpsideDown(mario.facing);
        this.awardStompChainScore(enemy);
        continue;
      }

      // 2. Stationary / Reviving Shell -> touching from ANY angle kicks the shell at ±3.0 px/f!
      if (enemy.state === 'shell-idle' || enemy.state === 'shell-reviving') {
        const marioCenter = marioBox.x + marioBox.width * 0.5;
        const shellCenter = enemyBox.x + enemyBox.width * 0.5;
        const kickDir = marioCenter <= shellCenter ? 1 : -1;
        enemy.kickShell(kickDir);
        if (mario.vySub > 0) {
          mario.vySub = NES_PHYSICS.STOMP_BOUNCE_VY;
        }
        this.awardComboScore(enemy.x, enemy.y, 'stomp', enemy.type, 400, false);
        continue;
      }

      // 3. Check if Mario is stomping from above (falling downward and feet above enemy midpoint)
      const marioBottom = marioBox.y + marioBox.height;
      const enemyMidY = enemyBox.y + enemyBox.height * 0.6;
      const isDescendingStomp = mario.vySub > 0 && marioBottom <= enemyMidY + 6;

      if (isDescendingStomp && enemy.isStompable()) {
        this.handleMarioStompEnemy(mario, enemy);
        continue;
      }

      // 4. Otherwise Mario takes damage (unless shell was just kicked within grace window)
      if (enemy.state === 'shell-sliding' && enemy.shellKickGraceTimer > 0) {
        continue;
      }
      mario.takeDamage();
    }
  }

  private handleMarioStompEnemy(mario: Mario, enemy: EnemyEntity): void {
    mario.vySub = NES_PHYSICS.STOMP_BOUNCE_VY;
    mario.grounded = false;

    // Winged Paratroopa loses wings first and becomes a walking Koopa
    if (enemy.winged) {
      enemy.winged = false;
      enemy.type = enemy.type.includes('red') ? 'koopa-red' : 'koopa-green';
      enemy.vySub = 0;
      this.awardStompChainScore(enemy);
      return;
    }

    // Sliding Shell stops back into idle shell when stomped from above
    if (enemy.state === 'shell-sliding') {
      enemy.enterIdleShell();
      this.awardStompChainScore(enemy);
      return;
    }

    // Koopa Troopa & Buzzy Beetle retract into stationary shell
    if (
      enemy.type === 'koopa-green' ||
      enemy.type === 'koopa-red' ||
      enemy.type === 'buzzy-beetle'
    ) {
      enemy.enterIdleShell();
      this.awardStompChainScore(enemy);
      return;
    }

    // Goomba flattens for 30 frames
    if (enemy.type === 'goomba') {
      enemy.state = 'squished';
      enemy.stateTimer = 30;
      enemy.vxSub = 0;
      enemy.vySub = 0;
      this.awardStompChainScore(enemy);
      return;
    }

    // Hammer Bro, Lakitu, Bullet Bill, Flying Cheep-Cheep drop off-screen
    enemy.knockUpsideDown(mario.facing);
    this.awardStompChainScore(enemy);
  }

  private awardStompChainScore(enemy: EnemyEntity): void {
    const chainTable = NES_PHYSICS.STOMP_CHAIN_POINTS;
    const idx = Math.min(this.stompChainCount, chainTable.length);
    this.stompChainCount++;

    if (idx >= chainTable.length) {
      this.awardComboScore(enemy.x, enemy.y, 'stomp', enemy.type, 0, true);
    } else {
      const pts = chainTable[idx];
      this.awardComboScore(enemy.x, enemy.y, 'stomp', enemy.type, pts, false);
    }
  }

  private awardShellChainScore(
    shell: EnemyEntity,
    victim: EnemyEntity
  ): void {
    const chainTable = NES_PHYSICS.SHELL_CHAIN_POINTS;
    const idx = Math.min(shell.shellKillChain, chainTable.length);
    shell.shellKillChain++;

    if (idx >= chainTable.length) {
      this.awardComboScore(victim.x, victim.y, 'shell', victim.type, 0, true);
    } else {
      const pts = chainTable[idx];
      this.awardComboScore(victim.x, victim.y, 'shell', victim.type, pts, false);
    }
  }

  private awardComboScore(
    worldX: number,
    worldY: number,
    method:
      | 'stomp'
      | 'shell'
      | 'fireball'
      | 'starman'
      | 'block-bump'
      | 'bridge-collapse',
    enemyType: string,
    points: number,
    extraLife: boolean
  ): void {
    const label = extraLife ? '1UP' : String(points);
    this.collisionSolver.addScorePopup(worldX, worldY - 8, label);
    this.eventBus.emit('enemy-defeated', {
      enemyType,
      method,
      points,
      extraLife,
      worldX,
      worldY,
    });
  }

  /** Render Piranha Plants BEHIND foreground pipe tiles so they emerge from inside the pipe! */
  public renderBehindTiles(ctx: CanvasRenderingContext2D, camera: Camera): void {
    for (const enemy of this.enemies) {
      if (enemy.type === 'piranha-plant') {
        enemy.render(ctx, camera);
      }
    }
  }

  /** Render all other enemies, projectiles & rotating Fire-Bars IN FRONT OF foreground tiles */
  public renderInFrontOfTiles(
    ctx: CanvasRenderingContext2D,
    camera: Camera
  ): void {
    for (const fb of this.fireBars) {
      fb.render(ctx, camera);
    }
    for (const enemy of this.enemies) {
      if (enemy.type !== 'piranha-plant') {
        enemy.render(ctx, camera);
      }
    }
    for (const proj of this.projectiles) {
      proj.render(ctx, camera);
    }
  }
}
