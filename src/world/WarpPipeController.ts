import { TILE_SIZE } from '../types/physics-constants.ts';
import { pxToSub } from '../physics/SubPixelPhysics.ts';
import type { WarpPipePortal } from '../types/level-schema.ts';
import type { Mario } from '../entities/player/Mario.ts';
import type { InputManager } from '../core/InputManager.ts';
import type { EventBus } from '../core/EventBus.ts';
import type { TilemapLoader } from './TilemapLoader.ts';
import type { ItemManager } from '../entities/items/ItemManager.ts';

export type PipeCutscenePhase =
  | 'idle'
  | 'entering-down'
  | 'entering-right'
  | 'exiting-up'
  | 'exiting-right';

const PIPE_TRANSITION_FRAMES = 32;

/**
 * Orchestrates 100% authentic NES Super Mario Bros. (1985) Warp Pipe entries,
 * area/sub-world transitions, and pipe exit cutscenes.
 *
 *While `isActive()` is true:
 * - Standard Mario physics are suspended.
 * - Mario is rendered BEHIND foreground pipe tiles so he visibly slides inside/out of the pipe!
 */
export class WarpPipeController {
  public phase: PipeCutscenePhase = 'idle';
  public timerFrames = 0;
  public activePortal: WarpPipePortal | null = null;

  private tilemapLoader: TilemapLoader;
  private itemManager: ItemManager;
  private eventBus: EventBus;

  constructor(
    tilemapLoader: TilemapLoader,
    itemManager: ItemManager,
    eventBus: EventBus
  ) {
    this.tilemapLoader = tilemapLoader;
    this.itemManager = itemManager;
    this.eventBus = eventBus;
  }

  public isActive(): boolean {
    return this.phase !== 'idle';
  }

  public reset(): void {
    this.phase = 'idle';
    this.timerFrames = 0;
    this.activePortal = null;
  }

  /**
   * Check if Mario is triggering a downward or rightward Warp Pipe entry on this frame,
   * or advance an in-progress pipe transition cutscene.
   * Returns `true` if a pipe cutscene is active (so normal player physics should be skipped).
   */
  public update(mario: Mario, input: InputManager): boolean {
    if (!mario.alive) {
      this.reset();
      return false;
    }

    if (this.phase !== 'idle') {
      this.advanceCutsceneFrame(mario);
      return true;
    }

    const portals = this.tilemapLoader.activeArea.pipes;
    if (!portals || portals.length === 0) return false;

    const marioBox = mario.getAABB();
    const marioCenterX = marioBox.x + marioBox.width * 0.5;
    const marioBottomY = marioBox.y + marioBox.height;

    for (const portal of portals) {
      if (portal.enterDirection === 'down') {
        // Must be grounded on top of the pipe lip and holding Down
        if (!mario.grounded || !input.isHeld('down')) continue;

        const pipeLeftX = portal.enterCol * TILE_SIZE + 3;
        const pipeRightX = (portal.enterCol + 2) * TILE_SIZE - 3;
        const pipeTopY = portal.enterRow * TILE_SIZE;

        if (
          marioCenterX >= pipeLeftX &&
          marioCenterX <= pipeRightX &&
          Math.abs(marioBottomY - pipeTopY) <= 3
        ) {
          this.startPipeEntry(mario, portal, 'entering-down');
          return true;
        }
      } else if (portal.enterDirection === 'right') {
        // Must be grounded against the left mouth of a horizontal pipe and holding Right
        if (!mario.grounded || !input.isHeld('right')) continue;

        const pipeMouthX = portal.enterCol * TILE_SIZE;
        const pipeTopY = portal.enterRow * TILE_SIZE;
        const pipeBottomY = (portal.enterRow + 2) * TILE_SIZE;
        const marioRightX = marioBox.x + marioBox.width;

        if (
          Math.abs(marioRightX - pipeMouthX) <= 4 &&
          marioBottomY >= pipeTopY + 8 &&
          marioBottomY <= pipeBottomY + 4
        ) {
          this.startPipeEntry(mario, portal, 'entering-right');
          return true;
        }
      }
    }

    return false;
  }

  private startPipeEntry(
    mario: Mario,
    portal: WarpPipePortal,
    entryPhase: 'entering-down' | 'entering-right'
  ): void {
    this.phase = entryPhase;
    this.timerFrames = PIPE_TRANSITION_FRAMES;
    this.activePortal = portal;

    mario.vxSub = 0;
    mario.vySub = 0;
    mario.isSkidding = false;
    mario.isCrouching = false;
    mario.fireballs.length = 0;

    if (entryPhase === 'entering-down') {
      // Center Mario horizontally on the 32px-wide vertical pipe
      mario.x = portal.enterCol * TILE_SIZE + 8;
      mario.pose = 'idle';
    } else {
      mario.facing = 1;
      mario.pose = 'walk-1';
    }

    this.eventBus.emit('pipe-transition-started', {
      pipeId: portal.id,
      direction: portal.enterDirection,
      targetAreaId: portal.targetAreaId,
    });
  }

