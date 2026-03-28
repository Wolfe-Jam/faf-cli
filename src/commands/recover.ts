import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { findFafFile, readFaf, writeFaf } from '../interop/faf.js';
import { parseClaudeMd } from '../interop/claude.js';
import { fafCyan, dim, bold } from '../ui/colors.js';
import type { FafData } from '../core/types.js';

/** Recover .faf from context files (CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules) */
export function recoverCommand(): void {
  const dir = process.cwd();
  const sources: string[] = [];
  const data: FafData = { faf_version: '3.0', project: {} };

  // Try CLAUDE.md first (richest source)
  const claudePath = join(dir, 'CLAUDE.md');
  if (existsSync(claudePath)) {
    const content = readFileSync(claudePath, 'utf-8');
    const parsed = parseClaudeMd(content);
    if (parsed.project?.name) {data.project!.name = parsed.project.name;}
    if (parsed.project?.goal) {data.project!.goal = parsed.project.goal;}
    if (parsed.project?.main_language) {data.project!.main_language = parsed.project.main_language;}
    sources.push('CLAUDE.md');
  }

  // Try AGENTS.md
  const agentsPath = join(dir, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const content = readFileSync(agentsPath, 'utf-8');
    if (!data.project!.name) {
      const m = content.match(/^#\s+(.+)/m);
      if (m) {data.project!.name = m[1].trim();}
    }
    sources.push('AGENTS.md');
  }

  // Try GEMINI.md
  const geminiPath = join(dir, 'GEMINI.md');
  if (existsSync(geminiPath)) {
    const content = readFileSync(geminiPath, 'utf-8');
    if (!data.project!.name) {
      const m = content.match(/^#\s+(.+)/m);
      if (m) {data.project!.name = m[1].trim();}
    }
    sources.push('GEMINI.md');
  }

  // Try .cursorrules
  const cursorPath = join(dir, '.cursorrules');
  if (existsSync(cursorPath)) {
    sources.push('.cursorrules');
  }

  if (sources.length === 0) {
    console.error('No context files found (CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules).');
    process.exit(2);
  }

  // Merge into existing .faf if present, otherwise create new
  const existing = findFafFile(dir);
  if (existing) {
    const prev = readFaf(existing);
    if (!prev.project) {prev.project = {};}
    if (data.project!.name && !prev.project.name) {prev.project.name = data.project!.name;}
    if (data.project!.goal && !prev.project.goal) {prev.project.goal = data.project!.goal;}
    if (data.project!.main_language && !prev.project.main_language) {prev.project.main_language = data.project!.main_language;}
    writeFaf(existing, prev);
    console.log(`${fafCyan('◆')} recover  merged into ${existing}`);
  } else {
    const outPath = join(dir, 'project.faf');
    writeFaf(outPath, data);
    console.log(`${fafCyan('◆')} recover  created ${outPath}`);
  }

  console.log(dim(`  sources: ${sources.join(', ')}`));
}
