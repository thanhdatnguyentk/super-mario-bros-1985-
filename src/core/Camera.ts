import { NES_WIDTH, NES_HEIGHT, TILE_SIZE } from '../types/physics-constants.ts';
import type { AABB } from '../physics/SubPixelPhysics.ts';

/**
 * Authentic NES Super Mario Bros. One-Way Horizontal Scrolling Camera.
 *
 * Rules:
 * 1. Viewport is 256×240 px.
 * 2. When Mario's X position exceeds `camera.x + scrollLeadOffset` (112 px, just left of center),
 *    the camera advances right to match `marioX - 112`.
 * 3. The camera NEVER scrolls left (`camera.x = Math.max(camera.x, candidateX)`),
 *    except when explicitly reset or rewound by a Castle Maze Loop gate (4-4, 7-4, 8-4).
 * 4. Mario's left bounding edge is hard-clamped to `camera.x` so he can never walk off the left edge.
 */
export class Camera {
  public x = 0;
  public y = 0;
  public readonly width = NES_WIDTH;
  public readonly height = NES_HEIGHT;
  public readonly scrollTriggerOffsetX = 112;
  private maxScrollX = 0;

  constructor(levelWidthCols = 16) {
    this.setLevelWidthCols(levelWidthCols);
  }

  public setLevelWidthCols(widthCols: number): void {
    const totalWidthPx = widthCols * TILE_SIZE;
    this.maxScrollX = Math.max(0, totalWidthPx - this.width);
  }

  /**
   * Advance camera rightward based on Mario's pixel X coordinate.
   * Never moves backward to the left.
   */
  public followTargetRightOnly(targetPxX: number): void {
    const desiredX = targetPxX - this.scrollTriggerOffsetX;
    if (desiredX > this.x) {
      this.x = Math.min(this.maxScrollX, desiredX);
    }
  }

  /**
   * Force-set camera X (used on level start, sub-world transition, or Castle Maze Loop rewind).
   */
  public forceSetX(newX: number): void {
    this.x = Math.max(0, Math.min(this.maxScrollX, newX));
  }

  public getMaxScrollX(): number {
    return this.maxScrollX;
  }

  /** Convert world X coordinate to screen X coordinate */
  public worldToScreenX(worldX: number): number {
    return Math.round(worldX - this.x);
  }

  /** Convert world Y coordinate to screen Y coordinate */
  public worldToScreenY(worldY: number): number {
    return Math.round(worldY - this.y);
  }

  /** Check whether a world-space AABB is visible inside the 256×240 viewport (with margin) */
  public isVisible(bounds: AABB, marginPx = 32): boolean {
    return (
      bounds.x + bounds.width >= this.x - marginPx &&
      bounds.x <= this.x + this.width + marginPx &&
      bounds.y + bounds.height >= this.y - marginPx &&
      bounds.y <= this.y + this.height + marginPx
    );
  }
}
