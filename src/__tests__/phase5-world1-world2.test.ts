import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE } from '../types/physics-constants.ts';
import { GameEngine } from '../core/GameEngine.ts';
import { LevelManager } from '../world/LevelManager.ts';
import { TilemapLoader } from '../world/TilemapLoader.ts';
import {
  WORLD_1_1_LEVEL,
  WORLD_1_2_LEVEL,
  WORLD_1_3_LEVEL,
  WORLD_1_4_LEVEL,
  WORLD_1_LEVELS,
} from '../levels/World1Levels.ts';
import {
  WORLD_2_1_LEVEL,
  WORLD_2_2_LEVEL,
  WORLD_2_3_LEVEL,
  WORLD_2_4_LEVEL,
  WORLD_2_LEVELS,
} from '../levels/World2Levels.ts';

describe('Phase 5 (Part 1) — LevelManager & World 1 + World 2 Complete Data Verification', () => {
  it('registers all 8 stages of World 1 & World 2 with valid 15-row matrices and sequential progression', () => {
    const manager = new LevelManager();
    const ids = manager.getRegisteredLevelIds();
    assert.equal(ids.slice(0, 8).join(','), '1-1,1-2,1-3,1-4,2-1,2-2,2-3,2-4');

    for (const level of [...WORLD_1_LEVELS, ...WORLD_2_LEVELS]) {
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

    assert.equal(manager.getNextLevelId('1-1'), '1-2');
    assert.equal(manager.getNextLevelId('1-2'), '1-3');
    assert.equal(manager.getNextLevelId('1-3'), '1-4');
    assert.equal(manager.getNextLevelId('1-4'), '2-1');
    assert.equal(manager.getNextLevelId('2-1'), '2-2');
    assert.equal(manager.getNextLevelId('2-2'), '2-3');
    assert.equal(manager.getNextLevelId('2-3'), '2-4');
    assert.equal(manager.getNextLevelId('2-4'), '3-1');
  });

  it('verifies World 1-2 underground layout, 3-pipe Warp Zone (Worlds 4, 3, 2), and Piranha Plant suppression', () => {
    const engine = new GameEngine(WORLD_1_2_LEVEL);
    assert.equal(engine.currentLevel.id, '1-2');
    assert.equal(engine.currentLevel.biome, 'underground');
    assert.equal(engine.currentLevel.warpZone?.pipes.length, 3);
    assert.equal(engine.currentLevel.warpZone?.pipes[0]?.col, 178);
    assert.equal(engine.currentLevel.warpZone?.pipes[0]?.targetWorld, 4);
    assert.equal(engine.currentLevel.warpZone?.pipes[1]?.col, 184);
    assert.equal(engine.currentLevel.warpZone?.pipes[1]?.targetWorld, 3);
    assert.equal(engine.currentLevel.warpZone?.pipes[2]?.col, 190);
    assert.equal(engine.currentLevel.warpZone?.pipes[2]?.targetWorld, 2);

    // Spawn a Piranha Plant at the Warp Zone pipe (col 178) and scroll camera to triggerCol (170)
    const warpPiranha = engine.enemyManager.spawnEnemyImmediate({
      type: 'piranha-plant',
      col: 178,
      row: 9,
    });
    assert.equal(warpPiranha.alive, true);

    engine.camera.forceSetX(170 * TILE_SIZE);
    engine.mario.x = 171 * TILE_SIZE;
    engine.stepPhysicsTick();
    assert.equal(warpPiranha.alive, false);

    // Enter the right-most Warp Zone pipe (col 190, row 9 -> warp:2-1)
    engine.mario.x = 190 * TILE_SIZE + 8;
    engine.mario.y = 9 * TILE_SIZE - engine.mario.spriteHeight;
    engine.mario.grounded = true;
    engine.input.setVirtualButton('down', true);

    for (let i = 0; i < 40; i++) {
      engine.stepPhysicsTick();
    }
    engine.input.setVirtualButton('down', false);

    assert.equal(engine.lastWarpRequestId, '2-1');
    assert.equal(engine.currentLevel.id, '2-1');
  });

  it('verifies World 1-3 athletic treetop platforms, scale-balance pair, and World 1-4 Castle clear -> World 2-1', () => {
    const engine13 = new GameEngine(WORLD_1_3_LEVEL);
    assert.equal(engine13.currentLevel.biome, 'athletic');
    assert.equal(
      engine13.platformController.platforms.some(
        (p) => p.type === 'scale-balance-pair'
      ),
      true
    );

    const engine14 = new GameEngine(WORLD_1_4_LEVEL);
    assert.equal(engine14.currentLevel.biome, 'castle');
    assert.equal(engine14.enemyManager.fireBars.length, 6);

    // Touch Castle Axe at (143, 8) in World 1-4 -> bridge collapses -> advances to World 2-1
    engine14.mario.setPowerState('fire', false);
    engine14.mario.x = 143 * TILE_SIZE;
    engine14.mario.y = 8 * TILE_SIZE;

    for (let i = 0; i < 220; i++) {
      engine14.stepPhysicsTick();
      if (engine14.currentLevel.id === '2-1') break;
    }

    assert.equal(engine14.currentLevel.id, '2-1');
    assert.equal(engine14.mario.powerState, 'fire');
  });

  it('verifies World 2-1 Beanstalk to Coin Heaven, World 2-2 Underwater mode, World 2-3 Flying Cheeps, and World 2-4 Castle', () => {
    // World 2-1 Vine block at (82, 5) -> '2-1-coin-heaven'
    const engine21 = new GameEngine(WORLD_2_1_LEVEL);
    const vineBlock = WORLD_2_1_LEVEL.blockContents.find(
      (b) => b.payload === 'vine'
    );
    assert.equal(vineBlock?.col, 82);
    assert.equal(vineBlock?.row, 5);
    assert.equal(vineBlock?.payload, 'vine');
    assert.equal(vineBlock?.targetSubworldId, '2-1-coin-heaven');

    engine21.eventBus.emit('vine-climbed-top', {
      targetSubworldId: '2-1-coin-heaven',
    });
    assert.equal(engine21.tilemapLoader.activeArea.areaId, '2-1-coin-heaven');
    assert.equal(
      engine21.platformController.platforms[0]?.type,
      'right-on-stand'
    );

    // World 2-2 Underwater biome automatically activates Mario underwater swimming physics
    const engine22 = new GameEngine(WORLD_2_2_LEVEL);
    assert.equal(engine22.currentLevel.biome, 'underwater');
    assert.equal(engine22.mario.underwaterMode, true);

    // World 2-3 Athletic bridge with Flying Cheep-Cheep generator
    const engine23 = new GameEngine(WORLD_2_3_LEVEL);
    assert.equal(engine23.currentLevel.biome, 'athletic');
    assert.equal(
      WORLD_2_3_LEVEL.enemies.some((e) => e.type === 'cheep-flying-generator'),
      true
    );

    // World 2-4 Castle with Podoboos, Fire-Bars, and Bowser ('koopa-green' true form)
    const engine24 = new GameEngine(WORLD_2_4_LEVEL);
    assert.equal(engine24.currentLevel.biome, 'castle');
    assert.equal(
      WORLD_2_4_LEVEL.enemies.find((e) => e.type === 'bowser')?.bowserTrueForm,
      'koopa-green'
    );
    assert.equal(WORLD_1_1_LEVEL.id, '1-1');
  });
});
