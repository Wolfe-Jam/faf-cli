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
    ['tri-sync', '.faf ↔ CLAUDE.md ↔ MEMORY.md — free for developers'],
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

  // Try to open upgrade URL
  try {
    const open = require('open');
    open('https://faf.one/pro');
  } catch {
    console.log(dim('  Visit: https://faf.one/pro'));
  }
}
