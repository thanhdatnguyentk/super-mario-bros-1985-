import type { MarioPowerState } from '../types/physics-constants.ts';
import type { BlockPayloadType } from '../types/level-schema.ts';

export type SpawnedItemKind =
  | 'super-mushroom'
  | 'fire-flower'
  | 'starman'
  | 'one-up'
  | 'vine';

export interface GameEventMap {
  'block-bumped': {
    col: number;
    row: number;
    tileChar: string;
    powerState: MarioPowerState;
    payload?: BlockPayloadType;
    targetSubworldId?: string;
  };
  'brick-shattered': {
    col: number;
    row: number;
    worldX: number;
    worldY: number;
  };
  'coin-collected': {
    worldX: number;
    worldY: number;
    points: number;
    fromBlock?: boolean;
  };
  'item-spawned': {
    kind: SpawnedItemKind;
    col: number;
    row: number;
    worldX: number;
    worldY: number;
  };
  'item-collected': {
    kind: SpawnedItemKind;
    worldX: number;
    worldY: number;
    points: number;
  };
  'score-popup': {
    worldX: number;
    worldY: number;
    text: string;
  };
  'powerup-changed': {
    previous: MarioPowerState;
    current: MarioPowerState;
  };
  'fireball-thrown': {
    worldX: number;
    worldY: number;
    direction: 1 | -1;
  };
  'fireball-exploded': {
    worldX: number;
    worldY: number;
  };
  'pipe-transition-started': {
    pipeId: string;
    direction: 'down' | 'right' | 'up';
    targetAreaId: string;
  };
  'pipe-transition-completed': {
    pipeId: string;
    areaId: string;
    exitCol: number;
    exitRow: number;
  };
  'player-damaged': {
    fromState: MarioPowerState;
  };
  'player-died': {
    reason: 'pit' | 'lava' | 'enemy' | 'time-up';
  };
  'flagpole-reached': {
    col: number;
    touchY: number;
    points: number;
  };
  'enemy-defeated': {
    enemyType: string;
    method:
      | 'stomp'
      | 'shell'
      | 'fireball'
      | 'starman'
      | 'block-bump'
      | 'bridge-collapse';
    points: number;
    extraLife: boolean;
    worldX: number;
    worldY: number;
  };
  'castle-axe-touched': {
    axeCol: number;
    axeRow: number;
  };
  'bridge-collapse-completed': {
    axeCol: number;
  };
  'stage-cleared': {
    levelId: string;
    fireworksLaunched: number;
  };
  'firework-exploded': {
    worldX: number;
    worldY: number;
    points: number;
  };
  'maze-checkpoint-result': {
    checkCol: number;
    passed: boolean;
    rewoundToCol?: number;
  };
  'pulley-rope-snapped': {
    platformId: string;
    partnerId: string;
    points: number;
  };
  'vine-climbed-top': {
    targetSubworldId: string;
  };
  'warp-zone-entered': {
    pipeId: string;
    requestedLevelId: string;
    resolvedLevelId: string;
  };
  'area-switched': {
    areaId: string;
    exitCol: number;
  };
}

type EventListener<K extends keyof GameEventMap> = (
  payload: GameEventMap[K]
) => void;

export class EventBus {
  private listeners = new Map<
    keyof GameEventMap,
    Set<(payload: never) => void>
  >();

  public on<K extends keyof GameEventMap>(
    event: K,
    listener: EventListener<K>
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const typedListener = listener as (payload: never) => void;
    set.add(typedListener);
    return () => {
      set?.delete(typedListener);
    };
  }

  public emit<K extends keyof GameEventMap>(
    event: K,
    payload: GameEventMap[K]
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      (listener as EventListener<K>)(payload);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
