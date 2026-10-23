import {
  TILE_SIZE,
  GRID_ROWS,
  type MarioPowerState,
} from '../types/physics-constants.ts';
import { pxToSub } from './SubPixelPhysics.ts';
import type {
  BlockContentOverride,
  BlockPayloadType,
  LevelDefinition,
} from '../types/level-schema.ts';
import type { Entity } from '../ecs/Entity.ts';
import type { EventBus } from '../core/EventBus.ts';

export interface TilemapStateSnapshot {
  widthCols: number;
  grid: string[][];
  blockContents: Array<[string, BlockPayloadType]>;
  blockTargetSubworlds: Array<[string, string]>;
  multiCoinRemaining: Array<[string, number]>;
}

export interface ActiveBumpAnimation {
  col: number;
  row: number;
  timer: number;
  maxTimer: number;
  offsetY: number;
}

export interface BrickDebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  lifeFrames: number;
}

export interface FloatingScorePopup {
  x: number;
  y: number;
  text: string;
  lifeFrames: number;
}

const SOLID_TILES = new Set<string>([
  '#', // Ground / Stone
  'B', // Brick Block
  '?', // Question Block
  'M', // Empty Used Metal Block
  'X', // Hard Stair / Castle Block
  'P', // Pipe Top-Left
  'p', // Pipe Top-Right
  '[', // Pipe Body-Left
  ']', // Pipe Body-Right
  'b', // Bullet Bill Cannon Top
  'c', // Bullet Bill Cannon Base
  '=', // Bridge Deck
]);

export class TileCollisionSolver {
  private grid: string[][] = [];
  private widthCols = 0;
  private blockContents = new Map<string, BlockPayloadType>();
  private blockTargetSubworlds = new Map<string, string>();
  private multiCoinRemaining = new Map<string, number>();
  public readonly activeBumps = new Map<string, ActiveBumpAnimation>();
  public readonly debrisParticles: BrickDebrisParticle[] = [];
  public readonly scorePopups: FloatingScorePopup[] = [];
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public loadLevelGrid(level: LevelDefinition): void {
    this.loadAreaGrid(level.widthCols, level.tileMatrix, level.blockContents);
  }

  public loadAreaGrid(
    widthCols: number,
    tileMatrix: string[],
    blockContents: BlockContentOverride[]
  ): void {
    this.widthCols = widthCols;
    this.grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      const rowStr = tileMatrix[r] ?? '';
      const rowChars: string[] = [];
      for (let c = 0; c < this.widthCols; c++) {
        rowChars.push(rowStr[c] ?? '.');
      }
      this.grid.push(rowChars);
    }

    this.blockContents.clear();
    this.blockTargetSubworlds.clear();
    this.multiCoinRemaining.clear();
    this.activeBumps.clear();
    this.debrisParticles.length = 0;
    this.scorePopups.length = 0;

