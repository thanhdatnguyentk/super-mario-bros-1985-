import { NES_HEIGHT, TILE_SIZE } from '../types/physics-constants.ts';
import { pxToSub } from '../physics/SubPixelPhysics.ts';
import type {
  MovingPlatformSpawn,
  PlatformMotionType,
} from '../types/level-schema.ts';
import type { Mario } from '../entities/player/Mario.ts';
import type { EventBus } from '../core/EventBus.ts';
import type { TileCollisionSolver } from '../physics/TileCollisionSolver.ts';
import type { Camera } from '../core/Camera.ts';

export interface ActivePlatformInstance {
  id: string;
  type: PlatformMotionType;
  x: number;
  y: number;
  widthPx: number;
  heightPx: number;
  minBoundPx: number;
  maxBoundPx: number;
  speedPxPerFrame: number;
  direction: 1 | -1;
  vy: number;
  activated: boolean;
  snapped: boolean;
  pairedPlatformId?: string;
  pulleyTopY: number;
  marioStanding: boolean;
}

/**
 * Manages all 7 canonical NES Super Mario Bros. (1985) Moving Platforms / Lifts:
 * - `vertical-loopUp`: Moves upward continuously, wrapping from top (-16) to bottom (240).
 * - `vertical-loopDown`: Moves downward continuously, wrapping from bottom (240) to top (-8).
 * - `vertical-oscillate`: Oscillates smoothly up and down between `minBound` and `maxBound` rows.
 * - `horizontal-oscillate`: Oscillates horizontally between `minBound` and `maxBound` cols, carrying Mario.
 * - `fall-on-stand`: Drops downward whenever Mario stands on it.
 * - `right-on-stand`: Waits until Mario steps onto it, then glides continuously rightward across the sky.
 * - `scale-balance-pair` (Pulley Scale Lifts): Connected by a pulley rope; standing on one pushes it down
 *   while lifting its partner up by the exact same delta! If pushed beyond `maxBound` / `minBound`, the pulley
 *   rope snaps (+1000 pts) and both platforms plummet!
 */
export class MovingPlatformController {
  public readonly platforms: ActivePlatformInstance[] = [];
  private eventBus: EventBus;
  private collisionSolver: TileCollisionSolver;

  constructor(eventBus: EventBus, collisionSolver: TileCollisionSolver) {
    this.eventBus = eventBus;
    this.collisionSolver = collisionSolver;
  }

  public loadPlatforms(spawns: MovingPlatformSpawn[]): void {
    this.platforms.length = 0;
    for (const sp of spawns) {
      const isHorizontal = sp.type === 'horizontal-oscillate';
      this.platforms.push({
        id: sp.id,
        type: sp.type,
        x: sp.col * TILE_SIZE,
        y: sp.row * TILE_SIZE,
        widthPx: sp.widthTiles * TILE_SIZE,
        heightPx: 8,
        minBoundPx: sp.minBound * TILE_SIZE,
        maxBoundPx: sp.maxBound * TILE_SIZE,
        speedPxPerFrame: sp.speedPxPerFrame || 1.0,
        direction: 1,
        vy: 0,
        activated: false,
        snapped: false,
        pairedPlatformId: sp.pairedPlatformId,
        pulleyTopY: (sp.pulleyTopRow ?? 2) * TILE_SIZE,
        marioStanding: false,
      });
      // Ensure initial bounds ordering
      const last = this.platforms[this.platforms.length - 1];
      if (!isHorizontal && last.minBoundPx > last.maxBoundPx) {
        const tmp = last.minBoundPx;
        last.minBoundPx = last.maxBoundPx;
        last.maxBoundPx = tmp;
      }
    }
  }

