import type { MarioPowerState, FacingDirection } from '../types/physics-constants.ts';
import type { MarioPose } from '../entities/player/Mario.ts';
import { MARIO_PALETTES, type BiomePalette } from './NesPalette.ts';

/**
 * Pixel-accurate NES Sprite & Tile Renderer.
 * Uses 16-column character bitmaps where:
 * 'R' = hatAndShirt, 'B' = overallsAndHair, 'S' = skin, '.' = transparent
 */

const SMALL_IDLE_16X16 = [
  '....RRRRR.......',
  '...RRRRRRRRR....',
  '...BBBSSBS......',
  '..BSBSSSBS.....'.replace('', 'S'),
  '..BSBBSSSSBS....',
  '..BBSSSSBBBB....',
  '....SSSSSSS.....',
  '...BBRBBR.......',
  '..BBBRBBRBBB....',
  '.BBBBBBBBBBBB...',
  '.SSRBRSSRBRSS...',
  '.SSRRRRRRRRSS...',
  '.SSRRRRRRRRSS...',
  '...RRR..RRR.....',
  '..BBB....BBB....',
  '.BBBB....BBBB...',
];

const SMALL_WALK1_16X16 = [
  '....RRRRR.......',
  '...RRRRRRRRR....',
  '...BBBSSBS......',
  '..BSBSSSBS......',
  '..BSBBSSSSBS....',
  '..BBSSSSBBBB....',
  '....SSSSSSS.....',
  '...BBBBBR.......',
  '..BBBBBRRBBB....',
  '.BBBBBRRRRBBB...',
  '.SS..RRRRRRSS...',
  '.....RRRRRR.....',
  '....RRRRRRRR....',
  '...BBBB..RRR....',
  '..BBBB....BBB...',
  '..........BBBB..',
];

const SMALL_WALK2_16X16 = [
  '....RRRRR.......',
  '...RRRRRRRRR....',
  '...BBBSSBS......',
  '..BSBSSSBS......',
  '..BSBBSSSSBS....',
  '..BBSSSSBBBB....',
  '....SSSSSSS.....',
  '....BBRBBR......',
  '...BBBRBBRBB....',
  '...BBBBBBBBBB...',
  '...SSRBRSSRBS...',
  '...SSRRRRRRSS...',
  '....RRRRRRRR....',
  '....BBB..BBB....',
  '...BBBB..BBBB...',
  '................',
];

const SMALL_WALK3_16X16 = [
  '....RRRRR.......',
  '...RRRRRRRRR....',
  '...BBBSSBS......',
  '..BSBSSSBS......',
  '..BSBBSSSSBS....',
  '..BBSSSSBBBB....',
  '....SSSSSSS.....',
  '....BBRBB.......',
  '..SSRRRRRBBB....',
  '.SSRRRRRRRRBB...',
  '.SSRRRRRRRRSS...',
  '...RRRRRRRR.....',
  '..RRR..RRRRR....',
  '.BBB....BBBB....',
  '.BBBB....BBBB...',
  '................',
];

const SMALL_JUMP_16X16 = [
  '............SSS.',
  '....RRRRR...SSS.',
  '...RRRRRRRRRSS..',
  '...BBBSSBS..BB..',
  '..BSBSSSBS.BBB..',
  '..BSBBSSSSBBBB..',
  '..BBSSSSBBBBBB..',
  '....SSSSSSSBB...',
  '..BBBBBRBBRB....',
  '.BBBBBRRRBBR....',
  'SSBBBBRRRRRR....',
  'SS..RRRRRRRRB...',
  '....RRRRRRRRBB..',
  '...RRR...RRRBB..',
  '..BBB...........',
  '.BBBB...........',
];

const SMALL_SKID_16X16 = [
  '....RRRRR.......',
  '...RRRRRRRRR....',
  '...BBBSSBS......',
  '..BSBSSSBS......',
  '..BSBBSSSSBS....',
  '..BBSSSSBBBB....',
  '....SSSSSSS.....',
  '...BBRRRRBB.....',
  '..BBBRRRRRSSS...',
  '..BBBRRRRRRSS...',
  '...RRRRRRRRR....',
  '...RRRRRRRR.....',
  '....RRRRRRR.....',
  '...BBBB.BBBB....',
  '..BBBB...BBBB...',
  '................',
];

