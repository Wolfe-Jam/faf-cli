import { describe, test, expect } from 'bun:test';
import { SLOTS } from '../../src/core/slots.js';
import { FORMATS } from '../../src/detect/formats.js';

describe('search command', () => {
  test('finds slots by keyword', () => {
    const q = 'frontend';
    const matches = SLOTS.filter(s =>
      s.path.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some(s => s.path === 'stack.frontend')).toBe(true);
  });

  test('finds formats by keyword', () => {
    const q = 'react';
    const matches = FORMATS.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.extensions.some(e => e.toLowerCase().includes(q)) ||
      f.category.toLowerCase().includes(q)
    );
    // React is not a format — should return 0
    expect(matches.length).toBe(0);
  });

  test('finds typescript format', () => {
    const q = 'typescript';
    const matches = FORMATS.filter(f =>
      f.name.toLowerCase().includes(q)
    );
    expect(matches.length).toBe(1);
    expect(matches[0].name).toBe('TypeScript');
  });

  test('finds slots by description', () => {
    const q = 'database';
    const matches = SLOTS.filter(s =>
      s.description.toLowerCase().includes(q)
    );
    expect(matches.length).toBeGreaterThan(0);
  });

  test('searchCommand runs without error', () => {
    const { searchCommand } = require('../../src/commands/search.js');
    expect(() => searchCommand('react')).not.toThrow();
  });
});
