import type { LevelDefinition } from '../types/level-schema.ts';
import { StageMatrixBuilder } from './StageBuilder.ts';

function buildWorld7_1BonusMatrix(): string[] {
  const b = new StageMatrixBuilder(16);
  b.addGroundWithPits([]);
  b.fillRect(0, 2, 1, 11, 'B');
  b.fillRect(1, 1, 13, 1, 'B');
  b.fillRect(3, 8, 9, 1, 'B');
  for (let c = 3; c <= 11; c++) {
    b.setTile(c, 5, 'C');
    b.setTile(c, 7, 'C');
  }
  b.addHorizontalExitPipe(13, 13);
  return b.toMatrix();
}

function buildWorld7_1Matrix(): string[] {
  const widthCols = 208;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [68, 70],
    [130, 133],
  ]);

  // Heavy Bullet Bill Cannon Battery ('b' skull + 'c' base)
  b.addBulletCannon(26, 10, 3);
  b.addBulletCannon(44, 9, 4);
  b.addBulletCannon(62, 10, 3);
  b.addBulletCannon(108, 9, 4);
  b.addBulletCannon(152, 10, 3);

  // Opening Power-Up & Two-Tier Hammer Bros Arena (Cols 78..88)
  b.fillRect(16, 9, 4, 1, 'B');
  b.setTile(18, 9, '?'); // Progressive Power-Up

  b.fillRect(78, 9, 9, 1, 'B');
  b.fillRect(78, 5, 9, 1, 'B');
  b.setTile(82, 5, '?'); // Progressive Power-Up

  // Bonus Pipe (Col 98) & Return Pipe (Col 142)
  b.addPipe(98, 4);
  b.fillRect(120, 9, 5, 1, 'B'); // Col 122 = multi-coin-10
  b.addPipe(142, 3);

  // Final Staircase & Flagpole
  b.addStairUp(176, 8, 2);
  b.addFlagpole(194);

  return b.toMatrix();
}

export const WORLD_7_1_LEVEL: LevelDefinition = {
  id: '7-1',
  world: 7,
  stage: 1,
  biome: 'overworld',
  bgPreset: 'hills-clouds-bushes',
  music: 'overworld',
  timeLimit: 400,
  widthCols: 208,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld7_1Matrix(),
  blockContents: [
    { col: 18, row: 9, payload: 'powerup-progressive' },
    { col: 82, row: 5, payload: 'powerup-progressive' },
    { col: 122, row: 9, payload: 'multi-coin-10' },
  ],
  pipes: [
    {
      id: 'pipe-7-1-bonus-entry',
      enterCol: 98,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: '7-1-bonus',
      exitCol: 2,
      exitRow: 2,
      exitDirection: 'drop-from-ceiling',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'bullet-bill-generator', col: 26, row: 10 },
    { type: 'buzzy-beetle', col: 36, row: 12 },
    { type: 'bullet-bill-generator', col: 44, row: 9 },
    { type: 'paratroopa-green-leaping', col: 54, row: 10 },
    { type: 'bullet-bill-generator', col: 62, row: 10 },
    { type: 'hammer-bro', col: 80, row: 4 },
    { type: 'hammer-bro', col: 84, row: 8 },
    { type: 'piranha-plant', col: 98, row: 9 },
    { type: 'bullet-bill-generator', col: 108, row: 9 },
    { type: 'buzzy-beetle', col: 126, row: 12 },
    { type: 'piranha-plant', col: 142, row: 10 },
    { type: 'bullet-bill-generator', col: 152, row: 10 },
    { type: 'hammer-bro', col: 164, row: 12 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 194,
    castleDoorCol: 200,
  },
  subWorlds: {
    '7-1-bonus': {
      id: '7-1-bonus',
      biome: 'underground',
      bgPreset: 'underground-brick',
      music: 'underground',
      widthCols: 16,
      scrollLocked: true,
      tileMatrix: buildWorld7_1BonusMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-7-1-bonus-exit',
          enterCol: 13,
          enterRow: 11,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 142,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
    },
  },
};

function buildWorld7_2Matrix(): string[] {
  const widthCols = 196;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [58, 61],
    [108, 112],
    [148, 152],
  ]);

  b.fillRect(16, 10, 1, 3, 'X');
  b.fillRect(28, 8, 1, 5, 'X');
  b.fillRect(36, 4, 6, 1, '#');
  for (let c = 37; c <= 40; c++) {
    b.setTile(c, 9, 'C');
  }

  for (let c = 58; c <= 61; c++) {
    b.setTile(c, 11, 'C');
  }

  b.fillRect(72, 9, 1, 4, 'X');
  b.fillRect(82, 5, 8, 1, '#');
  b.fillRect(96, 10, 1, 3, 'X');

  for (let c = 109; c <= 111; c++) {
    b.setTile(c, 6, 'C');
    b.setTile(c, 10, 'C');
  }

  b.fillRect(124, 8, 1, 5, 'X');
  b.fillRect(134, 4, 6, 1, '#');
  b.fillRect(162, 9, 1, 4, 'X');

  b.fillRect(176, 2, 8, 3, '#');
  b.fillRect(176, 11, 8, 2, '#');
  b.addHorizontalExitPipe(178, 11);

  return b.toMatrix();
}

