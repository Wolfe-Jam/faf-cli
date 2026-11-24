import { existsSync } from 'fs';
import { join } from 'path';
import { updateExistingFaf } from '../detect/assemble.js';
import { aliasKeptNote, writeFaf, readFaf, readFafRaw, withKernel } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { typedNoneHints } from '../core/typed-none.js';
import { FafDNAManager } from '../core/faf-dna.js';
import { sayWhyDnaIsLeft } from './dna.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';
import { assertProjectCwd } from '../core/cwd-guard.js';
import { suggestionNote } from '../core/suggest.js';
import { initCommand } from './init.js';

export function autoCommand(): void {
  assertProjectCwd(process.cwd(), 'faf auto');
  const dir = process.cwd();
  const fafPath = join(dir, 'project.faf');

  // No project.faf: auto runs init (#279). init writes the file and the birth
  // certificate; there is nothing left for auto to fill.
  if (!existsSync(fafPath)) {
    initCommand();
    return;
  }

  // Update: existing wins (preserve user edits), then interrogated → detected →
  // Turbo-Cat (formats) → Relentless (6 W's) fill the remaining empties.
  // Shared with consumers via the public updateExistingFaf export.
  // Only what changed is written; comments and formatting stay as they are.
  // An alias (`stack: *base`) is never expanded to fill a slot under it —
  // it stays as written, and faf says so in one line.
  // A project.faf the scoring kernel cannot read is refused in one line
  // before anything is written — the fill keeps every key, so the kernel
  // could not read the filled file either.
  const existing = readFaf(fafPath);
  withKernel(fafPath, () => kernel.score(readFafRaw(fafPath)));
  const aliases: string[] = [];
  const written = writeFaf(fafPath, updateExistingFaf(dir, existing), {
    onAliasKept: kept => aliases.push(aliasKeptNote(kept)),
  });
  console.log(`${written ? fafCyan('updated') : dim('unchanged')} ${fafPath}`);
  for (const line of aliases) {console.log(dim(`  ${line}`));}

  const yaml = readFafRaw(fafPath);
  const result = withKernel(fafPath, () => enrichScore(kernel.score(yaml)));

  // A .faf-dna that is there records growth; one that is not is left alone.
  const dna = new FafDNAManager(dir);
  if (dna.exists()) {
    dna.recordGrowth(result.score, ['faf auto']);
    sayWhyDnaIsLeft(dna);
  }

  // A slot the app-type needs that still holds typed words — None, N/A,
  // unknown — (no repo fact filled it) counts as empty: say so under the
  // score, one line per slot. Slots the app-type leaves out are marked by now.
  displayScore(result, fafPath, false, typedNoneHints(yaml, result, { outOfType: false }));

  // The goal and the six W's are the human's: auto suggests, `faf go` confirms.
  const note = suggestionNote(dir, readFaf(fafPath) as Record<string, unknown>);
  if (note) {console.log(dim(`\n  ${note}`));}
  if (result.score < 100) {
    console.log(dim(`${note ? '' : '\n'}  run ${bold("'faf go'")} to reach ✪ Trophy`));
  }
}
