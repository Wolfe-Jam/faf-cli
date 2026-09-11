import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { aliasKeptNote, findFafFile, readFaf, readFafRaw, writeFaf } from '../interop/faf.js';
import { readClaudeMd, writeClaudeMd, renderClaudeMd, parseClaudeMd } from '../interop/claude.js';
import { writeClaudeMemory, type ClaudeMemoryAction } from '../interop/claude-memory.js';
import { legacyStampNoteAt } from '../interop/inject.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';
import { isPro } from '../core/pro.js';

export interface SyncOptions {
  watch?: boolean;
  direction?: 'auto' | 'push' | 'pull';
}

export function syncCommand(options: SyncOptions = {}): void {
  const dir = process.cwd();
  const fafPath = findFafFile(dir);

  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const claudePath = join(dir, 'CLAUDE.md');
  const direction = options.direction ?? 'auto';

  // sync: .faf ↔ CLAUDE.md
  if (direction === 'auto') {
    autoSync(fafPath, claudePath, dir);
  } else if (direction === 'push') {
    pushSync(fafPath, dir);
  } else if (direction === 'pull') {
    pullSync(fafPath, claudePath);
  }

  // tri-sync: .faf → Claude Code's MEMORY.md (Pro)
  if (isPro()) {
    triSync(fafPath, dir);
  }

  if (options.watch) {
    console.log(dim('watching for changes... (Ctrl+C to stop)'));
    watchSync(fafPath, claudePath, dir);
  }
}

function autoSync(fafPath: string, claudePath: string, dir: string): void {
  // .faf is the FCL — the canonical truth. CLAUDE.md is a downstream prose
  // surface that READS .faf to save AI time. They are not peers. mtime-based
  // "newer wins" auto-direction silently overwrote canonical .faf content
  // when a user edited CLAUDE.md prose (issue #63). FAF fills its own slots.
  // Use `faf sync --pull` for the explicit legacy bootstrap case.
  void claudePath;
  pushSync(fafPath, dir);
}

function pushSync(fafPath: string, dir: string): void {
  const data = readFaf(fafPath);
  const content = renderClaudeMd(data);
  // Read before the write: a CLAUDE.md led by faf's old stamp is prefixed,
  // never reclaimed — say so in one line.
  const note = legacyStampNoteAt(join(dir, 'CLAUDE.md'), 'CLAUDE.md');
  writeClaudeMd(dir, content);
  console.log(`${fafCyan('◆')} sync  .faf → CLAUDE.md`);
  if (note) {console.log(dim(`  ${note}`));}

  const result = enrichScore(kernel.score(readFafRaw(fafPath)));
  displayScore(result, fafPath);
}

function pullSync(fafPath: string, claudePath: string): void {
  // Trophy gate (v6.6.0+ — per memory/trophy-is-the-target.md):
  // MD → .faf backfill is the bi-directional flow that's only safe at ✪ Trophy.
  // Below Trophy, the .faf is incomplete by definition; CLAUDE.md prose is
  // not a derivation from .faf (since .faf has gaps) and may contain stale or
  // contradictory text. Pulling it overwrites canonical slots with that text.
  // At Trophy, CLAUDE.md is a complete push-derivation from .faf, so selective
  // re-read is safe. This gate matches the pubpro doctrine: Trophy or nothing.
  const preScore = enrichScore(kernel.score(readFafRaw(fafPath)));
  if (preScore.tier.name !== 'TROPHY') {
    console.error(`${bold('×')} sync --pull blocked: requires ✪ Trophy (currently ${preScore.score}%)`);
    console.error(dim(`  MD → .faf backfill only runs at 100%. Reach Trophy with 'faf go', then retry.`));
    process.exit(1);
  }

  // Use dirname() to extract the directory portably — claudePath comes from
  // join(dir, 'CLAUDE.md') which produces backslashes on Windows. The previous
  // claudePath.replace('/CLAUDE.md', '') only worked on POSIX path separators
  // and silently returned the unchanged path on Windows, breaking pull-sync.
  const claudeContent = readClaudeMd(dirname(claudePath));
  if (!claudeContent) {
    console.error('CLAUDE.md not found.');
    return;
  }

  const parsed = parseClaudeMd(claudeContent);
  const existing = readFaf(fafPath);

  if (parsed.project?.name) {existing.project = { ...existing.project, name: parsed.project.name };}
  if (parsed.project?.goal) {existing.project = { ...existing.project, goal: parsed.project.goal };}
  if (parsed.project?.main_language) {existing.project = { ...existing.project, main_language: parsed.project.main_language };}

  writeFaf(fafPath, existing, { onAliasKept: k => console.log(dim(`  ${aliasKeptNote(k)}`)) });
  console.log(`${fafCyan('◆')} sync  CLAUDE.md → .faf   ${dim('(Trophy-gated)')}`);

  const result = enrichScore(kernel.score(readFafRaw(fafPath)));
  displayScore(result, fafPath);
}

const MEMORY_ACTION: Record<ClaudeMemoryAction, string> = {
  created: 'created',
  updated: 'block updated',
  migrated: 'earlier tri-sync section replaced by the block',
  added: "block added on top; Claude's notes kept",
  unchanged: 'unchanged',
};

/**
 * Pro tri-sync: write faf's block into the MEMORY.md Claude Code loads for
 * this project (~/.claude/projects/<id>/memory/MEMORY.md — see
 * interop/claude-memory.ts). Claude's own notes in that file are kept byte
 * for byte; a run that changes nothing writes nothing. One direction only:
 * .faf → MEMORY.md (nothing is read back into .faf).
 */
function triSync(fafPath: string, dir: string): void {
  try {
    const r = writeClaudeMemory(dir, readFaf(fafPath));
    console.log(`${fafCyan('◆')} sync  .faf → MEMORY.md   ${dim(`${MEMORY_ACTION[r.action]} — ${r.path}`)}`);
    for (const w of r.warnings) {console.log(dim(`  ${w}`));}
  } catch (e) {
    console.error(`${bold('×')} sync  .faf → MEMORY.md   ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  }
}

function watchSync(fafPath: string, claudePath: string, dir: string): void {
  const { watch } = require('fs');
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const handler = () => {
    if (debounce) {clearTimeout(debounce);}
    debounce = setTimeout(() => {
      console.log(dim('change detected...'));
      autoSync(fafPath, claudePath, dir);
      if (isPro()) {triSync(fafPath, dir);}
    }, 200);
  };

  watch(fafPath, handler);
  if (existsSync(claudePath)) {watch(claudePath, handler);}
}
