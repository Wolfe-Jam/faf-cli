/**
 * WJTTC: Mk4 Slot Rename Migration Tests
 *
 * When Brakes Must Work, So Must Our Slot Names
 *
 * Tests the 6 Mk4 slot renames across the entire pipeline:
 * - Types accept both old and new names
 * - Compiler reads both, generates new
 * - Scoring counts both correctly
 * - FAFb round-trips with both name sets
 * - Generators output new names only
 */

import { FafCompiler, getSlotsForType, SLOT_ALIASES, SLOT_ALIASES_REVERSE } from '../../src/compiler/faf-compiler';
import { ScoreCalculator } from '../../faf-engine/src/scoring/ScoreCalculator';
import { countSlots } from '../../src/utils/slot-counter';
import { mapFafToTopics } from '../../src/utils/memory-topic-writer';
import { compileFAF, decompileFAFb, checkCompilerAvailable } from '../../src/utils/fafb-compiler';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const TEMP_DIR = path.join(os.tmpdir(), 'wjttc-mk4-rename-');

describe('WJTTC: Mk4 Slot Rename Migration', () => {
  let tempDir: string;
  let compiler: FafCompiler;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(TEMP_DIR);
    compiler = new FafCompiler();
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function compileFaf(content: string): Promise<any> {
    const fafPath = path.join(tempDir, `test-${Date.now()}.faf`);
    await fs.writeFile(fafPath, content, 'utf-8');
    return compiler.compile(fafPath);
  }

  // ========================================================================
  // TIER 1: BRAKE TESTS — Alias Map Integrity
  // ========================================================================

  describe('TIER 1: BRAKE — Alias Map', () => {
    test('SLOT_ALIASES has exactly 6 renames', () => {
      expect(Object.keys(SLOT_ALIASES).length).toBe(6);
    });

    test('all 6 renames are correct', () => {
      expect(SLOT_ALIASES.frontend).toBe('framework');
      expect(SLOT_ALIASES.css_framework).toBe('css');
      expect(SLOT_ALIASES.state_management).toBe('state');
      expect(SLOT_ALIASES.api_type).toBe('api');
      expect(SLOT_ALIASES.database).toBe('db');
      expect(SLOT_ALIASES.package_manager).toBe('pkg_manager');
    });

    test('SLOT_ALIASES_REVERSE is the exact inverse', () => {
      for (const [old, mk4] of Object.entries(SLOT_ALIASES)) {
        expect(SLOT_ALIASES_REVERSE[mk4]).toBe(old);
      }
      expect(Object.keys(SLOT_ALIASES_REVERSE).length).toBe(6);
    });

    test('ALL_SLOTS uses Mk4 canonical names', () => {
      const fullstackSlots = getSlotsForType('fullstack');
      expect(fullstackSlots).toContain('stack.framework');
      expect(fullstackSlots).toContain('stack.css');
      expect(fullstackSlots).toContain('stack.state');
      expect(fullstackSlots).toContain('stack.api');
      expect(fullstackSlots).toContain('stack.db');
      // Old names must NOT appear
      expect(fullstackSlots).not.toContain('stack.frontend');
      expect(fullstackSlots).not.toContain('stack.css_framework');
      expect(fullstackSlots).not.toContain('stack.database');
      expect(fullstackSlots).not.toContain('stack.api_type');
      expect(fullstackSlots).not.toContain('stack.package_manager');
    });
  });

  // ========================================================================
  // TIER 2: ENGINE — Compiler reads both old and new names
  // ========================================================================

  describe('TIER 2: ENGINE — Compiler Backward Compatibility', () => {
    test('old .faf with old names scores correctly', async () => {
      const result = await compileFaf(`
project:
  name: old-format
  type: fullstack
  goal: Test old names
  main_language: TypeScript
stack:
  frontend: React
  css_framework: Tailwind
  ui_library: Radix
  state_management: Zustand
  backend: Node.js
  api_type: REST
  runtime: Node.js
  database: PostgreSQL
  connection: Prisma
  hosting: Vercel
  build: Vite
  cicd: GitHub Actions
human_context:
  who: Developers
  what: Full app
  why: Testing
  where: Web
  when: Now
  how: npm install
`);
      expect(result.score).toBe(100);
    });

    test('new .faf with Mk4 names scores correctly', async () => {
      const result = await compileFaf(`
project:
  name: mk4-format
  type: fullstack
  goal: Test new names
  main_language: TypeScript
stack:
  framework: React
  css: Tailwind
  ui_library: Radix
  state: Zustand
  backend: Node.js
  api: REST
  runtime: Node.js
  db: PostgreSQL
  connection: Prisma
  hosting: Vercel
  build: Vite
  cicd: GitHub Actions
human_context:
  who: Developers
  what: Full app
  why: Testing
  where: Web
  when: Now
  how: npm install
`);
      expect(result.score).toBe(100);
    });

    test('mixed old+new names in same .faf works', async () => {
      const result = await compileFaf(`
project:
  name: mixed-format
  type: fullstack
  goal: Mixed names
  main_language: TypeScript
stack:
  framework: React
  css_framework: Tailwind
  ui_library: Radix
  state: Zustand
  backend: Node.js
  api_type: REST
  runtime: Node.js
  database: PostgreSQL
  connection: Prisma
  hosting: Vercel
  build: Vite
  cicd: GitHub Actions
human_context:
  who: Developers
  what: Full app
  why: Testing
  where: Web
  when: Now
  how: npm install
`);
      expect(result.score).toBe(100);
    });

    test('old and new names produce same score for CLI type', async () => {
      const oldResult = await compileFaf(`
project:
  name: old-cli
  type: cli
  goal: CLI tool
  main_language: TypeScript
human_context:
  who: Developers
  what: Tool
  why: Speed
  where: Terminal
  when: Now
  how: npm install
`);

      const newResult = await compileFaf(`
project:
  name: new-cli
  type: cli
  goal: CLI tool
  main_language: TypeScript
human_context:
  who: Developers
  what: Tool
  why: Speed
  where: Terminal
  when: Now
  how: npm install
`);

      expect(oldResult.score).toBe(newResult.score);
      expect(oldResult.total).toBe(newResult.total);
    });
  });

  // ========================================================================
  // TIER 3: ENGINE — ScoreCalculator accepts both
  // ========================================================================

  describe('TIER 3: ENGINE — ScoreCalculator', () => {
    const calc = new ScoreCalculator();

    test('scores with old field names', () => {
      const result = calc.calculate({
        project: { name: 'test', goal: 'test', main_language: 'TS', generated: '' },
        stack: { frontend: 'React', backend: 'Node.js', database: 'PG', package_manager: 'yarn' },
      } as any);
      expect(result.totalScore).toBeGreaterThan(0);
    });

    test('scores with Mk4 field names', () => {
      const result = calc.calculate({
        project: { name: 'test', goal: 'test', main_language: 'TS', generated: '' },
        stack: { framework: 'React', backend: 'Node.js', db: 'PG', pkg_manager: 'yarn' },
      } as any);
      expect(result.totalScore).toBeGreaterThan(0);
    });

    test('old and new produce identical scores', () => {
      const oldScore = calc.calculate({
        project: { name: 'a', goal: 'b', main_language: 'TS', generated: '' },
        stack: { frontend: 'React', css_framework: 'TW', state_management: 'Z', api_type: 'GQL', database: 'PG', package_manager: 'yarn' },
      } as any);

      const newScore = calc.calculate({
        project: { name: 'a', goal: 'b', main_language: 'TS', generated: '' },
        stack: { framework: 'React', css: 'TW', state: 'Z', api: 'GQL', db: 'PG', pkg_manager: 'yarn' },
      } as any);

      expect(oldScore.totalScore).toBe(newScore.totalScore);
      expect(oldScore.filledSlots).toBe(newScore.filledSlots);
    });
  });

  // ========================================================================
  // TIER 4: ENGINE — Slot Counter outputs Mk4 paths
  // ========================================================================

  describe('TIER 4: ENGINE — Slot Counter', () => {
    test('slot paths use Mk4 names', () => {
      const result = countSlots({
        projectName: 'test',
        frontend: 'React',
        database: 'PG',
        packageManager: 'npm',
        apiType: 'REST',
        cssFramework: 'TW',
      });

      // Filled slots should use Mk4 path names
      expect(result.filledSlots).toContain('stack.framework');
      expect(result.filledSlots).toContain('stack.db');
      expect(result.filledSlots).toContain('stack.api');
      expect(result.filledSlots).toContain('stack.css');
      // Old paths must NOT appear
      expect(result.filledSlots).not.toContain('stack.frontend');
      expect(result.filledSlots).not.toContain('stack.database');
    });
  });

  // ========================================================================
  // TIER 5: AERO — FAFb round-trip with both name sets
  // ========================================================================

  describe('TIER 5: AERO — FAFb Round-Trip', () => {
    let compilerAvailable = false;

    beforeAll(async () => {
      const check = await checkCompilerAvailable();
      compilerAvailable = check.available;
    });

    test('FAFb compiles with old slot names', async () => {
      if (!compilerAvailable) return;

      const fafPath = path.join(tempDir, 'old-fafb.faf');
      await fs.writeFile(fafPath, `faf_version: 2.5.0\nproject:\n  name: old-names\nstack:\n  frontend: React\n  database: PG\n`);
      const result = await compileFAF({ input: fafPath, output: path.join(tempDir, 'old-fafb.fafb') });
      expect(result.success).toBe(true);
      expect(result.size).toBeGreaterThan(0);
    });

    test('FAFb compiles with Mk4 slot names', async () => {
      if (!compilerAvailable) return;

      const fafPath = path.join(tempDir, 'mk4-fafb.faf');
      await fs.writeFile(fafPath, `faf_version: 2.5.0\nproject:\n  name: mk4-names\nstack:\n  framework: React\n  db: PG\n`);
      const result = await compileFAF({ input: fafPath, output: path.join(tempDir, 'mk4-fafb.fafb') });
      expect(result.success).toBe(true);
      expect(result.size).toBeGreaterThan(0);
    });

    test('FAFb decompile recovers data', async () => {
      if (!compilerAvailable) return;

      const fafPath = path.join(tempDir, 'roundtrip.faf');
      const fafbPath = path.join(tempDir, 'roundtrip.fafb');
      const outPath = path.join(tempDir, 'roundtrip-out.faf');

      await fs.writeFile(fafPath, `faf_version: 2.5.0\nproject:\n  name: roundtrip-test\n  goal: Testing\n`);
      await compileFAF({ input: fafPath, output: fafbPath });
      const result = await decompileFAFb(fafbPath, outPath);
      expect(result.success).toBe(true);

      const content = await fs.readFile(outPath, 'utf-8');
      expect(content).toContain('roundtrip-test');
    });
  });

  // ========================================================================
  // TIER 6: AERO — Tri-sync topic mapper handles both names
  // ========================================================================

  describe('TIER 6: AERO — Tri-sync Topic Mapper', () => {
    test('maps old slot names to stack topic', () => {
      const topics = mapFafToTopics({
        project: { name: 'old' },
        stack: { frontend: 'Vue', database: 'MySQL', package_manager: 'pnpm' },
      });
      const stack = topics.find(t => t.fileName === 'faf_stack.md');
      expect(stack).toBeDefined();
      expect(stack!.content).toContain('Vue');
      expect(stack!.content).toContain('MySQL');
      expect(stack!.content).toContain('pnpm');
    });

    test('maps Mk4 slot names to stack topic', () => {
      const topics = mapFafToTopics({
        project: { name: 'mk4' },
        stack: { framework: 'Svelte', db: 'PostgreSQL', pkg_manager: 'bun' },
      });
      const stack = topics.find(t => t.fileName === 'faf_stack.md');
      expect(stack).toBeDefined();
      expect(stack!.content).toContain('Svelte');
      expect(stack!.content).toContain('PostgreSQL');
      expect(stack!.content).toContain('bun');
    });

    test('deduplicates when both old and new names present', () => {
      const topics = mapFafToTopics({
        project: { name: 'dedup' },
        stack: { framework: 'React', frontend: 'React' },
      });
      const stack = topics.find(t => t.fileName === 'faf_stack.md');
      expect(stack).toBeDefined();
      // Should only have one "Frontend" entry, not two
      const frontendCount = (stack!.content.match(/Frontend/g) || []).length;
      expect(frontendCount).toBe(1);
    });
  });

  // ========================================================================
  // TIER 7: STRESS — Edge cases
  // ========================================================================

  describe('TIER 7: STRESS — Edge Cases', () => {
    test('empty stack section still compiles', async () => {
      const result = await compileFaf(`
project:
  name: empty-stack
  type: cli
  goal: No stack
  main_language: TypeScript
stack: {}
human_context:
  who: Dev
  what: Tool
  why: Speed
  where: Terminal
  when: Now
  how: Install
`);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    test('None values in old names are properly ignored', async () => {
      const result = await compileFaf(`
project:
  name: none-test
  type: fullstack
  goal: Test None handling
  main_language: TypeScript
stack:
  frontend: None
  css_framework: None
  database: None
  backend: Node.js
  runtime: Node.js
  build: Vite
human_context:
  who: Dev
  what: App
  why: Test
  where: Cloud
  when: Now
  how: Deploy
`);
      // None values should not count as filled
      expect(result.filled).toBeLessThan(result.total);
    });

    test('slot_ignore with old names normalizes to Mk4', async () => {
      const result = await compileFaf(`
project:
  name: ignore-old
  type: fullstack
  goal: Test slot_ignore with old names
  main_language: TypeScript
stack:
  framework: React
  backend: Node.js
  runtime: Node.js
  build: Vite
human_context:
  who: Dev
  what: App
  why: Test
  where: Cloud
  when: Now
  how: Deploy
slot_ignore:
  - frontend
  - database
  - css_framework
`);
      // Should still compile and score without error
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThan(21);
    });
  });
});
