import { existsSync } from 'fs';
import { join } from 'path';
import { detectStack } from '../detect/stack.js';
import { interrogateRepo } from '../interrogate/index.js';
import { turboCatSlots } from '../detect/turbo-cat.js';
import { relentlessContext } from '../detect/relentless.js';
import { assembleFreshFaf, fillEmpties } from '../detect/assemble.js';
import { writeFaf, readFaf, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { FafDNAManager } from '../core/faf-dna.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

export function autoCommand(): void {
  const dir = process.cwd();
  const fafPath = join(dir, 'project.faf');

  if (existsSync(fafPath)) {
    // Update: existing wins (preserve user edits), then interrogated → detected →
    // Turbo-Cat (formats) → Relentless (6 W's) fill the remaining empties.
    const existing = readFaf(fafPath);
    const withInterrogated = fillEmpties(existing, interrogateRepo(dir) as Record<string, unknown>);
    const merged = fillEmpties(withInterrogated, detectStack(dir) as Record<string, unknown>);
    const withFormats = fillEmpties(merged, turboCatSlots(dir) as Record<string, unknown>);
    const seeded = fillEmpties(withFormats, { human_context: relentlessContext(dir) } as Record<string, unknown>);
    writeFaf(fafPath, seeded);
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
    console.log(dim(`\n  run ${bold("'faf go'")} to reach 🏆 Trophy`));
  }
}
