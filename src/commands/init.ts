import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { assembleFreshFaf } from '../detect/assemble.js';
import { writeFaf, readFafRaw, withKernel } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { FafDNAManager } from '../core/faf-dna.js';
import { dnaGitignoreWarning } from '../core/dna-gitignore.js';
import { commitHint } from '../core/birth-commit.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';
import { assertProjectCwd } from '../core/cwd-guard.js';
import { refuseMissingOutputFolder } from '../core/refusal.js';
import { suggestionNote } from '../core/suggest.js';

export interface InitOptions {
  force?: boolean;
  new?: boolean;
  output?: string;
}

export function initCommand(options: InitOptions = {}): void {
  assertProjectCwd(process.cwd(), 'faf init');
  const dir = process.cwd();
  const outputPath = options.output
    ? (options.output.endsWith('.faf') ? options.output : join(dir, options.output))
    : join(dir, 'project.faf');

  const replace = options.force === true || options.new === true;
  if (existsSync(outputPath) && !replace) {
    console.error(`project.faf already exists. Use ${bold('--new')} for a fresh one; .faf-dna is kept as it is.`);
    process.exit(1);
  }
  // An --output folder that is not there is one line: faf does not create it.
  refuseMissingOutputFolder(options.output);

  // Full slot-filling pipeline (shared with `faf auto` + `faf git`).
  const data = assembleFreshFaf(dir);
  // --new and --force are the explicit overwrite: a fresh file, not an update of the old one.
  // Neither touches .faf-dna: --force no longer starts a new birth.
  writeFaf(outputPath, data, { replace });

  const yaml = readFafRaw(outputPath);
  const result = withKernel(outputPath, () => scoreFafYaml(yaml));

  // Birth DNA — the first heartbeat. Records the honest first score (even 0%)
  // in a separate .faf-dna lineage file (keeps the .faf itself clean).
  // A .faf-dna that is there is the birth certificate: written once, never
  // replaced. faf births only when there is none. It sits beside the .faf it
  // belongs to (--output sub/x.faf → sub/.faf-dna), where faf edit and faf go
  // look for it.
  const dnaDir = dirname(resolve(outputPath));
  const dna = new FafDNAManager(dnaDir);
  const born = !dna.exists();
  if (born) {
    dna.birth(result.score);
  }

  console.log(`${fafCyan('created')} ${outputPath}`);
  displayScore(result, outputPath);
  console.log(dim(born
    ? `  🧬 Birth DNA ${result.score}% — your journey starts here (faf dna)`
    : '  🧬 .faf-dna kept as it is — your birth certificate (faf dna)'));
  sayAfterBirth(dnaDir, born, options.force === true);

  // The goal and the six W's are the human's: init suggests, `faf go` confirms.
  const note = suggestionNote(dir, data);
  if (note) {console.log(dim(`\n  ${note}`));}
  if (result.score < 100) {
    console.log(dim(`${note ? '' : '\n'}  run ${bold("'faf go'")} to fill empty slots`));
  }
  offerBusinessCard(dir, result.score < 100);
}

/** After the birth line: the --force note when a certificate was kept, the
 *  gitignore warning, and the commit hint after a new birth. */
function sayAfterBirth(dir: string, born: boolean, force: boolean): void {
  if (!born && force) {
    console.error(`faf: ${bold('--force')} no longer starts a new birth: the birth certificate is written once. project.faf was replaced, as ${bold('--new')} does.`);
  }
  const ignored = dnaGitignoreWarning(dir);
  if (ignored) {console.error(`faf: ${ignored}`);}
  const hint = born ? commitHint(dir) : null;
  if (hint) {console.log(dim(`  ${hint}`));}
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
