import { Entity } from '../../ecs/Entity.ts';
import {
  NES_HEIGHT,
  TILE_SIZE,
  type FacingDirection,
} from '../../types/physics-constants.ts';
import {
  pxToSub,
  applyGravityAndClampSub,
} from '../../physics/SubPixelPhysics.ts';
import type { EnemySpawn, EnemyType } from '../../types/level-schema.ts';
import type { TileCollisionSolver } from '../../physics/TileCollisionSolver.ts';
import type { Mario } from '../player/Mario.ts';
import type { Camera } from '../../core/Camera.ts';
import { EnemyProjectile } from './EnemyProjectiles.ts';
import { drawEnemySprite } from '../../rendering/PixelSpriteAtlas.ts';

export type EnemyState =
  | 'normal'
  | 'shell-idle'
  | 'shell-reviving'
  | 'shell-sliding'
  | 'squished'
  | 'flipped-dead'
  | 'bridge-fall';

export interface EnemyUpdateCallbacks {
  spawnProjectile: (proj: EnemyProjectile) => void;
  spawnMinion: (enemy: EnemyEntity) => void;
}

const WALK_SPEED_SUB = 0x0080; // 0.5 px/frame standard NES enemy walk speed
const SHELL_SLIDE_SPEED_SUB = 0x0300; // 3.0 px/frame kicked shell speed
const ENEMY_GRAVITY_SUB = 0x0024; // 36/256 px/frame²

/**
 * Unified 1985 NES Enemy Entity & AI State Machine covering the entire roster:
 * - Goomba (`goomba`)
 * - Koopa Troopa (`koopa-green`, `koopa-red` ledge turn-around, `paratroopa-*` winged variants)
 * - Buzzy Beetle (`buzzy-beetle` — fireproof shell beetle)
 * - Piranha Plant (`piranha-plant` — pipe cycle + proximity inhibition when Mario is near pipe)
 * - Hammer Bro (`hammer-bro` — patrols, jumps tiers, throws arcing hammers)
 * - Lakitu & Spiny (`lakitu` cloud hover + egg thrower; `spiny` egg falls & hatches on ground)
 * - Bullet Bill (`bullet-bill` — straight horizontal cannon flight, stompable, immune to fireballs)
 * - Blooper (`blooper` — diagonal pursuit bursts + slow sink)
 * - Cheep-Cheep (`cheep-red-swim`, `cheep-grey-swim`, `cheep-flying-generator`)
 * - Podoboo (`podoboo` — vertical lava eruption & apex flip)
 * - King Bowser (`bowser` — 32×32 boss, 5 HP, bridge patrol, high leaps, fire breath, hammer volleys, true-form reveal & bridge collapse fall)
 */
export class EnemyEntity extends Entity {
  public type: EnemyType | 'bullet-bill';
  public readonly spawnConfig: EnemySpawn;
  public state: EnemyState = 'normal';
  public facing: FacingDirection = -1;
  public animFrame = 0;

  // Koopa / Buzzy Shell & Wing state
  public winged = false;
  public shellReviveTimer = 0;
  public shellKickGraceTimer = 0;
  public shellKillChain = 0;

  // Squished / Death timers
  public stateTimer = 0;

  // Piranha Plant state
  public piranhaBaseY: number;
  public piranhaPhase: 'hidden' | 'emerging' | 'exposed' | 'retracting' =
    'hidden';
  public piranhaTimer = 45;

  // Spiny Egg state
  public isSpinyEgg = false;

  // Blooper pursuit state
  private blooperBurstTimer = 0;

  // Podoboo lava cycle
  private podobooRestY: number;
  private podobooPauseTimer = 0;

  // Hammer Bro & Bowser AI state
  public hp = 1;
  public mouthOpen = false;
  private originX: number;
  private originY: number;
  private aiTimer = 0;
  private jumpTimer = 90;
  private attackTimer = 65;
  public revealedTrueForm: string | null = null;

