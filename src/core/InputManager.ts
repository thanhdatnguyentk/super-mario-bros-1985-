/**
 * NES Controller Button Mapping + Debug Test Keys
 * - D-Pad: Left, Right, Up, Down (Arrow keys / WASD)
 * - Button A (Jump / Swim): Space, Z, K
 * - Button B (Run / Fireball): Shift, X, J
 * - Start (Pause / Start): Enter
 * - Debug Power State Keys: [1] Small, [2] Super, [3] Fire, [I] Starman, [R] Reset
 */

export type NesButton =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'jumpA'
  | 'runB'
  | 'start'
  | 'select'
  | 'debugSmall'
  | 'debugSuper'
  | 'debugFire'
  | 'debugStar'
  | 'debugReset';

const KEY_TO_BUTTON: Record<string, NesButton> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'jumpA',
  KeyZ: 'jumpA',
  KeyK: 'jumpA',
  ShiftLeft: 'runB',
  ShiftRight: 'runB',
  KeyX: 'runB',
  KeyJ: 'runB',
  Enter: 'start',
  Tab: 'select',
  Digit1: 'debugSmall',
  Digit2: 'debugSuper',
  Digit3: 'debugFire',
  KeyI: 'debugStar',
  KeyR: 'debugReset',
};

export class InputManager {
  private currentRawHeld = new Set<NesButton>();
  private frameHeld = new Set<NesButton>();
  private previousFrameHeld = new Set<NesButton>();
  private virtualHeld = new Set<NesButton>();
  private boundKeyDown?: (e: KeyboardEvent) => void;
  private boundKeyUp?: (e: KeyboardEvent) => void;
  private boundBlur?: () => void;

  public attachWindowListeners(): void {
    if (typeof window === 'undefined') return;

    this.boundKeyDown = (e: KeyboardEvent) => {
      const btn = KEY_TO_BUTTON[e.code];
      if (btn) {
        if (
          e.code === 'Space' ||
          e.code.startsWith('Arrow') ||
          e.code === 'Tab'
        ) {
          e.preventDefault();
        }
        this.currentRawHeld.add(btn);
      }
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      const btn = KEY_TO_BUTTON[e.code];
      if (btn) {
        this.currentRawHeld.delete(btn);
      }
    };

    this.boundBlur = () => {
      this.currentRawHeld.clear();
      this.virtualHeld.clear();
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);
  }

  public detachWindowListeners(): void {
    if (typeof window === 'undefined') return;
    if (this.boundKeyDown) {
      window.removeEventListener('keydown', this.boundKeyDown);
    }
    if (this.boundKeyUp) {
      window.removeEventListener('keyup', this.boundKeyUp);
    }
    if (this.boundBlur) {
      window.removeEventListener('blur', this.boundBlur);
    }
  }

  /** Programmatic button state injection (for automated tests and touch controls) */
  public setVirtualButton(button: NesButton, pressed: boolean): void {
    if (pressed) {
      this.virtualHeld.add(button);
    } else {
      this.virtualHeld.delete(button);
    }
  }

  /**
   * Poll hardware/virtual inputs once at the start of every 60 FPS physics tick.
   */
  public pollFrame(): void {
    this.previousFrameHeld = new Set(this.frameHeld);
    this.frameHeld.clear();

    for (const btn of this.currentRawHeld) {
      this.frameHeld.add(btn);
    }
    for (const btn of this.virtualHeld) {
      this.frameHeld.add(btn);
    }

    // Poll HTML5 Gamepad API if connected
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const pad = pads[0];
      if (pad) {
        if (pad.buttons[14]?.pressed || (pad.axes[0] ?? 0) < -0.4) {
          this.frameHeld.add('left');
        }
        if (pad.buttons[15]?.pressed || (pad.axes[0] ?? 0) > 0.4) {
          this.frameHeld.add('right');
        }
        if (pad.buttons[12]?.pressed || (pad.axes[1] ?? 0) < -0.4) {
          this.frameHeld.add('up');
        }
        if (pad.buttons[13]?.pressed || (pad.axes[1] ?? 0) > 0.4) {
          this.frameHeld.add('down');
        }
        if (pad.buttons[0]?.pressed) {
          this.frameHeld.add('jumpA');
        }
        if (pad.buttons[2]?.pressed || pad.buttons[1]?.pressed) {
          this.frameHeld.add('runB');
        }
        if (pad.buttons[9]?.pressed) {
          this.frameHeld.add('start');
        }
      }
    }
  }

  public isHeld(button: NesButton): boolean {
    return this.frameHeld.has(button);
  }

  public isJustPressed(button: NesButton): boolean {
    return this.frameHeld.has(button) && !this.previousFrameHeld.has(button);
  }

  public isJustReleased(button: NesButton): boolean {
    return !this.frameHeld.has(button) && this.previousFrameHeld.has(button);
  }

  public resetAll(): void {
    this.currentRawHeld.clear();
    this.frameHeld.clear();
    this.previousFrameHeld.clear();
    this.virtualHeld.clear();
  }
}
