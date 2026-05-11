/**
 * WJTTC — app-types canonical ladder (v6.6.0)
 *
 * ENGINE: locks the 20-type ladder, slot allocation, and the universal-
 *         category extension to small types (cli/library/mcp/frontend/
 *         data-science).
 *
 * v6.6.0 — Added `about` as the first non-app type (0 slots; score is
 * INHERITED from the source codebase, not calculated). About Repos are
 * documentation surfaces for private codebases — they DISPLAY the source's
 * Trophy badge, they don't earn one. Per
 * memory/private-source-public-about-pattern.md.
 *
 * Per v6.6.md doctrine memory.
 */

import { describe, test, expect } from 'bun:test';
import { APP_TYPE_CATEGORIES, SLOTS } from '../../src/core/slots.js';
import type { SlotCategory } from '../../src/core/types.js';

/** Slot count per category (derived from SLOTS) — kept in sync with the
 *  canonical doctrine. If SLOTS is restructured, this map updates with it
 *  via the `category sizes match canonical` test below. */
const CATEGORY_SIZES: Record<SlotCategory, number> = {
  project: 3,
  human: 6,
  frontend: 4,
  backend: 5,
  universal: 3,
  enterprise_infra: 5,
  enterprise_app: 4,
  enterprise_ops: 3,
};

describe('WJTTC ENGINE: app-types canonical ladder (20 types)', () => {
  test('exactly 20 types defined', () => {
    expect(Object.keys(APP_TYPE_CATEGORIES).length).toBe(20);
  });

  test('all canonical types present', () => {
    const expected = [
      // 0 slots — non-app representation (v6.6.0)
      'about',
      // 9 slots — minimal
      'documentation',
      'cli', 'library', 'sdk', 'wasm', 'html',
      'frontend', 'website', 'mobile',
      'mcp', 'backend', 'data-science',
      'fullstack', 'svelte', 'framework', 'monorepo-root',
      'mcpaas', 'saas',
      'enterprise',
    ];
    for (const t of expected) {
      expect(APP_TYPE_CATEGORIES).toHaveProperty(t);
    }
  });

  test('about type has zero slot categories (non-app, score is inherited)', () => {
    expect(APP_TYPE_CATEGORIES.about).toEqual([]);
  });
});

describe('WJTTC ENGINE: per-type slot allocation', () => {
  // Per v6.6.md — sorted ascending by slot count.
  const expectedSlotCounts: Record<string, number> = {
    documentation: 9,
    cli: 12,
    library: 12,
    sdk: 12,
    wasm: 12,
    html: 12,
    frontend: 16,
    website: 16,
    mobile: 16,
    mcp: 17,
    backend: 17,
    'data-science': 17,
    fullstack: 21,
    svelte: 21,
    framework: 21,
    'monorepo-root': 21,
    mcpaas: 24,
    saas: 25,
    enterprise: 33,
  };

  for (const [type, expectedCount] of Object.entries(expectedSlotCounts)) {
    test(`${type} → ${expectedCount} active slots`, () => {
      const cats = APP_TYPE_CATEGORIES[type];
      expect(cats).toBeDefined();
      const count = cats.reduce((sum, cat) => sum + CATEGORY_SIZES[cat], 0);
      expect(count).toBe(expectedCount);
    });
  }
});

describe('WJTTC ENGINE: universal-category extension (Phase 2 — small types now build/ci/host aware)', () => {
  test('cli has universal', () => {
    expect(APP_TYPE_CATEGORIES.cli).toContain('universal');
  });
  test('library has universal', () => {
    expect(APP_TYPE_CATEGORIES.library).toContain('universal');
  });
  test('mcp has universal', () => {
    expect(APP_TYPE_CATEGORIES.mcp).toContain('universal');
  });
  test('frontend has universal', () => {
    expect(APP_TYPE_CATEGORIES.frontend).toContain('universal');
  });
  test('data-science has universal', () => {
    expect(APP_TYPE_CATEGORIES['data-science']).toContain('universal');
  });
});

describe('WJTTC ENGINE: SLOTS array structure invariants', () => {
  test('33 slots total', () => {
    expect(SLOTS.length).toBe(33);
  });

  test('category sizes match canonical', () => {
    const counts: Record<string, number> = {};
    for (const slot of SLOTS) {
      counts[slot.category] = (counts[slot.category] ?? 0) + 1;
    }
    for (const [cat, expected] of Object.entries(CATEGORY_SIZES)) {
      expect(counts[cat]).toBe(expected);
    }
  });

  test('slot indexes 1-33 in order, no gaps', () => {
    const indexes = SLOTS.map(s => s.index).sort((a, b) => a - b);
    for (let i = 0; i < indexes.length; i++) {
      expect(indexes[i]).toBe(i + 1);
    }
  });
});

describe('WJTTC ENGINE: documentation type — minimal-shell (lowest slot count)', () => {
  test('documentation has only project + human', () => {
    expect(APP_TYPE_CATEGORIES.documentation).toEqual(['project', 'human']);
  });
});

describe('WJTTC ENGINE: enterprise type — full-shell (highest slot count)', () => {
  test('enterprise activates all 8 categories', () => {
    const expected: SlotCategory[] = [
      'project', 'frontend', 'backend', 'universal', 'human',
      'enterprise_infra', 'enterprise_app', 'enterprise_ops',
    ];
    expect(new Set(APP_TYPE_CATEGORIES.enterprise)).toEqual(new Set(expected));
  });
});
