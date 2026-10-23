import { Entity } from '../../ecs/Entity.ts';
import {
  NES_HEIGHT,
  TILE_SIZE,
  type FacingDirection,
} from '../../types/physics-constants.ts';
import {
  pxToSub,
  applyGravityAndClampSub,
  type AABB,
} from '../../physics/SubPixelPhysics.ts';
import type { TileCollisionSolver } from '../../physics/TileCollisionSolver.ts';
import type { Camera } from '../../core/Camera.ts';
import type { SpawnedItemKind } from '../../core/EventBus.ts';
import {
  drawPowerUpItemSprite,
  drawVineSprite,
} from '../../rendering/PixelSpriteAtlas.ts';

export type ItemLifecycleState = 'emerging' | 'active' | 'collected';

const ITEM_HORIZONTAL_SPEED_SUB = 0x0100; // 1.0 px/frame
const ITEM_GRAVITY_SUB = 0x0028; // 40/256 px/frame²
const STARMAN_BOUNCE_VY_SUB = -0x0390; // -3.5625 px/frame upward bounce
const BLOCK_BUMP_LAUNCH_VY_SUB = -0x0300; // -3.0 px/frame when block below is bumped
const EMERGE_SPEED_SUB = 0x0080; // 0.5 px/frame rise out of block (32 frames for 16px)

/**
 * Physical World Item Entity for Super Mario Bros. (1985):
 * - `super-mushroom`: Emerges 16px from block, glides right at 1.0 px/f, falls with gravity, reverses on walls.
 * - `fire-flower`: Emerges 16px from block, stays stationary on top of block with 4-frame palette pulse.
 * - `starman`: Emerges 16px from block, bounces across the stage and reverses on walls.
 * - `one-up`: Green 1-Up Mushroom; emerges 16px, glides right at 1.0 px/f, grants +1 Life ("1UP").
 * - `vine`: Grows upward out of the block so Mario can climb into Coin Heaven / Sub-World.
 */
export class PowerUpItem extends Entity {
  public readonly kind: SpawnedItemKind;
  public readonly sourceCol: number;
  public readonly sourceRow: number;
  public readonly targetSubworldId?: string;

  public lifecycleState: ItemLifecycleState = 'emerging';
  public facing: FacingDirection = 1;
  public animFrame = 0;

  // Emergence tracking (rises 16px from row * 16 to (row - 1) * 16)
  private emergeDelayFrames = 4;
  private targetEmergeYSub: number;

  // Vine growth tracking
  public vineTopYSub: number;
  private readonly vineMaxRisePx = 96;

  private collisionSolver: TileCollisionSolver;

  constructor(
    kind: SpawnedItemKind,
    col: number,
    row: number,
    collisionSolver: TileCollisionSolver,
    targetSubworldId?: string
  ) {
    const startX = col * TILE_SIZE;
    const startY = row * TILE_SIZE;
    super(startX, startY, 16, 16, {
      offsetX: 2,
      offsetY: 2,
      width: 12,
      height: 14,
    });

    this.kind = kind;
    this.sourceCol = col;
    this.sourceRow = row;
    this.targetSubworldId = targetSubworldId;
    this.collisionSolver = collisionSolver;
    this.targetEmergeYSub = pxToSub((row - 1) * TILE_SIZE);
    this.vineTopYSub = pxToSub(startY);
  }

  /**
   * Called when Mario bumps a block at `(bumpedCol, bumpedRow)` directly underneath this active item.
   * Launches the item upward and redirects horizontal direction away from the bumped block center!
   */
  public onBlockBumpedBelow(bumpedCol: number, bumpedRow: number): void {
    if (this.lifecycleState !== 'active' || this.kind === 'vine' || this.kind === 'fire-flower') {
      return;
    }

    const box = this.getAABB();
    const itemBottomRow = Math.floor((box.y + box.height + 2) / TILE_SIZE);
    const itemLeftCol = Math.floor(box.x / TILE_SIZE);
    const itemRightCol = Math.floor((box.x + box.width - 1) / TILE_SIZE);

    if (
      itemBottomRow === bumpedRow &&
      bumpedCol >= itemLeftCol - 1 &&
      bumpedCol <= itemRightCol + 1
    ) {
      this.vySub = BLOCK_BUMP_LAUNCH_VY_SUB;
      this.grounded = false;
      const itemCenterX = box.x + box.width * 0.5;
      const blockCenterX = (bumpedCol + 0.5) * TILE_SIZE;
      this.facing = itemCenterX < blockCenterX ? -1 : 1;
      this.vxSub = this.facing * ITEM_HORIZONTAL_SPEED_SUB;
    }
  }

