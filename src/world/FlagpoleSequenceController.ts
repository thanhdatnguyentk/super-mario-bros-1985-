import { TILE_SIZE } from '../types/physics-constants.ts';
import type { EventBus } from '../core/EventBus.ts';
import type { Mario } from '../entities/player/Mario.ts';
import type { Camera } from '../core/Camera.ts';

export type FlagpoleSequencePhase =
  | 'idle'
  | 'sliding-down'
  | 'flip-at-base'
  | 'walking-to-castle'
  | 'time-tally'
  | 'fireworks'
  | 'completed';

export interface FireworkBurst {
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
}

/**
 * Orchestrates the complete 1985 NES Flagpole End-of-Level Sequence:
 * 1. `sliding-down`: Both Mario and the Flagpole Banner slide down to row 12 (176px).
 * 2. `flip-at-base`: Mario flips to the right side of the pole for 12 frames.
 * 3. `walking-to-castle`: Mario walks automatically into the castle doorway (`castleDoorCol`), then hides inside.
 * 4. `time-tally`: Rapidly counts `timeRemaining` down to 0 (`+50` pts per remaining second) while raising the Castle Star Flag.
 * 5. `fireworks`: Launches **1, 3, or 6 Fireworks** (`+500` pts each) if the last digit of `timeRemaining` when touching the flagpole was `1`, `3`, or `6`!
 */
export class FlagpoleSequenceController {
  public phase: FlagpoleSequencePhase = 'idle';
  public flagBannerY = 48;
  public castleStarFlagRisePx = 0;
  public fireworksRemaining = 0;
  public fireworksLaunched = 0;
  public readonly activeFireworks: FireworkBurst[] = [];

  private flagpoleCol = 198;
  private castleDoorCol = 204;
  private phaseTimer = 0;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public reset(flagpoleCol = 198, castleDoorCol = 204): void {
    this.phase = 'idle';
    this.flagBannerY = 48;
    this.castleStarFlagRisePx = 0;
    this.fireworksRemaining = 0;
    this.fireworksLaunched = 0;
    this.activeFireworks.length = 0;
    this.flagpoleCol = flagpoleCol;
    this.castleDoorCol = castleDoorCol;
    this.phaseTimer = 0;
  }

  /**
   * Determine 1, 3, or 6 fireworks from the last digit of the timer at flagpole touch.
   */
  public static computeFireworksCount(timeAtFlagpoleTouch: number): 0 | 1 | 3 | 6 {
    const lastDigit = Math.max(0, Math.floor(timeAtFlagpoleTouch)) % 10;
    if (lastDigit === 1) return 1;
    if (lastDigit === 3) return 3;
    if (lastDigit === 6) return 6;
    return 0;
  }

  public startSequence(
    flagpoleCol: number,
    castleDoorCol: number,
    timeAtTouch: number
  ): void {
    if (this.phase !== 'idle') return;
    this.flagpoleCol = flagpoleCol;
    this.castleDoorCol = castleDoorCol;
    this.phase = 'sliding-down';
    this.flagBannerY = 48;
    this.castleStarFlagRisePx = 0;
    this.fireworksRemaining =
      FlagpoleSequenceController.computeFireworksCount(timeAtTouch);
    this.fireworksLaunched = 0;
    this.activeFireworks.length = 0;
  }

