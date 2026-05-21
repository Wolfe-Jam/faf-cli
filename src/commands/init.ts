import { existsSync } from 'fs';
import { join } from 'path';
import { detectStack } from '../detect/stack.js';
import { writeFaf, readFafRaw } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { FafDNAManager } from '../core/faf-dna.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

export interface InitOptions {
  yolo?: boolean;
  quick?: boolean;
  force?: boolean;
  output?: string;
}

export function initCommand(options: InitOptions = {}): void {
  const dir = process.cwd();
  const outputPath = options.output
    ? (options.output.endsWith('.faf') ? options.output : join(dir, options.output))
    : join(dir, 'project.faf');

  if (existsSync(outputPath) && !options.force) {
    console.error(`project.faf already exists. Use ${bold('--force')} to overwrite.`);
    process.exit(1);
  }

  const data = detectStack(dir);
  writeFaf(outputPath, data);

  const yaml = readFafRaw(outputPath);
  const result = scoreFafYaml(yaml);

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
}
