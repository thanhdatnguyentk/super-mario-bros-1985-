import { Entity } from '../../ecs/Entity.ts';
import {
  NES_PHYSICS,
  NES_HEIGHT,
  type FacingDirection,
} from '../../types/physics-constants.ts';
import { applyGravityAndClampSub } from '../../physics/SubPixelPhysics.ts';
import type { TileCollisionSolver } from '../../physics/TileCollisionSolver.ts';
import type { Camera } from '../../core/Camera.ts';
import type { EventBus } from '../../core/EventBus.ts';

/**
 * Fire Mario's bouncing Fireball projectile.
 * - Maximum 2 active fireballs allowed on screen simultaneously (authentic 1985 spec).
 * - Travels horizontally at ±4.0 px/frame, bounces on floors with -3.0 px/frame impulse,
 *   and explodes into a 3-frame starburst when hitting a vertical wall.
 */
export class Fireball extends Entity {
  public readonly direction: FacingDirection;
  public exploding = false;
  public explodeFrame = 0;
  public animTick = 0;
  private collisionSolver: TileCollisionSolver;
  private eventBus?: EventBus;

  constructor(
    xPx: number,
    yPx: number,
    direction: FacingDirection,
    collisionSolver: TileCollisionSolver,
    eventBus?: EventBus
  ) {
    super(xPx, yPx, 8, 8, {
      offsetX: 1,
      offsetY: 1,
      width: 6,
      height: 6,
    });
    this.direction = direction;
    this.vxSub = direction * NES_PHYSICS.FIREBALL_SPEED_X;
    this.vySub = NES_PHYSICS.FIREBALL_SPEED_X * 0.5;
    this.collisionSolver = collisionSolver;
    this.eventBus = eventBus;
  }

  public triggerExplosion(): void {
    if (this.exploding) return;
    this.exploding = true;
    this.explodeFrame = 0;
    this.vxSub = 0;
    this.vySub = 0;
    this.eventBus?.emit('fireball-exploded', {
      worldX: this.x,
      worldY: this.y,
    });
  }

  public update(): void {
    if (!this.alive) return;
    this.animTick++;

    if (this.exploding) {
      this.explodeFrame++;
      if (this.explodeFrame >= 9) {
        this.alive = false;
      }
      return;
    }

    this.vySub = applyGravityAndClampSub(
      this.vySub,
      NES_PHYSICS.FIREBALL_GRAVITY
    );

    const res = this.collisionSolver.moveAndCollideEntity(this);

    if (res.hitWallLeft || res.hitWallRight) {
      this.triggerExplosion();
      return;
    }

    if (res.landedOnFloor) {
      this.vySub = NES_PHYSICS.FIREBALL_BOUNCE_VY;
    }

    if (this.y > NES_HEIGHT + 16) {
      this.alive = false;
    }
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (!this.alive || !camera.isVisible(this.getAABB())) return;

    const sx = camera.worldToScreenX(this.x);
    const sy = camera.worldToScreenY(this.y);

    if (this.exploding) {
      const radius = 4 + Math.floor(this.explodeFrame / 3) * 2;
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(sx + 4 - radius, sy + 4 - radius, radius * 2, radius * 2);
      ctx.fillStyle = '#D82800';
      ctx.fillRect(
        sx + 4 - (radius - 2),
        sy + 4 - (radius - 2),
        (radius - 2) * 2,
        (radius - 2) * 2
      );
      return;
    }

    // 4-frame rotating 8×8 NES fireball pixel sprite
    const phase = Math.floor(this.animTick / 2) % 2;
    ctx.fillStyle = '#D82800';
    ctx.fillRect(sx + 1, sy + 1, 6, 6);
    ctx.fillStyle = '#FC9838';
    if (phase === 0) {
      ctx.fillRect(sx + 2, sy + 1, 4, 4);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(sx + 3, sy + 2, 2, 2);
    } else {
      ctx.fillRect(sx + 1, sy + 2, 4, 4);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(sx + 2, sy + 3, 2, 2);
    }
  }
}
