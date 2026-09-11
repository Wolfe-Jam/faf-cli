import { existsSync } from 'fs';
import { join } from 'path';
import { assembleFreshFaf, updateExistingFaf } from '../detect/assemble.js';
import { aliasKeptNote, writeFaf, readFaf, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { typedNoneHints } from '../core/typed-none.js';
import { FafDNAManager } from '../core/faf-dna.js';
import { sayWhyDnaIsLeft } from './dna.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';
import { assertProjectCwd } from '../core/cwd-guard.js';

export function autoCommand(): void {
  assertProjectCwd(process.cwd(), 'faf auto');
  const dir = process.cwd();
  const fafPath = join(dir, 'project.faf');

  if (existsSync(fafPath)) {
    // Update: existing wins (preserve user edits), then interrogated → detected →
    // Turbo-Cat (formats) → Relentless (6 W's) fill the remaining empties.
    // Shared with consumers via the public updateExistingFaf export.
    // Only what changed is written; comments and formatting stay as they are.
    // An alias (`stack: *base`) is never expanded to fill a slot under it —
    // it stays as written, and faf says so in one line.
    const aliases: string[] = [];
    const written = writeFaf(fafPath, updateExistingFaf(dir, readFaf(fafPath)), {
      onAliasKept: kept => aliases.push(aliasKeptNote(kept)),
    });
    console.log(`${written ? fafCyan('updated') : dim('unchanged')} ${fafPath}`);
    for (const line of aliases) {console.log(dim(`  ${line}`));}
  } else {
    // New file: full assembly pipeline (shared with `faf git`).
    writeFaf(fafPath, assembleFreshFaf(dir));
    console.log(`${fafCyan('created')} ${fafPath}`);
  }

  const yaml = readFafRaw(fafPath);
  const result = enrichScore(kernel.score(yaml));

  // Record growth on the DNA journey, if a heartbeat exists (faf init births it).
  // A .faf-dna faf did not write is left as it is — say so in one line.
  const dna = new FafDNAManager(dir);
  if (dna.exists()) {
    dna.recordGrowth(result.score, ['faf auto']);
    sayWhyDnaIsLeft(dna);
  }

  // A slot the app-type needs that still holds a typed None / N/A (no repo
  // fact filled it) counts as empty — say so under the score, one line per slot.
  displayScore(result, fafPath, false, typedNoneHints(yaml, result));

  if (result.score < 100) {
    console.log(dim(`\n  run ${bold("'faf go'")} to reach ✪ Trophy`));
  }
}
