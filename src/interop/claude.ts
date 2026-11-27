import { existsSync, realpathSync, statSync } from 'fs';
import { join } from 'path';
import type { FafData } from '../core/types.js';
import { FAF_END, FAF_START, injectFafBlock } from './inject.js';
import { sixWsFilled, slotLabel } from './labels.js';
import { FAF_CONTEXT_FILES, readUtf8, resolveInside } from '../core/safe-write.js';

const CLAUDE_MD = FAF_CONTEXT_FILES.claude;
const SYNC_MARKER = 'STATUS: SYNC ACTIVE';

/** Read CLAUDE.md from a directory. A CLAUDE.md link that leaves the
 *  directory, or leads to a file that is not an AI context file, is refused
 *  (SafePathError) and nothing is read; CLAUDE.md → AGENTS.md is read
 *  through. A CLAUDE.md that is not UTF-8 is refused too. Library export;
 *  `faf sync` never reads CLAUDE.md back into project.faf. */
export function readClaudeMd(dir: string): string | null {
  const path = join(dir, CLAUDE_MD);
  if (!existsSync(path)) {return null;}
  return readUtf8(resolveInside(dir, CLAUDE_MD));
}

/** Write CLAUDE.md — non-destructive: injects/updates the faf block, preserves the rest. */
export function writeClaudeMd(dir: string, content: string): void {
  injectFafBlock(join(dir, CLAUDE_MD), content);
}

/** Write faf's CLAUDE.md block for `dir` exactly as `faf sync` does: with the
 *  `@AGENTS.md` import when an AGENTS.md sits beside it (#266, #276). The one
 *  path for the CLI and for library callers (the MCP servers), so the file
 *  doesn't flip between the two. */
export function syncClaudeMd(dir: string, data: FafData, factsRef = 'project.faf'): void {
  writeClaudeMd(dir, renderClaudeMd(data, factsRef, { importAgentsMd: agentsMdBeside(dir) }));
}

/** Whether faf's CLAUDE.md block in `dir` imports AGENTS.md: null when there
 *  is no CLAUDE.md, no faf block, or the file can't be read. */
export function claudeMdImportsAgents(dir: string): boolean | null {
  let text: string | null;
  try {
    text = readClaudeMd(dir);
  } catch {
    return null;
  }
  if (!text) {return null;}
  const start = text.indexOf(FAF_START);
  const end = start < 0 ? -1 : text.indexOf(FAF_END, start);
  if (end < 0) {return null;}
  return /^@AGENTS\.md\s*$/m.test(text.slice(start, end));
}

/** Get mtime of CLAUDE.md */
export function claudeMdMtime(dir: string): number | null {
  const path = join(dir, CLAUDE_MD);
  if (!existsSync(path)) {return null;}
  return statSync(path).mtimeMs;
}

/** Optional knobs for the 2-line FAF stamp. */
export interface FafMetaOpts {
  /** Canonical structured-truth file the md claims (default `project.faf`).
   *  Use for AI-context md (CLAUDE/GEMINI/AGENTS/.cursorrules). */
  claim?: string;
  /** Role identifier (`readme`, `changelog`, `skill`, …).
   *  Use for repo-meta md whose primary reader is human. Mutually exclusive with `claim`. */
  doc?: string;
  /** Current AI-readiness score (0–100). */
  score?: number;
  /** Sister-product family — `FAF` (default), `TAF`, `WJTTC`, … */
  family?: string;
  /** Other docs in the repo the reader should know about. */
  siblings?: string[];
}

/**
 * Build the canonical 2-line FAF stamp.
 *
 * Line 1 — positional identity: `name | lang | type | description`
 * Line 2 — key=value navigation/state: `claim=… | score=… | family=… | siblings=…`
 *
 * Spec: `memory/cross-ai-2-line-meta-stamp.md`. Issue #64.
 */
export function fafMetaTag(data: FafData, opts: FafMetaOpts = {}): string {
  const name = String(data.project?.name ?? '').trim();
  const lang = String(data.project?.main_language ?? '').trim();
  const type = String(data.project?.type ?? '').trim();
  const desc = String(data.project?.goal ?? '').trim();
  const line1 = `<!-- faf: ${[name, lang, type, desc].join(' | ')} -->`;

  const kv: string[] = [];
  if (opts.doc) {
    kv.push(`doc=${opts.doc}`);
  } else {
    kv.push(`claim=${opts.claim ?? 'project.faf'}`);
  }
  if (typeof opts.score === 'number') {kv.push(`score=${opts.score}`);}
  kv.push(`family=${opts.family ?? 'FAF'}`);
  if (opts.siblings && opts.siblings.length > 0) {
    kv.push(`siblings=${opts.siblings.join(',')}`);
  }
  const line2 = `<!-- faf: ${kv.join(' | ')} -->`;

  return `${line1}\n${line2}`;
}

