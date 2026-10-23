import { Entity } from '../../ecs/Entity.ts';
import {
  NES_PHYSICS,
  NES_HEIGHT,
  TILE_SIZE,
  type MarioPowerState,
  type FacingDirection,
  type JumpPhysicsBracket,
} from '../../types/physics-constants.ts';
import {
  pxToSub,
  selectJumpBracket,
  applyGravityAndClampSub,
} from '../../physics/SubPixelPhysics.ts';
import type { InputManager } from '../../core/InputManager.ts';
import type { TileCollisionSolver } from '../../physics/TileCollisionSolver.ts';
import type { EventBus } from '../../core/EventBus.ts';
import type { Camera } from '../../core/Camera.ts';
import { Fireball } from './Fireball.ts';
import { drawMarioSprite } from '../../rendering/PixelSpriteAtlas.ts';

export type MarioPose =
  | 'idle'
  | 'walk-1'
  | 'walk-2'
  | 'walk-3'
  | 'skid'
  | 'jump'
  | 'crouch'
  | 'throw'
  | 'climb-1'
  | 'climb-2'
  | 'swim-1'
  | 'swim-2'
  | 'dead';

/**
 * 100% Authentic NES Super Mario Bros. (1985) Player Entity.
 *
 * Implements:
 * - Fixed-point 1/256th sub-pixel horizontal acceleration (Walk vs. Run with B held)
 * - Release deceleration and Skid turnaround deceleration with dust frames
 * - 3-Bracket Variable Jump Height (`slow`, `medium`, `fast` based on |vx| at takeoff + hold A gravity vs fall gravity)
 * - 3 Power States: `small` (16×16), `super` (16×32), `fire` (16×32 + max 2 Fireballs on screen)
 * - Crouching hitbox reduction (16×16 while holding Down as Super/Fire)
 * - Starman invulnerability (720 frames) and Post-Damage invincibility blinking (180 frames)
 * - Underwater swimming physics when `underwaterMode` is active
 */
export class Mario extends Entity {
  public powerState: MarioPowerState = 'small';
  public facing: FacingDirection = 1;
  public pose: MarioPose = 'idle';
  public isSkidding = false;
  public isCrouching = false;
  public isSwimming = false;
  public underwaterMode = false;

  // Variable Jump State
  public currentJumpBracket: JumpPhysicsBracket = selectJumpBracket(0);
  public jumpButtonHeld = false;

  // Invincibility & Transformation Timers (in 60 FPS frames)
  public starmanTimer = 0;
  public damageIframeTimer = 0;
  public transformTimer = 0;
  public fireThrowPoseTimer = 0;

  // Flagpole & Death Sequence State
  public flagpoleSliding = false;
  public flagpoleCol = 0;
  public deathTimer = 0;

  // Animation accumulators
  private walkAnimSubCounter = 0;
  private walkFrameIndex = 0;

  // Active Fireballs (strictly capped at 2 on screen per 1985 spec)
  public readonly fireballs: Fireball[] = [];

  private input: InputManager;
  private collisionSolver: TileCollisionSolver;
  private eventBus: EventBus;

  constructor(
    xPx: number,
    yPx: number,
    input: InputManager,
    collisionSolver: TileCollisionSolver,
    eventBus: EventBus
  ) {
    super(xPx, yPx, 16, 16, {
      offsetX: 2,
      offsetY: 2,
      width: 12,
      height: 14,
    });
    this.input = input;
    this.collisionSolver = collisionSolver;
    this.eventBus = eventBus;
    const box = this.getAABB();
    this.grounded =
      this.collisionSolver.isSolidAtPixel(box.x + 1, box.y + box.height) ||
      this.collisionSolver.isSolidAtPixel(
        box.x + box.width - 1,
        box.y + box.height
      );
  }

