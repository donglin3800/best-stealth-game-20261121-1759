// Shared constants for Emberlight: sizes, speeds, vision and scoring rules.
// Every tunable number of the game lives here so a balance pass touches one file.
export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const VIEW_W = 1280;
export const VIEW_H = 720;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 178;
export const PLAYER_SNEAK_SPEED = 96;
export const PLAYER_GUARD_CATCH_DIST = 30;

export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 132;
export const GUARD_INVESTIGATE_SPEED = 92;
export const GUARD_PAUSE_MS = 1400;

export const VISION_RANGE = 235;
export const VISION_HALF_ANGLE = 0.62; // radians, about 35 degrees each side
export const VISION_CLOSE_DIST = 78; // inside this, suspicion rises fastest
export const BUSH_HIDE_DIST = 72; // a guard must be this close to spot you in a bush

export const SUSPICION_RISE_CLOSE = 62; // per second, fully in the open, close
export const SUSPICION_RISE_MID = 34; // per second, in cone at mid range
export const SUSPICION_RISE_FAR = 16; // per second, at the edge of the cone
export const SUSPICION_SNEAK_FACTOR = 0.45; // sneaking slows the rise
export const SUSPICION_DECAY = 20; // per second while unseen
export const SUSPICION_ALARM = 100;
export const SUSPICION_WARY = 45; // above this the guard shows "?" and walks faster

export const ALARM_CHASE_SECONDS = 5.0; // how long a guard chases after losing sight
export const INVESTIGATE_SECONDS = 2.6; // how long a guard stares at a pebble spot

export const PEBBLE_COUNT = 5;
export const PEBBLE_RANGE = 280; // how far a throw can reach
export const PEBBLE_NOISE_RADIUS = 190; // guards inside this hear it land
export const PEBBLE_COOLDOWN_MS = 600;

export const LANTERNS_TO_WIN = 3;
export const START_LIVES = 3;

export const COLORS = {
  floorA: '#171d33',
  floorB: '#141a2e',
  floorEdge: '#1d2440',
  hedge: '#1e4d2e',
  hedgeTop: '#2f7a44',
  hedgeDark: '#143522',
  bush: '#1c5c33',
  bushLeaf: '#2e8a4a',
  bushLeafDark: '#17502a',
  lanternGlow: '#ffb347',
  lanternCore: '#ffe9a8',
  exitGold: '#ffd76a',
  exitLocked: '#8a7a4d',
  playerCloak: '#2b6f7e',
  playerHood: '#173f4a',
  playerTrim: '#ffd76a',
  guardBody: '#a33327',
  guardDark: '#6e1f16',
  guardTrim: '#e8b64c',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneWary: 'rgba(255, 158, 44, 0.30)',
  coneAlarm: 'rgba(255, 64, 48, 0.38)',
  night: 'rgba(4, 7, 18, 0.60)',
};
