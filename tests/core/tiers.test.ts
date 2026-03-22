import { describe, test, expect } from 'bun:test';
import { getTier, getNextTier, TIERS } from '../../src/core/tiers.js';

describe('getTier', () => {
  test('100% = TROPHY', () => {
    expect(getTier(100).name).toBe('TROPHY');
  });

  test('99% = GOLD', () => {
    expect(getTier(99).name).toBe('GOLD');
  });

  test('95% = SILVER', () => {
    expect(getTier(95).name).toBe('SILVER');
    expect(getTier(98).name).toBe('SILVER');
  });

  test('85% = BRONZE', () => {
    expect(getTier(85).name).toBe('BRONZE');
    expect(getTier(94).name).toBe('BRONZE');
  });

  test('70% = GREEN', () => {
    expect(getTier(70).name).toBe('GREEN');
    expect(getTier(84).name).toBe('GREEN');
  });

  test('55% = YELLOW', () => {
    expect(getTier(55).name).toBe('YELLOW');
    expect(getTier(69).name).toBe('YELLOW');
  });

  test('1-54% = RED', () => {
    expect(getTier(1).name).toBe('RED');
    expect(getTier(54).name).toBe('RED');
  });

  test('0% = WHITE', () => {
    expect(getTier(0).name).toBe('WHITE');
    expect(getTier(0).indicator).toContain('♡');
  });

  test('boundary values', () => {
    expect(getTier(100).name).toBe('TROPHY');
    expect(getTier(99).name).toBe('GOLD');
    expect(getTier(95).name).toBe('SILVER');
    expect(getTier(85).name).toBe('BRONZE');
    expect(getTier(70).name).toBe('GREEN');
    expect(getTier(55).name).toBe('YELLOW');
    expect(getTier(1).name).toBe('RED');
    expect(getTier(0).name).toBe('WHITE');
  });
});

describe('getNextTier', () => {
  test('TROPHY has no next tier', () => {
    expect(getNextTier(100)).toBeNull();
  });

  test('GOLD next is TROPHY', () => {
    expect(getNextTier(99)!.name).toBe('TROPHY');
  });

  test('YELLOW next is GREEN', () => {
    expect(getNextTier(60)!.name).toBe('GREEN');
  });

  test('WHITE next is RED', () => {
    expect(getNextTier(0)!.name).toBe('RED');
  });
});

describe('TIERS', () => {
  test('has 8 tiers', () => {
    expect(TIERS).toHaveLength(8);
  });

  test('ordered from highest to lowest threshold', () => {
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i - 1].threshold).toBeGreaterThan(TIERS[i].threshold);
    }
  });
});
