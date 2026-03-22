import { writeFileSync } from 'fs';
import { findFafFile, readFaf, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { fafCyan, dim } from '../ui/colors.js';

export interface TafOptions {
  output?: string;
}

/** Generate TAF receipt (Test Archive Format) */
export function tafCommand(options: TafOptions = {}): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const data = readFaf(fafPath);
  const yaml = readFafRaw(fafPath);
  const result = enrichScore(kernel.score(yaml));

  const receipt = {
    taf_version: '1.0.0',
    generated: new Date().toISOString(),
    source: fafPath,
    project: data.project?.name ?? 'unknown',
    faf_version: data.faf_version ?? 'unknown',
    score: result.score,
    tier: result.tier.name,
    populated: result.populated,
    active: result.active,
    total: result.total,
    slots: result.slots,
  };

  const json = JSON.stringify(receipt, null, 2);

  if (options.output) {
    writeFileSync(options.output, json, 'utf-8');
    console.log(`${fafCyan('◆')} taf  receipt written to ${options.output}`);
  } else {
    console.log(json);
  }
}