  public update(mario: Mario): void {
    if (this.platforms.length === 0) return;

    const marioBox = mario.getAABB();
    const marioBottom = marioBox.y + marioBox.height;

    // 1. Detect if Mario is standing on or landing on each platform
    for (const plat of this.platforms) {
      const horizOverlap =
        marioBox.x + marioBox.width > plat.x + 2 &&
        marioBox.x < plat.x + plat.widthPx - 2;
      const vertLanding =
        mario.vySub >= 0 &&
        marioBottom >= plat.y - 3 &&
        marioBottom <= plat.y + Math.max(6, Math.abs(mario.vy) + 4);

      if (mario.alive && horizOverlap && vertLanding) {
        plat.marioStanding = true;
        plat.activated = true;
        mario.y = Math.round(plat.y - mario.spriteHeight);
        mario.vySub = 0;
        mario.grounded = true;
      } else {
        plat.marioStanding = false;
      }
    }

    // 2. Advance each platform's motion and carry Mario if standing on it
    const processedBalanceIds = new Set<string>();

    for (const plat of this.platforms) {
      const prevX = plat.x;
      const prevY = plat.y;

      switch (plat.type) {
        case 'vertical-loopUp': {
          plat.y -= plat.speedPxPerFrame;
          if (plat.y < -16) {
            plat.y = NES_HEIGHT + 8;
          }
          break;
        }

        case 'vertical-loopDown': {
          plat.y += plat.speedPxPerFrame;
          if (plat.y > NES_HEIGHT + 8) {
            plat.y = -16;
          }
          break;
        }

        case 'vertical-oscillate': {
          plat.y += plat.direction * plat.speedPxPerFrame;
          if (plat.y >= plat.maxBoundPx) {
            plat.y = plat.maxBoundPx;
            plat.direction = -1;
          } else if (plat.y <= plat.minBoundPx) {
            plat.y = plat.minBoundPx;
            plat.direction = 1;
          }
          break;
        }

        case 'horizontal-oscillate': {
          plat.x += plat.direction * plat.speedPxPerFrame;
          if (plat.x >= plat.maxBoundPx) {
            plat.x = plat.maxBoundPx;
            plat.direction = -1;
          } else if (plat.x <= plat.minBoundPx) {
            plat.x = plat.minBoundPx;
            plat.direction = 1;
          }
          break;
        }

        case 'fall-on-stand': {
          if (plat.marioStanding) {
            plat.y += plat.speedPxPerFrame;
          }
          break;
        }

        case 'right-on-stand': {
          if (plat.activated) {
            plat.x += plat.speedPxPerFrame;
          }
          break;
        }

        case 'scale-balance-pair': {
          if (processedBalanceIds.has(plat.id)) break;
          processedBalanceIds.add(plat.id);

          const partner = this.platforms.find(
            (p) => p.id === plat.pairedPlatformId
          );
          if (!partner) break;
          processedBalanceIds.add(partner.id);

          if (plat.snapped || partner.snapped) {
            plat.vy = Math.min(4.0, plat.vy + 0.2);
            partner.vy = Math.min(4.0, partner.vy + 0.2);
            plat.y += plat.vy;
            partner.y += partner.vy;
            break;
          }

          if (plat.marioStanding && !partner.marioStanding) {
            plat.vy = Math.min(2.0, plat.vy + 0.08);
          } else if (partner.marioStanding && !plat.marioStanding) {
            plat.vy = Math.max(-2.0, plat.vy - 0.08);
          } else {
            // Decelerate smoothly when Mario steps off
            if (Math.abs(plat.vy) <= 0.08) plat.vy = 0;
            else plat.vy -= Math.sign(plat.vy) * 0.06;
          }

          const prevPartnerY = partner.y;
          plat.y += plat.vy;
          partner.y -= plat.vy;

          // Check pulley snap limits
          if (
            plat.y >= plat.maxBoundPx ||
            plat.y <= plat.minBoundPx ||
            partner.y >= partner.maxBoundPx ||
            partner.y <= partner.minBoundPx
          ) {
            plat.snapped = true;
            partner.snapped = true;
            plat.vy = 1.5;
            partner.vy = 1.5;
            this.collisionSolver.addScorePopup(plat.x, plat.y - 12, '1000');
            this.eventBus.emit('pulley-rope-snapped', {
              platformId: plat.id,
              partnerId: partner.id,
              points: 1000,
            });
          }

          if (partner.marioStanding && mario.alive) {
            const dyPartner = partner.y - prevPartnerY;
            mario.ySub += pxToSub(dyPartner);
          }
          break;
        }
      }

      // Carry Mario along with platform displacement
      if (plat.marioStanding && mario.alive) {
        const dx = plat.x - prevX;
        const dy = plat.y - prevY;
        if (dx !== 0) {
          mario.xSub += pxToSub(dx);
        }
        if (dy !== 0) {
          mario.ySub += pxToSub(dy);
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const drawnPairs = new Set<string>();

    for (const plat of this.platforms) {
      // Draw Pulley Ropes & Top Pulley Wheels for scale-balance-pair
      if (
        plat.type === 'scale-balance-pair' &&
        plat.pairedPlatformId &&
        !drawnPairs.has(plat.id)
      ) {
        drawnPairs.add(plat.id);
        drawnPairs.add(plat.pairedPlatformId);
        const partner = this.platforms.find(
          (p) => p.id === plat.pairedPlatformId
        );
        if (partner) {
          const x1 = Math.round(
            camera.worldToScreenX(plat.x + plat.widthPx * 0.5)
          );
          const x2 = Math.round(
            camera.worldToScreenX(partner.x + partner.widthPx * 0.5)
          );
          const topY = Math.round(camera.worldToScreenY(plat.pulleyTopY));
          const y1 = Math.round(camera.worldToScreenY(plat.y));
          const y2 = Math.round(camera.worldToScreenY(partner.y));

          ctx.fillStyle = '#FCFCFC';
          // Top horizontal rope connecting the two pulleys
          const leftX = Math.min(x1, x2);
          const rightX = Math.max(x1, x2);
          ctx.fillRect(leftX, topY, rightX - leftX, 2);
          // Vertical ropes down to each platform
          if (!plat.snapped) {
            ctx.fillRect(x1 - 1, topY, 2, Math.max(0, y1 - topY));
            ctx.fillRect(x2 - 1, topY, 2, Math.max(0, y2 - topY));
          }
          // Pulley wheels
          ctx.fillStyle = '#D82800';
          ctx.fillRect(x1 - 3, topY - 2, 6, 6);
          ctx.fillRect(x2 - 3, topY - 2, 6, 6);
        }
      }

      // Draw Platform Girder / Cloud Lift
      const sx = Math.round(camera.worldToScreenX(plat.x));
      const sy = Math.round(camera.worldToScreenY(plat.y));
      if (sx + plat.widthPx < 0 || sx > 256) continue;

      if (plat.type === 'right-on-stand') {
        // Cloud Lift styling
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(sx, sy, plat.widthPx, 8);
        ctx.fillStyle = '#3CBCFC';
        ctx.fillRect(sx + 2, sy + 6, plat.widthPx - 4, 2);
      } else {
        // Classic NES Red & White Girder Lift
        ctx.fillStyle = '#D82800';
        ctx.fillRect(sx, sy, plat.widthPx, 8);
        ctx.fillStyle = '#FC9838';
        for (let gx = 2; gx < plat.widthPx - 4; gx += 8) {
          ctx.fillRect(sx + gx, sy + 2, 4, 4);
        }
      }
    }
  }
}
