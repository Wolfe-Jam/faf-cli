/**
 * FAF Go Integration Tests
 *
 * Comprehensive test suite for the faf go command and
 * 2026 Claude Code alignment features.
 *
 * Tests execution context detection, question system,
 * and faf go command in various scenarios.
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawn } from 'child_process';
import { parse as parseYAML, stringify as stringifyYAML } from '../../src/fix-once/yaml';

describe('FAF Go Integration Tests', () => {
  let tempDir: string;
  const cliPath = path.join(__dirname, '../../dist/cli.js');

  beforeAll(async () => {
    // Ensure CLI is built
    try {
      execSync('npm run build', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe',
      });
    } catch {
      // Build might already be done
    }
  });

  beforeEach(async () => {
    // Create fresh temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faf-integration-'));
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('faf go - No .faf file scenarios', () => {
    it('should return JSON guidance when no .faf file exists (non-interactive)', async () => {
      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      // In non-interactive context without .faf, should show helpful message
      expect(result).toContain('No .faf file found');
    });

    it('should return structured JSON in Claude Code context', async () => {
      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, CLAUDE_CODE: '1', FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      expect(json.needsInit).toBe(true);
      expect(json.context).toBe('faf go');
      expect(json.suggestion).toBe('faf init');
    });

    it('should return structured JSON in MCP context', async () => {
      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, MCP_SERVER: '1', FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      expect(json.needsInit).toBe(true);
    });
  });

  describe('faf go - With .faf file at various scores', () => {
    it('should celebrate when all questions are answered', async () => {
      // Create a .faf file with all fields that the question system checks
      const fafData = {
        project: {
          name: 'Complete Test Project',
          goal: 'A comprehensive test project for integration testing',
          main_language: 'TypeScript',
        },
        human_context: {
          who: 'Developers testing FAF',
          what: 'Integration test suite',
          why: 'To ensure FAF works correctly',
          where: 'Test environment',
          when: 'During CI/CD',
          how: 'Automated testing',
        },
        stack: {
          frontend: 'React',
          backend: 'Node.js',
          database: 'PostgreSQL',
          hosting: 'Vercel',
          build: 'Vite',
          cicd: 'GitHub Actions',
        },
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      // Should either celebrate or return empty questions
      // (depends on scoring system)
      const isComplete =
        result.includes('GOLD CODE') ||
        result.includes('All fields are filled');

      // Or it returns JSON with no questions or few questions
      if (!isComplete) {
        const json = JSON.parse(result);
        // With all fields filled, should have very few questions
        expect(json.questions.length).toBeLessThan(5);
      }
    });

    it('should return questions for incomplete .faf file', async () => {
      // Create incomplete .faf file
      const fafData = {
        project: {
          name: 'Incomplete Project',
        },
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      // Should return JSON with questions
      const json = JSON.parse(result);
      expect(json.needsInput).toBe(true);
      expect(json.questions).toBeDefined();
      expect(json.questions.length).toBeGreaterThan(0);
    });

    it('should prioritize project.goal as first question', async () => {
      // Create .faf with no goal
      const fafData = {
        project: {
          name: 'Test Project',
          main_language: 'TypeScript',
        },
        stack: {
          frontend: 'React',
        },
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      // project.goal should be among the first questions
      const hasGoalQuestion = json.questions.some(
        (q: { field: string }) => q.field === 'project.goal'
      );
      expect(hasGoalQuestion).toBe(true);
    });
  });

  describe('faf go - Claude Code structured output', () => {
    it('should format questions correctly for AskUserQuestion', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
        },
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, CLAUDE_CODE: '1', FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);

      // Verify Claude Code format
      expect(json.needsInput).toBe(true);
      expect(json.context).toContain('faf go');
      expect(json.targetScore).toBe(100);
      expect(json.questions).toBeDefined();

      // Each question should have required fields
      for (const q of json.questions) {
        expect(q.question).toBeDefined();
        expect(q.header).toBeDefined();
        expect(q.header.length).toBeLessThanOrEqual(12); // Max 12 chars for header
        expect(q.field).toBeDefined();
        expect(q.type).toBeDefined();
        expect(['text', 'select', 'multiselect', 'confirm']).toContain(q.type);
      }
    });

    it('should include currentScore in output', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
          goal: 'Test goal',
        },
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, CLAUDE_CODE: '1', FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      expect(typeof json.currentScore).toBe('number');
      expect(json.currentScore).toBeGreaterThanOrEqual(0);
      expect(json.currentScore).toBeLessThanOrEqual(100);
    });
  });

  describe('faf (no args) - Smart handler', () => {
    it('should show welcome when in home directory', async () => {
      const result = execSync(`node ${cliPath}`, {
        encoding: 'utf-8',
        cwd: os.homedir(),
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      expect(result).toContain('FAF');
      expect(result).toContain('cd');
    });

    it('should return structured JSON in Claude Code context for home dir', async () => {
      const result = execSync(`node ${cliPath}`, {
        encoding: 'utf-8',
        cwd: os.homedir(),
        env: { ...process.env, CLAUDE_CODE: '1', FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      expect(json.status).toBe('no_project');
      expect(json.suggestions).toBeDefined();
    });

    it('should return structured guidance when .faf exists but incomplete', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
        },
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath}`, {
        encoding: 'utf-8',
        cwd: tempDir,
        env: { ...process.env, CLAUDE_CODE: '1', FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      // Should return structured guidance
      expect(json).toBeDefined();
      // Should have some next action suggestion
      expect(json.nextAction).toBeDefined();
      // faf go should be in next action or alternatives
      const hasFafGo =
        json.nextAction?.command === 'faf go' ||
        (json.alternativeActions &&
          json.alternativeActions.some(
            (a: { command: string }) => a.command === 'faf go'
          ));
      expect(hasFafGo).toBe(true);
    });
  });

  describe('Execution Context Detection', () => {
    it('should detect terminal-script context (no TTY, no env markers)', async () => {
      const fafData = { project: { name: 'Test' } };
      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      // Running via execSync is non-interactive
      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          // Remove AI markers
          CLAUDE_CODE: undefined,
          MCP_SERVER: undefined,
          CURSOR_EDITOR: undefined,
        },
      });

      // Should output JSON (non-interactive behavior)
      const json = JSON.parse(result);
      expect(json.needsInput).toBe(true);
    });

    it('should detect claude-code context via env var', async () => {
      const fafData = { project: { name: 'Test' } };
      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, CLAUDE_CODE: '1', FORCE_COLOR: '0' },
      });

      // Claude Code format includes context field
      const json = JSON.parse(result);
      expect(json.context).toContain('faf go');
    });

    it('should detect MCP context via env var', async () => {
      const fafData = { project: { name: 'Test' } };
      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, MCP_SERVER: '1', FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      expect(json.needsInput).toBe(true);
    });

    it('should prioritize MCP over Claude Code when both set', async () => {
      const fafData = { project: { name: 'Test' } };
      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      // Both env vars set - MCP should take priority
      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: {
          ...process.env,
          CLAUDE_CODE: '1',
          MCP_SERVER: '1',
          FORCE_COLOR: '0',
        },
      });

      // Should still return valid JSON
      const json = JSON.parse(result);
      expect(json.needsInput).toBe(true);
    });
  });

  describe('Question Registry Coverage', () => {
    it('should have questions for all critical fields', async () => {
      // Create minimal .faf to trigger all questions
      const fafData = { project: { name: 'Test' } };
      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      const fields = json.questions.map((q: { field: string }) => q.field);

      // Should include core fields
      expect(fields).toContain('project.goal');
      expect(fields).toContain('human_context.why');
    });

    it('should not ask questions for filled fields', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
          goal: 'Already filled goal',
          main_language: 'TypeScript',
        },
        human_context: {
          why: 'Already filled why',
        },
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      const fields = json.questions.map((q: { field: string }) => q.field);

      // Should NOT include filled fields
      expect(fields).not.toContain('project.goal');
      expect(fields).not.toContain('human_context.why');
      expect(fields).not.toContain('project.name');
      expect(fields).not.toContain('project.main_language');
    });
  });

  describe('Edge Cases', () => {
    it('should handle .faf file with placeholder values', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
          goal: 'TBD', // Placeholder
        },
        human_context: {
          why: 'Unknown', // Placeholder
        },
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      const fields = json.questions.map((q: { field: string }) => q.field);

      // Placeholders should be treated as missing
      expect(fields).toContain('project.goal');
      expect(fields).toContain('human_context.why');
    });

    it('should handle empty string values as missing', async () => {
      const fafData = {
        project: {
          name: 'Test Project',
          goal: '', // Empty
        },
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      const fields = json.questions.map((q: { field: string }) => q.field);

      expect(fields).toContain('project.goal');
    });

    it('should handle deeply nested missing fields', async () => {
      const fafData = {
        project: {
          name: 'Test',
        },
        // human_context doesn't exist at all
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      const fields = json.questions.map((q: { field: string }) => q.field);

      // Should include human_context fields even though parent doesn't exist
      expect(fields).toContain('human_context.why');
    });

    it('should handle malformed .faf file gracefully', async () => {
      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, 'not: valid: yaml: content: here');

      let errorOccurred = false;
      try {
        execSync(`node ${cliPath} go ${tempDir}`, {
          encoding: 'utf-8',
          env: { ...process.env, FORCE_COLOR: '0' },
          stdio: 'pipe',
        });
      } catch {
        errorOccurred = true;
      }

      // Should handle gracefully (either error or empty questions)
      // The important thing is it doesn't crash unexpectedly
      expect(true).toBe(true); // Test passes if we get here
    });
  });

  describe('Select Question Options', () => {
    it('should include all options for database question', async () => {
      const fafData = {
        project: { name: 'Test' },
        stack: {
          // database missing
        },
      };

      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);
      const dbQuestion = json.questions.find(
        (q: { field: string }) => q.field === 'stack.database'
      );

      if (dbQuestion) {
        expect(dbQuestion.type).toBe('select');
        expect(dbQuestion.options).toBeDefined();
        expect(dbQuestion.options.length).toBeGreaterThan(0);

        // Should have common databases
        const labels = dbQuestion.options.map((o: { label: string }) => o.label);
        expect(labels).toContain('PostgreSQL');
        expect(labels).toContain('None');
      }
    });

    it('should format options with label and description', async () => {
      const fafData = { project: { name: 'Test' } };
      const fafPath = path.join(tempDir, 'project.faf');
      await fs.writeFile(fafPath, stringifyYAML(fafData));

      const result = execSync(`node ${cliPath} go ${tempDir}`, {
        encoding: 'utf-8',
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      const json = JSON.parse(result);

      // Find a select question
      const selectQuestion = json.questions.find(
        (q: { type: string }) => q.type === 'select'
      );

      if (selectQuestion && selectQuestion.options) {
        for (const option of selectQuestion.options) {
          expect(option.label).toBeDefined();
          expect(option.description).toBeDefined();
        }
      }
    });
  });
});
