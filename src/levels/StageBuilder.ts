import { GRID_ROWS } from '../types/physics-constants.ts';

/**
 * Deterministic 15-Row Tile Matrix Builder for all 32 NES Super Mario Bros. (1985) Stages & Sub-Worlds.
 * Native vertical height is 15 tiles (240px); horizontal width is `widthCols` tiles (widthCols * 16px).
 */
export class StageMatrixBuilder {
  public readonly widthCols: number;
  private readonly grid: string[][];

  constructor(widthCols: number) {
    this.widthCols = widthCols;
    this.grid = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: widthCols }, () => '.')
    );
  }

  public setTile(col: number, row: number, ch: string): this {
    if (col >= 0 && col < this.widthCols && row >= 0 && row < GRID_ROWS) {
      this.grid[row][col] = ch;
    }
    return this;
  }

  public fillRect(
    colStart: number,
    rowStart: number,
    w: number,
    h: number,
    ch: string
  ): this {
    for (let r = rowStart; r < rowStart + h; r++) {
      for (let c = colStart; c < colStart + w; c++) {
        this.setTile(c, r, ch);
      }
    }
    return this;
  }

  /** Fill standard 2-tile floor at rows 13 & 14 with optional pit ranges `[startCol, endCol]` */
  public addGroundWithPits(pits: Array<[number, number]> = []): this {
    for (let c = 0; c < this.widthCols; c++) {
      const inPit = pits.some(([pStart, pEnd]) => c >= pStart && c <= pEnd);
      if (!inPit) {
        this.setTile(c, 13, '#');
        this.setTile(c, 14, '#');
      }
    }
    return this;
  }

  /** Fill lava ('L' surface at row 13, 'l' deep at row 14) inside pit ranges */
  public addLavaInPits(pits: Array<[number, number]>): this {
    for (const [startCol, endCol] of pits) {
      for (let c = startCol; c <= endCol; c++) {
        this.setTile(c, 13, 'L');
        this.setTile(c, 14, 'l');
      }
    }
    return this;
  }

  /** Add vertical Warp Pipe sitting on ground row 13 (`topRow = 13 - heightTiles`) */
  public addPipe(col: number, heightTiles: number, baseRow = 13): this {
    const topRow = baseRow - heightTiles;
    this.setTile(col, topRow, 'P');
    this.setTile(col + 1, topRow, 'p');
    for (let r = topRow + 1; r < baseRow; r++) {
      this.setTile(col, r, '[');
      this.setTile(col + 1, r, ']');
    }
    return this;
  }

  /** Add horizontal exit pipe connected to a vertical shaft (used in Underground / Bonus exits) */
  public addHorizontalExitPipe(mouthCol: number, floorRow = 13): this {
    this.setTile(mouthCol, floorRow - 2, 'P');
    this.setTile(mouthCol, floorRow - 1, '[');
    for (let r = 2; r < floorRow; r++) {
      this.setTile(mouthCol + 1, r, '[');
      this.setTile(mouthCol + 2, r, ']');
    }
    return this;
  }

  /** Add ascending staircase of hard 'X' blocks */
  public addStairUp(
    startCol: number,
    steps: number,
    flatTopCols = 0,
    baseRow = 12
  ): this {
    for (let s = 0; s < steps; s++) {
      this.fillRect(startCol + s, baseRow - s, 1, s + 1, 'X');
    }
    if (flatTopCols > 0) {
      this.fillRect(
        startCol + steps,
        baseRow - (steps - 1),
        flatTopCols,
        steps,
        'X'
      );
    }
    return this;
  }

  /** Add descending staircase of hard 'X' blocks */
  public addStairDown(startCol: number, steps: number, baseRow = 12): this {
    for (let s = 0; s < steps; s++) {
      const h = steps - s;
      this.fillRect(startCol + s, baseRow - (h - 1), 1, h, 'X');
    }
    return this;
  }

  /** Add athletic treetop / mushroom platform (`#` top cap with `[` trunk below) */
  public addTreePlatform(
    colStart: number,
    row: number,
    widthTiles: number
  ): this {
    this.fillRect(colStart, row, widthTiles, 1, '#');
    const trunkCol = colStart + Math.floor((widthTiles - 1) * 0.5);
    for (let r = row + 1; r < GRID_ROWS; r++) {
      this.setTile(trunkCol, r, '[');
    }
    return this;
  }

  /** Add Bullet Bill cannon turret (`b` top skull + `c` base) */
  public addBulletCannon(
    col: number,
    topRow: number,
    heightTiles = 2
  ): this {
    this.setTile(col, topRow, 'b');
    if (heightTiles >= 2) {
      this.setTile(col, topRow + 1, 'c');
    }
    for (let r = topRow + 2; r < topRow + heightTiles; r++) {
      this.setTile(col, r, 'X');
    }
    return this;
  }

  /** Add standard Flagpole ('G' top ball at row 2, 'F' rod at rows 3..11, 'X' base at row 12) */
  public addFlagpole(col: number): this {
    this.setTile(col, 12, 'X');
    for (let r = 3; r <= 11; r++) {
      this.setTile(col, r, 'F');
    }
    this.setTile(col, 2, 'G');
    return this;
  }

  /** Add Bowser's Castle Bridge (`=` deck at row 10, `R` chain at row 9, `A` axe at row 8, lava below) */
  public addCastleBridgeAndAxe(
    bridgeStartCol: number,
    bridgeLengthCols = 13,
    bridgeRow = 10
  ): { bridgeEndCol: number; axeCol: number } {
    const bridgeEndCol = bridgeStartCol + bridgeLengthCols - 1;
    const axeCol = bridgeEndCol + 1;

    for (let c = bridgeStartCol; c <= bridgeEndCol; c++) {
      this.setTile(c, bridgeRow, '=');
      this.setTile(c, 13, 'L');
      this.setTile(c, 14, 'l');
    }
    this.setTile(bridgeEndCol, bridgeRow - 1, 'R');
    this.setTile(axeCol, bridgeRow - 2, 'A');
    // Solid castle ledge starting under/after the axe
    this.fillRect(axeCol, bridgeRow, this.widthCols - axeCol, 5, '#');

    return { bridgeEndCol, axeCol };
  }

  public toMatrix(): string[] {
    return this.grid.map((row) => row.join(''));
  }
}
