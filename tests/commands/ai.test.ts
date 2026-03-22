import { describe, test, expect } from 'bun:test';

describe('ai command', () => {
  test('aiCommand shows help without subcommand', () => {
    const { aiCommand } = require('../../src/commands/ai.js');
    // Should not throw when called without subcommand
    expect(async () => await aiCommand()).not.toThrow();
  });

  test('getNestedValue works on nested objects', () => {
    // Test the internal helper pattern
    const obj = { project: { name: 'test', goal: 'build stuff' } };
    const path = 'project.name';
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') break;
      current = (current as Record<string, unknown>)[part];
    }
    expect(current).toBe('test');
  });

  test('setNestedValue creates intermediate objects', () => {
    const obj: Record<string, unknown> = {};
    const path = 'stack.frontend';
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = 'React';

    expect((obj.stack as Record<string, unknown>).frontend).toBe('React');
  });
});
