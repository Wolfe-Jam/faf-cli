import { existsSync } from 'fs';
import { join } from 'path';
import { assembleFreshFaf, updateExistingFaf } from '../detect/assemble.js';
import { writeFaf, readFaf, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { FafDNAManager } from '../core/faf-dna.js';
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
    writeFaf(fafPath, updateExistingFaf(dir, readFaf(fafPath)));
    console.log(`${fafCyan('updated')} ${fafPath}`);
  } else {
    // New file: full assembly pipeline (shared with `faf git`).
    writeFaf(fafPath, assembleFreshFaf(dir));
    console.log(`${fafCyan('created')} ${fafPath}`);
  }

  const yaml = readFafRaw(fafPath);
  const result = enrichScore(kernel.score(yaml));

  // Record growth on the DNA journey, if a heartbeat exists (faf init births it).
  const dna = new FafDNAManager(dir);
  if (dna.exists()) {
    dna.recordGrowth(result.score, ['faf auto']);
  }

  displayScore(result, fafPath);

  if (result.score < 100) {
    console.log(dim(`\n  run ${bold("'faf go'")} to reach ✪ Trophy`));
  }
}
