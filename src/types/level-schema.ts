/**
 * Super Mario Bros. (1985) — Canonical Data-Driven Level Schema
 * Native NES Resolution: 256×240 px (16×15 tiles @ 16×16 px per tile).
 * Supports all 32 stages (World 1-1 through World 8-4), Sub-Worlds, Warp Zones,
 * Coin Heavens, Moving Lifts, Fire-Bars, and Castle Maze Loop Gates (4-4, 7-4, 8-4).
 */

export type WorldNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type StageNumber = 1 | 2 | 3 | 4;
export type LevelId = `${WorldNumber}-${StageNumber}`;

export type BiomeType =
  | 'overworld'
  | 'underground'
  | 'underwater'
  | 'athletic'
  | 'castle';

export type BgSceneryPreset =
  | 'hills-clouds-bushes'
  | 'trees-fences-clouds'
  | 'night-trees'
  | 'night-snow-trees'
  | 'castle-stone'
  | 'underwater-coral'
  | 'underground-brick'
  | 'none';

export type MusicTrackId =
  | 'overworld'
  | 'underground'
  | 'underwater'
  | 'castle'
  | 'starman'
  | 'coin-heaven'
  | 'level-clear'
  | 'world-clear'
  | ' hurry-up'
  | 'game-over';

/**
 * Tile Legend for the 15-row Matrix / RLE-encoded grid:
 * '.' : Empty Air / Water
 * '#' : Ground / Stone / Underwater Floor
 * 'B' : Brick Block (breakable / bumpable)
 * '?' : Question Block (Coin by default unless overridden in blockContents)
 * 'H' : Hidden Invisible Block (revealed on upward head-butt)
 * 'X' : Hard Chiseled Stair / Castle Block (indestructible)
 * 'C' : Floating Coin
 * 'P' : Warp Pipe Top-Left
 * 'p' : Warp Pipe Top-Right
 * '[' : Warp Pipe Body-Left
 * ']' : Warp Pipe Body-Right
 * 'b' : Bullet Bill Cannon Top
 * 'c' : Bullet Bill Cannon Base
 * 'R' : Bridge Rail / Rope
 * '=' : Bridge Deck / Bowser Collapsible Bridge
 * 'L' : Lava / Water Surface Wave
 * 'l' : Lava / Water Deep Fill
 * 'A' : Castle Axe (Bowser bridge collapse trigger)
 * 'F' : Flagpole Rod
 * 'G' : Flagpole Top Ball
 */
export type TileChar =
  | '.'
  | '#'
  | 'B'
  | '?'
  | 'H'
  | 'X'
  | 'C'
  | 'P'
  | 'p'
  | '['
  | ']'
  | 'b'
  | 'c'
  | 'R'
  | '='
  | 'L'
  | 'l'
  | 'A'
  | 'F'
  | 'G';

export type BlockPayloadType =
  | 'coin'
  | 'multi-coin-10'
  | 'powerup-progressive' // Mushroom if Small, Fire Flower if Super/Fire
  | 'starman'
  | 'one-up'
  | 'vine'; // Beanstalk climbing to Coin Heaven / Subworld

export interface BlockContentOverride {
  /** Column index (0-based tile X) */
  col: number;
  /** Row index (0..14 tile Y from top) */
  row: number;
  /** Hidden or special payload inside a '?', 'B', or 'H' tile */
  payload: BlockPayloadType;
  /** Target sub-world ID if payload === 'vine' */
  targetSubworldId?: string;
}

export type PipeEntryDirection = 'down' | 'right';
export type PipeExitDirection = 'up' | 'right' | 'drop-from-ceiling';

export interface WarpPipePortal {
  id: string;
  /** Top-left tile column of the pipe entrance */
  enterCol: number;
  /** Top-left tile row of the pipe entrance */
  enterRow: number;
  enterDirection: PipeEntryDirection;
  /** Target area ('main' or subworld ID such as '1-1-bonus' or '1-2-warp-zone') */
  targetAreaId: string;
  /** Destination spawn tile column in target area */
  exitCol: number;
  /** Destination spawn tile row in target area */
  exitRow: number;
  exitDirection: PipeExitDirection;
}

export interface WarpZoneDestPipe {
  /** Tile column of the warp pipe in the Warp Zone room */
  col: number;
  /** Tile row of the warp pipe top */
  row: number;
  /** Destination World number (e.g., 4, 3, 2 in 1-2; or 8, 7, 6, 5 in 4-2) */
  targetWorld: WorldNumber;
}

export interface WarpZoneConfig {
  /** Camera X trigger where text "WELCOME TO WARP ZONE!" appears and Piranhas hide */
  triggerCol: number;
  bannerText: string;
  pipes: WarpZoneDestPipe[];
}

