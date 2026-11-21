// Deterministic seeded random numbers (mulberry32). The game never uses
// Math.random for anything the player sees, so a fixed seed replays exactly
// the same floor speckle, firefly drift and shot staging every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick a value in [min, max) from a seeded stream.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}
