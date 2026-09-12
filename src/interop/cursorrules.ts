import { join } from 'path';
import type { FafData } from '../core/types.js';
import { FAF_CONTEXT_FILES } from '../core/safe-write.js';
import { fafMetaTag } from './claude.js';
import { injectFafBlock } from './inject.js';
import { filled, slotLabel } from './labels.js';

/** Render .cursorrules content from .faf data */
export function renderCursorrules(data: FafData): string {
  const lines: string[] = [];

  lines.push(fafMetaTag(data));
  lines.push('');
  lines.push('# .cursorrules');
  lines.push(`# Authored from project.faf — ${data.project?.name ?? 'Project'}`);
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

  lines.push('');
  return lines.join('\n');
}

/** Write .cursorrules — non-destructive: injects/updates the faf block (hash-comment markers), preserves the rest. */
export function writeCursorrules(dir: string, data: FafData): void {
  injectFafBlock(join(dir, FAF_CONTEXT_FILES.cursorrules), renderCursorrules(data), '# faf:start', '# faf:end');
}
