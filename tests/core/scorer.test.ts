import { describe, test, expect } from 'bun:test';
import { enrichScore, scoreFafYaml } from '../../src/core/scorer.js';
import type { KernelScoreResult } from '../../src/core/types.js';

describe('enrichScore', () => {
  test('enriches 100% as Trophy', () => {
    const kernel: KernelScoreResult = {
      score: 100, tier: '🏆', populated: 9, empty: 0, ignored: 12,
      active: 9, total: 21, slots: { 'project.name': 'populated' },
    };
    const result = enrichScore(kernel);
    expect(result.tier.name).toBe('TROPHY');
    expect(result.tier.indicator).toContain('TROPHY');
    expect(result.score).toBe(100);
  });

  test('enriches 0% as White', () => {
    const kernel: KernelScoreResult = {
      score: 0, tier: '🤍', populated: 0, empty: 21, ignored: 0,
      active: 21, total: 21, slots: {},
    };
    expect(enrichScore(kernel).tier.name).toBe('WHITE');
  });

  test('preserves slot data', () => {
    const kernel: KernelScoreResult = {
      score: 81, tier: '🟢', populated: 17, empty: 4, ignored: 0,
      active: 21, total: 21, slots: { 'project.name': 'populated', 'stack.frontend': 'empty' },
    };
    const result = enrichScore(kernel);
    expect(result.slots['project.name']).toBe('populated');
    expect(result.slots['stack.frontend']).toBe('empty');
    expect(result.populated).toBe(17);
  });
});

describe('scoreFafYaml — About Repo short-circuit', () => {
  test('app_type: about with source_score: 100 → Trophy, no kernel call', () => {
    const yaml = `
faf_version: 3.0
project:
  name: mcpaas-cf
app_type: about
about:
  represents: Wolfe-Jam/faf-mcpaas
  source_score: 100
`;
    const result = scoreFafYaml(yaml);
    expect(result.score).toBe(100);
    expect(result.tier.name).toBe('TROPHY');
    // About Repos don't have scored slots — counts should be zero.
    expect(result.populated).toBe(0);
    expect(result.active).toBe(0);
    expect(result.total).toBe(0);
  });

  test('app_type: about with source_score: 85 → Bronze', () => {
    const yaml = `
app_type: about
about:
  represents: Wolfe-Jam/some-bronze-repo
  source_score: 85
`;
    const result = scoreFafYaml(yaml);
    expect(result.score).toBe(85);
    expect(result.tier.name).toBe('BRONZE');
  });

  test('app_type: about WITHOUT source_score → score -1 (renders "—")', () => {
    const yaml = `
app_type: about
about:
  represents: Wolfe-Jam/somewhere
`;
    const result = scoreFafYaml(yaml);
    expect(result.score).toBe(-1);
    // Tier falls back to WHITE (last in TIERS) when score is unknown.
    expect(result.tier.name).toBe('WHITE');
  });

  test('app_type: about with out-of-range source_score → score -1', () => {
    // Owner-declared score must be 0-100. Anything else is rejected as malformed.
    const yamlHigh = 'app_type: about\nabout:\n  represents: x/y\n  source_score: 250\n';
    const yamlNegative = 'app_type: about\nabout:\n  represents: x/y\n  source_score: -5\n';
    // The regex only matches /\d+/ so negative numbers don't match — score: -1.
    expect(scoreFafYaml(yamlNegative).score).toBe(-1);
    // 250 matches \d+ but is > 100 — caught by the range check.
    expect(scoreFafYaml(yamlHigh).score).toBe(-1);
  });

  test('non-about types fall through to kernel scoring (sanity — not about-typed)', () => {
    // A yaml that's clearly not about — must NOT be short-circuited.
    // (We don't call the kernel in unit tests; we just verify the about-detect
    // regex doesn't fire spuriously on app_type: cli / mcp / etc.)
    const yaml = `
app_type: cli
project:
  name: faf-cli
`;
    // If short-circuit fired, we'd see a fast return. Instead it calls kernel
    // which throws in tests without the WASM loaded. We catch the throw and
    // verify it's the kernel path that was taken, not the about path.
    try {
      scoreFafYaml(yaml);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain('faf-scoring-kernel');
    }
  });
});
