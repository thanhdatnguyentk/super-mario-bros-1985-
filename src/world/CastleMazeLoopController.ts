import { TILE_SIZE } from '../types/physics-constants.ts';
import { pxToSub } from '../physics/SubPixelPhysics.ts';
import type { CastleMazeCheckpoint } from '../types/level-schema.ts';
import type { Mario } from '../entities/player/Mario.ts';
import type { Camera } from '../core/Camera.ts';
import type { EventBus } from '../core/EventBus.ts';

/**
 * Implements the authentic 1985 NES Looping Castle Maze Engine for World 4-4, World 7-4, and World 8-4.
 *
 * How it works:
 * - Each `CastleMazeCheckpoint` defines a horizontal column trigger `checkCol`, a required vertical row window
 *   `[validRowMin, validRowMax]`, and a loop-back column `rewindToCol`.
 * - When Mario crosses `checkCol` moving rightward:
 *   - If Mario's vertical tile row is inside `[validRowMin, validRowMax]`, the checkpoint is marked as passed
 *     (`passedCheckpoints.add(checkCol)`) and Mario advances toward the next section / Bowser.
 *   - If Mario's vertical tile row is OUTSIDE `[validRowMin, validRowMax]` (wrong corridor!), both `mario.xSub`
 *     and `camera.x` seamlessly rewind by `(checkCol - rewindToCol) * TILE_SIZE` pixels so the castle corridor
 *     loops endlessly until the player chooses the correct route!
 */
export class CastleMazeLoopController {
  public checkpoints: CastleMazeCheckpoint[] = [];
  public readonly passedCheckpoints = new Set<number>();
  public loopRewindCount = 0;

  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public loadCheckpoints(checkpoints: CastleMazeCheckpoint[] = []): void {
    this.checkpoints = [...checkpoints];
    this.passedCheckpoints.clear();
    this.loopRewindCount = 0;
  }

  public update(mario: Mario, camera: Camera): void {
    if (!mario.alive || this.checkpoints.length === 0) return;

    const marioCol = Math.floor((mario.x + 8) / TILE_SIZE);
    const marioFootRow = Math.floor(
      (mario.y + mario.spriteHeight - 4) / TILE_SIZE
    );

    for (const cp of this.checkpoints) {
      if (this.passedCheckpoints.has(cp.checkCol)) continue;

      if (marioCol >= cp.checkCol) {
        const isCorrectPath =
          marioFootRow >= cp.validRowMin && marioFootRow <= cp.validRowMax;

        if (isCorrectPath) {
          this.passedCheckpoints.add(cp.checkCol);
          this.eventBus.emit('maze-checkpoint-result', {
            checkCol: cp.checkCol,
            passed: true,
          });
        } else {
          // Wrong corridor -> seamless horizontal nametable rewind to `rewindToCol`!
          const deltaCols = Math.max(1, cp.checkCol - cp.rewindToCol);
          const deltaPx = deltaCols * TILE_SIZE;
          mario.xSub -= pxToSub(deltaPx);
          camera.forceSetX(Math.max(0, camera.x - deltaPx));
          this.loopRewindCount++;

          this.eventBus.emit('maze-checkpoint-result', {
            checkCol: cp.checkCol,
            passed: false,
            rewoundToCol: cp.rewindToCol,
          });
        }
        break;
      }
    }
  }
}
