import { existsSync } from 'fs';
import { join } from 'path';
import { findFafFile, readFaf, readFafRaw, withKernel } from '../interop/faf.js';
import { writeClaudeMd, renderClaudeMd } from '../interop/claude.js';
import { writeClaudeMemory, type ClaudeMemoryAction } from '../interop/claude-memory.js';
import { legacyStampNoteAt } from '../interop/inject.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';
import { isPro } from '../core/pro.js';

export interface SyncOptions {
  watch?: boolean;
}

export function syncCommand(options: SyncOptions = {}): void {
  const dir = process.cwd();
  const fafPath = findFafFile(dir);

  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const claudePath = join(dir, 'CLAUDE.md');

  // sync is one-way: .faf → CLAUDE.md. Nothing is read back into .faf.
  pushSync(fafPath, dir);

  // tri-sync: .faf → Claude Code's MEMORY.md (Pro)
  if (isPro()) {
    triSync(fafPath, dir);
  }

  if (options.watch) {
    console.log(dim('watching for changes... (Ctrl+C to stop)'));
    watchSync(fafPath, claudePath, dir);
  }
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

  const result = withKernel(fafPath, () => enrichScore(kernel.score(readFafRaw(fafPath))));
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
      pushSync(fafPath, dir);
      if (isPro()) {triSync(fafPath, dir);}
    }, 200);
  };

  watch(fafPath, handler);
  if (existsSync(claudePath)) {watch(claudePath, handler);}
}
