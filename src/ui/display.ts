import { existsSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import type { ScoreResult, SlotState } from '../core/types.js';
import { tierBadge } from '../core/tiers.js';
import { bold, dim, fafCyan, orange } from './colors.js';

/**
 * Is TAF already wired in this repo? (a `.github/workflows/taf.yml`, what
 * `faf taf setup` writes.) Walk up from the .faf so monorepo subdirs resolve to
 * the repo root. Used to gate the "proof over time" nudge — surface it until the
 * user acts, never nag once they have.
 */
function tafWired(fafFile: string): boolean {
  let dir = dirname(fafFile);
  const root = parse(dir).root;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, '.github', 'workflows', 'taf.yml'))) return true;
    if (dir === root) break;
    dir = dirname(dir);
  }
  return false;
}

/** Display a score result to stdout */
export function displayScore(result: ScoreResult, file: string, verbose = false): void {
  const badge = tierBadge(result.tier);
  const pct = bold(`${result.score}%`);
  console.log(`${badge} ${pct} ${dim(`${result.populated}/${result.active} slots`)} ${dim('—')} ${file}`);

  // Trophy = the only recommended state (v6.6.0+). Celebrate explicitly so the
  // user sees Trophy as the destination, not just a tier. Per
  // memory/trophy-is-the-target.md: 100% on the FCL is what makes the layers
  // above (MD instructions, Agents, AI tooling) work — sub-Trophy degrades them.
  if (result.tier.name === 'TROPHY') {
    console.log(dim('  Trophy. AI never has to guess.'));
    // KNOW nudge — TAF's weakest funnel step is awareness. The Trophy moment is
    // the exact hook: a one-time 100% is gameable (anyone can hit it once); the
    // append-only, push-after-push receipt is the asset. Surface it only here,
    // and only until the repo is wired (no nag). See memory/positioning-taf-proof-over-time-is-the-filter.
    if (!tafWired(file)) {
      console.log(
        dim('  Proof over time? ') + fafCyan('faf taf setup') +
        dim(' — a receipt every push; 100% you can prove, not just hit.'),
      );
    }
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

  if (verbose) {
    console.log('');
    displaySlotBreakdown(result);
  }
}

/** Display individual slot states */
function displaySlotBreakdown(result: ScoreResult): void {
  for (const [path, state] of Object.entries(result.slots)) {
    const icon = state === 'populated' ? fafCyan('●')
      : state === 'slotignored' ? dim('—')
      : dim('○');
    console.log(`  ${icon} ${state === 'slotignored' ? dim(path) : path}`);
  }
}

/** Display the FAF header/banner */
export function displayHeader(): void {
  console.log(fafCyan(bold('faf')) + dim(' — Foundational AI-Context Format'));
}
