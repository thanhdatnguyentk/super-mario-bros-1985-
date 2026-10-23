import { NES_WIDTH, NES_HEIGHT } from './types/physics-constants.ts';
import { GameEngine } from './core/GameEngine.ts';
import type { NesButton } from './core/InputManager.ts';

function bootstrap(): void {
  const canvas = document.getElementById('nes-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    throw new Error('Missing #nes-canvas element');
  }
  canvas.width = NES_WIDTH;
  canvas.height = NES_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D rendering context');
  }
  ctx.imageSmoothingEnabled = false;

  const engine = new GameEngine();

  // Bind Live Sub-Pixel Physics Telemetry Panel
  const elPos = document.getElementById('tel-pos');
  const elVel = document.getElementById('tel-vel');
  const elState = document.getElementById('tel-state');
  const elJump = document.getElementById('tel-jump');
  const elCam = document.getElementById('tel-cam');
  const elFire = document.getElementById('tel-fire');

  engine.setTelemetryCallback((t) => {
    if (elPos) {
      elPos.textContent = `${t.xPx}, ${t.yPx} px (sub: 0x${t.xSub.toString(16).toUpperCase()})`;
    }
    if (elVel) {
      elVel.textContent = `vx: ${t.vxPx.toFixed(2)} | vy: ${t.vyPx.toFixed(2)} px/f`;
    }
    if (elState) {
      elState.textContent = `${t.powerState} · ${t.pose}${t.skidding ? ' [SKID]' : ''}`;
    }
    if (elJump) {
      elJump.textContent = `${t.jumpBracket} (${t.grounded ? 'GROUND' : 'AIR'})`;
    }
    if (elCam) {
      elCam.textContent = `${t.cameraX} px (One-Way →)`;
    }
    if (elFire) {
      elFire.textContent = `${t.activeFireballs} / 2`;
    }
  });

  // Bind Quick-Test Toolbar & Touch Gamepad Buttons
  const bindActionBtn = (id: string, cb: () => void) => {
    const btn = document.getElementById(id);
    btn?.addEventListener('click', () => {
      cb();
      canvas.focus();
    });
  };

  bindActionBtn('btn-title', () => engine.enterTitleScreen());
  const btnAudio = document.getElementById('btn-audio');
  bindActionBtn('btn-audio', () => {
    engine.audio.muted = !engine.audio.muted;
    if (btnAudio) {
      btnAudio.textContent = engine.audio.muted
        ? '8-Bit Audio: OFF'
        : '8-Bit Audio: ON';
    }
  });
  bindActionBtn('btn-small', () => engine.mario.setPowerState('small', false));
  bindActionBtn('btn-super', () => engine.mario.setPowerState('super', true));
  bindActionBtn('btn-fire', () => engine.mario.setPowerState('fire', true));
  bindActionBtn('btn-star', () => engine.mario.activateStarman());
  bindActionBtn('btn-water', () => {
    engine.mario.underwaterMode = !engine.mario.underwaterMode;
  });
  bindActionBtn('btn-reset', () => engine.loadLevel(engine.currentLevel, false));

  // Populate & bind Stage Selector dropdown from LevelManager
  const stageSelect = document.getElementById(
    'stage-select'
  ) as HTMLSelectElement | null;
  if (stageSelect) {
    for (const id of engine.levelManager.getRegisteredLevelIds()) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `World ${id}`;
      stageSelect.appendChild(opt);
    }
    stageSelect.value = engine.currentLevel.id;
    stageSelect.addEventListener('change', () => {
      engine.loadLevelById(stageSelect.value, false);
      canvas.focus();
    });
  }

  // Virtual D-Pad / A / B touch buttons
  const virtualMap: Array<[string, NesButton]> = [
    ['vbtn-left', 'left'],
    ['vbtn-right', 'right'],
    ['vbtn-down', 'down'],
    ['vbtn-jump', 'jumpA'],
    ['vbtn-run', 'runB'],
  ];

  for (const [id, nesBtn] of virtualMap) {
    const el = document.getElementById(id);
    if (!el) continue;
    const press = (e: Event) => {
      e.preventDefault();
      engine.input.setVirtualButton(nesBtn, true);
    };
    const release = (e: Event) => {
      e.preventDefault();
      engine.input.setVirtualButton(nesBtn, false);
    };
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', release);
    el.addEventListener('pointercancel', release);
  }

  engine.startLoop(ctx);
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootstrap);
}
