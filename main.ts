// Emberlight — make.fun entrypoint (Node 22, standard library only).
// Hands the game in: copies this repository's game/ and screenshots/ into
// the output directory and writes /output/dossier.json with the vendored
// make.fun library. Runs twice must write the same bytes, so it never reads
// the clock or the network, and it never deletes the output directory
// itself — it only clears the three things it owns inside it.
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function clearOwned(dir) {
  // Make anything a previous run left behind writable, then remove it.
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    try {
      chmodSync(path, 0o755);
    } catch {
      // A path that cannot be chmodded is still removed below if possible.
    }
    rmSync(path, { recursive: true, force: true });
  }
}

mkdirSync(out, { recursive: true });
clearOwned(out);

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps for this bounty: the dossier text budget and the size
// limits game/ and screenshots/ must already meet.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Sanity: the output holds exactly the game, the screenshots and the dossier.
const listing = readdirSync(out).sort();
for (const name of listing) {
  const st = statSync(join(out, name));
  if (!st.isDirectory() && name !== 'dossier.json') {
    throw new Error(`unexpected file in output: ${name}`);
  }
}
