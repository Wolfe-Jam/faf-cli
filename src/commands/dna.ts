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
    // not recorded into it. The offer of --force says "and keeps this one"
    // because since a3b400d6 a reset carries the life it ends into
    // `priorLineage` — the old wording read as a choice between a fresh start
    // and the record, which is no longer the trade.
    console.log(dim(`   ${why} ${bold("'faf init --force'")} starts a fresh lineage and keeps this one.`));
  }

  const log = dna.getLog();
  if (log.length > 1) {
    console.log();
    console.log(dim('   history:'));
    for (const line of log) {console.log(dim(`   ${line}`));}
  }

  // Lives a `faf init --force` ended. Kept in the file since a3b400d6, and shown
  // here because a record nothing displays is a record nobody trusts.
  const prior = dna.load()?.priorLineage ?? [];
  if (prior.length > 0) {
    console.log();
    console.log(dim(`   earlier ${prior.length === 1 ? 'life' : 'lives'}:`));
    for (const life of prior) {
      const grew = life.lastScore === life.birthDNA ? `${life.birthDNA}%` : `${life.birthDNA}% → ${life.lastScore}%`;
      console.log(dim(`   ${grew}  born ${life.born.slice(0, 10)}, reset ${life.endedAt.slice(0, 10)}  ${life.certificate}`));
    }
  }
  console.log();
}
