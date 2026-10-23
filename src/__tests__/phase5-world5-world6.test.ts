import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE } from '../types/physics-constants.ts';
import { GameEngine } from '../core/GameEngine.ts';
import { LevelManager } from '../world/LevelManager.ts';
import { TilemapLoader } from '../world/TilemapLoader.ts';
import {
  WORLD_5_1_LEVEL,
  WORLD_5_2_LEVEL,
  WORLD_5_3_LEVEL,
  WORLD_5_4_LEVEL,
  WORLD_5_LEVELS,
} from '../levels/World5Levels.ts';
import {
  WORLD_6_1_LEVEL,
  WORLD_6_2_LEVEL,
  WORLD_6_3_LEVEL,
  WORLD_6_4_LEVEL,
  WORLD_6_LEVELS,
} from '../levels/World6Levels.ts';

describe('Phase 5 (Part 3) — World 5 & World 6 Complete Data Verification', () => {
  it('decodes all 8 stages of World 5 & World 6 and all 6 Sub-Worlds into exact 15-row matrices', () => {
    const manager = new LevelManager();
    for (const level of [...WORLD_5_LEVELS, ...WORLD_6_LEVELS]) {
      assert.equal(manager.hasLevel(level.id), true);
      assert.equal(level.tileMatrix.length, 15);
      const decoded = TilemapLoader.decodeMatrix(
        level.tileMatrix,
        level.widthCols
      );
      assert.equal(decoded.length, 15);
      for (const row of decoded) {
        assert.equal(row.length, level.widthCols);
      }

      for (const sub of Object.values(level.subWorlds)) {
        const subDecoded = TilemapLoader.decodeMatrix(
          sub.tileMatrix,
          sub.widthCols
        );
        assert.equal(subDecoded.length, 15);
        for (const subRow of subDecoded) {
          assert.equal(subRow.length, sub.widthCols);
        }
      }
    }

    assert.equal(manager.getNextLevelId('4-4'), '5-1');
    assert.equal(manager.getNextLevelId('5-1'), '5-2');
    assert.equal(manager.getNextLevelId('5-2'), '5-3');
    assert.equal(manager.getNextLevelId('5-3'), '5-4');
    assert.equal(manager.getNextLevelId('5-4'), '6-1');
    assert.equal(manager.getNextLevelId('6-1'), '6-2');
    assert.equal(manager.getNextLevelId('6-2'), '6-3');
    assert.equal(manager.getNextLevelId('6-3'), '6-4');
  });

  it('verifies World 5-1 Bullet Bill cannons, World 5-2 Underwater + Coin Heaven sub-worlds, World 5-3 storm, and World 5-4 giant 12-ball Fire-Bars', () => {
    // World 5-1 Bullet Bill cannon tiles ('b' top + 'c' base) & generators
    const engine51 = new GameEngine(WORLD_5_1_LEVEL);
    assert.equal(engine51.currentLevel.bgPreset, 'night-snow-trees');
    assert.equal(engine51.collisionSolver.getTile(32, 10), 'b');
    assert.equal(engine51.collisionSolver.getTile(32, 11), 'c');
    assert.equal(
      WORLD_5_1_LEVEL.enemies.filter((e) => e.type === 'bullet-bill-generator')
        .length,
      6
    );

    // World 5-2 Pipe to Underwater Sub-World ('5-2-underwater') & Vine to Coin Heaven ('5-2-coin-heaven')
    const engine52 = new GameEngine(WORLD_5_2_LEVEL);
    engine52.mario.x = 46 * TILE_SIZE + 8;
    engine52.mario.y = 9 * TILE_SIZE - engine52.mario.spriteHeight;
    engine52.mario.grounded = true;
    engine52.input.setVirtualButton('down', true);
    for (let i = 0; i < 40; i++) {
      engine52.stepPhysicsTick();
    }
    engine52.input.setVirtualButton('down', false);
    assert.equal(engine52.tilemapLoader.activeArea.areaId, '5-2-underwater');
    assert.equal(engine52.mario.underwaterMode, true);

    // World 5-3 Athletic treetops + Bullet Bills
    const engine53 = new GameEngine(WORLD_5_3_LEVEL);
    assert.equal(
      WORLD_5_3_LEVEL.enemies.some((e) => e.type === 'bullet-bill-generator'),
      true
    );
    assert.equal(
      engine53.platformController.platforms.some(
        (p) => p.type === 'scale-balance-pair'
      ),
      true
    );

    // World 5-4 Giant 12-ball Fire-Bars & Castle clear -> World 6-1
    const engine54 = new GameEngine(WORLD_5_4_LEVEL);
    const longBars = engine54.enemyManager.fireBars.filter(
      (fb) => fb.lengthBalls === 12
    );
    assert.equal(longBars.length, 2);

    engine54.mario.x = 147 * TILE_SIZE;
    engine54.mario.y = 8 * TILE_SIZE;
    for (let i = 0; i < 220; i++) {
      engine54.stepPhysicsTick();
      if (engine54.currentLevel.id === '6-1') break;
    }
    assert.equal(engine54.currentLevel.id, '6-1');
  });

  it('verifies World 6-1 night Lakitu, World 6-2 3-subworld pipe maze, World 6-3 snow sky lifts, and World 6-4 Hammer-Throwing Bowser', () => {
    // World 6-1 Night-Trees Lakitu & Hidden 1-Up
    const engine61 = new GameEngine(WORLD_6_1_LEVEL);
    assert.equal(engine61.currentLevel.bgPreset, 'night-trees');
    assert.equal(engine61.collisionSolver.getTile(66, 8), 'H');

    // World 6-2 Pipe Maze with 3 Sub-Worlds ('6-2-bonus', '6-2-underwater', '6-2-coin-heaven')
    const engine62 = new GameEngine(WORLD_6_2_LEVEL);
    assert.equal(Object.keys(engine62.currentLevel.subWorlds).length, 3);
    engine62.eventBus.emit('vine-climbed-top', {
      targetSubworldId: '6-2-coin-heaven',
    });
    assert.equal(engine62.tilemapLoader.activeArea.areaId, '6-2-coin-heaven');

    // World 6-3 Night-Snow-Trees Athletic Sky Lifts
    const engine63 = new GameEngine(WORLD_6_3_LEVEL);
    assert.equal(engine63.currentLevel.bgPreset, 'night-snow-trees');
    assert.equal(engine63.platformController.platforms.length, 7);

    // World 6-4 Castle: Bowser with bowserThrowsHammers === true throws hammer projectiles!
    const engine64 = new GameEngine(WORLD_6_4_LEVEL);
    const bowserSpawn = WORLD_6_4_LEVEL.enemies.find(
      (e) => e.type === 'bowser'
    );
    assert.equal(bowserSpawn?.bowserThrowsHammers, true);
    assert.equal(bowserSpawn?.bowserTrueForm, 'blooper');

    engine64.camera.forceSetX(132 * TILE_SIZE);
    engine64.mario.x = 135 * TILE_SIZE;
    engine64.mario.y = 9 * TILE_SIZE;
    let sawHammerProjectile = false;
    for (let i = 0; i < 90; i++) {
      engine64.stepPhysicsTick();
      if (
        engine64.enemyManager.projectiles.some((p) => p.kind === 'hammer')
      ) {
        sawHammerProjectile = true;
        break;
      }
    }
    assert.equal(sawHammerProjectile, true);
  });
});
