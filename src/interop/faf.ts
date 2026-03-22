import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse, stringify } from 'yaml';
import type { FafData } from '../core/types.js';

/** Read and parse a .faf file */
export function readFaf(path: string): FafData {
  const text = readFileSync(path, 'utf-8');
  return parse(text) as FafData;
}

/** Write a .faf file from data */
export function writeFaf(path: string, data: FafData): void {
  const text = stringify(data, { lineWidth: 0 });
  writeFileSync(path, text, 'utf-8');
}

/** Read raw YAML text from a .faf file */
export function readFafRaw(path: string): string {
  return readFileSync(path, 'utf-8');
}

/** Find the .faf file in a directory (walks up) */
export function findFafFile(dir: string = process.cwd()): string | null {
  const candidates = ['project.faf', '.faf'];
  for (const name of candidates) {
    const full = `${dir}/${name}`;
    if (existsSync(full)) return full;
  }
  // Walk up one level
  const parent = dir.replace(/\/[^/]+$/, '');
  if (parent !== dir) {
    for (const name of candidates) {
      const full = `${parent}/${name}`;
      if (existsSync(full)) return full;
    }
  }
  return null;
}
