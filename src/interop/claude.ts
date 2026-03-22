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

/** Generate CLAUDE.md content from .faf data */
export function generateClaudeMd(data: FafData): string {
  const lines: string[] = [];

  lines.push(`# 🏎️ CLAUDE.md - ${data.project?.name ?? 'Project'} Persistent Context & Intelligence`);
  lines.push('');
  lines.push('## PROJECT STATE: GOOD 🚀');
  lines.push(`**Current Position:** ${data.project?.goal ?? 'Project context'}`);
  lines.push('**Tyre Compound:** ULTRASOFT C5 (Maximum Performance)');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 🎨 CORE CONTEXT');
  lines.push('');
  lines.push('### Project Identity');
  lines.push(`- **Name:** ${data.project?.name ?? ''}`);

  // Build stack string
  const stackParts: string[] = [];
  if (data.stack?.frontend && data.stack.frontend !== 'slotignored') stackParts.push(String(data.stack.frontend));
  if (data.project?.main_language) stackParts.push(String(data.project.main_language));
  if (data.stack?.build && data.stack.build !== 'slotignored') stackParts.push(String(data.stack.build));
  if (data.stack?.hosting && data.stack.hosting !== 'slotignored') stackParts.push(String(data.stack.hosting));
  if (data.stack?.runtime && data.stack.runtime !== 'slotignored') stackParts.push(String(data.stack.runtime));
  lines.push(`- **Stack:** ${stackParts.join('/') || data.project?.main_language || ''}`);
  lines.push('- **Quality:** F1-INSPIRED (Championship Performance)');
  lines.push('');

  lines.push('### Technical Architecture');
  lines.push(`- **What Building:** ${data.project?.goal ?? ''}`);
  lines.push(`- **Main Language:** ${data.project?.main_language ?? ''}`);
  lines.push('');

  lines.push('### 📊 Context Quality Status');
  lines.push('- **Overall Assessment:** Good');
  lines.push(`- **Last Updated:** ${new Date().toISOString().split('T')[0]}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`**${SYNC_MARKER} 🔗 - Synchronized with .faf context!**`);
  lines.push('');
  lines.push(`*Last Sync: ${new Date().toISOString()}*`);
  lines.push('*Sync Engine: F1-Inspired Software Engineering*');
  lines.push('*🏎️⚡️_championship_sync*');
  lines.push('');

  return lines.join('\n');
}

/** Extract project data from CLAUDE.md content (pull direction) */
export function parseClaudeMd(content: string): Partial<FafData> {
  const data: Partial<FafData> = { project: {} };

  // Extract name
  const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/);
  if (nameMatch) data.project!.name = nameMatch[1].trim();

  // Extract goal
  const goalMatch = content.match(/\*\*What Building:\*\*\s*(.+)/);
  if (goalMatch) data.project!.goal = goalMatch[1].trim();

  // Extract language
  const langMatch = content.match(/\*\*Main Language:\*\*\s*(.+)/);
  if (langMatch) data.project!.main_language = langMatch[1].trim();

  return data;
}
