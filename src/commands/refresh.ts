import { existsSync, writeFileSync } from 'fs';
import { findFafFile, readFafRaw } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { FafDNAManager } from '../core/faf-dna.js';
import * as kernel from '../wasm/kernel.js';
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
  const delta = prevScore != null ? result.score - prevScore : 0;
  const drifted = prevScore != null && delta !== 0;

  // 3. Keep the .fafb binary tier current (the 412× tier). Only if one exists —
  //    don't force a binary on YAML-only projects. Rust authors via the kernel.
  const fafbPath = fafPath.replace(/\.faf$/, '.fafb');
  let fafbBytes: number | null = null;
  if (existsSync(fafbPath)) {
    const binary = kernel.compile(yaml);
    writeFileSync(fafbPath, binary);
    fafbBytes = binary.length;
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          reGrounded: true,
          score: result.score,
          tier: result.tier,
          baseline: prevScore,
          delta,
          drifted,
          fafb: fafbBytes != null ? { reCompiled: true, bytes: fafbBytes } : { reCompiled: false },
          journey: dna.getJourney() || null,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`${fafCyan('refresh')} ${dim('— re-grounding on the live .faf')}\n`);
    if (drifted) {
      const arrow = delta > 0 ? '↑' : '↓';
      console.log(
        `  drift: ${dim(`${prevScore}%`)} ${arrow} ${bold(`${result.score}%`)} ${dim(`(${delta > 0 ? '+' : ''}${delta})`)}`,
      );
    } else if (prevScore != null) {
      console.log(`  no drift ${dim(`— steady at ${result.score}%`)}`);
    } else {
      console.log(`  baseline set ${dim(`— ${result.score}%`)}`);
    }
    if (fafbBytes != null) {
      console.log(`  .fafb re-compiled ${dim(`(${fafbBytes} bytes — fast tier current)`)}`);
    }
    console.log(`  re-grounded: ${tierBadge(result.tier)} ${bold(`${result.score}%`)}`);
  }

  // 4. Update the ground — the baseline must actually PERSIST, or the next
  //    refresh can never measure drift ("baseline set" must not be a lie).
  //    No DNA yet → birth it with this score (the honest first ground);
  //    DNA exists → record the re-score on the journey (no-op if unchanged).
  if (dna.exists()) {
    dna.recordGrowth(result.score, ['refresh — re-grounded']);
  } else {
    dna.birth(result.score);
  }
}