  private collisionSolver: TileCollisionSolver;

  constructor(spawn: EnemySpawn, collisionSolver: TileCollisionSolver) {
    const isTall =
      spawn.type === 'koopa-green' ||
      spawn.type === 'koopa-red' ||
      spawn.type.startsWith('paratroopa') ||
      spawn.type === 'piranha-plant' ||
      spawn.type === 'hammer-bro' ||
      spawn.type === 'lakitu' ||
      spawn.type === 'blooper';
    const isBowser = spawn.type === 'bowser';

    const w = isBowser ? 32 : 16;
    const h = isBowser ? 32 : isTall ? 24 : 16;
    const xPx =
      spawn.type === 'piranha-plant'
        ? spawn.col * TILE_SIZE + 8
        : spawn.col * TILE_SIZE;
    const yPx =
      spawn.type === 'piranha-plant'
        ? spawn.row * TILE_SIZE
        : spawn.row * TILE_SIZE - (h - 16);

    super(xPx, yPx, w, h, {
      offsetX: 2,
      offsetY: isBowser ? 4 : 2,
      width: w - 4,
      height: h - (isBowser ? 4 : 2),
    });

    this.type =
      spawn.type === 'bullet-bill-generator' ? 'bullet-bill' : spawn.type;
    this.spawnConfig = spawn;
    this.collisionSolver = collisionSolver;
    this.originX = xPx;
    this.originY = yPx;
    this.piranhaBaseY = yPx;
    this.podobooRestY = Math.max(yPx, 208);

    if (spawn.type.startsWith('paratroopa')) {
      this.winged = true;
    }
    if (spawn.type === 'bowser') {
      this.hp = 5;
    }

    // Set initial horizontal velocity for standard ground walkers
    if (
      this.type === 'goomba' ||
      this.type === 'koopa-green' ||
      this.type === 'koopa-red' ||
      this.type === 'paratroopa-green-leaping' ||
      this.type === 'buzzy-beetle' ||
      this.type === 'spiny'
    ) {
      this.facing = -1;
      this.vxSub = -WALK_SPEED_SUB;
    } else if (this.type === 'bullet-bill') {
      this.facing = -1;
      this.vxSub = -pxToSub(1.8);
    } else if (this.type === 'podoboo') {
      this.vySub = -pxToSub(5.4);
    }
  }

  /** Whether this enemy is currently harmlessly hidden inside a pipe (Piranha Plant hidden phase) */
  public isIntangible(): boolean {
    if (!this.alive) return true;
    if (this.state === 'squished' || this.state === 'flipped-dead' || this.state === 'bridge-fall') {
      return true;
    }
    if (this.type === 'piranha-plant' && this.piranhaPhase === 'hidden') {
      return true;
    }
    return false;
  }

  /** Whether Mario can stomp this enemy from above without taking damage */
  public isStompable(): boolean {
    if (
      this.type === 'piranha-plant' ||
      this.type === 'spiny' ||
      this.type === 'podoboo' ||
      this.type === 'blooper' ||
      this.type === 'bowser' ||
      this.type === 'cheep-red-swim' ||
      this.type === 'cheep-grey-swim'
    ) {
      return false;
    }
    return true;
  }

  /** Whether this enemy deflects Fire Mario's fireballs without taking damage */
  public isFireproof(): boolean {
    return (
      this.type === 'buzzy-beetle' ||
      this.type === 'bullet-bill' ||
      this.type === 'podoboo'
    );
  }

  /** Enter retracted stationary shell (`shell-idle`) */
  public enterIdleShell(): void {
    this.state = 'shell-idle';
    this.winged = false;
    this.vxSub = 0;
    this.vySub = 0;
    this.shellReviveTimer = 300; // 5 seconds @ 60 FPS before popping back out
    this.shellKillChain = 0;
    this.spriteHeight = 16;
    this.hitbox = {
      offsetX: 2,
      offsetY: 2,
      width: 12,
      height: 14,
    };
  }

