# best-stealth-game-20261121-1759

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/donglin3800/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/donglin3800/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

Emberlight — a top-down stealth game for the make.fun bounty [best-stealth-game-20261121-1759](https://make.fun/bounty/best-stealth-game-20261121-1759). You are a lantern thief in a moonlit manor garden: steal the three ember lanterns, slip past four watchmen with vision cones, hide in the bushes, toss pebbles to draw guards away, and reach the golden gate unseen.

## Run it

```sh
node serve.mjs
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests — the game is plain static files under `game/`.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, quieter, harder to spot)
- **Click** — throw a pebble to distract a guard (5 per run)
- **P / Esc** — pause · **M** — mute · **R** — restart

Guards patrol routes you can learn and time. Their suspicion is a meter, not a switch: it climbs while you are in a vision cone and in the open, and fades when you break line of sight — so a near miss is recoverable. Bushes hide you unless a guard gets very close. Get caught three times and the run ends; light all three lanterns and reach the golden gate to slip out unseen.

## Layout

- `main.ts` — the make.fun entrypoint: copies `game/` and `screenshots/` to the output and writes `dossier.json`
- `game/index.html` — the page; `game/src/` holds the game, one job per file (`config`, `level`, `vision`, `guards`, `player`, `input`, `render`, `audio`, `shots`, `random`, `main`)
- `screenshots/` — four real renders of the game (cover, title, near miss, win)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `serve.mjs` — a tiny static server for local play-testing

---

*Built for the make.fun bounty [best-stealth-game-20261121-1759](https://make.fun/bounty/best-stealth-game-20261121-1759).*
