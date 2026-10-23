import { TILE_SIZE } from '../../types/physics-constants.ts';
import type { Camera } from '../../core/Camera.ts';
import { drawSpinningCoinSprite } from '../../rendering/PixelSpriteAtlas.ts';

/**
 * Spinning Coin visual entity launched upward when Mario bumps a Question Block ('?')
 * containing a coin or a Multi-Coin Brick Block ('B').
 *
 * Authentic 1985 trajectory:
 * - Starts 12px above the block top, shoots upward at -4.8 px/frame with +0.30 px/frame² gravity.
 * - Spins through 4 animation frames.
 * - Upon descending back to its starting height, despawns and triggers the "200" floating score popup.
 */
export class SpinningCoinEffect {
  public x: number;
  public y: number;
  public readonly startY: number;
  public vy = -4.8;
  public readonly gravity = 0.3;
  public animFrame = 0;
  public alive = true;
  private onCompletePopup?: (x: number, y: number) => void;

  constructor(
    col: number,
    row: number,
    onCompletePopup?: (x: number, y: number) => void
  ) {
    this.x = col * TILE_SIZE + 4;
    this.startY = row * TILE_SIZE - 12;
    this.y = this.startY;
    this.onCompletePopup = onCompletePopup;
  }

  public update(): void {
    if (!this.alive) return;
    this.animFrame++;
    this.y += this.vy;
    this.vy += this.gravity;

    if (this.vy > 0 && this.y >= this.startY - 2) {
      this.alive = false;
      this.onCompletePopup?.(this.x - 4, this.y - 8);
    }
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (!this.alive) return;
    const sx = camera.worldToScreenX(this.x);
    const sy = camera.worldToScreenY(this.y);
    drawSpinningCoinSprite(ctx, sx, sy, this.animFrame);
  }
}
