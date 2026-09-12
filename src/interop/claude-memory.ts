/**
 * Claude Code auto-memory — the MEMORY.md Claude Code loads at the start of a
 * session: `<config>/projects/<project-id>/memory/MEMORY.md`.
 *
 * Moved here from claude-faf-mcp (its tri-sync writer and path resolver) so
 * every FAF tool shares one copy, with what the audit found fixed.
 *
 * WHERE the file is — Claude Code's own rule (mirrored from Claude Code 2.1.x):
 *   - Project root: the canonical git root of the folder — the first folder at
 *     or above it that has a `.git` (a folder or a file). A linked worktree
 *     resolves to its main checkout, so every worktree shares one memory. A
 *     folder that is not in git is its own root.
 *   - Project id: that path with every character outside [a-zA-Z0-9] replaced
 *     by `-` (so `/home/me/my_app` → `-home-me-my-app`). An id longer than
 *     200 characters is cut to 200 and gets `-` plus a base-36 hash of the
 *     full path.
 *   - Base: CLAUDE_CODE_REMOTE_MEMORY_DIR when set, else Claude's config
 *     folder: CLAUDE_CONFIG_DIR, else ~/.claude.
 *   Not read: Claude Code's `autoMemoryDirectory` setting (or any other
 *   override of the whole memory folder). When one is set, pass `memoryDir`.
 *
 * WHAT faf writes — one managed block (the same markers and injector as
 * CLAUDE.md). Everything else in the file is Claude's and is kept byte for
 * byte, CRLF line ends and a BOM included:
 *   - no MEMORY.md             → the file is created with the block
 *   - faf's block is there     → only the text between its marker lines changes
 *   - claude-faf-mcp's earlier section (its `# Project Context (from
 *     project.faf)` line through its `*This section is managed by tri-sync.`
 *     line, both whole lines) → replaced in place by the block, once
 *   - anything else            → the block goes on top; nothing is removed
 * Markers match whole lines only (faf's own exactly), never substrings, and
 * only outside fenced code, raw HTML blocks and multi-line HTML comments, as
 * both CommonMark and a plain column-0 reading see them (a note that quotes
 * the block or the old section is an example, not a marker; see inject.ts).
 * When the block goes on top of a file whose older faf block sits in such a
 * region, the result's warnings say so in one line. Only a missing file reads
 * as "no file": any other read error is thrown and nothing is written, and a
 * file that is not UTF-8 is refused. The write is atomic, is refused if the
 * file changed on disk after faf read it, and a run that changes nothing
 * writes nothing.
 */

import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'fs';
import { homedir } from 'os';
import { basename, dirname, join, resolve } from 'path';
import type { FafData } from '../core/types.js';
import { FAF_CONTEXT_FILES, makeDirInside, resolveInside, safeWriteFile } from '../core/safe-write.js';
import {
  findFafBlock,
  findMarkedRange,
  legacyStampNote,
  placeFafBlock,
  readIfPresent,
  withFafBlock,
  wrapFafBlock,
} from './inject.js';
import { filled, slotLabel } from './labels.js';

/** Claude Code cuts a project id at this length and adds a hash. */
const MAX_ID = 200;
/** Claude Code loads this many lines of MEMORY.md into a session. */
const LOADED_LINES = 200;
/** Longest list faf puts in the block (commands, key files), so the block
 *  stays short and leaves Claude's own notes inside the loaded lines. */
const LIST_CAP = 12;

/** claude-faf-mcp's earlier section: its heading line and its closing line. */
const LEGACY_START = '# Project Context (from project.faf)';
const LEGACY_END_PREFIX = '*This section is managed by tri-sync.';

export interface ClaudeMemoryOptions {
  /** Claude Code's config folder. Default: CLAUDE_CODE_REMOTE_MEMORY_DIR,
   *  else CLAUDE_CONFIG_DIR, else ~/.claude. */
  configDir?: string;
  /** The memory folder itself, when you know better than the rule (Claude
   *  Code's `autoMemoryDirectory` setting, say). Skips the resolver. */
  memoryDir?: string;
}

/** What `writeClaudeMemory` did. */
export type ClaudeMemoryAction = 'created' | 'updated' | 'migrated' | 'added' | 'unchanged';

export interface ClaudeMemoryResult {
  /** The MEMORY.md (its real path). */
  path: string;
  /**
   *  - `created`   there was no MEMORY.md; it now holds the block
   *  - `updated`   faf's block was replaced in place
   *  - `migrated`  claude-faf-mcp's earlier section was replaced by the block
   *  - `added`     the file had neither; the block went on top
   *  - `unchanged` the block was already exactly this; nothing was written
   */
  action: ClaudeMemoryAction;
  /** False when nothing was written (`unchanged`). */
  written: boolean;
  /** Every byte outside faf's block is still in the file, in place — checked
   *  by reading the file back after the write. */
  preserved: boolean;
  /** Lines in the file now. */
  lines: number;
  /** Plain-words notes (e.g. lines past the 200 Claude Code loads). */
  warnings: string[];
}