export type PlatformMotionType =
  | 'vertical-loopUp'
  | 'vertical-loopDown'
  | 'vertical-oscillate'
  | 'horizontal-oscillate'
  | 'fall-on-stand'
  | 'right-on-stand'
  | 'scale-balance-pair';

export interface MovingPlatformSpawn {
  id: string;
  type: PlatformMotionType;
  col: number;
  row: number;
  /** Width in 8px segments or 16px tiles (standard NES lifts: 2, 3, or 4 tiles wide) */
  widthTiles: number;
  /** Min/Max Y or X bounds in tile coordinates */
  minBound: number;
  maxBound: number;
  speedPxPerFrame: number;
  /** Partner lift ID when type === 'scale-balance-pair' */
  pairedPlatformId?: string;
  /** Pulley rope top row for scale-balance-pair */
  pulleyTopRow?: number;
}

export interface FireBarSpawn {
  col: number;
  row: number;
  /** Number of 8×8 fireballs in the arm (typically 6 or 12 in long bars) */
  lengthBalls: 6 | 12;
  clockwise: boolean;
  initialAngleDeg: number;
  angularVelocityDegPerFrame: number;
}

/**
 * Castle Maze Loop Gate (used in World 4-4, 7-4, and 8-4).
 * When Mario crosses `checkCol`, if his vertical tile row is NOT within
 * `[validRowMin, validRowMax]`, the camera and level seamlessly loop back to `rewindToCol`.
 */
export interface CastleMazeCheckpoint {
  checkCol: number;
  validRowMin: number;
  validRowMax: number;
  rewindToCol: number;
}

export type EnemyType =
  | 'goomba'
  | 'koopa-green'
  | 'koopa-red'
  | 'paratroopa-green-leaping'
  | 'paratroopa-green-fly-horizontal'
  | 'paratroopa-red-vertical'
  | 'buzzy-beetle'
  | 'piranha-plant'
  | 'hammer-bro'
  | 'lakitu'
  | 'spiny'
  | 'blooper'
  | 'cheep-red-swim'
  | 'cheep-grey-swim'
  | 'cheep-flying-generator'
  | 'bullet-bill-generator'
  | 'podoboo'
  | 'bowser';

export interface EnemySpawn {
  type: EnemyType;
  /** Spawn column (activated when camera approaches within 16 tiles) */
  col: number;
  /** Spawn row (0..14) */
  row: number;
  /** True identity revealed if Bowser is defeated with 5 fireballs in Worlds 1–7 */
  bowserTrueForm?:
    | 'goomba'
    | 'koopa-green'
    | 'buzzy-beetle'
    | 'spiny'
    | 'lakitu'
    | 'blooper'
    | 'hammer-bro'
    | 'real-bowser';
  /** Whether Bowser throws hammers in addition to fire breath (Worlds 6-4, 7-4, 8-4) */
  bowserThrowsHammers?: boolean;
}

export interface SubWorldArea {
  id: string;
  biome: BiomeType;
  bgPreset: BgSceneryPreset;
  music: MusicTrackId;
  widthCols: number;
  /** Exactly 15 rows of length `widthCols` representing 256×240 vertical height */
  tileMatrix: string[];
  blockContents: BlockContentOverride[];
  pipes: WarpPipePortal[];
  platforms: MovingPlatformSpawn[];
  enemies: EnemySpawn[];
  warpZone?: WarpZoneConfig;
}

export interface LevelDefinition {
  id: LevelId;
  world: WorldNumber;
  stage: StageNumber;
  biome: BiomeType;
  bgPreset: BgSceneryPreset;
  music: MusicTrackId;
  /** NES timer: 400 or 300 seconds */
  timeLimit: 400 | 300;
  /** Total horizontal width in 16×16 tiles */
  widthCols: number;
  playerStart: {
    col: number;
    row: number;
    entranceType: 'walk-in-left' | 'climb-pipe' | 'drop-ceiling' | 'stand';
  };
  /**
   * 15-row tile matrix (`tileMatrix.length === 15`), where each string has length `widthCols`.
   * Row 0 is top HUD ceiling (Y=0..15px), Row 13–14 is standard 2-tile floor (Y=208..239px).
   */
  tileMatrix: string[];
  blockContents: BlockContentOverride[];
  pipes: WarpPipePortal[];
  platforms: MovingPlatformSpawn[];
  fireBars: FireBarSpawn[];
  castleMazeLoop?: CastleMazeCheckpoint[];
  enemies: EnemySpawn[];
  goal: {
    type: 'flagpole' | 'castle-axe';
    flagpoleCol?: number;
    castleDoorCol?: number;
    axeCol?: number;
    bridgeStartCol?: number;
    bridgeEndCol?: number;
    rescueNpc?: 'toad' | 'princess-peach';
  };
  subWorlds: Record<string, SubWorldArea>;
}
