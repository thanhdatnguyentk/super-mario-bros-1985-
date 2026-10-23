import { TILE_SIZE } from '../../types/physics-constants.ts';
import { aabbIntersects } from '../../physics/SubPixelPhysics.ts';
import type { EventBus, SpawnedItemKind } from '../../core/EventBus.ts';
import type { TileCollisionSolver } from '../../physics/TileCollisionSolver.ts';
import type { Mario } from '../player/Mario.ts';
import type { Camera } from '../../core/Camera.ts';
import { PowerUpItem } from './PowerUpItem.ts';
import { SpinningCoinEffect } from './SpinningCoin.ts';

/**
 * Manages all world collectibles, emerging power-ups, vines, and block-launched spinning coins.
 *
 * Authentic NES 1985 Rules:
 * - Bumping a block with `payload === 'powerup-progressive'` checks Mario's CURRENT `powerState`
 *   at the moment of impact:
 *   - Small Mario -> spawns a `super-mushroom`
 *   - Super / Fire Mario -> spawns a `fire-flower`
 * - Bumping any block underneath an already-active Mushroom / 1-Up / Starman launches that item
 *   upward (`vy = -3.0 px/f`) and flips its horizontal direction away from the bumped block center!
 * - Emerging items (`lifecycleState === 'emerging'`) render BEHIND the foreground tilemap layer
 *   so they visibly rise out of the block before becoming active in front of the background.
 */
export class ItemManager {
  public readonly items: PowerUpItem[] = [];
  public readonly spinningCoins: SpinningCoinEffect[] = [];

  private eventBus: EventBus;
  private collisionSolver: TileCollisionSolver;

  constructor(eventBus: EventBus, collisionSolver: TileCollisionSolver) {
    this.eventBus = eventBus;
    this.collisionSolver = collisionSolver;
    this.bindBlockBumpEvents();
  }

  private bindBlockBumpEvents(): void {
    this.eventBus.on(
      'block-bumped',
      ({ col, row, powerState, payload, targetSubworldId }) => {
        // 1. Notify any active items resting on top of the bumped block (row - 1)
        for (const item of this.items) {
          if (item.alive && item.lifecycleState === 'active') {
            item.onBlockBumpedBelow(col, row - 1);
          }
        }

        if (!payload) return;

        // 2. Coin & Multi-Coin-10 -> Spawn Spinning Coin arc above block
        if (payload === 'coin' || payload === 'multi-coin-10') {
          this.spinningCoins.push(
            new SpinningCoinEffect(col, row, (popupX, popupY) => {
              this.collisionSolver.addScorePopup(popupX, popupY, '200');
            })
          );
          return;
        }

        // 3. Resolve progressive power-up vs explicit item kind
        let spawnKind: SpawnedItemKind;
        if (payload === 'powerup-progressive') {
          spawnKind = powerState === 'small' ? 'super-mushroom' : 'fire-flower';
        } else if (payload === 'starman') {
          spawnKind = 'starman';
        } else if (payload === 'one-up') {
          spawnKind = 'one-up';
        } else {
          spawnKind = 'vine';
        }

        this.spawnItemFromBlock(spawnKind, col, row, targetSubworldId);
      }
    );
  }

  public spawnItemFromBlock(
    kind: SpawnedItemKind,
    col: number,
    row: number,
    targetSubworldId?: string
  ): PowerUpItem {
    const item = new PowerUpItem(
      kind,
      col,
      row,
      this.collisionSolver,
      targetSubworldId
    );
    this.items.push(item);
    this.eventBus.emit('item-spawned', {
      kind,
      col,
      row,
      worldX: col * TILE_SIZE,
      worldY: row * TILE_SIZE,
    });
    return item;
  }

  public clearAll(): void {
    this.items.length = 0;
    this.spinningCoins.length = 0;
  }

  public update(mario: Mario): void {
    // 1. Update Spinning Block Coins
    for (let i = this.spinningCoins.length - 1; i >= 0; i--) {
      const coin = this.spinningCoins[i];
      coin.update();
      if (!coin.alive) {
        this.spinningCoins.splice(i, 1);
      }
    }

    // 2. Update World Items & Check Player Collection
    const marioBox = mario.getAABB();

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update();

      if (!item.alive) {
        this.items.splice(i, 1);
        continue;
      }

      if (item.kind === 'vine') {
        if (
          mario.alive &&
          !mario.isClimbingVine &&
          (!mario.grounded || mario.vySub < 0) &&
          aabbIntersects(marioBox, item.getAABB())
        ) {
          mario.latchOntoVine(item.sourceCol, item.targetSubworldId);
        }
        continue;
      }

      // Mario can collect items once they have emerged at least halfway or are active
      const canCollect =
        item.lifecycleState === 'active' ||
        item.y <= item.sourceRow * TILE_SIZE - 8;

      if (mario.alive && canCollect && aabbIntersects(marioBox, item.getAABB())) {
        this.collectItem(mario, item);
        this.items.splice(i, 1);
      }
    }
  }

  private collectItem(mario: Mario, item: PowerUpItem): void {
    item.alive = false;
    item.lifecycleState = 'collected';
    const worldX = item.x;
    const worldY = item.y;

    switch (item.kind) {
      case 'super-mushroom': {
        if (mario.powerState === 'small') {
          mario.setPowerState('super', true);
        }
        this.collisionSolver.addScorePopup(worldX, worldY - 8, '1000');
        this.eventBus.emit('item-collected', {
          kind: 'super-mushroom',
          worldX,
          worldY,
          points: 1000,
        });
        break;
      }

      case 'fire-flower': {
        if (mario.powerState === 'small') {
          mario.setPowerState('super', true);
        } else {
          mario.setPowerState('fire', true);
        }
        this.collisionSolver.addScorePopup(worldX, worldY - 8, '1000');
        this.eventBus.emit('item-collected', {
          kind: 'fire-flower',
          worldX,
          worldY,
          points: 1000,
        });
        break;
      }

      case 'starman': {
        mario.activateStarman();
        this.collisionSolver.addScorePopup(worldX, worldY - 8, '1000');
        this.eventBus.emit('item-collected', {
          kind: 'starman',
          worldX,
          worldY,
          points: 1000,
        });
        break;
      }

      case 'one-up': {
        this.collisionSolver.addScorePopup(worldX, worldY - 8, '1UP');
        this.eventBus.emit('item-collected', {
          kind: 'one-up',
          worldX,
          worldY,
          points: 0,
        });
        break;
      }

      default:
        break;
    }
  }

  /**
   * Render items currently emerging out of blocks (drawn BEHIND foreground tiles).
   */
  public renderBehindTiles(ctx: CanvasRenderingContext2D, camera: Camera): void {
    for (const item of this.items) {
      if (item.lifecycleState === 'emerging' || item.kind === 'vine') {
        item.render(ctx, camera);
      }
    }
  }

  /**
   * Render active world items and spinning block coins (drawn IN FRONT OF foreground tiles).
   */
  public renderInFrontOfTiles(
    ctx: CanvasRenderingContext2D,
    camera: Camera
  ): void {
    for (const coin of this.spinningCoins) {
      coin.render(ctx, camera);
    }
    for (const item of this.items) {
      if (item.lifecycleState === 'active' && item.kind !== 'vine') {
        item.render(ctx, camera);
      }
    }
  }
}
