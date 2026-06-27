import { describe, test, expect } from 'bun:test';
import {
  SLOTS,
  BASE_SLOTS,
  ENTERPRISE_SLOTS,
  SLOT_BY_PATH,
  slotsByCategory,
  isPlaceholder,
  APP_TYPE_CATEGORIES,
  CANONICAL_TO_CURRENT,
  CURRENT_TO_CANONICAL,
  getSlotByAnyPath,
  readSlotValue,
} from '../../src/core/slots.js';

describe('ENGINE: SLOTS', () => {
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

describe('ENGINE: BASE_SLOTS', () => {
  test('has 21 slots', () => {
    expect(BASE_SLOTS).toHaveLength(21);
  });

  test('only contains slots 1-21', () => {
    for (const s of BASE_SLOTS) {
      expect(s.index).toBeLessThanOrEqual(21);
    }
  });
});

describe('ENGINE: ENTERPRISE_SLOTS', () => {
  test('has 33 slots', () => {
    expect(ENTERPRISE_SLOTS).toHaveLength(33);
  });
});

describe('ENGINE: SLOT_BY_PATH', () => {
  test('finds project.name', () => {
    expect(SLOT_BY_PATH.get('project.name')?.index).toBe(1);
  });

  test('finds monorepo.remote_cache', () => {
    expect(SLOT_BY_PATH.get('monorepo.remote_cache')?.index).toBe(33);
  });
});

describe('ENGINE: slotsByCategory', () => {
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

describe('ENGINE: isPlaceholder', () => {
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

describe('ENGINE: APP_TYPE_CATEGORIES', () => {
  test('cli has project + human + universal (12 slots — v6.5.0 universal-extension)', () => {
    expect(new Set(APP_TYPE_CATEGORIES.cli)).toEqual(new Set(['project', 'human', 'universal']));
  });

  test('fullstack has 5 categories', () => {
    expect(APP_TYPE_CATEGORIES.fullstack).toHaveLength(5);
  });

  test('enterprise has all 8 categories', () => {
    expect(APP_TYPE_CATEGORIES.enterprise).toHaveLength(8);
  });

  test('extension has frontend + universal, NO backend (browser extension shape)', () => {
    expect(APP_TYPE_CATEGORIES.extension).toBeDefined();
    expect(new Set(APP_TYPE_CATEGORIES.extension)).toEqual(
      new Set(['project', 'frontend', 'human', 'universal']));
    expect(APP_TYPE_CATEGORIES.extension).not.toContain('backend');
  });
});

describe('PIT: Mk4 canonical alias map (issue #66 — staged prep)', () => {
  test('the 6 legacy slots carry their Mk4 canonical alias', () => {
    const expected = new Map<string, string>([
      ['stack.frontend',         'stack.framework'],
      ['stack.css_framework',    'stack.css'],
      ['stack.state_management', 'stack.state'],
      ['stack.api_type',         'stack.api'],
      ['stack.database',         'stack.db'],
      ['stack.package_manager',  'stack.pkg_manager'],
    ]);
    for (const [legacy, canonical] of expected) {
      const s = SLOT_BY_PATH.get(legacy);
      expect(s).toBeDefined();
      expect(s?.canonical).toBe(canonical);
    }
  });

  test('only those 6 slots have a canonical alias (others stay path-canonical)', () => {
    const withCanonical = SLOTS.filter(s => s.canonical);
    expect(withCanonical).toHaveLength(6);
  });

  test('CURRENT_TO_CANONICAL maps legacy → canonical for all 6', () => {
    expect(CURRENT_TO_CANONICAL.get('stack.frontend')).toBe('stack.framework');
    expect(CURRENT_TO_CANONICAL.get('stack.css_framework')).toBe('stack.css');
    expect(CURRENT_TO_CANONICAL.get('stack.state_management')).toBe('stack.state');
    expect(CURRENT_TO_CANONICAL.get('stack.api_type')).toBe('stack.api');
    expect(CURRENT_TO_CANONICAL.get('stack.database')).toBe('stack.db');
    expect(CURRENT_TO_CANONICAL.get('stack.package_manager')).toBe('stack.pkg_manager');
  });

  test('CANONICAL_TO_CURRENT inverts for all 6', () => {
    expect(CANONICAL_TO_CURRENT.get('stack.framework')).toBe('stack.frontend');
    expect(CANONICAL_TO_CURRENT.get('stack.css')).toBe('stack.css_framework');
    expect(CANONICAL_TO_CURRENT.get('stack.state')).toBe('stack.state_management');
    expect(CANONICAL_TO_CURRENT.get('stack.api')).toBe('stack.api_type');
    expect(CANONICAL_TO_CURRENT.get('stack.db')).toBe('stack.database');
    expect(CANONICAL_TO_CURRENT.get('stack.pkg_manager')).toBe('stack.package_manager');
  });

  test('SLOT_BY_PATH is dual-keyed (legacy AND canonical both resolve)', () => {
    // Legacy paths resolve
    expect(SLOT_BY_PATH.get('stack.frontend')?.index).toBe(10);
    expect(SLOT_BY_PATH.get('stack.package_manager')?.index).toBe(23);
    // Canonical paths resolve to the SAME slot
    expect(SLOT_BY_PATH.get('stack.framework')?.index).toBe(10);
    expect(SLOT_BY_PATH.get('stack.pkg_manager')?.index).toBe(23);
    // Same SlotDef object reference under either key
    expect(SLOT_BY_PATH.get('stack.frontend')).toBe(SLOT_BY_PATH.get('stack.framework'));
  });

  test('getSlotByAnyPath resolves either name', () => {
    expect(getSlotByAnyPath('stack.frontend')?.index).toBe(10);
    expect(getSlotByAnyPath('stack.framework')?.index).toBe(10);
    expect(getSlotByAnyPath('stack.nonsense')).toBeUndefined();
  });

  test('readSlotValue reads legacy key when on disk', () => {
    const slot = SLOT_BY_PATH.get('stack.frontend')!;
    const data = { stack: { frontend: 'React' } };
    expect(readSlotValue(data, slot)).toBe('React');
  });

  test('readSlotValue reads canonical key when on disk', () => {
    const slot = SLOT_BY_PATH.get('stack.framework')!;
    const data = { stack: { framework: 'Svelte' } };
    expect(readSlotValue(data, slot)).toBe('Svelte');
  });

  test('readSlotValue prefers current path over canonical if both present', () => {
    const slot = SLOT_BY_PATH.get('stack.frontend')!;
    const data = { stack: { frontend: 'legacy-wins', framework: 'canonical-loses' } };
    // Current on-wire `path` (legacy) is what kernel scores today, so reads
    // prefer it for round-trip stability.
    expect(readSlotValue(data, slot)).toBe('legacy-wins');
  });

  test('readSlotValue returns undefined when neither key present', () => {
    const slot = SLOT_BY_PATH.get('stack.frontend')!;
    expect(readSlotValue({ stack: {} }, slot)).toBeUndefined();
    expect(readSlotValue({}, slot)).toBeUndefined();
  });

  test('all 33 slots still keep stable indices (no renumbering)', () => {
    // The Mk4 rename is path-string only; slot indices must NOT shift.
    expect(SLOT_BY_PATH.get('stack.frontend')?.index).toBe(10);
    expect(SLOT_BY_PATH.get('stack.css_framework')?.index).toBe(11);
    expect(SLOT_BY_PATH.get('stack.state_management')?.index).toBe(13);
    expect(SLOT_BY_PATH.get('stack.api_type')?.index).toBe(15);
    expect(SLOT_BY_PATH.get('stack.database')?.index).toBe(17);
    expect(SLOT_BY_PATH.get('stack.package_manager')?.index).toBe(23);
  });
});
