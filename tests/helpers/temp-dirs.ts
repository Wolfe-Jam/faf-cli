/**
 * Temp folders a test suite makes, removed when the suite ends — so a full
 * `bun test` leaves nothing in TMPDIR. Use it as:
 *
 *   const temp = tempDirs();
 *   afterAll(() => temp.removeAll());
 *   const dir = temp.mkdtemp(join(tmpdir(), 'faf-x-'));
 *
 * A folder a test left without write or search permission (a read-only
 * fixture) is made writable again before it is removed.
 */
import { chmodSync, lstatSync, mkdtempSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';

/** Give every folder under `dir` (itself included) owner read, write and search. */
function unlock(dir: string): void {
  try {
    if (!lstatSync(dir).isDirectory()) {return;}
    chmodSync(dir, 0o700);
    for (const name of readdirSync(dir)) {unlock(join(dir, name));}
  } catch {
    // gone already, or not ours to change: rmSync says so below
  }
}

export interface TempDirs {
  /** mkdtempSync(prefix), remembered for removeAll. */
  mkdtemp(prefix: string): string;
  /** Remove every folder mkdtemp made (and everything in it). */
  removeAll(): void;
}

export function tempDirs(): TempDirs {
  const made: string[] = [];
  return {
    mkdtemp(prefix: string): string {
      const dir = mkdtempSync(prefix);
      made.push(dir);
      return dir;
    },
    removeAll(): void {
      for (const dir of made.splice(0)) {
        try {
          rmSync(dir, { recursive: true, force: true });
        } catch {
          unlock(dir);
          rmSync(dir, { recursive: true, force: true });
        }
      }
    },
  };
}
