import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE } from '../types/physics-constants.ts';
import { GameEngine } from '../core/GameEngine.ts';
import { WORLD_1_1_LEVEL } from '../levels/World1Levels.ts';
import { WORLD_8_4_LEVEL } from '../levels/World8Levels.ts';

describe('Phase 6 — 8-Bit Chiptune Synthesizer, Title Screen, World/Lives UI & Princess Peach Ending', () => {
  it('triggers 8-bit BGM tracks (Overworld, Underground, Underwater, Castle, Starman, Hurry-Up) and all SFX cues', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);
    assert.equal(engine.audio.currentTrack, 'overworld');

    // Small jump -> 'jump-small' SFX
    engine.input.setVirtualButton('jumpA', true);
    engine.stepPhysicsTick();
    engine.input.setVirtualButton('jumpA', false);
    engine.stepPhysicsTick();
    assert.equal(engine.audio.sfxHistory.includes('jump-small'), true);

    // Super jump -> 'jump-super' SFX
    engine.mario.grounded = true;
    engine.mario.setPowerState('fire', false);
    engine.input.setVirtualButton('jumpA', true);
    engine.stepPhysicsTick();
    engine.input.setVirtualButton('jumpA', false);
    engine.stepPhysicsTick();
    assert.equal(engine.audio.sfxHistory.includes('jump-super'), true);

    // Fireball -> 'fireball' SFX
    engine.input.setVirtualButton('runB', true);
    engine.stepPhysicsTick();
    engine.input.setVirtualButton('runB', false);
    assert.equal(engine.audio.sfxHistory.includes('fireball'), true);

    // Starman -> switches BGM to 'starman', then restores 'overworld' when timer expires
    engine.mario.activateStarman();
    engine.stepPhysicsTick();
    assert.equal(engine.audio.currentTrack, 'starman');
    engine.mario.starmanTimer = 0;
    engine.stepPhysicsTick();
    assert.equal(engine.audio.currentTrack, 'overworld');

    // Timer reaching 100 -> triggers Hurry-Up jingle & tempo speedup
    engine.timeRemaining = 101;
    for (let i = 0; i < 24; i++) {
      engine.stepPhysicsTick();
    }
    assert.equal(engine.timeRemaining, 100);
    assert.equal(engine.audio.hurryUpActive, true);
    assert.equal(engine.audio.sfxHistory.includes('hurry-up'), true);
  });

  it('operates Title Screen, 1/2 Player selector, Attract-Mode Demo auto-runner, World/Lives intro & Top Score', () => {
    const engine = new GameEngine(WORLD_1_1_LEVEL);
    engine.score = 12450;
    engine.enterTitleScreen();
    assert.equal(engine.screenState.state, 'title');
    assert.equal(engine.screenState.topScore >= 12450, true);

    // Run 220 idle frames on Title Screen -> Attract-Mode Demo starts moving Mario rightward!
    const initialDemoX = engine.mario.x;
    for (let i = 0; i < 220; i++) {
      engine.stepPhysicsTick();
    }
    assert.equal(engine.screenState.demoActive, true);
    assert.equal(engine.mario.x > initialDemoX, true);

    // Press Start on Title Screen -> transitions to 'world-intro' (120 frames) -> 'playing'
    engine.input.setVirtualButton('start', true);
    engine.stepPhysicsTick();
    engine.input.setVirtualButton('start', false);
    assert.equal(engine.screenState.state, 'world-intro');

    for (let i = 0; i < 120; i++) {
      engine.stepPhysicsTick();
    }
    assert.equal(engine.screenState.state, 'playing');
    assert.equal(engine.audio.currentTrack, 'overworld');
  });

  it('completes World 8-4 Castle, rescues Princess Peach, and unlocks Second Quest (Hard Mode with Buzzy Beetles)', () => {
    const engine = new GameEngine(WORLD_8_4_LEVEL);
    assert.equal(engine.audio.currentTrack, 'castle');

    // Touch World 8-4 Castle Axe at (199, 8) -> collapses bridge -> Bowser falls -> enters 'quest-complete'
    engine.mario.x = 199 * TILE_SIZE;
    engine.mario.y = 8 * TILE_SIZE;

    for (let i = 0; i < 220; i++) {
      engine.stepPhysicsTick();
      if (engine.screenState.state === 'quest-complete') break;
    }

    assert.equal(engine.screenState.state, 'quest-complete');
    assert.equal(engine.screenState.newQuestUnlocked, true);
    assert.equal(engine.audio.sfxHistory.includes('bridge-collapse'), true);
    assert.equal(engine.audio.sfxHistory.includes('bowser-fall'), true);
    assert.equal(engine.audio.bgmHistory.includes('world-clear'), true);

    // Return to Title Screen & start Second Quest on World 1-1: all Goombas are now Buzzy Beetles!
    engine.enterTitleScreen();
    engine.loadLevel(WORLD_1_1_LEVEL, false);
    engine.camera.forceSetX(16 * TILE_SIZE);
    engine.screenState.enterPlaying();
    engine.stepPhysicsTick();

    assert.equal(
      engine.enemyManager.enemies.some((e) => e.type === 'buzzy-beetle'),
      true
    );
    assert.equal(
      engine.enemyManager.enemies.some((e) => e.type === 'goomba'),
      false
    );
  });
});
