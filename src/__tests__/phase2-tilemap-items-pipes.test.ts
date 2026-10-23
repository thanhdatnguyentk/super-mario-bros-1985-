import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE } from '../types/physics-constants.ts';
import { pxToSub } from '../physics/SubPixelPhysics.ts';
import { GameEngine } from '../core/GameEngine.ts';
import { TilemapLoader } from '../world/TilemapLoader.ts';
import { WORLD_1_1_LEVEL } from '../levels/TestStage1_1.ts';

describe('Phase 2 — Tilemap Loader, Interactive Blocks, All Power-Up Items & Warp Pipes', () => {
  it('encodes and decodes RLE tilemap rows and preserves Main Area state across Sub-World trips', () => {
    const rawRow = '....######..PP..';
    const rle = TilemapLoader.encodeRowRLE(rawRow);
    assert.equal(rle, '4.,6#,2.,2P,2.');
    const decoded = TilemapLoader.decodeRow(rle, 16);
    assert.equal(decoded, rawRow);

    const engine = new GameEngine(WORLD_1_1_LEVEL);
    // Mutate a Question Block in main area (col 16, row 9)
    engine.collisionSolver.setTile(16, 9, 'M');
    assert.equal(engine.collisionSolver.getTile(16, 9), 'M');

    // Switch to '1-1-bonus' sub-world
    const switchedToBonus = engine.tilemapLoader.switchArea('1-1-bonus', 2);
    assert.equal(switchedToBonus, true);
    assert.equal(engine.tilemapLoader.activeArea.areaId, '1-1-bonus');
    assert.equal(engine.tilemapLoader.activeArea.biome, 'underground');
    assert.equal(engine.tilemapLoader.activeArea.scrollLocked, true);

    // Switch back to 'main' at Pipe #5 (col 163) -> mutated block at (16, 9) must remain 'M'
    const switchedToMain = engine.tilemapLoader.switchArea('main', 163);
    assert.equal(switchedToMain, true);
    assert.equal(engine.tilemapLoader.activeArea.areaId, 'main');
    assert.equal(
      engine.collisionSolver.getTile(16, 9),
      'M',
      'Mutated Question Block in main world must be preserved after returning from sub-world'
    );
  });

  it('spawns Super Mushroom for Small Mario and Fire Flower for Super Mario from progressive ? blocks', () => {
    // 1. Small Mario hits progressive ? block at (col 21, row 9) -> Super Mushroom
    const engineSmall = new GameEngine(WORLD_1_1_LEVEL);
    engineSmall.enemyManager.enemies.length = 0;
    engineSmall.mario.x = 21 * TILE_SIZE;
    engineSmall.mario.y = 10 * TILE_SIZE;
    engineSmall.mario.vySub = -pxToSub(4);
    engineSmall.stepPhysicsTick();

    assert.equal(engineSmall.collisionSolver.getTile(21, 9), 'M');
    assert.equal(engineSmall.itemManager.items.length, 1);
    const mushroom = engineSmall.itemManager.items[0];
    assert.equal(mushroom.kind, 'super-mushroom');
    assert.equal(mushroom.lifecycleState, 'emerging');

    // Step 40 frames so Mushroom finishes emerging (4 delay + 32 rise frames) and starts gliding right
    engineSmall.mario.x = 18 * TILE_SIZE;
    for (let i = 0; i < 40; i++) {
      engineSmall.stepPhysicsTick();
    }
    assert.equal(mushroom.lifecycleState, 'active');
    assert.ok(mushroom.vx > 0, 'Active Super Mushroom should glide rightward');

    // Place Mario onto the active Super Mushroom to collect it -> upgrades to Super Mario + 1000 score
    const scoreBeforePickup = engineSmall.score;
    engineSmall.mario.x = mushroom.x;
    engineSmall.mario.y = mushroom.y;
    engineSmall.stepPhysicsTick();
    assert.equal(engineSmall.mario.powerState, 'super');
    assert.equal(engineSmall.score, scoreBeforePickup + 1000);

    // 2. Super Mario hits progressive ? block at (col 78, row 9) -> Fire Flower
    const engineSuper = new GameEngine(WORLD_1_1_LEVEL);
    engineSuper.mario.setPowerState('super', false);
    engineSuper.mario.x = 78 * TILE_SIZE;
    engineSuper.mario.y = 10 * TILE_SIZE;
    engineSuper.mario.vySub = -pxToSub(5);
    engineSuper.stepPhysicsTick();

    assert.equal(engineSuper.itemManager.items.length, 1);
    const flower = engineSuper.itemManager.items[0];
    assert.equal(flower.kind, 'fire-flower');

    for (let i = 0; i < 40; i++) {
      engineSuper.stepPhysicsTick();
    }
    assert.equal(flower.lifecycleState, 'active');
    assert.equal(flower.vx, 0, 'Fire Flower remains stationary atop its block');

    engineSuper.mario.x = flower.x;
    engineSuper.mario.y = flower.y - 16;
    engineSuper.stepPhysicsTick();
    assert.equal(engineSuper.mario.powerState, 'fire');
    assert.equal(engineSuper.score, 1000);
  });

  it('handles Hidden 1-Up Block, Starman bouncing item, Multi-Coin-10 brick, and Spinning Coins', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);

    // 1. Hidden Block 'H' at (col 64, row 8) is pass-through when falling downward
    assert.equal(engine.collisionSolver.getTile(64, 8), 'H');
    engine.mario.x = 64 * TILE_SIZE;
    engine.mario.y = 7 * TILE_SIZE;
    engine.mario.vySub = pxToSub(3);
    engine.stepPhysicsTick();
    assert.equal(
      engine.collisionSolver.getTile(64, 8),
      'H',
      'Falling downward through Hidden Block must not reveal it'
    );

    // Jumping upward into Hidden Block 'H' at (col 64, row 8) reveals it and spawns 1-Up Mushroom
    engine.mario.x = 64 * TILE_SIZE;
    engine.mario.y = 9 * TILE_SIZE;
    engine.mario.vySub = -pxToSub(4);
    engine.stepPhysicsTick();
    assert.equal(engine.collisionSolver.getTile(64, 8), 'M');
    const oneUp = engine.itemManager.items.find((it) => it.kind === 'one-up');
    assert.ok(oneUp, 'Hidden block at (64, 8) must spawn 1-Up Mushroom');
    if (!oneUp) throw new Error('Missing oneUp');

    for (let i = 0; i < 38; i++) {
      engine.stepPhysicsTick();
    }
    const prevLives = engine.lives;
    engine.mario.x = oneUp.x;
    engine.mario.y = oneUp.y;
    engine.stepPhysicsTick();
    assert.equal(engine.lives, prevLives + 1, 'Collecting 1-Up Mushroom grants +1 life');

    // 2. Starman brick at (col 101, row 9) spawns bouncing Starman and activates invincibility
    engine.mario.x = 101 * TILE_SIZE;
    engine.mario.y = 10 * TILE_SIZE;
    engine.mario.vySub = -pxToSub(4);
    engine.stepPhysicsTick();
    const starman = engine.itemManager.items.find((it) => it.kind === 'starman');
    assert.ok(starman, 'Brick at (101, 9) must spawn Starman');
    if (!starman) throw new Error('Missing starman');

    for (let i = 0; i < 40; i++) {
      engine.stepPhysicsTick();
    }
    engine.mario.x = starman.x;
    engine.mario.y = starman.y;
    engine.stepPhysicsTick();
    assert.ok(engine.mario.starmanTimer > 700, 'Collecting Starman activates 720-frame invincibility');

    // 3. Multi-Coin-10 brick at (col 94, row 9) dispenses 10 spinning coins before turning to 'M'
    const coinsBefore = engine.coins;
    for (let hit = 0; hit < 10; hit++) {
      engine.mario.x = 94 * TILE_SIZE;
      engine.mario.y = 10 * TILE_SIZE;
      engine.mario.vySub = -pxToSub(4);
      engine.stepPhysicsTick();
    }
    assert.equal(engine.coins, coinsBefore + 10);
    assert.equal(engine.collisionSolver.getTile(94, 9), 'M');
    assert.ok(engine.itemManager.spinningCoins.length > 0);
  });

  it('transitions Mario into Underground Sub-World via downward Warp Pipe and exits back to Main Stage Pipe #5', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);

    // 1. Place Mario standing on top of canonical Pipe #4 (col 57, row 9)
    engine.mario.x = 57 * TILE_SIZE + 8;
    engine.mario.y = 9 * TILE_SIZE - engine.mario.spriteHeight;
    engine.mario.grounded = true;

    // Hold Down -> triggers 'entering-down' pipe cutscene
    engine.input.setVirtualButton('down', true);
    engine.stepPhysicsTick();
    assert.equal(engine.warpPipeController.phase, 'entering-down');

    // Advance 32 frames to complete entry into '1-1-bonus'
    for (let i = 0; i < 32; i++) {
      engine.stepPhysicsTick();
    }
    engine.input.setVirtualButton('down', false);

    assert.equal(engine.tilemapLoader.activeArea.areaId, '1-1-bonus');
    assert.equal(engine.tilemapLoader.activeArea.biome, 'underground');
    assert.equal(engine.warpPipeController.phase, 'idle');

    // 2. Place Mario at the horizontal exit pipe in '1-1-bonus' (col 13, row 11..12) and hold Right
    engine.mario.x = 13 * TILE_SIZE - 14;
    engine.mario.y = 13 * TILE_SIZE - engine.mario.spriteHeight;
    engine.mario.grounded = true;
    engine.input.setVirtualButton('right', true);
    engine.stepPhysicsTick();
    assert.equal(engine.warpPipeController.phase, 'entering-right');

    // Advance 32 frames for 'entering-right' -> switches to 'main' and enters 'exiting-up' at Pipe #5 (col 163)
    for (let i = 0; i < 32; i++) {
      engine.stepPhysicsTick();
    }
    engine.input.setVirtualButton('right', false);
    assert.equal(engine.tilemapLoader.activeArea.areaId, 'main');
    assert.equal(engine.warpPipeController.phase, 'exiting-up');

    // Advance 32 frames for 'exiting-up' -> Mario stands atop Pipe #5 at col 163, row 11
    for (let i = 0; i < 32; i++) {
      engine.stepPhysicsTick();
    }
    assert.equal(engine.warpPipeController.phase, 'idle');
    assert.equal(engine.mario.grounded, true);
    assert.equal(engine.mario.x, 163 * TILE_SIZE + 8);
    assert.equal(engine.mario.y, 11 * TILE_SIZE - engine.mario.spriteHeight);
  });
});