  /** Kick a stationary shell into high-speed sliding (`shell-sliding`) */
  public kickShell(direction: FacingDirection): void {
    this.state = 'shell-sliding';
    this.facing = direction;
    this.vxSub = direction * SHELL_SLIDE_SPEED_SUB;
    this.shellKickGraceTimer = 10; // Prevent hurting Mario on the kick frame
    this.shellKillChain = 0;
  }

  /** Knock enemy upside-down (`flipped-dead`) from fireball, sliding shell, Starman, or block bump */
  public knockUpsideDown(direction: FacingDirection = 1): void {
    if (this.state === 'flipped-dead') return;
    if (this.type === 'bowser' && this.spawnConfig.bowserTrueForm && this.spawnConfig.bowserTrueForm !== 'real-bowser') {
      this.revealedTrueForm = this.spawnConfig.bowserTrueForm;
    }
    this.state = 'flipped-dead';
    this.vxSub = direction * pxToSub(0.8);
    this.vySub = -pxToSub(3.2);
    this.grounded = false;
  }

  public update(): void {
    // Base Entity signature stub; EnemyManager invokes updateAI(mario, callbacks)
  }

  public updateAI(mario: Mario, callbacks: EnemyUpdateCallbacks): void {
    if (!this.alive) return;
    this.animFrame++;
    this.aiTimer++;

    if (this.shellKickGraceTimer > 0) {
      this.shellKickGraceTimer--;
    }

    // 1. Squished Goomba state
    if (this.state === 'squished') {
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        this.alive = false;
      }
      return;
    }

    // 2. Flipped Upside-Down KO or Bridge Collapse Fall (ignores tile collisions)
    if (this.state === 'flipped-dead' || this.state === 'bridge-fall') {
      this.xSub += this.vxSub;
      this.ySub += this.vySub;
      this.vySub = applyGravityAndClampSub(this.vySub, ENEMY_GRAVITY_SUB);
      if (this.y > NES_HEIGHT + 32) {
        this.alive = false;
      }
      return;
    }

    // 3. Stationary / Reviving Shell
    if (this.state === 'shell-idle' || this.state === 'shell-reviving') {
      this.vySub = applyGravityAndClampSub(this.vySub, ENEMY_GRAVITY_SUB);
      this.collisionSolver.moveAndCollideEntity(this);

      this.shellReviveTimer--;
      if (this.shellReviveTimer <= 90 && this.shellReviveTimer > 0) {
        this.state = 'shell-reviving';
      } else if (this.shellReviveTimer <= 0) {
        // Pop back out of shell and resume walking!
        this.state = 'normal';
        if (this.type !== 'buzzy-beetle') {
          this.ySub -= pxToSub(8);
          this.spriteHeight = 24;
          this.hitbox = { offsetX: 2, offsetY: 2, width: 12, height: 22 };
        }
        this.vxSub = this.facing * WALK_SPEED_SUB;
      }
      return;
    }

    // 4. High-Speed Sliding Shell (`shell-sliding`)
    if (this.state === 'shell-sliding') {
      this.vxSub = this.facing * SHELL_SLIDE_SPEED_SUB;
      this.vySub = applyGravityAndClampSub(this.vySub, ENEMY_GRAVITY_SUB);
      const col = this.collisionSolver.moveAndCollideEntity(this);

      if (col.hitWallLeft) {
        this.facing = 1;
        this.vxSub = SHELL_SLIDE_SPEED_SUB;
      } else if (col.hitWallRight) {
        this.facing = -1;
        this.vxSub = -SHELL_SLIDE_SPEED_SUB;
      }

      if (this.y > NES_HEIGHT + 32) {
        this.alive = false;
      }
      return;
    }

