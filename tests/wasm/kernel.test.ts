import { describe, test, expect } from 'bun:test';
import * as kernel from '../../src/wasm/kernel.js';
import { isPlaceholder } from '../../src/core/slots.js';

const MINIMAL_FAF = `
faf_version: 2.5.0
project:
  name: test-project
  goal: Test the kernel
  main_language: TypeScript
`;

const FULL_BASE_FAF = `
faf_version: 2.5.0
project:
  name: test-project
  goal: Full test
  main_language: TypeScript
stack:
  frontend: React
  css_framework: Tailwind
  ui_library: shadcn
  state_management: Zustand
  backend: Express
  api_type: REST
  runtime: Node.js
  database: PostgreSQL
  connection: Prisma
  hosting: Vercel
  build: Vite
  cicd: GitHub Actions
  monorepo_tool: slotignored
  package_manager: slotignored
  workspaces: slotignored
  admin: slotignored
  cache: slotignored
  search: slotignored
  storage: slotignored
monorepo:
  packages_count: slotignored
  build_orchestrator: slotignored
  versioning_strategy: slotignored
  shared_configs: slotignored
  remote_cache: slotignored
human_context:
  who: wolfejam
  what: Test project
  why: Testing the engine
  where: npm registry
  when: 2026
  how: Test-driven
`;

const EMPTY_FAF = `
faf_version: 2.5.0
project:
  name: empty-project
`;

describe('ENGINE: kernel.score', () => {
  test('scores minimal .faf', () => {
    const result = kernel.score(MINIMAL_FAF);
    expect(result.score).toBeGreaterThan(0);
    expect(result.populated).toBeGreaterThanOrEqual(3);
    expect(result.total).toBe(33); // always-33
  });

  test('scores full base .faf at 100%', () => {
    const result = kernel.score(FULL_BASE_FAF);
    expect(result.score).toBe(100);
    expect(result.populated).toBe(21);
  });

  // Always-33: the 12 enterprise slots count unless marked slotignored. A file
  // with the 21 base slots filled and no markers is 21/33 — the same number in
  // every FAF app (faf-kernel, the Rust SDK, the MCP servers).
  test('always-33: 21 filled, no enterprise markers = 21/33', () => {
    const unmarked = FULL_BASE_FAF.replace(/\n {2}monorepo_tool:[\s\S]*?(?=human_context:)/, '\n');
    const result = kernel.score(unmarked);
    expect(result.total).toBe(33);
    expect(result.populated).toBe(21);
    expect(result.active).toBe(33);
    expect(result.score).toBe(64);
  });

  test('always-33: score and scoreEnterprise are the same engine', () => {
    for (const yaml of [MINIMAL_FAF, FULL_BASE_FAF, EMPTY_FAF]) {
      expect(kernel.scoreEnterprise(yaml)).toEqual(kernel.score(yaml));
    }
  });

  test('tbd and todo are placeholders (count as empty)', () => {
    const tbd = kernel.score(FULL_BASE_FAF.replace('goal: Full test', 'goal: TBD'));
    const todo = kernel.score(FULL_BASE_FAF.replace('goal: Full test', 'goal: todo'));
    expect(tbd.populated).toBe(20);
    expect(todo.populated).toBe(20);
    // faf-cli's own placeholder list agrees with the kernel
    for (const w of ['tbd', 'TBD', 'todo', 'TODO']) {expect(isPlaceholder(w)).toBe(true);}
  });

  test('scores empty .faf low', () => {
    const result = kernel.score(EMPTY_FAF);
    expect(result.score).toBeLessThan(20);
  });

  test('handles slotignored values', () => {
    const yaml = `
faf_version: 2.5.0
project:
  name: cli-tool
  goal: A CLI
  main_language: TypeScript
stack:
  frontend: slotignored
  css_framework: slotignored
  ui_library: slotignored
  state_management: slotignored
  backend: slotignored
  api_type: slotignored
  runtime: slotignored
  database: slotignored
  connection: slotignored
  hosting: slotignored
  build: slotignored
  cicd: slotignored
  monorepo_tool: slotignored
  package_manager: slotignored
  workspaces: slotignored
  admin: slotignored
  cache: slotignored
  search: slotignored
  storage: slotignored
monorepo:
  packages_count: slotignored
  build_orchestrator: slotignored
  versioning_strategy: slotignored
  shared_configs: slotignored
  remote_cache: slotignored
human_context:
  who: wolfejam
  what: CLI tool
  why: Automation
  where: npm
  when: 2026
  how: TDD
`;
    const result = kernel.score(yaml);
    expect(result.score).toBe(100);
    expect(result.ignored).toBe(24); // 12 base + 12 enterprise
    expect(result.active).toBe(9);
  });

  test('returns slot states', () => {
    const result = kernel.score(MINIMAL_FAF);
    expect(result.slots['project.name']).toBe('populated');
  });
});

describe('ENGINE: kernel.scoreEnterprise', () => {
  test('scores with 33 slots', () => {
    const result = kernel.scoreEnterprise(MINIMAL_FAF);
    expect(result.total).toBe(33);
  });
});

describe('BRAKE: kernel.validate', () => {
  test('valid YAML passes', () => {
    expect(kernel.validate(MINIMAL_FAF)).toBe(true);
  });

  test('invalid YAML fails', () => {
    expect(kernel.validate('not: [valid: yaml: nested')).toBe(false);
  });
});

describe('ENGINE: kernel.compile + decompile', () => {
  test('roundtrip compile/decompile', () => {
    const binary = kernel.compile(MINIMAL_FAF);
    expect(binary).toBeInstanceOf(Uint8Array);
    expect(binary.length).toBeGreaterThan(32);
    expect(String.fromCharCode(binary[0], binary[1], binary[2], binary[3])).toBe('FAFB');

    const info = kernel.decompile(binary);
    expect(info).toBeDefined();
  });
});

describe('ENGINE: kernel.fafbInfo', () => {
  test('returns metadata from binary', () => {
    const binary = kernel.compile(MINIMAL_FAF);
    const info = kernel.fafbInfo(binary);
    expect(info).toBeDefined();
  });
});

describe('ENGINE: kernel.scoreFafb', () => {
  test('returns metadata from binary', () => {
    const binary = kernel.compile(FULL_BASE_FAF);
    const result = kernel.scoreFafb(binary);
    expect(result.score).toBeGreaterThan(0);
    expect(result.slots['project.name']).toBe('populated');
  });
});

describe('ENGINE: kernel.sdkVersion', () => {
  test('returns version string', () => {
    expect(kernel.sdkVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
