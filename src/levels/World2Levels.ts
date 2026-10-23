import type { LevelDefinition } from '../types/level-schema.ts';
import { StageMatrixBuilder } from './StageBuilder.ts';

function buildWorld2_1CoinHeavenMatrix(): string[] {
  const b = new StageMatrixBuilder(64);
  b.fillRect(0, 12, 8, 2, '#');
  // 3 rows of sky coins (Cols 12..46, Rows 5..7)
  for (let r = 5; r <= 7; r++) {
    for (let c = 12; c <= 46; c += 2) {
      b.setTile(c, r, 'C');
    }
  }
  b.fillRect(52, 12, 12, 3, '#');
  b.addPipe(56, 2, 12);
  return b.toMatrix();
}

function buildWorld2_1BonusMatrix(): string[] {
  const b = new StageMatrixBuilder(16);
  b.addGroundWithPits([]);
  b.fillRect(0, 2, 1, 11, 'B');
  b.fillRect(1, 1, 13, 1, 'B');
  b.fillRect(3, 9, 9, 1, 'B');
  for (let c = 3; c <= 11; c++) {
    b.setTile(c, 5, 'C');
    b.setTile(c, 7, 'C');
  }
  b.addHorizontalExitPipe(13, 13);
  return b.toMatrix();
}

function buildWorld2_1Matrix(): string[] {
  const widthCols = 208;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [90, 92],
    [120, 122],
    [154, 156],
  ]);

  // Opening Brick & Question Block Cluster (Cols 15..22)
  b.fillRect(15, 9, 3, 1, 'B');
  b.setTile(16, 9, '?'); // Progressive Power-Up
  b.addStairUp(20, 4, 0);
  b.setTile(28, 5, 'H'); // Hidden 1-Up Block
  b.fillRect(26, 9, 5, 1, 'B');

  // Pipes with Piranha Plants (Cols 34, 46)
  b.addPipe(34, 3);
  b.addPipe(46, 4);

  // Two-Tier Brick Platforms (Cols 52..72)
  b.fillRect(52, 9, 8, 1, 'B');
  b.setTile(53, 9, '?');
  b.setTile(56, 9, '?');
  b.fillRect(52, 5, 6, 1, 'B');
  b.setTile(53, 5, '?'); // Progressive Power-Up
  b.fillRect(66, 5, 6, 1, 'B');
  b.setTile(69, 5, 'B'); // Starman

  b.addPipe(74, 4);

  // Beanstalk / Vine Brick Cluster (Cols 80..86)
  b.fillRect(80, 9, 5, 1, 'B');
  b.fillRect(81, 5, 4, 1, 'B'); // Col 82, Row 5 has Vine to Coin Heaven!

  // Bonus Pipe (Col 103) & Return Pipe (Col 115)
  b.addPipe(103, 4);
  b.addPipe(115, 3);

  // Second Half Bricks & Multi-Coin (Cols 126..168)
  b.fillRect(126, 9, 5, 1, 'B'); // Col 128 = Multi-Coin-10
  b.fillRect(134, 5, 6, 1, 'B');
  b.setTile(146, 9, '?');
  b.fillRect(160, 5, 6, 1, 'B');
  b.addPipe(176, 3);

  // Final High Wall & Flagpole (Cols 184..194)
  b.fillRect(184, 5, 2, 8, 'X');
  b.addFlagpole(194);

  return b.toMatrix();
}

