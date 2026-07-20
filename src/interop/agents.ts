import { join } from 'path';
import type { FafData } from '../core/types.js';
import { fafMetaTag } from './claude.js';
import { injectFafBlock } from './inject.js';
import { filled, slotLabel, titleLabel } from './labels.js';

/** A value carrying real content — non-empty, not slotignored, non-empty array. */
const present = (v: unknown): boolean =>
  v != null && v !== '' && v !== 'slotignored' && !(Array.isArray(v) && v.length === 0);

/** Render a slot value for inline display (arrays → comma list). */
const fmtVal = (v: unknown): string => (Array.isArray(v) ? v.join(', ') : String(v));

/** Preference keys that describe human↔assistant interaction, NOT repo conventions. Excluded from AGENTS.md. */
const HUMAN_PREF = new Set([
  'commit_style', 'communication', 'response_style', 'explanation_level', 'explanations', 'documentation', 'code_first',
]);

/** Stack keys that are context/marketing, not actual stack. Kept out of the Stack section. */
const NON_STACK = new Set(['target_user', 'core_problem', 'mission_purpose']);

/**
 * Author a BETTER-shaped AGENTS.md from .faf data (+ repo enrichment at export).
 *
 * Deterministic projection from curated TRUTH — facts, not hallucinated prose
 * (Gloaguen: LLM freewrite hurts). Sections: orientation · setup · verify ·
 * map · conventions · three-tier guardrails · DoD · when stuck · security ·
 * commit. Human Context (who/why marketing) is intentionally omitted — that
 * belongs in README / project.faf, not agent ops.
 *
 * Design: BETTER guide + hand exemplar (faf-cli AGENTS.md) + agents-md-facts.
 */
