import type { LevelDefinition, SubWorldArea } from '../types/level-schema.ts';
import { StageMatrixBuilder } from './StageBuilder.ts';
import { WORLD_1_1_LEVEL } from './TestStage1_1.ts';

export { WORLD_1_1_LEVEL };

function buildWorld1_2BonusMatrix(): string[] {
  const b = new StageMatrixBuilder(16);
  b.addGroundWithPits([]);
  b.fillRect(0, 2, 1, 11, 'B');
  b.fillRect(1, 1, 13, 1, 'B');
  b.fillRect(3, 6, 10, 1, 'B');
  b.fillRect(3, 5, 10, 1, 'C');
  b.fillRect(4, 9, 8, 1, 'C');
  b.addHorizontalExitPipe(13, 13);
  return b.toMatrix();
}

function buildWorld1_2OverworldExitMatrix(): string[] {
  const b = new StageMatrixBuilder(44);
  b.addGroundWithPits([]);
  b.addPipe(4, 2);
  b.addStairUp(12, 8, 1);
  b.addFlagpole(29);
  return b.toMatrix();
}

function buildWorld1_2Matrix(): string[] {
  const widthCols = 196;
  const b = new StageMatrixBuilder(widthCols);

  // Underground Floor with pits at cols 80..82, 123..125, 137..143, 153..159
  b.addGroundWithPits([
    [80, 82],
    [123, 125],
    [137, 143],
    [153, 159],
  ]);

  // Left Entrance Pipe & Ceiling Bricks (leaving gap at 136..142 so Mario can jump above ceiling to Warp Zone!)
  b.fillRect(0, 2, 1, 11, 'B');
  b.fillRect(6, 1, 130, 1, 'B');
  b.fillRect(143, 1, 52, 1, 'B');

  // Opening 5 Question Blocks (Cols 10..14, Row 9)
  for (let c = 10; c <= 14; c++) {
    b.setTile(c, 9, '?');
  }

  // Stepped Hard Pillars (Cols 18..28)
  b.fillRect(18, 12, 1, 1, 'X');
  b.fillRect(20, 11, 1, 2, 'X');
  b.fillRect(22, 10, 1, 3, 'X');
  b.fillRect(24, 9, 1, 4, 'X');
  b.fillRect(26, 9, 1, 4, 'X');
  b.fillRect(28, 10, 1, 3, 'X');

  // Mid-section Brick Structures (Cols 39..74)
  b.fillRect(39, 8, 3, 1, 'B');
  b.setTile(45, 6, 'B'); // Starman brick
  b.fillRect(50, 5, 6, 3, 'B');
  b.fillRect(52, 4, 4, 1, 'C');
  b.fillRect(60, 8, 6, 1, 'B');
  b.setTile(69, 8, 'B'); // Multi-coin-10 brick
  b.fillRect(74, 5, 4, 1, 'B');
  b.setTile(86, 4, 'B'); // 1-Up Mushroom brick

  // Floating Coin Arc (Cols 88..94)
  for (let c = 88; c <= 93; c++) {
    b.setTile(c, 8, 'C');
  }

  // Three Underground Warp Pipes (Cols 103, 109, 115)
  b.addPipe(103, 3);
  b.addPipe(109, 4);
  b.addPipe(115, 2);

  // Staircase before Elevator Lifts (Cols 128..135)
  b.addStairUp(128, 4, 1);
  b.fillRect(145, 9, 6, 1, 'B');

  // Normal Exit Pipe to Overworld Flagpole (Col 164) & Ceiling Wall
  b.fillRect(162, 10, 8, 3, 'B');
  b.addHorizontalExitPipe(165, 10);
  b.fillRect(168, 2, 2, 11, 'B');

  // Famous World 1-2 WARP ZONE Room (Cols 172..195) with Pipes to Worlds 4, 3, 2
  b.fillRect(195, 2, 1, 11, 'B');
  b.addPipe(178, 4); // World 4
  b.addPipe(184, 4); // World 3
  b.addPipe(190, 4); // World 2

  return b.toMatrix();
}

