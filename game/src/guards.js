// Guards: patrol, suspicion, investigation and chase. A guard walks a loop
// of waypoints and pauses at each one, turning slowly to scan. Suspicion is
// a meter, not a switch: it climbs while the player is in the cone and in
// the open, decays when unseen, and only at full does the guard give chase.
// That climb-and-decay is the game's recovery window: break line of sight
// and the alarm fades before it ever fires.
import {
  GUARD_RADIUS,
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_INVESTIGATE_SPEED,
  GUARD_PAUSE_MS,
  SUSPICION_RISE_CLOSE,
  SUSPICION_RISE_MID,
  SUSPICION_RISE_FAR,
  SUSPICION_SNEAK_FACTOR,
  SUSPICION_DECAY,
  SUSPICION_ALARM,
  SUSPICION_WARY,
  VISION_CLOSE_DIST,
  VISION_RANGE,
  BUSH_HIDE_DIST,
  ALARM_CHASE_SECONDS,
  INVESTIGATE_SECONDS,
} from './config.js';
import { tileCenter, isWalkableTile } from './level.js';
import { guardSees, angleDiff } from './vision.js';

export function makeGuard(route, index) {
  const [c0, r0] = route.waypoints[0];
  const start = tileCenter(c0, r0);
  const [c1, r1] = route.waypoints[1 % route.waypoints.length];
  const next = tileCenter(c1, r1);
  return {
    name: route.name,
    waypoints: route.waypoints.map(([c, r]) => tileCenter(c, r)),
    waypointIndex: 1 % route.waypoints.length,
    x: start.x,
    y: start.y,
    facing: Math.atan2(next.y - start.y, next.x - start.x),
    state: 'patrol', // patrol | pause | investigate | chase | return
    suspicion: 0,
    pauseMs: 0,
    investigateTarget: null,
    investigateTimer: 0,
    chaseTimer: 0,
    lastSeenX: start.x,
    lastSeenY: start.y,
    heardX: null,
    heardY: null,
    index,
  };
}

// Turn toward a target angle at most `rate` radians per second.
function turnToward(guard, targetAngle, dt, rate) {
  const d = angleDiff(targetAngle, guard.facing);
  const step = Math.max(-rate * dt, Math.min(rate * dt, d));
  guard.facing += step;
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  // Guards only ever walk route segments and straight lines to heard or
  // seen points; if a wall blocks the way, stop rather than clip through.
  if (isWalkableTile(Math.floor(nx / 40), Math.floor(guard.y / 40))) guard.x = nx;
  if (isWalkableTile(Math.floor(guard.x / 40), Math.floor(ny / 40))) guard.y = ny;
  guard.facing = Math.atan2(dy, dx);
  return dist - step < 2;
}

function suspicionRisePerSecond(distance, sneaking) {
  let rate = SUSPICION_RISE_FAR;
  if (distance < VISION_CLOSE_DIST) rate = SUSPICION_RISE_CLOSE;
  else if (distance < VISION_RANGE * 0.6) rate = SUSPICION_RISE_MID;
  return sneaking ? rate * SUSPICION_SNEAK_FACTOR : rate;
}

