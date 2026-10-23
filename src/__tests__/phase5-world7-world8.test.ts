import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE } from '../types/physics-constants.ts';
import { GameEngine } from '../core/GameEngine.ts';
import {
  CANONICAL_STAGE_ORDER,
  LevelManager,
} from '../world/LevelManager.ts';
import { TilemapLoader } from '../world/TilemapLoader.ts';
import {
  WORLD_7_1_LEVEL,
  WORLD_7_2_LEVEL,
  WORLD_7_3_LEVEL,
  WORLD_7_4_LEVEL,
  WORLD_7_LEVELS,
} from '../levels/World7Levels.ts';
import {
  WORLD_8_1_LEVEL,
  WORLD_8_2_LEVEL,
  WORLD_8_3_LEVEL,
  WORLD_8_4_LEVEL,
  WORLD_8_LEVELS,
} from '../levels/World8Levels.ts';

describe('Phase 5 (Part 4) — World 7 & World 8 Complete 32-Stage Verification', () => {
  it('registers all 32 canonical stages (1-1 through 8-4) and resolves all Warp Zone targets directly', () => {
    const manager = new LevelManager();
    const ids = manager.getRegisteredLevelIds();
    assert.equal(ids.length, 32);
    assert.equal(ids.join(','), CANONICAL_STAGE_ORDER.join(','));

    for (const level of [...WORLD_7_LEVELS, ...WORLD_8_LEVELS]) {
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

    // Verify all Warp Zone targets (Worlds 2..8) resolve 1:1
    for (const w of [2, 3, 4, 5, 6, 7, 8]) {
      const targetId = `${w}-1`;
      const resolved = manager.resolveWarpTarget(`warp:${targetId}`);
      assert.equal(resolved?.requestedLevelId, targetId);
      assert.equal(resolved?.resolvedLevelId, targetId);
      assert.equal(resolved?.level.id, targetId);
    }
  });

  it('verifies World 7-1 cannons, World 7-2 underwater squadrons, World 7-3 bridge Koopas + Cheeps, and World 7-4 2-stage Maze Loop', () => {
    const engine71 = new GameEngine(WORLD_7_1_LEVEL);
    assert.equal(
      WORLD_7_1_LEVEL.enemies.filter((e) => e.type === 'bullet-bill-generator')
        .length,
      5
    );
    assert.equal(engine71.currentLevel.id, '7-1');

    const engine72 = new GameEngine(WORLD_7_2_LEVEL);
    assert.equal(engine72.mario.underwaterMode, true);
    assert.equal(
      WORLD_7_2_LEVEL.enemies.filter((e) => e.type === 'blooper').length,
      6
    );

    const engine73 = new GameEngine(WORLD_7_3_LEVEL);
    assert.equal(
      WORLD_7_3_LEVEL.enemies.some((e) => e.type === 'cheep-flying-generator'),
      true
    );
    assert.equal(
      WORLD_7_3_LEVEL.enemies.some((e) => e.type === 'koopa-red'),
      true
    );
    assert.equal(engine73.currentLevel.biome, 'athletic');

    // World 7-4 Two-Stage Castle Maze Loop
    const engine74 = new GameEngine(WORLD_7_4_LEVEL);
    assert.equal(engine74.currentLevel.castleMazeLoop?.length, 2);

    // Gate 1 (checkCol 72): bottom row 10 rewinds to col 20; top row 4 passes!
    engine74.mario.x = 72 * TILE_SIZE;
    engine74.mario.y = 10 * TILE_SIZE;
    engine74.castleMazeController.update(engine74.mario, engine74.camera);
    assert.equal(Math.floor(engine74.mario.x / TILE_SIZE), 20);

    engine74.mario.x = 72 * TILE_SIZE;
    engine74.mario.y = 4 * TILE_SIZE;
    engine74.castleMazeController.update(engine74.mario, engine74.camera);
    assert.equal(Math.floor(engine74.mario.x / TILE_SIZE), 72);

    // Gate 2 (checkCol 132): top row 4 rewinds to col 78; middle row 7 passes!
    engine74.mario.x = 132 * TILE_SIZE;
    engine74.mario.y = 4 * TILE_SIZE;
    engine74.castleMazeController.update(engine74.mario, engine74.camera);
    assert.equal(Math.floor(engine74.mario.x / TILE_SIZE), 78);

    engine74.mario.x = 132 * TILE_SIZE;
    engine74.mario.y = 7 * TILE_SIZE;
    engine74.castleMazeController.update(engine74.mario, engine74.camera);
    assert.equal(Math.floor(engine74.mario.x / TILE_SIZE), 132);
  });

  it('verifies World 8-1 marathon, World 8-2 Lakitu+Cannons, World 8-3 8 Hammer Bros, and World 8-4 Pipe+Underwater Maze -> Princess Peach', () => {
    const engine81 = new GameEngine(WORLD_8_1_LEVEL);
    assert.equal(engine81.currentLevel.widthCols, 280);
    assert.equal(engine81.currentLevel.timeLimit, 300);

    const engine82 = new GameEngine(WORLD_8_2_LEVEL);
    assert.equal(
      WORLD_8_2_LEVEL.enemies.some((e) => e.type === 'lakitu'),
      true
    );
    assert.equal(engine82.currentLevel.id, '8-2');

    const engine83 = new GameEngine(WORLD_8_3_LEVEL);
    assert.equal(
      WORLD_8_3_LEVEL.enemies.filter((e) => e.type === 'hammer-bro').length,
      8
    );
    assert.equal(engine83.currentLevel.id, '8-3');

    // World 8-4 Grand Finale Pipe-Maze + Underwater Castle + Real Bowser + Princess Peach
    const engine84 = new GameEngine(WORLD_8_4_LEVEL);
    assert.equal(engine84.currentLevel.goal.rescueNpc, 'princess-peach');
    assert.equal(
      WORLD_8_4_LEVEL.enemies.find((e) => e.type === 'bowser')?.bowserTrueForm,
      'real-bowser'
    );

    // 1. Entering decoy pipe at col 34 loops Mario back to col 6 in 'main'
    engine84.mario.x = 34 * TILE_SIZE + 8;
    engine84.mario.y = 8 * TILE_SIZE - engine84.mario.spriteHeight;
    engine84.mario.grounded = true;
    engine84.input.setVirtualButton('down', true);
    for (let i = 0; i < 70; i++) {
      engine84.stepPhysicsTick();
    }
    engine84.input.setVirtualButton('down', false);
    assert.equal(engine84.tilemapLoader.activeArea.areaId, 'main');
    assert.equal(Math.floor(engine84.mario.x / TILE_SIZE), 6);

    // 2. Entering correct pipe #1 at col 66 advances Mario to Chamber 2 (col 76)
    engine84.mario.x = 66 * TILE_SIZE + 8;
    engine84.mario.y = 8 * TILE_SIZE - engine84.mario.spriteHeight;
    engine84.mario.grounded = true;
    engine84.input.setVirtualButton('down', true);
    for (let i = 0; i < 70; i++) {
      engine84.stepPhysicsTick();
    }
    engine84.input.setVirtualButton('down', false);
    assert.equal(Math.floor(engine84.mario.x / TILE_SIZE), 76);

    // 3. Entering correct pipe #2 at col 116 warps Mario into '8-4-underwater'!
    engine84.mario.x = 116 * TILE_SIZE + 8;
    engine84.mario.y = 7 * TILE_SIZE - engine84.mario.spriteHeight;
    engine84.mario.grounded = true;
    engine84.input.setVirtualButton('down', true);
    for (let i = 0; i < 40; i++) {
      engine84.stepPhysicsTick();
    }
    engine84.input.setVirtualButton('down', false);
    assert.equal(engine84.tilemapLoader.activeArea.areaId, '8-4-underwater');
    assert.equal(engine84.mario.underwaterMode, true);
  });
});