    // 5. Specialized AI per Enemy Type
    switch (this.type) {
      case 'piranha-plant':
        this.updatePiranhaPlant(mario);
        return;

      case 'paratroopa-green-fly-horizontal':
        this.x = Math.round(
          this.originX + Math.sin(this.aiTimer * 0.035) * 40
        );
        this.facing = Math.cos(this.aiTimer * 0.035) >= 0 ? 1 : -1;
        return;

      case 'paratroopa-red-vertical':
        this.y = Math.round(
          this.originY + Math.sin(this.aiTimer * 0.035) * 40
        );
        this.facing = mario.x < this.x ? -1 : 1;
        return;

      case 'bullet-bill':
        this.xSub += this.vxSub;
        return;

      case 'blooper':
        this.updateBlooper(mario);
        return;

      case 'cheep-red-swim':
      case 'cheep-grey-swim': {
        const speed = this.type === 'cheep-red-swim' ? -0.75 : -0.45;
        this.facing = -1;
        this.xSub += pxToSub(speed);
        this.y = Math.round(
          this.originY + Math.sin(this.aiTimer * 0.06) * 8
        );
        return;
      }

      case 'cheep-flying-generator': {
        this.xSub += this.vxSub;
        this.ySub += this.vySub;
        this.vySub += pxToSub(0.12);
        if (this.y > NES_HEIGHT + 32) {
          this.alive = false;
        }
        return;
      }

      case 'podoboo':
        this.updatePodoboo();
        return;

      case 'lakitu':
        this.updateLakitu(mario, callbacks);
        return;

      case 'hammer-bro':
        this.updateHammerBro(mario, callbacks);
        return;

      case 'bowser':
        this.updateBowser(mario, callbacks);
        return;

      default:
        break;
    }

    // 6. Standard Ground / Leaping Walkers: Goomba, Koopa (Green/Red/Leaping), Buzzy Beetle, Spiny
    this.vxSub = this.isSpinyEgg ? 0 : this.facing * WALK_SPEED_SUB;
    this.vySub = applyGravityAndClampSub(this.vySub, ENEMY_GRAVITY_SUB);

    const col = this.collisionSolver.moveAndCollideEntity(this);

    // Spiny Egg hatches into walking Spiny upon landing on floor!
    if (this.type === 'spiny' && this.isSpinyEgg && (col.landedOnFloor || this.grounded)) {
      this.isSpinyEgg = false;
      this.facing = mario.x < this.x ? -1 : 1;
      this.vxSub = this.facing * WALK_SPEED_SUB;
    }

    // Leaping Green Paratroopa bounces on floor contact
    if (
      this.type === 'paratroopa-green-leaping' &&
      this.winged &&
      (col.landedOnFloor || this.grounded)
    ) {
      this.vySub = -pxToSub(3.6);
      this.grounded = false;
    }

    // Wall turnaround
    if (col.hitWallLeft) {
      this.facing = 1;
      this.vxSub = WALK_SPEED_SUB;
    } else if (col.hitWallRight) {
      this.facing = -1;
      this.vxSub = -WALK_SPEED_SUB;
    }

    // Red Koopa Troopa Ledge Detection: turns around before walking off a ledge!
    if (this.type === 'koopa-red' && !this.winged && this.grounded) {
      const box = this.getAABB();
      const probeX =
        this.facing === -1 ? box.x - 2 : box.x + box.width + 2;
      const probeY = box.y + box.height + 2;
      if (!this.collisionSolver.isSolidAtPixel(probeX, probeY)) {
        this.facing = this.facing === -1 ? 1 : -1;
        this.vxSub = this.facing * WALK_SPEED_SUB;
      }
    }