  public update(
    mario: Mario,
    levelId: string,
    callbacks: {
      getTimeRemaining: () => number;
      decrementTimeAndAddScore: (timeDelta: number, scoreDelta: number) => void;
    }
  ): void {
    // Update active firework bursts
    for (let i = this.activeFireworks.length - 1; i >= 0; i--) {
      const fw = this.activeFireworks[i];
      fw.timer++;
      if (fw.timer >= fw.maxTimer) {
        this.activeFireworks.splice(i, 1);
      }
    }

    if (this.phase === 'idle' || this.phase === 'completed') {
      if (this.phase === 'idle' && mario.flagpoleSliding) {
        this.startSequence(
          mario.flagpoleCol || this.flagpoleCol,
          this.castleDoorCol,
          callbacks.getTimeRemaining()
        );
      }
      return;
    }

    if (this.phase === 'sliding-down') {
      this.flagBannerY = Math.min(168, this.flagBannerY + 2);
      if (mario.grounded && this.flagBannerY >= 168) {
        this.phase = 'flip-at-base';
        this.phaseTimer = 12;
        mario.x = this.flagpoleCol * TILE_SIZE + 8;
        mario.facing = -1;
        mario.pose = 'climb-1';
      }
      return;
    }

    if (this.phase === 'flip-at-base') {
      this.phaseTimer--;
      if (this.phaseTimer <= 0) {
        this.phase = 'walking-to-castle';
        mario.facing = 1;
      }
      return;
    }

    if (this.phase === 'walking-to-castle') {
      const doorX = this.castleDoorCol * TILE_SIZE;
      if (mario.x >= doorX) {
        mario.x = doorX;
        mario.vxSub = 0;
        mario.hiddenInCastle = true;
        this.phase = 'time-tally';
      }
      return;
    }

    if (this.phase === 'time-tally') {
      this.castleStarFlagRisePx = Math.min(18, this.castleStarFlagRisePx + 1);
      const rem = callbacks.getTimeRemaining();
      if (rem > 0) {
        const step = Math.min(rem, 2);
        callbacks.decrementTimeAndAddScore(step, step * 50);
      } else if (this.castleStarFlagRisePx >= 18) {
        if (this.fireworksRemaining > 0) {
          this.phase = 'fireworks';
          this.phaseTimer = 8;
        } else {
          this.phase = 'completed';
          this.eventBus.emit('stage-cleared', {
            levelId,
            fireworksLaunched: 0,
          });
        }
      }
      return;
    }

    if (this.phase === 'fireworks') {
      this.phaseTimer--;
      if (this.phaseTimer <= 0) {
        if (this.fireworksRemaining > 0) {
          const offsets = [
            { dx: -16, dy: -48 },
            { dx: 32, dy: -64 },
            { dx: 0, dy: -72 },
            { dx: -24, dy: -56 },
            { dx: 24, dy: -44 },
            { dx: 8, dy: -68 },
          ];
          const idx = this.fireworksLaunched % offsets.length;
          const baseCastleX = (this.flagpoleCol + 6) * TILE_SIZE;
          const fwX = baseCastleX + offsets[idx].dx;
          const fwY = 112 + offsets[idx].dy;

          this.activeFireworks.push({
            x: fwX,
            y: fwY,
            timer: 0,
            maxTimer: 18,
          });
          this.fireworksRemaining--;
          this.fireworksLaunched++;
          this.phaseTimer = 20;

          callbacks.decrementTimeAndAddScore(0, 500);
          this.eventBus.emit('firework-exploded', {
            worldX: fwX,
            worldY: fwY,
            points: 500,
          });
        } else if (this.activeFireworks.length === 0) {
          this.phase = 'completed';
          this.eventBus.emit('stage-cleared', {
            levelId,
            fireworksLaunched: this.fireworksLaunched,
          });
        }
      }
    }
  }

  public renderEffects(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // 1. Render Rising Castle Star Flag above the castle battlements
    if (this.castleStarFlagRisePx > 0) {
      const castleCenterX = camera.worldToScreenX(
        (this.flagpoleCol + 6) * TILE_SIZE
      );
      const flagTopY = 128 - this.castleStarFlagRisePx;
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(castleCenterX + 7, flagTopY, 2, this.castleStarFlagRisePx);
      ctx.fillStyle = '#D82800';
      ctx.fillRect(castleCenterX + 9, flagTopY, 10, 8);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(castleCenterX + 12, flagTopY + 2, 4, 4);
    }

    // 2. Render 8-bit Firework Starbursts
    for (const fw of this.activeFireworks) {
      const sx = Math.round(camera.worldToScreenX(fw.x));
      const sy = Math.round(camera.worldToScreenY(fw.y));
      const radius = 4 + Math.floor((fw.timer / fw.maxTimer) * 12);
      const colors = ['#FC9838', '#D82800', '#FCFCFC', '#80D010'];
      ctx.fillStyle = colors[fw.timer % colors.length];

      const rays = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: -0.7, dy: -0.7 },
        { dx: 0.7, dy: -0.7 },
        { dx: -0.7, dy: 0.7 },
        { dx: 0.7, dy: 0.7 },
      ];
      for (const r of rays) {
        ctx.fillRect(
          Math.round(sx + r.dx * radius),
          Math.round(sy + r.dy * radius),
          3,
          3
        );
      }
    }
  }
}
