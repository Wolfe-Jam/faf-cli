import { describe, test, expect } from 'bun:test';

describe('demo command', () => {
  test('demoCommand runs without error', () => {
    const { demoCommand } = require('../../src/commands/demo.js');
    expect(() => demoCommand()).not.toThrow();
  });

  test('demoCommand does not leave temp files', () => {
    const { readdirSync } = require('fs');
    const { tmpdir } = require('os');

    const before = readdirSync(tmpdir()).filter((f: string) => f.startsWith('faf-demo-'));
    const { demoCommand } = require('../../src/commands/demo.js');
    demoCommand();
    const after = readdirSync(tmpdir()).filter((f: string) => f.startsWith('faf-demo-'));

    expect(after.length).toBe(before.length);
  });
});
