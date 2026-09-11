/**
 * BRAKE: the owner rule, round 3 (R3a.4-R3a.7) — the re-check's cases, fixed
 * at the source:
 *
 *   Y52  `faf auto` rewrote a hand-written `database: None # deliberate …` to
 *        `slotignored`. Q8, FINAL: a typed none is an empty slot — with no
 *        repo fact its words stay byte for byte, a fact fills it, and it
 *        scores as empty (never as slotignored).
 *   D08/D10  a peak or current milestone relabelled by hand was replaced by
 *        faf's "Peak" / "Current" on the next growth.
 *   T03/T04/T08  a chmod made while faf was writing was undone (the rename
 *        brought back the old mode), and a file made read-only was replaced.
 *   T11  a Soul (or a .faf-dna birth) made with no file wrote over a file
 *        that appeared after the caller found none.
 */
import { describe, test, expect, spyOn } from 'bun:test';
import * as fs from 'fs';
import { chmodSync, existsSync, mkdtempSync, readFileSync, realpathSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { SafePathError, safeWriteFile } from '../../src/core/safe-write.js';
import { injectFafBlock } from '../../src/interop/inject.js';
import { updateFafFile } from '../../src/interop/faf.js';
import { writeGrokConfig } from '../../src/interop/grok.js';
import { FafDNAManager } from '../../src/core/faf-dna.js';
import { Soul } from '../../src/fafm/soul.js';
import { scoreFafYaml } from '../../src/core/scorer.js';

const posix = process.platform !== 'win32';
const CLI = join(import.meta.dir, '../../src/cli.ts');
const tmp = (tag = 'r3'): string => realpathSync(mkdtempSync(join(tmpdir(), `faf-${tag}-`)));
const mode = (p: string): string => (statSync(p).mode & 0o777).toString(8);
const run = (cwd: string, args: string[]) =>
  spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf-8', env: { ...process.env, HOME: tmp('home'), NO_COLOR: '1' } });

function changed(fn: () => unknown): SafePathError {
  try {
    fn();
  } catch (e) {
    if (e instanceof SafePathError && e.reason === 'changed') {return e;}
    throw new Error(`expected a 'changed' refusal, got: ${e instanceof Error ? e.message : String(e)}`);
  }
  throw new Error("expected a 'changed' refusal, but the write went through");
}

/** Run `fn`; while it flushes its temp file (after it read the target and
 *  before the rename) run `during` once. */
function inWindow(during: () => void, fn: () => unknown): unknown {
  const real = fs.fsyncSync;
  const spy = spyOn(fs, 'fsyncSync').mockImplementationOnce((fd: number) => {
    real(fd);
    during();
  });
  try {
    return fn();
  } finally {
    spy.mockRestore();
  }
}

describe('BRAKE: Q8 — a typed None / N/A is an empty slot: no fact keeps the words, a fact fills it (Y52)', () => {
  test('faf auto: `database: None # …` (no fact) stays byte for byte; `backend: N/A` takes the fact (Express)', () => {
    const d = tmp('q8');
    writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'demo', dependencies: { react: '^18.0.0', pg: '^8', express: '^4' } }));
    writeFileSync(join(d, 'vercel.json'), '{}\n');
    const text = 'project:\n  name: demo\n  goal: Old goal\nstack:\n  database: None # deliberate: stateless (NONE-COMMENT)\n  backend: N/A\n';
    writeFileSync(join(d, 'project.faf'), text);
    const r = run(d, ['auto']);
    expect(r.status).toBe(0);
    const lines = readFileSync(join(d, 'project.faf'), 'utf-8').split('\n');
    // No repo fact for the database: the typed words stay, never `slotignored`.
    // A repo fact for the backend (express): it fills the slot in place.
    expect(lines.filter(l => /^ {2}(database|backend):/.test(l))).toEqual(['  database: None # deliberate: stateless (NONE-COMMENT)', '  backend: Express']);
    // The app-type (fullstack) needs a database, so faf auto says so, once.
    const hint = "stack.database says 'None' — this app-type needs it, so it counts as empty until filled.";
    expect(r.stdout.replace(/\x1b\[[0-9;]*m/g, '').split('\n').filter(l => l.trim() === hint)).toHaveLength(1);
  });

  test('scoring reads None / N/A / not applicable at a slot as an empty slot — the same score as the empty value, below 100', () => {
    const base = (v: string) => `project:\n  name: demo\n  goal: g\n  main_language: TypeScript\n  type: fullstack\nstack:\n  frontend: React\n  database: ${v}\n`;
    const empty = scoreFafYaml(base('""'));
    expect(empty.slots['stack.database']).toBe('empty');
    for (const v of ['None', 'N/A', 'not applicable', '"none"']) {
      const r = scoreFafYaml(base(v));
      expect(r.slots['stack.database']).toBe('empty');
      expect([r.score, r.active, r.ignored, r.empty]).toEqual([empty.score, empty.active, empty.ignored, empty.empty]);
      expect(r.score).toBeLessThan(100);
    }
    // Only the app-type's word takes a slot out.
    expect(scoreFafYaml(base('slotignored')).slots['stack.database']).toBe('slotignored');
  });
});