function buildWorld7_2ExitMatrix(): string[] {
  const b = new StageMatrixBuilder(44);
  b.addGroundWithPits([]);
  b.addPipe(4, 2);
  b.addStairUp(12, 8, 1);
  b.addFlagpole(29);
  return b.toMatrix();
}

export const WORLD_7_2_LEVEL: LevelDefinition = {
  id: '7-2',
  world: 7,
  stage: 2,
  biome: 'underwater',
  bgPreset: 'underwater-coral',
  music: 'underwater',
  timeLimit: 400,
  widthCols: 196,
  playerStart: {
    col: 3,
    row: 4,
    entranceType: 'drop-ceiling',
  },
  tileMatrix: buildWorld7_2Matrix(),
  blockContents: [],
  pipes: [
    {
      id: 'pipe-7-2-exit',
      enterCol: 178,
      enterRow: 9,
      enterDirection: 'right',
      targetAreaId: '7-2-exit',
      exitCol: 4,
      exitRow: 11,
      exitDirection: 'up',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'blooper', col: 20, row: 6 },
    { type: 'blooper', col: 32, row: 5 },
    { type: 'cheep-red-swim', col: 44, row: 7 },
    { type: 'blooper', col: 64, row: 6 },
    { type: 'cheep-grey-swim', col: 78, row: 9 },
    { type: 'blooper', col: 92, row: 5 },
    { type: 'cheep-red-swim', col: 116, row: 7 },
    { type: 'blooper', col: 130, row: 6 },
    { type: 'blooper', col: 144, row: 5 },
    { type: 'cheep-red-swim', col: 160, row: 8 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 188,
    castleDoorCol: 192,
  },
  subWorlds: {
    '7-2-exit': {
      id: '7-2-exit',
      biome: 'overworld',
      bgPreset: 'hills-clouds-bushes',
      music: 'overworld',
      widthCols: 44,
      scrollLocked: false,
      tileMatrix: buildWorld7_2ExitMatrix(),
      blockContents: [],
      pipes: [],
      platforms: [],
      enemies: [],
    },
  },
};

function buildWorld7_3Matrix(): string[] {
  const widthCols = 224;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 13, 15, 2, '#');
  b.addStairUp(7, 4, 2);
  b.fillRect(192, 13, 32, 2, '#');
  b.addStairDown(192, 4);

  const bridgeSpans: Array<[number, number]> = [
    [16, 62],
    [66, 108],
    [113, 148],
    [154, 188],
  ];
  for (const [bStart, bEnd] of bridgeSpans) {
    for (let c = bStart; c <= bEnd; c++) {
      b.setTile(c, 9, '=');
      if (c % 2 === 0) {
        b.setTile(c, 8, 'R');
      }
    }
  }

  b.setTile(92, 5, '?'); // Progressive Power-Up
  for (let c = 38; c <= 43; c++) {
    b.setTile(c, 5, 'C');
  }
  for (let c = 124; c <= 130; c++) {
    b.setTile(c, 4, 'C');
  }

  b.addStairUp(198, 8, 1);
  b.addFlagpole(212);

  return b.toMatrix();
}

