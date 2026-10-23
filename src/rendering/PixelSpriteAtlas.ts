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

    case '=': {
      // Castle / Athletic Bridge Deck
      ctx.fillStyle = '#D82800';
      ctx.fillRect(screenX, screenY, 16, 4);
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(screenX + 2, screenY + 4, 4, 10);
      ctx.fillRect(screenX + 10, screenY + 4, 4, 10);
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX, screenY + 3, 16, 1);
      break;
    }

    case 'R': {
      // Bridge Chain / Rope
      ctx.fillStyle = '#FC9838';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(screenX + 10 - i * 3, screenY + i * 4, 4, 3);
      }
      break;
    }

    case 'A': {
      // Castle Axe (Bowser Bridge Collapse Trigger)
      const flash = Math.floor(animFrame / 6) % 2 === 0;
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(screenX + 7, screenY + 4, 2, 12);
      ctx.fillStyle = flash ? '#FCFCFC' : '#D82800';
      ctx.fillRect(screenX + 2, screenY + 2, 12, 7);
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + 6, screenY + 4, 4, 3);
      break;
    }

    case 'b': {
      // Bullet Bill Cannon Top (Skull Turret)
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + 1, screenY, 14, 16);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(screenX + 3, screenY + 2, 10, 12);
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + 5, screenY + 4, 6, 6);
      break;
    }

    case 'c': {
      // Bullet Bill Cannon Base
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + 2, screenY, 12, 16);
      ctx.fillStyle = '#7C7C7C';
      ctx.fillRect(screenX + 4, screenY + 2, 8, 12);
      break;
    }

    default:
      break;
  }
}

export type RenderableItemKind =
  | 'super-mushroom'
  | 'fire-flower'
  | 'starman'
  | 'one-up';

/**
 * Render 16×16 NES Power-Up Item Sprites (Super Mushroom, 1-Up Mushroom, Fire Flower, Starman).
 */
export function drawPowerUpItemSprite(
  ctx: CanvasRenderingContext2D,
  kind: RenderableItemKind,
  screenX: number,
  screenY: number,
  animFrame: number
): void {
  const x = Math.round(screenX);
  const y = Math.round(screenY);

  if (kind === 'super-mushroom' || kind === 'one-up') {
    const capMain = kind === 'super-mushroom' ? '#D82800' : '#00A800';
    const capSpot = kind === 'super-mushroom' ? '#FC9838' : '#FCFCFC';
    const stemSkin = '#FC9838';

    // Rounded Mushroom Cap (top 10px)
    ctx.fillStyle = capMain;
    ctx.fillRect(x + 4, y + 1, 8, 2);
    ctx.fillRect(x + 2, y + 3, 12, 3);
    ctx.fillRect(x + 1, y + 6, 14, 4);

    // Classic NES Mushroom Spots
    ctx.fillStyle = capSpot;
    ctx.fillRect(x + 3, y + 3, 3, 3);
    ctx.fillRect(x + 10, y + 3, 3, 3);
    ctx.fillRect(x + 6, y + 6, 4, 3);

    // Stem & Eyes (bottom 5px)
    ctx.fillStyle = stemSkin;
    ctx.fillRect(x + 4, y + 10, 8, 5);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 6, y + 11, 1, 2);
    ctx.fillRect(x + 9, y + 11, 1, 2);
    return;
  }

  if (kind === 'fire-flower') {
    const phase = Math.floor(animFrame / 4) % 4;
    const outerColors = ['#D82800', '#FC9838', '#FCFCFC', '#80D010'];
    const innerColors = ['#FC9838', '#FCFCFC', '#D82800', '#FC9838'];

    // Flower Head Outer Ring
    ctx.fillStyle = outerColors[phase];
    ctx.fillRect(x + 3, y + 1, 10, 8);
    ctx.fillRect(x + 2, y + 2, 12, 6);

    // Flower Head Inner Ring
    ctx.fillStyle = innerColors[phase];
    ctx.fillRect(x + 5, y + 3, 6, 4);

    // White Center Core
    ctx.fillStyle = '#FCFCFC';
    ctx.fillRect(x + 6, y + 4, 4, 2);

    // Green Stem & Side Leaves
    ctx.fillStyle = '#00A800';
    ctx.fillRect(x + 7, y + 9, 2, 6);
    ctx.fillStyle = '#80D010';
    ctx.fillRect(x + 3, y + 11, 3, 2);
    ctx.fillRect(x + 10, y + 11, 3, 2);
    return;
  }

  if (kind === 'starman') {
    const phase = Math.floor(animFrame / 2) % 4;
    const bodyColors = ['#FC9838', '#FCFCFC', '#D82800', '#80D010'];
    const trimColors = ['#D82800', '#FC9838', '#FCFCFC', '#00A800'];

    // 5-Pointed Star Silhouette
    ctx.fillStyle = trimColors[phase];
    ctx.fillRect(x + 7, y + 1, 2, 3);
    ctx.fillRect(x + 2, y + 5, 12, 3);
    ctx.fillRect(x + 4, y + 8, 8, 3);
    ctx.fillRect(x + 3, y + 11, 3, 4);
    ctx.fillRect(x + 10, y + 11, 3, 4);

    ctx.fillStyle = bodyColors[phase];
    ctx.fillRect(x + 6, y + 3, 4, 7);
    ctx.fillRect(x + 4, y + 6, 8, 2);

    // Star Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 6, y + 6, 1, 2);
    ctx.fillRect(x + 9, y + 6, 1, 2);
  }
}

