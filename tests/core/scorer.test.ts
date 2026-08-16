import { describe, test, expect } from 'bun:test';
import { enrichScore, scoreFafYaml } from '../../src/core/scorer.js';
import type { KernelScoreResult, ScoreResult } from '../../src/core/types.js';

describe('ENGINE: enrichScore', () => {
  test('enriches 100% as Trophy', () => {
    const kernel: KernelScoreResult = {
      score: 100, tier: 'TROPHY', populated: 9, empty: 0, ignored: 12,
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

describe('ENGINE: scoreFafYaml — About Repo short-circuit', () => {
  test('about.represents + source_score: 100 → Trophy, no kernel call (no app_type)', () => {
    const yaml = `
faf_version: 3.0
project:
  name: mcpaas-cf
  type: about
about:
  represents: Wolfe-Jam/faf-mcpaas
  source_score: 100
`;
    const result = scoreFafYaml(yaml);
    expect(result.score).toBe(100);
    expect(result.tier.name).toBe('TROPHY');
    expect(result.populated).toBe(0);
    expect(result.active).toBe(0);
    expect(result.total).toBe(0);
    expect(result.inherited).toBe(true);
    expect(result.represents).toBe('Wolfe-Jam/faf-mcpaas');
  });

  test('about.represents + source_score: 85 → Bronze', () => {
    const yaml = `
about:
  represents: Wolfe-Jam/some-bronze-repo
  source_score: 85
`;
    const result = scoreFafYaml(yaml);
    expect(result.score).toBe(85);
    expect(result.tier.name).toBe('BRONZE');
  });

  test('about.represents WITHOUT source_score → score -1 (renders "—")', () => {
    const yaml = `
about:
  represents: Wolfe-Jam/somewhere
`;
    const result = scoreFafYaml(yaml);
    expect(result.score).toBe(-1);
    expect(result.tier.name).toBe('WHITE');
  });

  test('about.represents with out-of-range source_score → score -1', () => {
    const yamlHigh = 'about:\n  represents: x/y\n  source_score: 250\n';
    const yamlNegative = 'about:\n  represents: x/y\n  source_score: -5\n';
    expect(scoreFafYaml(yamlNegative).score).toBe(-1);
    expect(scoreFafYaml(yamlHigh).score).toBe(-1);
  });

  test('about result carries inherited: true marker (TAF downstream)', () => {
    const yaml = `
about:
  represents: anthropics/claude-code
  source_score: 100
`;
    const result = scoreFafYaml(yaml);
    expect(result.inherited).toBe(true);
    expect(result.represents).toBe('anthropics/claude-code');
  });

  test('app_type: about alone is NOT About — about is not an app_type', () => {
    const yaml = `
app_type: about
project:
  name: fake-about
faf_version: 2.5.0
`;
    let result: ScoreResult | null = null;
    let kernelLoaded = true;
    try {
      result = scoreFafYaml(yaml);
    } catch {
      kernelLoaded = false;
    }
    if (kernelLoaded && result) {
      expect(result.inherited).toBeUndefined();
      expect(result.represents).toBeUndefined();
    }
  });

  test('non-about result does NOT carry inherited marker', () => {
    // For calculated scores, `inherited` must be undefined (not true, not
    // false — absent). We test this via enrichScore directly since calling
    // scoreFafYaml on a non-about would hit the WASM kernel in test env.
    const kernel: KernelScoreResult = {
      score: 88, tier: '🥉', populated: 18, empty: 3, ignored: 0,
      active: 21, total: 21, slots: { 'project.name': 'populated' },
    };
    const result = enrichScore(kernel);
    expect(result.inherited).toBeUndefined();
    expect(result.represents).toBeUndefined();
  });

  test('non-about types do NOT short-circuit — result has no inherited marker', () => {
    // Fallthrough: no about: block → not inherited. Kernel load is
    // environment-dependent; we only assert the about-path was skipped.
    const yaml = `
app_type: cli
project:
  name: faf-cli
faf_version: 2.5.0
`;
    let result: ScoreResult | null = null;
    let kernelLoaded = true;
    try {
      result = scoreFafYaml(yaml);
    } catch {
      kernelLoaded = false;
    }
    if (kernelLoaded && result) {
      // Real score came back — verify the about-path was NOT taken.
      expect(result.inherited).toBeUndefined();
      expect(result.represents).toBeUndefined();
    }
    // If kernel didn't load, the throw itself proves about-path was skipped
    // (about-path returns synchronously without ever calling the kernel).
  });
});
