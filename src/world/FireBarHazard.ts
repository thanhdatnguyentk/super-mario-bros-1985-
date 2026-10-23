import { TILE_SIZE } from '../types/physics-constants.ts';
import { aabbIntersects, type AABB } from '../physics/SubPixelPhysics.ts';
import type { FireBarSpawn } from '../types/level-schema.ts';
import type { Mario } from '../entities/player/Mario.ts';
import type { Camera } from '../core/Camera.ts';

/**
 * Rotating Castle Fire-Bar Hazard (`FireBarSpawn`).
 *
 * Authentic 1985 Mechanics:
 * - Pivot anchored at the center of tile `(col, row)`: `(col * 16 + 8, row * 16 + 8)`.
 * - Consists of `lengthBalls` (6 or 12) 8×8 fireball nodes spaced 8px apart along radius `r = i * 8`.
 * - Rotates continuously at `angularVelocityDegPerFrame` (clockwise or counter-clockwise).
 * - Damages Mario if any fireball node (from index 1 outward) intersects Mario's AABB.
 */
export class FireBarHazard {
  public readonly col: number;
  public readonly row: number;
  public readonly pivotX: number;
  public readonly pivotY: number;
  public readonly lengthBalls: 6 | 12;
  public readonly clockwise: boolean;
  public readonly angularVelocityDegPerFrame: number;

  public angleDeg: number;
  public animFrame = 0;

  constructor(spawn: FireBarSpawn) {
    this.col = spawn.col;
    this.row = spawn.row;
    this.pivotX = spawn.col * TILE_SIZE + 8;
    this.pivotY = spawn.row * TILE_SIZE + 8;
    this.lengthBalls = spawn.lengthBalls;
    this.clockwise = spawn.clockwise;
    this.angleDeg = spawn.initialAngleDeg;
    this.angularVelocityDegPerFrame = spawn.angularVelocityDegPerFrame;
  }

  public update(mario: Mario): void {
    this.animFrame++;
    const dir = this.clockwise ? 1 : -1;
    this.angleDeg =
      (this.angleDeg + dir * this.angularVelocityDegPerFrame + 360) % 360;

    if (!mario.alive) return;

    const marioBox = mario.getAABB();
    const rad = (this.angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    for (let i = 1; i < this.lengthBalls; i++) {
      const dist = i * 8;
      const bx = this.pivotX + cos * dist - 3;
      const by = this.pivotY + sin * dist - 3;
      const ballBox: AABB = { x: bx, y: by, width: 6, height: 6 };
      if (aabbIntersects(marioBox, ballBox)) {
        mario.takeDamage();
        break;
      }
    }
  }

  public getBallPosition(index: number): { x: number; y: number } {
    const rad = (this.angleDeg * Math.PI) / 180;
    const dist = index * 8;
    return {
      x: this.pivotX + Math.cos(rad) * dist,
      y: this.pivotY + Math.sin(rad) * dist,
    };
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const rad = (this.angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const flash = Math.floor(this.animFrame / 3) % 2 === 0;

    for (let i = 0; i < this.lengthBalls; i++) {
      const dist = i * 8;
      const wx = this.pivotX + cos * dist - 4;
      const wy = this.pivotY + sin * dist - 4;
      const sx = Math.round(camera.worldToScreenX(wx));
      const sy = Math.round(camera.worldToScreenY(wy));

      ctx.fillStyle = flash ? '#D82800' : '#FC9838';
      ctx.fillRect(sx + 1, sy + 1, 6, 6);
      ctx.fillStyle = flash ? '#FC9838' : '#FCFCFC';
      ctx.fillRect(sx + 2, sy + 2, 4, 4);
    }
  }
}