/**
 * Render Spinning Coin launched out of a Question Block or Multi-Coin Brick.
 */
export function drawSpinningCoinSprite(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  animFrame: number
): void {
  const x = Math.round(screenX);
  const y = Math.round(screenY);
  const phase = Math.floor(animFrame / 2) % 4;
  const widths = [8, 4, 2, 4];
  const w = widths[phase];
  const offsetX = Math.floor((8 - w) / 2);

  ctx.fillStyle = '#FC9838';
  ctx.fillRect(x + offsetX, y, w, 14);
  if (w >= 4) {
    ctx.fillStyle = '#FCFCFC';
    ctx.fillRect(x + offsetX + 1, y + 2, 1, 10);
  }
}

/**
 * Render Climbing Vine / Beanstalk Segment & Top Leaf Head.
 */
export function drawVineSprite(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  topScreenY: number,
  bottomScreenY: number
): void {
  const x = Math.round(screenX);
  const topY = Math.round(topScreenY);
  const botY = Math.round(bottomScreenY);
  if (botY <= topY) return;

  // Main Stem
  ctx.fillStyle = '#00A800';
  ctx.fillRect(x + 7, topY, 2, botY - topY);

  // Alternating Leaves every 8px
  ctx.fillStyle = '#80D010';
  for (let ly = topY + 4; ly < botY - 4; ly += 8) {
    const isLeft = Math.floor((ly - topY) / 8) % 2 === 0;
    if (isLeft) {
      ctx.fillRect(x + 3, ly, 4, 3);
    } else {
      ctx.fillRect(x + 9, ly, 4, 3);
    }
  }

  // Vine Crown
  ctx.fillStyle = '#80D010';
  ctx.fillRect(x + 5, topY, 6, 4);
}

/**
 * Render Fireball Wall-Hit Starburst Explosion (3 expanding 8-bit frames).
 */
