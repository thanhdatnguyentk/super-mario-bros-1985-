import type { LevelDefinition } from '../types/level-schema.ts';
import { StageMatrixBuilder } from './StageBuilder.ts';

function buildWorld6_1Matrix(): string[] {
  const widthCols = 204;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [52, 54],
    [108, 111],
    [152, 154],
  ]);

  // Stepped Terraces where Lakitu's Spinies roll down toward Mario
  b.addStairUp(16, 4, 4);
  b.fillRect(30, 9, 5, 1, 'B');
  b.setTile(32, 9, '?'); // Progressive Power-Up

  b.addStairUp(42, 4, 2);
  b.setTile(66, 8, 'H'); // Hidden 1-Up Mushroom

  b.fillRect(72, 9, 8, 1, 'B');
  b.fillRect(74, 5, 6, 1, 'B');
  b.setTile(76, 5, '?'); // Progressive Power-Up

  b.fillRect(94, 9, 5, 1, 'B'); // Col 96 = multi-coin-10
  b.addStairUp(118, 5, 3);
  b.addStairDown(126, 5);

  b.fillRect(140, 9, 6, 1, 'B');
  b.addStairUp(174, 8, 2);
  b.addFlagpole(190);

  return b.toMatrix();
}

export const WORLD_6_1_LEVEL: LevelDefinition = {
  id: '6-1',
  world: 6,
  stage: 1,
  biome: 'overworld',
  bgPreset: 'night-trees',
  music: 'overworld',
  timeLimit: 400,
  widthCols: 204,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld6_1Matrix(),
  blockContents: [
    { col: 32, row: 9, payload: 'powerup-progressive' },
    { col: 66, row: 8, payload: 'one-up' },
    { col: 76, row: 5, payload: 'powerup-progressive' },
    { col: 96, row: 9, payload: 'multi-coin-10' },
  ],
  pipes: [],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'lakitu', col: 20, row: 3 },
    { type: 'spiny', col: 36, row: 12 },
    { type: 'spiny', col: 82, row: 12 },
    { type: 'spiny', col: 134, row: 12 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 190,
    castleDoorCol: 196,
  },
  subWorlds: {},
};

function buildWorld6_2BonusMatrix(): string[] {
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

function buildWorld6_2UnderwaterMatrix(): string[] {
  const b = new StageMatrixBuilder(64);
  b.addGroundWithPits([[24, 27]]);
  b.fillRect(14, 9, 1, 4, 'X');
  b.fillRect(34, 8, 1, 5, 'X');
  for (let c = 20; c <= 30; c += 2) {
    b.setTile(c, 6, 'C');
  }
  b.fillRect(52, 2, 8, 3, '#');
  b.fillRect(52, 11, 8, 2, '#');
  b.addHorizontalExitPipe(54, 11);
  return b.toMatrix();
}

function buildWorld6_2CoinHeavenMatrix(): string[] {
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

function buildWorld6_2Matrix(): string[] {
  const widthCols = 216;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [60, 62],
    [136, 138],
  ]);

  // Dense Pipe Maze (14 Pipes across the stage!)
  b.addPipe(16, 2);
  b.addPipe(24, 3);
  b.addPipe(32, 4);
  b.addPipe(38, 3); // Bonus pipe entry
  b.addPipe(48, 2);

  // Brick Cluster with Vine at (74, 5) & Starman at (78, 9)
  b.fillRect(70, 9, 10, 1, 'B');
  b.fillRect(72, 5, 6, 1, 'B'); // Col 74, Row 5 = Vine to '6-2-coin-heaven'
  b.setTile(54, 9, '?'); // Progressive Power-Up

  b.addPipe(86, 4);
  b.addPipe(96, 3);
  b.addPipe(104, 2);
  b.addPipe(112, 4); // Underwater sub-world entry
  b.addPipe(124, 3);

  b.fillRect(142, 9, 5, 1, 'B'); // Col 144 = multi-coin-10
  b.addPipe(152, 3);
  b.addPipe(158, 3); // Underwater sub-world exit
  b.addPipe(168, 2); // Coin heaven exit
  b.addPipe(176, 4);

  b.addStairUp(186, 8, 2);
  b.addFlagpole(202);

  return b.toMatrix();
}