  private advanceCutsceneFrame(mario: Mario): void {
    const portal = this.activePortal;
    if (!portal) {
      this.reset();
      return;
    }

    if (this.phase === 'entering-down') {
      mario.ySub += pxToSub(1);
      this.timerFrames--;
      if (this.timerFrames <= 0) {
        this.executeAreaSwitch(mario, portal);
      }
      return;
    }

    if (this.phase === 'entering-right') {
      mario.xSub += pxToSub(1);
      const walkCycle = (Math.floor(this.timerFrames / 4) % 3) + 1;
      mario.pose = `walk-${walkCycle as 1 | 2 | 3}`;
      this.timerFrames--;
      if (this.timerFrames <= 0) {
        this.executeAreaSwitch(mario, portal);
      }
      return;
    }

    if (this.phase === 'exiting-up') {
      mario.ySub -= pxToSub(1);
      mario.pose = 'idle';
      this.timerFrames--;
      if (this.timerFrames <= 0) {
        mario.y = portal.exitRow * TILE_SIZE - mario.spriteHeight;
        mario.grounded = true;
        mario.vxSub = 0;
        mario.vySub = 0;
        const completedAreaId = this.tilemapLoader.activeArea.areaId;
        this.reset();
        this.eventBus.emit('pipe-transition-completed', {
          pipeId: portal.id,
          areaId: completedAreaId,
          exitCol: portal.exitCol,
          exitRow: portal.exitRow,
        });
      }
      return;
    }

    if (this.phase === 'exiting-right') {
      mario.xSub += pxToSub(1);
      const walkCycle = (Math.floor(this.timerFrames / 4) % 3) + 1;
      mario.pose = `walk-${walkCycle as 1 | 2 | 3}`;
      this.timerFrames--;
      if (this.timerFrames <= 0) {
        mario.grounded = true;
        mario.vxSub = 0;
        mario.vySub = 0;
        const completedAreaId = this.tilemapLoader.activeArea.areaId;
        this.reset();
        this.eventBus.emit('pipe-transition-completed', {
          pipeId: portal.id,
          areaId: completedAreaId,
          exitCol: portal.exitCol,
          exitRow: portal.exitRow,
        });
      }
    }
  }

  private executeAreaSwitch(mario: Mario, portal: WarpPipePortal): void {
    this.itemManager.clearAll();
    mario.fireballs.length = 0;

    if (portal.targetAreaId.startsWith('warp:')) {
      const requestedLevelId = portal.targetAreaId.slice('warp:'.length);
      this.reset();
      this.eventBus.emit('warp-zone-entered', {
        pipeId: portal.id,
        requestedLevelId,
        resolvedLevelId: requestedLevelId,
      });
      return;
    }

    this.tilemapLoader.switchArea(portal.targetAreaId, portal.exitCol);
    this.eventBus.emit('area-switched', {
      areaId: portal.targetAreaId,
      exitCol: portal.exitCol,
    });
    mario.underwaterMode =
      this.tilemapLoader.activeArea.biome === 'underwater';

    if (portal.exitDirection === 'drop-from-ceiling') {
      mario.x = portal.exitCol * TILE_SIZE;
      mario.y = portal.exitRow * TILE_SIZE;
      mario.vxSub = 0;
      mario.vySub = 0;
      mario.grounded = false;
      mario.pose = 'jump';
      const completedAreaId = this.tilemapLoader.activeArea.areaId;
      this.reset();
      this.eventBus.emit('pipe-transition-completed', {
        pipeId: portal.id,
        areaId: completedAreaId,
        exitCol: portal.exitCol,
        exitRow: portal.exitRow,
      });
      return;
    }

    if (portal.exitDirection === 'up') {
      const targetStandY = portal.exitRow * TILE_SIZE - mario.spriteHeight;
      mario.x = portal.exitCol * TILE_SIZE + 8;
      mario.y = targetStandY + PIPE_TRANSITION_FRAMES;
      mario.vxSub = 0;
      mario.vySub = 0;
      mario.grounded = false;
      mario.pose = 'idle';
      this.phase = 'exiting-up';
      this.timerFrames = PIPE_TRANSITION_FRAMES;
      return;
    }

    if (portal.exitDirection === 'right') {
      mario.x = (portal.exitCol + 1) * TILE_SIZE - PIPE_TRANSITION_FRAMES;
      mario.y = (portal.exitRow + 2) * TILE_SIZE - mario.spriteHeight;
      mario.vxSub = 0;
      mario.vySub = 0;
      mario.facing = 1;
      this.phase = 'exiting-right';
      this.timerFrames = PIPE_TRANSITION_FRAMES;
    }
  }
}
