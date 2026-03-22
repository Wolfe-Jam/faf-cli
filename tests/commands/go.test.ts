import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { SLOTS } from '../../src/core/slots.js';
import { isPlaceholder } from '../../src/core/slots.js';

describe('go command helpers', () => {
  test('isPlaceholder detects empty values', () => {
    expect(isPlaceholder(null)).toBe(true);
    expect(isPlaceholder(undefined)).toBe(true);
    expect(isPlaceholder('')).toBe(true);
    expect(isPlaceholder('n/a')).toBe(true);
    expect(isPlaceholder('none')).toBe(true);
    expect(isPlaceholder('TypeScript')).toBe(false);
  });

  test('isPlaceholder handles slotignored', () => {
    // slotignored is NOT a placeholder — it's a valid state
    expect(isPlaceholder('slotignored')).toBe(false);
  });

  test('SLOTS has 33 entries', () => {
    expect(SLOTS.length).toBe(33);
  });

  test('all slots have required fields', () => {
    for (const slot of SLOTS) {
      expect(slot.index).toBeGreaterThan(0);
      expect(slot.path).toBeTruthy();
      expect(slot.description).toBeTruthy();
      expect(slot.category).toBeTruthy();
    }
  });

  test('nested value get/set works', () => {
    // Test the pattern used in go.ts
    const obj: Record<string, unknown> = { project: { name: 'test' } };

    // Get nested
    const parts = 'project.name'.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      current = (current as Record<string, unknown>)[part];
    }
    expect(current).toBe('test');

    // Set nested
    const setParts = 'project.goal'.split('.');
    let target: Record<string, unknown> = obj;
    for (let i = 0; i < setParts.length - 1; i++) {
      if (!target[setParts[i]] || typeof target[setParts[i]] !== 'object') {
        target[setParts[i]] = {};
      }
      target = target[setParts[i]] as Record<string, unknown>;
    }
    target[setParts[setParts.length - 1]] = 'new goal';

    expect((obj.project as Record<string, unknown>).goal).toBe('new goal');
  });
});
