// Vision: what a guard can actually see. A player is spotted only when all
// three hold: inside the guard's range, inside the cone angle around the
// guard's facing, and with no hedge tile on the line between them.
import { TILE, VISION_RANGE, VISION_HALF_ANGLE } from './config.js';
import { isWallTile } from './level.js';

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Walk the segment in small steps; a hedge tile anywhere on it blocks sight.
// Bushes never block sight: they are low cover you hide inside, not walls.
export function hasLineOfSight(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const x = ax + (dx * i) / steps;
    const y = ay + (dy * i) / steps;
    if (isWallTile(Math.floor(x / TILE), Math.floor(y / TILE))) return false;
  }
  return true;
}

// Returns { visible, distance, inCone } for a guard looking at a point.
export function guardSees(guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance > VISION_RANGE) return { visible: false, distance, inCone: false };
  const toPlayer = Math.atan2(dy, dx);
  const inCone = Math.abs(angleDiff(toPlayer, guard.facing)) <= VISION_HALF_ANGLE;
  if (!inCone) return { visible: false, distance, inCone: false };
  const visible = hasLineOfSight(guard.x, guard.y, px, py);
  return { visible, distance, inCone: true };
}

// The cone's corner points, for drawing: apex at the guard, arc at range.
export function conePoints(guard, range = VISION_RANGE, segments = 14) {
  const pts = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= segments; i++) {
    const a = guard.facing - VISION_HALF_ANGLE + (2 * VISION_HALF_ANGLE * i) / segments;
    pts.push({ x: guard.x + Math.cos(a) * range, y: guard.y + Math.sin(a) * range });
  }
  return pts;
}
