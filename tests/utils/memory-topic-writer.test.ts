/**
 * Memory Topic Writer Tests — Claude Code Auto-Memory Topic Files
 *
 * Tests the .faf → individual topic file mapping and writing.
 */

import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  mapFafToTopics,
  formatTopicFile,
  writeTopicFiles,
  readTopicFiles,
  MemoryTopicFile,
} from '../../src/utils/memory-topic-writer';

describe('Memory Topic Writer', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faf-topic-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  // ========================================================================
  // Mapping .faf → Topics
  // ========================================================================

  describe('mapFafToTopics', () => {
    it('should create project topic from project section', () => {
      const fafData = {
        project: {
          name: 'my-project',
          goal: 'Build something great',
          type: 'cli',
          main_language: 'TypeScript',
        },
      };

      const topics = mapFafToTopics(fafData);
      const project = topics.find(t => t.fileName === 'faf_project.md');

      expect(project).toBeDefined();
      expect(project!.type).toBe('project');
      expect(project!.content).toContain('my-project');
      expect(project!.content).toContain('Build something great');
      expect(project!.content).toContain('cli');
    });

    it('should create stack topic from stack section', () => {
      const fafData = {
        project: { name: 'test' },
        stack: {
          framework: 'React',
          backend: 'Node.js',
          db: 'PostgreSQL',
          build: 'Vite',
          pkg_manager: 'npm',
        },
      };

      const topics = mapFafToTopics(fafData);
      const stack = topics.find(t => t.fileName === 'faf_stack.md');

      expect(stack).toBeDefined();
      expect(stack!.type).toBe('reference');
      expect(stack!.content).toContain('React');
      expect(stack!.content).toContain('PostgreSQL');
      expect(stack!.content).toContain('Node.js');
    });

    it('should accept old slot names (backward compat)', () => {
      const fafData = {
        project: { name: 'old-format' },
        stack: {
          frontend: 'Vue',
          database: 'MySQL',
          package_manager: 'pnpm',
        },
      };

      const topics = mapFafToTopics(fafData);
      const stack = topics.find(t => t.fileName === 'faf_stack.md');

      expect(stack).toBeDefined();
      expect(stack!.content).toContain('Vue');
      expect(stack!.content).toContain('MySQL');
      expect(stack!.content).toContain('pnpm');
    });

    it('should skip None/Unknown stack values', () => {
      const fafData = {
        project: { name: 'test' },
        stack: {
          framework: 'React',
          db: 'None',
          backend: 'Unknown',
        },
      };

      const topics = mapFafToTopics(fafData);
      const stack = topics.find(t => t.fileName === 'faf_stack.md');

      expect(stack).toBeDefined();
      expect(stack!.content).toContain('React');
      expect(stack!.content).not.toContain('None');
      expect(stack!.content).not.toContain('Unknown');
    });

    it('should create human context topic', () => {
      const fafData = {
        project: { name: 'test' },
        human_context: {
          who: 'Developers',
          what: 'CLI tool',
          why: 'Productivity',
        },
      };

      const topics = mapFafToTopics(fafData);
      const context = topics.find(t => t.fileName === 'faf_context.md');

      expect(context).toBeDefined();
      expect(context!.type).toBe('project');
      expect(context!.content).toContain('Developers');
      expect(context!.content).toContain('Productivity');
      expect(context!.description).toContain('3 of 6');
    });

    it('should create preferences topic from preferences + warnings', () => {
      const fafData = {
        project: { name: 'test' },
        preferences: {
          quality_bar: 'zero_errors',
          testing: 'required',
        },
        ai_instructions: {
          warnings: ['Never modify core files without approval'],
        },
      };

      const topics = mapFafToTopics(fafData);
      const prefs = topics.find(t => t.fileName === 'faf_preferences.md');

      expect(prefs).toBeDefined();
      expect(prefs!.type).toBe('feedback');
      expect(prefs!.content).toContain('zero_errors');
      expect(prefs!.content).toContain('Never modify core files');
    });

    it('should create key files topic', () => {
      const fafData = {
        project: { name: 'test' },
        instant_context: {
          key_files: ['src/index.ts', 'package.json'],
        },
      };

      const topics = mapFafToTopics(fafData);
      const files = topics.find(t => t.fileName === 'faf_key_files.md');

      expect(files).toBeDefined();
      expect(files!.type).toBe('reference');
      expect(files!.content).toContain('src/index.ts');
    });

    it('should create state topic when phase/focus present', () => {
      const fafData = {
        project: { name: 'test' },
        state: {
          phase: 'beta',
          focus: 'performance optimization',
          version: '2.0.0',
        },
      };

      const topics = mapFafToTopics(fafData);
      const state = topics.find(t => t.fileName === 'faf_state.md');

      expect(state).toBeDefined();
      expect(state!.type).toBe('project');
      expect(state!.content).toContain('beta');
      expect(state!.content).toContain('performance optimization');
    });

    it('should return empty array for empty .faf', () => {
      const topics = mapFafToTopics({});
      expect(topics).toEqual([]);
    });

    it('should create multiple topics for rich .faf', () => {
      const fafData = {
        project: { name: 'rich-project', goal: 'Everything', type: 'fullstack', main_language: 'TypeScript' },
        stack: { framework: 'React', backend: 'Express', db: 'PostgreSQL' },
        human_context: { who: 'Team', what: 'App', why: 'Growth' },
        preferences: { quality_bar: 'high' },
        instant_context: { key_files: ['src/app.ts'] },
        state: { phase: 'production' },
      };

      const topics = mapFafToTopics(fafData);
      expect(topics.length).toBe(6); // project, stack, context, preferences, key_files, state
    });
  });

  // ========================================================================
  // Format Topic File
  // ========================================================================

  describe('formatTopicFile', () => {
    it('should produce valid frontmatter format', () => {
      const topic: MemoryTopicFile = {
        fileName: 'faf_project.md',
        name: 'Test — Identity',
        description: 'Project identity from .faf',
        type: 'project',
        content: '**Test Project**\nA CLI tool',
        keywords: 'test, cli',
      };

      const output = formatTopicFile(topic);

      expect(output).toContain('---\n');
      expect(output).toContain('name: Test — Identity');
      expect(output).toContain('description: Project identity from .faf');
      expect(output).toContain('type: project');
      expect(output).toContain('**Test Project**');
    });
  });

  // ========================================================================
  // Write Topic Files
  // ========================================================================

  describe('writeTopicFiles', () => {
    it('should write topic files to disk', async () => {
      const topics = mapFafToTopics({
        project: { name: 'write-test', goal: 'Testing writes' },
        stack: { framework: 'Svelte', backend: 'SvelteKit' },
      });

      const result = await writeTopicFiles(topics, testDir);

      expect(result.success).toBe(true);
      expect(result.filesWritten.length).toBeGreaterThan(0);

      // Verify files exist
      for (const fileName of result.filesWritten) {
        const content = await fs.readFile(path.join(testDir, fileName), 'utf-8');
        expect(content).toContain('---');
        expect(content).toContain('name:');
        expect(content).toContain('type:');
      }
    });

    it('should create MEMORY.md index', async () => {
      const topics = mapFafToTopics({
        project: { name: 'index-test', goal: 'Testing index' },
      });

      const result = await writeTopicFiles(topics, testDir);
      expect(result.indexUpdated).toBe(true);

      const index = await fs.readFile(path.join(testDir, 'MEMORY.md'), 'utf-8');
      expect(index).toContain('## FAF Context (tri-sync)');
      expect(index).toContain('faf_project.md');
    });

    it('should preserve existing MEMORY.md content when updating index', async () => {
      // Create existing MEMORY.md with user content
      const existingIndex = [
        '# Claude Code Memory — Index',
        '',
        '| File | Keywords |',
        '|------|----------|',
        '| `user_role.md` | senior engineer, TypeScript |',
        '',
      ].join('\n');
      await fs.writeFile(path.join(testDir, 'MEMORY.md'), existingIndex);

      const topics = mapFafToTopics({
        project: { name: 'preserve-test', goal: 'Testing merge' },
      });

      await writeTopicFiles(topics, testDir);

      const index = await fs.readFile(path.join(testDir, 'MEMORY.md'), 'utf-8');
      // Should have both user content and FAF section
      expect(index).toContain('user_role.md');
      expect(index).toContain('faf_project.md');
    });

    it('should skip existing files in preserveExisting mode', async () => {
      // Pre-create a topic file with custom content
      await fs.writeFile(
        path.join(testDir, 'faf_project.md'),
        '---\nname: Custom\ndescription: User modified\ntype: project\n---\n\nCustom content\n'
      );

      const topics = mapFafToTopics({
        project: { name: 'skip-test', goal: 'Should not overwrite' },
      });

      const result = await writeTopicFiles(topics, testDir, { preserveExisting: true });

      expect(result.warnings).toContain('Skipped existing: faf_project.md');

      // Verify original content preserved
      const content = await fs.readFile(path.join(testDir, 'faf_project.md'), 'utf-8');
      expect(content).toContain('Custom content');
    });

    it('should overwrite files when preserveExisting is false', async () => {
      await fs.writeFile(path.join(testDir, 'faf_project.md'), 'old content');

      const topics = mapFafToTopics({
        project: { name: 'overwrite-test', goal: 'New content' },
      });

      await writeTopicFiles(topics, testDir);

      const content = await fs.readFile(path.join(testDir, 'faf_project.md'), 'utf-8');
      expect(content).toContain('overwrite-test');
      expect(content).not.toContain('old content');
    });
  });

  // ========================================================================
  // Read Topic Files (for import)
  // ========================================================================

  describe('readTopicFiles', () => {
    it('should read back written topic files', async () => {
      const fafData = {
        project: { name: 'roundtrip', goal: 'Testing read' },
        stack: { framework: 'React', backend: 'Express' },
      };

      const originalTopics = mapFafToTopics(fafData);
      await writeTopicFiles(originalTopics, testDir);

      const readBack = await readTopicFiles(testDir);
      expect(readBack.length).toBe(originalTopics.length);

      const projectTopic = readBack.find(t => t.fileName === 'faf_project.md');
      expect(projectTopic).toBeDefined();
      expect(projectTopic!.name).toContain('roundtrip');
      expect(projectTopic!.type).toBe('project');
    });

    it('should only read faf_ prefixed files', async () => {
      // Write a non-faf file
      await fs.writeFile(
        path.join(testDir, 'user_role.md'),
        '---\nname: My Role\ndescription: test\ntype: user\n---\n\nI am a dev\n'
      );
      // Write a faf file
      await fs.writeFile(
        path.join(testDir, 'faf_project.md'),
        '---\nname: Project\ndescription: test\ntype: project\n---\n\nContent\n'
      );

      const topics = await readTopicFiles(testDir);
      expect(topics.length).toBe(1);
      expect(topics[0].fileName).toBe('faf_project.md');
    });

    it('should return empty array for non-existent directory', async () => {
      const topics = await readTopicFiles('/nonexistent/path');
      expect(topics).toEqual([]);
    });
  });

  // ========================================================================
  // Index Update Idempotency
  // ========================================================================

  describe('index updates', () => {
    it('should replace FAF section on re-export (not duplicate)', async () => {
      const topics1 = mapFafToTopics({
        project: { name: 'v1', goal: 'First version' },
      });
      const topics2 = mapFafToTopics({
        project: { name: 'v2', goal: 'Second version' },
        stack: { framework: 'React' },
      });

      await writeTopicFiles(topics1, testDir);
      await writeTopicFiles(topics2, testDir);

      const index = await fs.readFile(path.join(testDir, 'MEMORY.md'), 'utf-8');
      const fafSectionCount = (index.match(/## FAF Context \(tri-sync\)/g) || []).length;
      expect(fafSectionCount).toBe(1);

      // Should have v2 topics, not v1
      expect(index).toContain('faf_stack.md');
    });
  });
});
