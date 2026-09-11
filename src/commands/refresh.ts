import { lstatSync } from 'fs';
import { dirname, resolve } from 'path';
import { findFafFile, readFafRaw } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import type { ScoreResult } from '../core/types.js';
import { FafDNAManager } from '../core/faf-dna.js';
import { sayWhyDnaIsLeft } from './dna.js';
import * as kernel from '../wasm/kernel.js';
import { SafePathError, safeReplaceOwned } from '../core/safe-write.js';
import { FAFB_MARK, isFafbBytes } from './compile.js';
import { tierBadge } from '../core/tiers.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

/**
 * `faf refresh` — re-ground on the live .faf. The active re-ground primitive.
 *
 * NEW drift logic (root tooling): driven by the xAI/Grok `refresh_faf` need,
 * but it lives in faf-cli root, so every surface inherits it — CLI users, all
 * the MCPs (`refresh_faf`), SDKs, web. Grok-driven, universally banked.
 *
 *   drift → refresh → re-grounded
 *
 * Three things, in order:
 *   1. Re-read the LIVE .faf and re-score it (authoritative — core/scorer).
 *   2. Measure the score-delta vs the last-stamped DNA score (the baseline ground).
 *   3. Keep BOTH tiers current:
 *        - .faf  (YAML, human/AI source)
 *        - .fafb (binary, the FAST queryable tier pushed to Grok — the 412× tier)
 *      If a .fafb exists, re-compile it via the WASM kernel (the Rust→WASM Foundry;
 *      faf-cli orchestrates, Rust authors — `rust-authors-truth`). A re-ground that
 *      left .fafb stale would have the agent querying old binary at full speed.
 *   4. Update the ground (record the re-score on the DNA journey).
 *
 * Distinct from:
 *   - `faf drift`  — mtime sync of context files (.faf ↔ CLAUDE.md/AGENTS.md/…)
 *   - `faf score`  — point-in-time score, no baseline, no re-ground
 *
 * Slot-level "which slot moved" diffing is the MCP/agent enhancement (the agent
 * supplies its loaded baseline content); the CLI re-grounds against the DNA
 * score baseline, which needs no caller state.
 */
export interface RefreshOptions {
  json?: boolean;
}

interface RefreshReport {
  result: ScoreResult;
  known: boolean;
  drifted: boolean;
  delta: number;
  prevScore: number | null | undefined;
  fafbBytes: number | null;
  /** Why an existing .fafb was left as it is (a link out, not a .fafb faf compiled, …). */
  fafbLeft: string | null;
}

/** True when something is at `path` — a file, or a link (even a dangling one). */
function present(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

/** Re-compile the .fafb at `fafbPath` from `yaml` — only over a .fafb faf
 *  compiled, inside the project folder `root` (never through a link that
 *  leaves it or dangles). Returns the bytes written, or why it was left. */
function recompileFafb(fafbPath: string, yaml: string, root: string): { bytes: number | null; left: string | null } {
  const binary = kernel.compile(yaml);
  try {
    safeReplaceOwned(fafbPath, binary, { root, owns: isFafbBytes, mark: FAFB_MARK });
    return { bytes: binary.length, left: null };
  } catch (e) {
    if (e instanceof SafePathError) {return { bytes: null, left: e.message };}
    throw e;
  }
}

/** The text report of `faf refresh`. An unknown score shows no number. */
function printRefresh({ result, known, drifted, delta, prevScore, fafbBytes, fafbLeft }: RefreshReport): void {
  console.log(`${fafCyan('refresh')} ${dim('— re-grounding on the live .faf')}\n`);
  if (!known) {
    console.log(`  score unknown ${dim('— about-repo with no about.source_score; the DNA journey is left as it is')}`);
  } else if (drifted) {
    const arrow = delta > 0 ? '↑' : '↓';
    console.log(
      `  drift: ${dim(`${prevScore}%`)} ${arrow} ${bold(`${result.score}%`)} ${dim(`(${delta > 0 ? '+' : ''}${delta})`)}`,
    );
  } else if (prevScore !== null && prevScore !== undefined) {
    console.log(`  no drift ${dim(`— steady at ${result.score}%`)}`);
  } else {
    console.log(`  baseline set ${dim(`— ${result.score}%`)}`);
  }
  if (fafbBytes !== null) {
    console.log(`  .fafb re-compiled ${dim(`(${fafbBytes} bytes — fast tier current)`)}`);
  }
  if (fafbLeft !== null) {
    console.log(`  .fafb left as it is ${dim(`— ${fafbLeft}`)}`);
  }
  if (known) {console.log(`  re-grounded: ${tierBadge(result.tier)} ${bold(`${result.score}%`)}`);}
}

export function refreshCommand(options: RefreshOptions = {}): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  // 1. Re-read the LIVE .faf and re-score it — the authoritative current ground.
  const yaml = readFafRaw(fafPath);
  const result = scoreFafYaml(yaml);

  // 2. Baseline = the last-stamped DNA score (the ground we measure drift from).
  const dna = new FafDNAManager(process.cwd());
  const baseline = dna.load() ? dna.getBirthDNADisplay() : null;
  const prevScore = baseline ? baseline.current : null;
  // An About Repo with no source_score has no score: nothing to measure drift
  // against, and nothing to record — -1 is a placeholder, not a ground.
  const known = !result.unknown;
  const delta = known && prevScore !== null && prevScore !== undefined ? result.score - prevScore : 0;
  const drifted = known && prevScore !== null && prevScore !== undefined && delta !== 0;

  // 3. Keep the .fafb binary tier current (the 412× tier). Only if one exists —
  //    don't force a binary on YAML-only projects. Rust authors via the kernel.
  //    A .fafb faf did not compile, or one behind a link out of the project,
  //    is left as it is — said in one line — and the re-ground carries on.
  const fafbPath = fafPath.replace(/\.faf$/, '.fafb');
  let fafbBytes: number | null = null;
  let fafbLeft: string | null = null;
  if (present(fafbPath)) {
    ({ bytes: fafbBytes, left: fafbLeft } = recompileFafb(fafbPath, yaml, dirname(resolve(fafPath))));
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          reGrounded: known,
          score: result.score,
          ...(known ? {} : { unknown: true }),
          tier: result.tier,
          baseline: prevScore,
          delta,
          drifted,
          fafb: fafbBytes !== null && fafbBytes !== undefined
            ? { reCompiled: true, bytes: fafbBytes }
            : { reCompiled: false, ...(fafbLeft !== null ? { left: fafbLeft } : {}) },
          journey: dna.getJourney() || null,
        },
        null,
        2,
      ),
    );
  } else {
    printRefresh({ result, known, drifted, delta, prevScore, fafbBytes, fafbLeft });
  }
  if (!known) {return;}

  // 4. Update the ground — the baseline must actually PERSIST, or the next
  //    refresh can never measure drift ("baseline set" must not be a lie).
  //    No DNA yet → birth it with this score (the honest first ground);
  //    DNA exists → record the re-score on the journey (no-op if unchanged).
  if (dna.exists()) {
    dna.recordGrowth(result.score, ['refresh — re-grounded']);
    sayWhyDnaIsLeft(dna); // a .faf-dna faf did not write is left as it is
  } else {
    dna.birth(result.score);
  }
}