describe('BRAKE: .faf-dna — a relabelled peak or current milestone is the user\'s text (D08, D10)', () => {
  const NOW = '2026-01-01T00:00:00.000Z';
  const dna = (extra: object[]) => `${JSON.stringify({
    birthCertificate: { born: NOW, birthDNA: 20, birthDNASource: 'init', projectDNA: 'abc', certificate: 'C' },
    versions: [{ version: 'v1.0.0', timestamp: NOW, score: 20, changes: ['Birth'], growth: 0 }],
    current: { version: 'v1.0.0', score: 20, lastSync: NOW },
    growth: { totalGrowth: 0, daysActive: 0, milestones: [{ type: 'birth', score: 20, date: NOW, version: 'v1.0.0', label: 'Birth', emoji: '🐣' }, ...extra] },
    lastModified: NOW,
    format: 'faf-dna-v1',
  }, null, 2)}\n`;

  for (const [id, m] of [
    ['D10', { type: 'peak', score: 30, date: NOW, version: 'v1.0.0', label: 'Launch day (HAND-PEAK-LABEL)', emoji: '🚀' }],
    ['D08', { type: 'current', score: 20, date: NOW, version: 'v1.0.0', label: 'HAND-CURRENT-LABEL', emoji: '📍' }],
    ['emoji', { type: 'peak', score: 30, date: NOW, version: 'v1.0.0', label: 'Peak', emoji: '⛰' }],
  ] as const) {
    test(`${id}: growth is not recorded, the file stays byte for byte, and faf says why`, () => {
      const d = tmp('dna');
      const text = dna([m]);
      writeFileSync(join(d, '.faf-dna'), text);
      const mgr = new FafDNAManager(d);
      expect(mgr.recordGrowth(45, ['t'])).toBeNull();
      expect(readFileSync(join(d, '.faf-dna'), 'utf-8')).toBe(text);
      expect(mgr.readOnlyReason()).toBe('.faf-dna has a label or emoji of yours on a milestone faf would replace (the peak or current one): faf reads it and leaves it as it is.');
      // The same file with faf's own Peak / Current still grows.
      const own = tmp('dna');
      writeFileSync(join(own, '.faf-dna'), dna([{ ...m, label: m.type === 'peak' ? 'Peak' : 'Current', emoji: m.type === 'peak' ? '🏔️' : '📍' }]));
      expect(new FafDNAManager(own).recordGrowth(45, ['t'])).not.toBeNull();
      const grown = JSON.parse(readFileSync(join(own, '.faf-dna'), 'utf-8')).growth.milestones.find((x: { type: string }) => x.type === m.type);
      expect([grown.score, grown.label]).toEqual([45, m.type === 'peak' ? 'Peak' : 'Current']);
    });
  }
});

describe('BRAKE: a mode change in the write window is kept, never undone (T03, T04, T08)', () => {
  test.skipIf(!posix)('T03 injectFafBlock: chmod 600 while faf writes → refused, the user\'s mode stays', () => {
    const d = tmp();
    const f = join(d, 'CLAUDE.md');
    writeFileSync(f, '# notes\nHAND\n');
    chmodSync(f, 0o644);
    changed(() => inWindow(() => chmodSync(f, 0o600), () => injectFafBlock(f, 'NEW')));
    expect(mode(f)).toBe('600');
    expect(readFileSync(f, 'utf-8')).toBe('# notes\nHAND\n');
  });

  test.skipIf(!posix)('T04 injectFafBlock: made read-only while faf writes → refused, not replaced', () => {
    const d = tmp();
    const f = join(d, 'CLAUDE.md');
    writeFileSync(f, '# notes\nHAND\n');
    chmodSync(f, 0o644);
    changed(() => inWindow(() => chmodSync(f, 0o444), () => injectFafBlock(f, 'NEW')));
    expect(mode(f)).toBe('444');
    expect(readFileSync(f, 'utf-8')).toBe('# notes\nHAND\n');
    chmodSync(f, 0o644);
  });

  test.skipIf(!posix)('T08 updateFafFile: chmod 600 while faf writes → refused, the mode stays', () => {
    const d = tmp();
    const p = join(d, 'project.faf');
    writeFileSync(p, 'project:\n  name: demo\n  goal: Old\n');
    chmodSync(p, 0o644);
    changed(() => inWindow(() => chmodSync(p, 0o600), () => updateFafFile(p, doc => doc.setIn(['project', 'goal'], 'NEW'))));
    expect(mode(p)).toBe('600');
    expect(readFileSync(p, 'utf-8')).toContain('goal: Old');
  });

  test.skipIf(!posix)('a write with no byte check (safeWriteFile without expect) is refused the same way', () => {
    const d = tmp();
    const f = join(d, 'notes.md');
    writeFileSync(f, 'one\n');
    chmodSync(f, 0o640);
    const e = changed(() => inWindow(() => chmodSync(f, 0o600), () => safeWriteFile(f, 'two\n')));
    expect(e.message).toBe(`${f} changed on disk while faf was writing — not written; original kept`);
    expect([mode(f), readFileSync(f, 'utf-8')]).toEqual(['600', 'one\n']);
  });
});

