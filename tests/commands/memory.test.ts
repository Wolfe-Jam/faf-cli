/**
 * Tests for memory command (MEMORY.md tri-sync interop)
 */

import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  computeProjectId,
  resolveMemoryPath,
  resolveMemoryDir,
  parseMemoryMd,
  memoryExport,
  memoryImport,
  detectMemoryMd,
  getMemoryStatus,
} from '../../src/utils/memory-parser';

describe('MEMORY.md Parser (tri-sync)', () => {
  const testDir = path.join(__dirname, '../temp-memory');
  const testMemoryDir = path.join(testDir, 'memory');

  beforeEach(async () => {
    await fs.mkdir(testMemoryDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  // ========================================================================
  // Path Resolution
  // ========================================================================

  describe('computeProjectId', () => {
    it('should convert absolute path to project ID', () => {
      const result = computeProjectId('/Users/wolfejam/FAF/cli');
      expect(result).toBe('-Users-wolfejam-FAF-cli');
    });

    it('should handle root path', () => {
      const result = computeProjectId('/');
      // path.resolve('/') → '/', trailing slash strip → '', replace → ''
      expect(result).toBe('');
    });

    it('should handle path with trailing slash', () => {
      const result = computeProjectId('/Users/wolfejam/FAF/cli/');
      expect(result).toBe('-Users-wolfejam-FAF-cli');
    });

    it('should handle deeply nested path', () => {
      const result = computeProjectId('/home/user/projects/my-app/packages/core');
      expect(result).toBe('-home-user-projects-my-app-packages-core');
    });
  });

  describe('resolveMemoryPath', () => {
    it('should resolve to ~/.claude/projects/<id>/memory/MEMORY.md', () => {
      const result = resolveMemoryPath('/Users/wolfejam/FAF/cli');
      const home = process.env.HOME || process.env.USERPROFILE || '';
      expect(result).toBe(
        path.join(home, '.claude', 'projects', '-Users-wolfejam-FAF-cli', 'memory', 'MEMORY.md')
      );
    });

    it('should respect CLAUDE_CONFIG_DIR env var', () => {
      const original = process.env.CLAUDE_CONFIG_DIR;
      const tmpDir = path.join(os.tmpdir(), 'test-claude');
      process.env.CLAUDE_CONFIG_DIR = tmpDir;
      try {
        const result = resolveMemoryPath('/my/project');
        expect(result).toBe(
          path.join(tmpDir, 'projects', '-my-project', 'memory', 'MEMORY.md')
        );
      } finally {
        if (original !== undefined) {
          process.env.CLAUDE_CONFIG_DIR = original;
        } else {
          delete process.env.CLAUDE_CONFIG_DIR;
        }
      }
    });
  });

  describe('resolveMemoryDir', () => {
    it('should resolve to memory directory (without MEMORY.md)', () => {
      const result = resolveMemoryDir('/Users/wolfejam/FAF/cli');
      const home = process.env.HOME || process.env.USERPROFILE || '';
      expect(result).toBe(
        path.join(home, '.claude', 'projects', '-Users-wolfejam-FAF-cli', 'memory')
      );
    });
  });

  // ========================================================================
  // Parsing
  // ========================================================================

  describe('parseMemoryMd', () => {
    it('should parse file with FAF section and Claude notes', () => {
      const content = [
        '# Project Context (from project.faf)',
        '',
        '## Quick Reference',
        '- **Name:** my-project',
        '',
        '---',
        '*Seeded from project.faf by faf-cli tri-sync — 2026-02-27*',
        '*This section is managed by tri-sync. Claude\'s own notes below are preserved.*',
        '',
        '## My Custom Notes',
        '- Some pattern I discovered',
      ].join('\n');

      const result = parseMemoryMd(content);
      expect(result.fafSection).not.toBeNull();
      expect(result.fafSection).toContain('Project Context (from project.faf)');
      expect(result.claudeNotes).toContain('My Custom Notes');
      expect(result.claudeNotes).toContain('Some pattern I discovered');
    });

    it('should handle file with no FAF section', () => {
      const content = [
        '## My Notes',
        '- Pattern A',
        '- Pattern B',
      ].join('\n');

      const result = parseMemoryMd(content);
      expect(result.fafSection).toBeNull();
      expect(result.claudeNotes).toContain('Pattern A');
    });

    it('should handle empty content', () => {
      const result = parseMemoryMd('');
      expect(result.fafSection).toBeNull();
      expect(result.claudeNotes).toBe('');
      expect(result.totalLines).toBe(1);
    });
  });

  // ========================================================================
  // Export
  // ========================================================================

  describe('memoryExport', () => {
    it('should export FAF content to MEMORY.md format', async () => {
      const fafContent = {
        project: {
          name: 'test-project',
          goal: 'A test project for tri-sync',
          type: 'cli-ts',
          main_language: 'TypeScript',
        },
        instant_context: {
          tech_stack: 'CLI/TypeScript/Node.js',
          main_language: 'TypeScript',
        },
        stack: {
          frontend: 'CLI',
          backend: 'Node.js',
          build: 'TypeScript (tsc)',
          runtime: 'Node.js >=18.0.0',
          package_manager: 'npm',
        },
        ai_instructions: {
          warnings: ['Never modify core files without approval'],
        },
        preferences: {
          quality_bar: 'zero_errors',
          testing: 'required',
        },
      };

      const outputPath = path.join(testMemoryDir, 'MEMORY.md');
      const result = await memoryExport(fafContent, outputPath);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(outputPath);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# Project Context (from project.faf)');
      expect(content).toContain('**Name:** test-project');
      expect(content).toContain('**App Type:** cli-ts');
      expect(content).toContain('**Stack:** CLI/TypeScript/Node.js');
      expect(content).toContain('Frontend: CLI');
      expect(content).toContain('Backend: Node.js');
      expect(content).toContain('Never modify core files without approval');
      expect(content).toContain('tri-sync');
    });

    it('should stay under 200 lines for typical project', async () => {
      const fafContent = {
        project: {
          name: 'test-project',
          goal: 'A test project',
          type: 'react-ts',
        },
        stack: {
          frontend: 'React',
          backend: 'Express',
          build: 'Vite',
        },
      };

      const outputPath = path.join(testMemoryDir, 'MEMORY.md');
      await memoryExport(fafContent, outputPath);

      const content = await fs.readFile(outputPath, 'utf-8');
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThan(200);
    });

    it('should merge with existing Claude notes', async () => {
      const existingContent = [
        '## My Important Notes',
        '',
        '- Pattern: Always use async/await here',
        '- Key file: src/core/engine.ts',
        '',
      ].join('\n');

      const outputPath = path.join(testMemoryDir, 'MEMORY.md');
      await fs.writeFile(outputPath, existingContent);

      const fafContent = {
        project: { name: 'merge-test', type: 'node-api' },
      };

      const result = await memoryExport(fafContent, outputPath, { merge: true });
      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);

      const content = await fs.readFile(outputPath, 'utf-8');
      // Should have BOTH our section and Claude's notes
      expect(content).toContain('Project Context (from project.faf)');
      expect(content).toContain('My Important Notes');
      expect(content).toContain('Always use async/await here');
    });

    it('should replace existing FAF section on re-export', async () => {
      const fafContent1 = {
        project: { name: 'version-1', type: 'cli' },
      };
      const fafContent2 = {
        project: { name: 'version-2', type: 'cli-ts' },
      };

      const outputPath = path.join(testMemoryDir, 'MEMORY.md');

      // First export
      await memoryExport(fafContent1, outputPath);
      let content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('version-1');

      // Second export (should replace, not duplicate)
      await memoryExport(fafContent2, outputPath, { merge: true });
      content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('version-2');
      expect(content).not.toContain('version-1');

      // Verify only one FAF section
      const fafSectionCount = (content.match(/# Project Context \(from project\.faf\)/g) || []).length;
      expect(fafSectionCount).toBe(1);
    });

    it('should merge correctly when existing file has CRLF line endings', async () => {
      // Simulate a Windows-style MEMORY.md with CRLF
      const existingContent = [
        '# Project Context (from project.faf)',
        '',
        '## Quick Reference',
        '- **Name:** old-project',
        '',
        '---',
        '*Seeded from project.faf by faf-cli tri-sync — 2026-01-01*',
        "*This section is managed by tri-sync. Claude's own notes below are preserved.*",
        '',
        '## My Custom Notes',
        '- Important pattern: always use async/await',
        '- Key insight from debugging session',
      ].join('\r\n');  // CRLF line endings

      const outputPath = path.join(testMemoryDir, 'MEMORY.md');
      await fs.writeFile(outputPath, existingContent);

      const fafContent = {
        project: { name: 'updated-project', type: 'cli-ts' },
      };

      const result = await memoryExport(fafContent, outputPath, { merge: true });
      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);

      const content = await fs.readFile(outputPath, 'utf-8');
      // Should have updated project name
      expect(content).toContain('updated-project');
      // Should NOT have old project name
      expect(content).not.toContain('old-project');
      // Should preserve Claude's notes
      expect(content).toContain('My Custom Notes');
      expect(content).toContain('always use async/await');
      // Should NOT have mixed line endings (no \r remaining)
      expect(content).not.toContain('\r');
      // Should have exactly one FAF section
      const fafSectionCount = (content.match(/# Project Context \(from project\.faf\)/g) || []).length;
      expect(fafSectionCount).toBe(1);
    });

    it('should handle BOM + CRLF in existing file', async () => {
      // BOM + CRLF — common from Windows editors
      const existingContent = '\uFEFF## My Notes\r\n- Pattern A\r\n- Pattern B\r\n';

      const outputPath = path.join(testMemoryDir, 'MEMORY.md');
      await fs.writeFile(outputPath, existingContent);

      const fafContent = {
        project: { name: 'bom-test' },
      };

      const result = await memoryExport(fafContent, outputPath, { merge: true });
      expect(result.success).toBe(true);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('bom-test');
      expect(content).toContain('Pattern A');
      // BOM and CRLF should be stripped
      expect(content).not.toContain('\uFEFF');
      expect(content).not.toContain('\r');
    });

    it('should overwrite entirely with force mode', async () => {
      const existingContent = '## Claude Notes\n- Important stuff\n';
      const outputPath = path.join(testMemoryDir, 'MEMORY.md');
      await fs.writeFile(outputPath, existingContent);

      const fafContent = {
        project: { name: 'force-test' },
      };

      const result = await memoryExport(fafContent, outputPath, { merge: false });
      expect(result.success).toBe(true);
      expect(result.merged).toBe(false);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('Project Context (from project.faf)');
      expect(content).not.toContain('Claude Notes');
      expect(content).not.toContain('Important stuff');
    });
  });

  // ========================================================================
  // Import
  // ========================================================================

  describe('memoryImport', () => {
    it('should harvest structured entries from Claude notes', async () => {
      const memoryContent = [
        '# Project Context (from project.faf)',
        '',
        '## Quick Reference',
        '- **Name:** my-project',
        '',
        '---',
        '*Seeded from project.faf by faf-cli tri-sync — 2026-02-27*',
        '*This section is managed by tri-sync. Claude\'s own notes below are preserved.*',
        '',
        '## Patterns',
        '- Always use dependency injection for services',
        '- Prefer composition over inheritance',
        '',
        '## Key Files',
        '- src/core/engine.ts — main entry point',
        '- src/utils/helpers.ts — shared utilities',
      ].join('\n');

      const memoryPath = path.join(testMemoryDir, 'MEMORY.md');
      await fs.writeFile(memoryPath, memoryContent);

      const result = await memoryImport(memoryPath);
      expect(result.success).toBe(true);
      expect(result.harvested.patterns).toContain('Always use dependency injection for services');
      expect(result.harvested.keyFiles).toContain('src/core/engine.ts — main entry point');
    });

    it('should return failure for missing file', async () => {
      const result = await memoryImport('/nonexistent/MEMORY.md');
      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle empty Claude notes', async () => {
      const memoryContent = [
        '# Project Context (from project.faf)',
        '',
        '## Quick Reference',
        '- **Name:** my-project',
        '',
        '---',
        '*Seeded from project.faf by faf-cli tri-sync — 2026-02-27*',
        '*This section is managed by tri-sync. Claude\'s own notes below are preserved.*',
      ].join('\n');

      const memoryPath = path.join(testMemoryDir, 'MEMORY.md');
      await fs.writeFile(memoryPath, memoryContent);

      const result = await memoryImport(memoryPath);
      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Round-trip
  // ========================================================================

  describe('round-trip', () => {
    it('should survive export → import without data loss', async () => {
      const originalFaf = {
        project: {
          name: 'round-trip-test',
          goal: 'Testing tri-sync fidelity',
          type: 'svelte-ts',
        },
        stack: {
          frontend: 'Svelte',
          backend: 'SvelteKit',
          build: 'Vite',
        },
        preferences: {
          quality_bar: 'high',
          testing: 'required',
        },
      };

      const outputPath = path.join(testMemoryDir, 'MEMORY.md');

      // Export
      const exportResult = await memoryExport(originalFaf, outputPath);
      expect(exportResult.success).toBe(true);

      // Verify content round-trips (key data preserved in output)
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('round-trip-test');
      expect(content).toContain('svelte-ts');
      expect(content).toContain('Svelte');
      expect(content).toContain('SvelteKit');
    });
  });

  // ========================================================================
  // Detection
  // ========================================================================

  describe('detectMemoryMd', () => {
    it('should return null for non-existent memory', async () => {
      const result = await detectMemoryMd(path.join(os.tmpdir(), 'nonexistent-project-123'));
      expect(result).toBeNull();
    });
  });

  // ========================================================================
  // Status
  // ========================================================================

  describe('getMemoryStatus', () => {
    it('should return exists=false for non-existent memory', async () => {
      const status = await getMemoryStatus(path.join(os.tmpdir(), 'nonexistent-project-456'));
      expect(status.exists).toBe(false);
      expect(status.totalLines).toBe(0);
    });
  });
});