// One guard, one frame. `player` carries x, y, sneaking and hidden-in-bush.
// Returns 'caught' when this guard touches the player during a chase.
export function updateGuard(guard, dt, player, nowMs) {
  const seen = guardSees(guard, player.x, player.y);
  const inBush = player.hiddenInBush;
  const canSpot = seen.visible && !(inBush && seen.distance > BUSH_HIDE_DIST);

  if (canSpot) {
    guard.suspicion += suspicionRisePerSecond(seen.distance, player.sneaking) * dt;
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
  } else {
    guard.suspicion -= SUSPICION_DECAY * dt;
  }
  guard.suspicion = Math.max(0, Math.min(SUSPICION_ALARM, guard.suspicion));

  if (guard.suspicion >= SUSPICION_ALARM && guard.state !== 'chase') {
    guard.state = 'chase';
    guard.chaseTimer = ALARM_CHASE_SECONDS;
  }

  switch (guard.state) {
    case 'patrol': {
      if (guard.suspicion >= SUSPICION_WARY) {
        // Wary guards walk their route faster, scanning for the glimpse.
        const target = guard.waypoints[guard.waypointIndex];
        if (moveToward(guard, target.x, target.y, GUARD_PATROL_SPEED * 1.35, dt)) {
          guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
          guard.state = 'pause';
          guard.pauseMs = GUARD_PAUSE_MS * 0.6;
        }
        break;
      }
      const target = guard.waypoints[guard.waypointIndex];
      if (moveToward(guard, target.x, target.y, GUARD_PATROL_SPEED, dt)) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.state = 'pause';
        guard.pauseMs = GUARD_PAUSE_MS;
      }
      break;
    }
    case 'pause': {
      guard.pauseMs -= dt * 1000;
      // Scan: slowly sweep the cone while standing still.
      guard.facing += Math.sin(nowMs / 900 + guard.index * 2.1) * 0.35 * dt;
      if (guard.pauseMs <= 0) guard.state = 'patrol';
      break;
    }
    case 'investigate': {
      if (guard.investigateTarget) {
        const arrived = moveToward(
          guard,
          guard.investigateTarget.x,
          guard.investigateTarget.y,
          GUARD_INVESTIGATE_SPEED,
          dt,
        );
        if (arrived) {
          guard.investigateTimer -= dt;
          guard.facing += 1.4 * dt; // look around the spot
          if (guard.investigateTimer <= 0) {
            guard.state = 'return';
            guard.investigateTarget = null;
          }
        }
      } else {
        guard.state = 'return';
      }
      break;
    }
    case 'chase': {
      guard.chaseTimer -= dt;
      if (canSpot) guard.chaseTimer = ALARM_CHASE_SECONDS;
      const tx = canSpot ? player.x : guard.lastSeenX;
      const ty = canSpot ? player.y : guard.lastSeenY;
      moveToward(guard, tx, ty, GUARD_CHASE_SPEED, dt);
      const d = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (d < GUARD_RADIUS + 13 + 4) return 'caught';
      if (guard.chaseTimer <= 0) {
        guard.state = 'return';
        guard.suspicion = SUSPICION_WARY;
      }
      break;
    }
    case 'return': {
      // Walk back to the nearest waypoint, then resume the patrol loop.
      let nearest = 0;
      let nearestD = Infinity;
      guard.waypoints.forEach((w, i) => {
        const d = Math.hypot(w.x - guard.x, w.y - guard.y);
        if (d < nearestD) {
          nearestD = d;
          nearest = i;
        }
      });
      const target = guard.waypoints[nearest];
      if (moveToward(guard, target.x, target.y, GUARD_INVESTIGATE_SPEED, dt)) {
        guard.waypointIndex = (nearest + 1) % guard.waypoints.length;
        guard.state = 'patrol';
      }
      break;
    }
  }

  // A pebble landing nearby pulls a patrolling or pausing guard away.
  if (guard.heardX !== null && (guard.state === 'patrol' || guard.state === 'pause')) {
    guard.state = 'investigate';
    guard.investigateTarget = { x: guard.heardX, y: guard.heardY };
    guard.investigateTimer = INVESTIGATE_SECONDS;
    guard.heardX = null;
    guard.heardY = null;
  }
  return null;
}

// A pebble landed at (x, y): every guard within earshot turns to look.
export function guardsHearPebble(guards, x, y, radius) {
  for (const g of guards) {
    if (g.state === 'chase') continue;
    if (Math.hypot(g.x - x, g.y - y) <= radius) {
      g.heardX = x;
      g.heardY = y;
    }
  }
}

export function resetGuards(guards, routes) {
  guards.forEach((g, i) => {
    const fresh = makeGuard(routes[i], i);
    Object.assign(g, fresh);
  });
}
