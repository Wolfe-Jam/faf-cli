import { describe, test, expect } from 'bun:test';
import { FRAMEWORKS } from '../../src/detect/frameworks.js';

describe('PIT: FRAMEWORKS catalog', () => {
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
    const validTypes = new Set(['dependency', 'devDependency', 'file', 'content']);
    for (const fw of FRAMEWORKS) {
      for (const signal of fw.signals) {
        expect(validTypes.has(signal.type)).toBe(true);
        if (signal.type === 'dependency' || signal.type === 'devDependency') {
          expect(signal.key).toBeTruthy();
        }
        if (signal.type === 'file') {
          expect(signal.pattern).toBeTruthy();
        }
        if (signal.type === 'content') {
          expect(signal.pattern).toBeTruthy();
          expect(signal.key).toBeTruthy();
        }
      }
    }
  });

  test('Spring Boot is content-aware (not pom/gradle filename alone)', () => {
    const spring = FRAMEWORKS.find(f => f.slug === 'spring');
    expect(spring).toBeTruthy();
    expect(spring!.signals.every(s => s.type === 'content')).toBe(true);
    expect(spring!.signals.some(s => s.type === 'file')).toBe(false);
  });

  // Regression: a bare `file: main.py`/`app.py` signal false-positived FastAPI/
  // Flask on any Python project using those generic entry-point names — hit
  // live on gemini-faf-mcp (main.py is a Cloud Functions entry point, not
  // FastAPI). Same false-positive shape as the Spring Boot case above.
  test('FastAPI is content-aware (not main.py filename alone)', () => {
    const fastapi = FRAMEWORKS.find(f => f.slug === 'fastapi');
    expect(fastapi).toBeTruthy();
    expect(fastapi!.signals.every(s => s.type === 'content')).toBe(true);
    expect(fastapi!.signals.some(s => s.type === 'file')).toBe(false);
  });

  test('Flask is content-aware (not app.py filename alone)', () => {
    const flask = FRAMEWORKS.find(f => f.slug === 'flask');
    expect(flask).toBeTruthy();
    expect(flask!.signals.every(s => s.type === 'content')).toBe(true);
    expect(flask!.signals.some(s => s.type === 'file')).toBe(false);
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
