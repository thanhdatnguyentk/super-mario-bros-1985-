import {
  pxToSub,
  subToPx,
  subToFloatPx,
  type AABB,
} from '../physics/SubPixelPhysics.ts';
import type { Camera } from '../core/Camera.ts';

let nextEntityUid = 1;

export interface HitboxOffset {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

/**
 * Base Entity class with 1/256th fixed-point sub-pixel position & velocity
 * and Axis-Aligned Bounding Box (AABB) collision bounds.
 */
export abstract class Entity {
  public readonly uid: number;
  public xSub: number;
  public ySub: number;
  public vxSub = 0;
  public vySub = 0;
  public spriteWidth: number;
  public spriteHeight: number;
  public hitbox: HitboxOffset;
  public alive = true;
  public active = true;
  public grounded = false;

  constructor(
    xPx: number,
    yPx: number,
    spriteWidth: number,
    spriteHeight: number,
    hitbox?: HitboxOffset
  ) {
    this.uid = nextEntityUid++;
    this.xSub = pxToSub(xPx);
    this.ySub = pxToSub(yPx);
    this.spriteWidth = spriteWidth;
    this.spriteHeight = spriteHeight;
    this.hitbox = hitbox ?? {
      offsetX: 0,
      offsetY: 0,
      width: spriteWidth,
      height: spriteHeight,
    };
  }

  /** Integer pixel X (top-left of sprite) */
  public get x(): number {
    return subToPx(this.xSub);
  }

  public set x(px: number) {
    this.xSub = pxToSub(px);
  }

  /** Integer pixel Y (top-left of sprite) */
  public get y(): number {
    return subToPx(this.ySub);
  }

  public set y(px: number) {
    this.ySub = pxToSub(px);
  }

  /** Floating-point pixel velocity X (px/frame) */
  public get vx(): number {
    return subToFloatPx(this.vxSub);
  }

  /** Floating-point pixel velocity Y (px/frame) */
  public get vy(): number {
    return subToFloatPx(this.vySub);
  }

  /** World-space AABB used for tile and entity collision detection */
  public getAABB(): AABB {
    const pxX = subToFloatPx(this.xSub);
    const pxY = subToFloatPx(this.ySub);
    return {
      x: pxX + this.hitbox.offsetX,
      y: pxY + this.hitbox.offsetY,
      width: this.hitbox.width,
      height: this.hitbox.height,
    };
  }

  public abstract update(): void;
  public abstract render(ctx: CanvasRenderingContext2D, camera: Camera): void;
}
