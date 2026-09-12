import { findFafFile, readFafRaw, readFaf, readFafFromString, withKernel } from '../interop/faf.js';
import { scoreFafYaml, scoreText } from '../core/scorer.js';
import { typedNoneHints } from '../core/typed-none.js';
import { displayScore } from '../ui/display.js';
import { tierBadge } from '../core/tiers.js';
import { bold } from '../ui/colors.js';

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
  // Parsed first, as every .faf reader does: text that is not valid YAML, or
  // that is a scalar or a list, is the one-line refusal — never the kernel's
  // parse error, never a 0% score. What the kernel itself cannot read is one
  // line too (withKernel).
  readFafFromString(yaml, fafPath);
  // scoreFafYaml short-circuits on about.represents — see core/scorer.ts.
  // About is a repo role, not an app_type.
  const result = withKernel(fafPath, () => scoreFafYaml(yaml));

  if (options.json) {
    // The score snapshot — folded in from the former `faf taf`. The scorer
    // result plus self-describing metadata (project/source/faf_version).
    // Deterministic by design: no timestamp, so the same .faf emits the same JSON.
    const data = readFaf(fafPath);
    const snapshot = {
      faf_version: data.faf_version ?? 'unknown',
      project: data.project?.name ?? 'unknown',
      source: fafPath,
      ...result,
    };
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  if (options.status) {
    // Compact one-liner for CI/scripts. An unknown score has no tier to show.
    console.log(result.unknown ? `— ${bold(scoreText(result))}` : `${tierBadge(result.tier)} ${bold(scoreText(result))}`);
    return;
  }

  // Typed words in a slot — None, N/A, unknown — count as empty: say so
  // under the score, one line per slot (a slot the app-type leaves out: faf
  // auto marks it slotignored). Nothing is written.
  displayScore(result, fafPath, options.verbose, typedNoneHints(yaml, result));
}