export const WORLD_6_2_LEVEL: LevelDefinition = {
  id: '6-2',
  world: 6,
  stage: 2,
  biome: 'overworld',
  bgPreset: 'night-trees',
  music: 'overworld',
  timeLimit: 400,
  widthCols: 216,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld6_2Matrix(),
  blockContents: [
    { col: 54, row: 9, payload: 'powerup-progressive' },
    {
      col: 74,
      row: 5,
      payload: 'vine',
      targetSubworldId: '6-2-coin-heaven',
    },
    { col: 78, row: 9, payload: 'starman' },
    { col: 144, row: 9, payload: 'multi-coin-10' },
  ],
  pipes: [
    {
      id: 'pipe-6-2-bonus-entry',
      enterCol: 38,
      enterRow: 10,
      enterDirection: 'down',
      targetAreaId: '6-2-bonus',
      exitCol: 2,
      exitRow: 2,
      exitDirection: 'drop-from-ceiling',
    },
    {
      id: 'pipe-6-2-underwater-entry',
      enterCol: 112,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: '6-2-underwater',
      exitCol: 3,
      exitRow: 4,
      exitDirection: 'drop-from-ceiling',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'piranha-plant', col: 16, row: 11 },
    { type: 'buzzy-beetle', col: 21, row: 12 },
    { type: 'piranha-plant', col: 24, row: 10 },
    { type: 'piranha-plant', col: 32, row: 9 },
    { type: 'piranha-plant', col: 38, row: 10 },
    { type: 'buzzy-beetle', col: 44, row: 12 },
    { type: 'piranha-plant', col: 48, row: 11 },
    { type: 'paratroopa-green-fly-horizontal', col: 66, row: 6 },
    { type: 'piranha-plant', col: 86, row: 9 },
    { type: 'piranha-plant', col: 96, row: 10 },
    { type: 'buzzy-beetle', col: 101, row: 12 },
    { type: 'piranha-plant', col: 112, row: 9 },
    { type: 'piranha-plant', col: 124, row: 10 },
    { type: 'paratroopa-green-leaping', col: 132, row: 10 },
    { type: 'piranha-plant', col: 152, row: 10 },
    { type: 'piranha-plant', col: 158, row: 10 },
    { type: 'piranha-plant', col: 176, row: 9 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 202,
    castleDoorCol: 208,
  },
  subWorlds: {
    '6-2-bonus': {
      id: '6-2-bonus',
      biome: 'underground',
      bgPreset: 'underground-brick',
      music: 'underground',
      widthCols: 16,
      scrollLocked: true,
      tileMatrix: buildWorld6_2BonusMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-6-2-bonus-exit',
          enterCol: 13,
          enterRow: 11,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 48,
          exitRow: 11,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
    },
    '6-2-underwater': {
      id: '6-2-underwater',
      biome: 'underwater',
      bgPreset: 'underwater-coral',
      music: 'underwater',
      widthCols: 64,
      scrollLocked: false,
      tileMatrix: buildWorld6_2UnderwaterMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-6-2-underwater-exit',
          enterCol: 54,
          enterRow: 9,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 158,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [
        { type: 'blooper', col: 20, row: 6 },
        { type: 'cheep-red-swim', col: 36, row: 7 },
      ],
    },
    '6-2-coin-heaven': {
      id: '6-2-coin-heaven',
      biome: 'overworld',
      bgPreset: 'hills-clouds-bushes',
      music: 'coin-heaven',
      widthCols: 64,
      scrollLocked: false,
      tileMatrix: buildWorld6_2CoinHeavenMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-6-2-heaven-exit',
          enterCol: 56,
          enterRow: 10,
          enterDirection: 'down',
          targetAreaId: 'main',
          exitCol: 168,
          exitRow: 11,
          exitDirection: 'up',
        },
      ],
      platforms: [
        {
          id: 'lift-6-2-cloud',
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

function buildWorld6_3Matrix(): string[] {
  const widthCols = 172;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 13, 14, 2, '#');
  b.fillRect(140, 13, 32, 2, '#');

  // High-Altitude Snow Tree Platforms
  b.addTreePlatform(18, 9, 5);
  b.addTreePlatform(28, 6, 5);
  b.setTile(30, 2, '?'); // Progressive Power-Up

  b.addTreePlatform(62, 8, 5);
  b.addTreePlatform(96, 7, 5);
  b.addTreePlatform(128, 8, 5);

  b.fillRect(144, 9, 2, 4, 'X');
  b.fillRect(148, 5, 2, 8, 'X');
  b.addFlagpole(158);

  return b.toMatrix();
}

export const WORLD_6_3_LEVEL: LevelDefinition = {
  id: '6-3',
  world: 6,
  stage: 3,
  biome: 'athletic',
  bgPreset: 'night-snow-trees',
  music: 'overworld',
  timeLimit: 300,
  widthCols: 172,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld6_3Matrix(),
  blockContents: [{ col: 30, row: 2, payload: 'powerup-progressive' }],
  pipes: [],
  platforms: [
    {
      id: 'lift-6-3-bal-1a',
      type: 'scale-balance-pair',
      col: 38,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-6-3-bal-1b',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-6-3-bal-1b',
      type: 'scale-balance-pair',
      col: 44,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-6-3-bal-1a',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-6-3-fall-1',
      type: 'fall-on-stand',
      col: 52,
      row: 6,
      widthTiles: 3,
      minBound: 4,
      maxBound: 13,
      speedPxPerFrame: 1.5,
    },
    {
      id: 'lift-6-3-right',
      type: 'right-on-stand',
      col: 72,
      row: 8,
      widthTiles: 3,
      minBound: 72,
      maxBound: 92,
      speedPxPerFrame: 1.2,
    },
    {
      id: 'lift-6-3-bal-2a',
      type: 'scale-balance-pair',
      col: 106,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-6-3-bal-2b',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-6-3-bal-2b',
      type: 'scale-balance-pair',
      col: 112,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-6-3-bal-2a',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-6-3-fall-2',
      type: 'fall-on-stand',
      col: 120,
      row: 6,
      widthTiles: 3,
      minBound: 4,
      maxBound: 13,
      speedPxPerFrame: 1.5,
    },
  ],
  fireBars: [],
  enemies: [
    { type: 'bullet-bill-generator', col: 40, row: 6 },
    { type: 'bullet-bill-generator', col: 78, row: 7 },
    { type: 'bullet-bill-generator', col: 114, row: 6 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 158,
    castleDoorCol: 164,
  },
  subWorlds: {},
};

function buildWorld6_4Matrix(): string[] {
  const widthCols = 168;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 1, widthCols, 2, '#');
  b.fillRect(0, 11, 138, 4, '#');

  const lavaPits: Array<[number, number]> = [
    [16, 18],
    [38, 41],
    [68, 70],
    [118, 120],
  ];
  for (const [pStart, pEnd] of lavaPits) {
    b.fillRect(pStart, 11, pEnd - pStart + 1, 2, '.');
    for (let c = pStart; c <= pEnd; c++) {
      b.setTile(c, 13, 'L');
      b.setTile(c, 14, 'l');
    }
  }

  b.fillRect(0, 8, 6, 3, '#');
  b.setTile(24, 8, 'X');
  b.setTile(30, 7, '?'); // Progressive Power-Up

  // Fire-Bar Pivot Blocks
  b.setTile(48, 8, 'X');
  b.setTile(58, 8, 'X');
  b.setTile(78, 8, 'X');
  b.setTile(90, 6, 'X');
  b.setTile(108, 8, 'X');

  // Narrow Corridor with 6 Hidden Coin Blocks
  for (let c = 94; c <= 104; c += 2) {
    b.setTile(c, 6, 'H');
  }

  // Bowser's Collapsible Bridge (Cols 138..150) & Castle Axe at Col 151
  b.addCastleBridgeAndAxe(138, 13, 10);

  return b.toMatrix();
}

export const WORLD_6_4_LEVEL: LevelDefinition = {
  id: '6-4',
  world: 6,
  stage: 4,
  biome: 'castle',
  bgPreset: 'castle-stone',
  music: 'castle',
  timeLimit: 300,
  widthCols: 168,
  playerStart: {
    col: 2,
    row: 7,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld6_4Matrix(),
  blockContents: [
    { col: 30, row: 7, payload: 'powerup-progressive' },
    { col: 94, row: 6, payload: 'coin' },
    { col: 96, row: 6, payload: 'coin' },
    { col: 98, row: 6, payload: 'coin' },
    { col: 100, row: 6, payload: 'coin' },
    { col: 102, row: 6, payload: 'coin' },
    { col: 104, row: 6, payload: 'coin' },
  ],
  pipes: [],
  platforms: [
    {
      id: 'lift-6-4-bowser',
      type: 'horizontal-oscillate',
      col: 140,
      row: 6,
      widthTiles: 3,
      minBound: 138,
      maxBound: 147,
      speedPxPerFrame: 0.9,
    },
  ],
  fireBars: [
    {
      col: 24,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 0,
      angularVelocityDegPerFrame: 2.5,
    },
    {
      col: 48,
      row: 8,
      lengthBalls: 6,
      clockwise: false,
      initialAngleDeg: 90,
      angularVelocityDegPerFrame: 2.5,
    },
    {
      col: 58,
      row: 8,
      lengthBalls: 12,
      clockwise: true,
      initialAngleDeg: 180,
      angularVelocityDegPerFrame: 2.5,
    },
    {
      col: 78,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 45,
      angularVelocityDegPerFrame: 2.6,
    },
    {
      col: 90,
      row: 6,
      lengthBalls: 6,
      clockwise: false,
      initialAngleDeg: 270,
      angularVelocityDegPerFrame: 2.6,
    },
    {
      col: 108,
      row: 8,
      lengthBalls: 12,
      clockwise: true,
      initialAngleDeg: 120,
      angularVelocityDegPerFrame: 2.6,
    },
  ],
  enemies: [
    { type: 'podoboo', col: 39, row: 12 },
    { type: 'podoboo', col: 119, row: 12 },
    {
      type: 'bowser',
      col: 144,
      row: 9,
      bowserTrueForm: 'blooper',
      bowserThrowsHammers: true,
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

export const WORLD_6_LEVELS: LevelDefinition[] = [
  WORLD_6_1_LEVEL,
  WORLD_6_2_LEVEL,
  WORLD_6_3_LEVEL,
  WORLD_6_4_LEVEL,
];
