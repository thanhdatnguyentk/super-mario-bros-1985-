import type { LevelDefinition } from '../types/level-schema.ts';
import { GRID_ROWS } from '../types/physics-constants.ts';

/**
 * World 1-1 Canonical Layout Builder for Phase 1 Playable Verification.
 * Constructs the 212-column × 15-row matrix of World 1-1 with exact block placements,
 * pipes, pits, stairs, coins, hidden 1-Up block, and end flagpole.
 */
function buildWorld1_1Matrix(widthCols: number): string[] {
  const grid: string[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: widthCols }, () => '.')
  );

  const setTile = (col: number, row: number, ch: string) => {
    if (col >= 0 && col < widthCols && row >= 0 && row < GRID_ROWS) {
      grid[row][col] = ch;
    }
  };

  const fillRect = (
    colStart: number,
    rowStart: number,
    w: number,
    h: number,
    ch: string
  ) => {
    for (let r = rowStart; r < rowStart + h; r++) {
      for (let c = colStart; c < colStart + w; c++) {
        setTile(c, r, ch);
      }
    }
  };

  const addPipe = (col: number, heightTiles: number) => {
    const topRow = 13 - heightTiles;
    setTile(col, topRow, 'P');
    setTile(col + 1, topRow, 'p');
    for (let r = topRow + 1; r < 13; r++) {
      setTile(col, r, '[');
      setTile(col + 1, r, ']');
    }
  };

  // 1. Ground Floor (Rows 13 & 14) with authentic World 1-1 pits at cols 69..70, 86..88, 153..154
  for (let c = 0; c < widthCols; c++) {
    const isPit =
      (c >= 69 && c <= 70) ||
      (c >= 86 && c <= 88) ||
      (c >= 153 && c <= 154);
    if (!isPit) {
      setTile(c, 13, '#');
      setTile(c, 14, '#');
    }
  }

  // 2. Opening Question Block & Brick Cluster (Cols 16..24)
  setTile(16, 9, '?');
  setTile(20, 9, 'B');
  setTile(21, 9, '?'); // Power-up Mushroom / Fire Flower
  setTile(22, 9, 'B');
  setTile(23, 9, '?');
  setTile(24, 9, 'B');
  setTile(22, 5, '?'); // High Question Block

  // Floating test coins for immediate feedback
  setTile(10, 10, 'C');
  setTile(11, 10, 'C');
  setTile(12, 10, 'C');

  // 3. Warp Pipes (Cols 28, 38, 46, 57)
  addPipe(28, 2);
  addPipe(38, 3);
  addPipe(46, 4);
  addPipe(57, 4);

  // 4. Hidden 1-Up Block before first pit (Col 64, Row 8)
  setTile(64, 8, 'H');

  // 5. Second Section Bricks & Question Blocks (Cols 77..94)
  setTile(77, 9, 'B');
  setTile(78, 9, '?'); // Power-up
  setTile(79, 9, 'B');
  fillRect(80, 5, 8, 1, 'B');
  fillRect(91, 5, 3, 1, 'B');
  setTile(94, 5, '?');
  setTile(94, 9, 'B'); // Multi-coin 10 brick

  // 6. Starman Brick & Symmetric Question Triangle (Cols 100..112)
  setTile(100, 9, 'B');
  setTile(101, 9, 'B'); // Starman inside
  setTile(106, 9, '?');
  setTile(109, 9, '?');
  setTile(109, 5, '?'); // Power-up
  setTile(112, 9, '?');

  // 7. Mid-Level Bricks (Cols 118..130)
  setTile(118, 9, 'B');
  fillRect(121, 5, 3, 1, 'B');
  setTile(128, 5, 'B');
  setTile(129, 5, '?');
  setTile(130, 5, '?');
  setTile(131, 5, 'B');
  setTile(129, 9, 'B');
  setTile(130, 9, 'B');

  // 8. Staircase Pyramids (Cols 134..158)
  for (let i = 0; i < 4; i++) {
    fillRect(134 + i, 12 - i, 1, i + 1, 'X');
    fillRect(140 + i, 9 + i, 1, 4 - i, 'X');
  }
  for (let i = 0; i < 4; i++) {
    fillRect(148 + i, 12 - i, 1, i + 1, 'X');
  }
  fillRect(152, 9, 1, 4, 'X');
  for (let i = 0; i < 4; i++) {
    fillRect(155 + i, 9 + i, 1, 4 - i, 'X');
  }

  // 9. Final Pipe & 8-Step Flagpole Staircase (Cols 163..198)
  addPipe(163, 2);
  setTile(168, 9, 'B');
  setTile(169, 9, 'B');
  setTile(170, 9, '?');
  setTile(171, 9, 'B');
  addPipe(179, 2);

  for (let step = 0; step < 8; step++) {
    fillRect(181 + step, 12 - step, 1, step + 1, 'X');
  }
  fillRect(189, 5, 1, 8, 'X');

  // 10. Flagpole at Col 198
  setTile(198, 12, 'X');
  for (let r = 3; r <= 11; r++) {
    setTile(198, r, 'F');
  }
  setTile(198, 2, 'G');

  return grid.map((row) => row.join(''));
}

export const WORLD_1_1_LEVEL: LevelDefinition = {
  id: '1-1',
  world: 1,
  stage: 1,
  biome: 'overworld',
  bgPreset: 'hills-clouds-bushes',
  music: 'overworld',
  timeLimit: 400,
  widthCols: 212,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld1_1Matrix(212),
  blockContents: [
    { col: 21, row: 9, payload: 'powerup-progressive' },
    { col: 64, row: 8, payload: 'one-up' },
    { col: 78, row: 9, payload: 'powerup-progressive' },
    { col: 94, row: 9, payload: 'multi-coin-10' },
    { col: 101, row: 9, payload: 'starman' },
    { col: 109, row: 5, payload: 'powerup-progressive' },
  ],
  pipes: [],
  platforms: [],
  fireBars: [],
  enemies: [],
  goal: {
    type: 'flagpole',
    flagpoleCol: 198,
    castleDoorCol: 204,
  },
  subWorlds: {},
};