    for (const item of blockContents) {
      const key = this.key(item.col, item.row);
      this.blockContents.set(key, item.payload);
      if (item.targetSubworldId) {
        this.blockTargetSubworlds.set(key, item.targetSubworldId);
      }
      if (item.payload === 'multi-coin-10') {
        this.multiCoinRemaining.set(key, 10);
      }
    }
  }

  public exportStateSnapshot(): TilemapStateSnapshot {
    return {
      widthCols: this.widthCols,
      grid: this.grid.map((row) => [...row]),
      blockContents: Array.from(this.blockContents.entries()),
      blockTargetSubworlds: Array.from(this.blockTargetSubworlds.entries()),
      multiCoinRemaining: Array.from(this.multiCoinRemaining.entries()),
    };
  }

  public restoreStateSnapshot(snapshot: TilemapStateSnapshot): void {
    this.widthCols = snapshot.widthCols;
    this.grid = snapshot.grid.map((row) => [...row]);
    this.blockContents = new Map(snapshot.blockContents);
    this.blockTargetSubworlds = new Map(snapshot.blockTargetSubworlds);
    this.multiCoinRemaining = new Map(snapshot.multiCoinRemaining);
    this.activeBumps.clear();
    this.debrisParticles.length = 0;
    this.scorePopups.length = 0;
  }

  private key(col: number, row: number): string {
    return `${col},${row}`;
  }

  public getWidthCols(): number {
    return this.widthCols;
  }

  public getTile(col: number, row: number): string {
    if (col < 0 || col >= this.widthCols) return '.';
    if (row < 0) {
      // Extend vertical walls/pipes above top of screen ONLY if row 0 is a wall
      return '.';
    }
    if (row >= GRID_ROWS) return '.';
    return this.grid[row][col] ?? '.';
  }

  public setTile(col: number, row: number, ch: string): void {
    if (col < 0 || col >= this.widthCols || row < 0 || row >= GRID_ROWS) return;
    this.grid[row][col] = ch;
  }

  public isSolidTile(col: number, row: number): boolean {
    const ch = this.getTile(col, row);
    return SOLID_TILES.has(ch);
  }

  public isSolidAtPixel(worldX: number, worldY: number): boolean {
    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);
    return this.isSolidTile(col, row);
  }

  public getBumpOffsetY(col: number, row: number): number {
    const bump = this.activeBumps.get(this.key(col, row));
    return bump ? bump.offsetY : 0;
  }

  public addScorePopup(worldX: number, worldY: number, text: string): void {
    this.scorePopups.push({
      x: worldX,
      y: worldY,
      text,
      lifeFrames: 36,
    });
  }

  public updateVisualEffects(): void {
    for (const [k, bump] of this.activeBumps.entries()) {
      bump.timer++;
      const progress = bump.timer / bump.maxTimer;
      bump.offsetY = -Math.round(Math.sin(progress * Math.PI) * 6);
      if (bump.timer >= bump.maxTimer) {
        this.activeBumps.delete(k);
      }
    }

    for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
      const p = this.debrisParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.32;
      p.rotation += 0.25;
      p.lifeFrames--;
      if (p.lifeFrames <= 0 || p.y > 260) {
        this.debrisParticles.splice(i, 1);
      }
    }

    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const s = this.scorePopups[i];
      s.y -= 0.75;
      s.lifeFrames--;
      if (s.lifeFrames <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  /**
   * Resolve separated X and Y Axis-Aligned Bounding Box collisions for an entity.
   * Also handles Mario head-butting blocks (`B`, `?`, `H`), collecting floating coins (`C`),
   * and touching the flagpole (`F`, `G`).
   */
  public moveAndCollideEntity(
    entity: Entity,
    options?: {
      isPlayer?: boolean;
      powerState?: MarioPowerState;
      minLeftWorldX?: number;
    }
  ): {
    hitWallLeft: boolean;
    hitWallRight: boolean;
    hitCeiling: boolean;
    landedOnFloor: boolean;
    touchedFlagpoleCol: number | null;
    touchedLava: boolean;
  } {
    const isPlayer = options?.isPlayer ?? false;
    const powerState = options?.powerState ?? 'small';

    let hitWallLeft = false;
    let hitWallRight = false;
    let hitCeiling = false;
    let landedOnFloor = false;
    let touchedFlagpoleCol: number | null = null;
    let touchedLava = false;

    // 1. Horizontal Step
    entity.xSub += entity.vxSub;

    if (options?.minLeftWorldX !== undefined) {
      const aabbLeftCheck = entity.getAABB();
      if (aabbLeftCheck.x < options.minLeftWorldX) {
        const clampedSpriteX = options.minLeftWorldX - entity.hitbox.offsetX;
        entity.xSub = pxToSub(clampedSpriteX);
        if (entity.vxSub < 0) {
          entity.vxSub = 0;
        }
        hitWallLeft = true;
      }
    }

    const boxAfterX = entity.getAABB();
    const startRowX = Math.floor((boxAfterX.y + 1) / TILE_SIZE);
    const endRowX = Math.floor((boxAfterX.y + boxAfterX.height - 1) / TILE_SIZE);

    if (entity.vxSub > 0) {
      const rightCol = Math.floor((boxAfterX.x + boxAfterX.width) / TILE_SIZE);
      for (let r = startRowX; r <= endRowX; r++) {
        if (this.isSolidTile(rightCol, r)) {
          const clampedSpriteX =
            rightCol * TILE_SIZE - entity.hitbox.width - entity.hitbox.offsetX;
          entity.xSub = pxToSub(clampedSpriteX);
          entity.vxSub = 0;
          hitWallRight = true;
          break;
        }
      }
    } else if (entity.vxSub < 0) {
      const leftCol = Math.floor(boxAfterX.x / TILE_SIZE);
      for (let r = startRowX; r <= endRowX; r++) {
        if (this.isSolidTile(leftCol, r)) {
          const clampedSpriteX =
            (leftCol + 1) * TILE_SIZE - entity.hitbox.offsetX;
          entity.xSub = pxToSub(clampedSpriteX);
          entity.vxSub = 0;
          hitWallLeft = true;
          break;
        }
      }
    }

    // 2. Vertical Step
    entity.ySub += entity.vySub;
    entity.grounded = false;

    const boxAfterY = entity.getAABB();
    const startColY = Math.floor((boxAfterY.x + 1) / TILE_SIZE);
    const endColY = Math.floor((boxAfterY.x + boxAfterY.width - 1) / TILE_SIZE);

    if (entity.vySub > 0) {
      // Falling Downward
      const bottomRow = Math.floor(
        (boxAfterY.y + boxAfterY.height) / TILE_SIZE
      );
      for (let c = startColY; c <= endColY; c++) {
        if (this.isSolidTile(c, bottomRow)) {
          const snappedSpriteY =
            bottomRow * TILE_SIZE -
            entity.hitbox.height -
            entity.hitbox.offsetY;
          entity.ySub = pxToSub(snappedSpriteY);
          entity.vySub = 0;
          entity.grounded = true;
          landedOnFloor = true;
          break;
        }
      }
    } else if (entity.vySub < 0) {
      // Moving Upward (Jumping into ceiling / blocks)
      const topRow = Math.floor(boxAfterY.y / TILE_SIZE);
      const centerCol = Math.floor(
        (boxAfterY.x + boxAfterY.width * 0.5) / TILE_SIZE
      );

      // Prefer the block directly above Mario's head center
      const candidateCols = [centerCol];
      for (let c = startColY; c <= endColY; c++) {
        if (c !== centerCol) candidateCols.push(c);
      }

      for (const c of candidateCols) {
        const ch = this.getTile(c, topRow);
        const isHiddenBlock = ch === 'H';
        if (this.isSolidTile(c, topRow) || (isPlayer && isHiddenBlock)) {
          // Authentic NES Corner Correction:
          // If only clipping the outermost 3px of a ceiling block and center is clear, nudge horizontally!
          if (
            isPlayer &&
            !isHiddenBlock &&
            c !== centerCol &&
            !this.isSolidTile(centerCol, topRow)
          ) {
            const tileLeft = c * TILE_SIZE;
            const tileRight = tileLeft + TILE_SIZE;
            const overlapRightEdge = boxAfterY.x + boxAfterY.width - tileLeft;
            const overlapLeftEdge = tileRight - boxAfterY.x;
            if (overlapRightEdge > 0 && overlapRightEdge <= 4) {
              entity.xSub = pxToSub(
                tileLeft - entity.hitbox.width - entity.hitbox.offsetX
              );
              continue;
            }
            if (overlapLeftEdge > 0 && overlapLeftEdge <= 4) {
              entity.xSub = pxToSub(tileRight - entity.hitbox.offsetX);
              continue;
            }
          }

          const snappedSpriteY =
            (topRow + 1) * TILE_SIZE - entity.hitbox.offsetY;
          entity.ySub = pxToSub(snappedSpriteY);
          entity.vySub = pxToSub(1.0); // Immediate downward rebound after head-butt
          hitCeiling = true;

          if (isPlayer) {
            this.handlePlayerHeadbuttBlock(c, topRow, ch, powerState);
          }
          break;
        }
      }
    }

    // 3. Collectibles, Flagpole & Hazard overlaps for Player
    if (isPlayer) {
      const finalBox = entity.getAABB();
      const cStart = Math.floor(finalBox.x / TILE_SIZE);
      const cEnd = Math.floor((finalBox.x + finalBox.width - 1) / TILE_SIZE);
      const rStart = Math.floor(finalBox.y / TILE_SIZE);
      const rEnd = Math.floor((finalBox.y + finalBox.height - 1) / TILE_SIZE);

      for (let r = rStart; r <= rEnd; r++) {
        for (let c = cStart; c <= cEnd; c++) {
          const ch = this.getTile(c, r);
          if (ch === 'C') {
            this.setTile(c, r, '.');
            const worldX = c * TILE_SIZE;
            const worldY = r * TILE_SIZE;
            this.addScorePopup(worldX, worldY, '200');
            this.eventBus.emit('coin-collected', {
              worldX,
              worldY,
              points: 200,
            });
          } else if (ch === 'F' || ch === 'G') {
            touchedFlagpoleCol = c;
          } else if (ch === 'L' || ch === 'l') {
            touchedLava = true;
          }
        }
      }
    }

    return {
      hitWallLeft,
      hitWallRight,
      hitCeiling,
      landedOnFloor,
      touchedFlagpoleCol,
      touchedLava,
    };
  }

  private handlePlayerHeadbuttBlock(
    col: number,
    row: number,
    tileChar: string,
    powerState: MarioPowerState
  ): void {
    const key = this.key(col, row);
    const payload = this.blockContents.get(key);
    const targetSubworldId = this.blockTargetSubworlds.get(key);
    const worldX = col * TILE_SIZE;
    const worldY = row * TILE_SIZE;

    if (tileChar === '?' || tileChar === 'H') {
      this.setTile(col, row, 'M'); // Convert to empty metal block
      this.triggerBumpAnimation(col, row);
      const resolvedPayload = payload ?? 'coin';
      if (resolvedPayload === 'coin') {
        this.eventBus.emit('coin-collected', {
          worldX,
          worldY: worldY - 16,
          points: 200,
          fromBlock: true,
        });
      }
      this.eventBus.emit('block-bumped', {
        col,
        row,
        tileChar,
        powerState,
        payload: resolvedPayload,
        targetSubworldId,
      });
      return;
    }

    if (tileChar === 'B') {
      // Check if this brick holds a special payload or multi-coin
      if (payload === 'multi-coin-10') {
        const rem = (this.multiCoinRemaining.get(key) ?? 1) - 1;
        this.multiCoinRemaining.set(key, rem);
        this.triggerBumpAnimation(col, row);
        this.eventBus.emit('coin-collected', {
          worldX,
          worldY: worldY - 16,
          points: 200,
          fromBlock: true,
        });
        this.eventBus.emit('block-bumped', {
          col,
          row,
          tileChar,
          powerState,
          payload: 'multi-coin-10',
        });
        if (rem <= 0) {
          this.setTile(col, row, 'M');
        }
        return;
      }

      if (payload) {
        this.setTile(col, row, 'M');
        this.triggerBumpAnimation(col, row);
        this.eventBus.emit('block-bumped', {
          col,
          row,
          tileChar,
          powerState,
          payload,
          targetSubworldId,
        });
        return;
      }

      // Standard empty brick: Small Mario bumps it; Super/Fire Mario shatters it into 4 fragments!
      if (powerState === 'small') {
        this.triggerBumpAnimation(col, row);
        this.eventBus.emit('block-bumped', {
          col,
          row,
          tileChar,
          powerState,
        });
      } else {
        this.setTile(col, row, '.');
        this.spawnBrickDebris(worldX, worldY);
        this.addScorePopup(worldX, worldY - 8, '50');
        this.eventBus.emit('brick-shattered', {
          col,
          row,
          worldX,
          worldY,
        });
      }
    }
  }

  private triggerBumpAnimation(col: number, row: number): void {
    this.activeBumps.set(this.key(col, row), {
      col,
      row,
      timer: 0,
      maxTimer: 10,
      offsetY: 0,
    });
  }

  private spawnBrickDebris(worldX: number, worldY: number): void {
    const fragments: Array<{ dx: number; dy: number; vx: number; vy: number }> = [
      { dx: 0, dy: 0, vx: -1.8, vy: -5.2 },
      { dx: 8, dy: 0, vx: 1.8, vy: -5.2 },
      { dx: 0, dy: 8, vx: -1.4, vy: -3.4 },
      { dx: 8, dy: 8, vx: 1.4, vy: -3.4 },
    ];
    for (const f of fragments) {
      this.debrisParticles.push({
        x: worldX + f.dx,
        y: worldY + f.dy,
        vx: f.vx,
        vy: f.vy,
        rotation: 0,
        lifeFrames: 45,
      });
    }
  }
}
