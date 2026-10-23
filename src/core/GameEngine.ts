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
import { LevelManager } from '../world/LevelManager.ts';
import {
  NesAudioSynthesizer,
  type BgmTrackId,
} from '../audio/NesAudioSynthesizer.ts';
import { GameScreenStateMachine } from '../ui/GameScreenStateMachine.ts';
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
  public readonly levelManager: LevelManager;
  public readonly audio: NesAudioSynthesizer;
  public readonly screenState: GameScreenStateMachine;
  public readonly renderer = new Renderer();
  public mario: Mario;
  public currentLevel: LevelDefinition;
  public lastWarpRequestId: string | null = null;

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
  private castleClearTimerFrames = 0;
  private measuredFps = 60;
  private onTelemetryUpdate?: (telemetry: LivePhysicsTelemetry) => void;

  constructor(initialLevel: LevelDefinition = WORLD_1_1_LEVEL) {
    this.levelManager = new LevelManager();
    this.levelManager.registerLevel(initialLevel);
    this.audio = new NesAudioSynthesizer(this.eventBus);
    this.screenState = new GameScreenStateMachine('playing');
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
        const sub = this.currentLevel.subWorlds[targetSubworldId];
        this.enemyManager.loadAreaEnemies(sub?.enemies ?? [], []);
        this.audio.playBgm((sub?.music as BgmTrackId) ?? 'coin-heaven');
        this.mario.x = 2 * TILE_SIZE;
        this.mario.y = 10 * TILE_SIZE;
        this.mario.vxSub = 0;
        this.mario.vySub = 0;
        this.mario.grounded = true;
      }
    });

    this.eventBus.on('area-switched', ({ areaId, exitCol }) => {
      this.platformController.loadPlatforms(
        this.tilemapLoader.activeArea.platforms
      );
      if (areaId === 'main') {
        this.castleMazeController.markCheckpointsBeforeColPassed(exitCol);
        this.enemyManager.loadAreaEnemies(
          this.currentLevel.enemies,
          this.currentLevel.fireBars
        );
        this.audio.playBgm((this.currentLevel.music as BgmTrackId) ?? 'overworld');
        this.flagpoleController.reset(
          this.currentLevel.goal.flagpoleCol ?? 198,
          this.currentLevel.goal.castleDoorCol ?? 204
        );
      } else {
        const sub = this.currentLevel.subWorlds[areaId];
        this.enemyManager.loadAreaEnemies(sub?.enemies ?? [], []);
        this.audio.playBgm((sub?.music as BgmTrackId) ?? 'underground');
        if (areaId.endsWith('-exit')) {
          this.flagpoleController.reset(29, 35);
        }
      }
    });

    this.eventBus.on('warp-zone-entered', ({ requestedLevelId }) => {
      this.lastWarpRequestId = requestedLevelId;
      const resolved = this.levelManager.resolveWarpTarget(
        `warp:${requestedLevelId}`
      );
      if (resolved) {
        this.loadLevel(resolved.level, true);
      }
    });

    this.eventBus.on('bridge-collapse-completed', () => {
      this.castleClearTimerFrames = 120;
    });
  }

  public enterTitleScreen(): void {
    this.screenState.updateTopScore(this.score);
    this.screenState.enterTitleScreen();
    this.loadLevelById('1-1', false);
    this.audio.stopBgm();
  }

  public loadLevelById(levelId: string, keepPowerState = false): boolean {
    const level = this.levelManager.getLevel(levelId);
    if (!level) return false;
    this.loadLevel(level, keepPowerState);
    return true;
  }

  public advanceToNextLevel(keepPowerState = true): void {
    const nextLevel = this.levelManager.getNextLevel(this.currentLevel.id);
    this.loadLevel(nextLevel, keepPowerState);
  }

  public loadLevel(level: LevelDefinition, keepPowerState = false): void {
    const savedState = keepPowerState ? this.mario.powerState : 'small';
    this.levelManager.registerLevel(level);
    this.currentLevel = level;
    this.timeRemaining = level.timeLimit;
    this.timerTickCounter = 0;
    this.castleClearTimerFrames = 0;

    // In Second Quest (Hard Mode after beating 8-4), all Goombas become Buzzy Beetles!
    const stageEnemies = this.screenState.newQuestUnlocked
      ? level.enemies.map((e) =>
          e.type === 'goomba' ? { ...e, type: 'buzzy-beetle' as const } : e
        )
      : level.enemies;

    this.itemManager.clearAll();
    this.warpPipeController.reset();
    this.tilemapLoader.loadLevel(level);
    this.enemyManager.loadAreaEnemies(stageEnemies, level.fireBars);
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

    this.audio.setHurryUp(false);
    if (this.screenState.state === 'playing') {
      this.audio.playBgm((level.music as BgmTrackId) ?? 'overworld');
    }
  }

  private stepNonPlayingScreenState(): boolean {
    const st = this.screenState.state;
    if (st === 'playing') return false;

    if (st === 'title') {
      if (this.input.isJustPressed('select') || this.input.isJustPressed('down')) {
        this.screenState.selectedPlayerCount =
          this.screenState.selectedPlayerCount === 1 ? 2 : 1;
      }
      if (this.screenState.newQuestUnlocked && this.input.isJustPressed('runB')) {
        const nextW = ((this.screenState.selectedStartWorld % 8) + 1) as
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6
          | 7
          | 8;
        this.screenState.selectedStartWorld = nextW;
      }
      if (this.input.isJustPressed('start')) {
        this.screenState.clearAttractDemoInputs(this.input);
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        const startId = `${this.screenState.selectedStartWorld}-1`;
        this.loadLevelById(startId, false);
        this.screenState.enterWorldIntro(120);
        return true;
      }

      // Attract-Mode Demo after 180 frames on the Title Screen
      this.screenState.titleIdleFrames++;
      if (this.screenState.titleIdleFrames >= 180) {
        this.screenState.demoActive = true;
        this.screenState.applyAttractDemoInputs(
          this.input,
          this.screenState.titleIdleFrames - 180
        );
        this.input.pollFrame();
        this.mario.update(this.camera.x, this.camera);
        this.camera.followTargetRightOnly(this.mario.x);
        this.itemManager.update(this.mario);
        this.enemyManager.update(this.mario, this.camera);
        this.collisionSolver.updateVisualEffects();

        if (!this.mario.alive || this.screenState.titleIdleFrames > 900) {
          this.screenState.clearAttractDemoInputs(this.input);
          this.enterTitleScreen();
        }
      }
      return true;
    }

    if (st === 'world-intro') {
      this.screenState.stateTimerFrames--;
      if (this.screenState.stateTimerFrames <= 0) {
        this.screenState.enterPlaying();
        this.audio.playBgm(
          (this.currentLevel.music as BgmTrackId) ?? 'overworld'
        );
      }
      return true;
    }

    if (st === 'time-up') {
      this.screenState.stateTimerFrames--;
      if (this.screenState.stateTimerFrames <= 0) {
        if (this.lives > 0) {
          this.loadLevel(this.currentLevel, false);
          this.screenState.enterWorldIntro(120);
        } else {
          this.screenState.enterGameOver(180);
          this.audio.playBgm('game-over', true);
        }
      }
      return true;
    }

    if (st === 'game-over') {
      this.audio.stepFrame();
      this.screenState.stateTimerFrames--;
      if (this.screenState.stateTimerFrames <= 0) {
        this.enterTitleScreen();
      }
      return true;
    }

    if (st === 'quest-complete') {
      this.audio.stepFrame();
      this.screenState.stateTimerFrames--;
      if (
        this.screenState.stateTimerFrames <= 0 ||
        this.input.isJustPressed('start')
      ) {
        this.enterTitleScreen();
      }
      return true;
    }

    return false;
  }

  /**
   * Execute exactly one deterministic 60 FPS physics tick.
   */
  public stepPhysicsTick(): void {
    this.input.pollFrame();

    if (this.stepNonPlayingScreenState()) {
      return;
    }

    if (this.input.isJustPressed('start')) {
      this.isPaused = !this.isPaused;
      this.audio.playSfx('pause');
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

    this.screenState.updateTopScore(this.score);

    // Synchronize Starman Invincibility BGM vs Area BGM
    if (this.mario.alive && !this.mario.flagpoleSliding && this.castleClearTimerFrames === 0) {
      if (this.mario.starmanTimer > 0 && this.audio.currentTrack !== 'starman') {
        this.audio.playBgm('starman');
      } else if (
        this.mario.starmanTimer === 0 &&
        this.audio.currentTrack === 'starman'
      ) {
        const areaId = this.tilemapLoader.activeArea.areaId;
        const areaMusic =
          areaId === 'main'
            ? this.currentLevel.music
            : this.currentLevel.subWorlds[areaId]?.music ?? 'underground';
        this.audio.playBgm((areaMusic as BgmTrackId) ?? 'overworld');
      }
    }
    this.audio.stepFrame();

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

      // 3.5 Suppress Warp Zone Piranha Plants once Warp Zone is revealed
      if (
        this.levelManager.isWarpZoneRevealed(
          this.tilemapLoader.activeArea,
          this.camera.x,
          this.mario.x
        ) &&
        this.tilemapLoader.activeArea.warpZone
      ) {
        const minWarpCol =
          (this.tilemapLoader.activeArea.warpZone.pipes[0]?.col ?? 138) - 2;
        for (const enemy of this.enemyManager.enemies) {
          if (
            enemy.type === 'piranha-plant' &&
            enemy.x >= minWarpCol * TILE_SIZE
          ) {
            enemy.alive = false;
          }
        }
      }

      // 3.6 Update Flagpole End-of-Level Sequence (Banner Slide, Castle Door Walk-in, Time Tally & 1/3/6 Fireworks)
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

      // 4.6 Handle Castle Bridge Collapse Victory Sequence (walk to Toad / Peach -> next World or Quest Complete)
      if (this.castleClearTimerFrames > 0) {
        this.castleClearTimerFrames--;
        if (this.castleClearTimerFrames === 0) {
          this.eventBus.emit('stage-cleared', {
            levelId: this.currentLevel.id,
            fireworksLaunched: 0,
          });
          if (this.currentLevel.goal.rescueNpc === 'princess-peach') {
            this.screenState.enterQuestComplete(240);
          } else {
            this.advanceToNextLevel(true);
          }
          return;
        }
      }
    }

    // 5. Update block bumps, brick shatter debris & floating score popups
    this.collisionSolver.updateVisualEffects();

    // 6. Update NES timer (1 NES timer unit = 24 frames @ 60 FPS = 0.4s)
    if (this.mario.alive && !this.mario.flagpoleSliding && !inPipeCutscene) {
      this.timerTickCounter++;
      if (this.timerTickCounter >= 24) {
        this.timerTickCounter = 0;
        this.timeRemaining = Math.max(0, this.timeRemaining - 1);
        if (this.timeRemaining === 100) {
          this.audio.setHurryUp(true);
        }
        if (this.timeRemaining === 0) {
          this.mario.killPlayer('time-up');
        }
      }
    }

    // 7. Auto-respawn after death fall or advance to next stage after flagpole sequence completes
    if (!this.mario.alive && this.mario.y > 320) {
      this.lives = Math.max(1, this.lives - 1);
      this.loadLevel(this.currentLevel, false);
    } else if (this.flagpoleController.phase === 'completed') {
      this.advanceToNextLevel(true);
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

    this.screenState.renderOverlay(ctx, this.currentLevel.id, this.lives);
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