  /**
   * Switch between Small (16×16), Super (16×32), and Fire (16×32) states,
   * preserving bottom foot alignment so Mario never clips into the ground.
   */
  public setPowerState(
    nextState: MarioPowerState,
    withTransformFreeze = false
  ): void {
    const prev = this.powerState;
    if (prev === nextState) return;

    const wasTall = prev === 'super' || prev === 'fire';
    const willBeTall = nextState === 'super' || nextState === 'fire';

    // Keep feet at the exact same Y coordinate when changing height between 16px and 32px
    if (!wasTall && willBeTall) {
      this.ySub -= pxToSub(16);
    } else if (wasTall && !willBeTall) {
      this.ySub += pxToSub(16);
    }

    this.powerState = nextState;
    this.isCrouching = false;
    this.syncHitboxForCurrentState();

    if (withTransformFreeze) {
      this.transformTimer = NES_PHYSICS.TRANSFORM_DURATION_FRAMES;
    }

    this.eventBus.emit('powerup-changed', {
      previous: prev,
      current: nextState,
    });
  }

  public activateStarman(): void {
    this.starmanTimer = NES_PHYSICS.STARMAN_DURATION_FRAMES;
  }

  public takeDamage(): void {
    if (!this.alive || this.starmanTimer > 0 || this.damageIframeTimer > 0) {
      return;
    }

    if (this.powerState === 'fire' || this.powerState === 'super') {
      const from = this.powerState;
      this.setPowerState('small', true);
      this.damageIframeTimer = NES_PHYSICS.DAMAGE_IFRAMES;
      this.eventBus.emit('player-damaged', { fromState: from });
    } else {
      this.killPlayer('enemy');
    }
  }

  public killPlayer(reason: 'pit' | 'lava' | 'enemy' | 'time-up'): void {
    if (!this.alive) return;
    this.alive = false;
    this.pose = 'dead';
    this.vxSub = 0;
    this.vySub = NES_PHYSICS.DEATH_JUMP_VY;
    this.deathTimer = 16; // 16-frame freeze before leaping upward
    this.eventBus.emit('player-died', { reason });
  }

  private syncHitboxForCurrentState(): void {
    const isTall = this.powerState === 'super' || this.powerState === 'fire';
    if (!isTall) {
      this.spriteWidth = 16;
      this.spriteHeight = 16;
      this.hitbox = {
        offsetX: 2,
        offsetY: 2,
        width: 12,
        height: 14,
      };
    } else if (this.isCrouching) {
      this.spriteWidth = 16;
      this.spriteHeight = 32;
      this.hitbox = {
        offsetX: 2,
        offsetY: 16,
        width: 12,
        height: 16,
      };
    } else {
      this.spriteWidth = 16;
      this.spriteHeight = 32;
      this.hitbox = {
        offsetX: 2,
        offsetY: 4,
        width: 12,
        height: 28,
      };
    }
  }

  public update(minLeftWorldX = 0, camera?: Camera): void {
    // Update active fireballs and prune despawned/offscreen ones
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.update();
      if (camera && !camera.isVisible(fb.getAABB(), 16)) {
        fb.alive = false;
      }
      if (!fb.alive) {
        this.fireballs.splice(i, 1);
      }
    }

    // Handle Death Sequence
    if (!this.alive) {
      if (this.deathTimer > 0) {
        this.deathTimer--;
      } else {
        this.ySub += this.vySub;
        this.vySub = Math.min(
          NES_PHYSICS.MAX_FALL_SPEED,
          this.vySub + NES_PHYSICS.DEATH_GRAVITY
        );
      }
      return;
    }

    // Decrement timers
    if (this.starmanTimer > 0) this.starmanTimer--;
    if (this.damageIframeTimer > 0) this.damageIframeTimer--;
    if (this.fireThrowPoseTimer > 0) this.fireThrowPoseTimer--;

    if (this.transformTimer > 0) {
      this.transformTimer--;
      return;
    }

    // Handle Flagpole Slide Sequence
    if (this.flagpoleSliding) {
      this.updateFlagpoleSlide(minLeftWorldX);
      return;
    }

