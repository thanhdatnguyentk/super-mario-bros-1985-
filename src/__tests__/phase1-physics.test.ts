import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NES_PHYSICS } from '../types/physics-constants.ts';
import {
  pxToSub,
  subToPx,
  selectJumpBracket,
  aabbIntersects,
} from '../physics/SubPixelPhysics.ts';
import { GameEngine } from '../core/GameEngine.ts';
import { WORLD_1_1_LEVEL } from '../levels/TestStage1_1.ts';

describe('Phase 1 — NES Sub-Pixel Physics, Variable Jump, Mario States & One-Way Camera', () => {
  it('accelerates differently between Walk and Run (B held) and triggers Skidding on sharp turnaround', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);

    // 1. Walk right for 50 frames without holding Run (B) -> 50 * 9 = 450 -> capped at 400 (0x0190)
    engine.input.setVirtualButton('right', true);
    for (let i = 0; i < 50; i++) {
      engine.stepPhysicsTick();
    }
    const walkVxSub = engine.mario.vxSub;
    assert.equal(
      walkVxSub,
      NES_PHYSICS.MAX_WALK_SPEED,
      'Walk speed should cap at MAX_WALK_SPEED (0x0190)'
    );

    // 2. Hold Run (B) for 40 more frames -> should reach MAX_RUN_SPEED (0x0290)
    engine.input.setVirtualButton('runB', true);
    for (let i = 0; i < 40; i++) {
      engine.stepPhysicsTick();
    }
    assert.equal(
      engine.mario.vxSub,
      NES_PHYSICS.MAX_RUN_SPEED,
      'Run speed should cap at MAX_RUN_SPEED (0x0290)'
    );

    // 3. Reverse direction to Left while running fast -> should enter Skid state
    engine.input.setVirtualButton('right', false);
    engine.input.setVirtualButton('left', true);
    engine.stepPhysicsTick();
    assert.equal(
      engine.mario.isSkidding,
      true,
      'Mario must enter skidding state when reversing at high speed'
    );
    assert.equal(engine.mario.pose, 'skid');
  });

  it('jumps significantly higher when holding Jump (A) and when running at Fast bracket speed', () => {
    // Case A: Short tap jump from standstill (release A after 2 frames)
    const engineTap = new GameEngine(WORLD_1_1_LEVEL);
    const startY = engineTap.mario.y;
    engineTap.input.setVirtualButton('jumpA', true);
    engineTap.stepPhysicsTick();
    engineTap.input.setVirtualButton('jumpA', false);

    let minTapY = startY;
    for (let i = 0; i < 45; i++) {
      engineTap.stepPhysicsTick();
      if (engineTap.mario.y < minTapY) minTapY = engineTap.mario.y;
    }

    // Case B: Full hold jump from standstill (hold A throughout ascent)
    const engineHold = new GameEngine(WORLD_1_1_LEVEL);
    engineHold.input.setVirtualButton('jumpA', true);
    let minHoldY = startY;
    for (let i = 0; i < 45; i++) {
      engineHold.stepPhysicsTick();
      if (engineHold.mario.y < minHoldY) minHoldY = engineHold.mario.y;
    }

    // Case C: Sprint jump at MAX_RUN_SPEED (Fast bracket: -5.0 px/f initial vy)
    const engineSprint = new GameEngine(WORLD_1_1_LEVEL);
    engineSprint.mario.vxSub = NES_PHYSICS.MAX_RUN_SPEED;
    engineSprint.input.setVirtualButton('right', true);
    engineSprint.input.setVirtualButton('runB', true);
    engineSprint.input.setVirtualButton('jumpA', true);
    let minSprintY = startY;
    for (let i = 0; i < 55; i++) {
      engineSprint.stepPhysicsTick();
      if (engineSprint.mario.y < minSprintY) minSprintY = engineSprint.mario.y;
    }

    const tapHeightPx = startY - minTapY;
    const holdHeightPx = startY - minHoldY;
    const sprintHeightPx = startY - minSprintY;

    assert.ok(
      holdHeightPx > tapHeightPx + 20,
      `Holding A (${holdHeightPx}px) must jump much higher than tapping A (${tapHeightPx}px)`
    );
    assert.ok(
      sprintHeightPx > holdHeightPx + 10,
      `Running fast jump (${sprintHeightPx}px) must reach higher apex than standing jump (${holdHeightPx}px)`
    );
    assert.equal(selectJumpBracket(NES_PHYSICS.MAX_RUN_SPEED).id, 'fast');
  });

  it('supports Small, Super, and Fire states, caps active fireballs at 2, and shatters bricks as Super/Fire', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);
    assert.equal(engine.mario.powerState, 'small');

    // Upgrade to Fire Mario
    engine.mario.setPowerState('fire', false);
    assert.equal(engine.mario.powerState, 'fire');
    assert.equal(engine.mario.spriteHeight, 32);

    // Fire 3 times rapidly -> only 2 fireballs allowed on screen simultaneously
    for (let shot = 0; shot < 3; shot++) {
      engine.input.setVirtualButton('runB', true);
      engine.stepPhysicsTick();
      engine.input.setVirtualButton('runB', false);
      engine.stepPhysicsTick();
    }
    assert.equal(
      engine.mario.fireballs.length,
      2,
      'Active fireballs on screen must be strictly capped at 2'
    );

    // Position Super/Fire Mario directly beneath Brick at col 20, row 9 and jump into it
    engine.mario.x = 20 * 16;
    engine.mario.y = 10 * 16;
    engine.mario.vxSub = 0;
    engine.mario.vySub = pxToSub(-4.5);
    assert.equal(engine.collisionSolver.getTile(20, 9), 'B');

    for (let i = 0; i < 6; i++) {
      engine.mario.update(0, engine.camera);
    }
    assert.equal(
      engine.collisionSolver.getTile(20, 9),
      '.',
      'Brick at (20, 9) must shatter when hit from below by Super/Fire Mario'
    );
    assert.ok(
      engine.collisionSolver.debrisParticles.length >= 4,
      'Shattered brick must spawn 4 flying debris fragments'
    );
  });

  it('enforces one-way rightward camera scrolling and prevents Mario from walking left of camera.x', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);

    // Move Mario far to the right so camera scrolls past X = 200
    engine.mario.x = 360;
    engine.stepPhysicsTick();
    const scrolledCameraX = engine.camera.x;
    assert.ok(scrolledCameraX > 200, 'Camera should scroll right with Mario');

    // Try walking left past camera.x
    engine.mario.x = scrolledCameraX + 2;
    engine.input.setVirtualButton('left', true);
    for (let i = 0; i < 30; i++) {
      engine.stepPhysicsTick();
    }

    assert.equal(
      engine.camera.x,
      scrolledCameraX,
      'Camera must never scroll backward to the left'
    );
    assert.ok(
      engine.mario.getAABB().x >= scrolledCameraX,
      'Mario AABB left edge must never cross left of camera.x'
    );
  });

  it('converts fixed-point sub-pixels and detects AABB intersections accurately', () => {
    assert.equal(pxToSub(1.5), 384);
    assert.equal(subToPx(384), 1);
    assert.equal(
      aabbIntersects(
        { x: 10, y: 10, width: 12, height: 14 },
        { x: 20, y: 15, width: 16, height: 16 }
      ),
      true
    );
  });
});