const SMALL_DEAD_16X16 = [
  '....RRRRR.......',
  '...RRRRRRRRR....',
  '...BBBSBSS......',
  '..BSBSBSBS......',
  '..BSBBSSSSBS....',
  '..BBSSSSBBBB....',
  '....SSSSSSS.....',
  '..SSRRRRRRSS....',
  '.SSRRRRRRRRSS...',
  '.BBRRRRRRRRBB...',
  '.BBBRRRRRRBBB...',
  '...RRRRRRRR.....',
  '..RRR....RRR....',
  '.BBBB....BBBB...',
  '.BBBB....BBBB...',
  '................',
];

export function drawMarioSprite(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  opts: {
    powerState: MarioPowerState;
    pose: MarioPose;
    facing: FacingDirection;
    starmanActive: boolean;
    starmanTick: number;
  }
): void {
  let scheme = MARIO_PALETTES[opts.powerState];
  if (opts.starmanActive) {
    const cycle = Math.floor(opts.starmanTick / 2) % 3;
    scheme =
      cycle === 0
        ? MARIO_PALETTES['star-1']
        : cycle === 1
        ? MARIO_PALETTES['star-2']
        : MARIO_PALETTES['star-3'];
  }

  let bitmap16: string[];
  switch (opts.pose) {
    case 'walk-1':
    case 'swim-1':
      bitmap16 = SMALL_WALK1_16X16;
      break;
    case 'walk-2':
    case 'climb-1':
      bitmap16 = SMALL_WALK2_16X16;
      break;
    case 'walk-3':
    case 'swim-2':
    case 'climb-2':
      bitmap16 = SMALL_WALK3_16X16;
      break;
    case 'jump':
    case 'throw':
      bitmap16 = SMALL_JUMP_16X16;
      break;
    case 'skid':
      bitmap16 = SMALL_SKID_16X16;
      break;
    case 'dead':
      bitmap16 = SMALL_DEAD_16X16;
      break;
    default:
      bitmap16 = SMALL_IDLE_16X16;
      break;
  }

  const isTall = opts.powerState === 'super' || opts.powerState === 'fire';
  if (!isTall) {
    drawBitmapGrid(ctx, bitmap16, screenX, screenY, opts.facing, scheme, 1, 1);
    return;
  }

  if (opts.pose === 'crouch') {
    // Crouching Super/Fire Mario occupies the lower 20px of his 32px frame
    drawBitmapGrid(
      ctx,
      SMALL_IDLE_16X16,
      screenX,
      screenY + 14,
      opts.facing,
      scheme,
      1,
      1
    );
    return;
  }

  // Tall 16×32 Super/Fire Mario: Head (rows 0..6) + Extended Torso/Overalls + Legs
  for (let r = 0; r < 32; r++) {
    // Map 32 vertical rows cleanly from the 16-row canonical sprite with detailed overall buttons
    const srcRow = Math.min(15, Math.floor(r / 2));
    const rowStr = bitmap16[srcRow] ?? '................';
    for (let c = 0; c < 16; c++) {
      const ch = rowStr[c];
      if (!ch || ch === '.') continue;
      const drawCol = opts.facing === 1 ? c : 15 - c;
      ctx.fillStyle =
        ch === 'R'
          ? scheme.hatAndShirt
          : ch === 'B'
          ? scheme.overallsAndHair
          : scheme.skin;
      ctx.fillRect(screenX + drawCol, screenY + r, 1, 1);
    }
  }
}

function drawBitmapGrid(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x: number,
  y: number,
  facing: FacingDirection,
  scheme: { hatAndShirt: string; overallsAndHair: string; skin: string },
  scaleX = 1,
  scaleY = 1
): void {
  for (let r = 0; r < rows.length; r++) {
    const rowStr = rows[r];
    for (let c = 0; c < 16; c++) {
      const ch = rowStr[c];
      if (!ch || ch === '.') continue;
      const drawCol = facing === 1 ? c : 15 - c;
      ctx.fillStyle =
        ch === 'R'
          ? scheme.hatAndShirt
          : ch === 'B'
          ? scheme.overallsAndHair
          : scheme.skin;
      ctx.fillRect(x + drawCol * scaleX, y + r * scaleY, scaleX, scaleY);
    }
  }
}

/**
 * Draw any 16×16 Tile on the NES Canvas at (screenX, screenY)
 */
