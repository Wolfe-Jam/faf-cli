import { FafDNAManager } from '../core/faf-dna.js';
import { bold, dim, fafCyan, orange } from '../ui/colors.js';

/** `faf dna` — show your FAF DNA journey at a glance: 22% → 85% → 99% ← 92%. */
export function dnaCommand(): void {
  const dna = new FafDNAManager(process.cwd());
  if (!dna.load()) {
    console.error(`${bold('×')} No FAF DNA found. Run ${bold("'faf init'")} to start your journey.`);
    process.exit(1);
  }

  const journey = dna.getJourney();
  const info = dna.getBirthDNADisplay()!;
  const born = info.born.split('T')[0];

  console.log();
  console.log(orange(bold('🧬 YOUR FAF DNA')));
  console.log();
  console.log(`   ${fafCyan(bold(journey))}`);
  console.log();
  console.log(
    dim(`   Birth DNA ${info.birthDNA}% (born ${born})  ·  current ${info.current}%  ·  growth ${info.growth >= 0 ? '+' : ''}${info.growth}%`),
  );

  const log = dna.getLog();
  if (log.length > 1) {
    console.log();
    console.log(dim('   history:'));
    for (const line of log) {console.log(dim(`   ${line}`));}
  }
  console.log();
}
