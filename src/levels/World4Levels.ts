import type { LevelDefinition } from '../types/level-schema.ts';
import { StageMatrixBuilder } from './StageBuilder.ts';

function buildWorld4_1BonusMatrix(): string[] {
  const b = new StageMatrixBuilder(16);
  b.addGroundWithPits([]);
  b.fillRect(0, 2, 1, 11, 'B');
  b.fillRect(1, 1, 13, 1, 'B');
  b.fillRect(3, 9, 9, 1, 'B');
  for (let c = 3; c <= 11; c++) {
    b.setTile(c, 5, 'C');
    b.setTile(c, 8, 'C');
  }
  b.addHorizontalExitPipe(13, 13);
  return b.toMatrix();
}

function buildWorld4_1Matrix(): string[] {
  const widthCols = 216;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [76, 78],
    [138, 141],
  ]);

  // Opening Pipe & Question Block (Cols 18..28)
  b.addPipe(18, 3);
  b.setTile(24, 9, '?'); // Progressive Power-Up
  b.setTile(24, 5, '?');

  // Tall Pipes & Hidden 1-Up Block before Pit #1
  b.addPipe(42, 4);
  b.addPipe(58, 4);
  b.setTile(68, 8, 'H'); // Hidden 1-Up Mushroom

  // Iconic 2×2 Question Block Diamond / Cluster (Cols 88..91)
  b.setTile(88, 9, '?');
  b.setTile(89, 9, '?');
  b.setTile(88, 5, '?'); // Progressive Power-Up
  b.setTile(89, 5, '?');

  // Pipes & Bonus Entry (Col 126) + Return Pipe (Col 162)
  b.addPipe(110, 3);
  b.addPipe(126, 4);
  b.fillRect(146, 9, 5, 1, 'B'); // Col 148 = multi-coin-10
  b.addPipe(162, 3);
  b.addPipe(176, 2);

  // Final 8-Step Staircase & Flagpole
  b.addStairUp(184, 8, 2);
  b.addFlagpole(202);

  return b.toMatrix();
}

