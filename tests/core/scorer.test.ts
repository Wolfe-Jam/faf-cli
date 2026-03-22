import { describe, test, expect } from 'bun:test';
import { enrichScore } from '../../src/core/scorer.js';
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
