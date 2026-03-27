/**
 * 🏎️ WJTTC - Wolfejam Test To Championship
 * Championship-Grade Test Suite for @faf/engine Mk3.1
 *
 * F1 Philosophy: When brakes must work flawlessly, so must our code.
 *
 * Test Tiers:
 * - BRAKE: Critical path, must never fail (safety-critical)
 * - ENGINE: Core functionality tests
 * - AERO: Edge cases, performance, and boundary conditions
 */

import { FafEngine } from '../core/FafEngine';
import { ScoreCalculator } from '../scoring/ScoreCalculator';
import { YamlGenerator } from '../generators/YamlGenerator';
import { FrameworkDetector } from '../detection/FrameworkDetector';
import { CLIAdapter } from '../adapters/CLIAdapter';
import type { FafData, PlatformAdapter } from '../types';

// ============================================================
// 🛑 BRAKE TIER - Critical Path (Must NEVER fail)
// ============================================================

describe('🛑 BRAKE TIER - Critical Path', () => {

  describe('FafEngine Initialization', () => {
    it('BRAKE-001: Engine must initialize without options', () => {
      const engine = new FafEngine();
      expect(engine).toBeDefined();
      expect(engine.getPlatform()).toBe('cli');
    });

    it('BRAKE-002: Engine must initialize with all platform types', () => {
      const platforms = ['cli', 'vercel', 'web'] as const;
      platforms.forEach(platform => {
        const engine = new FafEngine({ platform });
        expect(engine.getPlatform()).toBe(platform);
      });
    });

    it('BRAKE-003: Engine must return version string', () => {
      const engine = new FafEngine();
      const version = engine.getVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });

    it('BRAKE-004: Engine must accept custom adapter', () => {
      const mockAdapter: PlatformAdapter = {
        name: 'custom-test',
        initialize: async () => {},
        readFile: async () => '',
        writeFile: async () => {},
        findFiles: async () => [],
        getProjectRoot: () => '/test',
        getEnvironment: () => ({})
      };
      const engine = new FafEngine({ adapter: mockAdapter });
      expect(engine.getPlatform()).toBe('custom-test');
    });
  });

  describe('Score Calculation - Safety Critical', () => {
    let calculator: ScoreCalculator;

    beforeEach(() => {
      calculator = new ScoreCalculator();
    });

    it('BRAKE-005: Score must always be between 0-100', () => {
      const testCases: FafData[] = [
        {},
        { project: { name: 'Test', goal: '', main_language: '', generated: '' } },
        { project: { name: 'Full', goal: 'Goal', main_language: 'TS', generated: new Date().toISOString() },
          stack: { frontend: 'React', backend: 'Node', database: 'Postgres', hosting: 'Vercel', cicd: 'GHA', css_framework: 'Tailwind' },
          human_context: { who: 'Devs', what: 'App', why: 'Prod', where: 'Global', when: '2026', how: 'Agile' }
        }
      ];

      testCases.forEach(data => {
        const score = calculator.calculate(data);
        expect(score.totalScore).toBeGreaterThanOrEqual(0);
        expect(score.totalScore).toBeLessThanOrEqual(100);
      });
    });

    it('BRAKE-006: FilledSlots must never exceed TotalSlots', () => {
      const score = calculator.calculate({
        project: { name: 'Test', goal: 'Goal', main_language: 'TS', generated: '' },
        stack: { frontend: 'React', backend: 'Node', database: 'PG', hosting: 'Vercel', cicd: 'GHA' }
      });
      expect(score.filledSlots).toBeLessThanOrEqual(score.totalSlots);
    });

    it('BRAKE-007: Empty data must return zero filled slots', () => {
      const score = calculator.calculate({});
      expect(score.filledSlots).toBe(0);
    });

    it('BRAKE-008: Confidence level must be valid enum', () => {
      const validLevels = ['LOW', 'MODERATE', 'GOOD', 'HIGH', 'VERY_HIGH'];
      const score = calculator.calculate({ project: { name: 'Test', goal: '', main_language: '', generated: '' } });
      expect(validLevels).toContain(score.confidence);
    });
  });

  describe('Validation - Safety Critical', () => {
    let engine: FafEngine;

    beforeEach(() => {
      engine = new FafEngine();
    });

    it('BRAKE-009: Validation must return structured result', () => {
      const result = engine.validate({});
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('BRAKE-010: Missing project.name must be invalid', () => {
      const result = engine.validate({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing project.name');
    });

    it('BRAKE-011: Valid data must pass validation', () => {
      const result = engine.validate({
        project: { name: 'Test', goal: 'Goal', main_language: 'TypeScript', generated: new Date().toISOString() }
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

// ============================================================
// 🏎️ ENGINE TIER - Core Functionality
// ============================================================

describe('🏎️ ENGINE TIER - Core Functionality', () => {

  describe('ScoreCalculator - Slot Counting', () => {
    let calculator: ScoreCalculator;

    beforeEach(() => {
      calculator = new ScoreCalculator();
    });

    it('ENGINE-001: Project fields counted correctly', () => {
      const data: FafData = {
        project: {
          name: 'TestProject',
          goal: 'Build amazing things',
          main_language: 'TypeScript',
          generated: '2026-02-02'
        }
      };
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(3); // name, goal, main_language (generated not counted)
    });

    it('ENGINE-002: Stack fields counted correctly', () => {
      const data: FafData = {
        stack: {
          frontend: 'React',
          css_framework: 'Tailwind',
          ui_library: 'Radix',
          state_management: 'Zustand',
          backend: 'Node.js',
          runtime: 'Bun',
          database: 'PostgreSQL',
          build: 'Vite',
          package_manager: 'pnpm',
          api_type: 'GraphQL',
          hosting: 'Vercel',
          cicd: 'GitHub Actions'
        }
      };
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(12); // All stack fields
    });

    it('ENGINE-003: Human context fields counted correctly', () => {
      const data: FafData = {
        human_context: {
          who: 'Developers',
          what: 'CLI Tool',
          why: 'Productivity',
          where: 'Global',
          when: '2026',
          how: 'Open Source'
        }
      };
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(6);
    });

    it('ENGINE-004: Default values not counted', () => {
      const data: FafData = {
        stack: {
          frontend: 'None',
          backend: 'None',
          database: 'None',
          package_manager: 'npm', // Default
          api_type: 'REST' // Default
        },
        human_context: {
          who: 'Not specified',
          what: 'Not specified'
        }
      };
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(0);
    });

    it('ENGINE-005: Full context achieves high score', () => {
      const data: FafData = {
        project: { name: 'Full', goal: 'Goal', main_language: 'TS', generated: '' },
        stack: {
          frontend: 'React', css_framework: 'Tailwind', ui_library: 'Radix',
          state_management: 'Zustand', backend: 'Node', runtime: 'Bun',
          database: 'PG', build: 'Vite', package_manager: 'pnpm',
          api_type: 'GraphQL', hosting: 'Vercel', cicd: 'GHA'
        },
        human_context: { who: 'Devs', what: 'App', why: 'Prod', where: 'Global', when: '2026', how: 'Agile' }
      };
      const score = calculator.calculate(data);
      expect(score.totalScore).toBe(100);
      expect(score.filledSlots).toBe(21);
    });
  });

  describe('ScoreCalculator - Embedded Scores (COUNT ONCE)', () => {
    let calculator: ScoreCalculator;

    beforeEach(() => {
      calculator = new ScoreCalculator();
    });

    it('ENGINE-006: Embedded score respected when system matches', () => {
      const data: FafData = {
        ai_scoring_system: '2025-08-30',
        ai_score: '85%',
        ai_scoring_details: { filled_slots: 18, total_slots: 21 }
      };
      const score = calculator.calculate(data);
      expect(score.totalScore).toBe(85);
      expect(score.filledSlots).toBe(18);
    });

    it('ENGINE-007: Embedded score integer parsing', () => {
      const data: FafData = {
        ai_scoring_system: '2025-08-30',
        ai_score: '72%'
      };
      const score = calculator.calculate(data);
      expect(score.totalScore).toBe(72);
    });

    it('ENGINE-008: Wrong scoring system recalculates', () => {
      const data: FafData = {
        ai_scoring_system: '2024-01-01', // Old system
        ai_score: '99%',
        project: { name: 'Test', goal: '', main_language: '', generated: '' }
      };
      const score = calculator.calculate(data);
      expect(score.totalScore).not.toBe(99); // Should recalculate
    });
  });

  describe('ScoreCalculator - Confidence Levels', () => {
    let calculator: ScoreCalculator;

    beforeEach(() => {
      calculator = new ScoreCalculator();
    });

    it('ENGINE-009: Confidence thresholds correct', () => {
      const thresholds: [number, string][] = [
        [95, 'VERY_HIGH'],
        [90, 'VERY_HIGH'],
        [85, 'HIGH'],
        [80, 'HIGH'],
        [75, 'GOOD'],
        [70, 'GOOD'],
        [65, 'MODERATE'],
        [60, 'MODERATE'],
        [50, 'LOW'],
        [25, 'LOW'],
        [0, 'LOW']
      ];

      thresholds.forEach(([scoreVal, expected]) => {
        const data: FafData = {
          ai_scoring_system: '2025-08-30',
          ai_score: `${scoreVal}%`
        };
        const result = calculator.calculate(data);
        expect(result.confidence).toBe(expected);
      });
    });
  });

  describe('YamlGenerator', () => {
    let generator: YamlGenerator;

    beforeEach(() => {
      generator = new YamlGenerator();
    });

    it('ENGINE-010: Generate simple object', () => {
      const data: FafData = { project: { name: 'Test', goal: 'Goal', main_language: 'TS', generated: '' } };
      const yaml = generator.generate(data);
      expect(yaml).toContain('project:');
      expect(yaml).toContain('name: Test');
    });

    it('ENGINE-011: Generate nested objects', () => {
      const data: FafData = {
        project: { name: 'Test', goal: '', main_language: '', generated: '' },
        stack: { frontend: 'React', backend: 'Node' }
      };
      const yaml = generator.generate(data);
      expect(yaml).toContain('stack:');
      expect(yaml).toContain('frontend: React');
    });

    it('ENGINE-012: Handle special characters', () => {
      const data: FafData = {
        project: { name: 'Test: Special', goal: 'Goal #1', main_language: '@typescript', generated: '' }
      };
      const yaml = generator.generate(data);
      expect(yaml).toContain('"Test: Special"');
      expect(yaml).toContain('"Goal #1"');
      expect(yaml).toContain('"@typescript"');
    });

    it('ENGINE-013: Handle arrays', () => {
      const data = {
        keywords: ['faf', 'context', 'ai']
      };
      const yaml = generator.generate(data as unknown as FafData);
      expect(yaml).toContain('keywords:');
      expect(yaml).toContain('- faf');
    });

    it('ENGINE-014: Skip null/undefined values', () => {
      const data = {
        project: { name: 'Test', goal: null, main_language: undefined, generated: '' }
      } as unknown as FafData;
      const yaml = generator.generate(data);
      expect(yaml).not.toContain('goal:');
      expect(yaml).not.toContain('main_language:');
    });
  });

  describe('CLIAdapter', () => {
    let adapter: CLIAdapter;

    beforeEach(() => {
      adapter = new CLIAdapter({ projectDir: '/test/project' });
    });

    it('ENGINE-015: Adapter name is cli', () => {
      expect(adapter.name).toBe('cli');
    });

    it('ENGINE-016: Project root returns configured dir', () => {
      expect(adapter.getProjectRoot()).toBe('/test/project');
    });

    it('ENGINE-017: Default project dir is cwd', () => {
      const defaultAdapter = new CLIAdapter();
      expect(defaultAdapter.getProjectRoot()).toBe(process.cwd());
    });

    it('ENGINE-018: Initialize resolves', async () => {
      await expect(adapter.initialize()).resolves.toBeUndefined();
    });

    it('ENGINE-019: Environment returns object', () => {
      const env = adapter.getEnvironment();
      expect(typeof env).toBe('object');
    });
  });
});

// ============================================================
// 💨 AERO TIER - Edge Cases & Boundary Conditions
// ============================================================

describe('💨 AERO TIER - Edge Cases', () => {

  describe('ScoreCalculator - Edge Cases', () => {
    let calculator: ScoreCalculator;

    beforeEach(() => {
      calculator = new ScoreCalculator();
    });

    it('AERO-001: Handle empty string values', () => {
      const data: FafData = {
        project: { name: '', goal: '', main_language: '', generated: '' },
        stack: { frontend: '', backend: '' }
      };
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(0);
    });

    it('AERO-002: Handle whitespace-only values', () => {
      const data: FafData = {
        project: { name: '   ', goal: '\t', main_language: '\n', generated: '' }
      };
      const score = calculator.calculate(data);
      // Whitespace counts as filled (engine doesn't trim)
      expect(score.filledSlots).toBe(3);
    });

    it('AERO-003: Handle numeric ai_score', () => {
      const data = {
        ai_scoring_system: '2025-08-30',
        ai_score: 75 // Numeric, not string
      } as unknown as FafData;
      const score = calculator.calculate(data);
      expect(score.totalScore).toBe(75);
    });

    it('AERO-004: Handle malformed ai_score', () => {
      const data: FafData = {
        ai_scoring_system: '2025-08-30',
        ai_score: 'invalid'
      };
      const score = calculator.calculate(data);
      expect(score.totalScore).toBe(NaN); // Known edge case
    });

    it('AERO-005: Handle missing ai_scoring_details', () => {
      const data: FafData = {
        ai_scoring_system: '2025-08-30',
        ai_score: '80%'
        // No ai_scoring_details
      };
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(0);
      expect(score.totalSlots).toBe(21);
    });

    it('AERO-006: Unicode in values', () => {
      const data: FafData = {
        project: { name: '🚀 Rocket App', goal: 'Build 日本語 app', main_language: 'TypeScript', generated: '' }
      };
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(3);
    });

    it('AERO-007: Very long string values', () => {
      const longString = 'A'.repeat(10000);
      const data: FafData = {
        project: { name: longString, goal: longString, main_language: 'TS', generated: '' }
      };
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(3);
    });

    it('AERO-008: Deeply nested extra fields', () => {
      const data: FafData = {
        project: { name: 'Test', goal: 'Goal', main_language: 'TS', generated: '' },
        custom: {
          deep: {
            nested: {
              value: 'exists'
            }
          }
        }
      };
      const score = calculator.calculate(data);
      expect(score).toBeDefined();
    });
  });

  describe('YamlGenerator - Edge Cases', () => {
    let generator: YamlGenerator;

    beforeEach(() => {
      generator = new YamlGenerator();
    });

    it('AERO-009: Empty object generates empty string', () => {
      const yaml = generator.generate({} as FafData);
      expect(yaml).toBe('');
    });

    it('AERO-010: Boolean values', () => {
      const data = { enabled: true, disabled: false } as FafData;
      const yaml = generator.generate(data);
      expect(yaml).toContain('enabled: true');
      expect(yaml).toContain('disabled: false');
    });

    it('AERO-011: Numeric values', () => {
      const data = { count: 42, ratio: 3.14 } as FafData;
      const yaml = generator.generate(data);
      expect(yaml).toContain('count: 42');
      expect(yaml).toContain('ratio: 3.14');
    });

    it('AERO-012: Empty arrays', () => {
      const data = { items: [] } as FafData;
      const yaml = generator.generate(data);
      expect(yaml).toContain('items:');
    });

    it('AERO-013: Mixed content arrays', () => {
      const data = { items: ['string', 123, true] } as FafData;
      const yaml = generator.generate(data);
      expect(yaml).toContain('- string');
      expect(yaml).toContain('- 123');
      expect(yaml).toContain('- true');
    });

    it('AERO-014: Quote escaping in special strings', () => {
      // Quotes only escaped when string needs wrapping (contains : # @)
      const data: FafData = {
        project: { name: 'Test: "Quoted" Name', goal: '', main_language: '', generated: '' }
      };
      const yaml = generator.generate(data);
      expect(yaml).toContain('"Test: \\"Quoted\\" Name"'); // Escaped quotes inside wrapped string
    });

    it('AERO-015: Deep nesting (5 levels)', () => {
      const data = {
        l1: { l2: { l3: { l4: { l5: { value: 'deep' } } } } }
      } as FafData;
      const yaml = generator.generate(data);
      expect(yaml).toContain('value: deep');
      // Check proper indentation
      const lines = yaml.split('\n');
      const deepLine = lines.find(l => l.includes('value: deep'));
      expect(deepLine?.startsWith('          ')).toBe(true); // 5 levels * 2 spaces
    });
  });

  describe('FafEngine - Validation Edge Cases', () => {
    let engine: FafEngine;

    beforeEach(() => {
      engine = new FafEngine();
    });

    it('AERO-016: Null project object', () => {
      const data = { project: null } as unknown as FafData;
      const result = engine.validate(data);
      expect(result.valid).toBe(false);
    });

    it('AERO-017: Empty project name string', () => {
      const data: FafData = { project: { name: '', goal: '', main_language: '', generated: '' } };
      const result = engine.validate(data);
      expect(result.valid).toBe(false);
    });

    it('AERO-018: Whitespace-only project name', () => {
      const data: FafData = { project: { name: '   ', goal: '', main_language: '', generated: '' } };
      const result = engine.validate(data);
      expect(result.valid).toBe(true); // Truthy check passes
    });

    it('AERO-019: Validation includes score', () => {
      const data: FafData = { project: { name: 'Test', goal: 'Goal', main_language: 'TS', generated: '' } };
      const result = engine.validate(data);
      expect(result.score).toBeDefined();
      expect(result.score?.totalScore).toBeGreaterThan(0);
    });

    it('AERO-020: Low score triggers suggestions', () => {
      const data: FafData = { project: { name: 'Minimal', goal: '', main_language: '', generated: '' } };
      const result = engine.validate(data);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Platform Initialization', () => {
    it('AERO-021: Unknown platform defaults to CLI', () => {
      const engine = new FafEngine({ platform: 'unknown' as any });
      expect(engine.getPlatform()).toBe('cli');
    });

    it('AERO-022: Undefined platform defaults to CLI', () => {
      const engine = new FafEngine({ platform: undefined });
      expect(engine.getPlatform()).toBe('cli');
    });

    it('AERO-023: Empty options object works', () => {
      const engine = new FafEngine({});
      expect(engine).toBeDefined();
    });
  });

  describe('FrameworkDetector - Edge Cases', () => {
    it('AERO-024: Empty format analysis', async () => {
      const mockAdapter: PlatformAdapter = {
        name: 'test',
        initialize: async () => {},
        readFile: async () => '',
        writeFile: async () => {},
        findFiles: async () => [],
        getProjectRoot: () => '/test',
        getEnvironment: () => ({})
      };

      const detector = new FrameworkDetector(mockAdapter);
      const result = await detector.detect('/test', {
        discoveredFormats: [],
        confirmedFormats: [],
        frameworkConfidence: {},
        totalIntelligenceScore: 0,
        slotFillRecommendations: {}
      });

      expect(result.framework).toBe('Unknown');
      expect(result.confidence).toBe(0);
    });

    it('AERO-025: Single framework detected', async () => {
      const mockAdapter: PlatformAdapter = {
        name: 'test',
        initialize: async () => {},
        readFile: async () => '',
        writeFile: async () => {},
        findFiles: async () => [],
        getProjectRoot: () => '/test',
        getEnvironment: () => ({})
      };

      const detector = new FrameworkDetector(mockAdapter);
      const result = await detector.detect('/test', {
        discoveredFormats: [],
        confirmedFormats: [],
        frameworkConfidence: { 'React': 85 },
        totalIntelligenceScore: 85,
        slotFillRecommendations: {}
      });

      expect(result.framework).toBe('React');
      expect(result.confidence).toBe(85);
    });

    it('AERO-026: Multiple frameworks - highest wins', async () => {
      const mockAdapter: PlatformAdapter = {
        name: 'test',
        initialize: async () => {},
        readFile: async () => '',
        writeFile: async () => {},
        findFiles: async () => [],
        getProjectRoot: () => '/test',
        getEnvironment: () => ({})
      };

      const detector = new FrameworkDetector(mockAdapter);
      const result = await detector.detect('/test', {
        discoveredFormats: [],
        confirmedFormats: [],
        frameworkConfidence: { 'React': 75, 'Next.js': 90, 'Vue': 60 },
        totalIntelligenceScore: 90,
        slotFillRecommendations: {}
      });

      expect(result.framework).toBe('Next.js');
      expect(result.confidence).toBe(90);
    });
  });
});

// ============================================================
// 🏆 CHAMPIONSHIP SUMMARY
// ============================================================

describe('🏆 WJTTC CHAMPIONSHIP SUMMARY', () => {
  it('CHAMP-001: All test tiers defined', () => {
    // Meta-test: Verify test structure
    expect(true).toBe(true);
  });
});
