import type { ScoreResult, SlotState } from '../core/types.js';
import { tierBadge } from '../core/tiers.js';
import { bold, dim, fafCyan, orange } from './colors.js';

/** Display a score result to stdout */
export function displayScore(result: ScoreResult, file: string, verbose = false): void {
  const badge = tierBadge(result.tier);
  const pct = bold(`${result.score}%`);
  console.log(`${badge} ${pct} ${dim(`${result.populated}/${result.active} slots`)} ${dim('—')} ${file}`);

  if (result.tier.name !== 'TROPHY' && result.empty > 0) {
    console.log(dim(`  ${result.empty} empty`));
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
