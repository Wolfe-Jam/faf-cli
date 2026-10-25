/**
 * ENGINE: a type that adds slots by name (APP_TYPE_ADDS) gets them, whatever
 * the file had there. `skills-plugin` adds framework and runtime (14 slots).
 *
 * Before: `faf init` on a skills repo writes `slotignored` into framework and
 * runtime (it detects `library`); after `type: skills-plugin` + `faf auto`
 * the file kept them and scored out of 12 (independent review, 2026-10-25).
 * Other types keep the file's own `slotignored`: that rule is unchanged.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { updateExistingFaf } from '../../src/detect/assemble.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

function repo(): string {
  return realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-skills-plugin-')));
}

const stackOf = (faf: Record<string, unknown>) => faf.stack as Record<string, unknown>;

describe('ENGINE: skills-plugin opens the slots it adds', () => {
  test('a slotignored framework and runtime open as empty slots', () => {
    const out = updateExistingFaf(repo(), {
      project: { name: 'demo', type: 'skills-plugin' },
      stack: { frontend: 'slotignored', runtime: 'slotignored', database: 'slotignored' },
    });
    expect(stackOf(out).frontend).toBe('');
    expect(stackOf(out).runtime).toBe('');
    expect(stackOf(out).database).toBe('slotignored');
  });

  test('a real value under the other name stays, and the stale name goes', () => {
    const out = updateExistingFaf(repo(), {
      project: { name: 'demo', type: 'skills-plugin' },
      stack: { frontend: 'slotignored', framework: 'Claude Code Skills', runtime: 'Node.js' },
    });
    expect(stackOf(out).framework).toBe('Claude Code Skills');
    expect('frontend' in stackOf(out)).toBe(false);
    expect(stackOf(out).runtime).toBe('Node.js');
  });

  test('other types keep the file\'s own slotignored', () => {
    const out = updateExistingFaf(repo(), {
      project: { name: 'demo', type: 'mcp' },
      stack: { runtime: 'slotignored' },
    });
    expect(stackOf(out).runtime).toBe('slotignored');
  });
});
