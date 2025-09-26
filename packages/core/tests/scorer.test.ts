/**
 * Tests for @faf/core scorer
 */

import { calculateScore, validateFafData, getMissingRequiredSlots } from '../src/scorer';
import type { FafData } from '../src/types';

describe('@faf/core scorer', () => {
  describe('calculateScore', () => {
    it('should score empty data low', () => {
      const result = calculateScore({});
      expect(result.totalScore).toBeLessThan(20);
      expect(result.details.filledSlots).toBe(0);
    });

    it('should score complete data high', () => {
      const completeFaf: FafData = {
        faf_version: '1.0.0',
        format_version: 1,
        project: {
          name: 'Test Project',
          description: 'A test project',
          goal: 'Testing'
        },
        instant_context: {
          what_building: 'Test app',
          main_language: 'TypeScript',
          frameworks: 'Svelte',
          tech_stack: 'Node.js',
          context_for_ai: 'This is a test'
        },
        paths: {
          root: '.',
          src: './src'
        },
        key_files: [
          { path: 'index.ts', purpose: 'Entry point' }
        ],
        context_quality: {
          overall_assessment: 'Good'
        }
      };

      const result = calculateScore(completeFaf);
      expect(result.totalScore).toBeGreaterThan(80);
      expect(result.details.filledSlots).toBeGreaterThan(8);
      expect(result.details.hasContext).toBe(true);
      expect(result.details.hasQuality).toBe(true);
    });

    it('should provide recommendations for missing required slots', () => {
      const partialFaf: FafData = {
        project: {
          name: 'Test'
        }
      };

      const result = calculateScore(partialFaf);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.toLowerCase().includes('what')));
      expect(result.recommendations.some(r => r.toLowerCase().includes('language')));
    });

    it('should cap score at 100', () => {
      const overloadedFaf: FafData = {
        faf_version: '1.0.0',
        format_version: 1,
        project: {
          name: 'Test',
          description: 'Test',
          goal: 'Test'
        },
        instant_context: {
          what_building: 'Test',
          main_language: 'TypeScript',
          frameworks: 'All of them',
          tech_stack: 'Everything',
          context_for_ai: 'Maximum context'
        },
        key_files: Array(50).fill({ path: 'file.ts', purpose: 'test' }),
        context_quality: {
          overall_assessment: 'Perfect'
        }
      };

      const result = calculateScore(overloadedFaf);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('validateFafData', () => {
    it('should validate correct structure', () => {
      expect(validateFafData({})).toBe(true);
      expect(validateFafData({ faf_version: '1.0.0' })).toBe(true);
      expect(validateFafData({ project: { name: 'Test' } })).toBe(true);
    });

    it('should reject invalid data', () => {
      expect(validateFafData(null)).toBe(false);
      expect(validateFafData(undefined)).toBe(false);
      expect(validateFafData('string')).toBe(false);
      expect(validateFafData(123)).toBe(false);
    });
  });

  describe('getMissingRequiredSlots', () => {
    it('should identify missing required slots', () => {
      const missing = getMissingRequiredSlots({});
      expect(missing).toContain('project.name');
      expect(missing).toContain('instant_context.what_building');
      expect(missing).toContain('instant_context.main_language');
    });

    it('should return empty array when all required slots filled', () => {
      const complete: FafData = {
        project: { name: 'Test' },
        instant_context: {
          what_building: 'App',
          main_language: 'TypeScript'
        }
      };
      const missing = getMissingRequiredSlots(complete);
      expect(missing).toEqual([]);
    });
  });
});