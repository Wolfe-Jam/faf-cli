/**
 * BRAKE: `faf memory convert` never writes a new soul over one that is there —
 * adversarial #6.
 *
 * convert builds a whole new soul from Claude Code's memory folder and saved
 * it to ./soul.fafm (or -o), replacing a hand-kept soul outright: its curated
 * index, bare-string facts and comments were gone (t-soul S17). It now refuses
 * when the output exists, as `faf init` does for project.faf, unless --force
 * is given.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { parse } from 'yaml';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const CLAUDE_MEM = join(import.meta.dir, '../fixtures/claude-memory');
// t-soul's hand-kept soul (S01/S17).
const HAND = `# soul.fafm — hand-kept (SOUL-HEAD-COMMENT)
version: 2.0
namepoint: '@me'
index:
  - HAND-INDEX-1 the payments rule
memory:
  facts:
    - a bare string fact (BARE-FACT)
`;

const tmp = (): string => realpathSync(mkdtempSync(join(tmpdir(), 'faf-convert-')));
const convert = (cwd: string, args: string[]) =>
  spawnSync(process.execPath, [CLI, 'memory', 'convert', CLAUDE_MEM, ...args], {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, HOME: tmp(), NO_COLOR: '1' },
  });

describe('BRAKE: faf memory convert refuses an existing soul unless --force (t-soul S17)', () => {
  test('./soul.fafm exists: exit 1, the init-style message, the soul byte for byte', () => {
    const dir = tmp();
    writeFileSync(join(dir, 'soul.fafm'), HAND);
    const r = convert(dir, []);
    expect(r.status).toBe(1);
    expect(r.stderr.replace(/\x1b\[[0-9;]*m/g, '').trim()).toBe('soul.fafm already exists. Use --force to overwrite.');
    expect(readFileSync(join(dir, 'soul.fafm'), 'utf-8')).toBe(HAND);
  });

  test('-o names an existing file: refused the same way, naming it', () => {
    const dir = tmp();
    writeFileSync(join(dir, 'team.fafm'), HAND);
    const r = convert(dir, ['-o', 'team.fafm']);
    expect(r.status).toBe(1);
    expect(r.stderr.replace(/\x1b\[[0-9;]*m/g, '').trim()).toBe('team.fafm already exists. Use --force to overwrite.');
    expect(readFileSync(join(dir, 'team.fafm'), 'utf-8')).toBe(HAND);
  });

  test('--force converts over it; a new output is written without --force', () => {
    const dir = tmp();
    writeFileSync(join(dir, 'soul.fafm'), HAND);
    const forced = convert(dir, ['--force']);
    expect(forced.status).toBe(0);
    const doc = parse(readFileSync(join(dir, 'soul.fafm'), 'utf-8'));
    expect(doc.memory.facts.map((f: { id: string }) => f.id).sort()).toEqual(['good-feedback', 'good-project', 'name-only-slug']);

    const fresh = tmp();
    expect(convert(fresh, []).status).toBe(0);
    expect(parse(readFileSync(join(fresh, 'soul.fafm'), 'utf-8')).memory.facts).toHaveLength(3);
  });
});
