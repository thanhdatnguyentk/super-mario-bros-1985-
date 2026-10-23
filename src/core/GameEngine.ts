import { TILE_SIZE } from '../types/physics-constants.ts';
import type { LevelDefinition } from '../types/level-schema.ts';
import { EventBus } from './EventBus.ts';
import { InputManager } from './InputManager.ts';
import { Camera } from './Camera.ts';
import { TileCollisionSolver } from '../physics/TileCollisionSolver.ts';
import { TilemapLoader } from '../world/TilemapLoader.ts';
import { WarpPipeController } from '../world/WarpPipeController.ts';
import { ItemManager } from '../entities/items/ItemManager.ts';
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
  activeItems: number;
  activeAreaId: string;
  fps: number;
}

export class GameEngine {
  public readonly eventBus = new EventBus();
  public readonly input = new InputManager();
  public readonly collisionSolver: TileCollisionSolver;
  public readonly camera: Camera;
  public readonly tilemapLoader: TilemapLoader;
  public readonly itemManager: ItemManager;
  public readonly warpPipeController: WarpPipeController;
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
    this.tilemapLoader = new TilemapLoader(
      initialLevel,
      this.collisionSolver,
      this.camera
    );
    this.itemManager = new ItemManager(this.eventBus, this.collisionSolver);
    this.warpPipeController = new WarpPipeController(
      this.tilemapLoader,
      this.itemManager,
      this.eventBus
    );
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

    this.eventBus.on('item-collected', ({ kind, points }) => {
      this.score += points;
      if (kind === 'one-up') {
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

    this.itemManager.clearAll();
    this.warpPipeController.reset();
    this.tilemapLoader.loadLevel(level);

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

    // 1. Check / Advance Warp Pipe Cutscene (suspends standard Mario physics while entering/exiting pipe)
    const inPipeCutscene = this.warpPipeController.update(
      this.mario,
      this.input
    );

    if (!inPipeCutscene) {
      // 2. Update Mario with one-way camera left-edge boundary clamp
      this.mario.update(this.camera.x, this.camera);

      // 3. Advance one-way camera rightward when Mario passes scroll threshold (unless room is scrollLocked)
      if (
        this.mario.alive &&
        !this.mario.flagpoleSliding &&
        !this.tilemapLoader.activeArea.scrollLocked
      ) {
        this.camera.followTargetRightOnly(this.mario.x);
      }

      // 4. Update all spawned Power-Up Items, Vines & Spinning Block Coins
      this.itemManager.update(this.mario);
    }

    // 5. Update block bumps, brick shatter debris & floating score popups
    this.collisionSolver.updateVisualEffects();

    // 6. Update NES timer (1 NES timer unit = 24 frames @ 60 FPS = 0.4s)
    if (this.mario.alive && !this.mario.flagpoleSliding && !inPipeCutscene) {
      this.timerTickCounter++;
      if (this.timerTickCounter >= 24) {
        this.timerTickCounter = 0;
        this.timeRemaining = Math.max(0, this.timeRemaining - 1);
        if (this.timeRemaining === 0) {
          this.mario.killPlayer('time-up');
        }
      }
    }

    // 7. Auto-respawn after death fall or castle walk-in
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
      this.tilemapLoader.activeArea,
      this.camera,
      this.collisionSolver,
      this.itemManager,
      this.mario,
      this.warpPipeController.isActive(),
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
          activeItems: this.itemManager.items.length,
          activeAreaId: this.tilemapLoader.activeArea.areaId,
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
