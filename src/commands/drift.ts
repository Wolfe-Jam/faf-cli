import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { findFafFile } from '../interop/faf.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

const CONTEXT_FILES = ['CLAUDE.md', 'AGENTS.md', '.cursorrules', 'GEMINI.md'];

/** Check context drift between .faf and context files */
export function driftCommand(): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const dir = process.cwd();
  const fafMtime = statSync(fafPath).mtimeMs;

  console.log(`${fafCyan('drift')} ${dim('— context file sync status')}\n`);
  console.log(`  ${bold('.faf')} ${dim(formatAge(fafMtime))}`);

  let drifted = 0;

  for (const file of CONTEXT_FILES) {
    const path = join(dir, file);
    if (!existsSync(path)) {
      console.log(`  ${dim('○')} ${file} ${dim('missing')}`);
      continue;
    }

    const mtime = statSync(path).mtimeMs;
    const delta = mtime - fafMtime;

    if (Math.abs(delta) < 1000) {
      console.log(`  ${fafCyan('●')} ${file} ${dim('in sync')}`);
    } else if (delta > 0) {
      console.log(`  ${bold('!')} ${file} ${bold('newer')} ${dim(formatAge(mtime))}`);
      drifted++;
    } else {
      console.log(`  ${dim('○')} ${file} ${dim('older')} ${dim(formatAge(mtime))}`);
      drifted++;
    }
  }

  if (drifted > 0) {
    console.log(dim(`\n  run ${bold("'faf sync'")} to resolve drift`));
  }
}

function formatAge(mtimeMs: number): string {
  const ago = Date.now() - mtimeMs;
  const secs = Math.floor(ago / 1000);
  if (secs < 60) {return `${secs}s ago`;}
  const mins = Math.floor(secs / 60);
  if (mins < 60) {return `${mins}m ago`;}
  const hours = Math.floor(mins / 60);
  if (hours < 24) {return `${hours}h ago`;}
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
