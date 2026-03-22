import { describe, test, expect } from 'bun:test';
import { FRAMEWORKS } from '../../src/detect/frameworks.js';

describe('FRAMEWORKS catalog', () => {
  test('has frameworks defined', () => {
    expect(FRAMEWORKS.length).toBeGreaterThan(40);
  });

  test('all frameworks have required fields', () => {
    for (const fw of FRAMEWORKS) {
      expect(fw.name).toBeTruthy();
      expect(fw.slug).toBeTruthy();
      expect(fw.category).toBeTruthy();
      expect(fw.signals.length).toBeGreaterThan(0);
    }
  });

  test('all slugs are unique', () => {
    const slugs = FRAMEWORKS.map(f => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test('all signals have valid types', () => {
    const validTypes = new Set(['dependency', 'devDependency', 'file']);
    for (const fw of FRAMEWORKS) {
      for (const signal of fw.signals) {
        expect(validTypes.has(signal.type)).toBe(true);
        if (signal.type === 'dependency' || signal.type === 'devDependency') {
          expect(signal.key).toBeTruthy();
        }
        if (signal.type === 'file') {
          expect(signal.pattern).toBeTruthy();
        }
      }
    }
  });

  test('has key frameworks', () => {
    const slugs = new Set(FRAMEWORKS.map(f => f.slug));
    expect(slugs.has('react')).toBe(true);
    expect(slugs.has('nextjs')).toBe(true);
    expect(slugs.has('svelte')).toBe(true);
    expect(slugs.has('vue')).toBe(true);
    expect(slugs.has('express')).toBe(true);
    expect(slugs.has('tailwind')).toBe(true);
    expect(slugs.has('prisma')).toBe(true);
    expect(slugs.has('vite')).toBe(true);
  });
});
