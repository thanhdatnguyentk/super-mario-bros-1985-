import type { LevelDefinition } from '../types/level-schema.ts';
import { StageMatrixBuilder } from './StageBuilder.ts';

function buildWorld8_1BonusMatrix(): string[] {
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

function buildWorld8_1Matrix(): string[] {
  const widthCols = 280;
  const b = new StageMatrixBuilder(widthCols);

  // Marathon Overworld with 6 Pits (including wide running-jump chasms!)
  b.addGroundWithPits([
    [42, 44],
    [86, 89],
    [138, 141],
    [188, 191],
    [208, 213],
    [232, 236],
  ]);

  b.addPipe(20, 3);
  b.addPipe(32, 4);
  b.setTile(62, 8, 'H'); // Hidden 1-Up Mushroom

  b.fillRect(66, 9, 6, 1, 'B');
  b.setTile(68, 9, '?'); // Progressive Power-Up

  b.addPipe(104, 4); // Bonus room entry
  b.fillRect(128, 9, 7, 1, 'B');
  b.setTile(132, 9, 'B'); // Starman

  b.addPipe(154, 3); // Bonus room exit
  b.fillRect(174, 9, 6, 1, 'B'); // Col 178 = multi-coin-10

  b.addStairUp(200, 5, 2);
  b.addStairDown(216, 5);

  b.addStairUp(250, 8, 2);
  b.addFlagpole(266);

  return b.toMatrix();
}

export const WORLD_8_1_LEVEL: LevelDefinition = {
  id: '8-1',
  world: 8,
  stage: 1,
  biome: 'overworld',
  bgPreset: 'hills-clouds-bushes',
  music: 'overworld',
  timeLimit: 300,
  widthCols: 280,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld8_1Matrix(),
  blockContents: [
    { col: 62, row: 8, payload: 'one-up' },
    { col: 68, row: 9, payload: 'powerup-progressive' },
    { col: 132, row: 9, payload: 'starman' },
    { col: 178, row: 9, payload: 'multi-coin-10' },
  ],
  pipes: [
    {
      id: 'pipe-8-1-bonus-entry',
      enterCol: 104,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: '8-1-bonus',
      exitCol: 2,
      exitRow: 2,
      exitDirection: 'drop-from-ceiling',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'buzzy-beetle', col: 16, row: 12 },
    { type: 'piranha-plant', col: 20, row: 10 },
    { type: 'piranha-plant', col: 32, row: 9 },
    { type: 'koopa-green', col: 50, row: 12 },
    { type: 'koopa-green', col: 53, row: 12 },
    { type: 'koopa-green', col: 56, row: 12 },
    { type: 'lakitu', col: 74, row: 3 },
    { type: 'piranha-plant', col: 104, row: 9 },
    { type: 'buzzy-beetle', col: 118, row: 12 },
    { type: 'buzzy-beetle', col: 122, row: 12 },
    { type: 'paratroopa-green-leaping', col: 146, row: 10 },
    { type: 'piranha-plant', col: 154, row: 10 },
    { type: 'goomba', col: 164, row: 12 },
    { type: 'goomba', col: 166, row: 12 },
    { type: 'goomba', col: 168, row: 12 },
    { type: 'koopa-red', col: 196, row: 12 },
    { type: 'buzzy-beetle', col: 224, row: 12 },
    { type: 'paratroopa-green-leaping', col: 242, row: 10 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 266,
    castleDoorCol: 272,
  },
  subWorlds: {
    '8-1-bonus': {
      id: '8-1-bonus',
      biome: 'underground',
      bgPreset: 'underground-brick',
      music: 'underground',
      widthCols: 16,
      scrollLocked: true,
      tileMatrix: buildWorld8_1BonusMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-8-1-bonus-exit',
          enterCol: 13,
          enterRow: 11,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 154,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
    },
  },
};

function buildWorld8_2BonusMatrix(): string[] {
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

function buildWorld8_2Matrix(): string[] {
  const widthCols = 216;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [48, 51],
    [108, 111],
    [160, 165],
  ]);

  // Opening Pyramid with Lakitu Overhead
  b.addStairUp(14, 5, 2);
  b.addStairDown(21, 5);

  b.fillRect(56, 9, 5, 1, 'B');
  b.setTile(58, 5, 'B'); // 1-Up Mushroom
  b.setTile(60, 9, '?'); // Progressive Power-Up

  // Bullet Bill Cannon Gauntlet
  b.addBulletCannon(72, 10, 3);
  b.addBulletCannon(88, 9, 4);
  b.addBulletCannon(102, 10, 3);
  b.addBulletCannon(124, 9, 4);

  // Bonus Pipe (Col 146) & Return Pipe (Col 174)
  b.addPipe(146, 4);
  b.addPipe(174, 3);

  b.addStairUp(186, 8, 2);
  b.addFlagpole(202);

  return b.toMatrix();
}

export const WORLD_8_2_LEVEL: LevelDefinition = {
  id: '8-2',
  world: 8,
  stage: 2,
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
  tileMatrix: buildWorld8_2Matrix(),
  blockContents: [
    { col: 58, row: 5, payload: 'one-up' },
    { col: 60, row: 9, payload: 'powerup-progressive' },
  ],
  pipes: [
    {
      id: 'pipe-8-2-bonus-entry',
      enterCol: 146,
      enterRow: 9,
      enterDirection: 'down',
      targetAreaId: '8-2-bonus',
      exitCol: 2,
      exitRow: 2,
      exitDirection: 'drop-from-ceiling',
    },
  ],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'lakitu', col: 20, row: 3 },
    { type: 'paratroopa-green-leaping', col: 36, row: 10 },
    { type: 'buzzy-beetle', col: 62, row: 12 },
    { type: 'bullet-bill-generator', col: 72, row: 10 },
    { type: 'bullet-bill-generator', col: 88, row: 9 },
    { type: 'bullet-bill-generator', col: 102, row: 10 },
    { type: 'hammer-bro', col: 116, row: 12 },
    { type: 'bullet-bill-generator', col: 124, row: 9 },
    { type: 'buzzy-beetle', col: 136, row: 12 },
    { type: 'piranha-plant', col: 146, row: 9 },
    { type: 'piranha-plant', col: 174, row: 10 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 202,
    castleDoorCol: 208,
  },
  subWorlds: {
    '8-2-bonus': {
      id: '8-2-bonus',
      biome: 'underground',
      bgPreset: 'underground-brick',
      music: 'underground',
      widthCols: 16,
      scrollLocked: true,
      tileMatrix: buildWorld8_2BonusMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-8-2-bonus-exit',
          enterCol: 13,
          enterRow: 11,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 174,
          exitRow: 10,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [],
    },
  },
};

