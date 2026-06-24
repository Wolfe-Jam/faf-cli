import { join } from 'path';
import { mkdirSync } from 'fs';
import type { FafData } from '../core/types.js';
import { fafMetaTag } from './claude.js';
import { injectFafBlock } from './inject.js';

/**
 * Generate `.github/copilot-instructions.md` content from .faf data.
 *
 * This is GitHub Copilot's repository-wide custom-instructions file — the
 * WIDEST-supported instruction surface (web chat, code review, VS Code,
 * JetBrains, Visual Studio, Eclipse, Xcode, Copilot CLI, coding agent), read
 * by default wherever Copilot runs. Same project context as AGENTS.md, written
 * to the file every Copilot surface honors.
 */
export function generateCopilotInstructions(data: FafData): string {
  const lines: string[] = [];

  lines.push(fafMetaTag(data));
  lines.push('');
  lines.push(`# GitHub Copilot Instructions — ${data.project?.name ?? 'Project'}`);
  lines.push('');
  lines.push('> Auto-generated from project.faf — do not edit directly.');
  lines.push('> Copilot reads this on every request made in the context of this repository.');
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
      if (value && value !== 'slotignored' && value !== '') {
        lines.push(`- **${key}:** ${value}`);
      }
    }
  }

  if (data.human_context) {
    lines.push('');
    lines.push('## Human Context');
    lines.push('');
    for (const [key, value] of Object.entries(data.human_context)) {
      if (value && value !== '') {
        lines.push(`- **${key}:** ${value}`);
      }
    }
  }

  lines.push('');
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
