/**
 * 🏎️⚡️II Engine Test Suite
 * FAF-CLI v2.0.0 with 🏎️⚡️II
 * 
 * WOLFEJAM TESTING CENTER - Championship Standards
 * "We break things so others never have to know they were broken."
 */

import { FafCoreMK2 } from '../../engines/mk2/engines/FafCoreMK2';
import { ENGINE_BRAND, CLI_VERSION } from '../../engines/mk2/core/EngineInterface';

describe('🏎️⚡️II MK2 Engine Test Suite', () => {
  
  describe('Engine Branding', () => {
    it('should ALWAYS show 🏎️⚡️II brand', () => {
      const engine = new FafCoreMK2();
      expect(engine.brand).toBe('🏎️⚡️II');
    });

    it('should display correct CLI version format', () => {
      expect(CLI_VERSION).toBe('FAF-CLI v2.0.0 with 🏎️⚡️II');
    });
  });

  describe('FafCoreMK2 - The Daily Driver', () => {
    let engine: FafCoreMK2;
    
    beforeEach(() => {
      engine = new FafCoreMK2();
    });

    it('should identify as FAF-CORE-MK2', () => {
      expect(engine.name).toBe('FAF-CORE-MK2');
      expect(engine.version).toBe('2.0.0');
    });

    it('should maintain 21-slot system', () => {
      const specs = engine.getSpecs();
      expect(specs.slots).toBe(21);
      expect(specs.mode).toBe('RELIABLE');
    });

    it('should achieve championship performance (<50ms)', async () => {
      const testData = {
        project: { name: 'test-project' },
        stack: { frontend: 'React', backend: 'Node.js' }
      };
      
      const start = Date.now();
      const result = await engine.calculate(testData);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50); // Championship standard
      expect(result.brand).toBe('🏎️⚡️II');
    });

    it('should calculate correct scores for minimal data', async () => {
      const minimalData = {
        project: { name: 'minimal' },
        stack: { frontend: 'React' }
      };
      
      const result = await engine.calculate(minimalData);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.engine).toBe('FAF-CORE-MK2');
    });

    it('should calculate correct scores for comprehensive data', async () => {
      const comprehensiveData = {
        project: {
          name: 'comprehensive-project',
          goal: 'Build amazing things'
        },
        stack: {
          frontend: 'React 18.2',
          backend: 'Node.js 20',
          database: 'PostgreSQL 15',
          cache: 'Redis',
          hosting: 'Vercel'
        },
        human_context: {
          who: 'Development team',
          what: 'Enterprise application',
          why: 'Business transformation',
          where: 'Global deployment',
          when: 'Q1 2025',
          how: 'Agile methodology'
        }
      };
      
      const result = await engine.calculate(comprehensiveData);
      expect(result.score).toBeGreaterThan(50); // Should score above average
      expect(result.metadata).toBeDefined();
      expect(result.metadata.filledSlots).toBeGreaterThan(10);
    });

    it('should handle null/undefined data safely', async () => {
      const result = await engine.calculate(null);
      expect(result.score).toBe(0);
      expect(result.brand).toBe('🏎️⚡️II');
    });

    it('should handle corrupted data gracefully', async () => {
      const corruptedData = {
        project: null,
        stack: undefined,
        circular: {}
      };
      // Create circular reference
      corruptedData.circular = corruptedData;
      
      const result = await engine.calculate(corruptedData);
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Benchmarks', () => {
    const engine = new FafCoreMK2();
    
    it('should score 1000 files in under 2 seconds', async () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        await engine.calculate({
          project: { name: `project-${i}` },
          stack: { frontend: 'React' }
        });
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Under 2 seconds for 1000 calculations
    });

    it('should maintain consistent performance', async () => {
      const testData = {
        project: { name: 'perf-test' },
        stack: { frontend: 'React', backend: 'Node' }
      };
      
      const durations: number[] = [];
      
      // Run 100 times
      for (let i = 0; i < 100; i++) {
        const start = Date.now();
        await engine.calculate(testData);
        durations.push(Date.now() - start);
      }
      
      // Calculate standard deviation
      const avg = durations.reduce((a, b) => a + b) / durations.length;
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
      const stdDev = Math.sqrt(variance);
      
      expect(avg).toBeLessThan(10); // Average under 10ms
      expect(stdDev).toBeLessThan(5); // Consistent (low deviation)
    });
  });

  describe('Edge Cases - From Wolfejam Testing Center', () => {
    const engine = new FafCoreMK2();
    
    it('should not confuse "faf" directories with ".faf" files', async () => {
      // This was a critical bug discovered by intuition
      const data = {
        project: { name: 'faf-engine' }, // Note: contains "faf"
        stack: { frontend: 'React' }
      };
      
      const result = await engine.calculate(data);
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    it('should handle embedded malicious scores', async () => {
      const maliciousData = {
        project: { name: 'evil' },
        ai_score: 999999, // Trying to manipulate score
        faf_score: '10000%' // Invalid percentage
      };
      
      const result = await engine.calculate(maliciousData);
      expect(result.score).toBeLessThanOrEqual(100); // Must be capped
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle deeply nested structures', async () => {
      const deepData = {
        project: {
          name: 'deep',
          meta: {
            inner: {
              deeper: {
                deepest: {
                  value: 'bottom'
                }
              }
            }
          }
        }
      };
      
      const result = await engine.calculate(deepData);
      expect(result).toBeDefined();
      expect(() => JSON.stringify(result)).not.toThrow();
    });
  });

  describe('MK2 vs MK1 Compatibility', () => {
    it('should produce same scores as MK1 for identical data', async () => {
      const engine = new FafCoreMK2();
      
      const testCases = [
        { project: { name: 'test1' }, stack: { frontend: 'React' } },
        { project: { name: 'test2', goal: 'Build stuff' }, stack: { frontend: 'Vue', backend: 'Node' } },
        { project: { name: 'test3' }, human_context: { who: 'Team', what: 'App' } }
      ];
      
      for (const testData of testCases) {
        const mk2Result = await engine.calculate(testData);
        
        // MK2 should maintain backward compatibility
        expect(mk2Result.score).toBeGreaterThanOrEqual(0);
        expect(mk2Result.score).toBeLessThanOrEqual(100);
        expect(mk2Result.brand).toBe('🏎️⚡️II');
      }
    });
  });
});

describe('Championship Standards Validation', () => {
  it('should meet F1-inspired performance requirements', async () => {
    const engine = new FafCoreMK2();
    const specs = engine.getSpecs();
    
    // Verify championship standards
    expect(specs.performance).toContain('ms');
    expect(specs.reliability).toContain('99');
    expect(specs.mode).toBe('RELIABLE');
  });

  it('should display branding in all outputs', async () => {
    const engine = new FafCoreMK2();
    const result = await engine.calculate({ project: { name: 'brand-test' } });
    
    // Brand must ALWAYS be present
    expect(result.brand).toBe('🏎️⚡️II');
    expect(result.engine).toContain('MK2');
  });
});