function buildWorld8_3Matrix(): string[] {
  const widthCols = 212;
  const b = new StageMatrixBuilder(widthCols);

  b.addGroundWithPits([
    [70, 72],
    [148, 151],
  ]);

  // Fortress Battlement Walls ('X') & Pipes
  b.fillRect(14, 8, 2, 5, 'X');
  b.addPipe(24, 3);
  b.addBulletCannon(34, 9, 4);

  // Hammer Bros Pair #1 Two-Tier Brick Arena (Cols 44..54)
  b.fillRect(44, 9, 9, 1, 'B');
  b.fillRect(44, 5, 9, 1, 'B');
  b.setTile(48, 5, '?'); // Progressive Power-Up

  // Hammer Bros Pair #2 Two-Tier Brick Arena (Cols 88..98)
  b.fillRect(88, 9, 9, 1, 'B');
  b.fillRect(88, 5, 9, 1, 'B');
  b.setTile(92, 9, 'B'); // Progressive Power-Up

  b.addPipe(112, 4);

  // Hammer Bros Pair #3 & #4 Ground Gauntlet (Cols 128..174)
  b.fillRect(128, 9, 7, 1, 'B');
  b.setTile(131, 9, '?'); // Progressive Power-Up
  b.fillRect(162, 8, 2, 5, 'X');

  b.addStairUp(180, 8, 2);
  b.addFlagpole(198);

  return b.toMatrix();
}

