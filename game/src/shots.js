// Deterministic screenshot staging: ?shot=cover|title|nearmiss|win renders
// one fixed frame of the real game, with no wall clock and no randomness, so
// the same URL always produces the same picture. The cover shows the whole
// stealth loop at a glance — a vision cone, a bush, a lantern and the gate.
import { TILE } from './config.js';
import { GUARD_ROUTES } from './level.js';
import { makeGuard } from './guards.js';

function setGuard(guard, tileX, tileY, facingDeg, suspicion, state) {
  guard.x = tileX * TILE + TILE / 2;
  guard.y = tileY * TILE + TILE / 2;
  guard.facing = (facingDeg * Math.PI) / 180;
  guard.suspicion = suspicion;
  guard.state = state;
}

export function applyShot(game, shot) {
  // Start from the fresh level, then pose it.
  game.state = 'playing';
  game.elapsedMs = 83 * 1000;
  game.catches = 0;
  game.caughtFlashMs = 0;
  game.pebbles = [];
  if (shot === 'title') {
    game.state = 'title';
    game.elapsedMs = 0;
    return;
  }
  if (shot === 'win') {
    game.lanterns.forEach((l) => {
      l.taken = true;
    });
    game.player.lanterns = 3;
    game.player.x = 27 * TILE + TILE / 2;
    game.player.y = 2 * TILE + TILE / 2;
    game.player.facing = Math.PI;
    game.elapsedMs = 161 * 1000;
    game.catches = 0;
    game.state = 'won';
    return;
  }
  if (shot === 'cover') {
    // The player crouches at a bush edge in the big hall while Wick's cone
    // sweeps past; one lantern already lit, the gate glowing top-right.
    game.lanterns[0].taken = true;
    game.player.lanterns = 1;
    game.player.x = 15 * TILE + TILE / 2;
    game.player.y = 8 * TILE + TILE / 2;
    game.player.facing = -Math.PI / 2;
    game.player.hiddenInBush = false;
    game.player.sneaking = true;
    const [moth, wick, ember, ash] = game.guards;
    setGuard(moth, 11, 3, 90, 20, 'patrol');
    setGuard(wick, 20, 7, 0, 55, 'patrol');
    setGuard(ember, 7, 14, 180, 0, 'patrol');
    setGuard(ash, 21, 9, 90, 0, 'patrol');
    return;
  }
  if (shot === 'nearmiss') {
    // Ash's cone is a breath away from the player, suspicion nearly full:
    // the recovery window, one step from the alarm.
    game.lanterns[0].taken = true;
    game.lanterns[2].taken = true;
    game.player.lanterns = 2;
    game.player.x = 20 * TILE + TILE / 2;
    game.player.y = 9 * TILE + TILE / 2;
    game.player.facing = Math.PI;
    game.player.sneaking = true;
    const [moth, wick, ember, ash] = game.guards;
    setGuard(moth, 11, 3, 90, 0, 'patrol');
    setGuard(wick, 12, 7, 180, 10, 'patrol');
    setGuard(ember, 7, 14, 180, 0, 'patrol');
    setGuard(ash, 24, 9, 180, 82, 'patrol');
    game.elapsedMs = 127 * 1000;
    return;
  }
  // Unknown ?shot= value: plain mid-game frame.
  void GUARD_ROUTES;
  void makeGuard;
}