  public override getAABB(): AABB {
    if (this.kind === 'vine') {
      const topPx = Math.floor(this.vineTopYSub / 256);
      const bottomPx = this.sourceRow * TILE_SIZE;
      return {
        x: this.sourceCol * TILE_SIZE + 4,
        y: topPx,
        width: 8,
        height: Math.max(8, bottomPx - topPx),
      };
    }
    return super.getAABB();
  }

  public update(): void {
    if (!this.alive) return;
    this.animFrame++;

    // Handle Vine growth upward
    if (this.kind === 'vine') {
      const minTopYSub = pxToSub(
        Math.max(16, this.sourceRow * TILE_SIZE - this.vineMaxRisePx)
      );
      if (this.vineTopYSub > minTopYSub) {
        this.vineTopYSub = Math.max(
          minTopYSub,
          this.vineTopYSub - EMERGE_SPEED_SUB
        );
        this.ySub = this.vineTopYSub;
      } else {
        this.lifecycleState = 'active';
      }
      return;
    }

    // 1. Emergence Phase: wait briefly for block bump peak, then rise 16px upward out of block
    if (this.lifecycleState === 'emerging') {
      if (this.emergeDelayFrames > 0) {
        this.emergeDelayFrames--;
        return;
      }

      this.ySub -= EMERGE_SPEED_SUB;
      if (this.ySub <= this.targetEmergeYSub) {
        this.ySub = this.targetEmergeYSub;
        this.lifecycleState = 'active';
        this.grounded = true;

        if (
          this.kind === 'super-mushroom' ||
          this.kind === 'one-up' ||
          this.kind === 'starman'
        ) {
          this.facing = 1;
          this.vxSub = this.facing * ITEM_HORIZONTAL_SPEED_SUB;
        } else {
          this.vxSub = 0;
        }

        if (this.kind === 'starman') {
          this.vySub = STARMAN_BOUNCE_VY_SUB;
          this.grounded = false;
        }
      }
      return;
    }

    // 2. Active Phase Physics
    if (this.kind === 'fire-flower') {
      // Stationary on top of its block
      return;
    }

    // Horizontal motion + gravity for Super Mushroom, 1-Up Mushroom, and Starman
    this.vxSub = this.facing * ITEM_HORIZONTAL_SPEED_SUB;
    this.vySub = applyGravityAndClampSub(this.vySub, ITEM_GRAVITY_SUB);

    const col = this.collisionSolver.moveAndCollideEntity(this, {
      isPlayer: false,
    });

    if (col.hitWallLeft) {
      this.facing = 1;
      this.vxSub = ITEM_HORIZONTAL_SPEED_SUB;
    } else if (col.hitWallRight) {
      this.facing = -1;
      this.vxSub = -ITEM_HORIZONTAL_SPEED_SUB;
    }

    if (this.kind === 'starman' && (col.landedOnFloor || this.grounded)) {
      this.vySub = STARMAN_BOUNCE_VY_SUB;
      this.grounded = false;
    }

    if (this.y > NES_HEIGHT + 32) {
      this.alive = false;
    }
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (!this.alive) return;

    if (this.kind === 'vine') {
      const sx = camera.worldToScreenX(this.sourceCol * TILE_SIZE);
      const topSy = camera.worldToScreenY(Math.floor(this.vineTopYSub / 256));
      const botSy = camera.worldToScreenY(this.sourceRow * TILE_SIZE);
      drawVineSprite(ctx, sx, topSy, botSy);
      return;
    }

    if (!camera.isVisible(this.getAABB(), 16)) return;
    const sx = camera.worldToScreenX(this.x);
    const sy = camera.worldToScreenY(this.y);
    drawPowerUpItemSprite(ctx, this.kind, sx, sy, this.animFrame);
  }
}