export const WORLD_8_3_LEVEL: LevelDefinition = {
  id: '8-3',
  world: 8,
  stage: 3,
  biome: 'overworld',
  bgPreset: 'hills-clouds-bushes',
  music: 'overworld',
  timeLimit: 300,
  widthCols: 212,
  playerStart: {
    col: 3,
    row: 12,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld8_3Matrix(),
  blockContents: [
    { col: 48, row: 5, payload: 'powerup-progressive' },
    { col: 92, row: 9, payload: 'powerup-progressive' },
    { col: 131, row: 9, payload: 'powerup-progressive' },
  ],
  pipes: [],
  platforms: [],
  fireBars: [],
  enemies: [
    { type: 'piranha-plant', col: 24, row: 10 },
    { type: 'bullet-bill-generator', col: 34, row: 9 },
    { type: 'hammer-bro', col: 46, row: 4 },
    { type: 'hammer-bro', col: 50, row: 8 },
    { type: 'koopa-red', col: 64, row: 12 },
    { type: 'hammer-bro', col: 90, row: 4 },
    { type: 'hammer-bro', col: 94, row: 8 },
    { type: 'piranha-plant', col: 112, row: 9 },
    { type: 'hammer-bro', col: 132, row: 12 },
    { type: 'hammer-bro', col: 136, row: 12 },
    { type: 'hammer-bro', col: 166, row: 12 },
    { type: 'hammer-bro', col: 170, row: 12 },
  ],
  goal: {
    type: 'flagpole',
    flagpoleCol: 198,
    castleDoorCol: 204,
  },
  subWorlds: {},
};

function buildWorld8_4UnderwaterMatrix(): string[] {
  const b = new StageMatrixBuilder(64);
  b.addGroundWithPits([[24, 27]]);
  b.fillRect(0, 1, 64, 2, '#');
  b.fillRect(14, 9, 1, 4, 'X');
  b.setTile(20, 8, 'X');
  b.setTile(36, 7, 'X');
  b.fillRect(46, 9, 1, 4, 'X');

  b.fillRect(52, 2, 8, 3, '#');
  b.fillRect(52, 11, 8, 2, '#');
  b.addHorizontalExitPipe(54, 11);
  return b.toMatrix();
}

function buildWorld8_4Matrix(): string[] {
  const widthCols = 220;
  const b = new StageMatrixBuilder(widthCols);

  b.fillRect(0, 1, widthCols, 2, '#');
  b.fillRect(0, 11, 186, 4, '#');

  // Chamber 1 Lava Pit (Cols 14..24) & Decoy Pipe (Col 34) + Correct Pipe #1 (Col 66)
  b.fillRect(14, 11, 11, 2, '.');
  for (let c = 14; c <= 24; c++) {
    b.setTile(c, 13, 'L');
    b.setTile(c, 14, 'l');
  }
  b.addPipe(34, 3, 11); // Wrong pipe (loops back to col 6!)
  b.addPipe(66, 3, 11); // Correct pipe #1 -> advances to Chamber 2 (col 76)!
  b.fillRect(70, 3, 2, 8, '#');

  // Chamber 2 (Cols 74..136): Lava Pit (Cols 96..106) + Correct Pipe #2 (Col 116 -> '8-4-underwater')
  b.addPipe(76, 2, 11);
  b.setTile(92, 8, 'H'); // Hidden stepping block before lava jump
  b.fillRect(96, 11, 11, 2, '.');
  for (let c = 96; c <= 106; c++) {
    b.setTile(c, 13, 'L');
    b.setTile(c, 14, 'l');
  }
  b.addPipe(116, 4, 11); // Correct pipe #2 -> enters '8-4-underwater'!
  b.fillRect(136, 3, 2, 8, '#');

  // Chamber 3 (Cols 140..219): Exit from '8-4-underwater' at Pipe Col 146 -> Hammer Bro -> Real King Bowser -> Princess Peach!
  b.addPipe(146, 2, 11);
  b.fillRect(160, 11, 6, 2, '.');
  for (let c = 160; c <= 165; c++) {
    b.setTile(c, 13, 'L');
    b.setTile(c, 14, 'l');
  }
  b.setTile(154, 8, 'X');

  // Final Collapsible Bridge (Cols 186..198) & Castle Axe at Col 199
  b.addCastleBridgeAndAxe(186, 13, 10);

  return b.toMatrix();
}

export const WORLD_8_4_LEVEL: LevelDefinition = {
  id: '8-4',
  world: 8,
  stage: 4,
  biome: 'castle',
  bgPreset: 'castle-stone',
  music: 'castle',
  timeLimit: 400,
  widthCols: 220,
  playerStart: {
    col: 2,
    row: 8,
    entranceType: 'stand',
  },
  tileMatrix: buildWorld8_4Matrix(),
  blockContents: [{ col: 92, row: 8, payload: 'coin' }],
  pipes: [
    {
      id: 'pipe-8-4-wrong-loop',
      enterCol: 34,
      enterRow: 8,
      enterDirection: 'down',
      targetAreaId: 'main',
      exitCol: 6,
      exitRow: 10,
      exitDirection: 'up',
    },
    {
      id: 'pipe-8-4-chamber-2',
      enterCol: 66,
      enterRow: 8,
      enterDirection: 'down',
      targetAreaId: 'main',
      exitCol: 76,
      exitRow: 9,
      exitDirection: 'up',
    },
    {
      id: 'pipe-8-4-underwater-entry',
      enterCol: 116,
      enterRow: 7,
      enterDirection: 'down',
      targetAreaId: '8-4-underwater',
      exitCol: 3,
      exitRow: 4,
      exitDirection: 'drop-from-ceiling',
    },
  ],
  platforms: [
    {
      id: 'lift-8-4-lava-1',
      type: 'horizontal-oscillate',
      col: 16,
      row: 10,
      widthTiles: 3,
      minBound: 15,
      maxBound: 22,
      speedPxPerFrame: 1.0,
    },
  ],
  fireBars: [
    {
      col: 154,
      row: 8,
      lengthBalls: 6,
      clockwise: true,
      initialAngleDeg: 0,
      angularVelocityDegPerFrame: 2.6,
    },
  ],
  castleMazeLoop: [
    {
      checkCol: 69,
      validRowMin: 3,
      validRowMax: 7,
      rewindToCol: 6,
    },
    {
      checkCol: 135,
      validRowMin: 3,
      validRowMax: 6,
      rewindToCol: 76,
    },
  ],
  enemies: [
    { type: 'buzzy-beetle', col: 28, row: 10 },
    { type: 'piranha-plant', col: 34, row: 8 },
    { type: 'piranha-plant', col: 66, row: 8 },
    { type: 'cheep-flying-generator', col: 88, row: 14 },
    { type: 'piranha-plant', col: 116, row: 7 },
    { type: 'podoboo', col: 162, row: 12 },
    { type: 'hammer-bro', col: 172, row: 10 },
    {
      type: 'bowser',
      col: 192,
      row: 9,
      bowserTrueForm: 'real-bowser',
      bowserThrowsHammers: true,
    },
  ],
  goal: {
    type: 'castle-axe',
    axeCol: 199,
    bridgeStartCol: 186,
    bridgeEndCol: 198,
    rescueNpc: 'princess-peach',
  },
  subWorlds: {
    '8-4-underwater': {
      id: '8-4-underwater',
      biome: 'underwater',
      bgPreset: 'underwater-coral',
      music: 'underwater',
      widthCols: 64,
      scrollLocked: false,
      tileMatrix: buildWorld8_4UnderwaterMatrix(),
      blockContents: [],
      pipes: [
        {
          id: 'pipe-8-4-underwater-exit',
          enterCol: 54,
          enterRow: 9,
          enterDirection: 'right',
          targetAreaId: 'main',
          exitCol: 146,
          exitRow: 9,
          exitDirection: 'up',
        },
      ],
      platforms: [],
      enemies: [
        { type: 'blooper', col: 18, row: 6 },
        { type: 'cheep-red-swim', col: 32, row: 7 },
        { type: 'blooper', col: 42, row: 5 },
      ],
    },
  },
};

export const WORLD_8_LEVELS: LevelDefinition[] = [
  WORLD_8_1_LEVEL,
  WORLD_8_2_LEVEL,
  WORLD_8_3_LEVEL,
  WORLD_8_4_LEVEL,
];
