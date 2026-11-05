// Drop `sourcesContent` from every source map in dist/: the maps keep pointing
// stack traces at file:line, but no longer carry a full copy of the source,
// which was most of the package's size.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

let files = 0;
let saved = 0;
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.map')) { continue; }
    const before = readFileSync(p, 'utf-8');
    const map = JSON.parse(before);
    if (!('sourcesContent' in map)) { continue; }
    delete map.sourcesContent;
    const after = JSON.stringify(map);
    writeFileSync(p, after);
    files++;
    saved += before.length - after.length;
  }
};
walk(process.argv[2] ?? 'dist');
console.log(`strip-sources-content: ${files} map(s), ${(saved / 1e6).toFixed(2)} MB removed`);