    // 1. Crouch handling (Super / Fire only)
    const isTall = this.powerState === 'super' || this.powerState === 'fire';
    if (isTall && this.grounded) {
      const wantCrouch =
        this.input.isHeld('down') &&
        !this.input.isHeld('left') &&
        !this.input.isHeld('right');
      if (wantCrouch !== this.isCrouching) {
        this.isCrouching = wantCrouch;
        this.syncHitboxForCurrentState();
      }
    } else if (!isTall) {
      this.isCrouching = false;
    }

    // 2. Fireball Shooting (Button B just pressed while in Fire state, max 2 on screen)
    if (
      this.powerState === 'fire' &&
      !this.isCrouching &&
      this.input.isJustPressed('runB') &&
      this.fireballs.length < NES_PHYSICS.MAX_ACTIVE_FIREBALLS
    ) {
      this.spawnFireball();
    }

    // 3. Horizontal Sub-Pixel Physics (Walk, Run, Skid, Friction)
    this.updateHorizontalSubPixelPhysics();

    // 4. Vertical Sub-Pixel Physics (Variable Jump / Underwater Swim / Gravity)
    this.updateVerticalSubPixelPhysics();

    // 5. Move & Solve Tile Collisions (with one-way camera left wall clamp)
    const colResult = this.collisionSolver.moveAndCollideEntity(this, {
      isPlayer: true,
      powerState: this.powerState,
      minLeftWorldX,
    });

    if (colResult.touchedFlagpoleCol !== null && !this.flagpoleSliding) {
      this.startFlagpoleSlide(colResult.touchedFlagpoleCol);
      return;
    }

    if (colResult.touchedLava || this.y > NES_HEIGHT + 16) {
      this.killPlayer(colResult.touchedLava ? 'lava' : 'pit');
      return;
    }

