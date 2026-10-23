import { TILE_SIZE } from '../types/physics-constants.ts';
import type { LevelDefinition } from '../types/level-schema.ts';
import { EventBus } from './EventBus.ts';
import { InputManager } from './InputManager.ts';
import { Camera } from './Camera.ts';
import { TileCollisionSolver } from '../physics/TileCollisionSolver.ts';
import { TilemapLoader } from '../world/TilemapLoader.ts';
import { WarpPipeController } from '../world/WarpPipeController.ts';
import { MovingPlatformController } from '../world/MovingPlatformController.ts';
import { FlagpoleSequenceController } from '../world/FlagpoleSequenceController.ts';
import { CastleMazeLoopController } from '../world/CastleMazeLoopController.ts';
import { ItemManager } from '../entities/items/ItemManager.ts';
import { EnemyManager } from '../entities/enemies/EnemyManager.ts';
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
  public readonly enemyManager: EnemyManager;
  public readonly platformController: MovingPlatformController;
  public readonly flagpoleController: FlagpoleSequenceController;
  public readonly castleMazeController: CastleMazeLoopController;
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
    this.enemyManager = new EnemyManager(this.eventBus, this.collisionSolver);
    this.platformController = new MovingPlatformController(
      this.eventBus,
      this.collisionSolver
    );
    this.flagpoleController = new FlagpoleSequenceController(this.eventBus);
    this.castleMazeController = new CastleMazeLoopController(this.eventBus);
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

    this.eventBus.on('enemy-defeated', ({ points, extraLife }) => {
      this.score += points;
      if (extraLife) {
        this.lives++;
      }
    });

    this.eventBus.on('pulley-rope-snapped', ({ points }) => {
      this.score += points;
    });

    this.eventBus.on('vine-climbed-top', ({ targetSubworldId }) => {
      if (this.tilemapLoader.switchArea(targetSubworldId, 2)) {
        this.platformController.loadPlatforms(
          this.tilemapLoader.activeArea.platforms
        );
        this.enemyManager.loadAreaEnemies(
          this.currentLevel.subWorlds[targetSubworldId]?.enemies ?? [],
          []
        );
        this.mario.x = 2 * TILE_SIZE;
        this.mario.y = 10 * TILE_SIZE;
        this.mario.vxSub = 0;
        this.mario.vySub = 0;
        this.mario.grounded = true;
      }
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
    this.enemyManager.loadAreaEnemies(level.enemies, level.fireBars);
    this.platformController.loadPlatforms(level.platforms);
    this.flagpoleController.reset(
      level.goal.flagpoleCol ?? 198,
      level.goal.castleDoorCol ?? 204
    );
    this.castleMazeController.loadCheckpoints(level.castleMazeLoop ?? []);

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

      // 2.5 Update Moving Platforms / Lifts & Scale-Balance Pulleys
      this.platformController.update(this.mario);

      // 2.6 Update Looping Castle Maze Checkpoints (Worlds 4-4, 7-4, 8-4)
      if (this.tilemapLoader.activeArea.areaId === 'main') {
        this.castleMazeController.update(this.mario, this.camera);
      }

      // 3. Advance one-way camera rightward when Mario passes scroll threshold (unless room is scrollLocked)
      if (
        this.mario.alive &&
        !this.mario.flagpoleSliding &&
        !this.tilemapLoader.activeArea.scrollLocked
      ) {
        this.camera.followTargetRightOnly(this.mario.x);
      }

      // 3.5 Update Flagpole End-of-Level Sequence (Banner Slide, Castle Door Walk-in, Time Tally & 1/3/6 Fireworks)
      this.flagpoleController.update(this.mario, this.currentLevel.id, {
        getTimeRemaining: () => this.timeRemaining,
        decrementTimeAndAddScore: (timeDelta, scoreDelta) => {
          this.timeRemaining = Math.max(0, this.timeRemaining - timeDelta);
          this.score += scoreDelta;
        },
      });

      // 4. Update all spawned Power-Up Items, Vines & Spinning Block Coins
      this.itemManager.update(this.mario);

      // 4.5 Update all Enemies, Projectiles, Rotating Fire-Bars & Castle Bridge Collapse
      this.enemyManager.update(this.mario, this.camera);
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

    // 7. Auto-respawn after death fall or stage-cleared completion
    if (!this.mario.alive && this.mario.y > 320) {
      this.lives = Math.max(1, this.lives - 1);
      this.loadLevel(this.currentLevel, false);
    } else if (this.flagpoleController.phase === 'completed') {
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
      this.enemyManager,
      this.platformController,
      this.flagpoleController,
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