export const WORLD_2_1_LEVEL: LevelDefinition = {
  id: '2-1',
  world: 2,
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
  tileMatrix: buildWorld2_1Matrix(),
  blockContents: [
    { col: 16, row: 9, payload: 'powerup-progressive' },
    { col: 28, row: 5, payload: 'one-up' },
    { col: 53, row: 5, payload: 'powerup-progressive' },
    { col: 69, row: 5, payload: 'starman' },
    {
      col: 82,
      row: 5,
      payload: 'vine',
      targetSubworldId: '2-1-coin-heaven',
    },
    { col: 128, row: 9, payload: 'multi-coin-10' },
  ],
  pipes: [
    {
      id: 'pipe-2-1-bonus-entry',
      enterCol: 103,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: '2-1-bonus',
      exitCol: 2,
      exitRow: 2,
      exitDirection: 'drop-from-ceiling',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'goomba', col: 19, row: 12 },
    { type: 'koopa-green', col: 29, row: 12 },
    { type: 'piranha-plant', col: 46, row: 9 },
    { type: 'goomba', col: 55, row: 12 },
    { type: 'goomba', col: 57, row: 12 },
    { type: 'piranha-plant', col: 74, row: 9 },
    { type: 'koopa-green', col: 85, row: 12 },
    { type: 'piranha-plant', col: 103, row: 9 },
    { type: 'piranha-plant', col: 115, row: 10 },
    { type: 'paratroopa-green-leaping', col: 142, row: 11 },
    { type: 'goomba', col: 164, row: 12 },
    { type: 'goomba', col: 166, row: 12 },
    { type: 'piranha-plant', col: 176, row: 10 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 194,
    castleDoorCol: 200,
  },
  subWorlds: {
    '2-1-bonus': {
      id: '2-1-bonus',
      biome: 'underground',
      bgPreset: 'underground-brick',
      music: 'underground',
      widthCols: 16,
      scrollLocked: true,
      tileMatrix: buildWorld2_1BonusMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-2-1-bonus-exit',
          enterCol: 13,
          enterRow: 11,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 115,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
    },
    '2-1-coin-heaven': {
      id: '2-1-coin-heaven',
      biome: 'overworld',
      bgPreset: 'hills-clouds-bushes',
      music: 'coin-heaven',
      widthCols: 64,
      scrollLocked: false,
      tileMatrix: buildWorld2_1CoinHeavenMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-2-1-heaven-exit',
          enterCol: 56,
          enterRow: 10,
          enterDirection: 'down',
          targetAreaId: 'main',
          exitCol: 176,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [
        {
          id: 'lift-2-1-cloud',
          type: 'right-on-stand',
          col: 8,
          row: 9,
          widthTiles: 3,
          minBound: 8,
          maxBound: 52,
          speedPxPerFrame: 1.1,
        },
      ],
      enemies: [],
    },
  },
};

function buildWorld2_2Matrix(): string[] {
  const widthCols = 192;
  const b = new StageMatrixBuilder(widthCols);

  // Underwater Floor with 3 Whirlpool Pits (Cols 58..61, 108..112, 148..152)
  b.addGroundWithPits([
    [58, 61],
    [108, 112],
    [148, 152],
  ]);

  // Coral Reef Pillars ('X') & Underwater Coins ('C')
  b.fillRect(16, 10, 1, 3, 'X');
  b.fillRect(28, 8, 1, 5, 'X');
  b.fillRect(36, 4, 6, 1, '#');
  for (let c = 37; c <= 40; c++) {
    b.setTile(c, 9, 'C');
  }

  // Pit #1 Coin Arc (Cols 57..62)
  for (let c = 58; c <= 61; c++) {
    b.setTile(c, 11, 'C');
  }

  b.fillRect(72, 9, 1, 4, 'X');
  b.fillRect(82, 5, 8, 1, '#');
  b.fillRect(96, 10, 1, 3, 'X');

  // Pit #2 Coin Arc (Cols 108..112)
  for (let c = 109; c <= 111; c++) {
    b.setTile(c, 6, 'C');
    b.setTile(c, 10, 'C');
  }

  b.fillRect(124, 8, 1, 5, 'X');
  b.fillRect(134, 4, 6, 1, '#');
  b.fillRect(162, 9, 1, 4, 'X');

  // Underwater Exit Pipe Frame (Cols 174..182)
  b.fillRect(174, 2, 8, 3, '#');
  b.fillRect(174, 11, 8, 2, '#');
  b.addHorizontalExitPipe(176, 11);

  return b.toMatrix();
}

function buildWorld2_2ExitMatrix(): string[] {
  const b = new StageMatrixBuilder(44);
  b.addGroundWithPits([]);
  b.addPipe(4, 2);
  b.addStairUp(12, 8, 1);
  b.addFlagpole(29);
  return b.toMatrix();
}

export const WORLD_2_2_LEVEL: LevelDefinition = {
  id: '2-2',
  world: 2,
  stage: 2,
  biome: 'underwater',
  bgPreset: 'underwater-coral',
  music: 'underwater',
  timeLimit: 400,
  widthCols: 192,
  playerStart: {
    col: 3,
    row: 4,
    entranceType: 'drop-ceiling',
  },
  tileMatrix: buildWorld2_2Matrix(),
  blockContents: [],
  pipes: [
    {
      id: 'pipe-2-2-exit',
      enterCol: 176,
      enterRow: 9,
      enterDirection: 'right',
      targetAreaId: '2-2-exit',
      exitCol: 4,
      exitRow: 11,
      exitDirection: 'up',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'blooper', col: 22, row: 7 },
    { type: 'cheep-grey-swim', col: 34, row: 8 },
    { type: 'cheep-red-swim', col: 50, row: 6 },
    { type: 'blooper', col: 66, row: 6 },
    { type: 'cheep-grey-swim', col: 84, row: 9 },
    { type: 'blooper', col: 102, row: 5 },
    { type: 'cheep-red-swim', col: 118, row: 7 },
    { type: 'blooper', col: 140, row: 7 },
    { type: 'cheep-red-swim', col: 158, row: 8 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 185,
    castleDoorCol: 189,
  },
  subWorlds: {
    '2-2-exit': {
      id: '2-2-exit',
      biome: 'overworld',
      bgPreset: 'hills-clouds-bushes',
      music: 'overworld',
      widthCols: 44,
      scrollLocked: false,
      tileMatrix: buildWorld2_2ExitMatrix(),
      blockContents: [],
      pipes: [],
      platforms: [],
      enemies: [],
    },
  },
};

function buildWorld2_3Matrix(): string[] {
  const widthCols = 224;
  const b = new StageMatrixBuilder(widthCols);

  // Starting Island (Cols 0..14) & Ending Flagpole Island (Cols 192..223)
  b.fillRect(0, 13, 15, 2, '#');
  b.addStairUp(7, 4, 2);
  b.fillRect(192, 13, 32, 2, '#');
  b.addStairDown(192, 4);

  // Long Suspension Bridge Spans ('=' at Row 9, 'R' rail at Row 8)
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

  // Mid-bridge Progressive Power-Up Block & Sky Coin Arcs
  b.setTile(92, 5, '?');
  for (let c = 38; c <= 43; c++) {
    b.setTile(c, 5, 'C');
  }
  for (let c = 124; c <= 130; c++) {
    b.setTile(c, 4, 'C');
  }
  for (let c = 166; c <= 171; c++) {
    b.setTile(c, 5, 'C');
  }

  b.addStairUp(198, 8, 1);
  b.addFlagpole(212);

  return b.toMatrix();
}

export const WORLD_2_3_LEVEL: LevelDefinition = {
  id: '2-3',
  world: 2,
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
  tileMatrix: buildWorld2_3Matrix(),
  blockContents: [{ col: 92, row: 5, payload: 'powerup-progressive' }],
  pipes: [],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'cheep-flying-generator', col: 28, row: 14 },
    { type: 'cheep-flying-generator', col: 68, row: 14 },
    { type: 'cheep-flying-generator', col: 116, row: 14 },
    { type: 'cheep-flying-generator', col: 158, row: 14 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 212,
    castleDoorCol: 218,
  },
  subWorlds: {},
};

function buildWorld2_4Matrix(): string[] {
  const widthCols = 168;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 1, widthCols, 2, '#');
  b.fillRect(0, 11, 138, 4, '#');

  // Wide Lava Chasms for Podoboo & Elevator Lifts
  const lavaChasms: Array<[number, number]> = [
    [16, 20],
    [35, 43],
    [82, 90],
    [118, 121],
  ];
  for (const [pStart, pEnd] of lavaChasms) {
    b.fillRect(pStart, 11, pEnd - pStart + 1, 2, '.');
    for (let c = pStart; c <= pEnd; c++) {
      b.setTile(c, 13, 'L');
      b.setTile(c, 14, 'l');
    }
  }

  // Split Upper & Lower Castle Gallery (Cols 52..76)
  b.fillRect(52, 7, 24, 1, '#');
  b.setTile(62, 7, '?'); // Progressive Power-Up
  for (let c = 56; c <= 70; c += 3) {
    b.setTile(c, 4, 'C');
  }

  // Fire-Bar Pivot Blocks
  b.setTile(28, 8, 'X');
  b.setTile(64, 10, 'X');
  b.setTile(102, 8, 'X');
  b.setTile(112, 8, 'X');

  // Bowser's Collapsible Bridge (Cols 138..150) & Castle Axe at Col 151
  b.addCastleBridgeAndAxe(138, 13, 10);

  return b.toMatrix();
}