    // 6. Update Sprite Pose & Walk Cycle Cadence
    this.updateAnimationPose();
  }

  private updateHorizontalSubPixelPhysics(): void {
    const left = this.input.isHeld('left');
    const right = this.input.isHeld('right');
    const runHeld = this.input.isHeld('runB') && !this.underwaterMode;

    const dirInput: -1 | 0 | 1 =
      right && !left && !this.isCrouching
        ? 1
        : left && !right && !this.isCrouching
        ? -1
        : 0;

    if (this.grounded) {
      this.isSkidding = false;

      if (dirInput !== 0) {
        const movingOpposite =
          (dirInput === 1 && this.vxSub < 0) ||
          (dirInput === -1 && this.vxSub > 0);

        if (movingOpposite) {
          // Skidding (holding opposite direction while moving)
          const absVx = Math.abs(this.vxSub);
          if (absVx <= NES_PHYSICS.SKID_TURNAROUND_SPEED) {
            this.vxSub = 0;
            this.facing = dirInput;
          } else {
            this.isSkidding = true;
            this.facing = dirInput;
            if (this.vxSub > 0) {
              this.vxSub = Math.max(0, this.vxSub - NES_PHYSICS.SKID_DECEL);
            } else {
              this.vxSub = Math.min(0, this.vxSub + NES_PHYSICS.SKID_DECEL);
            }
          }
        } else {
          // Accelerating in facing direction
          this.facing = dirInput;
          const maxSpeed = this.underwaterMode
            ? NES_PHYSICS.MAX_UNDERWATER_WALK_SPEED
            : runHeld
            ? NES_PHYSICS.MAX_RUN_SPEED
            : NES_PHYSICS.MAX_WALK_SPEED;
          const accel = runHeld
            ? NES_PHYSICS.RUN_ACCEL
            : NES_PHYSICS.WALK_ACCEL;

          const absVx = Math.abs(this.vxSub);
          if (absVx < maxSpeed) {
            const nextAbs = Math.min(maxSpeed, absVx + accel);
            this.vxSub = dirInput * nextAbs;
          } else if (absVx > maxSpeed) {
            // Smoothly coast down when releasing B from Run speed back to Walk speed
            const nextAbs = Math.max(
              maxSpeed,
              absVx - NES_PHYSICS.RELEASE_DECEL
            );
            this.vxSub = dirInput * nextAbs;
          }
        }
      } else {
        // No horizontal directional input (or crouching slide): apply ground release deceleration
        if (this.vxSub > 0) {
          this.vxSub = Math.max(0, this.vxSub - NES_PHYSICS.RELEASE_DECEL);
        } else if (this.vxSub < 0) {
          this.vxSub = Math.min(0, this.vxSub + NES_PHYSICS.RELEASE_DECEL);
        }
      }
    } else {
      // Airborne Horizontal Momentum Rules (NES preserves facing until landed)
      this.isSkidding = false;
      if (dirInput !== 0) {
        const sameAsMotion =
          this.vxSub === 0
            ? dirInput === this.facing
            : (dirInput === 1 && this.vxSub > 0) ||
              (dirInput === -1 && this.vxSub < 0);

        const absVx = Math.abs(this.vxSub);
        if (sameAsMotion) {
          const accel =
            absVx >= NES_PHYSICS.MAX_WALK_SPEED
              ? NES_PHYSICS.AIR_FORWARD_ACCEL_FAST
              : NES_PHYSICS.AIR_FORWARD_ACCEL_SLOW;
          const maxAirSpeed =
            absVx > NES_PHYSICS.MAX_WALK_SPEED || runHeld
              ? NES_PHYSICS.MAX_AIR_RUN_SPEED
              : NES_PHYSICS.MAX_AIR_WALK_SPEED;
          const nextAbs = Math.min(maxAirSpeed, absVx + accel);
          this.vxSub = dirInput * nextAbs;
        } else {
          const decel =
            absVx >= NES_PHYSICS.MAX_WALK_SPEED
              ? NES_PHYSICS.AIR_BACKWARD_DECEL_FAST
              : NES_PHYSICS.AIR_BACKWARD_DECEL_SLOW;
          this.vxSub += dirInput * decel;
        }
      }
    }
  }

  private updateVerticalSubPixelPhysics(): void {
    const jumpJustPressed = this.input.isJustPressed('jumpA');
    const jumpHeld = this.input.isHeld('jumpA');

    if (this.underwaterMode) {
      if (jumpJustPressed) {
        this.vySub = NES_PHYSICS.SWIM_IMPULSE_VY;
        this.grounded = false;
        this.isSwimming = true;
      }
      const swimGravity =
        jumpHeld && this.vySub < 0
          ? NES_PHYSICS.SWIM_HOLD_GRAVITY
          : NES_PHYSICS.SWIM_RELEASE_GRAVITY;
      this.vySub = applyGravityAndClampSub(this.vySub, swimGravity);
      return;
    }

    // Takeoff from ground
    if (this.grounded && jumpJustPressed) {
      const absVx = Math.abs(this.vxSub);
      this.currentJumpBracket = selectJumpBracket(absVx);
      this.vySub = this.currentJumpBracket.initialVySub;
      this.grounded = false;
      this.jumpButtonHeld = true;
      return;
    }

    if (!jumpHeld) {
      this.jumpButtonHeld = false;
    }

    // Variable Jump Gravity: lower gravity while holding A during upward ascent (vySub < 0),
    // ~3.5x heavier gravity immediately upon releasing A or passing apex (vySub >= 0).
    const activeGravity =
      this.jumpButtonHeld && this.vySub < 0
        ? this.currentJumpBracket.holdGravitySub
        : this.currentJumpBracket.fallGravitySub;

    this.vySub = applyGravityAndClampSub(this.vySub, activeGravity);
  }

  private spawnFireball(): void {
    const spawnX = this.facing === 1 ? this.x + 12 : this.x - 4;
    const spawnY = this.y + 10;
    const fb = new Fireball(
      spawnX,
      spawnY,
      this.facing,
      this.collisionSolver,
      this.eventBus
    );
    this.fireballs.push(fb);
    this.fireThrowPoseTimer = 8;
    this.eventBus.emit('fireball-thrown', {
      worldX: spawnX,
      worldY: spawnY,
      direction: this.facing,
    });
  }

  private startFlagpoleSlide(col: number): void {
    this.flagpoleSliding = true;
    this.flagpoleCol = col;
    this.vxSub = 0;
    this.vySub = pxToSub(2.0);
    this.x = col * TILE_SIZE - 6;

    // Calculate NES flagpole height score (100 to 5000 points)
    const touchY = this.y;
    let points = 100;
    if (touchY <= 64) points = 5000;
    else if (touchY <= 96) points = 2000;
    else if (touchY <= 128) points = 800;
    else if (touchY <= 160) points = 400;

    this.collisionSolver.addScorePopup(
      col * TILE_SIZE + 8,
      touchY,
      String(points)
    );
    this.eventBus.emit('flagpole-reached', {
      col,
      touchY,
      points,
    });
  }

  private updateFlagpoleSlide(minLeftWorldX: number): void {
    if (!this.grounded) {
      this.vySub = pxToSub(2.0);
      this.collisionSolver.moveAndCollideEntity(this, {
        isPlayer: false,
        minLeftWorldX,
      });
      this.pose = Math.floor(this.y / 8) % 2 === 0 ? 'climb-1' : 'climb-2';
    } else {
      // Walk automatically into castle door after reaching flagpole base
      this.facing = 1;
      this.vxSub = pxToSub(1.25);
      this.vySub = applyGravityAndClampSub(this.vySub, 0x0040);
      this.collisionSolver.moveAndCollideEntity(this, {
        isPlayer: false,
        minLeftWorldX,
      });
      this.walkAnimSubCounter += Math.abs(this.vxSub);
      if (this.walkAnimSubCounter >= 0x0500) {
        this.walkAnimSubCounter = 0;
        this.walkFrameIndex = (this.walkFrameIndex + 1) % 3;
      }
      this.pose = (`walk-${(this.walkFrameIndex + 1) as 1 | 2 | 3}` as MarioPose);
    }
  }

  private updateAnimationPose(): void {
    if (this.fireThrowPoseTimer > 0) {
      this.pose = 'throw';
      return;
    }
    if (this.isCrouching) {
      this.pose = 'crouch';
      return;
    }
    if (!this.grounded) {
      if (this.underwaterMode) {
        this.pose = this.vySub < 0 ? 'swim-1' : 'swim-2';
      } else {
        this.pose = 'jump';
      }
      return;
    }
    if (this.isSkidding) {
      this.pose = 'skid';
      return;
    }
    const absVx = Math.abs(this.vxSub);
    if (absVx > 0x0010) {
      this.walkAnimSubCounter += absVx;
      if (this.walkAnimSubCounter >= 0x0580) {
        this.walkAnimSubCounter = 0;
        this.walkFrameIndex = (this.walkFrameIndex + 1) % 3;
      }
      const idx = (this.walkFrameIndex + 1) as 1 | 2 | 3;
      this.pose = `walk-${idx}`;
    } else {
      this.pose = 'idle';
      this.walkFrameIndex = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // Render active fireballs
    for (const fb of this.fireballs) {
      fb.render(ctx, camera);
    }

    // Blink every 2 frames during post-damage invulnerability
    if (
      this.damageIframeTimer > 0 &&
      Math.floor(this.damageIframeTimer / 2) % 2 === 1
    ) {
      return;
    }

    const sx = camera.worldToScreenX(this.x);
    const sy = camera.worldToScreenY(this.y);

    // Transformation flicker between Small and Super heights
    let renderState = this.powerState;
    let renderY = sy;
    if (this.transformTimer > 0 && Math.floor(this.transformTimer / 3) % 2 === 1) {
      if (this.powerState === 'small') {
        renderState = 'super';
        renderY = sy - 16;
      } else {
        renderState = 'small';
        renderY = sy + 16;
      }
    }

    drawMarioSprite(ctx, sx, renderY, {
      powerState: renderState,
      pose: this.pose,
      facing: this.facing,
      starmanActive: this.starmanTimer > 0,
      starmanTick: this.starmanTimer,
    });
  }
}
