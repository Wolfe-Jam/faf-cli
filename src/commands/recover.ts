import { existsSync, lstatSync } from 'fs';
import { join } from 'path';
import { aliasKeptNote, findFafFile, readFaf, writeFaf } from '../interop/faf.js';
import { parseClaudeMd } from '../interop/claude.js';
import { SafePathError, readUtf8, resolveInside } from '../core/safe-write.js';
import { oneLine } from '../core/refusal.js';
import { fafCyan, dim, bold } from '../ui/colors.js';
import type { FafData } from '../core/types.js';
import { FAF_VERSION } from '../core/version.js';

/** True when something is at `path` — a file, or a link (even a dangling one). */
function present(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

/** A context file to recover from, read the way faf reads project context:
 *  inside the project only (a link must stay in it and end at a .faf/.fafm
 *  file — never ~/.aws/credentials behind an AGENTS.md link) and strictly as
 *  UTF-8 (a cp1252 file is never turned into U+FFFD). null when it is not
 *  there, or when it is refused — the refusal is printed as its one line and
 *  the file is skipped as a source. */
function readSource(dir: string, name: string, refused: string[]): string | null {
  if (!present(join(dir, name))) {return null;}
  try {
    return readUtf8(resolveInside(dir, name, { read: true }));
  } catch (e) {
    if (!(e instanceof SafePathError)) {throw e;}
    console.error(oneLine(e, false));
    refused.push(name);
    return null;
  }
}

/** Recover .faf from context files (CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules) */
export function recoverCommand(): void {
  const dir = process.cwd();
  const sources: string[] = [];
  const refused: string[] = [];
  const data: FafData = { faf_version: FAF_VERSION, project: {} };

  // Try CLAUDE.md first (richest source)
  const claude = readSource(dir, 'CLAUDE.md', refused);
  if (claude !== null) {
    const parsed = parseClaudeMd(claude);
    if (parsed.project?.name) {data.project!.name = parsed.project.name;}
    if (parsed.project?.goal) {data.project!.goal = parsed.project.goal;}
    if (parsed.project?.main_language) {data.project!.main_language = parsed.project.main_language;}
    sources.push('CLAUDE.md');
  }

  // Try AGENTS.md
  const agents = readSource(dir, 'AGENTS.md', refused);
  if (agents !== null) {
    if (!data.project!.name) {
      const m = agents.match(/^#\s+(.+)/m);
      if (m) {data.project!.name = m[1].trim();}
    }
    sources.push('AGENTS.md');
  }

  // Try GEMINI.md
  const gemini = readSource(dir, 'GEMINI.md', refused);
  if (gemini !== null) {
    if (!data.project!.name) {
      const m = gemini.match(/^#\s+(.+)/m);
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
    if (refused.length > 0) {
      console.error(`Nothing to recover from: ${refused.join(', ')} ${refused.length === 1 ? 'was' : 'were'} refused (above), and no other context file is there. Nothing was written.`);
      process.exit(1);
    }
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
    writeFaf(existing, prev, { onAliasKept: k => console.log(dim(`  ${aliasKeptNote(k)}`)) });
    console.log(`${fafCyan('◆')} recover  merged into ${existing}`);
  } else {
    const outPath = join(dir, 'project.faf');
    writeFaf(outPath, data);
    console.log(`${fafCyan('◆')} recover  created ${outPath}`);
  }

  console.log(dim(`  sources: ${sources.join(', ')}`));
}
