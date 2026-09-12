/**
 * WJTTC PIT — the 7.13 re-check's small gates (regression nits).
 *
 *   - legacyStampNote / legacyStampNoteAt were CLI-only: faf-mcp and
 *     claude-faf-mcp call the injector through the package root and could not
 *     print the line `faf sync` prints when faf's block goes on top of older
 *     faf text. They are root exports now.
 *   - isFenceLine was exported from interop/inject.ts but used nowhere and
 *     never public; it is gone.
 *   - `eslint src/**\/*.ts` was not quoted, so npm's sh expanded the glob to
 *     depth 2 and src/cli.ts and src/index.ts were never linted.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as api from '../../src/index.js';
import * as inject from '../../src/interop/inject.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

describe('PIT: the prefix note is a root export', () => {
  test('legacyStampNote and legacyStampNoteAt come from the package root and say what the CLI says', () => {
    expect(typeof api.legacyStampNote).toBe('function');
    expect(typeof api.legacyStampNoteAt).toBe('function');
    const old = '<!-- faf: demo | TypeScript -->\n<!-- faf: claim=project.faf -->\n\n# CLAUDE.md — demo\n';
    expect(api.legacyStampNote('CLAUDE.md', old)).toBe(
      "CLAUDE.md: faf's block is now on top; the old faf text below it is left as you had it — delete it by hand if you no longer want it.",
    );
    const dir = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-note-export-')));
    writeFileSync(join(dir, 'AGENTS.md'), '```\n<!-- faf:start -->\nx\n<!-- faf:end -->\n');
    expect(api.legacyStampNoteAt(join(dir, 'AGENTS.md'), 'AGENTS.md')).toBe(
      "AGENTS.md: faf's block is now on top; an older faf block below sits inside a code fence and is left as you had it — delete it by hand if you no longer want it.",
    );
  });

  test('isFenceLine is no longer exported', () => {
    expect('isFenceLine' in inject).toBe(false);
  });

  test('the lint script quotes its glob, so every file under src/ is linted', () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dir, '../../package.json'), 'utf-8'));
    expect(pkg.scripts.lint).toBe("eslint 'src/**/*.ts'");
  });
});
