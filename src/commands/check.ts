import { findFafFile, readFaf, readFafRaw } from '../interop/faf.js';
import { validateFaf } from '../core/schema.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

export interface CheckOptions {
  strict?: boolean;
  fix?: boolean;
  doctor?: boolean;
  trust?: boolean;
}

export function checkCommand(file?: string, options: CheckOptions = {}): void {
  const fafPath = file ?? findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const data = readFaf(fafPath);
  const validation = validateFaf(data);

  if (!validation.valid) {
    console.log(`${bold('invalid')} ${fafPath}`);
    for (const err of validation.errors) {
      console.log(`  ${dim('x')} ${err}`);
    }
    process.exit(3);
  }

  const yaml = readFafRaw(fafPath);
  if (!kernel.validate(yaml)) {
    console.log(`${bold('invalid yaml')} ${fafPath}`);
    process.exit(3);
  }

  console.log(`${fafCyan('valid')} ${fafPath}`);

  const result = enrichScore(kernel.score(yaml));
  displayScore(result, fafPath);

  if (options.strict && result.score < 100) {
    console.log(dim('\n  --strict requires 100%'));
    process.exit(1);
  }
}
