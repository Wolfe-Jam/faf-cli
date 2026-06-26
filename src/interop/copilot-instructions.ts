import { join } from 'path';
import { mkdirSync } from 'fs';
import type { FafData } from '../core/types.js';
import { fafMetaTag } from './claude.js';
import { injectFafBlock } from './inject.js';
import { filled, slotLabel } from './labels.js';

/**
 * Command slots → the imperative verb that introduces them in "## Build & run".
 * Today the .faf carries `build` (+ `cicd`, handled separately). The rest land
 * with Option B (schema enrichment); the emitter already consumes them, so B is
 * pure data — no emitter rework. Order = the order a contributor runs them.
 */
const COMMAND_VERBS: ReadonlyArray<readonly [string, string]> = [
  ['install', 'Install with'],
  ['build', 'Build with'],
  ['test', 'Test with'],
  ['lint', 'Lint with'],
  ['run', 'Run with'],
  ['start', 'Start with'],
  ['dev', 'Run the dev server with'],
];
const COMMAND_SLOTS = new Set<string>([...COMMAND_VERBS.map(([k]) => k), 'cicd']);

/**
 * Generate `.github/copilot-instructions.md` content from .faf data.
 *
 * GitHub Copilot's repository-wide custom-instructions file — the WIDEST-supported
 * instruction surface (web chat, code review, VS Code, JetBrains, Visual Studio,
 * Eclipse, Xcode, Copilot CLI, coding agent), injected into EVERY request.
 *
 * Built to GitHub's own spec (PLANET-FAF/INTEL/copilot-instructions-spec-2026-06-25.md):
 * short, self-contained, imperative INSTRUCTIONS — not a metadata dump. So we lead
 * with the goal as a prose overview, Title-Case labels (acronym-aware), surface the
 * build/run steps as copy-pasteable commands, keep it compact, and avoid every named
 * anti-pattern (no tone/length rules, no external references). Deliberately NOT a
 * clone of AGENTS.md (which it outranks in-repo) — they are complementary.
 *
 * Strictly faithful to the .faf — nothing invented (GitHub bans speculative,
 * task-specific instructions). Future-proof: the command section + Title-Caser
 * already consume the richer slots Option B will add (test/lint/run, …), so this
 * emitter is built once and grows with the data.
 */
export function generateCopilotInstructions(data: FafData): string {
  const lines: string[] = [];
  const name = data.project?.name ?? 'Project';

  lines.push(fafMetaTag(data));
  lines.push('');
  lines.push(`# GitHub Copilot Instructions — ${name}`);
  lines.push('');
  lines.push(
    '> Generated from project.faf by FAF. Copilot reads these instructions on every request in this repository — keep them short and broadly applicable.',
  );
  lines.push('');

  // Project Overview — the goal as prose (not a `- **Goal:**` bullet).
  if (filled(data.project?.goal)) {
    lines.push(data.project!.goal!.trim());
    lines.push('');
  }

  // Tech stack — Title-Cased (acronym-aware) labels, Language first; command slots below.
  const stack = data.stack ?? {};
  const stackEntries: string[] = [];
  if (filled(data.project?.main_language)) {
    stackEntries.push(`- **Language:** ${data.project!.main_language!.trim()}`);
  }
  for (const [key, val] of Object.entries(stack)) {
    if (COMMAND_SLOTS.has(key)) continue;
    if (filled(val)) stackEntries.push(`- **${slotLabel(`stack.${key}`)}:** ${val.trim()}`);
  }
  if (stackEntries.length > 0) {
    lines.push('## Tech stack', '', ...stackEntries, '');
  }

  // Build & run — surface real commands imperatively (GitHub's highest-value section).
  const cmds: string[] = [];
  for (const [slot, verb] of COMMAND_VERBS) {
    const val = (stack as Record<string, unknown>)[slot];
    if (filled(val)) cmds.push(`- ${verb} \`${val.trim()}\`.`);
  }
  if (filled(stack.cicd)) cmds.push(`- CI runs on ${stack.cicd.trim()}.`);
  if (cmds.length > 0) {
    lines.push('## Build & run', '', ...cmds, '');
  }

  // Project context — the 6Ws, Title-Cased (mirrors CLAUDE.md), as orientation.
  const hc = data.human_context ?? {};
  const sixW: [string, unknown][] = [
    ['who', hc.who], ['what', hc.what], ['why', hc.why],
    ['where', hc.where], ['when', hc.when], ['how', hc.how],
  ];
  const ctx = sixW.filter(([, v]) => filled(v)).map(([k, v]) => `- **${slotLabel(`human_context.${k}`)}:** ${(v as string).trim()}`);
  if (ctx.length > 0) {
    lines.push('## Project context', '', ...ctx, '');
  }

  return lines.join('\n');
}

/**
 * Write `.github/copilot-instructions.md` — non-destructive (injects/updates the
 * faf block, preserves the rest). Creates the `.github/` directory if absent.
 */
export function writeCopilotInstructions(dir: string, data: FafData): void {
  mkdirSync(join(dir, '.github'), { recursive: true });
  injectFafBlock(join(dir, '.github', 'copilot-instructions.md'), generateCopilotInstructions(data));
}
