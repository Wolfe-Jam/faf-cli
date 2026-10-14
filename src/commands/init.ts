import { existsSync } from 'fs';
import { join } from 'path';
import { assembleFreshFaf } from '../detect/assemble.js';
import { writeFaf, readFafRaw, withKernel } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { FafDNAManager } from '../core/faf-dna.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';
import { assertProjectCwd } from '../core/cwd-guard.js';
import { refuseMissingOutputFolder } from '../core/refusal.js';

export interface InitOptions {
  yolo?: boolean;
  quick?: boolean;
  force?: boolean;
  output?: string;
}

export function initCommand(options: InitOptions = {}): void {
  assertProjectCwd(process.cwd(), 'faf init');
  const dir = process.cwd();
  const outputPath = options.output
    ? (options.output.endsWith('.faf') ? options.output : join(dir, options.output))
    : join(dir, 'project.faf');

  if (existsSync(outputPath) && !options.force) {
    console.error(`project.faf already exists. Use ${bold('--force')} to overwrite.`);
    process.exit(1);
  }
  // An --output folder that is not there is one line: faf does not create it.
  refuseMissingOutputFolder(options.output);

  // Full slot-filling pipeline (shared with `faf auto` + `faf git`).
  const data = assembleFreshFaf(dir);
  // --force is the explicit overwrite: a fresh file, not an update of the old one.
  writeFaf(outputPath, data, { replace: options.force === true });

  const yaml = readFafRaw(outputPath);
  const result = withKernel(outputPath, () => scoreFafYaml(yaml));

  // Birth DNA — the first heartbeat. Records the honest first score (even 0%)
  // in a separate .faf-dna lineage file (keeps the .faf itself clean).
  const dna = new FafDNAManager(dir);
  if (!dna.exists() || options.force) {
    dna.birth(result.score);
  }

  console.log(`${fafCyan('created')} ${outputPath}`);
  displayScore(result, outputPath);
  console.log(dim(`  🧬 Birth DNA ${result.score}% — your journey starts here (faf dna)`));

  if (result.score < 100) {
    console.log(dim(`\n  run ${bold("'faf go'")} to fill empty slots`));
  }
  offerBusinessCard(dir, result.score < 100);
}

/** The business card is the step after project.faf, offered only to a repo
 *  that has none yet. It writes nothing. */
function offerBusinessCard(dir: string, afterHint: boolean): void {
  if (hasBusinessCard(dir)) {return;}
  console.log(dim(`${afterHint ? '' : '\n'}  next: ${bold("'faf card init'")} — your repo's business card`));
}

/** True when the project already has a .fafa: agent.fafa, .fafa or .well-known/fafa. */
function hasBusinessCard(dir: string): boolean {
  return [['agent.fafa'], ['.fafa'], ['.well-known', 'fafa']].some((p) => existsSync(join(dir, ...p)));
}
