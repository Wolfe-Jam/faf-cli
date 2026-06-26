import { join } from 'path';
import type { FafData } from '../core/types.js';
import { fafMetaTag } from './claude.js';
import { injectFafBlock } from './inject.js';
import { filled, slotLabel } from './labels.js';

/** Generate AGENTS.md content from .faf data */
export function generateAgentsMd(data: FafData): string {
  const lines: string[] = [];

  lines.push(fafMetaTag(data));
  lines.push('');
  lines.push(`# AGENTS.md — ${data.project?.name ?? 'Project'}`);
  lines.push('');
  lines.push('> Auto-generated from project.faf — do not edit directly');
  lines.push('');
  lines.push('## Project Context');
  lines.push('');

  if (data.project?.name) lines.push(`- **Name:** ${data.project.name}`);
  if (data.project?.goal) lines.push(`- **Goal:** ${data.project.goal}`);
  if (data.project?.main_language) lines.push(`- **Language:** ${data.project.main_language}`);

  lines.push('');
  lines.push('## Stack');
  lines.push('');

  if (data.stack) {
    for (const [key, value] of Object.entries(data.stack)) {
      if (filled(value)) {
        lines.push(`- **${slotLabel(`stack.${key}`)}:** ${value.trim()}`);
      }
    }
  }

  if (data.human_context) {
    lines.push('');
    lines.push('## Human Context');
    lines.push('');
    for (const [key, value] of Object.entries(data.human_context)) {
      if (filled(value)) {
        lines.push(`- **${slotLabel(`human_context.${key}`)}:** ${value.trim()}`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

/** Write AGENTS.md — non-destructive: injects/updates the faf block, preserves the rest. */
export function writeAgentsMd(dir: string, data: FafData): void {
  injectFafBlock(join(dir, 'AGENTS.md'), generateAgentsMd(data));
}