export const WORLD_7_3_LEVEL: LevelDefinition = {
  id: '7-3',
  world: 7,
  stage: 3,
  biome: 'athletic',
  bgPreset: 'trees-fences-clouds',
  music: 'overworld',
  timeLimit: 300,
  widthCols: 224,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld7_3Matrix(),
  blockContents: [{ col: 92, row: 5, payload: 'powerup-progressive' }],
  pipes: [],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'cheep-flying-generator', col: 26, row: 14 },
    { type: 'koopa-green', col: 36, row: 8 },
    { type: 'koopa-red', col: 52, row: 8 },
    { type: 'cheep-flying-generator', col: 68, row: 14 },
    { type: 'paratroopa-green-leaping', col: 84, row: 7 },
    { type: 'koopa-green', col: 102, row: 8 },
    { type: 'cheep-flying-generator', col: 118, row: 14 },
    { type: 'koopa-red', col: 136, row: 8 },
    { type: 'cheep-flying-generator', col: 158, row: 14 },
    { type: 'paratroopa-green-fly-horizontal', col: 172, row: 5 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 212,
    castleDoorCol: 218,
  },
  subWorlds: {},
};

function buildWorld7_4Matrix(): string[] {
  const widthCols = 196;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 1, widthCols, 2, '#');
  b.fillRect(0, 12, 164, 3, '#');

  // Maze Section 1 (Cols 20..72): 3 Corridors (Top: rows 3..5, Mid: rows 6..8, Bot: rows 9..11)
  b.fillRect(22, 6, 50, 1, '#');
  b.fillRect(22, 9, 50, 1, '#');

  // Lava Pit between Maze Sections 1 & 2
  b.fillRect(74, 12, 3, 1, '.');
  for (let c = 74; c <= 76; c++) {
    b.setTile(c, 13, 'L');
    b.setTile(c, 14, 'l');
  }

  // Maze Section 2 (Cols 78..132): 3 Corridors (Correct Path is Middle Corridor: rows 6..8)
  b.fillRect(82, 6, 50, 1, '#');
  b.fillRect(82, 9, 50, 1, '#');

  // Fire-Bar Pivots
  b.setTile(46, 9, 'X');
  b.setTile(106, 6, 'X');
  b.setTile(146, 8, 'X');

  // Bowser's Collapsible Bridge (Cols 164..176) & Castle Axe at Col 177
  b.addCastleBridgeAndAxe(164, 13, 10);

  return b.toMatrix();
}

export const WORLD_7_4_LEVEL: LevelDefinition = {
  id: '7-4',
  world: 7,
  stage: 4,
  biome: 'castle',
  bgPreset: 'castle-stone',
  music: 'castle',
  timeLimit: 400,
  widthCols: 196,
  playerStart: {
    col: 2,
    row: 10,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld7_4Matrix(),
  blockContents: [],
  pipes: [],
  platforms: [],
  fireBars: [
    {
      col: 46,
      row: 9,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 0,
      angularVelocityDegPerFrame: 2.5,
    },
    {
      col: 106,
      row: 6,
      lengthBalls: 6,
      clockwise: false,
      initialAngleDeg: 180,
      angularVelocityDegPerFrame: 2.5,
    },
    {
      col: 146,
      row: 8,
      lengthBalls: 12,
      clockwise: true,
      initialAngleDeg: 90,
      angularVelocityDegPerFrame: 2.6,
    },
  ],
  castleMazeLoop: [
    {
      checkCol: 72,
      validRowMin: 3,
      validRowMax: 5,
      rewindToCol: 20,
    },
    {
      checkCol: 132,
      validRowMin: 6,
      validRowMax: 8,
      rewindToCol: 78,
    },
  ],
  enemies: [
    { type: 'podoboo', col: 75, row: 12 },
    {
      type: 'bowser',
      col: 170,
      row: 9,
      bowserTrueForm: 'hammer-bro',
      bowserThrowsHammers: true,
    },
  ],
  goal: {
    type: 'castle-axe',
    axeCol: 177,
    bridgeStartCol: 164,
    bridgeEndCol: 176,
    rescueNpc: 'toad',
  },
  subWorlds: {},
};

export const WORLD_7_LEVELS: LevelDefinition[] = [
  WORLD_7_1_LEVEL,
  WORLD_7_2_LEVEL,
  WORLD_7_3_LEVEL,
  WORLD_7_4_LEVEL,
];
