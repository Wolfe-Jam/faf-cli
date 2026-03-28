import { describe, test, expect } from 'bun:test';
import { validateFaf } from '../../src/core/schema.js';

describe('validateFaf', () => {
  test('valid .faf data passes', () => {
    const result = validateFaf({ faf_version: '3.0', project: { name: 'test' } });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('missing faf_version fails', () => {
    const result = validateFaf({ project: { name: 'test' } });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: faf_version');
  });

  test('missing project.name fails', () => {
    const result = validateFaf({ faf_version: '3.0' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: project.name');
  });

  test('null/non-object/empty fails', () => {
    expect(validateFaf(null).valid).toBe(false);
    expect(validateFaf('string').valid).toBe(false);
    expect(validateFaf({}).valid).toBe(false);
  });
});
