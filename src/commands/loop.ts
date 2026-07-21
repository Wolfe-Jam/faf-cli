import { existsSync } from 'fs';
import { join } from 'path';
import { autoCommand } from './auto.js';
import { readFaf, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { runLoop } from '../core/loop.js';
import type { LoopDeps, LoopRunResult } from '../core/loop.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

/**
 * `faf loop` — drive the .faf to 100%, or to the human wall. Sources everything
 * detection can (auto), then reports exactly what only the human can answer.
 * "100% or ask human": the loop never invents a human slot to reach 100%.
 *
 * Thin wiring over the tested driver (src/core/loop.ts): the deterministic
 * engine decides; this command supplies the real read / score / auto and renders.
 */
export function loopCommand(options: { rounds?: string } = {}): void {
  const dir = process.cwd();
  const fafPath = join(dir, 'project.faf');
  const maxRounds = options.rounds ? Math.max(1, parseInt(options.rounds, 10) || 5) : 5;

  const deps: LoopDeps = {
    // No .faf yet → an EMPTY snapshot (score 0, every slot a gap); the loop's
    // first runAuto then creates + sources it. No special bootstrap path.
    read: () =>
      existsSync(fafPath)
        ? { data: readFaf(fafPath) as Record<string, unknown>, yaml: readFafRaw(fafPath) }
        : { data: {}, yaml: '' },
    score: (yaml) => (yaml ? enrichScore(kernel.score(yaml)).score : 0),
    runAuto: () => autoCommand(),
  };

  renderLoopResult(runLoop(deps, { maxRounds }));
}

function renderLoopResult(r: LoopRunResult): void {
  if (r.history.length > 1) {
    console.log(dim(`\n  climb: ${r.history.join('% → ')}%`));
  }
  console.log('');

  switch (r.status) {
    case 'done':
      console.log(`${fafCyan('done')} — 🏆 100% AI-readiness. The .faf is complete.`);
      break;
    case 'needs-human': {
      const n = r.ask.length;
      console.log(`${bold('Sourced everything detection can.')} ${n} question${n === 1 ? '' : 's'} only you can answer:`);
      for (const a of r.ask) {console.log(`  ${dim('•')} ${a.question}`);}
      console.log(dim(`\n  Answer with ${bold("'faf go'")}, or fill them in project.faf directly.`));
      break;
    }
    case 'stuck':
      console.log(`${bold(`Stopped at ${r.score}%.`)} The remaining gaps need evidence detection couldn't find, and there's nothing only you can answer. Add the missing manifests/README, then re-run.`);
      break;
    case 'capped':
      console.log(`${bold(`Stopped at ${r.score}% after ${r.rounds} rounds (the cap).`)} Re-run ${bold("'faf loop'")} to continue, or raise ${dim('--rounds')}.`);
      break;
    case 'no-faf':
      console.log(`No project.faf, and none could be created here. Run ${bold("'faf init'")} first.`);
      break;
  }
}