export const WORLD_1_2_LEVEL: LevelDefinition = {
  id: '1-2',
  world: 1,
  stage: 2,
  biome: 'underground',
  bgPreset: 'underground-brick',
  music: 'underground',
  timeLimit: 400,
  widthCols: 196,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld1_2Matrix(),
  blockContents: [
    { col: 10, row: 9, payload: 'powerup-progressive' },
    { col: 45, row: 6, payload: 'starman' },
    { col: 69, row: 8, payload: 'multi-coin-10' },
    { col: 86, row: 4, payload: 'one-up' },
    { col: 147, row: 9, payload: 'powerup-progressive' },
  ],
  pipes: [
    {
      id: 'pipe-1-2-bonus-entry',
      enterCol: 103,
      enterRow: 10,
      enterDirection: 'down',
      targetAreaId: '1-2-bonus',
      exitCol: 2,
      exitRow: 2,
      exitDirection: 'drop-from-ceiling',
    },
    {
      id: 'pipe-1-2-normal-exit',
      enterCol: 165,
      enterRow: 8,
      enterDirection: 'right',
      targetAreaId: '1-2-exit',
      exitCol: 4,
      exitRow: 11,
      exitDirection: 'up',
    },
    {
      id: 'pipe-1-2-warp-world-4',
      enterCol: 178,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: 'warp:4-1',
      exitCol: 3,
      exitRow: 12,
      exitDirection: 'up',
    },
    {
      id: 'pipe-1-2-warp-world-3',
      enterCol: 184,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: 'warp:3-1',
      exitCol: 3,
      exitRow: 12,
      exitDirection: 'up',
    },
    {
      id: 'pipe-1-2-warp-world-2',
      enterCol: 190,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: 'warp:2-1',
      exitCol: 3,
      exitRow: 12,
      exitDirection: 'up',
    },
  ],
  platforms: [
    {
      id: 'lift-1-2-down',
      type: 'vertical-loopDown',
      col: 139,
      row: 4,
      widthTiles: 3,
      minBound: 0,
      maxBound: 14,
      speedPxPerFrame: 1.0,
    },
    {
      id: 'lift-1-2-up',
      type: 'vertical-loopUp',
      col: 155,
      row: 10,
      widthTiles: 3,
      minBound: 0,
      maxBound: 14,
      speedPxPerFrame: 1.0,
    },
  ],
  fireBars: [],
  warpZone: {
    triggerCol: 170,
    bannerText: 'WELCOME TO WARP ZONE!',
    pipes: [
      { col: 178, row: 9, targetWorld: 4 },
      { col: 184, row: 9, targetWorld: 3 },
      { col: 190, row: 9, targetWorld: 2 },
    ],
  },
  enemies: [
    { type: 'goomba', col: 16, row: 12 },
    { type: 'goomba', col: 18, row: 12 },
    { type: 'koopa-green', col: 32, row: 12 },
    { type: 'goomba', col: 44, row: 12 },
    { type: 'goomba', col: 62, row: 12 },
    { type: 'goomba', col: 64, row: 12 },
    { type: 'koopa-red', col: 76, row: 4 },
    { type: 'piranha-plant', col: 103, row: 10 },
    { type: 'piranha-plant', col: 109, row: 9 },
    { type: 'piranha-plant', col: 115, row: 11 },
    { type: 'goomba', col: 132, row: 8 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 190,
    castleDoorCol: 194,
  },
  subWorlds: {
    '1-2-bonus': {
      id: '1-2-bonus',
      biome: 'underground',
      bgPreset: 'underground-brick',
      music: 'underground',
      widthCols: 16,
      scrollLocked: true,
      tileMatrix: buildWorld1_2BonusMatrix(),
      blockContents: [{ col: 12, row: 6, payload: 'multi-coin-10' }],
      pipes: [
        {
          id: 'pipe-1-2-bonus-exit',
          enterCol: 13,
          enterRow: 11,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 115,
          exitRow: 11,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
    },
    '1-2-exit': {
      id: '1-2-exit',
      biome: 'overworld',
      bgPreset: 'hills-clouds-bushes',
      music: 'overworld',
      widthCols: 44,
      scrollLocked: false,
      tileMatrix: buildWorld1_2OverworldExitMatrix(),
      blockContents: [],
      pipes: [],
      platforms: [],
      enemies: [],
    } satisfies SubWorldArea,
  },
};

function buildWorld1_3Matrix(): string[] {
  const widthCols = 168;
  const b = new StageMatrixBuilder(widthCols);

  // Starting Ground Island (Cols 0..16) and Ending Flagpole Island (Cols 134..167)
  b.fillRect(0, 13, 17, 2, '#');
  b.fillRect(134, 13, 34, 2, '#');

  // Athletic Treetop Platforms across the sky chasm (Cols 19..130)
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

  // Final Stair Pillars & Flagpole
  b.fillRect(138, 10, 2, 3, 'X');
  b.fillRect(142, 7, 2, 6, 'X');
  b.fillRect(146, 4, 2, 9, 'X');
  b.addFlagpole(154);

  return b.toMatrix();
}

export const WORLD_1_3_LEVEL: LevelDefinition = {
  id: '1-3',
  world: 1,
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
  tileMatrix: buildWorld1_3Matrix(),
  blockContents: [{ col: 46, row: 3, payload: 'powerup-progressive' }],
  pipes: [],
  platforms: [
    {
      id: 'lift-1-3-v1',
      type: 'vertical-oscillate',
      col: 52,
      row: 8,
      widthTiles: 3,
      minBound: 4,
      maxBound: 11,
      speedPxPerFrame: 0.9,
    },
    {
      id: 'lift-1-3-h1',
      type: 'horizontal-oscillate',
      col: 92,
      row: 9,
      widthTiles: 3,
      minBound: 91,
      maxBound: 99,
      speedPxPerFrame: 0.9,
    },
    {
      id: 'lift-1-3-h2',
      type: 'horizontal-oscillate',
      col: 110,
      row: 8,
      widthTiles: 3,
      minBound: 109,
      maxBound: 116,
      speedPxPerFrame: 1.0,
    },
    {
      id: 'lift-1-3-bal-a',
      type: 'scale-balance-pair',
      col: 126,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-1-3-bal-b',
      pulleyTopRow: 2,
    },
    {
      id: 'lift-1-3-bal-b',
      type: 'scale-balance-pair',
      col: 130,
      row: 7,
      widthTiles: 3,
      minBound: 3,
      maxBound: 11,
      speedPxPerFrame: 1.0,
      pairedPlatformId: 'lift-1-3-bal-a',
      pulleyTopRow: 2,
    },
  ],
  fireBars: [],
  enemies: [
    { type: 'koopa-red', col: 28, row: 6 },
    { type: 'goomba', col: 44, row: 5 },
    { type: 'goomba', col: 46, row: 5 },
    { type: 'paratroopa-red-vertical', col: 57, row: 7 },
    { type: 'koopa-red', col: 63, row: 8 },
    { type: 'paratroopa-red-vertical', col: 98, row: 6 },
    { type: 'koopa-red', col: 120, row: 5 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 154,
    castleDoorCol: 160,
  },
  subWorlds: {},
};

function buildWorld1_4Matrix(): string[] {
  const widthCols = 160;
  const b = new StageMatrixBuilder(widthCols);

  // Stone Ceiling (Rows 1..2) & Castle Floor (Rows 11..14) with Lava Pits
  b.fillRect(0, 1, widthCols, 2, '#');
  b.fillRect(0, 11, 130, 4, '#');

  const lavaPits: Array<[number, number]> = [
    [14, 16],
    [36, 39],
    [66, 68],
    [116, 118],
  ];
  for (const [pStart, pEnd] of lavaPits) {
    b.fillRect(pStart, 11, pEnd - pStart + 1, 2, '.');
    for (let c = pStart; c <= pEnd; c++) {
      b.setTile(c, 13, 'L');
      b.setTile(c, 14, 'l');
    }
  }

  // Opening Castle Steps
  b.fillRect(0, 8, 6, 3, '#');
  b.setTile(24, 8, 'X');
  b.setTile(30, 7, '?'); // Progressive Power-Up

  // Fire-Bar Pivot Blocks ('X')
  b.setTile(24, 8, 'X');
  b.setTile(46, 8, 'X');
  b.setTile(56, 8, 'X');
  b.setTile(75, 8, 'X');
  b.setTile(86, 6, 'X');
  b.setTile(106, 8, 'X');

  // Narrow Corridor with 6 Hidden Coin Blocks (Cols 92..102)
  for (let c = 92; c <= 102; c += 2) {
    b.setTile(c, 6, 'H');
  }

  // Bowser's Collapsible Bridge (Cols 130..142) & Castle Axe at Col 143
  b.addCastleBridgeAndAxe(130, 13, 10);

  return b.toMatrix();
}

export const WORLD_1_4_LEVEL: LevelDefinition = {
  id: '1-4',
  world: 1,
  stage: 4,
  biome: 'castle',
  bgPreset: 'castle-stone',
  music: 'castle',
  timeLimit: 300,
  widthCols: 160,
  playerStart: {
    col: 2,
    row: 7,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld1_4Matrix(),
  blockContents: [
    { col: 30, row: 7, payload: 'powerup-progressive' },
    { col: 92, row: 6, payload: 'coin' },
    { col: 94, row: 6, payload: 'coin' },
    { col: 96, row: 6, payload: 'coin' },
    { col: 98, row: 6, payload: 'coin' },
    { col: 100, row: 6, payload: 'coin' },
    { col: 102, row: 6, payload: 'coin' },
  ],
  pipes: [],
  platforms: [
    {
      id: 'lift-1-4-bowser',
      type: 'horizontal-oscillate',
      col: 132,
      row: 6,
      widthTiles: 3,
      minBound: 131,
      maxBound: 139,
      speedPxPerFrame: 0.8,
    },
  ],
  fireBars: [
    {
      col: 24,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 0,
      angularVelocityDegPerFrame: 2.2,
    },
    {
      col: 46,
      row: 8,
      lengthBalls: 6,
      clockwise: false,
      initialAngleDeg: 90,
      angularVelocityDegPerFrame: 2.2,
    },
    {
      col: 56,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 180,
      angularVelocityDegPerFrame: 2.4,
    },
    {
      col: 75,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 45,
      angularVelocityDegPerFrame: 2.4,
    },
    {
      col: 86,
      row: 6,
      lengthBalls: 6,
      clockwise: false,
      initialAngleDeg: 270,
      angularVelocityDegPerFrame: 2.5,
    },
    {
      col: 106,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 120,
      angularVelocityDegPerFrame: 2.5,
    },
  ],
  enemies: [
    {
      type: 'bowser',
      col: 136,
      row: 9,
      bowserTrueForm: 'goomba',
      bowserThrowsHammers: false,
    },
  ],
  goal: {
    type: 'castle-axe',
    axeCol: 143,
    bridgeStartCol: 130,
    bridgeEndCol: 142,
    rescueNpc: 'toad',
  },
  subWorlds: {},
};

export const WORLD_1_LEVELS: LevelDefinition[] = [
  WORLD_1_1_LEVEL,
  WORLD_1_2_LEVEL,
  WORLD_1_3_LEVEL,
  WORLD_1_4_LEVEL,
];
