import { writeFileSync } from 'fs';
import { join } from 'path';
import type { FafData } from '../core/types.js';

/** Generate GEMINI.md content from .faf data */
export function generateGeminiMd(data: FafData): string {
  const lines: string[] = [];

  lines.push(`# GEMINI.md — ${data.project?.name ?? 'Project'}`);
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

/** Write GEMINI.md to a directory */
export function writeGeminiMd(dir: string, data: FafData): void {
  writeFileSync(join(dir, 'GEMINI.md'), generateGeminiMd(data), 'utf-8');
}