export const WORLD_4_1_LEVEL: LevelDefinition = {
  id: '4-1',
  world: 4,
  stage: 1,
  biome: 'overworld',
  bgPreset: 'hills-clouds-bushes',
  music: 'overworld',
  timeLimit: 400,
  widthCols: 216,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld4_1Matrix(),
  blockContents: [
    { col: 24, row: 9, payload: 'powerup-progressive' },
    { col: 68, row: 8, payload: 'one-up' },
    { col: 88, row: 5, payload: 'powerup-progressive' },
    { col: 148, row: 9, payload: 'multi-coin-10' },
  ],
  pipes: [
    {
      id: 'pipe-4-1-bonus-entry',
      enterCol: 126,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: '4-1-bonus',
      exitCol: 2,
      exitRow: 2,
      exitDirection: 'drop-from-ceiling',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'piranha-plant', col: 18, row: 10 },
    { type: 'lakitu', col: 26, row: 3 },
    { type: 'piranha-plant', col: 42, row: 9 },
    { type: 'piranha-plant', col: 58, row: 9 },
    { type: 'piranha-plant', col: 110, row: 10 },
    { type: 'piranha-plant', col: 126, row: 9 },
    { type: 'piranha-plant', col: 162, row: 10 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 202,
    castleDoorCol: 208,
  },
  subWorlds: {
    '4-1-bonus': {
      id: '4-1-bonus',
      biome: 'underground',
      bgPreset: 'underground-brick',
      music: 'underground',
      widthCols: 16,
      scrollLocked: true,
      tileMatrix: buildWorld4_1BonusMatrix(),
      blockContents: [{ col: 11, row: 9, payload: 'powerup-progressive' }],
      pipes: [
        {
          id: 'pipe-4-1-bonus-exit',
          enterCol: 13,
          enterRow: 11,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 162,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
    },
  },
};

function buildWorld4_2VineWarpRoomMatrix(): string[] {
  const b = new StageMatrixBuilder(48);
  b.addGroundWithPits([]);
  b.addPipe(4, 2);
  // 3 Overworld Warp Pipes leading to Worlds 8, 7, 6!
  b.addPipe(20, 4); // World 8
  b.addPipe(28, 4); // World 7
  b.addPipe(36, 4); // World 6
  b.fillRect(44, 2, 2, 11, 'X');
  return b.toMatrix();
}

function buildWorld4_2BonusMatrix(): string[] {
  const b = new StageMatrixBuilder(16);
  b.addGroundWithPits([]);
  b.fillRect(0, 2, 1, 11, 'B');
  b.fillRect(1, 1, 13, 1, 'B');
  b.fillRect(3, 7, 9, 1, 'B');
  for (let c = 3; c <= 11; c++) {
    b.setTile(c, 5, 'C');
    b.setTile(c, 9, 'C');
  }
  b.addHorizontalExitPipe(13, 13);
  return b.toMatrix();
}

function buildWorld4_2ExitMatrix(): string[] {
  const b = new StageMatrixBuilder(44);
  b.addGroundWithPits([]);
  b.addPipe(4, 2);
  b.addStairUp(12, 8, 1);
  b.addFlagpole(29);
  return b.toMatrix();
}

function buildWorld4_2Matrix(): string[] {
  const widthCols = 204;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [48, 50],
    [94, 96],
    [146, 152],
  ]);

  b.fillRect(0, 2, 1, 11, 'B');
  b.fillRect(6, 1, 138, 1, 'B');
  b.fillRect(153, 1, 50, 1, 'B');

  // Opening Bricks & Question Blocks
  b.fillRect(14, 9, 5, 1, 'B');
  b.setTile(16, 9, '?'); // Progressive Power-Up
  b.fillRect(28, 6, 6, 2, 'B');

  // Iconic World 4-2 Hidden Blocks (Cols 63..65, Row 8) + Beanstalk Vine Brick at (66, 5)
  b.setTile(63, 8, 'H');
  b.setTile(64, 8, 'H');
  b.setTile(65, 8, 'H');
  b.fillRect(64, 5, 5, 1, 'B'); // Col 66, Row 5 = Vine to '4-2-vine-warp' (Worlds 8, 7, 6!)

  // Mid-Stage Pipes & Multi-Coin Brick
  b.addPipe(80, 3);
  b.fillRect(102, 8, 5, 1, 'B'); // Col 104 = Starman
  b.addPipe(114, 4); // Bonus pipe entry
  b.addPipe(130, 3); // Bonus pipe return

  // Exit Pipe to Overworld Flagpole (Col 170) & Single-Pipe Warp Zone to World 5 (Col 188)
  b.fillRect(168, 10, 8, 3, 'B');
  b.addHorizontalExitPipe(171, 10);
  b.fillRect(174, 2, 2, 11, 'B');

  b.addPipe(188, 4); // Warp to World 5
  b.fillRect(202, 2, 2, 11, 'B');

  return b.toMatrix();
}

export const WORLD_4_2_LEVEL: LevelDefinition = {
  id: '4-2',
  world: 4,
  stage: 2,
  biome: 'underground',
  bgPreset: 'underground-brick',
  music: 'underground',
  timeLimit: 400,
  widthCols: 204,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld4_2Matrix(),
  blockContents: [
    { col: 16, row: 9, payload: 'powerup-progressive' },
    { col: 63, row: 8, payload: 'coin' },
    { col: 64, row: 8, payload: 'coin' },
    { col: 65, row: 8, payload: 'coin' },
    {
      col: 66,
      row: 5,
      payload: 'vine',
      targetSubworldId: '4-2-vine-warp',
    },
    { col: 104, row: 8, payload: 'starman' },
  ],
  pipes: [
    {
      id: 'pipe-4-2-bonus-entry',
      enterCol: 114,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: '4-2-bonus',
      exitCol: 2,
      exitRow: 2,
      exitDirection: 'drop-from-ceiling',
    },
    {
      id: 'pipe-4-2-normal-exit',
      enterCol: 171,
      enterRow: 8,
      enterDirection: 'right',
      targetAreaId: '4-2-exit',
      exitCol: 4,
      exitRow: 11,
      exitDirection: 'up',
    },
    {
      id: 'pipe-4-2-warp-world-5',
      enterCol: 188,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: 'warp:5-1',
      exitCol: 3,
      exitRow: 12,
      exitDirection: 'up',
    },
  ],
  platforms: [
    {
      id: 'lift-4-2-up',
      type: 'vertical-loopUp',
      col: 148,
      row: 10,
      widthTiles: 3,
      minBound: 0,
      maxBound: 14,
      speedPxPerFrame: 1.0,
    },
  ],
  fireBars: [],
  warpZone: {
    triggerCol: 178,
    bannerText: 'WELCOME TO WARP ZONE!',
    pipes: [{ col: 188, row: 9, targetWorld: 5 }],
  },
  enemies: [
    { type: 'buzzy-beetle', col: 20, row: 12 },
    { type: 'buzzy-beetle', col: 23, row: 12 },
    { type: 'goomba', col: 36, row: 12 },
    { type: 'goomba', col: 38, row: 12 },
    { type: 'buzzy-beetle', col: 58, row: 12 },
    { type: 'piranha-plant', col: 80, row: 10 },
    { type: 'koopa-green', col: 90, row: 12 },
    { type: 'piranha-plant', col: 114, row: 9 },
    { type: 'piranha-plant', col: 130, row: 10 },
    { type: 'buzzy-beetle', col: 138, row: 12 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 196,
    castleDoorCol: 200,
  },
  subWorlds: {
    '4-2-vine-warp': {
      id: '4-2-vine-warp',
      biome: 'overworld',
      bgPreset: 'hills-clouds-bushes',
      music: 'overworld',
      widthCols: 48,
      scrollLocked: false,
      tileMatrix: buildWorld4_2VineWarpRoomMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-4-2-warp-world-8',
          enterCol: 20,
          enterRow: 9,
          enterDirection: 'down',
          targetAreaId: 'warp:8-1',
          exitCol: 3,
          exitRow: 12,
          exitDirection: 'up',
        },
        {
          id: 'pipe-4-2-warp-world-7',
          enterCol: 28,
          enterRow: 9,
          enterDirection: 'down',
          targetAreaId: 'warp:7-1',
          exitCol: 3,
          exitRow: 12,
          exitDirection: 'up',
        },
        {
          id: 'pipe-4-2-warp-world-6',
          enterCol: 36,
          enterRow: 9,
          enterDirection: 'down',
          targetAreaId: 'warp:6-1',
          exitCol: 3,
          exitRow: 12,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
      warpZone: {
        triggerCol: 10,
        bannerText: 'WELCOME TO WARP ZONE!',
        pipes: [
          { col: 20, row: 9, targetWorld: 8 },
          { col: 28, row: 9, targetWorld: 7 },
          { col: 36, row: 9, targetWorld: 6 },
        ],
      },
    },
    '4-2-bonus': {
      id: '4-2-bonus',
      biome: 'underground',
      bgPreset: 'underground-brick',
      music: 'underground',
      widthCols: 16,
      scrollLocked: true,
      tileMatrix: buildWorld4_2BonusMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-4-2-bonus-exit',
          enterCol: 13,
          enterRow: 11,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 130,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
    },
    '4-2-exit': {
      id: '4-2-exit',
      biome: 'overworld',
      bgPreset: 'hills-clouds-bushes',
      music: 'overworld',
      widthCols: 44,
      scrollLocked: false,
      tileMatrix: buildWorld4_2ExitMatrix(),
      blockContents: [],
      pipes: [],
      platforms: [],
      enemies: [],
    },
  },
};

function buildWorld4_3Matrix(): string[] {
  const widthCols = 164;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 13, 14, 2, '#');
  b.fillRect(134, 13, 30, 2, '#');

  // Giant Mushroom Platforms across the sky
  b.addTreePlatform(17, 9, 6);
  b.addTreePlatform(26, 5, 7);
  b.setTile(29, 2, '?'); // Progressive Power-Up

  b.addTreePlatform(48, 8, 6);
  for (let c = 49; c <= 52; c++) {
    b.setTile(c, 5, 'C');
  }

  b.addTreePlatform(72, 6, 7);
  b.addTreePlatform(98, 9, 6);
  b.addTreePlatform(118, 6, 6);

  b.addStairUp(136, 6, 1);
  b.addFlagpole(150);

  return b.toMatrix();
}

export const WORLD_4_3_LEVEL: LevelDefinition = {
  id: '4-3',
  world: 4,
  stage: 3,
  biome: 'athletic',
  bgPreset: 'mushroom-platforms',
  music: 'overworld',
  timeLimit: 300,
  widthCols: 164,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld4_3Matrix(),
  blockContents: [{ col: 29, row: 2, payload: 'powerup-progressive' }],
  pipes: [],
  platforms: [
    {
      id: 'lift-4-3-bal-1a',
      type: 'scale-balance-pair',
      col: 36,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-4-3-bal-1b',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-4-3-bal-1b',
      type: 'scale-balance-pair',
      col: 42,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-4-3-bal-1a',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-4-3-fall-1',
      type: 'fall-on-stand',
      col: 60,
      row: 6,
      widthTiles: 3,
      minBound: 4,
      maxBound: 13,
      speedPxPerFrame: 1.4,
    },
    {
      id: 'lift-4-3-bal-2a',
      type: 'scale-balance-pair',
      col: 84,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-4-3-bal-2b',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-4-3-bal-2b',
      type: 'scale-balance-pair',
      col: 90,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-4-3-bal-2a',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-4-3-osc',
      type: 'vertical-oscillate',
      col: 108,
      row: 8,
      widthTiles: 3,
      minBound: 4,
      maxBound: 11,
      speedPxPerFrame: 1.0,
    },
  ],
  fireBars: [],
  enemies: [
    { type: 'koopa-red', col: 20, row: 8 },
    { type: 'koopa-red', col: 28, row: 4 },
    { type: 'paratroopa-red-vertical', col: 66, row: 6 },
    { type: 'koopa-red', col: 74, row: 5 },
    { type: 'koopa-red', col: 100, row: 8 },
    { type: 'paratroopa-red-vertical', col: 114, row: 6 },
    { type: 'koopa-red', col: 120, row: 5 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 150,
    castleDoorCol: 156,
  },
  subWorlds: {},
};

function buildWorld4_4Matrix(): string[] {
  const widthCols = 184;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 1, widthCols, 2, '#');
  b.fillRect(0, 12, 154, 3, '#');

  // Maze Section 1 (Cols 20..68): Top Path (Rows 3..5, floor at Row 6) vs Bottom Path (Rows 8..11)
  b.fillRect(24, 6, 44, 1, '#');
  b.fillRect(24, 9, 44, 1, '#');

  // Lava Pit before Maze Section 2
  b.fillRect(70, 12, 3, 1, '.');
  for (let c = 70; c <= 72; c++) {
    b.setTile(c, 13, 'L');
    b.setTile(c, 14, 'l');
  }

  // Maze Section 2 (Cols 74..124): Correct Path is Bottom Corridor (Rows 10..11)
  b.fillRect(80, 5, 44, 1, '#');
  b.fillRect(80, 9, 44, 1, '#');

  // Fire-Bar Pivots
  b.setTile(44, 9, 'X');
  b.setTile(96, 9, 'X');
  b.setTile(112, 9, 'X');
  b.setTile(136, 8, 'X');

  // Bowser's Collapsible Bridge (Cols 154..166) & Castle Axe at Col 167
  b.addCastleBridgeAndAxe(154, 13, 10);

  return b.toMatrix();
}

export const WORLD_4_4_LEVEL: LevelDefinition = {
  id: '4-4',
  world: 4,
  stage: 4,
  biome: 'castle',
  bgPreset: 'castle-stone',
  music: 'castle',
  timeLimit: 400,
  widthCols: 184,
  playerStart: {
    col: 2,
    row: 10,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld4_4Matrix(),
  blockContents: [],
  pipes: [],
  platforms: [],
  fireBars: [
    {
      col: 44,
      row: 9,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 0,
      angularVelocityDegPerFrame: 2.4,
    },
    {
      col: 96,
      row: 9,
      lengthBalls: 6,
      clockwise: false,
      initialAngleDeg: 90,
      angularVelocityDegPerFrame: 2.5,
    },
    {
      col: 112,
      row: 9,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 180,
      angularVelocityDegPerFrame: 2.5,
    },
    {
      col: 136,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 45,
      angularVelocityDegPerFrame: 2.6,
    },
  ],
  castleMazeLoop: [
    {
      checkCol: 68,
      validRowMin: 3,
      validRowMax: 5,
      rewindToCol: 20,
    },
    {
      checkCol: 124,
      validRowMin: 10,
      validRowMax: 11,
      rewindToCol: 74,
    },
  ],
  enemies: [
    { type: 'podoboo', col: 71, row: 12 },
    {
      type: 'bowser',
      col: 160,
      row: 9,
      bowserTrueForm: 'spiny',
      bowserThrowsHammers: false,
    },
  ],
  goal: {
    type: 'castle-axe',
    axeCol: 167,
    bridgeStartCol: 154,
    bridgeEndCol: 166,
    rescueNpc: 'toad',
  },
  subWorlds: {},
};

export const WORLD_4_LEVELS: LevelDefinition[] = [
  WORLD_4_1_LEVEL,
  WORLD_4_2_LEVEL,
  WORLD_4_3_LEVEL,
  WORLD_4_4_LEVEL,
];
