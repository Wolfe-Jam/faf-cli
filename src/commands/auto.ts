import { existsSync } from 'fs';
import { join } from 'path';
import { detectStack } from '../detect/stack.js';
import { interrogateRepo } from '../interrogate/index.js';
import { seedHumanContext } from '../detect/context-seed.js';
import { writeFaf, readFaf, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { FafDNAManager } from '../core/faf-dna.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';
import { APP_TYPE_CATEGORIES, SLOTS, isPlaceholder } from '../core/slots.js';

export function autoCommand(): void {
  const dir = process.cwd();
  const fafPath = join(dir, 'project.faf');

  // Detection: signal-based stack/language/runtime/etc. (existing).
  const detected = detectStack(dir);
  // Interrogation: per-slot evidence from README + Cargo.toml (no-guess/no-slop).
  const interrogated = interrogateRepo(dir);

  if (existsSync(fafPath)) {
    const existing = readFaf(fafPath);
    // Merge order: existing wins (preserve user edits), then interrogated fills
    // empties (README/Cargo evidence), then detected fills any remaining empties.
    const withInterrogated = fillEmpties(existing, interrogated as Record<string, unknown>);
    const merged = fillEmpties(withInterrogated, detected as Record<string, unknown>);
    // Seed-and-suggest: fill empty 6 W's from evidence (faf go confirms).
    const seeded = fillEmpties(merged, { human_context: seedHumanContext(dir) } as Record<string, unknown>);
    writeFaf(fafPath, seeded);
    console.log(`${fafCyan('updated')} ${fafPath}`);
  } else {
    // New file: detected provides scaffold (slotignored markers), interrogated
    // overlays evidence-backed values where it has them.
    const seeded = fillEmpties(
      detected as Record<string, unknown>,
      interrogated as Record<string, unknown>,
    );
    const projectType = (seeded.project as { type?: string } | undefined)?.type ?? 'library';
    const activeCategories = APP_TYPE_CATEGORIES[projectType] || APP_TYPE_CATEGORIES.library;

    for (const slot of SLOTS) {
      if (!activeCategories.includes(slot.category)) {
        const [section, field] = slot.path.split('.');
        if (section === 'stack' && seeded.stack) {
          (seeded.stack as Record<string, string>)[field] = 'slotignored';
        }
        if (section === 'monorepo' && seeded.monorepo) {
          (seeded.monorepo as Record<string, string>)[field] = 'slotignored';
        }
      }
    }

    const ctxSeeded = fillEmpties(seeded, { human_context: seedHumanContext(dir) } as Record<string, unknown>);
    writeFaf(fafPath, ctxSeeded);
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

/** Fill empty/placeholder slots in `target` with values from `source`.
 *  `target` wins when its slot is non-empty. Empty here is per `isPlaceholder`
 *  (covers '', null, undefined, and known placeholder strings) — this is what
 *  lets interrogated/detected values overwrite the empty-string defaults that
 *  detectStack writes to human_context. */
function fillEmpties(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key];
    if (isPlaceholder(existing)) {
      result[key] = value;
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      typeof existing === 'object' &&
      existing !== null &&
      !Array.isArray(existing)
    ) {
      result[key] = fillEmpties(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    }
  }
  return result;
}
