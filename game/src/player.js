// The player: a hooded lantern thief. WASD or arrows to move, hold Shift to
// sneak (slower, quieter, harder to spot), click to toss a pebble that draws
// a guard's attention. Bushes hide you; hedges block you; lanterns are
// collected by walking over them.
import {
  PLAYER_RADIUS,
  PLAYER_WALK_SPEED,
  PLAYER_SNEAK_SPEED,
  PEBBLE_COUNT,
  PEBBLE_RANGE,
  PEBBLE_COOLDOWN_MS,
  TILE,
} from './config.js';
import { isWallTile, isBushTile } from './level.js';

export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: PLAYER_RADIUS,
    facing: 0,
    moving: false,
    sneaking: false,
    hiddenInBush: false,
    pebbles: PEBBLE_COUNT,
    pebbleCooldownMs: 0,
    stepTimer: 0, // drives the footstep sound
    lanterns: 0,
  };
}

// Circle-vs-tile collision, axis separated so the player slides along hedges.
function tryMove(player, dx, dy) {
  const nx = player.x + dx;
  if (!hitsWall(nx, player.y, player.radius)) player.x = nx;
  const ny = player.y + dy;
  if (!hitsWall(player.x, ny, player.radius)) player.y = ny;
}

function hitsWall(x, y, r) {
  const cols = [Math.floor((x - r) / TILE), Math.floor((x + r) / TILE)];
  const rows = [Math.floor((y - r) / TILE), Math.floor((y + r) / TILE)];
  for (const c of cols) {
    for (const row of rows) {
      if (isWallTile(c, row)) return true;
    }
  }
  return false;
}

// `move` is {x, y} in -1..1 from the input layer. Returns true when a
// footstep sound should play this frame (handled by main.js via stepTimer).
export function updatePlayer(player, dt, move, nowMs) {
  player.pebbleCooldownMs = Math.max(0, player.pebbleCooldownMs - dt * 1000);
  const mag = Math.hypot(move.x, move.y);
  player.moving = mag > 0.05;
  if (!player.moving) {
    player.stepTimer = 0;
    player.hiddenInBush = isBushTile(Math.floor(player.x / TILE), Math.floor(player.y / TILE));
    return false;
  }
  const nx = move.x / (mag || 1);
  const ny = move.y / (mag || 1);
  const speed = player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
  tryMove(player, nx * speed * dt, ny * speed * dt);
  player.facing = Math.atan2(ny, nx);
  player.hiddenInBush = isBushTile(Math.floor(player.x / TILE), Math.floor(player.y / TILE));
  // Footsteps: one per stride; sneaking stretches the stride and softens it.
  const stride = player.sneaking ? 0.62 : 0.36;
  player.stepTimer += dt;
  if (player.stepTimer >= stride) {
    player.stepTimer = 0;
    return true;
  }
  return false;
}

// Aim a pebble throw at a point: clamp to range, spend one pebble, and
// return the landing point (null when out of pebbles or on cooldown).
export function throwPebble(player, targetX, targetY) {
  if (player.pebbles <= 0 || player.pebbleCooldownMs > 0) return null;
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.hypot(dx, dy);
  const reach = Math.min(dist, PEBBLE_RANGE);
  const landing = {
    x: player.x + (dist > 0 ? (dx / dist) * reach : 0),
    y: player.y + (dist > 0 ? (dy / dist) * reach : 0),
  };
  player.pebbles -= 1;
  player.pebbleCooldownMs = PEBBLE_COOLDOWN_MS;
  return landing;
}

export function resetPlayer(player, start) {
  player.x = start.x;
  player.y = start.y;
  player.facing = 0;
  player.moving = false;
  player.sneaking = false;
  player.hiddenInBush = false;
  player.pebbles = PEBBLE_COUNT;
  player.pebbleCooldownMs = 0;
  player.stepTimer = 0;
}
