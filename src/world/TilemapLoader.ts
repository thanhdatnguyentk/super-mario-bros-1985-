import { GRID_ROWS, TILE_SIZE, NES_WIDTH } from '../types/physics-constants.ts';
import type {
  BgSceneryPreset,
  BiomeType,
  BlockContentOverride,
  FireBarSpawn,
  LevelDefinition,
  MovingPlatformSpawn,
  SubWorldArea,
  WarpPipePortal,
  WarpZoneConfig,
} from '../types/level-schema.ts';
import type {
  TileCollisionSolver,
  TilemapStateSnapshot,
} from '../physics/TileCollisionSolver.ts';
import type { Camera } from '../core/Camera.ts';

export interface ActiveAreaDescriptor {
  areaId: 'main' | string;
  biome: BiomeType;
  bgPreset: BgSceneryPreset;
  widthCols: number;
  scrollLocked: boolean;
  pipes: WarpPipePortal[];
  platforms: MovingPlatformSpawn[];
  fireBars: FireBarSpawn[];
  warpZone?: WarpZoneConfig;
}

interface SavedMainAreaState {
  tilemapSnapshot: TilemapStateSnapshot;
  cameraX: number;
}

/**
 * Data-Driven Tilemap Loader & Multi-Area State Manager.
 *
 * Responsibilities:
 * - Decodes 15-row ASCII matrices OR Run-Length Encoded (RLE) rows into canonical 16×16 tile grids.
 * - Loads Main Stage (`'main'`) and Sub-Worlds (`subWorlds[id]`, e.g. underground coin rooms, warp zones, coin heavens).
 * - Snapshots and restores the Main Stage's mutated block/coin state when Mario enters and exits a Sub-World via Warp Pipes.
 */
export class TilemapLoader {
  private level: LevelDefinition;
  private collisionSolver: TileCollisionSolver;
  private camera: Camera;

  public activeArea: ActiveAreaDescriptor;
  private savedMainState: SavedMainAreaState | null = null;

  constructor(
    initialLevel: LevelDefinition,
    collisionSolver: TileCollisionSolver,
    camera: Camera
  ) {
    this.level = initialLevel;
    this.collisionSolver = collisionSolver;
    this.camera = camera;
    this.activeArea = this.createMainDescriptor(initialLevel);
  }

  /**
   * Encode a raw tile row string into compact Run-Length Encoding (e.g. "4.,2#,10.").
   */
  public static encodeRowRLE(rawRow: string): string {
    if (rawRow.length === 0) return '';
    const segments: string[] = [];
    let currentChar = rawRow[0];
    let count = 1;

    for (let i = 1; i < rawRow.length; i++) {
      const ch = rawRow[i];
      if (ch === currentChar) {
        count++;
      } else {
        segments.push(`${count}${currentChar}`);
        currentChar = ch;
        count = 1;
      }
    }
    segments.push(`${count}${currentChar}`);
    return segments.join(',');
  }

  /**
   * Decode either a raw ASCII row string or an RLE-encoded row string into a fixed-width row of `widthCols` tiles.
   */
  public static decodeRow(rowInput: string, widthCols: number): string {
    // Detect RLE format (e.g. "12.,2P,5." or "212#")
    const isRle = /^\d+[^,]+(,\d+[^,]+)*$/.test(rowInput.trim());
    let expanded = rowInput;

    if (isRle) {
      const parts = rowInput.trim().split(',');
      let out = '';
      for (const part of parts) {
        const match = /^(\d+)(.)$/.exec(part.trim());
        if (match) {
          const count = Number.parseInt(match[1], 10);
          const ch = match[2];
          out += ch.repeat(Math.max(0, count));
        }
      }
      expanded = out;
    }

    if (expanded.length >= widthCols) {
      return expanded.slice(0, widthCols);
    }
    return expanded.padEnd(widthCols, '.');
  }

