import { TILE_SIZE } from '../types/physics-constants.ts';
import type { LevelDefinition } from '../types/level-schema.ts';
import { EventBus } from './EventBus.ts';
import { InputManager } from './InputManager.ts';
import { Camera } from './Camera.ts';
import { TileCollisionSolver } from '../physics/TileCollisionSolver.ts';
import { Mario } from '../entities/player/Mario.ts';
import { Renderer, type HudTelemetryState } from '../rendering/Renderer.ts';
import { WORLD_1_1_LEVEL } from '../levels/TestStage1_1.ts';

export interface LivePhysicsTelemetry {
  xPx: number;
  yPx: number;
  xSub: number;
  ySub: number;
  vxPx: number;
  vyPx: number;
  powerState: string;
  pose: string;
  jumpBracket: string;
  grounded: boolean;
  skidding: boolean;
  cameraX: number;
  activeFireballs: number;
  fps: number;
}

export class GameEngine {
  public readonly eventBus = new EventBus();
  public readonly input = new InputManager();
  public readonly collisionSolver: TileCollisionSolver;
  public readonly camera: Camera;
  public readonly renderer = new Renderer();
  public mario: Mario;
  public currentLevel: LevelDefinition;

  public score = 0;
  public coins = 0;
  public lives = 3;
  public timeRemaining = 400;
  public isPaused = false;

  // Fixed 60 FPS Timestep Loop State
  private readonly fixedStepMs = 1000 / 60;
  private accumulatorMs = 0;
  private lastTimestampMs = 0;
  private rafId: number | null = null;
  private timerTickCounter = 0;
  private measuredFps = 60;
  private onTelemetryUpdate?: (telemetry: LivePhysicsTelemetry) => void;

  constructor(initialLevel: LevelDefinition = WORLD_1_1_LEVEL) {
    this.currentLevel = initialLevel;
    this.collisionSolver = new TileCollisionSolver(this.eventBus);
    this.camera = new Camera(initialLevel.widthCols);
    this.mario = new Mario(
      initialLevel.playerStart.col * TILE_SIZE,
      initialLevel.playerStart.row * TILE_SIZE,
      this.input,
      this.collisionSolver,
      this.eventBus
    );

    this.bindEvents();
    this.loadLevel(initialLevel);
  }

  public setTelemetryCallback(
    cb: (telemetry: LivePhysicsTelemetry) => void
  ): void {
    this.onTelemetryUpdate = cb;
  }

  private bindEvents(): void {
    this.eventBus.on('coin-collected', ({ points }) => {
      this.score += points;
      this.coins++;
      if (this.coins >= 100) {
        this.coins -= 100;
        this.lives++;
      }
    });

    this.eventBus.on('brick-shattered', () => {
      this.score += 50;
    });

    this.eventBus.on('block-bumped', ({ payload }) => {
      if (payload === 'powerup-progressive') {
        this.score += 1000;
        if (this.mario.powerState === 'small') {
          this.mario.setPowerState('super', true);
        } else {
          this.mario.setPowerState('fire', true);
        }
      } else if (payload === 'starman') {
        this.score += 1000;
        this.mario.activateStarman();
      } else if (payload === 'one-up') {
        this.lives++;
      }
    });

    this.eventBus.on('flagpole-reached', ({ points }) => {
      this.score += points;
    });
  }

  public loadLevel(level: LevelDefinition, keepPowerState = false): void {
    const savedState = keepPowerState ? this.mario.powerState : 'small';
    this.currentLevel = level;
    this.timeRemaining = level.timeLimit;
    this.timerTickCounter = 0;

    this.collisionSolver.loadLevelGrid(level);
    this.camera.setLevelWidthCols(level.widthCols);
    this.camera.forceSetX(0);

    this.mario = new Mario(
      level.playerStart.col * TILE_SIZE,
      level.playerStart.row * TILE_SIZE,
      this.input,
      this.collisionSolver,
      this.eventBus
    );
    this.mario.underwaterMode = level.biome === 'underwater';
    if (savedState !== 'small') {
      this.mario.setPowerState(savedState, false);
    }
  }

