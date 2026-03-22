import { describe, test, expect } from 'bun:test';
import * as kernel from '../../src/wasm/kernel.js';

describe('info command', () => {
  test('infoCommand runs without error', () => {
    const { infoCommand } = require('../../src/commands/info.js');
    expect(() => infoCommand({})).not.toThrow();
  });

  test('infoCommand with version flag runs', () => {
    const { infoCommand } = require('../../src/commands/info.js');
    expect(() => infoCommand({ version: true })).not.toThrow();
  });

  test('kernel sdkVersion returns a string', () => {
    const version = kernel.sdkVersion();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });
});
