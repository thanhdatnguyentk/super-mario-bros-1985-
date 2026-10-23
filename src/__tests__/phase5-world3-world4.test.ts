import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE } from '../types/physics-constants.ts';
import { GameEngine } from '../core/GameEngine.ts';
import { LevelManager } from '../world/LevelManager.ts';
import { TilemapLoader } from '../world/TilemapLoader.ts';
import {
  WORLD_3_1_LEVEL,
  WORLD_3_2_LEVEL,
  WORLD_3_3_LEVEL,
  WORLD_3_4_LEVEL,
  WORLD_3_LEVELS,
} from '../levels/World3Levels.ts';
import {
  WORLD_4_1_LEVEL,
  WORLD_4_2_LEVEL,
  WORLD_4_3_LEVEL,
  WORLD_4_4_LEVEL,
  WORLD_4_LEVELS,
} from '../levels/World4Levels.ts';

describe('Phase 5 (Part 2) — World 3 & World 4 Complete Data Verification', () => {
  it('decodes all 8 stages of World 3 & World 4 and all Sub-Worlds into exact 15-row matrices', () => {
    const manager = new LevelManager();
    for (const level of [...WORLD_3_LEVELS, ...WORLD_4_LEVELS]) {
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

    assert.equal(manager.getNextLevelId('3-1'), '3-2');
    assert.equal(manager.getNextLevelId('3-2'), '3-3');
    assert.equal(manager.getNextLevelId('3-3'), '3-4');
    assert.equal(manager.getNextLevelId('3-4'), '4-1');
    assert.equal(manager.getNextLevelId('4-1'), '4-2');
    assert.equal(manager.getNextLevelId('4-2'), '4-3');
    assert.equal(manager.getNextLevelId('4-3'), '4-4');
  });

  it('verifies World 3-1 Hammer Bros + Coin Heaven Vine, World 3-2 flat gauntlet, World 3-3 pulleys, and World 3-4 Castle -> 4-1', () => {
    const engine31 = new GameEngine(WORLD_3_1_LEVEL);
    assert.equal(
      WORLD_3_1_LEVEL.enemies.filter((e) => e.type === 'hammer-bro').length,
      2
    );
    engine31.eventBus.emit('vine-climbed-top', {
      targetSubworldId: '3-1-coin-heaven',
    });
    assert.equal(engine31.tilemapLoader.activeArea.areaId, '3-1-coin-heaven');

    const engine32 = new GameEngine(WORLD_3_2_LEVEL);
    assert.equal(engine32.currentLevel.timeLimit, 300);

    const engine33 = new GameEngine(WORLD_3_3_LEVEL);
    assert.equal(
      engine33.platformController.platforms.filter(
        (p) => p.type === 'scale-balance-pair'
      ).length,
      4
    );
    assert.equal(
      engine33.platformController.platforms.some(
        (p) => p.type === 'fall-on-stand'
      ),
      true
    );

    const engine34 = new GameEngine(WORLD_3_4_LEVEL);
    assert.equal(
      WORLD_3_4_LEVEL.enemies.find((e) => e.type === 'bowser')?.bowserTrueForm,
      'buzzy-beetle'
    );
    engine34.mario.x = 147 * TILE_SIZE;
    engine34.mario.y = 8 * TILE_SIZE;
    for (let i = 0; i < 220; i++) {
      engine34.stepPhysicsTick();
      if (engine34.currentLevel.id === '4-1') break;
    }
    assert.equal(engine34.currentLevel.id, '4-1');
  });

  it('verifies World 4-1 Lakitu, World 4-2 Dual Warp Zones (Beanstalk Worlds 8/7/6 + Ceiling World 5), World 4-3 Mushrooms, and World 4-4 Maze Loop', () => {
    // World 4-1 Lakitu & Hidden 1-Up
    const engine41 = new GameEngine(WORLD_4_1_LEVEL);
    assert.equal(
      WORLD_4_1_LEVEL.enemies.some((e) => e.type === 'lakitu'),
      true
    );
    assert.equal(engine41.collisionSolver.getTile(68, 8), 'H');

    // World 4-2 Vine Warp Zone ('4-2-vine-warp' -> Worlds 8, 7, 6) + Main Warp Zone (World 5)
    const engine42 = new GameEngine(WORLD_4_2_LEVEL);
    assert.equal(engine42.currentLevel.warpZone?.pipes[0]?.targetWorld, 5);
    engine42.eventBus.emit('vine-climbed-top', {
      targetSubworldId: '4-2-vine-warp',
    });
    assert.equal(engine42.tilemapLoader.activeArea.areaId, '4-2-vine-warp');
    assert.equal(
      engine42.tilemapLoader.activeArea.warpZone?.pipes
        .map((p) => p.targetWorld)
        .join(','),
      '8,7,6'
    );

    // World 4-3 Giant Mushroom Athletic stage
    const engine43 = new GameEngine(WORLD_4_3_LEVEL);
    assert.equal(engine43.currentLevel.bgPreset, 'mushroom-platforms');

    // World 4-4 Looping Castle Maze: wrong path at col 68 (row 10) rewinds to col 20; top path (row 4) passes!
    const engine44 = new GameEngine(WORLD_4_4_LEVEL);
    assert.equal(engine44.currentLevel.castleMazeLoop?.length, 2);

    // Wrong path (row 10 at checkCol 68) -> rewinds to col 20
    engine44.mario.x = 68 * TILE_SIZE;
    engine44.mario.y = 10 * TILE_SIZE;
    engine44.castleMazeController.update(engine44.mario, engine44.camera);
    assert.equal(Math.floor(engine44.mario.x / TILE_SIZE), 20);

    // Correct path (row 4 at checkCol 68) -> passes without rewind!
    engine44.mario.x = 68 * TILE_SIZE;
    engine44.mario.y = 4 * TILE_SIZE;
    engine44.castleMazeController.update(engine44.mario, engine44.camera);
    assert.equal(Math.floor(engine44.mario.x / TILE_SIZE), 68);
  });
});
