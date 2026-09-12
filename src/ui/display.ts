import type { ScoreResult, SlotState } from '../core/types.js';
import { tierBadge } from '../core/tiers.js';
import { bold, dim, fafCyan, orange } from './colors.js';
import { maybeStarNudge } from './star-nudge.js';

/** Display a score result to stdout. `notes` are printed, one per line,
 *  right under the score (the typed-none lines of `faf score` / `faf auto`). */
export function displayScore(result: ScoreResult, file: string, verbose = false, notes: readonly string[] = []): void {
  if (result.unknown) {
    // An About Repo with no source_score: there is no score to show, so no
    // number, no percentage and no tier — just what is and isn't known.
    const about = result.represents ? `about-repo for ${result.represents}` : 'about-repo';
    console.log(`${dim('—')} ${bold('unknown')} ${dim(`${about} — no about.source_score`)} ${dim('—')} ${file}`);
    return;
  }
  const badge = tierBadge(result.tier);
  const pct = bold(`${result.score}%`);
  console.log(`${badge} ${pct} ${dim(`${result.populated}/${result.active} slots`)} ${dim('—')} ${file}`);

  // Trophy = the only recommended state (v6.6.0+). Celebrate explicitly so the
  // user sees Trophy as the destination, not just a tier. Per
  // memory/trophy-is-the-target.md: 100% on the FCL is what makes the layers
  // above (MD instructions, Agents, AI tooling) work — sub-Trophy degrades them.
  if (result.tier.name === 'TROPHY') {
    console.log(dim('  Trophy. AI never has to guess.'));
  } else if (result.empty > 0) {
    // Sub-Trophy is an interim state on the way to Trophy, not an endpoint.
    // Frame the gap as "N slots from Trophy" so the next move is obvious.
    const emptyPaths = Object.entries(result.slots)
      .filter(([, state]) => state === 'empty')
      .map(([path]) => path);
    const preview = emptyPaths.slice(0, 3).join(', ');
    const suffix = emptyPaths.length > 3 ? `, +${emptyPaths.length - 3} more` : '';
    const noun = result.empty === 1 ? 'slot' : 'slots';
    console.log(dim(`  ${result.empty} ${noun} from Trophy: ${preview}${suffix}`));
  }
  printNotes(notes);

  if (verbose) {
    console.log('');
    displaySlotBreakdown(result);
  }

  // Capture the reservoir: a quiet star ask after a genuine win (gated in star-nudge.ts).
  maybeStarNudge(result.score);
}

/** One dim, indented line per note. */
function printNotes(notes: readonly string[]): void {
  for (const note of notes) {console.log(dim(`  ${note}`));}
}

/** Display individual slot states */
function displaySlotBreakdown(result: ScoreResult): void {
  for (const [path, state] of Object.entries(result.slots)) {
    const icon = state === 'populated' ? fafCyan('●')
      : state === 'slotignored' ? dim('—')
      : dim('○');
    console.log(`  ${icon} ${state === 'slotignored' ? dim(`${path}: N/A`) : path}`);
  }
}

/** Display the FAF header/banner */
export function displayHeader(): void {
  console.log(fafCyan(bold('faf')) + dim(' — Foundational AI-Context Format'));
}