/** Render CLAUDE.md content from .faf data */
/** Options for renderClaudeMd. */
export interface ClaudeMdOptions {
  /** Add the `@AGENTS.md` import: an AGENTS.md sits beside CLAUDE.md and is
   *  a different file (see agentsMdBeside). */
  importAgentsMd?: boolean;
}

/** True when `dir` holds an AGENTS.md that CLAUDE.md should import: the file
 *  exists and CLAUDE.md is not a link to it (a CLAUDE.md that resolves to
 *  AGENTS.md is already read as AGENTS.md, and would import itself). Claude
 *  Code reads AGENTS.md only when there is no CLAUDE.md (#266). */
export function agentsMdBeside(dir: string): boolean {
  const agents = join(dir, FAF_CONTEXT_FILES.agents);
  if (!existsSync(agents)) {return false;}
  const claude = join(dir, CLAUDE_MD);
  if (!existsSync(claude)) {return true;}
  try {
    return realpathSync(claude) !== realpathSync(agents);
  } catch {
    return false;
  }
}

export function renderClaudeMd(data: FafData, factsRef = 'project.faf', opts: ClaudeMdOptions = {}): string {
  const lines: string[] = [];
  const name = data.project?.name ?? 'Project';
  const lang = data.project?.main_language ?? '';
  const goal = data.project?.goal ?? '';

  // Meta tag — project DNA, invisible to renderers, visible to AI
  lines.push(fafMetaTag(data, { claim: factsRef }));
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
  if (lang) {stackEntries.push(`**Language:** ${lang}`);}
  for (const [key, val] of Object.entries(stack)) {
    if (val && val !== 'slotignored' && String(val).trim()) {
      stackEntries.push(`**${slotLabel(`stack.${key}`)}:** ${val}`);
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

  // Context — the six W's, from the one shared rule (labels.ts sixWsFilled).
  const contextEntries = sixWsFilled(data).map(([label, value]) => `- **${label}:** ${value}`);

  if (contextEntries.length > 0) {
    lines.push('## Context');
    lines.push('');
    lines.push(...contextEntries);
    lines.push('');
  }

  // Claude Code skips AGENTS.md when a CLAUDE.md exists, so the build, test
  // and repo rules faf writes there arrive only through this import (#266).
  if (opts.importAgentsMd) {
    lines.push('## Build, test and repo rules');
    lines.push('');
    lines.push('@AGENTS.md');
    lines.push('');
  }

  // Sync footer
  lines.push('---');
  lines.push('');
  lines.push(`*${SYNC_MARKER} — ${new Date().toISOString()}*`);
  lines.push('');

  return lines.join('\n');
}

/** Strip a trailing `vN`, `vN.N`, `vN.N.N…` version token from a project name.
 *  Requires whitespace before the `v` so hyphenated names like `mcpaas-vue` or
 *  `faf-cli-v6` are preserved. Issue #64 sibling — see #62. */
function stripVersionTrailer(name: string): string {
  return name.replace(/\s+v\d+(?:\.\d+)*\s*$/i, '').trim();
}

/** Extract project data from CLAUDE.md content (pull direction) */
export function parseClaudeMd(content: string): Partial<FafData> {
  const data: Partial<FafData> = { project: {} };

  // New format: "# CLAUDE.md — project-name"
  const titleMatch = content.match(/^# CLAUDE\.md\s*[—–-]\s*(.+)$/m);
  if (titleMatch) {data.project!.name = stripVersionTrailer(titleMatch[1].trim());}

  // Old format fallback: "**Name:** value"
  if (!data.project!.name) {
    const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/);
    if (nameMatch) {data.project!.name = stripVersionTrailer(nameMatch[1].trim());}
  }

  // New format: paragraph after "## What This Is"
  const whatMatch = content.match(/## What This Is\s*\n\s*\n(.+)/);
  if (whatMatch) {data.project!.goal = whatMatch[1].trim();}

  // Old format fallback: "**What Building:** value"
  if (!data.project!.goal) {
    const goalMatch = content.match(/\*\*What Building:\*\*\s*(.+)/);
    if (goalMatch) {data.project!.goal = goalMatch[1].trim();}
  }

  // New format: "**Language:** value" under Stack
  const langMatch = content.match(/\*\*Language:\*\*\s*(.+)/);
  if (langMatch) {data.project!.main_language = langMatch[1].trim();}

  // Old format fallback: "**Main Language:** value"
  if (!data.project!.main_language) {
    const oldLangMatch = content.match(/\*\*Main Language:\*\*\s*(.+)/);
    if (oldLangMatch) {data.project!.main_language = oldLangMatch[1].trim();}
  }

  return data;
}