describe('BRAKE: a Soul or a .faf-dna made with no file never writes over one that appeared (T11)', () => {
  test('T11 a new Soul saved where a soul.fafm appeared meanwhile → refused, the hand soul kept', () => {
    const d = tmp();
    const p = join(d, 'soul.fafm');
    const s = new Soul('@local', { profile: 'knowledge' });
    s.etch('CLI-ETCHED');
    const hand = '# hand soul (APPEARED)\nnamepoint: "@me"\nmemory:\n  facts:\n    - HAND-FACT\n';
    writeFileSync(p, hand); // after the caller found no file, before the save
    changed(() => s.toFile(p, { reindex: true }));
    expect(readFileSync(p, 'utf-8')).toBe(hand);
    // The explicit overwrite still works…
    s.save(p, { replace: true });
    expect(readFileSync(p, 'utf-8')).toContain('CLI-ETCHED');
    // …and with no file there, a new soul is simply written.
    const q = join(d, 'fresh.fafm');
    new Soul('@x').save(q);
    expect(existsSync(q)).toBe(true);

    // `faf memory convert --force` is that explicit overwrite on the CLI.
    const c = tmp('conv');
    const mem = join(c, 'mem');
    fs.mkdirSync(mem);
    writeFileSync(join(mem, 'MEMORY.md'), '- [one](one.md) — first fact\n');
    writeFileSync(join(mem, 'one.md'), '---\nname: one\ntype: project\n---\nFirst fact body.\n');
    writeFileSync(join(c, 'soul.fafm'), 'namepoint: "@old"\n');
    expect(run(c, ['memory', 'convert', 'mem']).status).toBe(1);
    expect(readFileSync(join(c, 'soul.fafm'), 'utf-8')).toBe('namepoint: "@old"\n');
    expect(run(c, ['memory', 'convert', 'mem', '--force']).status).toBe(0);
    expect(readFileSync(join(c, 'soul.fafm'), 'utf-8')).not.toBe('namepoint: "@old"\n');
  });

  test('a loaded soul saved to another path does not write over a file there', () => {
    const d = tmp();
    const a = join(d, 'a.fafm');
    const b = join(d, 'b.fafm');
    writeFileSync(a, 'namepoint: "@me"\nmemory:\n  facts:\n    - A\n');
    writeFileSync(b, 'namepoint: "@other"\n# HAND-B\n');
    const s = Soul.load(a);
    s.etch('NEW');
    changed(() => s.save(b));
    expect(readFileSync(b, 'utf-8')).toBe('namepoint: "@other"\n# HAND-B\n');
  });

  test('FafDNAManager: no .faf-dna at exists(), one appears before birth → refused, kept', () => {
    const d = tmp();
    const mgr = new FafDNAManager(d);
    expect(mgr.exists()).toBe(false);
    writeFileSync(join(d, '.faf-dna'), '{"hand": "HAND-DNA"}\n');
    changed(() => mgr.birth(42));
    expect(readFileSync(join(d, '.faf-dna'), 'utf-8')).toBe('{"hand": "HAND-DNA"}\n');
    // With a .faf-dna there from the start, birth is the explicit fresh lineage (faf init --force).
    const again = new FafDNAManager(d);
    expect(again.exists()).toBe(true);
    again.birth(42);
    expect(JSON.parse(readFileSync(join(d, '.faf-dna'), 'utf-8')).birthCertificate.birthDNA).toBe(42);
  });

  test('writeGrokConfig: a config.toml that appears while faf creates one is kept', () => {
    const d = tmp('grok');
    const p = join(d, '.grok', 'config.toml');
    changed(() => inWindow(() => writeFileSync(p, '# HAND-GROK\n'), () => writeGrokConfig(d)));
    expect(readFileSync(p, 'utf-8')).toBe('# HAND-GROK\n');
  });
});
