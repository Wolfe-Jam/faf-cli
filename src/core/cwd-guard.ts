import { homedir } from 'os';
import { resolve } from 'path';
import { bold, dim, fafCyan } from '../ui/colors.js';

/**
 * Home / filesystem root are never a FAF project root.
 * Receipt: stranger ran `faf auto` in ~ and got Trophy DNA for "wolfejam" —
 * funny, not useful. Dev-notes already say `cd your-project`.
 *
 * Hard refuse for writers (auto / init / go / loop). No --force escape:
 * cd is the product.
 */

/** True if dir is the user's home directory or the filesystem root. */
export function isNonProjectRoot(dir: string = process.cwd()): boolean {
  const resolved = resolve(dir);
  const home = resolve(homedir());
  if (resolved === home) {return true;}
  // POSIX root or Windows drive root (C:\ etc.)
  if (resolved === '/' || /^[A-Za-z]:[\\/]?$/.test(resolved)) {return true;}
  return false;
}

/**
 * Exit 1 with a clear cd instruction if cwd cannot be a project root.
 * Call at the top of commands that create or interview project.faf.
 */
export function assertProjectCwd(dir: string = process.cwd(), command = 'faf'): void {
  if (!isNonProjectRoot(dir)) {return;}

  const where = resolve(dir) === resolve(homedir()) ? 'your home directory (~)' : 'the filesystem root';
  console.error(`${fafCyan('faf')}: ${where} is not a project.`);
  console.error('');
  console.error(`  ${bold('cd')} into a real repo (or any folder you mean to own), then run again:`);
  console.error(dim(`    cd /path/to/your-project`));
  console.error(dim(`    ${command}`));
  console.error('');
  console.error(dim('  Home will never be a git repo for this. project.faf belongs with the code.'));
  process.exit(1);
}
