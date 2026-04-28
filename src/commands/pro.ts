import { isPro } from '../core/pro.js';
import { bold, dim, fafCyan, orange } from '../ui/colors.js';

/** Pro features & licensing */
export function proCommand(subcommand?: string): void {
  if (subcommand === 'features') {
    showFeatures();
  } else if (subcommand === 'activate') {
    activatePro();
  } else {
    showStatus();
  }
}

function showStatus(): void {
  const status = isPro();
  console.log(`${fafCyan('pro')} ${dim('— FAF Pro status')}\n`);
  console.log(`  Status: ${status ? orange(bold('PRO')) : bold('Free')}`);
  console.log('');
  if (!status) {
    console.log(dim('  Upgrade: faf pro activate'));
  }
}

function showFeatures(): void {
  console.log(`${fafCyan('pro')} ${dim('— Pro features')}\n`);
  const features = [
    ['tri-sync', '.faf ↔ CLAUDE.md ↔ MEMORY.md'],
    ['enterprise slots', '33-slot scoring (slots 22-33)'],
    ['advanced analytics', 'Drift tracking & team metrics'],
  ];
  for (const [name, desc] of features) {
    console.log(`  ${fafCyan('◆')} ${bold(name)} ${dim('—')} ${desc}`);
  }
  console.log('');
}

function activatePro(): void {
  console.log(`${fafCyan('pro')} ${dim('— activate')}\n`);
  console.log('  Set FAF_PRO=1 in your environment to enable Pro features.');
  console.log('');
  console.log(dim('  export FAF_PRO=1'));
  console.log('');
  console.log(dim('  Visit: https://faf.one/pro'));

  // Try to also open the upgrade URL in the browser. Fire-and-forget;
  // the printed link above is the always-on fallback.
  // `open` v9+ is ESM-only, so we use dynamic import.
  import('open')
    .then(({ default: open }) => open('https://faf.one/pro'))
    .catch(() => {});
}
