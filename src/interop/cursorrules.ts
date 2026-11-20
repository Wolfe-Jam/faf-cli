import { join } from 'path';
import type { FafData } from '../core/types.js';
import { FAF_CONTEXT_FILES } from '../core/safe-write.js';
import { fafMetaTag } from './claude.js';
import { injectFafBlock } from './inject.js';
import { filled, sixWsFilled, slotLabel } from './labels.js';

/** Render .cursorrules content from .faf data */
export function renderCursorrules(data: FafData, factsRef = 'project.faf'): string {
  const lines: string[] = [];

  lines.push(fafMetaTag(data, { claim: factsRef }));
  lines.push('');
  lines.push('# .cursorrules');
  lines.push(`# Authored from ${factsRef} — ${data.project?.name ?? 'Project'}`);
  lines.push('');

  if (data.project?.main_language) {
    lines.push(`language: ${data.project.main_language}`);
  }

  if (data.stack) {
    lines.push('');
    lines.push('# Stack');
    for (const [key, value] of Object.entries(data.stack)) {
      if (filled(value)) {
        lines.push(`# ${slotLabel(`stack.${key}`)}: ${value.trim()}`);
      }
    }
  }

  // Context — the six W's, as in CLAUDE.md, in this file's comment style.
  const ctx = sixWsFilled(data);
  if (ctx.length > 0) {
    lines.push('');
    lines.push('# Context');
    for (const [label, value] of ctx) {lines.push(`# ${label}: ${value}`);}
  }

  lines.push('');
  return lines.join('\n');
}

/** Write .cursorrules — non-destructive: injects/updates the faf block (hash-comment markers), preserves the rest. */
export function writeCursorrules(dir: string, data: FafData, factsRef = 'project.faf'): void {
  injectFafBlock(join(dir, FAF_CONTEXT_FILES.cursorrules), renderCursorrules(data, factsRef), '# faf:start', '# faf:end');
}
