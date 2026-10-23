import type { LevelDefinition } from '../types/level-schema.ts';
import { StageMatrixBuilder } from './StageBuilder.ts';

function buildWorld3_1BonusMatrix(): string[] {
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

function buildWorld3_1CoinHeavenMatrix(): string[] {
  const b = new StageMatrixBuilder(64);
  b.fillRect(0, 12, 8, 2, '#');
  for (let r = 5; r <= 7; r++) {
    for (let c = 12; c <= 48; c += 2) {
      b.setTile(c, r, 'C');
    }
  }
  b.fillRect(52, 12, 12, 3, '#');
  b.addPipe(56, 2, 12);
  return b.toMatrix();
}

function buildWorld3_1Matrix(): string[] {
  const widthCols = 210;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [70, 72],
    [106, 109],
    [156, 158],
  ]);

  // Opening Question Blocks & Brick Row (Cols 14..26)
  b.setTile(16, 9, '?');
  b.setTile(20, 9, '?'); // Progressive Power-Up
  b.fillRect(23, 5, 5, 1, 'B');
  b.setTile(25, 5, '?');

  // Early Pipes with Piranha Plants (Cols 32, 38, 46)
  b.addPipe(32, 3);
  b.addPipe(38, 4); // Bonus pipe entry
  b.addPipe(46, 3);

  // Mid-section Bridge over Water/Pit & Starman Brick (Cols 58..82)
  b.fillRect(58, 9, 6, 1, 'B');
  b.setTile(60, 9, '?'); // Progressive Power-Up
  b.fillRect(74, 5, 5, 1, 'B');
  b.setTile(76, 5, 'B'); // Starman

  // Hammer Bros Two-Tier Brick Arena (Cols 88..98)
  b.fillRect(88, 9, 9, 1, 'B');
  b.fillRect(88, 5, 9, 1, 'B');
  b.setTile(92, 5, '?');

  // Beanstalk / Vine Brick Structure (Cols 122..130)
  b.fillRect(122, 9, 7, 1, 'B');
  b.fillRect(124, 5, 5, 1, 'B'); // Col 126, Row 5 = Vine to '3-1-coin-heaven'

  // Multi-Coin Brick & Return Pipe (Cols 140..168)
  b.fillRect(142, 9, 5, 1, 'B'); // Col 144 = multi-coin-10
  b.addPipe(164, 3);

  // Final 8-Step Staircase (Infinite 1-Up Koopa Shell Trick!) & Flagpole
  b.addStairUp(180, 8, 2);
  b.addFlagpole(196);

  return b.toMatrix();
}

