/**
 * Tests for FAF schema validation
 */

import { validateSchema, FafSchema } from '../../src/schema/faf-schema';

describe('FAF Schema', () => {
  it('should validate a basic valid .faf file', () => {
    const validFaf = {
      faf_version: '2.4.0',
      generated: new Date().toISOString(),
      project: {
        name: 'test-project',
        main_language: 'TypeScript',
        faf_score: 85
      },
      scores: {
        slot_based_percentage: 85,
        faf_score: 85,
        total_slots: 20
      }
    };

    const result = validateSchema(validFaf);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject .faf file with missing required fields', () => {
    const invalidFaf = {
      faf_version: '2.4.0'
      // Missing required fields like project, scores, etc.
    };

    const result = validateSchema(invalidFaf);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate version format correctly', () => {
    const validVersions = ['2.4.0', '1.0.0', '10.5.3'];
    const invalidVersions = ['invalid', '2.4', 'v2.4.0'];

    validVersions.forEach(version => {
      const fafWithVersion = {
        faf_version: version,
        generated: new Date().toISOString(),
        project: {
          name: 'test',
          main_language: 'JavaScript'
        },
        scores: {
          slot_based_percentage: 50,
          faf_score: 50,
          total_slots: 10
        }
      };

      const result = validateSchema(fafWithVersion);
      expect(result.errors.filter((e: any) => e.message.includes('version'))).toHaveLength(0);
    });
  });

  it('should handle different schema versions', () => {
    const testFaf = {
      faf_version: '2.4.0',
      project: { name: 'test', main_language: 'TypeScript' }
    };
    
    const result = validateSchema(testFaf, '2.4.0');
    expect(result).toBeDefined();
    expect(result.schemaVersion).toBe('2.4.0');
  });

  it('should return correct validation structure', () => {
    const testFaf = {
      faf_version: '2.4.0',
      generated: new Date().toISOString(),
      project: {
        name: 'structure-test',
        main_language: 'TypeScript'
      }
    };

    const result = validateSchema(testFaf);
    
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('schemaVersion');
    expect(result).toHaveProperty('sectionsFound');
    expect(result).toHaveProperty('requiredFieldsFound');
    expect(result).toHaveProperty('requiredFieldsTotal');
  });

  it('should count sections and required fields correctly', () => {
    const comprehensiveFaf = {
      faf_version: '2.4.0',
      generated: new Date().toISOString(),
      project: {
        name: 'comprehensive-test',
        main_language: 'TypeScript',
        faf_score: 90
      },
      ai_instructions: {
        priority: 'HIGH',
        usage: 'Test usage',
        message: 'Test message'
      },
      stack: {
        frontend: 'React',
        backend: 'Node.js'
      },
      scores: {
        slot_based_percentage: 90,
        faf_score: 90,
        total_slots: 20
      }
    };

    const result = validateSchema(comprehensiveFaf);
    
    expect(result.sectionsFound).toBeGreaterThan(3);
    expect(result.requiredFieldsFound).toBeGreaterThan(0);
    expect(result.requiredFieldsTotal).toBeGreaterThan(0);
  });
});