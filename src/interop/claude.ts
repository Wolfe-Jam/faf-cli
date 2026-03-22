import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import type { FafData } from '../core/types.js';

const CLAUDE_MD = 'CLAUDE.md';
const SYNC_MARKER = 'STATUS: BI-SYNC ACTIVE';

/** Read CLAUDE.md from a directory */
export function readClaudeMd(dir: string): string | null {
  const path = join(dir, CLAUDE_MD);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

/** Write CLAUDE.md with bi-sync footer */
export function writeClaudeMd(dir: string, content: string): void {
  const path = join(dir, CLAUDE_MD);
  writeFileSync(path, content, 'utf-8');
}

/** Get mtime of CLAUDE.md */
export function claudeMdMtime(dir: string): number | null {
  const path = join(dir, CLAUDE_MD);
  if (!existsSync(path)) return null;
  return statSync(path).mtimeMs;
}

/** Build the faf meta tag — one-line project DNA for any md */
export function fafMetaTag(data: FafData): string {
  const parts = [data.project?.name, data.project?.main_language, data.project?.goal]
    .filter(Boolean)
    .map(s => String(s).trim());
  return `<!-- faf: ${parts.join(' | ')} -->`;
}

/** Generate CLAUDE.md content from .faf data */
export function generateClaudeMd(data: FafData): string {
  const lines: string[] = [];
  const name = data.project?.name ?? 'Project';
  const lang = data.project?.main_language ?? '';
  const goal = data.project?.goal ?? '';

  // Meta tag — project DNA, invisible to renderers, visible to AI
  lines.push(fafMetaTag(data));
  lines.push('');

  // Title
  lines.push(`# CLAUDE.md — ${name}`);
  lines.push('');

  // What This Is
  if (goal) {
    lines.push('## What This Is');
    lines.push('');
    lines.push(goal);
    lines.push('');
  }

  // Stack — only non-ignored slots
  const stack = data.stack ?? {};
  const stackEntries: string[] = [];
  if (lang) stackEntries.push(`**Language:** ${lang}`);
  for (const [key, val] of Object.entries(stack)) {
    if (val && val !== 'slotignored' && String(val).trim()) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      stackEntries.push(`**${label}:** ${val}`);
    }
  }
  if (stackEntries.length > 0) {
    lines.push('## Stack');
    lines.push('');
    for (const entry of stackEntries) {
      lines.push(`- ${entry}`);
    }
    lines.push('');
  }

  // Context — from human_context (the 6Ws)
  const hc = data.human_context ?? {};
  const contextEntries: [string, string][] = [
    ['Who', hc.who], ['What', hc.what], ['Why', hc.why],
    ['Where', hc.where], ['When', hc.when], ['How', hc.how],
  ].filter(([_, v]) => v && String(v).trim()) as [string, string][];

  if (contextEntries.length > 0) {
    lines.push('## Context');
    lines.push('');
    for (const [label, val] of contextEntries) {
      lines.push(`- **${label}:** ${val}`);
    }
    lines.push('');
  }

  // Sync footer
  lines.push('---');
  lines.push('');
  lines.push(`*${SYNC_MARKER} — ${new Date().toISOString()}*`);
  lines.push('');

  return lines.join('\n');
}

/** Extract project data from CLAUDE.md content (pull direction) */
export function parseClaudeMd(content: string): Partial<FafData> {
  const data: Partial<FafData> = { project: {} };

  // New format: "# CLAUDE.md — project-name"
  const titleMatch = content.match(/^# CLAUDE\.md\s*[—–-]\s*(.+)$/m);
  if (titleMatch) data.project!.name = titleMatch[1].trim();

  // Old format fallback: "**Name:** value"
  if (!data.project!.name) {
    const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/);
    if (nameMatch) data.project!.name = nameMatch[1].trim();
  }

  // New format: paragraph after "## What This Is"
  const whatMatch = content.match(/## What This Is\s*\n\s*\n(.+)/);
  if (whatMatch) data.project!.goal = whatMatch[1].trim();

  // Old format fallback: "**What Building:** value"
  if (!data.project!.goal) {
    const goalMatch = content.match(/\*\*What Building:\*\*\s*(.+)/);
    if (goalMatch) data.project!.goal = goalMatch[1].trim();
  }

  // New format: "**Language:** value" under Stack
  const langMatch = content.match(/\*\*Language:\*\*\s*(.+)/);
  if (langMatch) data.project!.main_language = langMatch[1].trim();

  // Old format fallback: "**Main Language:** value"
  if (!data.project!.main_language) {
    const oldLangMatch = content.match(/\*\*Main Language:\*\*\s*(.+)/);
    if (oldLangMatch) data.project!.main_language = oldLangMatch[1].trim();
  }

  return data;
}