export const WORLD_3_1_LEVEL: LevelDefinition = {
  id: '3-1',
  world: 3,
  stage: 1,
  biome: 'overworld',
  bgPreset: 'hills-clouds-bushes',
  music: 'overworld',
  timeLimit: 400,
  widthCols: 210,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld3_1Matrix(),
  blockContents: [
    { col: 20, row: 9, payload: 'powerup-progressive' },
    { col: 60, row: 9, payload: 'powerup-progressive' },
    { col: 76, row: 5, payload: 'starman' },
    {
      col: 126,
      row: 5,
      payload: 'vine',
      targetSubworldId: '3-1-coin-heaven',
    },
    { col: 144, row: 9, payload: 'multi-coin-10' },
  ],
  pipes: [
    {
      id: 'pipe-3-1-bonus-entry',
      enterCol: 38,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: '3-1-bonus',
      exitCol: 2,
      exitRow: 2,
      exitDirection: 'drop-from-ceiling',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'koopa-green', col: 22, row: 12 },
    { type: 'goomba', col: 28, row: 12 },
    { type: 'piranha-plant', col: 32, row: 10 },
    { type: 'piranha-plant', col: 38, row: 9 },
    { type: 'piranha-plant', col: 46, row: 10 },
    { type: 'paratroopa-green-leaping', col: 64, row: 10 },
    { type: 'hammer-bro', col: 91, row: 4 },
    { type: 'hammer-bro', col: 95, row: 8 },
    { type: 'goomba', col: 116, row: 12 },
    { type: 'goomba', col: 118, row: 12 },
    { type: 'koopa-red', col: 126, row: 8 },
    { type: 'goomba', col: 148, row: 12 },
    { type: 'goomba', col: 150, row: 12 },
    { type: 'koopa-green', col: 184, row: 7 },
    { type: 'koopa-green', col: 187, row: 4 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 196,
    castleDoorCol: 202,
  },
  subWorlds: {
    '3-1-bonus': {
      id: '3-1-bonus',
      biome: 'underground',
      bgPreset: 'underground-brick',
      music: 'underground',
      widthCols: 16,
      scrollLocked: true,
      tileMatrix: buildWorld3_1BonusMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-3-1-bonus-exit',
          enterCol: 13,
          enterRow: 11,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 46,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
    },
    '3-1-coin-heaven': {
      id: '3-1-coin-heaven',
      biome: 'overworld',
      bgPreset: 'hills-clouds-bushes',
      music: 'coin-heaven',
      widthCols: 64,
      scrollLocked: false,
      tileMatrix: buildWorld3_1CoinHeavenMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-3-1-heaven-exit',
          enterCol: 56,
          enterRow: 10,
          enterDirection: 'down',
          targetAreaId: 'main',
          exitCol: 164,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [
        {
          id: 'lift-3-1-cloud',
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

function buildWorld3_2Matrix(): string[] {
  const widthCols = 204;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [76, 78],
    [134, 136],
  ]);

  // Flat tactical formations of Bricks & Question Blocks
  b.fillRect(16, 9, 5, 1, 'B');
  b.setTile(18, 9, '?'); // Progressive Power-Up
  b.setTile(28, 9, 'X');
  b.setTile(28, 8, 'X');

  b.fillRect(58, 9, 7, 1, 'B');
  b.setTile(60, 9, 'B'); // Starman
  b.setTile(62, 5, '?'); // Progressive Power-Up

  b.addPipe(86, 3);
  b.fillRect(96, 9, 6, 1, 'B'); // Col 98 = multi-coin-10
  b.addPipe(114, 4);
  b.addPipe(144, 3);

  b.fillRect(156, 9, 5, 1, 'B');
  b.addStairUp(174, 8, 1);
  b.addFlagpole(190);

  return b.toMatrix();
}

export const WORLD_3_2_LEVEL: LevelDefinition = {
  id: '3-2',
  world: 3,
  stage: 2,
  biome: 'overworld',
  bgPreset: 'hills-clouds-bushes',
  music: 'overworld',
  timeLimit: 300,
  widthCols: 204,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld3_2Matrix(),
  blockContents: [
    { col: 18, row: 9, payload: 'powerup-progressive' },
    { col: 60, row: 9, payload: 'starman' },
    { col: 62, row: 5, payload: 'powerup-progressive' },
    { col: 98, row: 9, payload: 'multi-coin-10' },
  ],
  pipes: [],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'koopa-green', col: 22, row: 12 },
    { type: 'goomba', col: 34, row: 12 },
    { type: 'goomba', col: 36, row: 12 },
    { type: 'goomba', col: 38, row: 12 },
    { type: 'koopa-green', col: 48, row: 12 },
    { type: 'goomba', col: 66, row: 12 },
    { type: 'goomba', col: 68, row: 12 },
    { type: 'goomba', col: 70, row: 12 },
    { type: 'piranha-plant', col: 86, row: 10 },
    { type: 'koopa-green', col: 102, row: 12 },
    { type: 'koopa-green', col: 105, row: 12 },
    { type: 'koopa-green', col: 108, row: 12 },
    { type: 'piranha-plant', col: 114, row: 9 },
    { type: 'paratroopa-green-leaping', col: 126, row: 10 },
    { type: 'piranha-plant', col: 144, row: 10 },
    { type: 'goomba', col: 162, row: 12 },
    { type: 'goomba', col: 164, row: 12 },
    { type: 'koopa-green', col: 168, row: 12 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 190,
    castleDoorCol: 196,
  },
  subWorlds: {},
};

function buildWorld3_3Matrix(): string[] {
  const widthCols = 168;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 13, 15, 2, '#');
  b.fillRect(136, 13, 32, 2, '#');

  // Treetop Canopy Islands
  b.addTreePlatform(18, 9, 6);
  b.addTreePlatform(28, 6, 7);
  b.setTile(31, 3, '?'); // Progressive Power-Up

  b.addTreePlatform(40, 10, 5);
  for (let c = 41; c <= 43; c++) {
    b.setTile(c, 7, 'C');
  }

  b.addTreePlatform(64, 8, 7);
  b.fillRect(66, 4, 4, 1, 'C');

  b.addTreePlatform(92, 7, 6);
  b.addTreePlatform(102, 10, 6);

  b.fillRect(140, 9, 2, 4, 'X');
  b.fillRect(144, 5, 2, 8, 'X');
  b.addFlagpole(154);

  return b.toMatrix();
}

export const WORLD_3_3_LEVEL: LevelDefinition = {
  id: '3-3',
  world: 3,
  stage: 3,
  biome: 'athletic',
  bgPreset: 'trees-fences-clouds',
  music: 'overworld',
  timeLimit: 300,
  widthCols: 168,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld3_3Matrix(),
  blockContents: [{ col: 31, row: 3, payload: 'powerup-progressive' }],
  pipes: [],
  platforms: [
    {
      id: 'lift-3-3-bal-1a',
      type: 'scale-balance-pair',
      col: 50,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-3-3-bal-1b',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-3-3-bal-1b',
      type: 'scale-balance-pair',
      col: 56,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-3-3-bal-1a',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-3-3-fall',
      type: 'fall-on-stand',
      col: 78,
      row: 6,
      widthTiles: 3,
      minBound: 4,
      maxBound: 13,
      speedPxPerFrame: 1.4,
    },
    {
      id: 'lift-3-3-bal-2a',
      type: 'scale-balance-pair',
      col: 114,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-3-3-bal-2b',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-3-3-bal-2b',
      type: 'scale-balance-pair',
      col: 122,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-3-3-bal-2a',
      pulleyTopRow: 2,
    },
  ],
  fireBars: [],
  enemies: [
    { type: 'goomba', col: 21, row: 8 },
    { type: 'koopa-red', col: 30, row: 5 },
    { type: 'koopa-red', col: 66, row: 7 },
    { type: 'paratroopa-red-vertical', col: 86, row: 6 },
    { type: 'koopa-red', col: 94, row: 6 },
    { type: 'paratroopa-green-fly-horizontal', col: 108, row: 5 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 154,
    castleDoorCol: 160,
  },
  subWorlds: {},
};

function buildWorld3_4Matrix(): string[] {
  const widthCols = 164;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 1, widthCols, 2, '#');
  b.fillRect(0, 11, 134, 4, '#');

  // Narrow Island Chasms with Podoboos & Fire-Bars
  const lavaChasms: Array<[number, number]> = [
    [18, 21],
    [30, 33],
    [42, 45],
    [82, 85],
    [98, 101],
    [116, 119],
  ];
  for (const [pStart, pEnd] of lavaChasms) {
    b.fillRect(pStart, 11, pEnd - pStart + 1, 2, '.');
    for (let c = pStart; c <= pEnd; c++) {
      b.setTile(c, 13, 'L');
      b.setTile(c, 14, 'l');
    }
  }

  // Island Fire-Bar Pivots
  b.setTile(25, 8, 'X');
  b.setTile(37, 8, 'X');
  b.setTile(91, 8, 'X');
  b.setTile(108, 8, 'X');

  // Central 3 Question Blocks (Col 60..64)
  b.setTile(60, 7, '?');
  b.setTile(62, 7, '?'); // Progressive Power-Up
  b.setTile(64, 7, '?');

  // Bowser's Collapsible Bridge (Cols 134..146) & Castle Axe at Col 147
  b.addCastleBridgeAndAxe(134, 13, 10);

  return b.toMatrix();
}

export const WORLD_3_4_LEVEL: LevelDefinition = {
  id: '3-4',
  world: 3,
  stage: 4,
  biome: 'castle',
  bgPreset: 'castle-stone',
  music: 'castle',
  timeLimit: 300,
  widthCols: 164,
  playerStart: {
    col: 2,
    row: 9,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld3_4Matrix(),
  blockContents: [{ col: 62, row: 7, payload: 'powerup-progressive' }],
  pipes: [],
  platforms: [],
  fireBars: [
    {
      col: 25,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 0,
      angularVelocityDegPerFrame: 2.4,
    },
    {
      col: 37,
      row: 8,
      lengthBalls: 6,
      clockwise: false,
      initialAngleDeg: 180,
      angularVelocityDegPerFrame: 2.4,
    },
    {
      col: 62,
      row: 11,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 90,
      angularVelocityDegPerFrame: 2.2,
    },
    {
      col: 91,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 45,
      angularVelocityDegPerFrame: 2.6,
    },
    {
      col: 108,
      row: 8,
      lengthBalls: 6,
      clockwise: false,
      initialAngleDeg: 225,
      angularVelocityDegPerFrame: 2.6,
    },
  ],
  enemies: [
    { type: 'podoboo', col: 19, row: 12 },
    { type: 'podoboo', col: 31, row: 12 },
    { type: 'podoboo', col: 43, row: 12 },
    { type: 'podoboo', col: 83, row: 12 },
    { type: 'podoboo', col: 99, row: 12 },
    {
      type: 'bowser',
      col: 140,
      row: 9,
      bowserTrueForm: 'buzzy-beetle',
      bowserThrowsHammers: false,
    },
  ],
  goal: {
    type: 'castle-axe',
    axeCol: 147,
    bridgeStartCol: 134,
    bridgeEndCol: 146,
    rescueNpc: 'toad',
  },
  subWorlds: {},
};

export const WORLD_3_LEVELS: LevelDefinition[] = [
  WORLD_3_1_LEVEL,
  WORLD_3_2_LEVEL,
  WORLD_3_3_LEVEL,
  WORLD_3_4_LEVEL,
];
