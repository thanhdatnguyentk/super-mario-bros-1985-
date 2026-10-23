/**
 * Super Mario Bros. (1985) — Authentic NES 6502 Sub-Pixel Physics Constants
 *
 * In the original 6502 assembly:
 * - 1 Tile  = 16 Pixels
 * - 1 Pixel = 16 Sub-pixels (0x10) = 256 Sub-sub-pixels (0x100)
 * Here we represent all positions and velocities in fixed-point 1/256th of a pixel
 * (`1 px = 256 units`) so every acceleration and gravity addition is 100% integer-exact.
 */

export const NES_WIDTH = 256;
export const NES_HEIGHT = 240;
export const TILE_SIZE = 16;
export const GRID_COLS = 16;
export const GRID_ROWS = 15;

/** Fixed-point scaling factor: 256 units = 1 pixel */
export const SUBPIXEL_SCALE = 256;

export const NES_PHYSICS = {
  // Horizontal Velocity Caps (in 1/256 px per frame @ 60 FPS)
  MAX_WALK_SPEED: 0x0190, // 400 / 256 = 1.5625 px/frame
  MAX_RUN_SPEED: 0x0290, // 656 / 256 = 2.5625 px/frame
  MAX_UNDERWATER_WALK_SPEED: 0x0110, // 272 / 256 = 1.0625 px/frame
  MAX_AIR_WALK_SPEED: 0x0190, // 1.5625 px/frame
  MAX_AIR_RUN_SPEED: 0x0290, // 2.5625 px/frame

  // Horizontal Acceleration (in 1/256 px per frame²)
  WALK_ACCEL: 0x0009, // 9 / 256 = 0.03515625 px/frame²
  RUN_ACCEL: 0x000e, // 14 / 256 = 0.0546875 px/frame²

  // Deceleration & Skidding
  RELEASE_DECEL: 0x000d, // 13 / 256 = 0.05078125 px/frame²
  SKID_DECEL: 0x001a, // 26 / 256 = 0.1015625 px/frame²
  /** Minimum speed below which skidding immediately snaps to turnaround */
  SKID_TURNAROUND_SPEED: 0x0090, // 144 / 256 = 0.5625 px/frame

  // Air Horizontal Control
  AIR_FORWARD_ACCEL_SLOW: 0x0009,
  AIR_FORWARD_ACCEL_FAST: 0x000e,
  AIR_BACKWARD_DECEL_FAST: 0x000d,
  AIR_BACKWARD_DECEL_SLOW: 0x0009,

  // Speed Thresholds for Variable Jump Brackets (in 1/256 px/frame)
  JUMP_BRACKET_1_THRESHOLD: 0x0100, // |vx| < 1.0 px/frame
  JUMP_BRACKET_2_THRESHOLD: 0x0250, // 1.0 <= |vx| < 2.3125 px/frame

  // Terminal Fall Speed
  MAX_FALL_SPEED: 0x0480, // 4.5 px/frame cap
  CLAMP_FALL_SPEED: 0x0400, // Clamped to 4.0 px/frame when exceeding cap

  // Bounce & Death Impulses
  STOMP_BOUNCE_VY: -0x0400, // -4.0 px/frame
  BLOCK_BUMP_VELOCITY: -0x0200,
  DEATH_JUMP_VY: -0x0480, // -4.5 px/frame
  DEATH_GRAVITY: 0x0028,

  // Underwater Physics
  SWIM_IMPULSE_VY: -0x0180, // -1.5 px/frame
  SWIM_HOLD_GRAVITY: 0x000d,
  SWIM_RELEASE_GRAVITY: 0x000a,

  // Fireball Physics
  FIREBALL_SPEED_X: 0x0400, // 4.0 px/frame
  FIREBALL_BOUNCE_VY: -0x0300, // -3.0 px/frame
  FIREBALL_GRAVITY: 0x0038,
  MAX_ACTIVE_FIREBALLS: 2,

  // Timers (in 60 FPS frames)
  STARMAN_DURATION_FRAMES: 720, // 12 seconds
  DAMAGE_IFRAMES: 180, // 3 seconds post-hit invulnerability
  TRANSFORM_DURATION_FRAMES: 48, // 0.8s power-up/power-down freeze
} as const;

export interface JumpPhysicsBracket {
  id: 'slow' | 'medium' | 'fast';
  /** Initial upward velocity when Jump (A) is pressed (negative = up, in 1/256 px/frame) */
  initialVySub: number;
  /** Gravity added per frame while Jump (A) is held AND vy < 0 */
  holdGravitySub: number;
  /** Gravity added per frame when Jump (A) is released OR vy >= 0 */
  fallGravitySub: number;
}

/**
 * Authentic 3-Tier NES Variable Jump Table:
 * Jumping while running faster gives BOTH a stronger upward impulse (-5.0 vs -4.0 px/frame)
 * and scaled gravity curves, allowing Mario to clear 4-tile high pipes and wide chasms.
 */
export const JUMP_BRACKETS: Record<'slow' | 'medium' | 'fast', JumpPhysicsBracket> = {
  slow: {
    id: 'slow',
    initialVySub: -0x0400, // -4.0 px/frame
    holdGravitySub: 0x0020, // 32 / 256 = 0.125 px/frame²
    fallGravitySub: 0x0070, // 112 / 256 = 0.4375 px/frame²
  },
  medium: {
    id: 'medium',
    initialVySub: -0x0400, // -4.0 px/frame
    holdGravitySub: 0x001e, // 30 / 256 = 0.1171875 px/frame²
    fallGravitySub: 0x0060, // 96 / 256 = 0.375 px/frame²
  },
  fast: {
    id: 'fast',
    initialVySub: -0x0500, // -5.0 px/frame
    holdGravitySub: 0x0028, // 40 / 256 = 0.15625 px/frame²
    fallGravitySub: 0x0090, // 144 / 256 = 0.5625 px/frame²
  },
};

export type MarioPowerState = 'small' | 'super' | 'fire';
export type FacingDirection = 1 | -1;
