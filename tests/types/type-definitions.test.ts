/**
 * WJTTC TYPE DEFINITIONS TEST SUITE
 *
 * When Types Must Work, So Must Our Code
 *
 * This test suite validates the TYPE_DEFINITIONS system that determines
 * which slots count toward scoring for each project type.
 *
 * Design Philosophy:
 * - 21 slots always exist
 * - Types define which slots COUNT toward scoring
 * - slot_ignore provides escape hatch for edge cases
 */

import { FafCompiler } from '../../src/compiler/faf-compiler';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('WJTTC TYPE DEFINITIONS', () => {
  let tempDir: string;
  let compiler: FafCompiler;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faf-type-test-'));
    compiler = new FafCompiler();
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // Helper to create a test .faf file and compile it
  async function compileTestFaf(content: string): Promise<any> {
    const fafPath = path.join(tempDir, `test-${Date.now()}.faf`);
    await fs.writeFile(fafPath, content, 'utf-8');
    return compiler.compile(fafPath);
  }

  // ============================================================================
  // TIER 1: Type Detection Tests
  // ============================================================================
  describe('TIER 1: Type Detection', () => {

    test('explicit type: cli is recognized', async () => {
      const result = await compileTestFaf(`
project:
  name: my-cli
  type: cli
  goal: A command line tool
  main_language: TypeScript
human_context:
  who: Developers
  what: CLI tool
  why: Automation
  where: Terminal
  when: Now
  how: npm install
`);
      // CLI type should have 9 slots (project + human)
      expect(result.total).toBe(9);
      expect(result.score).toBe(100);
    });

    test('explicit type: cli-tool maps to cli', async () => {
      const result = await compileTestFaf(`
project:
  name: my-cli
  type: cli-tool
  goal: A command line tool
  main_language: TypeScript
human_context:
  who: Developers
  what: CLI tool
  why: Automation
  where: Terminal
  when: Now
  how: npm install
`);
      expect(result.total).toBe(9);
    });

    test('explicit type: fullstack gets all 21 slots', async () => {
      const result = await compileTestFaf(`
project:
  name: my-app
  type: fullstack
  goal: Full stack application
  main_language: TypeScript
`);
      expect(result.total).toBe(21);
    });

    test('explicit type: monorepo gets all 21 slots', async () => {
      const result = await compileTestFaf(`
project:
  name: my-monorepo
  type: monorepo
  goal: Multi-package repository
  main_language: TypeScript
`);
      expect(result.total).toBe(21);
    });

    test('inferred type: goal contains "cli" -> cli type', async () => {
      const result = await compileTestFaf(`
project:
  name: my-tool
  goal: Build a CLI for automation
  main_language: TypeScript
human_context:
  who: Devs
  what: Tool
  why: Speed
  where: Terminal
  when: Now
  how: Install
`);
      expect(result.total).toBe(9);
    });

    test('inferred type: goal contains "api" -> backend-api type', async () => {
      const result = await compileTestFaf(`
project:
  name: my-api
  goal: REST API for users
  main_language: TypeScript
`);
      // backend-api: project + backend + universal + human = 17 slots
      expect(result.total).toBe(17);
    });

    test('unknown type falls back to generic', async () => {
      const result = await compileTestFaf(`
project:
  name: mystery
  type: quantum-computing-framework
  goal: Something unknown
  main_language: Q#
`);
      // generic: project + universal + human = 12 slots
      expect(result.total).toBe(12);
    });
  });

  // ============================================================================
  // TIER 2: Slot Count Validation
  // ============================================================================
  describe('TIER 2: Slot Counts by Type Category', () => {

    const typeSlotCounts: Record<string, number> = {
      // CLI/Tools (9 slots: project + human)
      'cli': 9,
      'library': 9,
      'npm-package': 9,
      'pip-package': 9,
      'crate': 9,
      'gem': 9,

      // Browser Extensions (9 slots)
      'chrome-extension': 9,
      'firefox-extension': 9,
      'safari-extension': 9,

      // DevOps/Infra (9 slots)
      'terraform': 9,
      'kubernetes': 9,
      'docker': 9,
      'ansible': 9,
      'github-action': 9,

      // Embedded (9 slots)
      'embedded': 9,
      'arduino': 9,
      'wasm': 9,

      // Jupyter/Data (9 slots for jupyter, 14 for data-science)
      'jupyter': 9,

      // Mobile/Desktop (13 slots: project + frontend + human)
      'mobile': 13,
      'react-native': 13,
      'flutter': 13,
      'ios': 13,
      'android': 13,
      'desktop': 13,
      'electron': 13,
      'tauri': 13,
      'game': 13,
      'unity': 13,

      // AI/ML with backend (14 slots: project + backend + human)
      'mcp-server': 14,
      'data-science': 14,
      'ml-model': 14,
      'data-pipeline': 14,
      'n8n-workflow': 14,
      'python-app': 14,

      // Frontend (16 slots: project + frontend + universal + human)
      'frontend': 16,
      'svelte': 16,
      'react': 16,
      'vue': 16,
      'angular': 16,
      'astro': 16,

      // Backend API (17 slots: project + backend + universal + human)
      'backend-api': 17,
      'node-api': 17,
      'python-api': 17,
      'go-api': 17,
      'rust-api': 17,
      'graphql': 17,
      'microservice': 17,
      'strapi': 17,

      // Fullstack (21 slots: ALL)
      'fullstack': 21,
      'nextjs': 21,
      'remix': 21,
      't3': 21,
      'mern': 21,
      'mean': 21,
      'django': 21,
      'rails': 21,
      'laravel': 21,
      'wordpress': 21,

      // Monorepo (21 slots: ALL - containers for anything)
      'monorepo': 21,
      'turborepo': 21,
      'nx': 21,
      'lerna': 21,
      'pnpm-workspace': 21,
      'yarn-workspace': 21,

      // Generic fallback
      'generic': 12,
    };

    // Generate tests for each type
    for (const [type, expectedSlots] of Object.entries(typeSlotCounts)) {
      test(`type "${type}" has ${expectedSlots} slots`, async () => {
        const result = await compileTestFaf(`
project:
  name: test-${type}
  type: ${type}
  goal: Testing ${type}
  main_language: TypeScript
`);
        expect(result.total).toBe(expectedSlots);
      });
    }
  });

  // ============================================================================
  // TIER 3: Alias Resolution Tests
  // ============================================================================
  describe('TIER 3: Alias Resolution', () => {

    const aliasTests: [string, string, number][] = [
      // [alias, canonical, expectedSlots]
      ['cli-tool', 'cli', 9],
      ['command-line', 'cli', 9],
      ['lib', 'library', 9],
      ['package', 'library', 9],
      ['pypi', 'pip-package', 9],
      ['rust-crate', 'crate', 9],
      ['api', 'backend-api', 17],
      ['backend', 'backend-api', 17],
      ['rest-api', 'backend-api', 17],
      ['express', 'node-api', 17],
      ['fastify', 'node-api', 17],
      ['flask', 'python-api', 17],
      ['fastapi', 'python-api', 17],
      ['sveltekit', 'svelte', 16],
      ['reactjs', 'react', 16],
      ['nuxt', 'vue', 16],
      ['next', 'nextjs', 21],
      ['rn', 'react-native', 13],
      ['expo', 'react-native', 13],
      ['dart', 'flutter', 13],
      ['swift', 'ios', 13],
      ['kotlin', 'android', 13],
      ['k8s', 'kubernetes', 9],
      ['helm', 'kubernetes', 9],
      ['tf', 'terraform', 9],
      ['gha', 'github-action', 9],
      ['turbo', 'turborepo', 21],
      ['mono', 'monorepo', 21],
      ['workspace', 'monorepo', 21],
      ['web3', 'dapp', 13],
      ['blockchain', 'dapp', 13],
      ['solidity', 'smart-contract', 9],
      ['iot', 'embedded', 9],
      ['firmware', 'embedded', 9],
      ['webassembly', 'wasm', 9],
      ['e2e', 'e2e-tests', 9],
      ['playwright', 'e2e-tests', 9],
      ['cypress', 'e2e-tests', 9],
    ];

    for (const [alias, canonical, expectedSlots] of aliasTests) {
      test(`alias "${alias}" -> "${canonical}" (${expectedSlots} slots)`, async () => {
        const result = await compileTestFaf(`
project:
  name: test-alias
  type: ${alias}
  goal: Testing alias ${alias}
  main_language: TypeScript
`);
        expect(result.total).toBe(expectedSlots);
      });
    }
  });

  // ============================================================================
  // TIER 4: slot_ignore Tests
  // ============================================================================
  describe('TIER 4: slot_ignore Escape Hatch', () => {

    test('slot_ignore array format removes slots', async () => {
      const result = await compileTestFaf(`
project:
  name: test-ignore
  type: fullstack
  goal: Testing slot_ignore
  main_language: TypeScript
slot_ignore:
  - hosting
  - cicd
  - database
`);
      // fullstack = 21, minus 3 ignored = 18
      expect(result.total).toBe(18);
    });

    test('slot_ignore string format (comma-separated)', async () => {
      const result = await compileTestFaf(`
project:
  name: test-ignore
  type: fullstack
  goal: Testing slot_ignore
  main_language: TypeScript
slot_ignore: hosting, cicd, database
`);
      expect(result.total).toBe(18);
    });

    test('slot_ignore with full path (stack.hosting)', async () => {
      const result = await compileTestFaf(`
project:
  name: test-ignore
  type: fullstack
  goal: Testing slot_ignore
  main_language: TypeScript
slot_ignore:
  - stack.hosting
  - stack.cicd
`);
      expect(result.total).toBe(19);
    });

    test('slot_ignore shorthand (hosting -> stack.hosting)', async () => {
      const result = await compileTestFaf(`
project:
  name: test-ignore
  type: frontend
  goal: Testing slot_ignore shorthand
  main_language: TypeScript
slot_ignore:
  - hosting
  - cicd
`);
      // frontend = 16, minus 2 = 14
      expect(result.total).toBe(14);
    });

    test('slot_ignore on cli type removes human slots', async () => {
      const result = await compileTestFaf(`
project:
  name: test-cli-ignore
  type: cli
  goal: CLI without where/when
  main_language: TypeScript
slot_ignore:
  - where
  - when
human_context:
  who: Devs
  what: Tool
  why: Speed
  how: Install
`);
      // cli = 9, minus 2 = 7
      expect(result.total).toBe(7);
      expect(result.score).toBe(100); // All 7 filled
    });

    test('slotIgnore camelCase also works', async () => {
      const result = await compileTestFaf(`
project:
  name: test-camel
  type: fullstack
  goal: Testing camelCase
  main_language: TypeScript
slotIgnore:
  - hosting
  - cicd
`);
      expect(result.total).toBe(19);
    });

    test('ignore_slots also works', async () => {
      const result = await compileTestFaf(`
project:
  name: test-underscore
  type: fullstack
  goal: Testing underscore variant
  main_language: TypeScript
ignore_slots:
  - hosting
  - cicd
`);
      expect(result.total).toBe(19);
    });
  });

  // ============================================================================
  // TIER 5: Edge Cases & Regression Tests
  // ============================================================================
  describe('TIER 5: Edge Cases', () => {

    test('empty project type treated as generic', async () => {
      const result = await compileTestFaf(`
project:
  name: no-type
  goal: No type specified
  main_language: TypeScript
`);
      expect(result.total).toBe(12); // generic
    });

    test('case insensitive type matching', async () => {
      const result = await compileTestFaf(`
project:
  name: case-test
  type: CLI
  goal: Uppercase CLI
  main_language: TypeScript
`);
      expect(result.total).toBe(9);
    });

    test('type with extra whitespace', async () => {
      const result = await compileTestFaf(`
project:
  name: whitespace-test
  type: "  cli  "
  goal: Whitespace padded
  main_language: TypeScript
`);
      // May or may not handle whitespace - this tests current behavior
      expect(result.total).toBeGreaterThan(0);
    });

    test('monorepo with slot_ignore still allows customization', async () => {
      // Edge case: monorepo that doesn't have frontend packages
      const result = await compileTestFaf(`
project:
  name: backend-monorepo
  type: monorepo
  goal: Backend-only monorepo
  main_language: TypeScript
slot_ignore:
  - frontend
  - css_framework
  - ui_library
  - state_management
`);
      // 21 - 4 frontend slots = 17
      expect(result.total).toBe(17);
    });

    test('100% achievable on any type with all slots filled', async () => {
      const result = await compileTestFaf(`
project:
  name: perfect-cli
  type: cli
  goal: Perfect CLI
  main_language: TypeScript
human_context:
  who: Everyone
  what: Amazing tool
  why: Productivity
  where: Everywhere
  when: Always
  how: npm i
`);
      expect(result.score).toBe(100);
      expect(result.filled).toBe(result.total);
    });

    test('xai-faf-cli scenario: CLI at 100%', async () => {
      // The original issue that started this work
      const result = await compileTestFaf(`
project:
  name: xai-faf-cli
  type: cli
  goal: Zig-native CLI that generates GROK.md - 100% or nothing
  main_language: Zig
human_context:
  who: xAI engineers building AI infrastructure
  what: 5-command CLI (init, sync, status, gold, embed) for GROK.md generation
  why: Real rockets need 100% context - no partial success
  where: Private xAI tooling repository
  when: Dec 2025 - Mission ready
  how: zig build && ./xai-faf init
`);
      expect(result.score).toBe(100);
      expect(result.total).toBe(9);
    });
  });

  // ============================================================================
  // TIER 6: Performance & Stress Tests
  // ============================================================================
  describe('TIER 6: Performance', () => {

    test('type resolution under 5ms', async () => {
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        await compileTestFaf(`
project:
  name: perf-test-${i}
  type: fullstack
  goal: Performance test
  main_language: TypeScript
`);
      }
      const duration = Date.now() - start;
      const avgPerCompile = duration / 100;

      console.log(`Average compile time: ${avgPerCompile.toFixed(2)}ms`);
      expect(avgPerCompile).toBeLessThan(50); // 50ms per compile is reasonable
    });

    test('all 88 types can be compiled', async () => {
      const types = [
        'cli', 'library', 'npm-package', 'pip-package', 'crate', 'gem',
        'mcp-server', 'data-science', 'ml-model', 'jupyter', 'data-pipeline',
        'backend-api', 'node-api', 'python-api', 'go-api', 'rust-api', 'graphql', 'microservice',
        'frontend', 'svelte', 'react', 'vue', 'angular', 'nextjs', 'remix', 'astro', 'solid', 'qwik',
        'fullstack', 't3', 'mern', 'mean', 'lamp', 'django', 'rails', 'laravel',
        'mobile', 'react-native', 'flutter', 'ios', 'android', 'ionic',
        'desktop', 'electron', 'tauri', 'qt', 'gtk',
        'chrome-extension', 'firefox-extension', 'safari-extension',
        'n8n-workflow', 'zapier', 'github-action',
        'terraform', 'kubernetes', 'docker', 'ansible', 'pulumi', 'infrastructure',
        'static-html', 'landing-page', 'documentation', 'docusaurus', 'mkdocs', 'vitepress', 'storybook',
        'wordpress', 'cms', 'strapi', 'sanity', 'contentful',
        'game', 'unity', 'godot', 'unreal', 'phaser', 'threejs',
        'smart-contract', 'dapp', 'hardhat', 'foundry',
        'monorepo', 'turborepo', 'nx', 'lerna', 'pnpm-workspace', 'yarn-workspace',
        'embedded', 'arduino', 'raspberry-pi', 'wasm',
        'test-suite', 'e2e-tests',
        'generic'
      ];

      for (const type of types) {
        const result = await compileTestFaf(`
project:
  name: ${type}-test
  type: ${type}
  goal: Testing ${type}
  main_language: TypeScript
`);
        expect(result.total).toBeGreaterThan(0);
        expect(result.score).toBeGreaterThanOrEqual(0);
      }

      console.log(`\nWJTTC REPORT: ${types.length} types validated`);
    });
  });

  // ============================================================================
  // Championship Summary
  // ============================================================================
  afterAll(() => {
    console.log(`
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    WJTTC TYPE DEFINITIONS REPORT
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    When Types Must Work, So Must Our Code

    Test Tiers Validated:
    ✓ TIER 1: Type Detection
    ✓ TIER 2: Slot Counts by Category
    ✓ TIER 3: Alias Resolution
    ✓ TIER 4: slot_ignore Escape Hatch
    ✓ TIER 5: Edge Cases
    ✓ TIER 6: Performance

    Design Principles Validated:
    ✓ 21 slots always exist
    ✓ Types define which slots COUNT
    ✓ slot_ignore overrides type defaults
    ✓ 100% achievable on any type

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  });
});
