import { NES_WIDTH, NES_HEIGHT } from '../types/physics-constants.ts';
import type { InputManager } from '../core/InputManager.ts';

export type GameScreenState =
  | 'title'
  | 'world-intro'
  | 'playing'
  | 'time-up'
  | 'game-over'
  | 'quest-complete';

const TOP_SCORE_STORAGE_KEY = 'smb1985_top_score';

/**
 * Manages the authentic 1985 NES Super Mario Bros. Screen State Machine:
 * - `'title'`: Embossed SUPER MARIO BROS. banner, 1/2 Player selector, Top Score, World Selector (after clearing 8-4), and Attract-Mode Demo auto-runner.
 * - `'world-intro'`: Black interstitial screen showing `WORLD X-Y` and `Mario x [Lives]`.
 * - `'playing'`: Active stage gameplay.
 * - `'time-up'`: Black interstitial `TIME UP` screen when the 400/300 timer expires.
 * - `'game-over'`: Black interstitial `GAME OVER` screen when all lives are lost.
 * - `'quest-complete'`: Princess Peach 8-4 ending ceremony that unlocks the Second Quest (Hard Mode).
 */
export class GameScreenStateMachine {
  public state: GameScreenState = 'playing';
  public selectedPlayerCount: 1 | 2 = 1;
  public topScore = 0;
  public stateTimerFrames = 0;
  public titleIdleFrames = 0;
  public demoActive = false;
  public newQuestUnlocked = false;
  public selectedStartWorld: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = 1;

  constructor(initialState: GameScreenState = 'playing') {
    this.state = initialState;
    this.topScore = this.loadPersistedTopScore();
  }

