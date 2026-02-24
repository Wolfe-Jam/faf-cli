/**
 * Tests for agents command (AGENTS.md interop)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  parseAgentsMd,
  agentsImport,
  agentsExport,
  detectAgentsMd,
} from '../../src/utils/agents-parser';

describe('AGENTS.md Parser', () => {
  const testDir = path.join(__dirname, '../temp-agents');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  describe('parseAgentsMd', () => {
    it('should parse project name from H1', () => {
      const content = '# My Cool Project\n\n## Overview\n- Some detail';
      const result = parseAgentsMd(content);
      expect(result.projectName).toBe('My Cool Project');
    });

    it('should parse H2 sections with bullets', () => {
      const content = [
        '# Test Project',
        '',
        '## Tech Stack',
        '- TypeScript',
        '- Node.js',
        '',
        '## Code Style',
        '- Use strict mode',
      ].join('\n');

      const result = parseAgentsMd(content);
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].title).toBe('Tech Stack');
      expect(result.sections[0].content).toEqual(['TypeScript', 'Node.js']);
      expect(result.sections[1].title).toBe('Code Style');
      expect(result.sections[1].content).toEqual(['Use strict mode']);
    });

    it('should handle empty content', () => {
      const result = parseAgentsMd('');
      expect(result.projectName).toBe('Unknown Project');
      expect(result.sections).toHaveLength(0);
    });
  });

  describe('agentsImport', () => {
    it('should import AGENTS.md into FAF structure', async () => {
      const agentsContent = [
        '# faf-cli',
        '',
        '## Build and Test Commands',
        '- npm run build',
        '- npm test',
        '',
        '## Code Style Guidelines',
        '- Use TypeScript strict mode',
      ].join('\n');

      const agentsPath = path.join(testDir, 'AGENTS.md');
      await fs.writeFile(agentsPath, agentsContent);

      const result = await agentsImport(agentsPath);
      expect(result.success).toBe(true);
      expect(result.faf.project.name).toBe('faf-cli');
      expect(result.faf.project.buildCommands).toContain('npm run build');
      expect(result.faf.project.codingStyle).toContain('Use TypeScript strict mode');
      expect(result.sectionsFound).toContain('Build and Test Commands');
    });

    it('should return failure for missing file', async () => {
      const result = await agentsImport('/nonexistent/AGENTS.md');
      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('agentsExport', () => {
    it('should export FAF content to AGENTS.md format', async () => {
      const fafContent = {
        project: {
          name: 'test-project',
          goal: 'A test project for FAF',
        },
        stack: {
          frontend: 'React',
          backend: 'Node.js',
          build: 'TypeScript (tsc)',
        },
        ai_instructions: {
          warnings: ['Never modify core files without approval'],
        },
        preferences: {
          quality_bar: 'zero_errors',
          testing: 'required',
        },
        human_context: {
          how: 'Test-driven development',
        },
      };

      const outputPath = path.join(testDir, 'AGENTS.md');
      const result = await agentsExport(fafContent, outputPath);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(outputPath);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# test-project');
      expect(content).toContain('## Project Overview');
      expect(content).toContain('## Tech Stack');
      expect(content).toContain('Frontend: React');
      expect(content).toContain('Backend: Node.js');
      expect(content).toContain('## Code Style Guidelines');
      expect(content).toContain('Never modify core files without approval');
      expect(content).toContain('## Build and Test Commands');
      expect(content).toContain('Test-driven development');
    });

    it('should handle minimal FAF content', async () => {
      const fafContent = {
        project: { name: 'minimal' },
      };

      const outputPath = path.join(testDir, 'AGENTS.md');
      const result = await agentsExport(fafContent, outputPath);

      expect(result.success).toBe(true);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# minimal');
      expect(content).toContain('## Project Overview');
    });
  });

  describe('detectAgentsMd', () => {
    it('should detect AGENTS.md in directory', async () => {
      await fs.writeFile(path.join(testDir, 'AGENTS.md'), '# Test');
      const result = await detectAgentsMd(testDir);
      expect(result).toBe(path.join(testDir, 'AGENTS.md'));
    });

    it('should return null when not found', async () => {
      const result = await detectAgentsMd(testDir);
      expect(result).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('should survive export → import round-trip', async () => {
      const originalFaf = {
        project: {
          name: 'round-trip-test',
          goal: 'Testing round-trip fidelity',
        },
        stack: {
          frontend: 'Svelte',
          backend: 'Deno',
          build: 'esbuild',
        },
        preferences: {
          quality_bar: 'high',
          testing: 'required',
        },
      };

      // Export to AGENTS.md
      const agentsPath = path.join(testDir, 'AGENTS.md');
      const exportResult = await agentsExport(originalFaf, agentsPath);
      expect(exportResult.success).toBe(true);

      // Import back
      const importResult = await agentsImport(agentsPath);
      expect(importResult.success).toBe(true);
      expect(importResult.faf.project.name).toBe('round-trip-test');
      expect(importResult.sectionsFound.length).toBeGreaterThan(0);
    });
  });
});
