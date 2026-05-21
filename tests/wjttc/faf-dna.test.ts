/**
 * WJTTC — Birth DNA (the first heartbeat). Restored after it was silently
 * dropped in the v6.0 rewrite; these tests are the guard so it can't vanish again.
 *
 * BRAKE: birth writes an honest certificate + round-trips on disk.
 * ENGINE: growth tracking, the journey display, and loud-not-silent on no-DNA.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { FafDNAManager } from '../../src/core/faf-dna.js';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-dna-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('WJTTC BRAKE: birth DNA — the first heartbeat', () => {
  test('birth() writes a certificate with the honest first score', () => {
    const m = new FafDNAManager(dir);
    const dna = m.birth(24);
    expect(dna.birthCertificate.birthDNA).toBe(24);
    expect(dna.birthCertificate.certificate).toMatch(/^FAF-\d{4}-.+-[A-Z0-9]+$/);
    expect(dna.versions).toHaveLength(1);
    expect(dna.versions[0].version).toBe('v1.0.0');
    expect(m.exists()).toBe(true);
  });

  test('birth(0) is valid — an honest 0% is a real birth', () => {
    expect(new FafDNAManager(dir).birth(0).birthCertificate.birthDNA).toBe(0);
  });

  test('load() round-trips a birthed DNA from disk', () => {
    new FafDNAManager(dir).birth(40);
    expect(new FafDNAManager(dir).load()?.birthCertificate.birthDNA).toBe(40);
  });
});

describe('WJTTC ENGINE: growth + journey', () => {
  test('recordGrowth adds a version + Birth DNA stays immutable', () => {
    const m = new FafDNAManager(dir);
    m.birth(20);
    m.recordGrowth(85, ['faf go']);
    const d = m.load()!;
    expect(d.birthCertificate.birthDNA).toBe(20);
    expect(d.current.score).toBe(85);
    expect(d.versions).toHaveLength(2);
  });

  test('no new version when the score is unchanged', () => {
    const m = new FafDNAManager(dir);
    m.birth(50);
    m.recordGrowth(50, ['noop']);
    expect(m.load()!.versions).toHaveLength(1);
  });

  test('getJourney shows birth → peak ← current after a dip', () => {
    const m = new FafDNAManager(dir);
    m.birth(22);
    m.recordGrowth(99, ['grew']);
    m.recordGrowth(92, ['dipped']);
    const j = m.getJourney();
    expect(j).toContain('22%');
    expect(j).toContain('99%');
    expect(j).toContain('← 92%');
  });

  test('recordGrowth with no DNA returns null (loud, never silent-creates)', () => {
    expect(new FafDNAManager(dir).recordGrowth(50, ['x'])).toBeNull();
  });
});
