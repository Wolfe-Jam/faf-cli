import { writeFileSync } from 'fs';
import { join } from 'path';
import type { FafData } from '../core/types.js';
import { fafMetaTag } from './claude.js';

/**
 * PLACEHOLDER — grok_rules projection for Grok CLI. Best-guess, UNCONFIRMED.
 *
 * FAF projects one project.faf to every AI rule-file (CLAUDE.md, AGENTS.md,
 * .cursorrules, GEMINI.md — see the sibling interop modules). When Grok CLI's
 * rule-file convention ("grok_rules") is confirmed, this becomes the Nth target:
 * define context once, project it to Grok too. The .faf-is-the-source doctrine
 * landing natively in Grok's ecosystem.
 *
 * UNKNOWNS pending xAI's spec — DO NOT SHIP AS-IS:
 *   - FILENAME:  .grok / grok_rules / .grokrules / GROK.md / .grok/rules ?
 *   - FORMAT:    markdown (assumed here, matching the siblings) or structured?
 *   - LOCATION:  repo root or a .grok/ dir?
 *
 * Mirrors gemini.ts so confirming the spec is a rename + format tweak, not a
 * rebuild. UNWIRED — nothing imports this until the format is known. To activate:
 *   1. confirm the spec with xAI / Grok CLI (G1)
 *   2. set GROK_RULES_FILENAME + adjust generateGrokRules to the real format
 *   3. wire into commands/export.ts + a `faf grok` alias (mirror `faf cursor`)
 *   4. add a faf_grok MCP tool across the fleet (mirror faf_cursor: import/export/sync)
 */

// PLACEHOLDER filename — confirm with xAI before wiring.
const GROK_RULES_FILENAME = 'grok_rules';

/** Generate grok_rules content from .faf data (markdown best-guess; mirrors gemini.ts). */
export function generateGrokRules(data: FafData): string {
  const lines: string[] = [];

  lines.push(fafMetaTag(data));
  lines.push('');
  lines.push(`# grok_rules — ${data.project?.name ?? 'Project'}`);
  lines.push('');
  lines.push('> Auto-generated from project.faf');
  lines.push('');

  if (data.project?.name) lines.push(`Project: ${data.project.name}`);
  if (data.project?.goal) lines.push(`Goal: ${data.project.goal}`);
  if (data.project?.main_language) lines.push(`Language: ${data.project.main_language}`);

  if (data.stack) {
    lines.push('');
    lines.push('## Stack');
    for (const [key, value] of Object.entries(data.stack)) {
      if (value && value !== 'slotignored' && value !== '') {
        lines.push(`- ${key}: ${value}`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

/** Write grok_rules to a directory. PLACEHOLDER filename — confirm with xAI. */
export function writeGrokRules(dir: string, data: FafData): void {
  writeFileSync(join(dir, GROK_RULES_FILENAME), generateGrokRules(data), 'utf-8');
}
