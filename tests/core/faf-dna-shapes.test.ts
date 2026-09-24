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

/** The shape the ORIGINAL DNA system wrote (2025-09-20 → 2026-05-21): the birth
 *  score is `birthWeight`, not `birthDNA`. Taken from a real file —
 *  gallery-svelte's, born 2025-09-29 at 12%. It declares faf-dna-v1 like every
 *  other, which is exactly why the version string cannot be trusted to tell the
 *  shapes apart. */
const BIRTHWEIGHT_DNA = `${JSON.stringify(
  {
    birthCertificate: {
      born: '2025-09-29T17:26:24.539Z',
      birthWeight: 12,
      birthWeightSource: 'CLAUDE.md',
      projectDNA: '8e26224285285e82',
      authenticated: false,
      certificate: 'FAF-2025-GALLERYS-VNAZ',
    },
    versions: [{ version: 'v1.0.0', timestamp: '2025-09-29T17:26:24.540Z', score: 12 }],
    current: { score: 62, version: 'v1.0.0', lastSync: '2026-09-23T20:00:00.000Z' },
    growth: { totalGrowth: 50, daysActive: 359, milestones: [] },
    lastModified: '2026-09-23T20:00:00.000Z',
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


  test('birthWeight shape: the journey reads, and the file is never rewritten', () => {
    writeFileSync(dnaFile(), BIRTHWEIGHT_DNA);
    const before = statSync(dnaFile());
    const m = new FafDNAManager(dir);

    // It reads: a real birth score of 12% survives a field rename it predates.
    expect(m.load()).not.toBeNull();
    expect(m.getJourney()).toBe('12% → 62%');
    expect(m.getBirthDNADisplay()).toEqual({ current: 62, birthDNA: 12, growth: 50, born: '2025-09-29T17:26:24.539Z' });

    // It is NOT faf's shape, so faf adds nothing to it — reading an old file is
    // the fix; rewriting someone's birth certificate to rename a field is not.
    expect(m.isFafShape()).toBe(false);
    expect(m.recordGrowth(70, ['faf auto'])).toBeNull();
    expect(readFileSync(dnaFile(), 'utf-8')).toBe(BIRTHWEIGHT_DNA);
    expect(statSync(dnaFile()).ino).toBe(before.ino);
  });

  test('a birth certificate with neither birthDNA nor birthWeight still reads as no DNA', () => {
    writeFileSync(dnaFile(), JSON.stringify({ birthCertificate: { born: '2026-01-01T00:00:00.000Z' }, format: 'faf-dna-v1' }));
    expect(new FafDNAManager(dir).load()).toBeNull();
  });


  test('a reset is a rebirth: `faf init --force` keeps the life it ends', () => {
    const first = new FafDNAManager(dir);
    first.birth(12);
    first.recordGrowth(62, ['faf auto']);
    const born = JSON.parse(readFileSync(dnaFile(), 'utf-8')).birthCertificate;

    // The reset.
    const reborn = new FafDNAManager(dir).birth(80);

    expect(reborn.birthCertificate.birthDNA).toBe(80);
    expect(reborn.priorLineage).toHaveLength(1);
    expect(reborn.priorLineage?.[0]).toMatchObject({
      born: born.born,
      birthDNA: 12,
      certificate: born.certificate,
      lastScore: 62, // where it had reached, not where it started
    });
    expect(typeof reborn.priorLineage?.[0].endedAt).toBe('string');
  });

  test('rebirths chain: reset twice and both earlier lives survive, oldest first', () => {
    new FafDNAManager(dir).birth(10);
    new FafDNAManager(dir).birth(40);
    const third = new FafDNAManager(dir).birth(90);

    expect(third.priorLineage?.map((l) => l.birthDNA)).toEqual([10, 40]);
    expect(new FafDNAManager(dir).load()?.priorLineage).toHaveLength(2);
  });

  test('a first birth writes no priorLineage key at all', () => {
    new FafDNAManager(dir).birth(20);
    expect('priorLineage' in JSON.parse(readFileSync(dnaFile(), 'utf-8'))).toBe(false);
  });

  test('a birthWeight file resets without losing its 2025 birth score', () => {
    writeFileSync(dnaFile(), BIRTHWEIGHT_DNA);
    const reborn = new FafDNAManager(dir).birth(62);

    // The shape faf could not even read a commit ago still survives its own reset.
    expect(reborn.priorLineage?.[0]).toMatchObject({
      born: '2025-09-29T17:26:24.539Z',
      birthDNA: 12,
      certificate: 'FAF-2025-GALLERYS-VNAZ',
    });
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
