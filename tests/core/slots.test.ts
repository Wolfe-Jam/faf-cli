import { describe, test, expect } from 'bun:test';
import {
  SLOTS,
  BASE_SLOTS,
  ENTERPRISE_SLOTS,
  SLOT_BY_PATH,
  slotsByCategory,
  isPlaceholder,
  APP_TYPE_CATEGORIES,
} from '../../src/core/slots.js';

describe('SLOTS', () => {
  test('has 33 slots total', () => {
    expect(SLOTS).toHaveLength(33);
  });

  test('indices are 1-33', () => {
    expect(SLOTS[0].index).toBe(1);
    expect(SLOTS[32].index).toBe(33);
    const indices = SLOTS.map(s => s.index);
    expect(new Set(indices).size).toBe(33);
  });

  test('all paths are unique', () => {
    const paths = SLOTS.map(s => s.path);
    expect(new Set(paths).size).toBe(33);
  });

  test('all paths are dot-notation', () => {
    for (const s of SLOTS) {
      expect(s.path).toMatch(/^[a-z_]+\.[a-z_]+$/);
    }
  });
});

describe('BASE_SLOTS', () => {
  test('has 21 slots', () => {
    expect(BASE_SLOTS).toHaveLength(21);
  });

  test('only contains slots 1-21', () => {
    for (const s of BASE_SLOTS) {
      expect(s.index).toBeLessThanOrEqual(21);
    }
  });
});

describe('ENTERPRISE_SLOTS', () => {
  test('has 33 slots', () => {
    expect(ENTERPRISE_SLOTS).toHaveLength(33);
  });
});

describe('SLOT_BY_PATH', () => {
  test('finds project.name', () => {
    expect(SLOT_BY_PATH.get('project.name')?.index).toBe(1);
  });

  test('finds monorepo.remote_cache', () => {
    expect(SLOT_BY_PATH.get('monorepo.remote_cache')?.index).toBe(33);
  });
});

describe('slotsByCategory', () => {
  test('project has 3 slots', () => {
    expect(slotsByCategory('project')).toHaveLength(3);
  });

  test('human has 6 slots', () => {
    expect(slotsByCategory('human')).toHaveLength(6);
  });

  test('frontend has 4 slots', () => {
    expect(slotsByCategory('frontend')).toHaveLength(4);
  });

  test('backend has 5 slots', () => {
    expect(slotsByCategory('backend')).toHaveLength(5);
  });

  test('universal has 3 slots', () => {
    expect(slotsByCategory('universal')).toHaveLength(3);
  });

  test('enterprise_infra has 5 slots', () => {
    expect(slotsByCategory('enterprise_infra')).toHaveLength(5);
  });

  test('enterprise_app has 4 slots', () => {
    expect(slotsByCategory('enterprise_app')).toHaveLength(4);
  });

  test('enterprise_ops has 3 slots', () => {
    expect(slotsByCategory('enterprise_ops')).toHaveLength(3);
  });

  test('category counts sum to 33', () => {
    const categories = ['project', 'human', 'frontend', 'backend', 'universal', 'enterprise_infra', 'enterprise_app', 'enterprise_ops'] as const;
    const total = categories.reduce((sum, c) => sum + slotsByCategory(c).length, 0);
    expect(total).toBe(33);
  });
});

describe('isPlaceholder', () => {
  test('null/undefined/empty are placeholders', () => {
    expect(isPlaceholder(null)).toBe(true);
    expect(isPlaceholder(undefined)).toBe(true);
    expect(isPlaceholder('')).toBe(true);
  });

  test('known placeholder strings detected', () => {
    expect(isPlaceholder('none')).toBe(true);
    expect(isPlaceholder('None')).toBe(true);
    expect(isPlaceholder('n/a')).toBe(true);
    expect(isPlaceholder('unknown')).toBe(true);
    expect(isPlaceholder('null')).toBe(true);
    expect(isPlaceholder('not applicable')).toBe(true);
    expect(isPlaceholder('describe your project goal')).toBe(true);
    expect(isPlaceholder('development teams')).toBe(true);
    expect(isPlaceholder('cloud platform')).toBe(true);
  });

  test('empty collections are placeholders', () => {
    expect(isPlaceholder([])).toBe(true);
    expect(isPlaceholder({})).toBe(true);
  });

  test('real values are not placeholders', () => {
    expect(isPlaceholder('TypeScript')).toBe(false);
    expect(isPlaceholder('React')).toBe(false);
    expect(isPlaceholder(42)).toBe(false);
    expect(isPlaceholder(true)).toBe(false);
    expect(isPlaceholder(['item'])).toBe(false);
  });
});

describe('APP_TYPE_CATEGORIES', () => {
  test('cli has project + human only', () => {
    expect(APP_TYPE_CATEGORIES.cli).toEqual(['project', 'human']);
  });

  test('fullstack has 5 categories', () => {
    expect(APP_TYPE_CATEGORIES.fullstack).toHaveLength(5);
  });

  test('enterprise has all 8 categories', () => {
    expect(APP_TYPE_CATEGORIES.enterprise).toHaveLength(8);
  });
});
