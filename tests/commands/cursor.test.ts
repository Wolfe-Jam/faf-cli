/**
 * Tests for cursor command (.cursorrules interop)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  parseCursorRules,
  cursorImport,
  cursorExport,
  detectCursorRules,
} from '../../src/utils/cursorrules-parser';

describe('.cursorrules Parser', () => {
  const testDir = path.join(__dirname, '../temp-cursor');

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

  describe('parseCursorRules', () => {
    it('should parse project name from H1', () => {
      const content = '# My Cursor Project\n\n## Rules\n- Be concise';
      const result = parseCursorRules(content);
      expect(result.projectName).toBe('My Cursor Project');
    });

    it('should parse H2 sections with bullets', () => {
      const content = [
        '# Test Project',
        '',
        '## Coding Conventions',
        '- Use 2-space indent',
        '- Prefer const over let',
        '',
        '## Preferences',
        '- Keep responses concise',
      ].join('\n');

      const result = parseCursorRules(content);
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].title).toBe('Coding Conventions');
      expect(result.sections[0].content).toContain('Use 2-space indent');
      expect(result.sections[1].title).toBe('Preferences');
    });

    it('should handle paragraph text in sections', () => {
      const content = [
        '# Project',
        '',
        '## Overview',
        'This project does amazing things.',
        'It uses TypeScript.',
      ].join('\n');

      const result = parseCursorRules(content);
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].content).toContain('This project does amazing things.');
    });

    it('should handle empty content', () => {
      const result = parseCursorRules('');
      expect(result.projectName).toBe('Unknown Project');
      expect(result.sections).toHaveLength(0);
    });
  });

  describe('cursorImport', () => {
    it('should import .cursorrules into FAF structure', async () => {
      const cursorContent = [
        '# my-app',
        '',
        '## Coding Style',
        '- Use TypeScript strict mode',
        '- Prefer functional components',
        '',
        '## Rules',
        '- Never use any type',
      ].join('\n');

      const cursorPath = path.join(testDir, '.cursorrules');
      await fs.writeFile(cursorPath, cursorContent);

      const result = await cursorImport(cursorPath);
      expect(result.success).toBe(true);
      expect(result.faf.project.name).toBe('my-app');
      expect(result.faf.project.codingStyle).toContain('Use TypeScript strict mode');
      expect(result.faf.project.rules).toContain('Never use any type');
    });

    it('should handle section-less .cursorrules as guidelines', async () => {
      const cursorContent = [
        'Use TypeScript.',
        'Keep functions small.',
        'Write tests.',
      ].join('\n');

      const cursorPath = path.join(testDir, '.cursorrules');
      await fs.writeFile(cursorPath, cursorContent);

      const result = await cursorImport(cursorPath);
      expect(result.success).toBe(true);
      expect(result.faf.project.guidelines.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('No sections found in .cursorrules — treating all content as guidelines');
    });

    it('should return failure for missing file', async () => {
      const result = await cursorImport('/nonexistent/.cursorrules');
      expect(result.success).toBe(false);
    });
  });

  describe('cursorExport', () => {
    it('should export FAF content to .cursorrules format', async () => {
      const fafContent = {
        project: {
          name: 'test-project',
          goal: 'A test project',
        },
        stack: {
          frontend: 'React',
          backend: 'Express',
          runtime: 'Node.js 20',
        },
        ai_instructions: {
          warnings: ['All code must be typed'],
          working_style: {
            quality_bar: 'strict',
            testing: 'required',
          },
        },
        preferences: {
          quality_bar: 'zero_errors',
          testing: 'required',
          documentation: 'as_needed',
        },
        human_context: {
          how: 'npm run build && npm test',
        },
      };

      const outputPath = path.join(testDir, '.cursorrules');
      const result = await cursorExport(fafContent, outputPath);

      expect(result.success).toBe(true);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# test-project');
      expect(content).toContain('## Tech Stack');
      expect(content).toContain('Frontend: React');
      expect(content).toContain('## Coding Standards');
      expect(content).toContain('All code must be typed');
      expect(content).toContain('## Preferences');
      expect(content).toContain('## Build Commands');
    });

    it('should handle minimal FAF content', async () => {
      const fafContent = {
        project: { name: 'minimal' },
      };

      const outputPath = path.join(testDir, '.cursorrules');
      const result = await cursorExport(fafContent, outputPath);

      expect(result.success).toBe(true);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# minimal');
    });
  });

  describe('detectCursorRules', () => {
    it('should detect .cursorrules in directory', async () => {
      await fs.writeFile(path.join(testDir, '.cursorrules'), '# Test');
      const result = await detectCursorRules(testDir);
      expect(result).toBe(path.join(testDir, '.cursorrules'));
    });

    it('should return null when not found', async () => {
      const result = await detectCursorRules(testDir);
      expect(result).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('should survive export → import round-trip', async () => {
      const originalFaf = {
        project: {
          name: 'cursor-round-trip',
          goal: 'Testing round-trip',
        },
        stack: {
          frontend: 'Vue',
          backend: 'FastAPI',
        },
        preferences: {
          quality_bar: 'strict',
        },
      };

      // Export to .cursorrules
      const cursorPath = path.join(testDir, '.cursorrules');
      const exportResult = await cursorExport(originalFaf, cursorPath);
      expect(exportResult.success).toBe(true);

      // Import back
      const importResult = await cursorImport(cursorPath);
      expect(importResult.success).toBe(true);
      expect(importResult.faf.project.name).toBe('cursor-round-trip');
      expect(importResult.sectionsFound.length).toBeGreaterThan(0);
    });
  });
});