  /**
   * Decode a 15-row matrix (raw or RLE) into 15 normalized strings of length `widthCols`.
   */
  public static decodeMatrix(rows: string[], widthCols: number): string[] {
    const normalized: string[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      const raw = rows[r] ?? '';
      normalized.push(TilemapLoader.decodeRow(raw, widthCols));
    }
    return normalized;
  }

  private createMainDescriptor(level: LevelDefinition): ActiveAreaDescriptor {
    return {
      areaId: 'main',
      biome: level.biome,
      bgPreset: level.bgPreset,
      widthCols: level.widthCols,
      scrollLocked: false,
      pipes: level.pipes,
      platforms: level.platforms,
      fireBars: level.fireBars,
      warpZone: level.warpZone,
    };
  }

  private createSubworldDescriptor(sub: SubWorldArea): ActiveAreaDescriptor {
    return {
      areaId: sub.id,
      biome: sub.biome,
      bgPreset: sub.bgPreset,
      widthCols: sub.widthCols,
      scrollLocked: sub.scrollLocked ?? sub.widthCols <= 16,
      pipes: sub.pipes,
      platforms: sub.platforms,
      fireBars: [],
      warpZone: sub.warpZone,
    };
  }

  /**
   * Load a fresh LevelDefinition (resets main area snapshot and loads 'main').
   */
  public loadLevel(level: LevelDefinition): void {
    this.level = level;
    this.savedMainState = null;
    this.activeArea = this.createMainDescriptor(level);

    const decodedRows = TilemapLoader.decodeMatrix(
      level.tileMatrix,
      level.widthCols
    );
    this.collisionSolver.loadAreaGrid(
      level.widthCols,
      decodedRows,
      level.blockContents
    );
    this.camera.setLevelWidthCols(level.widthCols);
    this.camera.forceSetX(0);
  }

  /**
   * Switch between `'main'` and any configured `SubWorldDefinition` in `level.subWorlds`.
   * Preserves `'main'` block/coin state across underground pipe trips!
   */
  public switchArea(targetAreaId: 'main' | string, exitCol: number): boolean {
    if (targetAreaId === 'main') {
      this.activeArea = this.createMainDescriptor(this.level);
      if (this.savedMainState) {
        this.collisionSolver.restoreStateSnapshot(
          this.savedMainState.tilemapSnapshot
        );
      } else {
        const decodedRows = TilemapLoader.decodeMatrix(
          this.level.tileMatrix,
          this.level.widthCols
        );
        this.collisionSolver.loadAreaGrid(
          this.level.widthCols,
          decodedRows,
          this.level.blockContents
        );
      }

      this.camera.setLevelWidthCols(this.level.widthCols);
      const maxCameraX = Math.max(
        0,
        this.level.widthCols * TILE_SIZE - NES_WIDTH
      );
      const targetCamX = Math.max(
        0,
        Math.min(maxCameraX, (exitCol - 3) * TILE_SIZE)
      );
      this.camera.forceSetX(targetCamX);
      return true;
    }

    const sub = this.level.subWorlds[targetAreaId];
    if (!sub) {
      return false;
    }

    // Snapshot Main Area before entering Sub-World
    if (this.activeArea.areaId === 'main') {
      this.savedMainState = {
        tilemapSnapshot: this.collisionSolver.exportStateSnapshot(),
        cameraX: this.camera.x,
      };
    }

    this.activeArea = this.createSubworldDescriptor(sub);
    const decodedSubRows = TilemapLoader.decodeMatrix(
      sub.tileMatrix,
      sub.widthCols
    );
    const subBlocks: BlockContentOverride[] = sub.blockContents ?? [];
    this.collisionSolver.loadAreaGrid(
      sub.widthCols,
      decodedSubRows,
      subBlocks
    );
    this.camera.setLevelWidthCols(sub.widthCols);
    this.camera.forceSetX(0);
    return true;
  }
}
