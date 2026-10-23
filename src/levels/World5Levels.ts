import type { LevelDefinition } from '../types/level-schema.ts';
import { StageMatrixBuilder } from './StageBuilder.ts';

function buildWorld5_1BonusMatrix(): string[] {
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

function buildWorld5_1Matrix(): string[] {
  const widthCols = 208;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [60, 62],
    [102, 105],
    [150, 152],
  ]);

  // Bullet Bill Cannon Turrets ('b' skull + 'c' base) across the stage
  b.addBulletCannon(32, 10, 3);
  b.addBulletCannon(52, 9, 4);
  b.addBulletCannon(72, 10, 3);
  b.addBulletCannon(112, 9, 4);
  b.addBulletCannon(146, 10, 3);
  b.addBulletCannon(166, 9, 4);

  // Brick & Power-Up Clusters
  b.fillRect(18, 9, 5, 1, 'B');
  b.setTile(20, 9, '?'); // Progressive Power-Up
  b.fillRect(88, 9, 7, 1, 'B');
  b.setTile(92, 9, 'B'); // Starman
  b.fillRect(138, 9, 5, 1, 'B'); // Col 140 = multi-coin-10

  // Bonus Pipe (Col 122) & Return Pipe (Col 160)
  b.addPipe(122, 4);
  b.addPipe(160, 3);

  // Final Staircase with Gap & Flagpole
  b.addStairUp(176, 8, 2);
  b.addFlagpole(194);

  return b.toMatrix();
}

export const WORLD_5_1_LEVEL: LevelDefinition = {
  id: '5-1',
  world: 5,
  stage: 1,
  biome: 'overworld',
  bgPreset: 'night-snow-trees',
  music: 'overworld',
  timeLimit: 300,
  widthCols: 208,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld5_1Matrix(),
  blockContents: [
    { col: 20, row: 9, payload: 'powerup-progressive' },
    { col: 92, row: 9, payload: 'starman' },
    { col: 140, row: 9, payload: 'multi-coin-10' },
  ],
  pipes: [
    {
      id: 'pipe-5-1-bonus-entry',
      enterCol: 122,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: '5-1-bonus',
      exitCol: 2,
      exitRow: 2,
      exitDirection: 'drop-from-ceiling',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'goomba', col: 22, row: 12 },
    { type: 'goomba', col: 24, row: 12 },
    { type: 'goomba', col: 26, row: 12 },
    { type: 'bullet-bill-generator', col: 32, row: 10 },
    { type: 'koopa-green', col: 42, row: 12 },
    { type: 'koopa-green', col: 45, row: 12 },
    { type: 'bullet-bill-generator', col: 52, row: 9 },
    { type: 'bullet-bill-generator', col: 72, row: 10 },
    { type: 'goomba', col: 82, row: 12 },
    { type: 'goomba', col: 84, row: 12 },
    { type: 'goomba', col: 86, row: 12 },
    { type: 'paratroopa-green-leaping', col: 98, row: 10 },
    { type: 'bullet-bill-generator', col: 112, row: 9 },
    { type: 'piranha-plant', col: 122, row: 9 },
    { type: 'koopa-red', col: 134, row: 12 },
    { type: 'bullet-bill-generator', col: 146, row: 10 },
    { type: 'piranha-plant', col: 160, row: 10 },
    { type: 'bullet-bill-generator', col: 166, row: 9 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 194,
    castleDoorCol: 200,
  },
  subWorlds: {
    '5-1-bonus': {
      id: '5-1-bonus',
      biome: 'underground',
      bgPreset: 'underground-brick',
      music: 'underground',
      widthCols: 16,
      scrollLocked: true,
      tileMatrix: buildWorld5_1BonusMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-5-1-bonus-exit',
          enterCol: 13,
          enterRow: 11,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 160,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
    },
  },
};

function buildWorld5_2UnderwaterSubworldMatrix(): string[] {
  const b = new StageMatrixBuilder(64);
  b.addGroundWithPits([[26, 29]]);
  b.fillRect(14, 9, 1, 4, 'X');
  b.fillRect(22, 5, 8, 1, '#');
  for (let c = 23; c <= 28; c++) {
    b.setTile(c, 9, 'C');
  }
  b.fillRect(38, 8, 1, 5, 'X');
  b.fillRect(52, 2, 8, 3, '#');
  b.fillRect(52, 11, 8, 2, '#');
  b.addHorizontalExitPipe(54, 11);
  return b.toMatrix();
}

function buildWorld5_2CoinHeavenMatrix(): string[] {
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

function buildWorld5_2Matrix(): string[] {
  const widthCols = 212;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [34, 36],
    [94, 97],
    [152, 154],
  ]);

  // Opening Staircase & Question Block
  b.addStairUp(14, 4, 1);
  b.fillRect(24, 9, 5, 1, 'B');
  b.setTile(26, 9, '?'); // Progressive Power-Up

  // Pipe to Underwater Sub-World (Col 46)
  b.addPipe(46, 4);

  // Two-Tier Hammer Bros Arena & Beanstalk Vine Block at (82, 5)
  b.fillRect(62, 9, 9, 1, 'B');
  b.fillRect(62, 5, 9, 1, 'B');
  b.setTile(66, 5, '?'); // Progressive Power-Up

  b.fillRect(80, 9, 6, 1, 'B');
  b.fillRect(80, 5, 6, 1, 'B'); // Col 82, Row 5 = Vine to '5-2-coin-heaven'

  // Return Pipes & Late-Stage Bricks
  b.addPipe(116, 3); // Underwater sub-world exit
  b.fillRect(128, 9, 6, 1, 'B'); // Col 130 = Starman, Col 132 = multi-coin-10
  b.addPipe(164, 3); // Coin heaven exit

  b.addStairUp(180, 8, 2);
  b.addFlagpole(198);

  return b.toMatrix();
}

