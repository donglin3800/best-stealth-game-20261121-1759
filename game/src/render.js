// Rendering: hand-drawn canvas art for Emberlight. The garden is drawn in
// layers — moonlit floor, hedges and bushes, lanterns and the exit gate,
// guards with their vision cones, the player — then a night overlay with
// light punched out around the player and the lanterns, so the cones and the
// glow are what the eye reads first. The HUD and the title, pause, win and
// caught screens are drawn here too.
import {
  TILE,
  COLS,
  ROWS,
  VIEW_W,
  VIEW_H,
  COLORS,
  LANTERNS_TO_WIN,
  SUSPICION_WARY,
  SUSPICION_ALARM,
} from './config.js';
import { MAP_ROWS, tileAt } from './level.js';
import { conePoints } from './vision.js';
import { mulberry32, range } from './random.js';

// Floor speckle and fireflies are seeded once, so every load looks the same.
const speckleRng = mulberry32(20261121);
const SPECKLES = [];
for (let i = 0; i < 420; i++) {
  SPECKLES.push({
    x: speckleRng() * VIEW_W,
    y: speckleRng() * VIEW_H,
    r: range(speckleRng, 0.6, 1.8),
    a: range(speckleRng, 0.05, 0.16),
  });
}
const fireflyRng = mulberry32(777);
const FIREFLIES = [];
for (let i = 0; i < 26; i++) {
  FIREFLIES.push({
    bx: fireflyRng() * VIEW_W,
    by: fireflyRng() * VIEW_H,
    amp: range(fireflyRng, 8, 26),
    speed: range(fireflyRng, 0.3, 0.9),
    phase: fireflyRng() * Math.PI * 2,
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const ch = tileAt(col, row);
      if (ch === '#') continue;
      ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
    }
  }
  ctx.fillStyle = '#ffffff';
  for (const s of SPECKLES) {
    ctx.globalAlpha = s.a;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHedges(ctx) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (tileAt(col, row) !== '#') continue;
      const x = col * TILE;
      const y = row * TILE;
      ctx.fillStyle = COLORS.hedgeDark;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = COLORS.hedge;
      roundRect(ctx, x + 2, y + 2, TILE - 4, TILE - 4, 7);
      ctx.fill();
      ctx.fillStyle = COLORS.hedgeTop;
      ctx.beginPath();
      ctx.arc(x + 11, y + 12, 6, 0, Math.PI * 2);
      ctx.arc(x + 27, y + 10, 5, 0, Math.PI * 2);
      ctx.arc(x + 20, y + 27, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBushes(ctx, bushes, nowMs) {
  for (const b of bushes) {
    const sway = Math.sin(nowMs / 1400 + b.col * 1.3 + b.row) * 1.5;
    ctx.fillStyle = COLORS.bushLeafDark;
    ctx.beginPath();
    ctx.arc(b.x + sway, b.y, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.bush;
    ctx.beginPath();
    ctx.arc(b.x - 8 + sway, b.y - 5, 10, 0, Math.PI * 2);
    ctx.arc(b.x + 9 + sway, b.y + 4, 11, 0, Math.PI * 2);
    ctx.arc(b.x + sway, b.y - 9, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.bushLeaf;
    ctx.beginPath();
    ctx.arc(b.x - 6 + sway, b.y - 7, 4.5, 0, Math.PI * 2);
    ctx.arc(b.x + 8 + sway, b.y - 2, 4, 0, Math.PI * 2);
    ctx.arc(b.x + sway, b.y + 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLantern(ctx, lantern, nowMs) {
  if (lantern.taken) {
    // An empty pedestal where a lantern was.
    ctx.fillStyle = '#3a3f55';
    ctx.fillRect(lantern.x - 9, lantern.y - 4, 18, 10);
    ctx.fillStyle = '#565e7d';
    ctx.fillRect(lantern.x - 6, lantern.y - 10, 12, 7);
    return;
  }
  const flicker = 0.85 + Math.sin(nowMs / 130 + lantern.id * 2.4) * 0.08
    + Math.sin(nowMs / 47 + lantern.id) * 0.05;
  const glow = ctx.createRadialGradient(lantern.x, lantern.y - 8, 4, lantern.x, lantern.y - 8, 66);
  glow.addColorStop(0, `rgba(255, 179, 71, ${0.5 * flicker})`);
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(lantern.x, lantern.y - 8, 66, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3f55';
  ctx.fillRect(lantern.x - 9, lantern.y - 2, 18, 9);
  ctx.fillStyle = '#565e7d';
  ctx.fillRect(lantern.x - 7, lantern.y - 8, 14, 7);
  ctx.fillStyle = COLORS.lanternCore;
  ctx.beginPath();
  ctx.arc(lantern.x, lantern.y - 16, 8 * flicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.lanternGlow;
  ctx.beginPath();
  ctx.arc(lantern.x, lantern.y - 16, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawExit(ctx, exit, open, nowMs) {
  const pulse = open ? 0.75 + Math.sin(nowMs / 260) * 0.25 : 0;
  const glow = ctx.createRadialGradient(exit.x, exit.y, 4, exit.x, exit.y, 90);
  glow.addColorStop(0, open ? `rgba(255, 215, 106, ${0.45 + pulse * 0.3})` : 'rgba(138, 122, 77, 0.25)');
  glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(exit.x, exit.y, 90, 0, Math.PI * 2);
  ctx.fill();
  // Golden arch.
  ctx.strokeStyle = open ? COLORS.exitGold : COLORS.exitLocked;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(exit.x, exit.y + 8, 17, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(exit.x - 17, exit.y + 8);
  ctx.lineTo(exit.x - 17, exit.y + 18);
  ctx.moveTo(exit.x + 17, exit.y + 8);
  ctx.lineTo(exit.x + 17, exit.y + 18);
  ctx.stroke();
  if (!open) {
    // Chains across a locked gate.
    ctx.strokeStyle = '#c9c2a4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(exit.x - 14, exit.y - 2);
    ctx.lineTo(exit.x + 14, exit.y + 6);
    ctx.moveTo(exit.x + 14, exit.y - 2);
    ctx.lineTo(exit.x - 14, exit.y + 6);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', exit.x, exit.y + 34);
  }
}

function drawGuard(ctx, guard, nowMs) {
  const pts = conePoints(guard);
  const coneColor =
    guard.state === 'chase'
      ? COLORS.coneAlarm
      : guard.suspicion >= SUSPICION_WARY
        ? COLORS.coneWary
        : COLORS.coneCalm;
  ctx.fillStyle = coneColor;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
  // Body: a watchman in a crimson coat, facing his patrol direction.
  ctx.fillStyle = COLORS.guardDark;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + 2, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guardBody;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guardTrim;
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.facing) * 8, guard.y + Math.sin(guard.facing) * 8, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Brimmed hat.
  ctx.fillStyle = '#2a1a12';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y - 3, 7, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion mark: "?" while wary, "!" while chasing.
  if (guard.state === 'chase' || guard.suspicion >= SUSPICION_WARY) {
    const mark = guard.state === 'chase' ? '!' : '?';
    const bob = Math.sin(nowMs / 200) * 2;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = guard.state === 'chase' ? '#ff5040' : '#ffd76a';
    ctx.fillText(mark, guard.x, guard.y - 22 + bob);
  }
}

function drawPlayer(ctx, player, nowMs) {
  // A soft pool of lantern light carried by the thief.
  const glow = ctx.createRadialGradient(player.x, player.y, 6, player.x, player.y, 74);
  glow.addColorStop(0, 'rgba(255, 214, 120, 0.28)');
  glow.addColorStop(1, 'rgba(255, 214, 120, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 74, 0, Math.PI * 2);
  ctx.fill();
  const hidden = player.hiddenInBush;
  ctx.globalAlpha = hidden ? 0.55 : 1;
  // Cloak: a triangle pointing where the thief faces.
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  const a = player.facing;
  ctx.moveTo(player.x + Math.cos(a) * 16, player.y + Math.sin(a) * 16);
  ctx.arc(player.x, player.y, 13, a + 2.2, a - 2.2);
  ctx.closePath();
  ctx.fill();
  // Hood.
  ctx.fillStyle = COLORS.playerHood;
  ctx.beginPath();
  ctx.arc(player.x, player.y - 1, 8, 0, Math.PI * 2);
  ctx.fill();
  // Gold trim and a tiny carried lantern.
  ctx.fillStyle = COLORS.playerTrim;
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(a + 2.4) * 10, player.y + Math.sin(a + 2.4) * 10, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (hidden) {
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fe8b4';
    ctx.fillText('HIDDEN', player.x, player.y - 22);
  }
  void nowMs;
}

function drawPebbles(ctx, pebbles, nowMs) {
  for (const p of pebbles) {
    const age = nowMs - p.bornMs;
    const alpha = Math.max(0, 1 - age / 900);
    ctx.strokeStyle = `rgba(255, 220, 130, ${0.7 * alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6 + age / 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#cfd3e0';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The night: a dark wash with holes of light around the player, the
// lanterns and the open exit, so the garden reads as moonlit and dangerous.
function drawNight(ctx, lightCanvas, lights) {
  const lctx = lightCanvas.getContext('2d');
  lctx.clearRect(0, 0, VIEW_W, VIEW_H);
  lctx.fillStyle = COLORS.night;
  lctx.fillRect(0, 0, VIEW_W, VIEW_H);
  lctx.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    const g = lctx.createRadialGradient(l.x, l.y, 8, l.x, l.y, l.r);
    g.addColorStop(0, 'rgba(0,0,0,0.95)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = g;
    lctx.beginPath();
    lctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    lctx.fill();
  }
  lctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightCanvas, 0, 0);
}

function drawFireflies(ctx, nowMs) {
  ctx.fillStyle = '#ffe9a8';
  for (const f of FIREFLIES) {
    const x = f.bx + Math.sin(nowMs / 1000 * f.speed + f.phase) * f.amp;
    const y = f.by + Math.cos(nowMs / 1300 * f.speed + f.phase) * f.amp * 0.6;
    const twinkle = 0.35 + 0.3 * Math.sin(nowMs / 300 + f.phase * 3);
    ctx.globalAlpha = Math.max(0.08, twinkle);
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, game) {
  const { player, lanterns, guards, elapsedMs, muted } = game;
  ctx.fillStyle = 'rgba(5, 8, 20, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = '#dfe6ff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  // Lanterns collected.
  ctx.fillText('LANTERNS', 18, 29);
  lanterns.forEach((l, i) => {
    const x = 118 + i * 30;
    ctx.fillStyle = l.taken ? COLORS.lanternCore : '#3a3f55';
    ctx.beginPath();
    ctx.arc(x, 24, 8, 0, Math.PI * 2);
    ctx.fill();
    if (l.taken) {
      ctx.fillStyle = COLORS.lanternGlow;
      ctx.beginPath();
      ctx.arc(x, 24, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // Suspicion: the highest guard meter.
  const worst = Math.max(0, ...guards.map((g) => g.suspicion));
  const sx = 250;
  ctx.fillStyle = '#dfe6ff';
  ctx.fillText('SUSPICION', sx, 29);
  ctx.fillStyle = '#2a3050';
  roundRect(ctx, sx + 96, 15, 180, 16, 8);
  ctx.fill();
  ctx.fillStyle = worst >= SUSPICION_ALARM ? '#ff5040' : worst >= SUSPICION_WARY ? '#ff9e2c' : '#ffd65a';
  if (worst > 1) {
    roundRect(ctx, sx + 96, 15, Math.max(16, (180 * worst) / 100), 16, 8);
    ctx.fill();
  }
  // Timer.
  const totalSec = Math.floor(elapsedMs / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  ctx.fillStyle = '#dfe6ff';
  ctx.textAlign = 'center';
  ctx.fillText(`${mm}:${ss}`, 640, 29);
  // Lives and pebbles, right side.
  ctx.textAlign = 'right';
  let hearts = '';
  for (let i = 0; i < game.lives; i++) hearts += '♥ ';
  ctx.fillStyle = '#ff7a6e';
  ctx.fillText(hearts.trim(), 1060, 29);
  ctx.fillStyle = '#dfe6ff';
  ctx.fillText(`pebbles ${player.pebbles}`, 1180, 29);
  if (muted) {
    ctx.fillStyle = '#9aa3c0';
    ctx.fillText('muted (M)', 1262, 29);
  }
  // Context hint along the bottom.
  ctx.textAlign = 'center';
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#8d96b8';
  const hint =
    game.state === 'playing'
      ? lanterns.every((l) => l.taken)
        ? 'All lanterns lit — reach the golden gate, unseen.'
        : 'WASD move · Shift sneak · click throws a pebble · P pause · M mute'
      : '';
  if (hint) ctx.fillText(hint, VIEW_W / 2, VIEW_H - 12);
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(4, 7, 18, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent || '#ffd76a';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, 250);
  ctx.fillStyle = '#dfe6ff';
  ctx.font = '19px Georgia, serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 310 + i * 34));
}

function drawTitle(ctx, nowMs) {
  overlay(ctx, 'EMBERLIGHT', [
    'A lantern thief\'s errand — steal the three ember lanterns,',
    'slip past the watchmen, and reach the golden gate unseen.',
    '',
    'WASD / arrows — move      Shift — sneak      Click — throw a pebble',
    'Bushes hide you. Vision cones are danger. Suspicion fades if you break away.',
    '',
    'Click or press Enter to begin',
  ]);
  const glow = 0.6 + Math.sin(nowMs / 400) * 0.4;
  ctx.fillStyle = `rgba(255, 179, 71, ${glow})`;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('✦', VIEW_W / 2 - 130, 250);
  ctx.fillText('✦', VIEW_W / 2 + 130, 250);
}

function drawPaused(ctx) {
  overlay(ctx, 'PAUSED', [
    'The watchmen hold their patrol.',
    '',
    'P / Esc — resume      R — restart      M — mute',
  ]);
}

function drawWon(ctx, game) {
  const totalSec = Math.floor(game.elapsedMs / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = String(totalSec % 60).padStart(2, '0');
  const stars = game.catches === 0 && totalSec < 180 ? '★★★' : game.catches <= 1 ? '★★' : '★';
  overlay(ctx, 'UNSEEN', [
    `You slipped out with all three lanterns in ${mm}:${ss}.`,
    `Caught ${game.catches} time${game.catches === 1 ? '' : 's'}  ·  ${stars}`,
    '',
    'R — play again      Enter — play again',
  ], '#9fe8b4');
}

function drawLost(ctx, game) {
  overlay(ctx, 'THE GARDEN KEEPS YOU', [
    'Three times caught — the watchmen know your face now.',
    `You lit ${game.player.lanterns} of ${LANTERNS_TO_WIN} lanterns.`,
    '',
    'R — try again      Enter — try again',
  ], '#ff7a6e');
}

function drawCaughtFlash(ctx, game) {
  if (game.caughtFlashMs <= 0) return;
  ctx.fillStyle = `rgba(255, 40, 30, ${Math.min(0.35, game.caughtFlashMs / 1000)})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText('CAUGHT!', VIEW_W / 2, VIEW_H / 2 - 10);
  ctx.font = '18px Georgia, serif';
  ctx.fillText('The watchman drags you back to the gate…', VIEW_W / 2, VIEW_H / 2 + 28);
}

// One frame of the whole game. `game` carries state, player, guards,
// lanterns, exit, bushes, pebbles, lives, catches and elapsed time.
export function render(ctx, lightCanvas, game, nowMs) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx);
  drawHedges(ctx);
  drawBushes(ctx, game.bushes, nowMs);
  for (const l of game.lanterns) drawLantern(ctx, l, nowMs);
  drawExit(ctx, game.exit, game.lanterns.every((l) => l.taken), nowMs);
  drawFireflies(ctx, nowMs);
  for (const g of game.guards) drawGuard(ctx, g, nowMs);
  drawPebbles(ctx, game.pebbles, nowMs);
  if (game.state !== 'title') drawPlayer(ctx, game.player, nowMs);
  const lights = [{ x: game.player.x, y: game.player.y, r: 190 }];
  for (const l of game.lanterns) {
    if (!l.taken) lights.push({ x: l.x, y: l.y - 8, r: 120 });
  }
  if (game.lanterns.every((l) => l.taken)) lights.push({ x: game.exit.x, y: game.exit.y, r: 150 });
  drawNight(ctx, lightCanvas, lights);
  // Cones again, faintly, above the night so they stay readable.
  for (const g of game.guards) {
    const pts = conePoints(g);
    ctx.fillStyle = g.state === 'chase' ? 'rgba(255, 64, 48, 0.10)' : 'rgba(255, 214, 90, 0.06)';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
  }
  drawFireflies(ctx, nowMs);
  drawHud(ctx, game);
  drawCaughtFlash(ctx, game);
  if (game.state === 'title') drawTitle(ctx, nowMs);
  if (game.state === 'paused') drawPaused(ctx);
  if (game.state === 'won') drawWon(ctx, game);
  if (game.state === 'lost') drawLost(ctx, game);
}

export { MAP_ROWS };
