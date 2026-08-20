import { join } from 'path';
import type { FafData } from '../core/types.js';
import { fafMetaTag } from './claude.js';
import { injectFafBlock } from './inject.js';
import { filled, slotLabel } from './labels.js';

/** A value carrying real content — non-empty, not slotignored, non-empty array. */
const present = (v: unknown): boolean =>
  v !== null && v !== undefined && v !== '' && v !== 'slotignored' && !(Array.isArray(v) && v.length === 0);

/** Stack keys that are context/marketing, not actual stack. Kept out of the Stack section (mirrors agents.ts). */
const NON_STACK = new Set(['target_user', 'core_problem', 'mission_purpose']);

/**
 * Generate GEMINI.md content from .faf data (+ repo enrichment at export).
 *
 * Matches Gemini CLI's own GEMINI.md convention (hierarchical, concatenation-
 * friendly, `@file.md`-importable): commands, key files, and confirmation-
 * required actions — not the AGENTS.md BETTER ladder, which is a different
 * spec for a different reader.
 */
export function generateGeminiMd(data: FafData): string {
  const lines: string[] = [];

  const instant = data.instant_context as { key_files?: string[] } | undefined;
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
    if (/install|deps/.test(n)) {return 0;}
    if (/^build$|build/.test(n) && !/rebuild/.test(n)) {return 1;}
    if (/^dev$|develop/.test(n)) {return 2;}
    if (/^start$|run/.test(n)) {return 3;}
    return 4;
  };
  const setupCmds = [...setupRaw].sort((a, b) => setupRank(a[0]) - setupRank(b[0]) || a[0].localeCompare(b[0]));
  const verifyCmds = [...testCmds, ...lintCmds];

  lines.push(fafMetaTag(data));
  lines.push('');
  lines.push(`# GEMINI.md — ${data.project?.name ?? 'Project'}`);
  lines.push('');
  lines.push('> Authored from project.faf — refresh with `faf export --gemini`.');
  lines.push('');

  if (data.project?.name) {lines.push(`Project: ${data.project.name}`);}
  if (data.project?.goal) {lines.push(`Goal: ${data.project.goal}`);}
  if (data.project?.main_language) {lines.push(`Language: ${data.project.main_language}`);}

  if (setupCmds.length) {
    lines.push('');
    lines.push('## Setup & build');
    lines.push('');
    lines.push('```bash');
    for (const [k, v] of setupCmds) {lines.push(`${v}    # ${k}`);}
    lines.push('```');
  }

  if (verifyCmds.length) {
    lines.push('');
    lines.push('## Test & verify');
    lines.push('');
    lines.push('```bash');
    for (const [, v] of verifyCmds) {lines.push(v);}
    lines.push('```');
  }

  if (keyFiles && keyFiles.length) {
    lines.push('');
    lines.push('## Where things live');
    lines.push('');
    for (const f of keyFiles) {lines.push(`- \`${f}\``);}
  }

  if (data.stack) {
    const stack: string[] = [];
    for (const [key, value] of Object.entries(data.stack)) {
      if (NON_STACK.has(key)) {continue;}
      if (filled(value)) {stack.push(`- ${slotLabel(`stack.${key}`)}: ${value.trim()}`);}
    }
    if (stack.length) {
      lines.push('');
      lines.push('## Stack');
      for (const s of stack) {lines.push(s);}
    }
  }

  // Universal safety default — always renders, same as AGENTS.md's Guardrails.
  lines.push('');
  lines.push('## Before changing things');
  lines.push('');
  lines.push('- Ask first: dependency installs, deletions, migrations, schema changes, publish/release.');
  lines.push('- Never: force-push · push straight to `main` · commit secrets.');

  lines.push('');
  return lines.join('\n');
}

/** Write GEMINI.md — non-destructive: injects/updates the faf block, preserves the rest. */
export function writeGeminiMd(dir: string, data: FafData): void {
  injectFafBlock(join(dir, 'GEMINI.md'), generateGeminiMd(data));
}
