import { describe, test, expect } from 'bun:test';
import * as kernel from '../../src/wasm/kernel.js';

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

describe('kernel.score', () => {
  test('scores minimal .faf', () => {
    const result = kernel.score(MINIMAL_FAF);
    expect(result.score).toBeGreaterThan(0);
    expect(result.populated).toBeGreaterThanOrEqual(3);
    expect(result.total).toBe(21);
  });

  test('scores full base .faf at 100%', () => {
    const result = kernel.score(FULL_BASE_FAF);
    expect(result.score).toBe(100);
    expect(result.populated).toBe(21);
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
    expect(result.ignored).toBe(12);
    expect(result.active).toBe(9);
  });

  test('returns slot states', () => {
    const result = kernel.score(MINIMAL_FAF);
    expect(result.slots['project.name']).toBe('populated');
  });
});

describe('kernel.scoreEnterprise', () => {
  test('scores with 33 slots', () => {
    const result = kernel.scoreEnterprise(MINIMAL_FAF);
    expect(result.total).toBe(33);
  });
});

describe('kernel.validate', () => {
  test('valid YAML passes', () => {
    expect(kernel.validate(MINIMAL_FAF)).toBe(true);
  });

  test('invalid YAML fails', () => {
    expect(kernel.validate('not: [valid: yaml: nested')).toBe(false);
  });
});

describe('kernel.compile + decompile', () => {
  test('roundtrip compile/decompile', () => {
    const binary = kernel.compile(MINIMAL_FAF);
    expect(binary).toBeInstanceOf(Uint8Array);
    expect(binary.length).toBeGreaterThan(32);
    expect(String.fromCharCode(binary[0], binary[1], binary[2], binary[3])).toBe('FAFB');

    const info = kernel.decompile(binary);
    expect(info).toBeDefined();
  });
});

describe('kernel.fafbInfo', () => {
  test('returns metadata from binary', () => {
    const binary = kernel.compile(MINIMAL_FAF);
    const info = kernel.fafbInfo(binary);
    expect(info).toBeDefined();
  });
});

describe('kernel.scoreFafb', () => {
  test('returns metadata from binary', () => {
    const binary = kernel.compile(FULL_BASE_FAF);
    const result = kernel.scoreFafb(binary);
    expect(result.source).toBe('fafb_meta');
    expect(result.name).toBe('test-project');
    expect(result.faf_version).toBe('2.5.0'); // returns what's in the compiled binary
  });
});

describe('kernel.sdkVersion', () => {
  test('returns version string', () => {
    expect(kernel.sdkVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