/** What is in the MEMORY.md Claude Code loads for a project (read only). */
export interface ClaudeMemoryStatus {
  /** The MEMORY.md path (whether or not it exists). */
  path: string;
  exists: boolean;
  /** Lines in the file. */
  lines: number;
  /** faf's block is in the file. */
  hasBlock: boolean;
  /** Lines in faf's block, its marker lines included (0 when there is none). */
  blockLines: number;
  /** claude-faf-mcp's earlier tri-sync section is in the file (the next write replaces it). */
  hasLegacySection: boolean;
  /** Non-blank lines outside faf's block: Claude's own notes. */
  otherLines: number;
  /** Plain-words notes (e.g. lines past the 200 Claude Code loads). */
  warnings: string[];
}

/** Claude Code's 32-bit string hash (over UTF-16 code units). */
function claudeHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Claude Code's folder name for a project path: every character outside
 * [a-zA-Z0-9] becomes `-`; past 200 characters the id is cut to 200 and gets
 * `-` plus a base-36 hash of the full path. `/home/me/my_app` → `-home-me-my-app`.
 * Pass the project root (see {@link claudeProjectRoot}), not any folder.
 */
export function claudeProjectId(projectRoot: string): string {
  const id = projectRoot.replace(/[^a-zA-Z0-9]/g, '-');
  if (id.length <= MAX_ID) {return id;}
  return `${id.slice(0, MAX_ID)}-${Math.abs(claudeHash(projectRoot)).toString(36)}`;
}

/** A `.git` Claude Code counts: a folder or a file (a link that leads to one). */
function isGitEntry(p: string): boolean {
  try {
    const st = lstatSync(p);
    if (st.isSymbolicLink()) {
      const target = statSync(p);
      return target.isDirectory() || target.isFile();
    }
    return st.isDirectory() || st.isFile();
  } catch {
    return false;
  }
}

/** A plain file (not a link) — the only kind of worktree pointer file followed. */
function isPlainFile(p: string): boolean {
  try {
    return lstatSync(p).isFile();
  } catch {
    return false;
  }
}

/** The first folder at or above `start` with a `.git`, or null. */
function findGitRoot(start: string): string | null {
  let cur = start;
  for (;;) {
    if (isGitEntry(join(cur, '.git'))) {return cur;}
    const parent = dirname(cur);
    if (parent === cur) {return null;}
    cur = parent;
  }
}

/**
 * The main checkout of a linked worktree, or `root` itself. Follows git's own
 * pointers and trusts them only when they agree: `.git` is a file saying
 * `gitdir: <dir>`, `<dir>/commondir` names the shared git folder, `<dir>` sits
 * in that folder's `worktrees/`, and `<dir>/gitdir` points back at this
 * `.git`. Anything else (a plain `.git` folder, a submodule, a mismatch) → `root`.
 */
function canonicalGitRoot(root: string): string {
  let pointer: string;
  try {
    pointer = readFileSync(join(root, '.git'), 'utf-8').trim();
  } catch {
    return root; // a .git folder: already the main checkout
  }
  try {
    if (!pointer.startsWith('gitdir:')) {return root;}
    const gitDir = resolve(root, pointer.slice('gitdir:'.length).trim());
    const commondirFile = join(gitDir, 'commondir');
    if (!isPlainFile(commondirFile)) {return root;}
    const common = resolve(gitDir, readFileSync(commondirFile, 'utf-8').trim());
    if (resolve(dirname(gitDir)) !== join(common, 'worktrees')) {return root;}
    const backFile = join(gitDir, 'gitdir');
    if (!isPlainFile(backFile)) {return root;}
    const back = readFileSync(backFile, 'utf-8').trim();
    if (realpathSync(resolve(gitDir, back)) !== join(realpathSync(root), '.git')) {return root;}
    if (basename(common) !== '.git') {
      // A bare repo with worktrees: its folder is the root, unless it is itself inside a checkout.
      return isGitEntry(join(common, '.git')) ? root : common;
    }
    return dirname(common);
  } catch {
    return root;
  }
}

/**
 * The project root Claude Code keys a folder's memory by: the canonical git
 * root (a linked worktree → its main checkout), or the folder itself when it
 * is not in git. The folder is resolved on disk first (links followed), as
 * Claude Code sees its working folder; the result is NFC-normalized.
 */
