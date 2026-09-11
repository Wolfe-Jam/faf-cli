import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { injectFafBlock } from './inject.js';

/** Read MEMORY.md content */
export function readMemoryMd(dir: string): string | null {
  const path = join(dir, 'MEMORY.md');
  if (!existsSync(path)) {return null;}
  return readFileSync(path, 'utf-8');
}

/** Write MEMORY.md — non-destructive: injects/updates the faf block, preserves the rest.
 *  Same managed block (and the same injector) as CLAUDE.md, AGENTS.md and the other writers. */
export function writeMemoryMd(dir: string, content: string): void {
  injectFafBlock(join(dir, 'MEMORY.md'), content);
}
