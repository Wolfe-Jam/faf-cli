import {
  calculateStarRating,
  formatStarsDisplay,
  calculateStarRatingFromTAF,
} from '../../src/taf/star-rating';
import { TAFFile } from '../../src/taf/types';

describe('calculateStarRating', () => {
  it('returns 5.0 stars for 100%', () => {
    const result = calculateStarRating(1.0);
    expect(result.stars).toBe(5.0);
    expect(result.display).toBe('★★★★★');
    expect(result.label).toBe('5.0 stars');
  });

  it('returns 4.5 stars for 95-99%', () => {
    expect(calculateStarRating(0.95).stars).toBe(4.5);
    expect(calculateStarRating(0.99).stars).toBe(4.5);
    expect(calculateStarRating(0.97).stars).toBe(4.5);
  });

  it('returns 4.0 stars for 85-94%', () => {
    expect(calculateStarRating(0.85).stars).toBe(4.0);
    expect(calculateStarRating(0.94).stars).toBe(4.0);
    expect(calculateStarRating(0.90).stars).toBe(4.0);
  });

  it('returns 3.5 stars for 70-84%', () => {
    expect(calculateStarRating(0.70).stars).toBe(3.5);
    expect(calculateStarRating(0.84).stars).toBe(3.5);
  });

  it('returns 3.0 stars for 55-69%', () => {
    expect(calculateStarRating(0.55).stars).toBe(3.0);
    expect(calculateStarRating(0.69).stars).toBe(3.0);
  });

  it('returns 2.5 stars for 40-54%', () => {
    expect(calculateStarRating(0.40).stars).toBe(2.5);
    expect(calculateStarRating(0.54).stars).toBe(2.5);
  });

  it('returns 2.0 stars for 20-39%', () => {
    expect(calculateStarRating(0.20).stars).toBe(2.0);
    expect(calculateStarRating(0.39).stars).toBe(2.0);
  });

  it('returns 1.0 star for 1-19%', () => {
    expect(calculateStarRating(0.01).stars).toBe(1.0);
    expect(calculateStarRating(0.19).stars).toBe(1.0);
  });

  it('returns 0.0 stars for 0%', () => {
    const result = calculateStarRating(0);
    expect(result.stars).toBe(0.0);
    expect(result.display).toBe('☆☆☆☆☆');
  });

  // Boundary tests
  it('boundary: 94.99% is 4.0 not 4.5', () => {
    expect(calculateStarRating(0.9499).stars).toBe(4.0);
  });

  it('boundary: 95% is exactly 4.5', () => {
    expect(calculateStarRating(0.95).stars).toBe(4.5);
  });

  it('boundary: 100% is exactly 5.0', () => {
    expect(calculateStarRating(1.0).stars).toBe(5.0);
  });

  it('boundary: 85% is exactly 4.0', () => {
    expect(calculateStarRating(0.85).stars).toBe(4.0);
  });

  it('boundary: 84.9% is 3.5 not 4.0', () => {
    expect(calculateStarRating(0.849).stars).toBe(3.5);
  });
});

describe('formatStarsDisplay', () => {
  it('formats 5.0 as all filled', () => {
    expect(formatStarsDisplay(5.0)).toBe('★★★★★');
  });

  it('formats 4.5 with half star', () => {
    expect(formatStarsDisplay(4.5)).toBe('★★★★½');
  });

  it('formats 4.0 with one empty', () => {
    expect(formatStarsDisplay(4.0)).toBe('★★★★☆');
  });

  it('formats 3.5 correctly', () => {
    expect(formatStarsDisplay(3.5)).toBe('★★★½☆');
  });

  it('formats 3.0 correctly', () => {
    expect(formatStarsDisplay(3.0)).toBe('★★★☆☆');
  });

  it('formats 2.5 correctly', () => {
    expect(formatStarsDisplay(2.5)).toBe('★★½☆☆');
  });

  it('formats 2.0 correctly', () => {
    expect(formatStarsDisplay(2.0)).toBe('★★☆☆☆');
  });

  it('formats 1.0 correctly', () => {
    expect(formatStarsDisplay(1.0)).toBe('★☆☆☆☆');
  });

  it('formats 0.0 as all empty', () => {
    expect(formatStarsDisplay(0.0)).toBe('☆☆☆☆☆');
  });

  it('formats 0.5 correctly', () => {
    expect(formatStarsDisplay(0.5)).toBe('½☆☆☆☆');
  });
});

describe('calculateStarRatingFromTAF', () => {
  function makeTAF(passed: number, total: number): TAFFile {
    return {
      format_version: '1.0',
      project: 'test',
      created: '2026-01-01T00:00:00Z',
      test_history: [{
        timestamp: '2026-01-01T00:00:00Z',
        result: passed === total ? 'PASSED' : 'FAILED',
        tests: { total, passed, failed: total - passed },
      }],
    };
  }

  it('returns 5.0 for perfect score', () => {
    const result = calculateStarRatingFromTAF(makeTAF(878, 878));
    expect(result).not.toBeNull();
    expect(result!.stars).toBe(5.0);
    expect(result!.display).toBe('★★★★★');
  });

  it('returns 4.5 for 97% pass rate', () => {
    const result = calculateStarRatingFromTAF(makeTAF(97, 100));
    expect(result!.stars).toBe(4.5);
  });

  it('returns null for empty history', () => {
    const taf: TAFFile = {
      format_version: '1.0',
      project: 'test',
      created: '2026-01-01T00:00:00Z',
      test_history: [],
    };
    expect(calculateStarRatingFromTAF(taf)).toBeNull();
  });

  it('returns null for zero total tests', () => {
    const taf: TAFFile = {
      format_version: '1.0',
      project: 'test',
      created: '2026-01-01T00:00:00Z',
      test_history: [{
        timestamp: '2026-01-01T00:00:00Z',
        result: 'PASSED',
        tests: { total: 0, passed: 0, failed: 0 },
      }],
    };
    expect(calculateStarRatingFromTAF(taf)).toBeNull();
  });

  it('uses latest run for rating', () => {
    const taf: TAFFile = {
      format_version: '1.0',
      project: 'test',
      created: '2026-01-01T00:00:00Z',
      test_history: [
        {
          timestamp: '2026-01-01T00:00:00Z',
          result: 'FAILED',
          tests: { total: 100, passed: 50, failed: 50 },
        },
        {
          timestamp: '2026-01-02T00:00:00Z',
          result: 'PASSED',
          tests: { total: 100, passed: 100, failed: 0 },
        },
      ],
    };
    const result = calculateStarRatingFromTAF(taf);
    expect(result!.stars).toBe(5.0);
  });
});