export function claudeProjectRoot(dir: string): string {
  let start = resolve(dir);
  try {
    start = realpathSync.native(start);
  } catch {
    /* not on disk: keep the resolved path */
  }
  const gitRoot = findGitRoot(start);
  return (gitRoot ? canonicalGitRoot(gitRoot) : start).normalize('NFC');
}

/** `<config>/projects/<project-id>/memory` for the project `dir` is in. */
export function resolveClaudeMemoryDir(dir: string, opts: ClaudeMemoryOptions = {}): string {
  if (opts.memoryDir) {return resolve(opts.memoryDir);}
  const base =
    opts.configDir ||
    process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR ||
    process.env.CLAUDE_CONFIG_DIR ||
    join(homedir(), '.claude');
  return join(resolve(base), 'projects', claudeProjectId(claudeProjectRoot(dir)), 'memory').normalize('NFC');
}

/** The MEMORY.md Claude Code loads for the project `dir` is in. */
export function resolveClaudeMemoryPath(dir: string, opts: ClaudeMemoryOptions = {}): string {
  return join(resolveClaudeMemoryDir(dir, opts), FAF_CONTEXT_FILES.memory);
}

/** Stack keys that are context, not stack (kept out of the Stack list). */
const NON_STACK = new Set(['target_user', 'core_problem', 'mission_purpose']);
const SIX_WS = ['who', 'what', 'why', 'where', 'when', 'how'] as const;

/**
 * The block body faf keeps in MEMORY.md, from .faf data: a short project
 * summary (name, goal, language, type), the filled stack slots, the 6 Ws,
 * and up to 12 commands and key files. Kept short on purpose — Claude Code
 * loads only the first 200 lines, and the rest of the file is Claude's.
 */
export function renderClaudeMemory(data: FafData): string {
  const project = data.project ?? {};
  const summary: [string, unknown][] = [['Goal', project.goal], ['Language', project.main_language], ['Type', project.type]];
  const hc = data.human_context ?? {};
  const keyFiles = Array.isArray(data.key_files) ? data.key_files : [];

  const lines = [
    '## Project context — from project.faf',
    '',
    `- **Name:** ${filled(project.name) ? project.name : 'Project'}`,
    ...summary.filter(([, v]) => filled(v)).map(([label, v]) => `- **${label}:** ${v as string}`),
    ...section('Stack', Object.entries(data.stack ?? {})
      .filter(([k, v]) => !NON_STACK.has(k) && filled(v))
      .map(([k, v]) => `- **${slotLabel(`stack.${k}`)}:** ${v as string}`)),
    ...section('Context', SIX_WS.filter(w => filled(hc[w])).map(w => `- **${slotLabel(`human_context.${w}`)}:** ${hc[w] as string}`)),
    ...section('Commands', Object.entries(data.commands ?? {})
      .filter(([, v]) => filled(v))
      .slice(0, LIST_CAP)
      .map(([k, v]) => `- ${k}: \`${v}\``)),
    ...section('Key files', keyFiles.filter(filled).slice(0, LIST_CAP).map(f => `- ${f}`)),
    '',
    "*faf keeps this block in step with project.faf. Everything outside it is Claude's own and is kept as written.*",
  ];
  return lines.join('\n');
}

/** A `### title` section after a blank line, or nothing when it has no items. */
function section(title: string, items: string[]): string[] {
  return items.length > 0 ? ['', `### ${title}`, ...items] : [];
}

/** claude-faf-mcp's earlier section: its heading as a whole line at column 0,
 *  through the first later line that starts with its closing text — both
 *  outside fenced code, raw HTML blocks and multi-line HTML comments (the
 *  injector's own CommonMark scanner). The range covers both lines (the
 *  closing line's terminator excluded), or null. A heading whose closing
 *  line appears only inside a fence (a note quoting the old section) is not
 *  a section: the file is Claude's, and the block goes on top. */
function findLegacySection(text: string): { start: number; end: number } | null {
  return findMarkedRange(
    text,
    line => line.trimEnd() === LEGACY_START,
    line => line.startsWith(LEGACY_END_PREFIX),
  );
}

/** Lines in a text (a final line break does not start another line). */
function countLines(text: string): number {
  if (text === '') {return 0;}
  const breaks = text.match(/\r\n|\r|\n/g)?.length ?? 0;
  return /(\r\n|\r|\n)$/.test(text) ? breaks : breaks + 1;
}

interface Plan {
  text: string;
  action: Exclude<ClaudeMemoryAction, 'unchanged'>;
  /** Text before and after faf's block that must come back unchanged. */
  head: string;
  tail: string;
}