export function generateAgentsMd(data: FafData): string {
  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  const ai = data.ai_instructions as
    | { warnings?: string[]; working_style?: Record<string, unknown> }
    | undefined;
  const prefs = data.preferences as Record<string, unknown> | undefined;
  const instant = data.instant_context as { key_files?: string[] } | undefined;
  const security = data.security as
    | { secrets?: string; example?: string; never?: string[] }
    | undefined;
  const commands = data.commands;
  const keyFiles = data.key_files ?? instant?.key_files;

  const entries = commands ? Object.entries(commands).filter(([, v]) => present(v)) : [];
  // Mutually exclusive so a key like `test:check` classifies ONCE (as a test).
  const testCmds = entries.filter(([k]) => /test/i.test(k));
  const lintCmds = entries.filter(([k]) => /lint|check/i.test(k) && !/test/i.test(k));
  const setupRaw = entries.filter(([k]) => !/test|lint|check/i.test(k));
  // Stable setup order: install → build → dev → start → other (enrich merge order is nondeterministic)
  const setupRank = (k: string): number => {
    const n = k.toLowerCase();
    if (/install|deps/.test(n)) return 0;
    if (/^build$|build/.test(n) && !/rebuild/.test(n)) return 1;
    if (/^dev$|develop/.test(n)) return 2;
    if (/^start$|run/.test(n)) return 3;
    return 4;
  };
  const setupCmds = [...setupRaw].sort((a, b) => setupRank(a[0]) - setupRank(b[0]) || a[0].localeCompare(b[0]));
  // Verify bar: tests first, then lint/typecheck (matches BETTER / agents-md-facts)
  const verifyCmds = [...testCmds, ...lintCmds];
  const testCmd = testCmds[0]?.[1];
  const buildCmd = setupCmds.find(([k]) => /build/i.test(k))?.[1];

  push(fafMetaTag(data));
  push();
  push(`# AGENTS.md — ${data.project?.name ?? 'Project'}`);
  push();

  // §1 Orientation — one line: what it is · language · type · version
  const bits: string[] = [];
  if (data.project?.main_language) bits.push(String(data.project.main_language));
  if (present(data.project?.type)) bits.push(`type: ${String(data.project?.type)}`);
  if (present(data.project?.version)) bits.push(`v${String(data.project?.version)}`);
  let orientation = data.project?.goal ? String(data.project.goal) : '';
  if (bits.length) orientation += (orientation ? ' — ' : '') + bits.join(' · ');
  if (orientation) {
    push(orientation);
    push();
  }
  push('> Authored by faf — do not edit the managed block; refresh with `faf export --agents`. Hand content outside `<!-- faf:start -->` … `<!-- faf:end -->` is preserved.');
  push();

  // §2 Setup & build
  if (setupCmds.length) {
    push('## Setup & build');
    push();
    push('```bash');
    for (const [k, v] of setupCmds) push(`${v}    # ${k}`);
    push('```');
    push();
  }

  // §3 Run the tests — verify bar (tests + lint/typecheck)
  if (verifyCmds.length) {
    push('## Run the tests');
    push();
    push('```bash');
    for (const [, v] of verifyCmds) push(v);
    push('```');
    push();
  }

  // §4 Where things live
  if (keyFiles && keyFiles.length) {
    push('## Where things live');
    push();
    for (const f of keyFiles) push(`- \`${f}\``);
    push();
  }

  // §5 Conventions — real repo constraints only (human↔assistant prefs excluded)
  const conventions = new Map<string, string>();
  const collect = (obj: Record<string, unknown> | undefined) => {
    if (!obj) return;
    for (const [k, v] of Object.entries(obj)) {
      if (HUMAN_PREF.has(k) || !present(v)) continue;
      const label = titleLabel(k);
      if (!conventions.has(label)) conventions.set(label, fmtVal(v));
    }
  };
  collect(ai?.working_style);
  collect(prefs);
  const detectedConv = (data.conventions as string[] | undefined) ?? [];
  if (conventions.size || detectedConv.length) {
    push('## Conventions');
    push();
    for (const [label, val] of conventions) push(`- **${label}:** ${val}`);
    for (const c of detectedConv) if (present(c)) push(`- ${c}`);
    push();
  }

  // §6 Guardrails — Always / Ask first / Never (three-tier BETTER)
  const warnings = (ai?.warnings ?? []).filter((w) => present(w));
  const always: string[] = ['read the tree'];
  if (testCmd) always.push(`run the tests (\`${testCmd}\`)`);
  if (buildCmd) always.push('build the project');
  for (const [, v] of lintCmds.slice(0, 1)) always.push(`\`${v}\``);

  push('## Guardrails');
  push();
  for (const w of warnings) push(`- ${w}`);
  push(`- **Always OK:** ${[...new Set(always)].join(' · ')}.`);
  push('- **Ask first:** dependency installs, deletions, migrations, schema changes, publish/release.');
  // Enable-then-restrict: safe path first, then the landmine
  push('- **Never:** force-push · push straight to `main` (branch and open a PR) · commit secrets.');
  push();

  // §7 Definition of Done
  const dod: string[] = [];
  for (const [, v] of lintCmds) dod.push(`\`${v}\` exits 0`);
  for (const [, v] of testCmds) dod.push(`\`${v}\` passes`);
  dod.push('changes committed with a conventional message');
  push('## Definition of Done');
  push();
  push(`Done when: ${[...new Set(dod)].join(' · ')}.`);
  push();

  // §8 When stuck — static BETTER default (cheap, high value)
  push('## When stuck');
  push();
  push(
    'Ask a clarifying question, propose a short plan, or open a draft PR with notes — do not push large speculative changes to `main`.',
  );
  push();

  // §9 Security & secrets — when detected (never the values)
  if (security && (present(security.secrets) || (security.never ?? []).length)) {
    push('## Security & secrets');
    push();
    if (present(security.secrets)) {
      const ex = present(security.example) ? ` (see \`${security.example}\`)` : '';
      push(`- Secrets live in \`${security.secrets}\`${ex}. Never read or commit them.`);
    }
    for (const n of security.never ?? []) if (present(n)) push(`- Never read or commit \`${n}\`.`);
    push();
  }

  // §10 Commit & PR — always (defaults + optional commit_style)
  push('## Commit & PR');
  push();
  if (prefs && present(prefs.commit_style)) {
    push(`- Commit style: ${fmtVal(prefs.commit_style)}`);
  } else {
    push('- Conventional Commits preferred (`feat:`, `fix:`, `chore:`, …).');
  }
  push('- Branch off `main` and open a PR — never commit to `main` directly.');
  push('- If build/test scripts or layout change, refresh this file in the **same PR** (`faf export --agents`).');
  push();

  // Stack (reference) — actual stack only; omit empty / all-slotignored noise
  if (data.stack) {
    const stack: string[] = [];
    for (const [key, value] of Object.entries(data.stack)) {
      if (NON_STACK.has(key)) continue;
      if (filled(value)) stack.push(`- **${slotLabel(`stack.${key}`)}:** ${value.trim()}`);
    }
    if (stack.length) {
      push('## Stack');
      push();
      for (const s of stack) push(s);
      push();
    }
  }

  // No Human Context section — who/why marketing is README / .faf DNA, not agent ops (BETTER).

  const gen = data.generated;
  if (present(gen)) push(`*Context authored: ${String(gen)}*`);

  return lines.join('\n');
}

/** Write AGENTS.md — non-destructive: injects/updates the faf block, preserves the rest. */
export function writeAgentsMd(dir: string, data: FafData): void {
  injectFafBlock(join(dir, 'AGENTS.md'), generateAgentsMd(data));
}
