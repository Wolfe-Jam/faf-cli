import { FafDNAManager } from '../core/faf-dna.js';
import { bold, dim, fafCyan, orange } from '../ui/colors.js';

/** After recording growth: when the `.faf-dna` is one faf did not write (and
 *  so was left as it is), say why on stderr, in one line. */
export function sayWhyDnaIsLeft(dna: FafDNAManager): void {
  const why = dna.readOnlyReason();
  if (why) {console.error(`faf: ${why}`);}
}

/** `faf dna` — show your FAF DNA journey at a glance: 22% → 85% → 99% ← 92%. */
export function dnaCommand(): void {
  const dna = new FafDNAManager(process.cwd());
  if (!dna.load()) {
    // A .faf-dna that is there but cannot be read (not UTF-8, not JSON, …) says why.
    const why = dna.readOnlyReason();
    console.error(why ? `${bold('×')} ${why}` : `${bold('×')} No FAF DNA found. Run ${bold("'faf init'")} to start your journey.`);
    process.exit(1);
  }

  const journey = dna.getJourney();
  const info = dna.getBirthDNADisplay()!;
  const born = info.born.split('T')[0] || 'unknown';

  console.log();
  console.log(orange(bold('🧬 YOUR FAF DNA')));
  console.log();
  console.log(`   ${fafCyan(bold(journey))}`);
  console.log();
  console.log(
    dim(`   Birth DNA ${info.birthDNA}% (born ${born})  ·  current ${info.current}%  ·  growth ${info.growth >= 0 ? '+' : ''}${info.growth}%`),
  );

  const why = dna.readOnlyReason();
  if (why) {
    // faf did not write this .faf-dna (another tool's shape, or text faf cannot
    // prove it wrote). faf reads what it can and never rewrites it; growth is
    // not recorded into it.
    console.log(dim(`   ${why} ${bold("'faf init --force'")} starts a fresh lineage.`));
  }

  const log = dna.getLog();
  if (log.length > 1) {
    console.log();
    console.log(dim('   history:'));
    for (const line of log) {console.log(dim(`   ${line}`));}
  }
  console.log();
}