  /**
   * Execute exactly one deterministic 60 FPS physics tick.
   */
  public stepPhysicsTick(): void {
    this.input.pollFrame();

    if (this.input.isJustPressed('start')) {
      this.isPaused = !this.isPaused;
    }
    if (this.input.isJustPressed('debugReset')) {
      this.loadLevel(this.currentLevel, false);
      return;
    }
    if (this.input.isJustPressed('debugSmall')) {
      this.mario.setPowerState('small', false);
    }
    if (this.input.isJustPressed('debugSuper')) {
      this.mario.setPowerState('super', true);
    }
    if (this.input.isJustPressed('debugFire')) {
      this.mario.setPowerState('fire', true);
    }
    if (this.input.isJustPressed('debugStar')) {
      this.mario.activateStarman();
    }

    if (this.isPaused) return;

    // Update Mario with one-way camera left-edge boundary clamp
    this.mario.update(this.camera.x, this.camera);

    // Advance one-way camera rightward when Mario passes scroll threshold
    if (this.mario.alive && !this.mario.flagpoleSliding) {
      this.camera.followTargetRightOnly(this.mario.x);
    }

    // Update block bumps, brick shatter debris & floating score popups
    this.collisionSolver.updateVisualEffects();

    // Update NES timer (1 NES timer unit = 24 frames @ 60 FPS = 0.4s)
    if (this.mario.alive && !this.mario.flagpoleSliding) {
      this.timerTickCounter++;
      if (this.timerTickCounter >= 24) {
        this.timerTickCounter = 0;
        this.timeRemaining = Math.max(0, this.timeRemaining - 1);
        if (this.timeRemaining === 0) {
          this.mario.killPlayer('time-up');
        }
      }
    }

    // Auto-respawn after death fall or castle walk-in
    if (!this.mario.alive && this.mario.y > 320) {
      this.lives = Math.max(1, this.lives - 1);
      this.loadLevel(this.currentLevel, false);
    } else if (
      this.mario.flagpoleSliding &&
      this.currentLevel.goal.castleDoorCol &&
      this.mario.x >= this.currentLevel.goal.castleDoorCol * TILE_SIZE
    ) {
      this.loadLevel(this.currentLevel, true);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const hud: HudTelemetryState = {
      score: this.score,
      coins: this.coins,
      worldLabel: this.currentLevel.id,
      timeRemaining: this.timeRemaining,
      lives: this.lives,
    };

    this.renderer.renderFrame(
      ctx,
      this.currentLevel,
      this.camera,
      this.collisionSolver,
      this.mario,
      hud
    );
  }

  public startLoop(ctx: CanvasRenderingContext2D): void {
    this.input.attachWindowListeners();
    this.lastTimestampMs = performance.now();

    const loop = (nowMs: number) => {
      const deltaMs = Math.min(100, Math.max(0, nowMs - this.lastTimestampMs));
      this.lastTimestampMs = nowMs;
      if (deltaMs > 0) {
        this.measuredFps = Math.round(1000 / deltaMs);
      }

      this.accumulatorMs += deltaMs;
      while (this.accumulatorMs >= this.fixedStepMs) {
        this.stepPhysicsTick();
        this.accumulatorMs -= this.fixedStepMs;
      }

      this.render(ctx);

      if (this.onTelemetryUpdate) {
        this.onTelemetryUpdate({
          xPx: this.mario.x,
          yPx: this.mario.y,
          xSub: this.mario.xSub,
          ySub: this.mario.ySub,
          vxPx: this.mario.vx,
          vyPx: this.mario.vy,
          powerState: this.mario.powerState.toUpperCase(),
          pose: this.mario.pose,
          jumpBracket: this.mario.currentJumpBracket.id.toUpperCase(),
          grounded: this.mario.grounded,
          skidding: this.mario.isSkidding,
          cameraX: Math.round(this.camera.x),
          activeFireballs: this.mario.fireballs.length,
          fps: Math.min(60, this.measuredFps),
        });
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  public stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.input.detachWindowListeners();
  }
}
