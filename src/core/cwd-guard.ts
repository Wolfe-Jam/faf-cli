import { statSync } from 'fs';
import { homedir } from 'os';
import { parse, resolve } from 'path';
import { bold, dim, fafCyan } from '../ui/colors.js';

/**
 * Home / filesystem root are never a FAF project root.
 * Receipt: stranger ran `faf auto` in ~ and got Trophy DNA for "wolfejam" —
 * funny, not useful. Dev-notes already say `cd your-project`.
 *
 * Hard refuse for writers (auto / init / go / loop). No --force escape:
 * cd is the product.
 */

/** Same directory on disk, however it is spelled: device + inode, not the path
 *  string. Catches a case-variant spelling on case-insensitive APFS
 *  (`/users/me`), a symlink to home, and macOS firmlinks
 *  (`/System/Volumes/Data/Users/me`). An unreadable path, or a filesystem
 *  that reports no inode (0), is never "the same". */
function sameDir(a: string, b: string): boolean {
  try {
    const sa = statSync(a, { bigint: true });
    const sb = statSync(b, { bigint: true });
    return sa.isDirectory() && sa.ino !== 0n && sa.dev === sb.dev && sa.ino === sb.ino;
  } catch {
    return false;
  }
}

/** Which non-project root `dir` is — home, the filesystem root — or null. */
function nonProjectRootKind(dir: string): 'home' | 'root' | null {
  const resolved = resolve(dir);
  const home = resolve(homedir());
  const root = parse(resolved).root; // '/' on POSIX, 'C:\' on Windows
  if (resolved === home) {return 'home';}
  // POSIX root or Windows drive root (C:\ etc.)
  if (resolved === root || resolved === '/' || /^[A-Za-z]:[\\/]?$/.test(resolved)) {return 'root';}
  // Spelled differently — compare identity.
  if (sameDir(resolved, home)) {return 'home';}
  if (sameDir(resolved, root)) {return 'root';}
  return null;
}

/** True if dir is the user's home directory or the filesystem root — compared
 *  by identity (device + inode), not by spelling. */
export function isNonProjectRoot(dir: string = process.cwd()): boolean {
  return nonProjectRootKind(dir) !== null;
}

/**
 * Exit 1 with a clear cd instruction if cwd cannot be a project root.
 * Call at the top of commands that create or interview project.faf.
 */
export function assertProjectCwd(dir: string = process.cwd(), command = 'faf'): void {
  const kind = nonProjectRootKind(dir);
  if (kind === null) {return;}

  const where = kind === 'home' ? 'your home directory (~)' : 'the filesystem root';
  console.error(`${fafCyan('faf')}: ${where} is not a project.`);
  console.error('');
  console.error(`  ${bold('cd')} into a real repo (or any folder you mean to own), then run again:`);
  console.error(dim(`    cd /path/to/your-project`));
  console.error(dim(`    ${command}`));
  console.error('');
  console.error(dim('  Home will never be a git repo for this. project.faf belongs with the code.'));
  process.exit(1);
}
