import { describe, test, expect } from 'bun:test';
import { validateFaf } from '../../src/core/schema.js';

describe('BRAKE: validateFaf', () => {
  test('valid .faf data passes', () => {
    const result = validateFaf({ faf_version: '2.5.0', project: { name: 'test' } });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('missing faf_version fails', () => {
    const result = validateFaf({ project: { name: 'test' } });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: faf_version');
  });

  test('missing project.name fails', () => {
    const result = validateFaf({ faf_version: '2.5.0' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: project.name');
  });

  test('null/non-object/empty fails', () => {
    expect(validateFaf(null).valid).toBe(false);
    expect(validateFaf('string').valid).toBe(false);
    expect(validateFaf({}).valid).toBe(false);
  });
});

describe('BRAKE: validateFaf — About Repo (app_type: about)', () => {
  test('valid about with represents passes', () => {
    const result = validateFaf({
      faf_version: '2.5.0',
      project: { name: 'mcpaas-cf' },
      app_type: 'about',
      about: { represents: 'Wolfe-Jam/faf-mcpaas', source_score: 100 },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('about without represents fails', () => {
    const result = validateFaf({
      faf_version: '2.5.0',
      project: { name: 'mcpaas-cf' },
      app_type: 'about',
      // about block missing entirely
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('about.represents'))).toBe(true);
  });

  test('about with empty represents fails', () => {
    const result = validateFaf({
      faf_version: '2.5.0',
      project: { name: 'x' },
      app_type: 'about',
      about: { represents: '' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('about.represents'))).toBe(true);
  });

  test('about with malformed represents (no slash) fails', () => {
    const result = validateFaf({
      faf_version: '2.5.0',
      project: { name: 'x' },
      app_type: 'about',
      about: { represents: 'just-a-name-no-slash' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('owner/repo'))).toBe(true);
  });

  test('about without source_score is valid (renders "—")', () => {
    const result = validateFaf({
      faf_version: '2.5.0',
      project: { name: 'x' },
      app_type: 'about',
      about: { represents: 'owner/repo' },
    });
    expect(result.valid).toBe(true);
  });

  test('about with out-of-range source_score fails', () => {
    const tooHigh = validateFaf({
      faf_version: '2.5.0',
      project: { name: 'x' },
      app_type: 'about',
      about: { represents: 'owner/repo', source_score: 150 },
    });
    expect(tooHigh.valid).toBe(false);
    expect(tooHigh.errors.some((e) => e.includes('source_score'))).toBe(true);

    const negative = validateFaf({
      faf_version: '2.5.0',
      project: { name: 'x' },
      app_type: 'about',
      about: { represents: 'owner/repo', source_score: -5 },
    });
    expect(negative.valid).toBe(false);
  });

  test('non-about types skip the about validation rules', () => {
    // A `cli` type without an `about` block must still validate.
    const result = validateFaf({
      faf_version: '2.5.0',
      project: { name: 'faf-cli' },
      app_type: 'cli',
    });
    expect(result.valid).toBe(true);
  });
});
