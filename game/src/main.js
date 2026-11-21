// Emberlight — main loop and state machine. States: title, playing,
// paused, won, lost; "caught" is a short flash inside playing while the
// thief is dragged back to the start. The loop is a fixed, clamped delta
// update: guards think, the player moves, lanterns are collected, and the
// win check runs only once all three lanterns are lit.
import { TILE, VIEW_W, VIEW_H, LANTERNS_TO_WIN, START_LIVES, PEBBLE_NOISE_RADIUS } from './config.js';
import { parseLevel, GUARD_ROUTES } from './level.js';
import { makeGuard, updateGuard, guardsHearPebble, resetGuards } from './guards.js';
import { makePlayer, updatePlayer, throwPebble, resetPlayer } from './player.js';
import { makeInput, readMove, isSneaking } from './input.js';
import { makeAudio } from './audio.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const lightCanvas = document.createElement('canvas');
lightCanvas.width = VIEW_W;
lightCanvas.height = VIEW_H;

const level = parseLevel();
const audio = makeAudio();
const input = makeInput(canvas);

const game = {
  state: 'title', // title | playing | paused | won | lost
  player: makePlayer(level.playerStart),
  guards: GUARD_ROUTES.map((route, i) => makeGuard(route, i)),
  lanterns: level.lanterns,
  bushes: level.bushes,
  exit: level.exit,
  pebbles: [], // {x, y, bornMs} rings drawn where a pebble landed
  lives: START_LIVES,
  catches: 0,
  elapsedMs: 0,
  caughtFlashMs: 0,
  muted: false,
};
// Exposed for play-testing in a headless browser; the game never reads it.
window.__emberlight = { game };

function resetRun() {
  game.lanterns.forEach((l) => {
    l.taken = false;
  });
  resetPlayer(game.player, level.playerStart);
  resetGuards(game.guards, GUARD_ROUTES);
  game.pebbles = [];
  game.lives = START_LIVES;
  game.catches = 0;
  game.elapsedMs = 0;
  game.caughtFlashMs = 0;
}

function startGame() {
  resetRun();
  game.state = 'playing';
  audio.unlock();
  audio.startAmbient();
  audio.click();
}

function onCaught() {
  game.catches += 1;
  game.lives -= 1;
  audio.caught();
  if (game.lives <= 0) {
    game.state = 'lost';
    game.caughtFlashMs = 0;
    return;
  }
  game.caughtFlashMs = 1300;
  resetPlayer(game.player, level.playerStart);
  resetGuards(game.guards, GUARD_ROUTES);
  game.pebbles = [];
}

function update(dt, nowMs) {
  if (game.state !== 'playing') return;
  if (game.caughtFlashMs > 0) {
    game.caughtFlashMs -= dt * 1000;
    return; // frozen while the caught flash shows
  }
  game.elapsedMs += dt * 1000;
  game.player.sneaking = isSneaking(input);

  if (updatePlayer(game.player, dt, readMove(input), nowMs)) {
    audio.step(game.player.sneaking);
  }

  if (input.clicked) {
    input.clicked = false;
    const landing = throwPebble(game.player, input.mouseX, input.mouseY);
    if (landing) {
      audio.pebbleThrow();
      audio.pebbleLand();
      game.pebbles.push({ x: landing.x, y: landing.y, bornMs: nowMs });
      guardsHearPebble(game.guards, landing.x, landing.y, PEBBLE_NOISE_RADIUS);
    }
  }
  game.pebbles = game.pebbles.filter((p) => nowMs - p.bornMs < 1000);

  // Lantern pickup.
  for (const lantern of game.lanterns) {
    if (!lantern.taken && Math.hypot(lantern.x - game.player.x, lantern.y - game.player.y) < 28) {
      lantern.taken = true;
      game.player.lanterns += 1;
      audio.pickup();
    }
  }

  // Guards think; a chase that touches the player ends the run's life.
  let alarmed = false;
  for (const guard of game.guards) {
    const before = guard.state;
    const result = updateGuard(guard, dt, game.player, nowMs);
    if (guard.state === 'chase' && before !== 'chase') alarmed = true;
    if (result === 'caught') {
      onCaught();
      return;
    }
  }
  if (alarmed) audio.alert();

  // Win: all lanterns lit, then reach the golden gate.
  const allLit = game.lanterns.every((l) => l.taken);
  if (allLit && Math.hypot(game.exit.x - game.player.x, game.exit.y - game.player.y) < 30) {
    game.state = 'won';
    audio.win();
  }
  void TILE;
}

input.onKey = (code) => {
  audio.unlock();
  if (code === 'KeyM') {
    game.muted = audio.toggleMute();
    return;
  }
  if (game.state === 'title') {
    if (code === 'Enter' || code === 'Space') startGame();
    return;
  }
  if (game.state === 'won' || game.state === 'lost') {
    if (code === 'Enter' || code === 'KeyR' || code === 'Space') startGame();
    return;
  }
  if (code === 'KeyP' || code === 'Escape') {
    game.state = game.state === 'paused' ? 'playing' : 'paused';
    audio.click();
    return;
  }
  if (code === 'KeyR') {
    startGame();
  }
};

canvas.addEventListener('mousedown', () => {
  audio.unlock();
  if (game.state === 'title') startGame();
});

// Screenshot mode: ?shot=cover|title|nearmiss|win renders one fixed frame.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(game, shot);
  render(ctx, lightCanvas, game, 1000);
} else {
  let last = performance.now();
  function frame(nowMs) {
    const dt = Math.min(0.05, (nowMs - last) / 1000);
    last = nowMs;
    update(dt, nowMs);
    render(ctx, lightCanvas, game, nowMs);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
