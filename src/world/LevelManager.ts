import { TILE_SIZE } from '../types/physics-constants.ts';
import type { LevelDefinition, LevelId } from '../types/level-schema.ts';
import type { ActiveAreaDescriptor } from './TilemapLoader.ts';
import { WORLD_1_LEVELS } from '../levels/World1Levels.ts';
import { WORLD_2_LEVELS } from '../levels/World2Levels.ts';
import { WORLD_3_LEVELS } from '../levels/World3Levels.ts';
import { WORLD_4_LEVELS } from '../levels/World4Levels.ts';

export const CANONICAL_STAGE_ORDER: readonly LevelId[] = [
  '1-1',
  '1-2',
  '1-3',
  '1-4',
  '2-1',
  '2-2',
  '2-3',
  '2-4',
  '3-1',
  '3-2',
  '3-3',
  '3-4',
  '4-1',
  '4-2',
  '4-3',
  '4-4',
  '5-1',
  '5-2',
  '5-3',
  '5-4',
  '6-1',
  '6-2',
  '6-3',
  '6-4',
  '7-1',
  '7-2',
  '7-3',
  '7-4',
  '8-1',
  '8-2',
  '8-3',
  '8-4',
] as const;

export interface ResolvedWarpTarget {
  requestedLevelId: LevelId;
  resolvedLevelId: LevelId;
  level: LevelDefinition;
}

/**
 * Central Level Registry, Stage Progression & Warp Zone Resolver for Super Mario Bros. (1985).
 *
 * Responsibilities:
 * - Registers and indexes data-driven `LevelDefinition` stages (`1-1` through `8-4`).
 * - Resolves sequential progression (`1-1 -> 1-2 -> 1-3 -> 1-4 -> 2-1 -> ...`).
 * - Resolves Warp Zone pipe portals (`warp:4-1`, `warp:3-1`, `warp:2-1`, etc.).
 * - Evaluates Warp Zone reveal triggers (`camera.x >= warpZone.triggerCol * 16`) to hide pipe Piranha Plants and display `"WELCOME TO WARP ZONE!"`.
 */
export class LevelManager {
  private readonly registry = new Map<LevelId, LevelDefinition>();

  constructor(initialLevels?: LevelDefinition[]) {
    const defaults = initialLevels ?? [
      ...WORLD_1_LEVELS,
      ...WORLD_2_LEVELS,
      ...WORLD_3_LEVELS,
      ...WORLD_4_LEVELS,
    ];
    this.registerLevels(defaults);
  }

  public registerLevel(level: LevelDefinition): void {
    this.registry.set(level.id, level);
  }

  public registerLevels(levels: readonly LevelDefinition[]): void {
    for (const level of levels) {
      this.registry.set(level.id, level);
    }
  }

  public hasLevel(id: string): boolean {
    return this.registry.has(id as LevelId);
  }

  public getLevel(id: string): LevelDefinition | undefined {
    return this.registry.get(id as LevelId);
  }

  public getRegisteredLevelIds(): LevelId[] {
    return CANONICAL_STAGE_ORDER.filter((id) => this.registry.has(id));
  }

  public getRegisteredLevels(): LevelDefinition[] {
    const list: LevelDefinition[] = [];
    for (const id of CANONICAL_STAGE_ORDER) {
      const lvl = this.registry.get(id);
      if (lvl) list.push(lvl);
    }
    return list;
  }

  /**
   * Returns the next registered `LevelId` in canonical `1-1 -> ... -> 8-4` order.
   * Wraps back to `'1-1'` after the final registered stage.
   */
  public getNextLevelId(currentId: string): LevelId {
    const registered = this.getRegisteredLevelIds();
    if (registered.length === 0) return '1-1';

    const currentIdx = registered.indexOf(currentId as LevelId);
    if (currentIdx === -1 || currentIdx + 1 >= registered.length) {
      return registered[0];
    }
    return registered[currentIdx + 1];
  }

  public getNextLevel(currentId: string): LevelDefinition {
    const nextId = this.getNextLevelId(currentId);
    const next = this.registry.get(nextId);
    if (!next) {
      throw new Error(`Level ${nextId} is not registered in LevelManager`);
    }
    return next;
  }

  /**
   * Resolves a Warp Zone pipe target string (e.g. `'warp:4-1'`, `'warp:3-1'`, `'warp:2-1'`).
   * If the requested target world is not yet registered in the current build batch,
   * gracefully falls back to the highest registered `-1` world starter while preserving `requestedLevelId`.
   */
  public resolveWarpTarget(targetAreaId: string): ResolvedWarpTarget | null {
    if (!targetAreaId.startsWith('warp:')) {
      return null;
    }

    const requestedId = targetAreaId.slice('warp:'.length) as LevelId;
    const directMatch = this.registry.get(requestedId);
    if (directMatch) {
      return {
        requestedLevelId: requestedId,
        resolvedLevelId: requestedId,
        level: directMatch,
      };
    }

    // Fallback to the highest registered world's "-1" stage (e.g. '2-1') if Worlds 3-8 aren't loaded yet
    const registeredIds = this.getRegisteredLevelIds();
    const worldStartCandidates = registeredIds.filter((id) => id.endsWith('-1'));
    const fallbackId =
      worldStartCandidates[worldStartCandidates.length - 1] ??
      registeredIds[registeredIds.length - 1] ??
      '1-1';
    const fallbackLevel = this.registry.get(fallbackId)!;

    return {
      requestedLevelId: requestedId,
      resolvedLevelId: fallbackId,
      level: fallbackLevel,
    };
  }

  /**
   * Returns `true` when Mario or the Camera has scrolled into the Warp Zone trigger column,
   * revealing the `"WELCOME TO WARP ZONE!"` banner and pipe destination numbers while
   * suppressing any Piranha Plants inside the Warp Zone pipes.
   */
  public isWarpZoneRevealed(
    activeArea: ActiveAreaDescriptor,
    cameraX: number,
    marioX = 0
  ): boolean {
    const wz = activeArea.warpZone;
    if (!wz) return false;
    const triggerPx = wz.triggerCol * TILE_SIZE;
    return cameraX >= triggerPx - 64 || marioX >= triggerPx;
  }
}
