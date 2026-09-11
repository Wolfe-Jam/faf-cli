/**
 * WJTTC BRAKE — FafDNAManager is public, and a .faf-dna in another tool's
 * shape never crashes faf and is never rewritten (#20).
 *
 * claude-faf-mcp's faf_dna wrote .faf-dna as { birthCertificate, current,
 * milestones, format } — no versions, no growth. Committed to a repo, that one
 * file made `faf auto` exit 1 ("reading 'length'" in recordGrowth) after it had
 * already rewritten project.faf, and `faf dna` exit 1 ("reading 'milestones'")
 * for every contributor. Now reads never throw, and growth is added only to a
 * file in faf's own shape — the other shape is left byte for byte.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { FafDNAManager } from '../../src/core/faf-dna.js';
import * as api from '../../src/index.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const posix = process.platform !== 'win32';

/** The exact shape claude-faf-mcp 5.x's faf_dna wrote. */
const CFM_DNA = `${JSON.stringify(
  {
    birthCertificate: {
      born: '2026-08-01T10:00:00.000Z',
      birthDNA: 30,
      birthDNASource: 'auto',
      authenticated: false,
      certificate: 'FAF-2026-DEMO-AB12',
    },
    current: { score: 42, version: 'v1.0.0', lastSync: '2026-08-02T10:00:00.000Z' },
    milestones: [{ type: 'birth', score: 30, date: '2026-08-01T10:00:00.000Z', version: 'v1.0.0' }],
    format: 'faf-dna-v1',
  },
  null,
  2,
)}`;

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-dna-shapes-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const dnaFile = (): string => join(dir, '.faf-dna');

describe('BRAKE: FafDNAManager and its types are public', () => {
  test('exported from the package index', () => {
    expect(api.FafDNAManager).toBe(FafDNAManager);
    const m = new api.FafDNAManager(dir);
    expect(m.exists()).toBe(false);
    const born = m.birth(20);
    expect(born.birthCertificate.birthDNA).toBe(20);
    expect(new api.FafDNAManager(dir).getJourney()).toBe('20%');
  });
});

describe('BRAKE: a .faf-dna in another shape is read, never rewritten', () => {
  test('claude-faf-mcp shape: the journey reads; growth writes nothing', () => {
    writeFileSync(dnaFile(), CFM_DNA);
    const before = statSync(dnaFile());
    const m = new FafDNAManager(dir);

    expect(m.load()).not.toBeNull();
    expect(m.isFafShape()).toBe(false);
    expect(m.getJourney()).toBe('30% → 42%');
    expect(m.getBirthDNADisplay()).toEqual({ current: 42, birthDNA: 30, growth: 12, born: '2026-08-01T10:00:00.000Z' });
    expect(m.getLog()).toEqual([]);

    expect(m.recordGrowth(55, ['faf auto'])).toBeNull();
    expect(readFileSync(dnaFile(), 'utf-8')).toBe(CFM_DNA);
    expect(statSync(dnaFile()).ino).toBe(before.ino);
  });

  test('faf\'s own shape still grows, and an extra key in it is kept', () => {
    const m = new FafDNAManager(dir);
    m.birth(20);
    const onDisk = JSON.parse(readFileSync(dnaFile(), 'utf-8'));
    onDisk.team_note = 'kept';
    // Exactly faf's own text (2-space JSON and a final newline): faf may add to it.
    writeFileSync(dnaFile(), `${JSON.stringify(onDisk, null, 2)}\n`);

    const again = new FafDNAManager(dir);
    expect(again.isFafShape()).toBe(true);
    const grown = again.recordGrowth(50, ['faf auto']);
    expect(grown?.current.score).toBe(50);
    const after = JSON.parse(readFileSync(dnaFile(), 'utf-8'));
    expect(after.versions.map((v: { score: number }) => v.score)).toEqual([20, 50]);
    expect(after.team_note).toBe('kept');
    expect(new FafDNAManager(dir).getJourney()).toBe('20% → 50%');
  });

  test('not JSON, a list, a scalar, or no birth certificate: reads as no DNA, never throws', () => {
    for (const body of ['{not json', '[1,2]', '42', '{"current":{"score":5}}', 'null']) {
      writeFileSync(dnaFile(), body);
      const m = new FafDNAManager(dir);
      expect(m.load()).toBeNull();
      expect(m.getJourney()).toBe('');
      expect(m.getLog()).toEqual([]);
      expect(m.getBirthDNADisplay()).toBeNull();
      expect(m.recordGrowth(10, ['x'])).toBeNull();
      expect(readFileSync(dnaFile(), 'utf-8')).toBe(body);
    }
  });

  test.skipIf(!posix)('a .faf-dna link that leaves the project is not read', () => {
    const outside = mkdtempSync(join(tmpdir(), 'faf-dna-outside-'));
    try {
      writeFileSync(join(outside, 'lineage.json'), CFM_DNA);
      symlinkSync(join(outside, 'lineage.json'), dnaFile());
      expect(new FafDNAManager(dir).load()).toBeNull();
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});

describe('BRAKE: the CLI on a claude-faf-mcp .faf-dna', () => {
  const project = (): void => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo', description: 'A demo service' }));
    writeFileSync(dnaFile(), CFM_DNA);
  };

  test('faf auto exits 0 and leaves the .faf-dna byte for byte', () => {
    project();
    const r = spawnSync('bun', [CLI, 'auto'], { cwd: dir, encoding: 'utf-8' });
    expect(r.stderr).not.toContain('TypeError');
    expect(r.status).toBe(0);
    expect(readFileSync(dnaFile(), 'utf-8')).toBe(CFM_DNA);
  });

  test('faf dna shows the journey and says the file is left as it is', () => {
    project();
    const r = spawnSync('bun', [CLI, 'dna'], { cwd: dir, encoding: 'utf-8' });
    expect(r.stderr).not.toContain('TypeError');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('30% → 42%');
    expect(r.stdout).toContain("not in faf's shape");
    expect(readFileSync(dnaFile(), 'utf-8')).toBe(CFM_DNA);
  });
});
