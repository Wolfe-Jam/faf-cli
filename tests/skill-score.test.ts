/**
 * WJTTC skill-scorer — the static-grade + safety-gate suite, pointed at inline skills.
 * Ported from faf-skill-scorer/test.mjs. Writes each skill to a fresh temp dir, then
 * runs loadSkill + runSuite (the same path `faf skill-score` runs).
 */

import { describe, test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { loadSkill, runSuite } from '../src/skill-score/index.js';
import type { ScorerOutput } from '../src/skill-score/index.js';

/** Score an inline skill: name → temp dir + frontmatter name; body; optional fm + bundled files. */
function score(
  name: string,
  body: string,
  opts: { fm?: Record<string, string>; files?: Record<string, string> } = {},
): ScorerOutput {
  const sdir = join(mkdtempSync(join(tmpdir(), 'wjttc-skill-')), name);
  mkdirSync(sdir, { recursive: true });
  const front: Record<string, string> = { name, description: 'Use this to score a thing.', ...(opts.fm ?? {}) };
  const fmText = Object.entries(front).map(([k, v]) => `${k}: ${v}`).join('\n');
  writeFileSync(join(sdir, 'SKILL.md'), `---\n${fmText}\n---\n\n${body}\n`);
  for (const [p, c] of Object.entries(opts.files ?? {})) {
    const fp = join(sdir, p);
    mkdirSync(dirname(fp), { recursive: true });
    writeFileSync(fp, c);
  }
  return runSuite(loadSkill(sdir));
}

/** Pull a single rule's verdict from a result. */
function verdict(res: ScorerOutput, id: string): string {
  const row = ['BRAKE', 'AERO', 'PIT']
    .flatMap((m) => res.modScores[m]?.rows ?? [])
    .find((r) => r.id === id);
  return row?.verdict ?? 'missing';
}

describe('WJTTC BRAKE: safety gate', () => {
  test('(b) ghost command (faf vibe in a code block) → fatal + safety fail', () => {
    const r = score('demo', 'Run this:\n\n```sh\nfaf vibe\n```\n');
    expect(verdict(r, 'brake.ghost-cli')).toBe('fail');
    expect(r.fatal).toBe(true);
    expect(r.gates.safety).toBe('fail');
  });

  test('(c) the banned word "Guaranteed" → fatal', () => {
    const r = score('demo', 'This is Guaranteed to work.');
    expect(verdict(r, 'brake.banned-guarantee')).toBe('fail');
    expect(r.fatal).toBe(true);
  });

  test('(d) a fabrication instruction ("use a sensible default") → fatal', () => {
    const r = score('demo', 'If you do not know a value, use a sensible professional default.');
    expect(verdict(r, 'brake.fabrication-instruction')).toBe('fail');
    expect(r.fatal).toBe(true);
  });

  test('(e) a bare achievement 🏆 → fatal', () => {
    const r = score('demo', 'Get to 100% 🏆 today.');
    expect(verdict(r, 'brake.surface-mark')).toBe('fail');
    expect(r.fatal).toBe(true);
  });

  test('(f) the honest inverse ("never invents · empty beats wrong") → NOT fatal', () => {
    const r = score(
      'demo',
      'The AI only seeds facts literally stated — it never invents. What it cannot source it leaves empty. Empty beats wrong.',
    );
    expect(verdict(r, 'brake.fabrication-instruction')).toBe('pass');
    expect(r.fatal).toBe(false);
  });
});

describe('WJTTC: gate model + grade', () => {
  test('(a) a clean lean skill scores grade>0 and is not fatal', () => {
    const r = score('demo', 'Use `faf score` to check. Get to 100% ✪.', { fm: { license: 'MIT' } });
    expect(r.fatal).toBe(false);
    expect(r.grade).toBeGreaterThan(0);
    expect(r.gates.safety).toBe('pass');
  });

  test('activation gate is always PENDING in the CLI (no agent harness)', () => {
    const r = score('demo', 'Use `faf score` to check.');
    expect(r.gates.activation).toBe('pending');
    expect(r.flies).toBe(false); // pending activation → can never fly here
  });

  test('a perfect-but-pending skill is locked: grade can be 100 yet flies=false', () => {
    const r = score('demo', 'Use `faf score` to check. Get to 100% ✪.', { fm: { license: 'MIT' } });
    expect(r.grade).toBe(100);
    expect(r.flies).toBe(false);
    expect(r.tier.name).toBe('TROPHY');
    expect(r.tier.symbol).toBe('✪'); // work-surface mark, never 🏆
  });

  test('a clean all-real CLI skill earns "beat" on ghost-cli', () => {
    const r = score('demo', 'Run `faf score` then `faf sync`.');
    expect(verdict(r, 'brake.ghost-cli')).toBe('beat');
  });
});
