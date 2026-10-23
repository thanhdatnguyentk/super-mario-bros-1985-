import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE } from '../types/physics-constants.ts';
import { pxToSub } from '../physics/SubPixelPhysics.ts';
import { GameEngine } from '../core/GameEngine.ts';
import { FlagpoleSequenceController } from '../world/FlagpoleSequenceController.ts';
import { WORLD_1_1_LEVEL } from '../levels/TestStage1_1.ts';

describe('Phase 4 — Underwater Physics, Moving/Pulley Lifts, Vine Climbing, Flagpole Fireworks & Castle Maze Loops', () => {
  it('simulates Underwater swimming strokes, surface ceiling cap (y >= 24px), pit whirlpool suction, and air bubbles', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);
    engine.enemyManager.enemies.length = 0;
    engine.mario.underwaterMode = true;
    engine.mario.x = 10 * TILE_SIZE;
    engine.mario.y = 100;
    engine.mario.grounded = false;

    // 1. Swim stroke upward by pressing Jump A repeatedly
    engine.input.setVirtualButton('jumpA', true);
    engine.stepPhysicsTick();
    assert.ok(
      engine.mario.vy < 0,
      'Pressing Jump A underwater must apply upward swim stroke impulse'
    );
    assert.equal(engine.mario.pose, 'swim-1');

    // 2. Surface ceiling cap at y = 24px prevents swimming out of the water
    engine.mario.y = 20;
    engine.mario.vySub = -pxToSub(2);
    engine.stepPhysicsTick();
    assert.ok(
      engine.mario.y >= 24,
      'Underwater surface current must clamp Mario at y >= 24px'
    );

    // 3. Whirlpool suction over bottomless pit at col 69 (where rows 13..14 are empty '.')
    engine.input.setVirtualButton('jumpA', false);
    engine.mario.x = 69 * TILE_SIZE;
    engine.mario.y = 120;
    engine.mario.vySub = 0;
    engine.stepPhysicsTick();
    assert.ok(
      engine.mario.vySub > 0x0010,
      'Swimming over an underwater pit applies extra downward whirlpool suction'
    );

    // 4. Air bubbles spawn periodically while underwater
    for (let i = 0; i < 46; i++) {
      engine.stepPhysicsTick();
    }
    assert.ok(
      engine.mario.bubbles.length > 0,
      'Underwater Mario periodically emits rising air bubbles'
    );
  });

  it('operates Moving Platforms (right-on-stand & scale-balance-pair pulleys with rope snap)', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);
    engine.enemyManager.enemies.length = 0;

    engine.platformController.loadPlatforms([
      {
        id: 'lift-balance-left',
        type: 'scale-balance-pair',
        col: 10,
        row: 8,
        widthTiles: 3,
        minBound: 4,
        maxBound: 10,
        speedPxPerFrame: 1,
        pairedPlatformId: 'lift-balance-right',
        pulleyTopRow: 2,
      },
      {
        id: 'lift-balance-right',
        type: 'scale-balance-pair',
        col: 15,
        row: 8,
        widthTiles: 3,
        minBound: 4,
        maxBound: 10,
        speedPxPerFrame: 1,
        pairedPlatformId: 'lift-balance-left',
        pulleyTopRow: 2,
      },
    ]);

    const leftLift = engine.platformController.platforms[0];
    const rightLift = engine.platformController.platforms[1];
    const initialLeftY = leftLift.y;
    const initialRightY = rightLift.y;

    // Place Mario standing on Left Pulley Lift -> Left lift descends while Right lift rises!
    engine.mario.x = 11 * TILE_SIZE;
    engine.mario.y = leftLift.y - engine.mario.spriteHeight;
    engine.mario.vySub = 0;

    for (let i = 0; i < 15; i++) {
      engine.platformController.update(engine.mario);
    }

    assert.ok(
      leftLift.y > initialLeftY,
      'Weighted pulley platform must descend when Mario stands on it'
    );
    assert.ok(
      rightLift.y < initialRightY,
      'Partner pulley platform must rise by the exact opposite displacement'
    );

    // Continue standing on Left Lift until it crosses maxBound (row 10 = 160px) -> rope snaps (+1000 score)!
    for (let i = 0; i < 40; i++) {
      engine.platformController.update(engine.mario);
    }
    assert.equal(
      leftLift.snapped && rightLift.snapped,
      true,
      'Pushing a balance platform to its bound limit snaps the pulley rope'
    );
    assert.equal(engine.score, 1000);
  });

  it('grows a Beanstalk (Vine) from a block, allows Mario to climb it, and transitions to the target sub-world', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);
    engine.enemyManager.enemies.length = 0;

    // Spawn a Vine at (col 14, row 9) linked to '1-1-bonus'
    const vine = engine.itemManager.spawnItemFromBlock(
      'vine',
      14,
      9,
      '1-1-bonus'
    );
    for (let i = 0; i < 60; i++) {
      vine.update();
    }

    // Mario jumps onto the vine stem -> latches onto vine (`isClimbingVine === true`)
    engine.mario.x = 14 * TILE_SIZE;
    engine.mario.y = 7 * TILE_SIZE;
    engine.mario.vySub = -pxToSub(1);
    engine.mario.grounded = false;
    engine.itemManager.update(engine.mario);
    assert.equal(engine.mario.isClimbingVine, true);

    // Hold Up to climb the vine to the top of the screen -> transitions to '1-1-bonus'
    engine.input.setVirtualButton('up', true);
    for (let i = 0; i < 110; i++) {
      engine.stepPhysicsTick();
    }
    engine.input.setVirtualButton('up', false);

    assert.equal(
      engine.tilemapLoader.activeArea.areaId,
      '1-1-bonus',
      'Climbing a Vine to the top of the screen transitions Mario into the target sub-world'
    );
  });

  it('executes the Flagpole slide, Castle walk-in, Time-to-Score countdown, and 1/3/6 Fireworks rule', () => {
    assert.equal(FlagpoleSequenceController.computeFireworksCount(251), 1);
    assert.equal(FlagpoleSequenceController.computeFireworksCount(253), 3);
    assert.equal(FlagpoleSequenceController.computeFireworksCount(256), 6);
    assert.equal(FlagpoleSequenceController.computeFireworksCount(254), 0);

    const engine = new GameEngine(WORLD_1_1_LEVEL);
    engine.enemyManager.enemies.length = 0;

    // Set timer to 13 so last digit is 3 -> earns 3 fireworks!
    engine.timeRemaining = 13;

    // Place Mario touching the Flagpole at col 198, row 6
    engine.mario.x = 198 * TILE_SIZE - 4;
    engine.mario.y = 6 * TILE_SIZE;

    let stageClearedFireworks = -1;
    engine.eventBus.on('stage-cleared', (ev) => {
      stageClearedFireworks = ev.fireworksLaunched;
    });

    for (let i = 0; i < 240; i++) {
      engine.stepPhysicsTick();
      if (stageClearedFireworks !== -1) break;
    }

    assert.equal(
      stageClearedFireworks,
      3,
      'Timer ending in 3 at flagpole touch must launch exactly 3 fireworks'
    );
  });

  it('enforces Looping Castle Maze checkpoints (4-4, 7-4, 8-4): rewinds wrong path and passes correct path', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);
    engine.enemyManager.enemies.length = 0;

    // Configure a Castle Maze checkpoint at col 40 requiring Mario to be on the upper corridor (rows 4..6);
    // otherwise rewinds seamlessly to col 20!
    engine.castleMazeController.loadCheckpoints([
      {
        checkCol: 40,
        validRowMin: 4,
        validRowMax: 6,
        rewindToCol: 20,
      },
    ]);

    // 1. Wrong Path: Mario crosses col 40 on the bottom floor (row 12) -> rewinds to col 20!
    engine.mario.x = 40 * TILE_SIZE;
    engine.mario.y = 12 * TILE_SIZE;
    engine.camera.forceSetX(34 * TILE_SIZE);
    engine.castleMazeController.update(engine.mario, engine.camera);

    assert.equal(engine.castleMazeController.loopRewindCount, 1);
    assert.equal(
      engine.mario.x,
      20 * TILE_SIZE,
      'Taking the wrong corridor must seamlessly rewind Mario to rewindToCol (col 20)'
    );
    assert.equal(
      engine.castleMazeController.passedCheckpoints.has(40),
      false
    );

    // 2. Correct Path: Mario crosses col 40 on the upper corridor (row 5) -> checkpoint passes!
    engine.mario.x = 40 * TILE_SIZE;
    engine.mario.y = 5 * TILE_SIZE;
    engine.castleMazeController.update(engine.mario, engine.camera);

    assert.equal(
      engine.castleMazeController.passedCheckpoints.has(40),
      true,
      'Taking the valid vertical corridor marks the Castle Maze checkpoint as passed'
    );
    assert.equal(engine.mario.x, 40 * TILE_SIZE);
  });
});
