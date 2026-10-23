import {
  NES_WIDTH,
  NES_HEIGHT,
  TILE_SIZE,
  GRID_ROWS,
} from '../types/physics-constants.ts';
import type { LevelDefinition } from '../types/level-schema.ts';
import { NES_BIOME_PALETTES, type BiomePalette } from './NesPalette.ts';
import { drawTile16x16 } from './PixelSpriteAtlas.ts';
import type { Camera } from '../core/Camera.ts';
import type { TileCollisionSolver } from '../physics/TileCollisionSolver.ts';
import type { Mario } from '../entities/player/Mario.ts';
import type { ItemManager } from '../entities/items/ItemManager.ts';
import type { ActiveAreaDescriptor } from '../world/TilemapLoader.ts';

export interface HudTelemetryState {
  score: number;
  coins: number;
  worldLabel: string;
  timeRemaining: number;
  lives: number;
}

export class Renderer {
  private animFrame = 0;

  public renderFrame(
    ctx: CanvasRenderingContext2D,
    level: LevelDefinition,
    activeArea: ActiveAreaDescriptor,
    camera: Camera,
    collisionSolver: TileCollisionSolver,
    itemManager: ItemManager,
    mario: Mario,
    pipeCutsceneActive: boolean,
    hud: HudTelemetryState
  ): void {
    this.animFrame++;
    const palette = NES_BIOME_PALETTES[activeArea.biome];

    // 1. Clear 256×240 frame with Biome Sky color
    ctx.fillStyle = palette.skyBg;
    ctx.fillRect(0, 0, NES_WIDTH, NES_HEIGHT);

    // 2. Render Repeating NES Scenery (Hills, Clouds, Bushes, Castle Goal) in Main Overworld
    if (
      activeArea.areaId === 'main' &&
      activeArea.bgPreset === 'hills-clouds-bushes'
    ) {
      this.renderOverworldScenery(ctx, camera, palette, level);
    }

    // 2.5 Render Emerging Power-Ups / Vines & Pipe-Cutscene Mario BEHIND Foreground Tiles (NES PPU Priority)
    itemManager.renderBehindTiles(ctx, camera);
    if (pipeCutsceneActive) {
      mario.render(ctx, camera);
    }

    // 3. Render Visible Tilemap Columns (with 1-column margin)
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const endCol = Math.min(
      activeArea.widthCols - 1,
      Math.ceil((camera.x + NES_WIDTH) / TILE_SIZE) + 1
    );

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const ch = collisionSolver.getTile(c, r);
        if (ch === '.' || ch === 'H') continue;

        const screenX = camera.worldToScreenX(c * TILE_SIZE);
        const bumpOffsetY = collisionSolver.getBumpOffsetY(c, r);
        const screenY = camera.worldToScreenY(r * TILE_SIZE) + bumpOffsetY;

        drawTile16x16(ctx, ch, screenX, screenY, palette, this.animFrame);
      }
    }

    // 4. Render Flagpole Banner & End Castle if visible in Main Area
    if (
      activeArea.areaId === 'main' &&
      level.goal.type === 'flagpole' &&
      level.goal.flagpoleCol
    ) {
      this.renderGoalFlagAndCastle(ctx, camera, level.goal.flagpoleCol, mario);
    }

    // 5. Render Active Power-Up Items & Spinning Block Coins
    itemManager.renderInFrontOfTiles(ctx, camera);

    // 6. Render Shattered Brick Debris Particles
    for (const p of collisionSolver.debrisParticles) {
      const sx = camera.worldToScreenX(p.x);
      const sy = camera.worldToScreenY(p.y);
      ctx.fillStyle = palette.brickPrimary;
      ctx.fillRect(sx, sy, 6, 6);
      ctx.fillStyle = palette.groundHighlight;
      ctx.fillRect(sx, sy, 3, 2);
    }

    // 7. Render Mario & Active Fireballs (when not behind pipe lip)
    if (!pipeCutsceneActive) {
      mario.render(ctx, camera);
    }

    // 8. Render Floating Score Popups (e.g. "200", "1000", "1UP")
    ctx.font = 'bold 8px monospace';
    ctx.textBaseline = 'top';
    for (const popup of collisionSolver.scorePopups) {
      const sx = camera.worldToScreenX(popup.x);
      const sy = camera.worldToScreenY(popup.y);
      ctx.fillStyle = '#000000';
      ctx.fillText(popup.text, sx + 1, sy + 1);
      ctx.fillStyle = '#FCFCFC';
      ctx.fillText(popup.text, sx, sy);
    }

    // 9. Render Classic NES Top HUD Bar (MARIO | COINS | WORLD | TIME)
    this.renderNesHud(ctx, hud, palette);
  }

  private renderOverworldScenery(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    palette: BiomePalette,
    level: LevelDefinition
  ): void {
    // Scenery repeats every 48 tiles (768px) just like NES Super Mario Bros.
    const repeatSpanCols = 48;
    const totalRepeats = Math.ceil(level.widthCols / repeatSpanCols);

    for (let rep = 0; rep < totalRepeats; rep++) {
      const baseCol = rep * repeatSpanCols;

      // Large Hill at col + 0, Small Hill at col + 16
      this.drawHill(ctx, camera, (baseCol + 1) * TILE_SIZE, 176, 5, 2, palette);
      this.drawHill(ctx, camera, (baseCol + 16) * TILE_SIZE, 192, 3, 1, palette);

      // Clouds at col + 8, 19, 27, 36
      this.drawCloud(ctx, camera, (baseCol + 8) * TILE_SIZE, 48, 3, palette);
      this.drawCloud(ctx, camera, (baseCol + 19) * TILE_SIZE, 32, 2, palette);
      this.drawCloud(ctx, camera, (baseCol + 27) * TILE_SIZE, 48, 3, palette);
      this.drawCloud(ctx, camera, (baseCol + 36) * TILE_SIZE, 32, 2, palette);

      // Bushes at col + 11, 23, 41
      this.drawBush(ctx, camera, (baseCol + 11) * TILE_SIZE, 192, 3, palette);
      this.drawBush(ctx, camera, (baseCol + 23) * TILE_SIZE, 192, 2, palette);
      this.drawBush(ctx, camera, (baseCol + 41) * TILE_SIZE, 192, 3, palette);
    }
  }

  private drawHill(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    worldX: number,
    baseY: number,
    widthTiles: number,
    heightTiles: number,
    palette: BiomePalette
  ): void {
    const sx = camera.worldToScreenX(worldX);
    const w = widthTiles * TILE_SIZE;
    const h = heightTiles * TILE_SIZE;
    if (sx + w < 0 || sx > NES_WIDTH) return;

    ctx.fillStyle = palette.hillFill;
    for (let step = 0; step < h; step += 2) {
      const inset = step;
      const sliceW = Math.max(4, w - inset * 2);
      ctx.fillRect(sx + inset, baseY - step, sliceW, 2);
    }
    ctx.fillStyle = palette.hillOutline;
    ctx.fillRect(sx + w * 0.45, baseY - h * 0.55, 2, 6);
    ctx.fillRect(sx + w * 0.55, baseY - h * 0.45, 2, 6);
  }

  private drawCloud(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    worldX: number,
    worldY: number,
    widthTiles: number,
    palette: BiomePalette
  ): void {
    const sx = camera.worldToScreenX(worldX);
    const w = widthTiles * TILE_SIZE;
    if (sx + w < 0 || sx > NES_WIDTH) return;

    ctx.fillStyle = palette.cloudFill;
    ctx.fillRect(sx + 4, worldY + 4, w - 8, 14);
    ctx.fillRect(sx + 8, worldY, w - 16, 18);
    ctx.fillStyle = '#3CBCFC';
    ctx.fillRect(sx + 6, worldY + 15, w - 12, 2);
  }

  private drawBush(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    worldX: number,
    worldY: number,
    widthTiles: number,
    palette: BiomePalette
  ): void {
    const sx = camera.worldToScreenX(worldX);
    const w = widthTiles * TILE_SIZE;
    if (sx + w < 0 || sx > NES_WIDTH) return;

    ctx.fillStyle = palette.bushFill;
    ctx.fillRect(sx + 2, worldY + 4, w - 4, 12);
    ctx.fillRect(sx + 6, worldY + 1, w - 12, 15);
  }

  private renderGoalFlagAndCastle(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    flagpoleCol: number,
    mario: Mario
  ): void {
    const poleScreenX = camera.worldToScreenX(flagpoleCol * TILE_SIZE);
    if (poleScreenX >= -32 && poleScreenX <= NES_WIDTH + 32) {
      const flagY = mario.flagpoleSliding ? Math.min(176, mario.y) : 52;
      ctx.fillStyle = '#FCFCFC';
      ctx.fillRect(poleScreenX - 15, flagY, 16, 14);
      ctx.fillStyle = '#80D010';
      ctx.fillRect(poleScreenX - 12, flagY + 3, 10, 8);
    }

    // Small Fortress Castle 4 tiles right of Flagpole
    const castleScreenX = camera.worldToScreenX((flagpoleCol + 4) * TILE_SIZE);
    if (castleScreenX >= -80 && castleScreenX <= NES_WIDTH + 32) {
      const baseY = 128;
      ctx.fillStyle = '#C84C0C';
      ctx.fillRect(castleScreenX, baseY + 32, 80, 48);
      ctx.fillRect(castleScreenX + 16, baseY, 48, 32);
      // Battlements
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(castleScreenX + i * 16, baseY + 26, 10, 6);
      }
      // Dark arched doorway
      ctx.fillStyle = '#000000';
      ctx.fillRect(castleScreenX + 32, baseY + 52, 16, 28);
      ctx.fillRect(castleScreenX + 24, baseY + 10, 8, 12);
      ctx.fillRect(castleScreenX + 48, baseY + 10, 8, 12);
    }
  }

  private renderNesHud(
    ctx: CanvasRenderingContext2D,
    hud: HudTelemetryState,
    palette: BiomePalette
  ): void {
    ctx.font = 'bold 8px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = palette.hudText;

    const scoreStr = String(hud.score).padStart(6, '0');
    const coinStr = `x${String(hud.coins).padStart(2, '0')}`;
    const timeStr = String(Math.max(0, Math.ceil(hud.timeRemaining))).padStart(
      3,
      '0'
    );

    // Row 1: Labels
    ctx.fillText('MARIO', 24, 12);
    ctx.fillText('WORLD', 144, 12);
    ctx.fillText('TIME', 204, 12);

    // Row 2: Values
    ctx.fillText(scoreStr, 24, 21);

    // Mini flashing coin icon
    const coinPhase = Math.floor(this.animFrame / 10) % 3;
    ctx.fillStyle = palette.questionColors[coinPhase];
    ctx.fillRect(92, 21, 5, 7);
    ctx.fillStyle = palette.hudText;
    ctx.fillText(coinStr, 100, 21);

    ctx.fillText(hud.worldLabel, 152, 21);
    ctx.fillText(timeStr, 208, 21);
  }
}