  private loadPersistedTopScore(): number {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(TOP_SCORE_STORAGE_KEY);
        if (raw) {
          const parsed = Number.parseInt(raw, 10);
          if (Number.isFinite(parsed) && parsed > 0) return parsed;
        }
      }
    } catch {
      // Ignore storage access errors in headless/sandboxed environments
    }
    return 0;
  }

  public updateTopScore(currentScore: number): void {
    if (currentScore > this.topScore) {
      this.topScore = currentScore;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(TOP_SCORE_STORAGE_KEY, String(this.topScore));
        }
      } catch {
        // Ignore storage errors
      }
    }
  }

  public enterTitleScreen(): void {
    this.state = 'title';
    this.stateTimerFrames = 0;
    this.titleIdleFrames = 0;
    this.demoActive = false;
  }

  public enterWorldIntro(durationFrames = 120): void {
    this.state = 'world-intro';
    this.stateTimerFrames = durationFrames;
    this.demoActive = false;
  }

  public enterPlaying(): void {
    this.state = 'playing';
    this.stateTimerFrames = 0;
    this.demoActive = false;
  }

  public enterTimeUp(durationFrames = 120): void {
    this.state = 'time-up';
    this.stateTimerFrames = durationFrames;
  }

  public enterGameOver(durationFrames = 180): void {
    this.state = 'game-over';
    this.stateTimerFrames = durationFrames;
  }

  public enterQuestComplete(durationFrames = 300): void {
    this.state = 'quest-complete';
    this.stateTimerFrames = durationFrames;
    this.newQuestUnlocked = true;
  }

  /**
   * Feeds scripted NES inputs into `InputManager` during Title Screen Attract Mode Demo.
   */
  public applyAttractDemoInputs(input: InputManager, demoFrame: number): void {
    input.setVirtualButton('left', false);
    input.setVirtualButton('down', false);
    input.setVirtualButton('right', true);
    input.setVirtualButton('runB', demoFrame > 60);

    // Jump over first Goomba & hit Question blocks at frames 35..55, 110..132, 185..210, 260..285
    const shouldJump =
      (demoFrame >= 35 && demoFrame <= 55) ||
      (demoFrame >= 110 && demoFrame <= 132) ||
      (demoFrame >= 185 && demoFrame <= 210) ||
      (demoFrame >= 260 && demoFrame <= 285);
    input.setVirtualButton('jumpA', shouldJump);
  }

  public clearAttractDemoInputs(input: InputManager): void {
    input.setVirtualButton('left', false);
    input.setVirtualButton('right', false);
    input.setVirtualButton('down', false);
    input.setVirtualButton('jumpA', false);
    input.setVirtualButton('runB', false);
  }

  /**
   * Renders the Title Screen banner, World/Lives interstitial, Time Up, Game Over, or Quest Complete overlay.
   */
  public renderOverlay(
    ctx: CanvasRenderingContext2D,
    worldLabel: string,
    lives: number
  ): void {
    if (this.state === 'playing') return;

    if (this.state === 'title') {
      this.renderTitleScreenOverlay(ctx);
      return;
    }

    if (this.state === 'quest-complete') {
      this.renderQuestCompleteOverlay(ctx);
      return;
    }

    // Black Interstitial Screen ('world-intro', 'time-up', 'game-over')
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 32, NES_WIDTH, NES_HEIGHT - 32);

    ctx.font = 'bold 8px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FCFCFC';

    if (this.state === 'world-intro') {
      ctx.fillText(`WORLD  ${worldLabel}`, 88, 92);

      // Mini Mario Icon + "x  [Lives]"
      ctx.fillStyle = '#D82800';
      ctx.fillRect(96, 118, 12, 4);
      ctx.fillStyle = '#FCA044';
      ctx.fillRect(96, 122, 12, 5);
      ctx.fillStyle = '#D82800';
      ctx.fillRect(96, 127, 12, 6);

      ctx.fillStyle = '#FCFCFC';
      ctx.fillText(`x   ${lives}`, 118, 121);
      if (this.newQuestUnlocked) {
        ctx.fillStyle = '#FCA044';
        ctx.fillText('SECOND QUEST · HARD MODE', 52, 152);
      }
      return;
    }

    if (this.state === 'time-up') {
      ctx.fillText('TIME UP', 100, 116);
      return;
    }

    if (this.state === 'game-over') {
      ctx.fillText('GAME OVER', 92, 116);
    }
  }

  private renderTitleScreenOverlay(ctx: CanvasRenderingContext2D): void {
    // 1. Classic Embossed Maroon & Tan Signboard (X=40, Y=36, W=176, H=88)
    ctx.fillStyle = '#000000';
    ctx.fillRect(42, 38, 176, 88);
    ctx.fillStyle = '#C84C0C';
    ctx.fillRect(40, 36, 176, 88);
    ctx.fillStyle = '#FCA044';
    ctx.fillRect(42, 38, 172, 2);
    ctx.fillRect(42, 38, 2, 84);

    // Corner rivets
    ctx.fillStyle = '#FC9838';
    ctx.fillRect(44, 40, 4, 4);
    ctx.fillRect(208, 40, 4, 4);
    ctx.fillRect(44, 116, 4, 4);
    ctx.fillRect(208, 116, 4, 4);

    // Title Typography
    ctx.font = 'bold 16px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    ctx.fillText('SUPER', 54, 48);
    ctx.fillText('MARIO BROS.', 54, 72);

    ctx.fillStyle = '#FCFCFC';
    ctx.fillText('SUPER', 52, 46);
    ctx.fillText('MARIO BROS.', 52, 70);

    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#FCA044';
    ctx.fillText('©1985 NINTENDO', 116, 128);

    // 2. 1 / 2 Player Selector & Top Score
    ctx.fillStyle = '#FCFCFC';
    ctx.fillText('1 PLAYER GAME', 76, 148);
    ctx.fillText('2 PLAYER GAME', 76, 164);

    const cursorY = this.selectedPlayerCount === 1 ? 148 : 164;
    ctx.fillStyle = '#FC9838';
    ctx.fillRect(62, cursorY + 1, 7, 7);
    ctx.fillStyle = '#D82800';
    ctx.fillRect(63, cursorY + 2, 5, 3);

    const topScoreStr = String(this.topScore).padStart(6, '0');
    ctx.fillStyle = '#FCFCFC';
    ctx.fillText(`TOP- ${topScoreStr}`, 84, 184);

    if (this.newQuestUnlocked) {
      ctx.fillStyle = '#80D010';
      ctx.fillText(`B: SELECT WORLD ${this.selectedStartWorld}-1`, 68, 198);
    }

    if (this.demoActive) {
      ctx.fillStyle = '#FCA044';
      ctx.fillText('DEMO PLAY · PRESS ENTER/START', 38, 212);
    }
  }

  private renderQuestCompleteOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.font = 'bold 8px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FCFCFC';
    ctx.fillText('THANK YOU MARIO!', 64, 68);
    ctx.fillText('YOUR QUEST IS OVER.', 52, 86);
    ctx.fillText('WE PRESENT YOU A NEW QUEST.', 24, 104);
    ctx.fillStyle = '#FCA044';
    ctx.fillText('PUSH BUTTON B', 76, 124);
    ctx.fillText('TO SELECT A WORLD', 60, 138);
  }
}
