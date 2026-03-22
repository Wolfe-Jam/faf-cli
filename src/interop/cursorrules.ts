import { writeFileSync } from 'fs';
import { join } from 'path';
import type { FafData } from '../core/types.js';

/** Generate .cursorrules content from .faf data */
export function generateCursorrules(data: FafData): string {
  const lines: string[] = [];

  lines.push('# .cursorrules');
  lines.push(`# Auto-generated from project.faf — ${data.project?.name ?? 'Project'}`);
  lines.push('');

  if (data.project?.main_language) {
    lines.push(`language: ${data.project.main_language}`);
  }

  if (data.stack) {
    lines.push('');
    lines.push('# Stack');
    for (const [key, value] of Object.entries(data.stack)) {
      if (value && value !== 'slotignored' && value !== '') {
        lines.push(`# ${key}: ${value}`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

/** Write .cursorrules to a directory */
export function writeCursorrules(dir: string, data: FafData): void {
  writeFileSync(join(dir, '.cursorrules'), generateCursorrules(data), 'utf-8');
}