export function drawFireballExplosionSprite(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  stage: 0 | 1 | 2
): void {
  const x = Math.round(screenX);
  const y = Math.round(screenY);
  const radius = stage === 0 ? 4 : stage === 1 ? 6 : 8;

  ctx.fillStyle = '#D82800';
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.fillStyle = '#FC9838';
  ctx.fillRect(
    x - Math.floor(radius * 0.6),
    y - Math.floor(radius * 0.6),
    Math.floor(radius * 1.2),
    Math.floor(radius * 1.2)
  );
  if (stage < 2) {
    ctx.fillStyle = '#FCFCFC';
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
}

export interface EnemyRenderOptions {
  type: string;
  facing: 1 | -1;
  animFrame: number;
  squished?: boolean;
  flippedUpsideDown?: boolean;
  inShell?: boolean;
  shellReviving?: boolean;
  winged?: boolean;
  spinyEgg?: boolean;
  mouthOpen?: boolean;
}

/**
 * Render 8-bit Pixel-Art Sprites for the entire 1985 Enemy Roster + King Bowser.
 */
export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  width: number,
  height: number,
  opts: EnemyRenderOptions
): void {
  const x = Math.round(screenX);
  const y = Math.round(screenY);

  ctx.save();
  if (opts.flippedUpsideDown) {
    ctx.translate(x + width * 0.5, y + height * 0.5);
    ctx.scale(1, -1);
    ctx.translate(-(x + width * 0.5), -(y + height * 0.5));
  } else if (opts.facing === 1 && opts.type !== 'piranha-plant' && opts.type !== 'podoboo') {
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }

  const step = Math.floor(opts.animFrame / 8) % 2;

  switch (opts.type) {
    case 'goomba': {
      if (opts.squished) {
        ctx.fillStyle = '#C84C0C';
        ctx.fillRect(x + 1, y + 8, 14, 5);
        ctx.fillStyle = '#FCBCB0';
        ctx.fillRect(x + 4, y + 13, 8, 3);
        break;
      }
      // Goomba Mushroom Head
      ctx.fillStyle = '#C84C0C';
      ctx.fillRect(x + 4, y + 1, 8, 3);
      ctx.fillRect(x + 2, y + 4, 12, 4);
      ctx.fillRect(x + 1, y + 8, 14, 3);
      // Angry Eyes
      ctx.fillStyle = '#FCBCB0';
      ctx.fillRect(x + 4, y + 5, 2, 4);
      ctx.fillRect(x + 10, y + 5, 2, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 5, y + 6, 1, 3);
      ctx.fillRect(x + 10, y + 6, 1, 3);
      // Stem & Alternating Walking Feet
      ctx.fillStyle = '#FCBCB0';
      ctx.fillRect(x + 5, y + 11, 6, 3);
      ctx.fillStyle = '#000000';
      if (step === 0) {
        ctx.fillRect(x + 2, y + 13, 4, 3);
        ctx.fillRect(x + 10, y + 14, 4, 2);
      } else {
        ctx.fillRect(x + 2, y + 14, 4, 2);
        ctx.fillRect(x + 10, y + 13, 4, 3);
      }
      break;
    }

    case 'koopa-green':
    case 'koopa-red':
    case 'paratroopa-green-leaping':
    case 'paratroopa-green-fly-horizontal':
    case 'paratroopa-red-vertical': {
      const isRed = opts.type.includes('red');
      const shellColor = isRed ? '#D82800' : '#00A800';
      const shellTrim = isRed ? '#FC9838' : '#80D010';

      if (opts.inShell) {
        // 16×16 Retracted Koopa Shell
        ctx.fillStyle = shellColor;
        ctx.fillRect(x + 2, y + 2, 12, 12);
        ctx.fillStyle = shellTrim;
        ctx.fillRect(x + 4, y + 4, 8, 8);
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(x + 2, y + 12, 12, 2);
        if (opts.shellReviving && step === 1) {
          ctx.fillStyle = '#FC9838';
          ctx.fillRect(x + 1, y + 13, 3, 3);
          ctx.fillRect(x + 12, y + 13, 3, 3);
        }
        break;
      }

      // Standing / Walking 16×24 Koopa Troopa
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(x + 1, y + 2, 6, 7); // Head
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 2, y + 4, 2, 2); // Eye

      // Shell on Back
      ctx.fillStyle = shellColor;
      ctx.fillRect(x + 5, y + 7, 10, 12);
      ctx.fillStyle = shellTrim;
      ctx.fillRect(x + 7, y + 9, 6, 8);

      // Wings if Paratroopa
      if (opts.winged) {
        ctx.fillStyle = '#FCFCFC';
        const wingY = step === 0 ? y + 3 : y + 6;
        ctx.fillRect(x + 9, wingY, 6, 5);
      }

      // Feet
      ctx.fillStyle = '#FC9838';
      const footOffset = step === 0 ? 0 : 2;
      ctx.fillRect(x + 3 + footOffset, y + 19, 4, 5);
      ctx.fillRect(x + 10 - footOffset, y + 19, 4, 5);
      break;
    }

    case 'buzzy-beetle': {
      // Dark Fireproof Shell Beetle
      ctx.fillStyle = '#004058';
      ctx.fillRect(x + 2, y + 2, 12, 11);
      ctx.fillStyle = '#008888';
      ctx.fillRect(x + 4, y + 4, 8, 6);
      if (!opts.inShell) {
        ctx.fillStyle = '#FC9838';
        ctx.fillRect(x + 2, y + 10, 4, 4);
        ctx.fillRect(x + 3 + step * 2, y + 13, 3, 3);
        ctx.fillRect(x + 10 - step * 2, y + 13, 3, 3);
      }
      break;
    }

    case 'piranha-plant': {
      // Carnivorous Pipe Plant (16×24)
      ctx.fillStyle = '#D82800';
      ctx.fillRect(x + 2, y + 1, 12, 12);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(x + 4, y + 3, 3, 3);
      ctx.fillRect(x + 10, y + 6, 3, 3);
      // Chomping Mouth
      if (step === 0) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 5, y, 6, 5);
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(x + 5, y + 2, 2, 2);
        ctx.fillRect(x + 9, y + 2, 2, 2);
      }
      // Green Stem & Leaves
      ctx.fillStyle = '#00A800';
      ctx.fillRect(x + 6, y + 13, 4, 11);
      ctx.fillStyle = '#80D010';
      ctx.fillRect(x + 2, y + 16, 4, 3);
      ctx.fillRect(x + 10, y + 16, 4, 3);
      break;
    }

    case 'hammer-bro': {
      // Helmet & Armor (16×24)
      ctx.fillStyle = '#00A800';
      ctx.fillRect(x + 3, y + 1, 10, 6);
      ctx.fillRect(x + 4, y + 8, 9, 11);
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(x + 2, y + 4, 6, 5);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(x + 5, y + 10, 6, 7);
      // Raised Arm with Hammer
      if (opts.mouthOpen) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 10, y - 4, 5, 4);
        ctx.fillStyle = '#FC9838';
        ctx.fillRect(x + 12, y, 2, 5);
      }
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(x + 4, y + 19, 3, 5);
      ctx.fillRect(x + 10, y + 19, 3, 5);
      break;
    }

    case 'lakitu': {
      // Lakitu Goggles Head + Smiling Cloud (16×24)
      ctx.fillStyle = '#00A800';
      ctx.fillRect(x + 4, y + 1, 8, 7);
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(x + 5, y + 3, 6, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 5, y + 4, 6, 2);
      // Cloud Body
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(x + 1, y + 9, 14, 12);
      ctx.fillRect(x + 3, y + 8, 10, 14);
      ctx.fillStyle = '#D82800';
      ctx.fillRect(x + 6, y + 16, 4, 2);
      break;
    }

    case 'spiny': {
      if (opts.spinyEgg) {
        // Spinning Spiny Egg
        ctx.fillStyle = '#D82800';
        ctx.fillRect(x + 3, y + 2, 10, 12);
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(x + 5, y + 4, 2, 2);
        ctx.fillRect(x + 9, y + 8, 2, 2);
        break;
      }
      // Spiky Red Shell
      ctx.fillStyle = '#D82800';
      ctx.fillRect(x + 2, y + 5, 12, 8);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(x + 3, y + 2, 2, 3);
      ctx.fillRect(x + 7, y + 2, 2, 3);
      ctx.fillRect(x + 11, y + 2, 2, 3);
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(x + 2, y + 12, 12, 4);
      break;
    }

    case 'bullet-bill': {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 1, y + 2, 14, 12);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(x + 3, y + 4, 3, 3); // Angry eye
      ctx.fillRect(x + 8, y + 6, 4, 4); // Side arm
      break;
    }

    case 'blooper': {
      // White Squid (16×24)
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(x + 3, y + 2, 10, 12);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 4, y + 8, 3, 3);
      ctx.fillRect(x + 9, y + 8, 3, 3);
      // Tentacles
      ctx.fillStyle = '#FCFCFC';
      const tentacleLen = step === 0 ? 8 : 5;
      ctx.fillRect(x + 3, y + 14, 2, tentacleLen);
      ctx.fillRect(x + 7, y + 14, 2, tentacleLen);
      ctx.fillRect(x + 11, y + 14, 2, tentacleLen);
      break;
    }

    case 'cheep-red-swim':
    case 'cheep-grey-swim':
    case 'cheep-flying-generator': {
      const isGrey = opts.type === 'cheep-grey-swim';
      ctx.fillStyle = isGrey ? '#7C7C7C' : '#D82800';
      ctx.fillRect(x + 2, y + 3, 12, 10);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(x + 3, y + 5, 3, 3);
      ctx.fillRect(x + 6, y + (step === 0 ? 1 : 3), 5, 3); // Wing fin
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(x + 13, y + 5, 3, 6); // Tail
      break;
    }

    case 'podoboo': {
      // Erupting Lava Fireball
      ctx.fillStyle = '#D82800';
      ctx.fillRect(x + 2, y + 2, 12, 12);
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(x + 4, y + 4, 8, 8);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(x + 6, y + 6, 4, 4);
      break;
    }

    case 'bowser': {
      // King Bowser (32×32 Boss Sprite)
      ctx.fillStyle = '#00A800';
      ctx.fillRect(x + 4, y + 4, 24, 24); // Main Armored Body & Spiked Shell
      ctx.fillStyle = '#80D010';
      ctx.fillRect(x + 14, y + 6, 12, 18); // Shell backing
      // White Shell Spikes
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(x + 24, y + 6, 5, 4);
      ctx.fillRect(x + 26, y + 12, 5, 4);
      ctx.fillRect(x + 24, y + 18, 5, 4);
      // Horns & Fiery Mane
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(x + 6, y, 4, 5);
      ctx.fillRect(x + 2, y + 8, 12, 16);
      // Roaring Snout & Eye
      ctx.fillStyle = '#D82800';
      ctx.fillRect(x + 4, y + 6, 3, 3);
      if (opts.mouthOpen) {
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(x + 1, y + 11, 7, 5);
      }
      // Feet
      ctx.fillStyle = '#00A800';
      ctx.fillRect(x + 6, y + 28, 7, 4);
      ctx.fillRect(x + 18, y + 28, 7, 4);
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

/**
 * Render Enemy Projectiles (Spinning Hammer & Bowser Fire Breath).
 */
export function drawEnemyProjectileSprite(
  ctx: CanvasRenderingContext2D,
  kind: 'hammer' | 'bowser-fire',
  screenX: number,
  screenY: number,
  animFrame: number
): void {
  const x = Math.round(screenX);
  const y = Math.round(screenY);

  if (kind === 'hammer') {
    const rot = Math.floor(animFrame / 3) % 4;
    ctx.fillStyle = '#000000';
    if (rot % 2 === 0) {
      ctx.fillRect(x + 1, y + 1, 6, 4);
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(x + 3, y + 5, 2, 6);
    } else {
      ctx.fillRect(x + 5, y + 1, 4, 6);
      ctx.fillStyle = '#FC9838';
      ctx.fillRect(x + 1, y + 3, 4, 2);
    }
    return;
  }

  // Bowser Fire Breath (24×8 streaming flame)
  const flash = Math.floor(animFrame / 2) % 2 === 0;
  ctx.fillStyle = flash ? '#D82800' : '#FC9838';
  ctx.fillRect(x, y + 1, 24, 6);
  ctx.fillStyle = flash ? '#FC9838' : '#FCFCFC';
  ctx.fillRect(x + 4, y + 2, 16, 4);
}
