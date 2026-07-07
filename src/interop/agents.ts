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
 * Generate a best-in-class AGENTS.md from .faf data — "The AGENTS.md Edition".
 *
 * Emits the definitive section set by PROJECTING slots the .faf carries plus a
 * few safe defaults. Deterministic projection from curated TRUTH — facts, not
 * hallucinated prose, not filler imperatives (the Gloaguen finding penalises
 * bloat). An absent slot omits its section; nothing is invented.
 *
 * Design spec: DRAFTS/best-agents-md-definitive-spec-2026-07-06.md
 */
export function generateAgentsMd(data: FafData): string {
  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  // Slot blocks — some typed on FafData, others ride the index signature.
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
  // `check` already covers `typecheck` (substring), so it's not listed separately.
  const testCmds = entries.filter(([k]) => /test/i.test(k));
  const lintCmds = entries.filter(([k]) => /lint|check/i.test(k) && !/test/i.test(k));
  // Setup = install/build/dev/run — not test or lint (verification → Tests / Definition of Done).
  const setupCmds = entries.filter(([k]) => !/test|lint|check/i.test(k));

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
  push('> Auto-generated — do not edit directly; regenerate with `faf export --agents`.');
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

  // §3 Run the tests — the truth-check
  if (testCmds.length) {
    push('## Run the tests');
    push();
    push('```bash');
    for (const [, v] of testCmds) push(v);
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

  // §6 Guardrails — project-specific facts first (the gold), then tight Ask-first / Never
  const warnings = (ai?.warnings ?? []).filter((w) => present(w));
  push('## Guardrails');
  push();
  for (const w of warnings) push(`- ${w}`);
  push('- **Ask first:** dependency installs, deletions, migrations, schema changes.');
  push('- **Never:** force-push, push to `main`, commit secrets.');
  push();

  // §7 Definition of Done — composed from the detected verification commands
  const dod: string[] = [];
  for (const [, v] of lintCmds) dod.push(`\`${v}\` exits 0`);
  for (const [, v] of testCmds) dod.push(`\`${v}\` passes`);
  dod.push('changes committed with a conventional message');
  push('## Definition of Done');
  push();
  push(`Done when: ${[...new Set(dod)].join(' · ')}.`); // dedupe: identical gates collapse to one
  push();

  // §8 Security & secrets — rendered when detected (never the values)
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

  // §9 Commit & PR
  if (prefs && present(prefs.commit_style)) {
    push('## Commit & PR');
    push();
    push(`- Commit style: ${fmtVal(prefs.commit_style)}`);
    push('- Branch off `main`; never commit to `main` directly.');
    push();
  }

  // Stack (reference) — actual stack only; context/marketing keys excluded
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

  // Human Context (the who/why — lean background, kept last).
  // NOTE (future): the one section without a length cap — a verbose .faf could
  // sneak bloat back in here. The fix is upstream authoring/lint (the 4-6-word
  // rule), NOT truncating curated content in the generator.
  if (data.human_context) {
    const hc: string[] = [];
    for (const [key, value] of Object.entries(data.human_context)) {
      if (filled(value)) hc.push(`- **${slotLabel(`human_context.${key}`)}:** ${value.trim()}`);
    }
    if (hc.length) {
      push('## Human Context');
      push();
      for (const h of hc) push(h);
      push();
    }
  }

  // Footer — freshness marker (deterministic: from the .faf's generated stamp)
  const gen = data.generated;
  if (present(gen)) push(`*Context generated: ${String(gen)}*`);

  return lines.join('\n');
}

/** Write AGENTS.md — non-destructive: injects/updates the faf block, preserves the rest. */
export function writeAgentsMd(dir: string, data: FafData): void {
  injectFafBlock(join(dir, 'AGENTS.md'), generateAgentsMd(data));
}
