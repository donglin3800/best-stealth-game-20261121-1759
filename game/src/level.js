// The manor garden level for Emberlight, drawn as text and parsed at load.
// Legend: '#' hedge wall, '.' moonlit path, 'B' tall bush (cover to hide in),
// 'L' ember lantern (collect all three), 'E' exit gate, 'P' player start.
// Guards never spawn on the map text; their patrol routes are listed below
// in tile coordinates, and every route segment runs along open path tiles.
import { COLS, ROWS, TILE } from './config.js';

const MAP_ROWS = [
  '################################',
  '#P....#......#......#......#..E#',
  '#.....#..B...#..L...#..B...#...#',
  '#..B..#......#......#......#...#',
  '#.....#......#..B...#..L...#...#',
  '#.....#..B...#......#......#...#',
  '#..##...####...####...####..#..#',
  '#..#...........................#',
  '#..#..B....#....#.....B....#...#',
  '#..#.......#....#..........#...#',
  '#.....B....#....#....B.....#...#',
  '#..........#...#..........#....#',
  '#..######..#...#...######..#...#',
  '#..#.......#...#.......#.......#',
  '#..#...B...#...#...B...#...B...#',
  '#..#.......#.......#...........#',
  '#......L.......................#',
  '################################',
];

// One guard's patrol: a loop of waypoints (tile x, tile y) plus a name and a
// pause at each waypoint. Routes are short, learnable loops the player can
// watch and time, and the three routes cover the three lantern rooms.
export const GUARD_ROUTES = [
  {
    name: 'Moth',
    waypoints: [
      [10, 2],
      [12, 2],
      [12, 5],
      [10, 5],
    ],
  },
  {
    name: 'Wick',
    waypoints: [
      [5, 7],
      [29, 7],
    ],
  },
  {
    name: 'Ember',
    waypoints: [
      [4, 13],
      [10, 13],
      [10, 15],
      [4, 15],
    ],
  },
  {
    name: 'Ash',
    waypoints: [
      [17, 9],
      [26, 9],
    ],
  },
];

export function tileAt(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
  return MAP_ROWS[row][col];
}

export function isWallTile(col, row) {
  return tileAt(col, row) === '#';
}

export function isBushTile(col, row) {
  return tileAt(col, row) === 'B';
}

// Walkable for the player and the guards: anything that is not a hedge.
export function isWalkableTile(col, row) {
  return tileAt(col, row) !== '#';
}

export function tileCenter(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

// Scan the map once and return the level objects: player start, lantern
// pedestals, the exit gate and the bush tiles, all in pixel coordinates.
export function parseLevel() {
  const lanterns = [];
  const bushes = [];
  let playerStart = { x: TILE * 1.5, y: TILE * 1.5 };
  let exit = { x: TILE * 30.5, y: TILE * 1.5 };
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const ch = MAP_ROWS[row][col];
      const c = tileCenter(col, row);
      if (ch === 'P') playerStart = { x: c.x, y: c.y };
      if (ch === 'L') lanterns.push({ x: c.x, y: c.y, taken: false, id: lanterns.length });
      if (ch === 'E') exit = { x: c.x, y: c.y };
      if (ch === 'B') bushes.push({ col, row, x: c.x, y: c.y });
    }
  }
  return { lanterns, bushes, playerStart, exit };
}

export { MAP_ROWS };
