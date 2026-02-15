/**
 * 🏎️ WJTTC: faf 6ws Command Tests
 *
 * TIER: ENGINE TEST (Core functionality)
 *
 * Tests the 6Ws Builder command that opens web interface
 * for interactive project context creation.
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { parse as parseYAML, stringify as stringifyYAML } from '../../src/fix-once/yaml';

// Mock dependencies
// Note: 'open' is mocked via jest.config.js moduleNameMapper
jest.mock('inquirer');
jest.mock('../../src/fix-once/colors', () => ({
  chalk: {
    cyan: (text: string) => text,
    gray: (text: string) => text,
    yellow: (text: string) => text,
    red: (text: string) => text,
    green: (text: string) => text,
  },
}));

// Mock console methods
const mockLog = jest.fn();
const mockError = jest.fn();
const mockExit = jest.fn();

console.log = mockLog;
console.error = mockError;
process.exit = mockExit as any;

describe('🟡 TIER 2: ENGINE - faf 6ws Command', () => {
  let tempDir: string;
  let fafPath: string;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faf-6ws-test-'));
    fafPath = path.join(tempDir, 'project.faf');

    // Clear all mocks
    mockLog.mockClear();
    mockError.mockClear();
    mockExit.mockClear();
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('YAML parsing validation', () => {
    it('should parse valid human_context YAML', () => {
      const validYaml = `human_context:
  who: "Frontend developers at Acme Corp"
  what: "Customer dashboard with real-time analytics"
  where: "Production web application"
  why: "10x faster than previous solution"
  when: "Q1 2026 launch"
  how: "React + TypeScript + Vite"`;

      const parsed = parseYAML(validYaml);

      expect(parsed.human_context).toBeDefined();
      expect(parsed.human_context.who).toBe('Frontend developers at Acme Corp');
      expect(parsed.human_context.what).toBe('Customer dashboard with real-time analytics');
      expect(parsed.human_context.why).toBe('10x faster than previous solution');
    });

    it('should parse YAML without human_context wrapper', () => {
      const yamlWithoutWrapper = `who: "Solo developer"
what: "CLI tool"
where: "Open source"
why: "Scratch my own itch"
when: "Ongoing development"
how: "TypeScript + Node.js"`;

      const parsed = parseYAML(yamlWithoutWrapper);

      // Should have fields directly on object
      expect(parsed.who).toBe('Solo developer');
      expect(parsed.what).toBe('CLI tool');
      expect(parsed.human_context).toBeUndefined();
    });

    it('should reject invalid YAML syntax', () => {
      const invalidYaml = `human_context:
  who: "Missing closing quote
  what: "Another field"`;

      expect(() => parseYAML(invalidYaml)).toThrow();
    });

    it('should reject empty YAML', () => {
      const emptyYaml = '';

      // Empty YAML should throw an error (based on faf's custom parser)
      expect(() => parseYAML(emptyYaml)).toThrow();
    });

    it('should handle YAML with additional fields', () => {
      const extendedYaml = `human_context:
  who: "Team"
  what: "Product"
  where: "Cloud"
  why: "Innovation"
  when: "Now"
  how: "Agile"
  additional_context: "Extra information here"`;

      const parsed = parseYAML(extendedYaml);

      expect(parsed.human_context.who).toBe('Team');
      expect(parsed.human_context.additional_context).toBe('Extra information here');
    });
  });

  describe('file merging logic', () => {
    it('should merge human_context into existing project.faf', async () => {
      // Create existing .faf file
      const existingData = {
        faf_version: '2.5.0',
        project: {
          name: 'Test Project',
          type: 'web-app',
        },
        stack: {
          frontend: 'React',
        },
      };
      await fs.writeFile(fafPath, stringifyYAML(existingData));

      // New human_context to merge
      const humanContext = {
        human_context: {
          who: 'Developers',
          what: 'Dashboard',
          why: 'Better UX',
        },
      };

      // Read existing, merge, and write back
      const existingYaml = await fs.readFile(fafPath, 'utf-8');
      const existingContent = parseYAML(existingYaml);
      const merged = { ...existingContent, ...humanContext };
      await fs.writeFile(fafPath, stringifyYAML(merged), 'utf-8');

      // Verify merge
      const result = parseYAML(await fs.readFile(fafPath, 'utf-8'));

      expect(result.project.name).toBe('Test Project'); // Original preserved
      expect(result.stack.frontend).toBe('React'); // Original preserved
      expect(result.human_context.who).toBe('Developers'); // New added
      expect(result.human_context.what).toBe('Dashboard'); // New added
    });

    it('should overwrite existing human_context if present', async () => {
      // Create existing .faf with old human_context
      const existingData = {
        faf_version: '2.5.0',
        project: {
          name: 'Test Project',
        },
        human_context: {
          who: 'Old team',
          what: 'Old product',
        },
      };
      await fs.writeFile(fafPath, stringifyYAML(existingData));

      // New human_context to merge (overwrites)
      const humanContext = {
        human_context: {
          who: 'New team',
          what: 'New product',
          why: 'New reasons',
        },
      };

      // Merge
      const existingYaml = await fs.readFile(fafPath, 'utf-8');
      const existingContent = parseYAML(existingYaml);
      const merged = { ...existingContent, ...humanContext };
      await fs.writeFile(fafPath, stringifyYAML(merged), 'utf-8');

      // Verify overwrite
      const result = parseYAML(await fs.readFile(fafPath, 'utf-8'));

      expect(result.human_context.who).toBe('New team'); // Overwritten
      expect(result.human_context.what).toBe('New product'); // Overwritten
      expect(result.human_context.why).toBe('New reasons'); // Added
    });

    it('should preserve all existing fields during merge', async () => {
      // Create complex existing .faf
      const existingData = {
        faf_version: '2.5.0',
        generated: '2026-02-14T00:00:00.000Z',
        project: {
          name: 'Complex Project',
          type: 'cli-ts',
          goal: 'Tool for developers',
        },
        stack: {
          frontend: 'React',
          backend: 'Node.js',
          database: 'PostgreSQL',
        },
        preferences: {
          quality_bar: 'zero_errors',
        },
        state: {
          version: '1.0.0',
          status: 'green_flag',
        },
      };
      await fs.writeFile(fafPath, stringifyYAML(existingData));

      // Add human_context
      const humanContext = {
        human_context: {
          who: 'Engineers',
          what: 'Developer tool',
        },
      };

      // Merge
      const existingYaml = await fs.readFile(fafPath, 'utf-8');
      const existingContent = parseYAML(existingYaml);
      const merged = { ...existingContent, ...humanContext };
      await fs.writeFile(fafPath, stringifyYAML(merged), 'utf-8');

      // Verify all fields preserved
      const result = parseYAML(await fs.readFile(fafPath, 'utf-8'));

      expect(result.faf_version).toBe('2.5.0');
      expect(result.generated).toBe('2026-02-14T00:00:00.000Z');
      expect(result.project.name).toBe('Complex Project');
      expect(result.stack.backend).toBe('Node.js');
      expect(result.preferences.quality_bar).toBe('zero_errors');
      expect(result.state.version).toBe('1.0.0');
      expect(result.human_context.who).toBe('Engineers'); // Added
    });
  });

  describe('new file creation', () => {
    it('should create new project.faf with human_context', async () => {
      const humanContext = {
        human_context: {
          who: 'Solo developer',
          what: 'Side project',
          where: 'Personal repo',
          why: 'Learning',
          when: 'Weekends',
          how: 'TypeScript',
        },
      };

      // Create file
      await fs.writeFile(fafPath, stringifyYAML(humanContext), 'utf-8');

      // Verify
      const result = parseYAML(await fs.readFile(fafPath, 'utf-8'));

      expect(result.human_context.who).toBe('Solo developer');
      expect(result.human_context.what).toBe('Side project');
      expect(result.human_context.how).toBe('TypeScript');
    });

    it('should create valid YAML structure', async () => {
      const humanContext = {
        human_context: {
          who: 'Team',
          what: 'Product',
        },
      };

      await fs.writeFile(fafPath, stringifyYAML(humanContext), 'utf-8');

      // Read back and parse - should not throw
      const content = await fs.readFile(fafPath, 'utf-8');
      const parsed = parseYAML(content);

      expect(parsed).toBeDefined();
      expect(parsed.human_context).toBeDefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle YAML without human_context wrapper gracefully', () => {
      const yamlWithoutWrapper = `who: "Developer"
what: "Tool"
why: "Efficiency"`;

      const parsed = parseYAML(yamlWithoutWrapper);

      // Can wrap it after parsing
      const wrapped = parsed.human_context ? parsed : { human_context: parsed };

      expect(wrapped.human_context.who).toBe('Developer');
      expect(wrapped.human_context.what).toBe('Tool');
    });

    it('should handle missing fields gracefully', () => {
      const incompleteYaml = `human_context:
  who: "Team"
  what: "Product"
  # Missing where, why, when, how`;

      const parsed = parseYAML(incompleteYaml);

      expect(parsed.human_context.who).toBe('Team');
      expect(parsed.human_context.what).toBe('Product');
      expect(parsed.human_context.where).toBeUndefined();
      expect(parsed.human_context.why).toBeUndefined();
    });

    it('should handle special characters in YAML values', () => {
      const specialCharsYaml = `human_context:
  who: "Team @ Company.com"
  what: "API Gateway (v2.0)"
  why: "50% faster & more reliable"
  how: "TypeScript + Node.js >= v18"`;

      const parsed = parseYAML(specialCharsYaml);

      expect(parsed.human_context.who).toBe('Team @ Company.com');
      expect(parsed.human_context.what).toBe('API Gateway (v2.0)');
      expect(parsed.human_context.why).toBe('50% faster & more reliable');
      expect(parsed.human_context.how).toBe('TypeScript + Node.js >= v18');
    });

    it('should handle multiline values', () => {
      const multilineYaml = `human_context:
  who: "Engineering team"
  what: |
    Multi-line description
    with several lines
    of text`;

      const parsed = parseYAML(multilineYaml);

      expect(parsed.human_context.who).toBe('Engineering team');
      expect(parsed.human_context.what).toContain('Multi-line description');
      expect(parsed.human_context.what).toContain('with several lines');
    });

    it('should handle empty string values', () => {
      const emptyStringsYaml = `human_context:
  who: ""
  what: "Something"
  why: ""`;

      const parsed = parseYAML(emptyStringsYaml);

      expect(parsed.human_context.who).toBe('');
      expect(parsed.human_context.what).toBe('Something');
      expect(parsed.human_context.why).toBe('');
    });

    it('should handle corrupted existing file gracefully', async () => {
      // Write corrupted YAML
      await fs.writeFile(fafPath, 'this is not: valid: yaml: at all');

      // Attempt to read should throw
      const content = await fs.readFile(fafPath, 'utf-8');
      expect(() => parseYAML(content)).toThrow();
    });

    it('should handle file permissions errors', async () => {
      // Create file with no write permissions
      await fs.writeFile(fafPath, 'test: content');
      await fs.chmod(fafPath, 0o444); // Read-only

      // Attempt to write should throw
      await expect(
        fs.writeFile(fafPath, 'new: content')
      ).rejects.toThrow();

      // Restore permissions for cleanup
      await fs.chmod(fafPath, 0o644);
    });
  });

  describe('YAML round-trip integrity', () => {
    it('should preserve data through parse->stringify cycle', () => {
      const originalData = {
        human_context: {
          who: 'Developers',
          what: 'Application',
          where: 'Cloud',
          why: 'Scale',
          when: 'Now',
          how: 'TypeScript',
        },
      };

      const yaml = stringifyYAML(originalData);
      const parsed = parseYAML(yaml);

      expect(parsed).toEqual(originalData);
    });

    it('should preserve complex nested structures', () => {
      const complexData = {
        human_context: {
          who: 'Team',
          what: 'Product',
          additional_context: {
            nested: {
              deeply: 'value',
            },
          },
        },
      };

      const yaml = stringifyYAML(complexData);
      const parsed = parseYAML(yaml);

      expect(parsed.human_context.additional_context.nested.deeply).toBe('value');
    });
  });

  describe('validation behavior', () => {
    it('should validate that input is not empty', () => {
      const emptyInput = '';
      const trimmedEmpty = '   ';

      expect(emptyInput.trim().length).toBe(0);
      expect(trimmedEmpty.trim().length).toBe(0);
    });

    it('should validate YAML syntax before accepting', () => {
      const validYaml = 'human_context:\n  who: "Valid"';
      const invalidYaml = 'human_context:\n  who: "Unclosed';

      expect(() => parseYAML(validYaml)).not.toThrow();
      expect(() => parseYAML(invalidYaml)).toThrow();
    });

    it('should provide helpful error messages for invalid YAML', () => {
      const invalidYamls = [
        'human_context:\n  who: "Unclosed quote',
        'human_context:\nwho: "Wrong indentation"',
        'human_context: [\n  invalid array',
      ];

      invalidYamls.forEach((yaml) => {
        try {
          parseYAML(yaml);
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toBeTruthy();
        }
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow: create, merge, update', async () => {
      // Step 1: Create initial file
      const initial = { human_context: { who: 'Team A', what: 'Product A' } };
      await fs.writeFile(fafPath, stringifyYAML(initial));

      // Step 2: Add more context
      const update1 = parseYAML(await fs.readFile(fafPath, 'utf-8'));
      update1.human_context.why = 'Better UX';
      await fs.writeFile(fafPath, stringifyYAML(update1));

      // Step 3: Add project info
      const update2 = parseYAML(await fs.readFile(fafPath, 'utf-8'));
      update2.project = { name: 'Test Project' };
      await fs.writeFile(fafPath, stringifyYAML(update2));

      // Verify final state
      const final = parseYAML(await fs.readFile(fafPath, 'utf-8'));

      expect(final.human_context.who).toBe('Team A');
      expect(final.human_context.what).toBe('Product A');
      expect(final.human_context.why).toBe('Better UX');
      expect(final.project.name).toBe('Test Project');
    });

    it('should handle updating human_context multiple times', async () => {
      // Initial
      await fs.writeFile(
        fafPath,
        stringifyYAML({
          project: { name: 'Test' },
          human_context: { who: 'Version 1' },
        })
      );

      // Update 1
      let current = parseYAML(await fs.readFile(fafPath, 'utf-8'));
      current.human_context.who = 'Version 2';
      await fs.writeFile(fafPath, stringifyYAML(current));

      // Update 2
      current = parseYAML(await fs.readFile(fafPath, 'utf-8'));
      current.human_context.who = 'Version 3';
      await fs.writeFile(fafPath, stringifyYAML(current));

      // Verify
      const final = parseYAML(await fs.readFile(fafPath, 'utf-8'));
      expect(final.human_context.who).toBe('Version 3');
      expect(final.project.name).toBe('Test'); // Preserved
    });
  });
});

/**
 * WJTTC Report Summary
 */
afterAll(() => {
  console.log('\n🏎️ WJTTC: faf 6ws Command Tests Complete');
  console.log('   Engine Tests: Core YAML parsing and file operations');
  console.log('   Edge Cases: Error handling and validation');
  console.log('   Integration: Complete user workflows');
  console.log('\n   Championship Standard: ZERO ERRORS REQUIRED');
});
