import { Entity } from '../../ecs/Entity.ts';
import { NES_HEIGHT, type FacingDirection } from '../../types/physics-constants.ts';
import { pxToSub } from '../../physics/SubPixelPhysics.ts';
import type { Camera } from '../../core/Camera.ts';
import { drawEnemyProjectileSprite } from '../../rendering/PixelSpriteAtlas.ts';

export type EnemyProjectileKind = 'hammer' | 'bowser-fire';

/**
 * Projectile entity thrown/breathed by Hammer Bros and King Bowser:
 * - `'hammer'`: Arcs upward (`vy = -3.8 px/f`) and falls with gravity (`+0.18 px/f²`), passing through tiles.
 * - `'bowser-fire'`: 24×8 streaming flame breathed by Bowser; travels horizontally (`vx = -1.6 px/f`)
 *   while vertically homing toward `targetY` at `0.6 px/f`.
 */
export class EnemyProjectile extends Entity {
  public readonly kind: EnemyProjectileKind;
  public readonly facing: FacingDirection;
  public readonly targetY: number;
  public animFrame = 0;

  constructor(
    kind: EnemyProjectileKind,
    xPx: number,
    yPx: number,
    facing: FacingDirection,
    targetY = yPx
  ) {
    const w = kind === 'bowser-fire' ? 24 : 8;
    const h = kind === 'bowser-fire' ? 8 : 8;
    super(xPx, yPx, w, h, {
      offsetX: 1,
      offsetY: 1,
      width: w - 2,
      height: h - 2,
    });
    this.kind = kind;
    this.facing = facing;
    this.targetY = targetY;

    if (kind === 'hammer') {
      this.vxSub = facing * pxToSub(1.4);
      this.vySub = -pxToSub(3.8);
    } else {
      this.vxSub = facing * pxToSub(1.6);
      this.vySub = 0;
    }
  }

  public update(): void {
    if (!this.alive) return;
    this.animFrame++;

    if (this.kind === 'hammer') {
      this.xSub += this.vxSub;
      this.ySub += this.vySub;
      this.vySub += pxToSub(0.18);
      if (this.y > NES_HEIGHT + 24) {
        this.alive = false;
      }
      return;
    }

    // Bowser Fire Breath: horizontal movement + smooth vertical alignment to targetY
    this.xSub += this.vxSub;
    const currentY = this.y;
    if (Math.abs(currentY - this.targetY) > 1) {
      const dirY = this.targetY > currentY ? 1 : -1;
      this.ySub += dirY * pxToSub(0.6);
    }
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (!this.alive || !camera.isVisible(this.getAABB(), 24)) return;
    const sx = camera.worldToScreenX(this.x);
    const sy = camera.worldToScreenY(this.y);
    drawEnemyProjectileSprite(ctx, this.kind, sx, sy, this.animFrame);
  }
}
