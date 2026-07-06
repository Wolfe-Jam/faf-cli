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

/**
 * Generate AGENTS.md content from .faf data.
 *
 * Renders the actionable sections a good AGENTS.md needs (setup/build, tests,
 * where-things-live, conventions, commit rules, guardrails) by PROJECTING slots
 * the .faf already carries — `commands`, `key_files`, `ai_instructions`,
 * `preferences`. No section is invented; an absent slot simply omits its section.
 */
export function generateAgentsMd(data: FafData): string {
  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  // Slot blocks used below — some typed on FafData, others ride the index signature.
  const ai = data.ai_instructions as
    | { warnings?: string[]; working_style?: Record<string, unknown> }
    | undefined;
  const prefs = data.preferences as Record<string, unknown> | undefined;
  const instant = data.instant_context as { key_files?: string[] } | undefined;
  const commands = data.commands;
  const keyFiles = data.key_files ?? instant?.key_files;

  push(fafMetaTag(data));
  push();
  push(`# AGENTS.md — ${data.project?.name ?? 'Project'}`);
  push();
  push('> Auto-generated from project.faf — do not edit directly');
  push();

  // Orientation
  push('## Project Context');
  push();
  if (data.project?.name) push(`- **Name:** ${data.project.name}`);
  if (data.project?.goal) push(`- **Goal:** ${data.project.goal}`);
  if (data.project?.main_language) push(`- **Language:** ${data.project.main_language}`);
  push();

  // Setup / build / test commands — the actionable core (rendered when authored)
  if (commands && Object.keys(commands).length > 0) {
    const entries = Object.entries(commands).filter(([, v]) => present(v));
    const tests = entries.filter(([k]) => /test/i.test(k));
    const setup = entries.filter(([k]) => !/test/i.test(k));
    if (setup.length) {
      push('## Setup & build');
      push();
      push('```bash');
      for (const [k, v] of setup) push(`${v}    # ${k}`);
      push('```');
      push();
    }
    if (tests.length) {
      push('## Run the tests — how you verify your work');
      push();
      push('```bash');
      for (const [, v] of tests) push(v);
      push('```');
      push();
    }
  }

  // Where things live
  if (keyFiles && keyFiles.length > 0) {
    push('## Where things live');
    push();
    for (const f of keyFiles) push(`- \`${f}\``);
    push();
  }

  // Conventions — working_style + preferences, deduped by label (commit_style → its own section)
  const conventions = new Map<string, string>();
  const collect = (obj: Record<string, unknown> | undefined, skip: string[] = []) => {
    if (!obj) return;
    for (const [k, v] of Object.entries(obj)) {
      if (skip.includes(k) || !present(v)) continue;
      const label = titleLabel(k);
      if (!conventions.has(label)) conventions.set(label, fmtVal(v));
    }
  };
  collect(ai?.working_style);
  collect(prefs, ['commit_style']);
  if (conventions.size > 0) {
    push('## Conventions');
    push();
    for (const [label, val] of conventions) push(`- **${label}:** ${val}`);
    push();
  }

  // Commit & PR
  if (prefs && present(prefs.commit_style)) {
    push('## Commit & PR');
    push();
    push(`- **Commit style:** ${fmtVal(prefs.commit_style)}`);
    push();
  }

  // Guardrails — do NOT
  if (ai?.warnings && ai.warnings.length > 0) {
    const guards = ai.warnings.filter((w) => present(w));
    if (guards.length) {
      push('## Guardrails — do NOT');
      push();
      for (const w of guards) push(`- ${w}`);
      push();
    }
  }

  // Stack (reference)
  if (data.stack) {
    const stack: string[] = [];
    for (const [key, value] of Object.entries(data.stack)) {
      if (filled(value)) stack.push(`- **${slotLabel(`stack.${key}`)}:** ${value.trim()}`);
    }
    if (stack.length) {
      push('## Stack');
      push();
      for (const s of stack) push(s);
      push();
    }
  }

  // Human Context (the who/why — background, kept last after the actionable sections)
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

  return lines.join('\n');
}

/** Write AGENTS.md — non-destructive: injects/updates the faf block, preserves the rest. */
export function writeAgentsMd(dir: string, data: FafData): void {
  injectFafBlock(join(dir, 'AGENTS.md'), generateAgentsMd(data));
}
