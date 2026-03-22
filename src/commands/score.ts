import { findFafFile, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { tierBadge } from '../core/tiers.js';

export interface ScoreOptions {
  verbose?: boolean;
  status?: boolean;
  json?: boolean;
}

export function scoreCommand(file?: string, options: ScoreOptions = {}): void {
  const fafPath = file ?? findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const yaml = readFafRaw(fafPath);
  const raw = kernel.score(yaml);
  const result = enrichScore(raw);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (options.status) {
    // Compact one-liner for CI/scripts
    console.log(`${tierBadge(result.tier)} ${result.score}%`);
    return;
  }

  displayScore(result, fafPath, options.verbose);
}