export const WORLD_2_4_LEVEL: LevelDefinition = {
  id: '2-4',
  world: 2,
  stage: 4,
  biome: 'castle',
  bgPreset: 'castle-stone',
  music: 'castle',
  timeLimit: 300,
  widthCols: 168,
  playerStart: {
    col: 2,
    row: 9,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld2_4Matrix(),
  blockContents: [{ col: 62, row: 7, payload: 'powerup-progressive' }],
  pipes: [],
  platforms: [
    {
      id: 'lift-2-4-e1',
      type: 'vertical-oscillate',
      col: 38,
      row: 8,
      widthTiles: 3,
      minBound: 4,
      maxBound: 11,
      speedPxPerFrame: 0.9,
    },
    {
      id: 'lift-2-4-e2',
      type: 'vertical-oscillate',
      col: 85,
      row: 8,
      widthTiles: 3,
      minBound: 4,
      maxBound: 11,
      speedPxPerFrame: 0.9,
    },
  ],
  fireBars: [
    {
      col: 28,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 0,
      angularVelocityDegPerFrame: 2.3,
    },
    {
      col: 64,
      row: 10,
      lengthBalls: 6,
      clockwise: false,
      initialAngleDeg: 90,
      angularVelocityDegPerFrame: 2.3,
    },
    {
      col: 102,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 180,
      angularVelocityDegPerFrame: 2.5,
    },
    {
      col: 112,
      row: 8,
      lengthBalls: 6,
      clockwise: false,
      initialAngleDeg: 45,
      angularVelocityDegPerFrame: 2.5,
    },
  ],
  enemies: [
    { type: 'podoboo', col: 18, row: 12 },
    { type: 'podoboo', col: 39, row: 12 },
    { type: 'podoboo', col: 86, row: 12 },
    { type: 'podoboo', col: 119, row: 12 },
    {
      type: 'bowser',
      col: 144,
      row: 9,
      bowserTrueForm: 'koopa-green',
      bowserThrowsHammers: false,
    },
  ],
  goal: {
    type: 'castle-axe',
    axeCol: 151,
    bridgeStartCol: 138,
    bridgeEndCol: 150,
    rescueNpc: 'toad',
  },
  subWorlds: {},
};

export const WORLD_2_LEVELS: LevelDefinition[] = [
  WORLD_2_1_LEVEL,
  WORLD_2_2_LEVEL,
  WORLD_2_3_LEVEL,
  WORLD_2_4_LEVEL,
];