    if (this.y > NES_HEIGHT + 32) {
      this.alive = false;
    }
  }

  private updatePiranhaPlant(mario: Mario): void {
    const exposedY = this.piranhaBaseY - 24;
    const plantCenterX = this.x + 8;
    const marioCenterX = mario.x + 8;

    if (this.piranhaPhase === 'hidden') {
      this.y = this.piranhaBaseY;
      this.piranhaTimer--;
      if (this.piranhaTimer <= 0) {
        // Authentic 1985 Rule: Do NOT emerge if Mario is standing on or right next to the pipe!
        if (Math.abs(marioCenterX - plantCenterX) <= 28) {
          this.piranhaTimer = 15;
          return;
        }
        this.piranhaPhase = 'emerging';
      }
      return;
    }

    if (this.piranhaPhase === 'emerging') {
      this.ySub -= pxToSub(0.75);
      if (this.y <= exposedY) {
        this.y = exposedY;
        this.piranhaPhase = 'exposed';
        this.piranhaTimer = 50;
      }
      return;
    }

    if (this.piranhaPhase === 'exposed') {
      this.piranhaTimer--;
      if (this.piranhaTimer <= 0) {
        this.piranhaPhase = 'retracting';
      }
      return;
    }

    if (this.piranhaPhase === 'retracting') {
      this.ySub += pxToSub(0.75);
      if (this.y >= this.piranhaBaseY) {
        this.y = this.piranhaBaseY;
        this.piranhaPhase = 'hidden';
        this.piranhaTimer = 60;
      }
    }
  }

  private updateBlooper(mario: Mario): void {
    if (this.blooperBurstTimer > 0) {
      this.blooperBurstTimer--;
      this.xSub += this.vxSub;
      this.ySub += this.vySub;
      if (this.y < 24) {
        this.y = 24;
      }
      return;
    }

    // Drift downward until below or near Mario's vertical level, then burst upward toward Mario
    this.ySub += pxToSub(0.5);
    if (this.y >= Math.max(48, mario.y - 8) || this.aiTimer % 48 === 0) {
      this.facing = mario.x < this.x ? -1 : 1;
      this.vxSub = this.facing * pxToSub(1.0);
      this.vySub = -pxToSub(1.35);
      this.blooperBurstTimer = 26;
    }
  }

  private updatePodoboo(): void {
    if (this.podobooPauseTimer > 0) {
      this.podobooPauseTimer--;
      this.y = this.podobooRestY;
      if (this.podobooPauseTimer === 0) {
        this.vySub = -pxToSub(5.4);
      }
      return;
    }

    this.ySub += this.vySub;
    this.vySub += pxToSub(0.14);
    this.flippedUpsideDownForRender = this.vySub > 0;

    if (this.vySub > 0 && this.y >= this.podobooRestY) {
      this.y = this.podobooRestY;
      this.vySub = 0;
      this.podobooPauseTimer = 70;
    }
  }

  private flippedUpsideDownForRender = false;

  private updateLakitu(
    mario: Mario,
    callbacks: EnemyUpdateCallbacks
  ): void {
    const targetX = mario.x + Math.sin(this.aiTimer * 0.04) * 48;
    const diffX = targetX - this.x;
    this.facing = diffX >= 0 ? 1 : -1;
    const speed = Math.min(2.2, Math.max(0.6, Math.abs(diffX) * 0.05));
    this.xSub += (diffX >= 0 ? 1 : -1) * pxToSub(speed);
    this.y = 32;

    this.attackTimer--;
    if (this.attackTimer <= 0) {
      this.attackTimer = 135;
      const spinyEgg = new EnemyEntity(
        {
          type: 'spiny',
          col: Math.floor(this.x / TILE_SIZE),
          row: Math.floor(this.y / TILE_SIZE),
        },
        this.collisionSolver
      );
      spinyEgg.x = this.x;
      spinyEgg.y = this.y;
      spinyEgg.isSpinyEgg = true;
      spinyEgg.vySub = -pxToSub(2.2);
      callbacks.spawnMinion(spinyEgg);
    }
  }

  private updateHammerBro(
    mario: Mario,
    callbacks: EnemyUpdateCallbacks
  ): void {
    this.facing = mario.x <= this.x ? -1 : 1;

    // Oscillate horizontally within ±12px of spawn
    const patrolDir = Math.sin(this.aiTimer * 0.04) >= 0 ? 1 : -1;
    this.vxSub = patrolDir * pxToSub(0.35);
    this.vySub = applyGravityAndClampSub(this.vySub, ENEMY_GRAVITY_SUB);

    this.jumpTimer--;
    if (this.jumpTimer <= 0 && this.grounded) {
      this.jumpTimer = 140;
      this.vySub = -pxToSub(4.2);
      this.grounded = false;
    }

    this.collisionSolver.moveAndCollideEntity(this);

    // Throw arcing Hammer periodically
    this.attackTimer--;
    this.mouthOpen = this.attackTimer <= 18 && this.attackTimer > 0;
    if (this.attackTimer <= 0) {
      this.attackTimer = 75;
      callbacks.spawnProjectile(
        new EnemyProjectile(
          'hammer',
          this.x + (this.facing === 1 ? 10 : -2),
          this.y - 2,
          this.facing
        )
      );
    }
  }

  private updateBowser(
    mario: Mario,
    callbacks: EnemyUpdateCallbacks
  ): void {
    this.facing = mario.x <= this.x ? -1 : 1;

    // Patrol horizontally within ±24px of spawn X on the bridge
    const minPatrolX = this.originX - 24;
    const maxPatrolX = this.originX + 24;
    if (this.x <= minPatrolX) {
      this.vxSub = pxToSub(0.5);
    } else if (this.x >= maxPatrolX) {
      this.vxSub = -pxToSub(0.5);
    } else if (this.vxSub === 0) {
      this.vxSub = -pxToSub(0.5);
    }

    // Periodic high leap (slow castle gravity allows Mario to sprint underneath!)
    this.jumpTimer--;
    if (this.jumpTimer <= 0 && this.grounded) {
      this.jumpTimer = 110;
      this.vySub = -pxToSub(3.2);
      this.grounded = false;
    }

    this.vySub = applyGravityAndClampSub(this.vySub, pxToSub(0.09));
    this.collisionSolver.moveAndCollideEntity(this);

    // Breathe homing fire stream & optional hammer volley (Worlds 6-4, 7-4, 8-4)
    this.attackTimer--;
    this.mouthOpen = this.attackTimer <= 20 && this.attackTimer > 0;
    if (this.attackTimer <= 0) {
      this.attackTimer = 95;
      const targetRows = [8 * TILE_SIZE, 9 * TILE_SIZE, 10 * TILE_SIZE];
      const targetY =
        targetRows[Math.floor(this.aiTimer / 17) % targetRows.length];
      callbacks.spawnProjectile(
        new EnemyProjectile(
          'bowser-fire',
          this.x + (this.facing === -1 ? -16 : 24),
          this.y + 8,
          this.facing,
          targetY
        )
      );

      if (this.spawnConfig.bowserThrowsHammers) {
        callbacks.spawnProjectile(
          new EnemyProjectile(
            'hammer',
            this.x + (this.facing === -1 ? 0 : 20),
            this.y - 4,
            this.facing
          )
        );
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (!this.alive) return;
    if (this.type === 'piranha-plant' && this.piranhaPhase === 'hidden') return;
    if (!camera.isVisible(this.getAABB(), 32)) return;

    const sx = camera.worldToScreenX(this.x);
    const sy = camera.worldToScreenY(this.y);
    const renderType = this.revealedTrueForm ?? this.type;

    drawEnemySprite(ctx, sx, sy, this.spriteWidth, this.spriteHeight, {
      type: renderType,
      facing: this.facing,
      animFrame: this.animFrame,
      squished: this.state === 'squished',
      flippedUpsideDown:
        this.state === 'flipped-dead' || this.flippedUpsideDownForRender,
      inShell:
        this.state === 'shell-idle' ||
        this.state === 'shell-reviving' ||
        this.state === 'shell-sliding',
      shellReviving: this.state === 'shell-reviving',
      winged: this.winged,
      spinyEgg: this.isSpinyEgg,
      mouthOpen: this.mouthOpen,
    });
  }
}