export const WORLD_5_2_LEVEL: LevelDefinition = {
  id: '5-2',
  world: 5,
  stage: 2,
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
  tileMatrix: buildWorld5_2Matrix(),
  blockContents: [
    { col: 26, row: 9, payload: 'powerup-progressive' },
    { col: 66, row: 5, payload: 'powerup-progressive' },
    {
      col: 82,
      row: 5,
      payload: 'vine',
      targetSubworldId: '5-2-coin-heaven',
    },
    { col: 130, row: 9, payload: 'starman' },
    { col: 132, row: 9, payload: 'multi-coin-10' },
  ],
  pipes: [
    {
      id: 'pipe-5-2-underwater-entry',
      enterCol: 46,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: '5-2-underwater',
      exitCol: 3,
      exitRow: 4,
      exitDirection: 'drop-from-ceiling',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'goomba', col: 22, row: 12 },
    { type: 'buzzy-beetle', col: 30, row: 12 },
    { type: 'piranha-plant', col: 46, row: 9 },
    { type: 'hammer-bro', col: 65, row: 4 },
    { type: 'hammer-bro', col: 69, row: 8 },
    { type: 'koopa-red', col: 84, row: 8 },
    { type: 'paratroopa-green-leaping', col: 108, row: 10 },
    { type: 'piranha-plant', col: 116, row: 10 },
    { type: 'buzzy-beetle', col: 136, row: 12 },
    { type: 'buzzy-beetle', col: 140, row: 12 },
    { type: 'piranha-plant', col: 164, row: 10 },
    { type: 'hammer-bro', col: 172, row: 12 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 198,
    castleDoorCol: 204,
  },
  subWorlds: {
    '5-2-underwater': {
      id: '5-2-underwater',
      biome: 'underwater',
      bgPreset: 'underwater-coral',
      music: 'underwater',
      widthCols: 64,
      scrollLocked: false,
      tileMatrix: buildWorld5_2UnderwaterSubworldMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-5-2-underwater-exit',
          enterCol: 54,
          enterRow: 9,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 116,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [
        { type: 'blooper', col: 18, row: 6 },
        { type: 'cheep-red-swim', col: 32, row: 7 },
        { type: 'blooper', col: 44, row: 5 },
      ],
    },
    '5-2-coin-heaven': {
      id: '5-2-coin-heaven',
      biome: 'overworld',
      bgPreset: 'hills-clouds-bushes',
      music: 'coin-heaven',
      widthCols: 64,
      scrollLocked: false,
      tileMatrix: buildWorld5_2CoinHeavenMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-5-2-heaven-exit',
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
          id: 'lift-5-2-cloud',
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

function buildWorld5_3Matrix(): string[] {
  const widthCols = 168;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 13, 16, 2, '#');
  b.fillRect(134, 13, 34, 2, '#');

  // Athletic Treetop Platforms (upgraded World 1-3 with Bullet Bill storm!)
  b.addTreePlatform(19, 10, 5);
  b.addTreePlatform(26, 7, 8);
  b.setTile(30, 3, 'C');
  b.setTile(31, 3, 'C');
  b.setTile(32, 3, 'C');

  b.addTreePlatform(36, 11, 5);
  b.addTreePlatform(43, 6, 6);
  b.setTile(46, 3, '?'); // Progressive Power-Up

  b.addTreePlatform(60, 9, 7);
  b.fillRect(62, 6, 3, 1, 'C');

  b.addTreePlatform(76, 5, 5);
  b.addTreePlatform(84, 10, 6);

  b.addTreePlatform(102, 8, 6);
  b.addTreePlatform(118, 6, 6);
  b.fillRect(120, 3, 4, 1, 'C');

  b.fillRect(138, 10, 2, 3, 'X');
  b.fillRect(142, 7, 2, 6, 'X');
  b.fillRect(146, 4, 2, 9, 'X');
  b.addFlagpole(154);

  return b.toMatrix();
}

export const WORLD_5_3_LEVEL: LevelDefinition = {
  id: '5-3',
  world: 5,
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
  tileMatrix: buildWorld5_3Matrix(),
  blockContents: [{ col: 46, row: 3, payload: 'powerup-progressive' }],
  pipes: [],
  platforms: [
    {
      id: 'lift-5-3-v1',
      type: 'vertical-oscillate',
      col: 52,
      row: 8,
      widthTiles: 3,
      minBound: 4,
      maxBound: 11,
      speedPxPerFrame: 1.0,
    },
    {
      id: 'lift-5-3-h1',
      type: 'horizontal-oscillate',
      col: 92,
      row: 9,
      widthTiles: 3,
      minBound: 91,
      maxBound: 99,
      speedPxPerFrame: 1.0,
    },
    {
      id: 'lift-5-3-bal-a',
      type: 'scale-balance-pair',
      col: 126,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-5-3-bal-b',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-5-3-bal-b',
      type: 'scale-balance-pair',
      col: 130,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-5-3-bal-a',
      pulleyTopRow: 2,
    },
  ],
  fireBars: [],
  enemies: [
    { type: 'koopa-red', col: 28, row: 6 },
    { type: 'bullet-bill-generator', col: 36, row: 7 },
    { type: 'goomba', col: 44, row: 5 },
    { type: 'paratroopa-red-vertical', col: 57, row: 7 },
    { type: 'koopa-red', col: 63, row: 8 },
    { type: 'bullet-bill-generator', col: 78, row: 6 },
    { type: 'paratroopa-red-vertical', col: 98, row: 6 },
    { type: 'bullet-bill-generator', col: 112, row: 7 },
    { type: 'koopa-red', col: 120, row: 5 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 154,
    castleDoorCol: 160,
  },
  subWorlds: {},
};

function buildWorld5_4Matrix(): string[] {
  const widthCols = 164;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 1, widthCols, 2, '#');
  b.fillRect(0, 11, 134, 4, '#');

  // Wide Lava Chasms with Podoboos & Elevator Lifts
  const lavaChasms: Array<[number, number]> = [
    [16, 20],
    [34, 42],
    [82, 90],
    [116, 119],
  ];
  for (const [pStart, pEnd] of lavaChasms) {
    b.fillRect(pStart, 11, pEnd - pStart + 1, 2, '.');
    for (let c = pStart; c <= pEnd; c++) {
      b.setTile(c, 13, 'L');
      b.setTile(c, 14, 'l');
    }
  }

  // Split Upper & Lower Gallery (Cols 50..74)
  b.fillRect(50, 7, 24, 1, '#');
  b.setTile(60, 7, '?'); // Progressive Power-Up

  // Fire-Bar Pivot Blocks (including 12-ball giant Fire-Bars at 64 & 102!)
  b.setTile(28, 8, 'X');
  b.setTile(64, 10, 'X');
  b.setTile(102, 8, 'X');
  b.setTile(112, 8, 'X');

  // Bowser's Collapsible Bridge (Cols 134..146) & Castle Axe at Col 147
  b.addCastleBridgeAndAxe(134, 13, 10);

  return b.toMatrix();
}

export const WORLD_5_4_LEVEL: LevelDefinition = {
  id: '5-4',
  world: 5,
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
  tileMatrix: buildWorld5_4Matrix(),
  blockContents: [{ col: 60, row: 7, payload: 'powerup-progressive' }],
  pipes: [],
  platforms: [
    {
      id: 'lift-5-4-e1',
      type: 'vertical-oscillate',
      col: 37,
      row: 8,
      widthTiles: 3,
      minBound: 4,
      maxBound: 11,
      speedPxPerFrame: 1.0,
    },
    {
      id: 'lift-5-4-e2',
      type: 'vertical-oscillate',
      col: 85,
      row: 8,
      widthTiles: 3,
      minBound: 4,
      maxBound: 11,
      speedPxPerFrame: 1.0,
    },
  ],
  fireBars: [
    {
      col: 28,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 0,
      angularVelocityDegPerFrame: 2.5,
    },
    {
      col: 64,
      row: 10,
      lengthBalls: 12,
      clockwise: false,
      initialAngleDeg: 90,
      angularVelocityDegPerFrame: 2.4,
    },
    {
      col: 102,
      row: 8,
      lengthBalls: 12,
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
      angularVelocityDegPerFrame: 2.6,
    },
  ],
  enemies: [
    { type: 'podoboo', col: 18, row: 12 },
    { type: 'podoboo', col: 38, row: 12 },
    { type: 'podoboo', col: 86, row: 12 },
    { type: 'podoboo', col: 117, row: 12 },
    {
      type: 'bowser',
      col: 140,
      row: 9,
      bowserTrueForm: 'lakitu',
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

export const WORLD_5_LEVELS: LevelDefinition[] = [
  WORLD_5_1_LEVEL,
  WORLD_5_2_LEVEL,
  WORLD_5_3_LEVEL,
  WORLD_5_4_LEVEL,
];
