import {
  SUBPIXEL_SCALE,
  NES_PHYSICS,
  JUMP_BRACKETS,
  type JumpPhysicsBracket,
} from '../types/physics-constants.ts';

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Convert pixels to 1/256 fixed-point sub-pixels */
export function pxToSub(px: number): number {
  return Math.round(px * SUBPIXEL_SCALE);
}

/** Convert 1/256 fixed-point sub-pixels to integer screen pixels (floor) */
export function subToPx(sub: number): number {
  return Math.floor(sub / SUBPIXEL_SCALE);
}

/** Convert 1/256 fixed-point sub-pixels to floating-point pixels */
export function subToFloatPx(sub: number): number {
  return sub / SUBPIXEL_SCALE;
}

/** Select the authentic NES Jump Physics Bracket based on absolute horizontal speed */
export function selectJumpBracket(absVxSub: number): JumpPhysicsBracket {
  if (absVxSub < NES_PHYSICS.JUMP_BRACKET_1_THRESHOLD) {
    return JUMP_BRACKETS.slow;
  }
  if (absVxSub < NES_PHYSICS.JUMP_BRACKET_2_THRESHOLD) {
    return JUMP_BRACKETS.medium;
  }
  return JUMP_BRACKETS.fast;
}

/** Clamp vertical falling velocity according to NES terminal velocity rules */
export function applyGravityAndClampSub(
  vySub: number,
  gravitySub: number
): number {
  const nextVy = vySub + gravitySub;
  if (nextVy > NES_PHYSICS.MAX_FALL_SPEED) {
    return NES_PHYSICS.CLAMP_FALL_SPEED;
  }
  return nextVy;
}

/** Standard Axis-Aligned Bounding Box (AABB) overlap check */
export function aabbIntersects(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Compute penetration depth between two intersecting AABBs.
 * Returns null if they do not overlap.
 */
export function computeAABBOverlap(
  mover: AABB,
  solid: AABB
): { overlapX: number; overlapY: number } | null {
  if (!aabbIntersects(mover, solid)) {
    return null;
  }
  const moverCenterX = mover.x + mover.width * 0.5;
  const solidCenterX = solid.x + solid.width * 0.5;
  const moverCenterY = mover.y + mover.height * 0.5;
  const solidCenterY = solid.y + solid.height * 0.5;

  const dx = moverCenterX - solidCenterX;
  const px = (mover.width + solid.width) * 0.5 - Math.abs(dx);

  const dy = moverCenterY - solidCenterY;
  const py = (mover.height + solid.height) * 0.5 - Math.abs(dy);

  return {
    overlapX: dx < 0 ? -px : px,
    overlapY: dy < 0 ? -py : py,
  };
}
