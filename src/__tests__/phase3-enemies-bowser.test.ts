import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE } from '../types/physics-constants.ts';
import { pxToSub } from '../physics/SubPixelPhysics.ts';
import { GameEngine } from '../core/GameEngine.ts';
import { FireBarHazard } from '../world/FireBarHazard.ts';
import { WORLD_1_1_LEVEL } from '../levels/TestStage1_1.ts';

describe('Phase 3 — Full Enemy Roster AI, Kicked Shell Physics, Fire-Bars & King Bowser', () => {
  it('stomps Goomba, turns Red Koopa around at ledges, kicks Koopa shell to bounce off walls and chain-kill enemies', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);
    engine.enemyManager.enemies.length = 0;

    // 1. Spawn Goomba at (col 8, row 12) and stomp it from above
    const goomba = engine.enemyManager.spawnEnemyImmediate({
      type: 'goomba',
      col: 8,
      row: 12,
    });
    engine.mario.x = goomba.x;
    engine.mario.y = goomba.y - 10;
    engine.mario.vySub = pxToSub(3);
    engine.stepPhysicsTick();

    assert.equal(goomba.state, 'squished');
    assert.ok(engine.mario.vySub < 0, 'Mario bounces upward after stomping Goomba');
    assert.equal(engine.score, 100);

    // 2. Red Koopa Troopa turns around at platform ledge (row 9 brick platform cols 20..24)
    const redKoopa = engine.enemyManager.spawnEnemyImmediate({
      type: 'koopa-red',
      col: 20,
      row: 8,
    });
    redKoopa.x = 20 * TILE_SIZE;
    redKoopa.y = 9 * TILE_SIZE - redKoopa.spriteHeight;
    redKoopa.grounded = true;
    redKoopa.facing = -1;

    for (let i = 0; i < 6; i++) {
      engine.stepPhysicsTick();
    }
    assert.equal(
      redKoopa.facing,
      1,
      'Red Koopa Troopa must detect platform edge and turn around'
    );

    // 3. Green Koopa Shell kick + wall bounce + chain kills (500 -> 800)
    const greenKoopa = engine.enemyManager.spawnEnemyImmediate({
      type: 'koopa-green',
      col: 25,
      row: 12,
    });
    greenKoopa.enterIdleShell();
    assert.equal(greenKoopa.state, 'shell-idle');

    // Place two target Goombas to the right of the shell (cols 26 and 27, before Pipe at col 28)
    const targetGoomba1 = engine.enemyManager.spawnEnemyImmediate({
      type: 'goomba',
      col: 26,
      row: 12,
    });
    const targetGoomba2 = engine.enemyManager.spawnEnemyImmediate({
      type: 'goomba',
      col: 27,
      row: 12,
    });

    // Mario touches the idle shell from the left -> kicks shell rightward toward Pipe at col 28
    engine.mario.x = greenKoopa.x - 10;
    engine.mario.y = greenKoopa.y;
    engine.mario.vySub = 0;
    engine.stepPhysicsTick();
    assert.equal(greenKoopa.state, 'shell-sliding');
    assert.equal(greenKoopa.facing, 1);

    // Move Mario safely out of the rebounding shell's path while the shell mows down both Goombas and bounces off the Pipe at col 28
    engine.mario.y = 4 * TILE_SIZE;
    for (let i = 0; i < 20; i++) {
      engine.stepPhysicsTick();
    }

    assert.equal(targetGoomba1.state, 'flipped-dead');
    assert.equal(targetGoomba2.state, 'flipped-dead');
    assert.equal(greenKoopa.shellKillChain, 2);
    assert.equal(
      greenKoopa.facing,
      -1,
      'Sliding Koopa shell must bounce leftward off the Pipe at col 28'
    );
  });

  it('verifies Piranha proximity inhibition, fireproof Buzzy Beetle, Lakitu & Spiny Egg hatching, Hammer Bro, Blooper, Cheep-Cheep & Podoboo', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);
    engine.enemyManager.enemies.length = 0;

    // 1. Piranha Plant at Pipe (col 28, row 11) stays hidden while Mario stands next to pipe
    const piranha = engine.enemyManager.spawnEnemyImmediate({
      type: 'piranha-plant',
      col: 28,
      row: 11,
    });
    piranha.piranhaTimer = 1;
    engine.mario.x = 28 * TILE_SIZE;
    engine.mario.y = 9 * TILE_SIZE;
    engine.stepPhysicsTick();
    assert.equal(
      piranha.piranhaPhase,
      'hidden',
      'Piranha Plant must NOT emerge while Mario is within 28px of pipe'
    );

    // Move Mario far away -> Piranha Plant emerges
    engine.mario.x = 10 * TILE_SIZE;
    piranha.piranhaTimer = 1;
    engine.stepPhysicsTick();
    assert.equal(piranha.piranhaPhase, 'emerging');

    // 2. Buzzy Beetle deflects Fire Mario's fireball without taking damage
    const buzzy = engine.enemyManager.spawnEnemyImmediate({
      type: 'buzzy-beetle',
      col: 14,
      row: 12,
    });
    engine.mario.setPowerState('fire', false);
    engine.mario.x = buzzy.x - 16;
    engine.mario.y = 11 * TILE_SIZE;
    engine.mario.facing = 1;
    engine.input.setVirtualButton('runB', true);
    engine.stepPhysicsTick();
    engine.input.setVirtualButton('runB', false);

    for (let i = 0; i < 6; i++) {
      engine.stepPhysicsTick();
    }
    assert.equal(
      buzzy.state,
      'normal',
      'Buzzy Beetle is fireproof and must not be killed by fireballs'
    );

    // 3. Lakitu throws a Spiny Egg that hatches into a walking Spiny upon landing on ground
    const lakitu = engine.enemyManager.spawnEnemyImmediate({
      type: 'lakitu',
      col: 12,
      row: 2,
    });
    for (let i = 0; i < 140; i++) {
      engine.stepPhysicsTick();
    }
    const spiny = engine.enemyManager.enemies.find((e) => e.type === 'spiny');
    assert.ok(spiny, 'Lakitu must drop a Spiny');
    if (!spiny) throw new Error('Missing spiny');

    // Step until Spiny Egg lands on ground row 13 and hatches
    for (let i = 0; i < 60; i++) {
      engine.stepPhysicsTick();
    }
    assert.equal(spiny.isSpinyEgg, false, 'Spiny Egg hatches into walking Spiny on ground');
    assert.equal(spiny.isStompable(), false, 'Spiny cannot be stomped');
    assert.ok(lakitu.alive);

    // 4. Hammer Bro throws arcing Hammer projectiles
    const hammerBro = engine.enemyManager.spawnEnemyImmediate({
      type: 'hammer-bro',
      col: 18,
      row: 12,
    });
    for (let i = 0; i < 80; i++) {
      engine.stepPhysicsTick();
    }
    assert.ok(hammerBro.alive);
    assert.ok(
      engine.enemyManager.projectiles.some((p) => p.kind === 'hammer'),
      'Hammer Bro must throw arcing Hammer projectiles'
    );

    // 5. Blooper, Cheep-Cheep & Podoboo AI updates (spawned ahead of camera.x at cols 24..26)
    const blooper = engine.enemyManager.spawnEnemyImmediate({
      type: 'blooper',
      col: 24,
      row: 6,
    });
    const cheep = engine.enemyManager.spawnEnemyImmediate({
      type: 'cheep-red-swim',
      col: 25,
      row: 8,
    });
    const podoboo = engine.enemyManager.spawnEnemyImmediate({
      type: 'podoboo',
      col: 26,
      row: 12,
    });
    const startCheepX = cheep.x;
    const startPodobooY = podoboo.y;
    for (let i = 0; i < 10; i++) {
      engine.stepPhysicsTick();
    }
    assert.ok(cheep.x < startCheepX, 'Underwater Cheep-Cheep swims leftward');
    assert.ok(podoboo.y < startPodobooY, 'Podoboo erupts upward from lava');
    assert.ok(blooper.alive && podoboo.alive);
  });

  it('rotates Castle Fire-Bars and damages Mario on fireball node intersection', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);
    engine.mario.setPowerState('super', false);

    const fireBar = new FireBarHazard({
      col: 10,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 0,
      angularVelocityDegPerFrame: 3,
    });

    // Place Mario at the 3rd fireball node along 0 degrees (x = pivotX + 24, y = pivotY)
    const nodePos = fireBar.getBallPosition(3);
    engine.mario.x = Math.round(nodePos.x - 6);
    engine.mario.y = Math.round(nodePos.y - 16);
    fireBar.update(engine.mario);

    assert.equal(fireBar.angleDeg, 3);
    assert.equal(
      engine.mario.powerState,
      'small',
      'Intersecting a rotating Fire-Bar node must damage Super Mario down to Small'
    );
  });

  it('defeats Bowser with 5 Fireballs (revealing true form) OR drops Bowser into lava when Mario touches the Castle Axe', () => {
    // Part A: Defeat Bowser with 5 Fireballs -> reveals disguised Goomba true form (World 1-4 mechanic)
    const engineFire = new GameEngine(WORLD_1_1_LEVEL);
    engineFire.enemyManager.enemies.length = 0;
    engineFire.mario.setPowerState('fire', false);

    const bowser = engineFire.enemyManager.spawnEnemyImmediate({
      type: 'bowser',
      col: 15,
      row: 10,
      bowserTrueForm: 'goomba',
      bowserThrowsHammers: true,
    });
    assert.equal(bowser.hp, 5);

    for (let hit = 0; hit < 5; hit++) {
      engineFire.mario.fireballs.length = 0;
      engineFire.mario.x = bowser.x - 28;
      engineFire.mario.y = bowser.y;
      engineFire.mario.facing = 1;
      engineFire.input.setVirtualButton('runB', true);
      engineFire.stepPhysicsTick();
      engineFire.input.setVirtualButton('runB', false);
      for (let step = 0; step < 6; step++) {
        engineFire.stepPhysicsTick();
      }
    }

    assert.equal(bowser.hp, 0);
    assert.equal(bowser.state, 'flipped-dead');
    assert.equal(
      bowser.revealedTrueForm,
      'goomba',
      'Defeating World 1-4 Bowser with 5 fireballs reveals his disguised Goomba true form'
    );

    // Part B: Castle Axe ('A') triggers right-to-left Bridge ('=') collapse and drops Bowser into lava
    const engineAxe = new GameEngine(WORLD_1_1_LEVEL);
    engineAxe.enemyManager.enemies.length = 0;

    // Build a 6-tile Castle Bridge ('=') at cols 30..35, row 10, Chain ('R') at (35, 9), and Axe ('A') at (36, 8)
    for (let c = 30; c <= 35; c++) {
      engineAxe.collisionSolver.setTile(c, 10, '=');
    }
    engineAxe.collisionSolver.setTile(35, 9, 'R');
    engineAxe.collisionSolver.setTile(36, 8, 'A');

    const bridgeBowser = engineAxe.enemyManager.spawnEnemyImmediate({
      type: 'bowser',
      col: 32,
      row: 9,
      bowserTrueForm: 'real-bowser',
    });

    // Place Mario touching the Castle Axe at (36, 8)
    engineAxe.mario.x = 36 * TILE_SIZE;
    engineAxe.mario.y = 8 * TILE_SIZE;
    engineAxe.stepPhysicsTick();

    assert.equal(engineAxe.collisionSolver.getTile(36, 8), '.');
    assert.equal(engineAxe.enemyManager.isBridgeCollapsing(), true);

    // Advance 30 frames (6 bridge columns × 4 frames per column = 24 frames) to complete bridge collapse
    for (let i = 0; i < 30; i++) {
      engineAxe.stepPhysicsTick();
    }

    for (let c = 30; c <= 35; c++) {
      assert.equal(
        engineAxe.collisionSolver.getTile(c, 10),
        '.',
        `Bridge tile at col ${c} must collapse into empty air`
      );
    }
    assert.equal(
      bridgeBowser.state,
      'bridge-fall',
      'Bowser must fall into the lava pit once the castle bridge collapses'
    );
  });
});
