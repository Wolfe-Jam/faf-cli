import { existsSync } from 'fs';
import { join } from 'path';
import { injectFafBlock } from './inject.js';
import { FAF_CONTEXT_FILES, readUtf8, resolveInside } from '../core/safe-write.js';

const MEMORY_MD = FAF_CONTEXT_FILES.memory;

/** Read MEMORY.md content. A MEMORY.md link that leaves the directory, or
 *  leads to a file that is not an AI context file, is refused (SafePathError)
 *  and nothing is read; so is a MEMORY.md that is not UTF-8. */
export function readMemoryMd(dir: string): string | null {
  const path = join(dir, MEMORY_MD);
  if (!existsSync(path)) {return null;}
  return readUtf8(resolveInside(dir, MEMORY_MD));
}

/** Write MEMORY.md — non-destructive: injects/updates the faf block, preserves the rest.
 *  Same managed block (and the same injector) as CLAUDE.md, AGENTS.md and the other writers. */
export function writeMemoryMd(dir: string, content: string): void {
  injectFafBlock(join(dir, MEMORY_MD), content);
}
