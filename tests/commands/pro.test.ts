import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { isPro } from '../../src/core/pro.js';

describe('pro command', () => {
  let originalPro: string | undefined;

  beforeEach(() => {
    originalPro = process.env.FAF_PRO;
  });

  afterEach(() => {
    if (originalPro !== undefined) {
      process.env.FAF_PRO = originalPro;
    } else {
      delete process.env.FAF_PRO;
    }
  });

  test('isPro returns false by default', () => {
    delete process.env.FAF_PRO;
    expect(isPro()).toBe(false);
  });

  test('isPro returns true when FAF_PRO=1', () => {
    process.env.FAF_PRO = '1';
    expect(isPro()).toBe(true);
  });

  test('isPro returns true when FAF_PRO=true', () => {
    process.env.FAF_PRO = 'true';
    expect(isPro()).toBe(true);
  });

  test('isPro returns false for other values', () => {
    process.env.FAF_PRO = 'yes';
    expect(isPro()).toBe(false);
  });

  test('proCommand runs without error', () => {
    const { proCommand } = require('../../src/commands/pro.js');
    expect(() => proCommand()).not.toThrow();
  });

  test('proCommand features runs without error', () => {
    const { proCommand } = require('../../src/commands/pro.js');
    expect(() => proCommand('features')).not.toThrow();
  });
});
