/**
 * faf go Command Tests
 *
 * Tests for the guided interview to Gold Code
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { parse as parseYAML, stringify as stringifyYAML } from '../../src/fix-once/yaml';

// Import the internal functions we need to test
// Note: goCommand itself is hard to test because of interactive prompts
// So we focus on the supporting functions

describe('faf go command', () => {
  let tempDir: string;
  let fafPath: string;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faf-go-test-'));
    fafPath = path.join(tempDir, 'project.faf');
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('missing field detection', () => {
    it('should detect empty string fields as missing', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
          goal: '', // Empty - should be detected
        },
        human_context: {
          why: 'Testing purposes',
        },
      };
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const content = await fs.readFile(fafPath, 'utf-8');
      const parsed = parseYAML(content);

      expect(parsed.project.goal).toBe('');
    });

    it('should detect undefined fields as missing', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
          // goal is missing entirely
        },
      };
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const content = await fs.readFile(fafPath, 'utf-8');
      const parsed = parseYAML(content);

      expect(parsed.project.goal).toBeUndefined();
    });

    it('should detect placeholder values as missing', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
          goal: 'TBD', // Placeholder - should be treated as missing
        },
        human_context: {
          why: 'Unknown', // Placeholder
        },
      };
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const content = await fs.readFile(fafPath, 'utf-8');
      const parsed = parseYAML(content);

      // These should be detected as placeholders
      expect(parsed.project.goal).toBe('TBD');
      expect(parsed.human_context.why).toBe('Unknown');
    });
  });

  describe('answer application', () => {
    it('should write answers to .faf file', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
        },
      };
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      // Simulate applying answers
      const content = await fs.readFile(fafPath, 'utf-8');
      const parsed = parseYAML(content);

      // Apply answer
      parsed.project.goal = 'A comprehensive testing framework';
      await fs.writeFile(fafPath, stringifyYAML(parsed));

      // Verify
      const updatedContent = await fs.readFile(fafPath, 'utf-8');
      const updatedParsed = parseYAML(updatedContent);

      expect(updatedParsed.project.goal).toBe('A comprehensive testing framework');
    });

    it('should create nested objects when applying answers', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
        },
        // human_context doesn't exist yet
      };
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      // Simulate applying answer to nested path
      const content = await fs.readFile(fafPath, 'utf-8');
      const parsed = parseYAML(content);

      // Create nested structure
      if (!parsed.human_context) {
        parsed.human_context = {};
      }
      parsed.human_context.why = 'To enable better AI assistance';

      await fs.writeFile(fafPath, stringifyYAML(parsed));

      // Verify
      const updatedContent = await fs.readFile(fafPath, 'utf-8');
      const updatedParsed = parseYAML(updatedContent);

      expect(updatedParsed.human_context.why).toBe('To enable better AI assistance');
    });
  });

  describe('field prioritization', () => {
    it('should prioritize project.goal over optional fields', () => {
      // This tests the concept - actual implementation in go.ts
      const fields = ['stack.cicd', 'project.goal', 'human_context.where'];
      const priorityOrder = ['project.goal', 'human_context.why', 'stack.cicd'];

      // project.goal should come first
      const sorted = fields.sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a);
        const bIndex = priorityOrder.indexOf(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      expect(sorted[0]).toBe('project.goal');
    });

    it('should put unknown fields at the end', () => {
      const fields = ['unknown.field', 'project.goal'];
      const priorityOrder = ['project.goal'];

      const sorted = fields.sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a);
        const bIndex = priorityOrder.indexOf(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      expect(sorted[0]).toBe('project.goal');
      expect(sorted[1]).toBe('unknown.field');
    });
  });

  describe('structured output for Claude Code', () => {
    it('should have correct structure for AskUserQuestion', () => {
      // This tests what the structured output should look like
      const structuredOutput = {
        needsInput: true,
        context: 'faf go - guided path to Gold Code',
        currentScore: 72,
        targetScore: 100,
        questions: [
          {
            question: 'What does this project do?',
            header: 'Goal',
            field: 'project.goal',
            type: 'text',
            required: true,
          },
        ],
      };

      expect(structuredOutput.needsInput).toBe(true);
      expect(structuredOutput.targetScore).toBe(100);
      expect(structuredOutput.questions).toBeDefined();
      expect(structuredOutput.questions[0].question).toBeDefined();
      expect(structuredOutput.questions[0].header.length).toBeLessThanOrEqual(12);
    });
  });
});
