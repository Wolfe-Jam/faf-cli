import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/** Read MEMORY.md content */
export function readMemoryMd(dir: string): string | null {
  const path = join(dir, 'MEMORY.md');
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

/** Write MEMORY.md content */
export function writeMemoryMd(dir: string, content: string): void {
  writeFileSync(join(dir, 'MEMORY.md'), content, 'utf-8');
}