/** The new file text, and what of the old text must survive around the
 *  block. `path` names the file when faf cannot place its block there (a
 *  SafePathError `unplaceable`; nothing is written). */
function plan(existing: string | null, wrapped: string, path: string): Plan {
  if (existing === null) {
    return { text: withFafBlock(null, wrapped, undefined, undefined, path), action: 'created', head: '', tail: '' };
  }
  const block = findFafBlock(existing);
  const range = block ?? findLegacySection(existing);
  if (range) {
    const head = existing.slice(0, range.start);
    const tail = existing.slice(range.end);
    return { text: placeFafBlock(head, wrapped, tail, undefined, undefined, path), action: block ? 'updated' : 'migrated', head, tail };
  }
  const bom = existing.startsWith('\uFEFF') ? '\uFEFF' : '';
  return { text: withFafBlock(existing, wrapped, undefined, undefined, path), action: 'added', head: bom, tail: existing.slice(bom.length) };
}

/** The 200-line note, when the text is past what Claude Code loads. */
function lineWarnings(lines: number): string[] {
  return lines > LOADED_LINES
    ? [`MEMORY.md is ${lines} lines. Claude Code loads the first ${LOADED_LINES}; lines after that are kept in the file but not loaded.`]
    : [];
}

/**
 * Read what is in the MEMORY.md Claude Code loads for the project `dir` is in:
 * whether faf's block (or claude-faf-mcp's earlier section) is there, and how
 * many lines are Claude's own. Reads only; never creates or writes anything.
 * A file that exists but cannot be read throws.
 */
export function claudeMemoryStatus(dir: string, opts: ClaudeMemoryOptions = {}): ClaudeMemoryStatus {
  const memoryDir = resolveClaudeMemoryDir(dir, opts);
  const path = join(memoryDir, FAF_CONTEXT_FILES.memory);
  const empty = { path, exists: false, lines: 0, hasBlock: false, blockLines: 0, hasLegacySection: false, otherLines: 0, warnings: [] };
  if (!existsSync(memoryDir)) {return empty;}
  const text = readIfPresent(resolveInside(memoryDir, FAF_CONTEXT_FILES.memory));
  if (text === null) {return empty;}
  const block = findFafBlock(text);
  const outside = block ? `${text.slice(0, block.start)}${text.slice(block.end)}` : text;
  const lines = countLines(text);
  return {
    path,
    exists: true,
    lines,
    hasBlock: block !== null,
    blockLines: block ? countLines(text.slice(block.start, block.end)) : 0,
    hasLegacySection: !block && findLegacySection(text) !== null,
    otherLines: outside.split(/\r\n|\r|\n/).filter(l => l.replace(/^\uFEFF/, '').trim() !== '').length,
    warnings: lineWarnings(lines),
  };
}

/**
 * Write faf's block into the MEMORY.md Claude Code loads for the project `dir`
 * is in (see the file header for the path rule and what is kept). Creates the
 * memory folder when it is not there yet. Throws — having written nothing —
 * when the file cannot be read (other than not existing), is not UTF-8, is a
 * link that leaves the memory folder, changed on disk while faf was writing,
 * cannot be written (the original is kept), or is one where faf cannot place
 * its block where its next run finds it again (SafePathError `unplaceable`,
 * the same one-line refusal as injectFafBlock).
 */
export function writeClaudeMemory(dir: string, data: FafData, opts: ClaudeMemoryOptions = {}): ClaudeMemoryResult {
  const memoryDir = resolveClaudeMemoryDir(dir, opts);
  makeDirInside(memoryDir);
  const path = resolveInside(memoryDir, FAF_CONTEXT_FILES.memory);
  const existing = readIfPresent(path);
  const next = plan(existing, wrapFafBlock(renderClaudeMemory(data)), path);

  if (next.text === existing) {
    const lines = countLines(existing);
    return { path, action: 'unchanged', written: false, preserved: true, lines, warnings: lineWarnings(lines) };
  }

  const written = safeWriteFile(path, next.text, { root: memoryDir, expect: existing });
  const after = readFileSync(written, 'utf-8');
  const preserved = after === next.text && after.startsWith(next.head) && after.endsWith(next.tail);
  const lines = countLines(after);
  // The block went on top of a file whose older faf block sits in a code
  // fence or comment: say so, as `faf sync` does for CLAUDE.md.
  const older = next.action === 'added' ? legacyStampNote(FAF_CONTEXT_FILES.memory, existing) : null;
  return { path: written, action: next.action, written: true, preserved, lines, warnings: [...(older ? [older] : []), ...lineWarnings(lines)] };
}