export function drawTile16x16(
  ctx: CanvasRenderingContext2D,
  tileChar: string,
  screenX: number,
  screenY: number,
  palette: BiomePalette,
  animFrame: number
): void {
  switch (tileChar) {
    case '#': {
      // Cracked NES Ground cobblestone block
      ctx.fillStyle = palette.groundPrimary;
      ctx.fillRect(screenX, screenY, 16, 16);
      ctx.fillStyle = palette.groundHighlight;
      ctx.fillRect(screenX, screenY, 15, 1);
      ctx.fillRect(screenX, screenY, 1, 15);
      ctx.fillRect(screenX + 1, screenY + 10, 9, 1);
      ctx.fillStyle = palette.groundShadow;
      ctx.fillRect(screenX + 10, screenY, 1, 10);
      ctx.fillRect(screenX, screenY + 9, 16, 1);
      ctx.fillRect(screenX + 5, screenY + 10, 1, 6);
      ctx.fillRect(screenX + 15, screenY, 1, 16);
      ctx.fillRect(screenX, screenY + 15, 16, 1);
      break;
    }

    case 'B': {
      // Breakable / Bumpable Brick Pattern
      ctx.fillStyle = palette.brickPrimary;
      ctx.fillRect(screenX, screenY, 16, 16);
      ctx.fillStyle = palette.groundHighlight;
      ctx.fillRect(screenX, screenY, 16, 1);
      ctx.fillStyle = palette.brickMortar;
      for (let y = 3; y < 16; y += 4) {
        ctx.fillRect(screenX, screenY + y, 16, 1);
      }
      ctx.fillRect(screenX + 7, screenY, 1, 4);
      ctx.fillRect(screenX + 3, screenY + 4, 1, 4);
      ctx.fillRect(screenX + 11, screenY + 4, 1, 4);
      ctx.fillRect(screenX + 7, screenY + 8, 1, 4);
      ctx.fillRect(screenX + 3, screenY + 12, 1, 4);
      ctx.fillRect(screenX + 11, screenY + 12, 1, 4);
      break;
    }

    case '?': {
      // Shimmering Question Block
      const colorIdx = Math.floor(animFrame / 10) % 3;
      ctx.fillStyle = palette.questionColors[colorIdx];
      ctx.fillRect(screenX, screenY, 16, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX, screenY, 16, 1);
      ctx.fillRect(screenX, screenY + 15, 16, 1);
      ctx.fillRect(screenX, screenY, 1, 16);
      ctx.fillRect(screenX + 15, screenY, 1, 16);
      // Corner rivets
      ctx.fillRect(screenX + 2, screenY + 2, 1, 1);
      ctx.fillRect(screenX + 13, screenY + 2, 1, 1);
      ctx.fillRect(screenX + 2, screenY + 13, 1, 1);
      ctx.fillRect(screenX + 13, screenY + 13, 1, 1);
      // Question Mark "?" glyph
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + 6, screenY + 4, 5, 2);
      ctx.fillRect(screenX + 9, screenY + 6, 2, 3);
      ctx.fillRect(screenX + 7, screenY + 8, 2, 2);
      ctx.fillRect(screenX + 7, screenY + 11, 2, 2);
      ctx.fillStyle = '#FCBCB0';
      ctx.fillRect(screenX + 5, screenY + 3, 5, 2);
      ctx.fillRect(screenX + 8, screenY + 5, 2, 3);
      ctx.fillRect(screenX + 6, screenY + 7, 2, 2);
      ctx.fillRect(screenX + 6, screenY + 10, 2, 2);
      break;
    }

    case 'M': {
      // Empty Metal Used Block
      ctx.fillStyle = '#887000';
      ctx.fillRect(screenX, screenY, 16, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX, screenY, 16, 1);
      ctx.fillRect(screenX, screenY + 15, 16, 1);
      ctx.fillRect(screenX, screenY, 1, 16);
      ctx.fillRect(screenX + 15, screenY, 1, 16);
      ctx.fillRect(screenX + 2, screenY + 2, 1, 1);
      ctx.fillRect(screenX + 13, screenY + 2, 1, 1);
      ctx.fillRect(screenX + 2, screenY + 13, 1, 1);
      ctx.fillRect(screenX + 13, screenY + 13, 1, 1);
      break;
    }

    case 'X': {
      // Indestructible Chiseled Staircase Block
      ctx.fillStyle = palette.groundPrimary;
      ctx.fillRect(screenX, screenY, 16, 16);
      ctx.fillStyle = palette.groundHighlight;
      ctx.fillRect(screenX, screenY, 15, 2);
      ctx.fillRect(screenX, screenY, 2, 15);
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + 14, screenY, 2, 16);
      ctx.fillRect(screenX, screenY + 14, 16, 2);
      ctx.fillRect(screenX + 4, screenY + 4, 8, 8);
      ctx.fillStyle = palette.groundPrimary;
      ctx.fillRect(screenX + 5, screenY + 5, 6, 6);
      break;
    }

    case 'P':
    case 'p': {
      // Warp Pipe Lip (Top-Left 'P', Top-Right 'p')
      const isLeft = tileChar === 'P';
      ctx.fillStyle = palette.pipePrimary;
      ctx.fillRect(screenX, screenY, 16, 16);
      ctx.fillStyle = palette.pipeHighlight;
      if (isLeft) {
        ctx.fillRect(screenX + 2, screenY + 1, 4, 14);
        ctx.fillRect(screenX + 8, screenY + 1, 2, 14);
      } else {
        ctx.fillRect(screenX + 2, screenY + 1, 2, 14);
      }
      ctx.fillStyle = palette.pipeDark;
      if (!isLeft) {
        ctx.fillRect(screenX + 10, screenY + 1, 4, 14);
      }
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX, screenY, 16, 1);
      ctx.fillRect(screenX, screenY + 15, 16, 1);
      if (isLeft) ctx.fillRect(screenX, screenY, 1, 16);
      else ctx.fillRect(screenX + 15, screenY, 1, 16);
      break;
    }

    case '[':
    case ']': {
      // Warp Pipe Shaft Body (Left '[', Right ']')
      const isLeft = tileChar === '[';
      const offsetX = isLeft ? 2 : 0;
      const width = 14;
      ctx.fillStyle = palette.pipePrimary;
      ctx.fillRect(screenX + offsetX, screenY, width, 16);
      ctx.fillStyle = palette.pipeHighlight;
      if (isLeft) {
        ctx.fillRect(screenX + 4, screenY, 4, 16);
        ctx.fillRect(screenX + 10, screenY, 2, 16);
      } else {
        ctx.fillRect(screenX + 2, screenY, 2, 16);
      }
      ctx.fillStyle = palette.pipeDark;
      if (!isLeft) {
        ctx.fillRect(screenX + 8, screenY, 4, 16);
      }
      ctx.fillStyle = '#000000';
      if (isLeft) ctx.fillRect(screenX + 2, screenY, 1, 16);
      else ctx.fillRect(screenX + 13, screenY, 1, 16);
      break;
    }

    case 'C': {
      // Floating Spinning Coin
      const phase = Math.floor(animFrame / 8) % 3;
      const coinColor = palette.questionColors[phase];
      ctx.fillStyle = coinColor;
      ctx.fillRect(screenX + 5, screenY + 2, 6, 12);
      ctx.fillStyle = '#FCBCB0';
      ctx.fillRect(screenX + 6, screenY + 3, 2, 10);
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + 8, screenY + 4, 1, 8);
      break;
    }

    case 'F': {
      // Flagpole Rod
      ctx.fillStyle = '#80D010';
      ctx.fillRect(screenX + 7, screenY, 2, 16);
      break;
    }

    case 'G': {
      // Flagpole Top Ball
      ctx.fillStyle = '#80D010';
      ctx.fillRect(screenX + 7, screenY + 6, 2, 10);
      ctx.fillStyle = '#00A800';
      ctx.fillRect(screenX + 4, screenY + 2, 8, 8);
      ctx.fillStyle = '#80D010';
      ctx.fillRect(screenX + 5, screenY + 3, 4, 4);
      break;
    }

    case 'L': {
      // Lava / Water Surface
      ctx.fillStyle = '#D82800';
      ctx.fillRect(screenX, screenY + 4, 16, 12);
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(screenX, screenY + 4, 16, 2);
      break;
    }

    case 'l': {
      ctx.fillStyle = '#D82800';
      ctx.fillRect(screenX, screenY, 16, 16);
      break;
    }

    default:
      break;
  }
}
