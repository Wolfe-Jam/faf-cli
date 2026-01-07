/**
 * 🛂 TSA (Type/Stack Analysis) TEST SUITE
 * Testing dependency intelligence and project type detection
 *
 * CRITICAL: Tests the pipeline from package.json → type detection → TYPE_DEFINITIONS mapping
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { detectProjectType } from '../src/utils/file-utils';
import { getSlotsForType, getSlotCountForType } from '../src/compiler/faf-compiler';

describe('🛂 TSA Test Suite', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), 'tsa-test-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('CLI Detection', () => {
    it('should detect cli-ts for package with bin + typescript', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'test-cli',
        bin: { 'test': './dist/cli.js' },
        dependencies: { commander: '^12.0.0' },
        devDependencies: { typescript: '^5.0.0' }
      }));
      await fs.writeFile(path.join(testDir, 'tsconfig.json'), '{}');

      const type = await detectProjectType(testDir);
      expect(type).toMatch(/cli/); // cli or cli-ts
    });

    it('should detect cli for package with bin + no typescript', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'test-cli',
        bin: { 'test': './index.js' },
        dependencies: { commander: '^12.0.0' }
      }));

      const type = await detectProjectType(testDir);
      expect(type).toMatch(/cli/);
    });

    it('cli-ts should resolve to cli slots (9)', () => {
      const slots = getSlotsForType('cli-ts');
      expect(slots.length).toBe(9);
      expect(slots).toContain('project.name');
      expect(slots).toContain('project.goal');
      expect(slots).toContain('human.who');
    });

    it('cli-js should resolve to cli slots (9)', () => {
      const slots = getSlotsForType('cli-js');
      expect(slots.length).toBe(9);
    });
  });

  describe('Framework Detection', () => {
    it('should detect react for React projects', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'test-react',
        dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' }
      }));

      const type = await detectProjectType(testDir);
      expect(type).toMatch(/react|fullstack/);
    });

    it('should detect vue for Vue projects', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'test-vue',
        dependencies: { vue: '^3.0.0' }
      }));

      const type = await detectProjectType(testDir);
      expect(type).toMatch(/vue/);
    });

    it('should detect svelte for Svelte projects', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'test-svelte',
        devDependencies: { svelte: '^4.0.0' }
      }));

      const type = await detectProjectType(testDir);
      expect(type).toMatch(/svelte/);
    });
  });

  describe('TYPE_DEFINITIONS Alias Resolution', () => {
    // These test that TSA outputs map correctly to TYPE_DEFINITIONS
    // Slot counts based on TYPE_DEFINITIONS categories:
    // project: 3, frontend: 4, backend: 5, universal: 3, human: 6
    const aliasTests = [
      { alias: 'cli-ts', canonical: 'cli', slots: 9 },           // project(3) + human(6)
      { alias: 'cli-js', canonical: 'cli', slots: 9 },
      { alias: 'cli-tool', canonical: 'cli', slots: 9 },
      { alias: 'typescript', canonical: 'library', slots: 9 },   // project(3) + human(6)
      { alias: 'pure_typescript', canonical: 'library', slots: 9 },
      { alias: 'nodejs_native', canonical: 'node-api', slots: 17 },    // project(3) + backend(5) + universal(3) + human(6)
      { alias: 'nodejs_esm_native', canonical: 'node-api', slots: 17 },
      { alias: 'react_native', canonical: 'react', slots: 16 },        // project(3) + frontend(4) + universal(3) + human(6)
      { alias: 'svelte_native', canonical: 'svelte', slots: 16 },
      { alias: 'svelte_5_runes_native', canonical: 'svelte', slots: 16 },
      { alias: 'vue_native', canonical: 'vue', slots: 16 },
      { alias: 'nextjs_native', canonical: 'nextjs', slots: 21 },      // project(3) + frontend(4) + backend(5) + universal(3) + human(6)
      { alias: 'python-flask', canonical: 'python-api', slots: 17 },   // project(3) + backend(5) + universal(3) + human(6)
      { alias: 'python-fastapi', canonical: 'python-api', slots: 17 },
      { alias: 'python-django', canonical: 'django', slots: 21 },      // project(3) + frontend(4) + backend(5) + universal(3) + human(6)
      { alias: 'python-generic', canonical: 'python-app', slots: 14 }, // project(3) + backend(5) + human(6)
      { alias: 'go', canonical: 'go-api', slots: 17 },                 // project(3) + backend(5) + universal(3) + human(6)
      { alias: 'golang', canonical: 'go-api', slots: 17 },
      { alias: 'rust', canonical: 'rust-api', slots: 17 },
      { alias: 'zig', canonical: 'crate', slots: 9 },             // project(3) + human(6)
      { alias: 'latest-idea', canonical: 'generic', slots: 12 },  // project(3) + universal(3) + human(6)
    ];

    aliasTests.forEach(({ alias, canonical, slots }) => {
      it(`${alias} → ${canonical} (${slots} slots)`, () => {
        const resolvedSlots = getSlotsForType(alias);
        const expectedSlots = getSlotsForType(canonical);

        expect(resolvedSlots.length).toBe(slots);
        expect(resolvedSlots).toEqual(expectedSlots);
      });
    });
  });

  describe('Late Context Addition (The Lucky Gift Bug)', () => {
    it('should score correctly when goal added after init', async () => {
      // This tests the nested/flat structure fix
      // The compiler should read from both project.goal and projectGoal

      // Create a mock .faf with flat structure (how sync used to write)
      const fafContent = `
faf_version: 2.5.0
project:
  name: Test Project
  main_language: TypeScript
  type: cli
projectGoal: Added later via sync
human_context:
  who: Developers
  what: Test tool
  why: Testing
  where: Terminal
  when: Now
  how: TypeScript
`;
      await fs.writeFile(path.join(testDir, 'project.faf'), fafContent);
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'test', bin: { test: './cli.js' }
      }));

      // The compiler should find projectGoal even though project.goal is missing
      const { FafCompiler } = await import('../src/compiler/faf-compiler');
      const compiler = new FafCompiler();
      const fafPath = path.join(testDir, 'project.faf');
      const result = await compiler.compile(fafPath);

      // project.goal should be filled from flat projectGoal
      expect(result.score).toBeGreaterThanOrEqual(89); // 8/9 minimum with goal
    });
  });

  describe('Slot Counts by Type', () => {
    // Slot counts based on TYPE_DEFINITIONS categories:
    // project: 3, frontend: 4, backend: 5, universal: 3, human: 6
    const slotCountTests = [
      { type: 'cli', expected: 9 },           // project(3) + human(6)
      { type: 'library', expected: 9 },       // project(3) + human(6)
      { type: 'crate', expected: 9 },         // project(3) + human(6)
      { type: 'generic', expected: 12 },      // project(3) + universal(3) + human(6)
      { type: 'react', expected: 16 },        // project(3) + frontend(4) + universal(3) + human(6)
      { type: 'vue', expected: 16 },
      { type: 'svelte', expected: 16 },
      { type: 'node-api', expected: 17 },     // project(3) + backend(5) + universal(3) + human(6)
      { type: 'python-api', expected: 17 },
      { type: 'nextjs', expected: 21 },       // project(3) + frontend(4) + backend(5) + universal(3) + human(6)
      { type: 'fullstack', expected: 21 },
      { type: 'monorepo', expected: 21 },
    ];

    slotCountTests.forEach(({ type, expected }) => {
      it(`${type} should have ${expected} slots`, () => {
        const count = getSlotCountForType(type);
        expect(count).toBe(expected);
      });
    });
  });
});
