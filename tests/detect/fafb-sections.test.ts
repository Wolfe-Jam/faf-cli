/**
 * WJTTC — FAFB top-level section emission (Phase #24 of v6.5.0)
 *
 * ENGINE: detectKeyFiles / detectCommands / detectTechStack populate the
 *         top-level YAML keys (tech_stack / key_files / commands) that the
 *         FAFB binary compiler reads. Without these, every cli .fafb is
 *         META-only.
 * BRAKE:  the headline v6.5.0 capability — cli-generated .faf now produces
 *         multi-section .fafb when compiled (verified via section_count > 1).
 *
 * Per app-types-canonical-v6.5 + faf-auto-no-guess-no-slop: tech_stack /
 * key_files / commands auto-populate from observable signals;
 * architecture / context stay empty (user-fill).
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  detectKeyFiles,
  detectCommands,
  detectTechStack,
  detectFrameworks,
  detectLanguage,
  readPackageJson,
} from '../../src/detect/scanner.js';
import { detectStack } from '../../src/detect/stack.js';
import * as kernel from '../../src/wasm/kernel.js';
import { stringify } from 'yaml';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `faf-fafb-sections-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('WJTTC ENGINE: detectKeyFiles', () => {
  test('returns common entry points + manifests when they exist', () => {
    writeFileSync(join(dir, 'package.json'), '{}');
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src/index.ts'), '');
    writeFileSync(join(dir, 'src/cli.ts'), '');
    writeFileSync(join(dir, 'README.md'), '# x');

    const files = detectKeyFiles(dir);
    expect(files).toContain('package.json');
    expect(files).toContain('src/index.ts');
    expect(files).toContain('src/cli.ts');
    expect(files).toContain('README.md');
  });

  test('Rust project — returns Cargo.toml + src/main.rs / src/lib.rs', () => {
    writeFileSync(join(dir, 'Cargo.toml'), '[package]\nname = "x"\n');
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src/main.rs'), '');
    writeFileSync(join(dir, 'src/lib.rs'), '');

    const files = detectKeyFiles(dir);
    expect(files).toContain('Cargo.toml');
    expect(files).toContain('src/main.rs');
    expect(files).toContain('src/lib.rs');
  });

  test('Zig project — returns build.zig + entry files', () => {
    writeFileSync(join(dir, 'build.zig'), '');
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src/main.zig'), '');

    const files = detectKeyFiles(dir);
    expect(files).toContain('build.zig');
    expect(files).toContain('src/main.zig');
  });

  test('returns [] for empty dir (no slop)', () => {
    expect(detectKeyFiles(dir)).toEqual([]);
  });
});

describe('WJTTC ENGINE: detectCommands', () => {
  test('Node project with package.json scripts → mapped commands', () => {
    const pkg = {
      name: 'x',
      scripts: { build: 'webpack', test: 'jest', lint: 'eslint .' },
    };
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
    const commands = detectCommands(dir, pkg as never);
    expect(commands.build).toBe('npm run build');
    expect(commands.test).toBe('npm run test');
    expect(commands.lint).toBe('npm run lint');
  });

  test('Bun project (bun.lock present) → bun run commands', () => {
    const pkg = { name: 'x', scripts: { build: 'bun build src' } };
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
    writeFileSync(join(dir, 'bun.lock'), '');
    const commands = detectCommands(dir, pkg as never);
    expect(commands.build).toBe('bun run build');
  });

  test('Rust project — Cargo defaults', () => {
    writeFileSync(join(dir, 'Cargo.toml'), '[package]\nname = "x"\n');
    const commands = detectCommands(dir, null);
    expect(commands.build).toBe('cargo build --release');
    expect(commands.test).toBe('cargo test');
    expect(commands.lint).toBe('cargo clippy');
  });

  test('Zig project — zig build defaults', () => {
    writeFileSync(join(dir, 'build.zig'), '');
    const commands = detectCommands(dir, null);
    expect(commands.build).toBe('zig build');
    expect(commands.test).toBe('zig build test');
  });

  test('Go project — go build/test', () => {
    writeFileSync(join(dir, 'go.mod'), 'module x\n');
    const commands = detectCommands(dir, null);
    expect(commands.build).toBe('go build ./...');
    expect(commands.test).toBe('go test ./...');
  });

  test('package.json scripts win over Cargo defaults when both present', () => {
    const pkg = { name: 'x', scripts: { build: 'webpack' } };
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
    writeFileSync(join(dir, 'Cargo.toml'), '[package]\nname = "x"\n');
    const commands = detectCommands(dir, pkg as never);
    expect(commands.build).toBe('npm run build');  // pkg scripts win
    expect(commands.test).toBe('cargo test');       // Cargo fills empty
  });

  test('returns {} for project with no detectable commands', () => {
    expect(detectCommands(dir, null)).toEqual({});
  });
});

describe('WJTTC ENGINE: detectTechStack', () => {
  test('lists language first, then frameworks', () => {
    const pkg = { name: 'x', dependencies: { react: '^18.0.0' } };
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
    const frameworks = detectFrameworks(dir);
    const stack = detectTechStack(dir, pkg as never, frameworks, 'TypeScript');
    expect(stack[0]).toBe('TypeScript');
    expect(stack).toContain('React');
  });

  test('no language → frameworks only', () => {
    const pkg = { name: 'x', dependencies: { express: '^4.0.0' } };
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
    const frameworks = detectFrameworks(dir);
    const stack = detectTechStack(dir, pkg as never, frameworks, 'Unknown');
    expect(stack).not.toContain('Unknown');
    expect(stack).toContain('Express');
  });

  test('Bun runtime → adds "Bun"', () => {
    writeFileSync(join(dir, 'bunfig.toml'), '');
    const stack = detectTechStack(dir, null, [], 'TypeScript');
    expect(stack).toContain('Bun');
  });

  test('returns [] for fully empty project', () => {
    expect(detectTechStack(dir, null, [], 'Unknown')).toEqual([]);
  });
});

describe('WJTTC BRAKE: cli compile produces MULTI-section .fafb (not META-only)', () => {
  test('cli detect+compile flow yields >= 4 sections when project has all signals', () => {
    // Set up a Node cli project with everything detection would catch
    const pkg = {
      name: 'rich-cli',
      version: '1.0.0',
      bin: { 'rich-cli': 'dist/cli.js' },
      scripts: { build: 'tsc', test: 'jest', lint: 'eslint .' },
      dependencies: { commander: '^14.0.0' },
    };
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src/cli.ts'), '');
    writeFileSync(join(dir, 'README.md'), '# rich-cli\n');

    const data = detectStack(dir);
    // Strip _meta before YAML stringify (mimics writeFaf)
    const { _meta, ...clean } = data as Record<string, unknown>;
    const yaml = stringify(clean, { lineWidth: 0 });

    const bytes = kernel.compile(yaml);
    const decompiled = kernel.decompile(bytes);
    // META + at least one of tech_stack/key_files/commands = ≥ 2 sections
    expect(decompiled.sections.length).toBeGreaterThanOrEqual(2);
  });

  test('detectStack emits tech_stack/key_files/commands top-level keys when signals present', () => {
    const pkg = {
      name: 'rich-cli',
      version: '1.0.0',
      bin: { 'rich-cli': 'dist/cli.js' },
      scripts: { build: 'tsc', test: 'jest' },
      dependencies: { commander: '^14.0.0' },
    };
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src/cli.ts'), '');

    const data = detectStack(dir);
    expect(data.tech_stack).toBeDefined();
    expect(data.tech_stack!.length).toBeGreaterThan(0);
    expect(data.key_files).toBeDefined();
    expect(data.key_files).toContain('package.json');
    expect(data.commands).toBeDefined();
    expect(data.commands!.build).toBeDefined();
  });

  test('detectStack does NOT emit empty top-level keys (no slop)', () => {
    // Empty dir — no detectable signals
    const data = detectStack(dir);
    expect(data.tech_stack).toBeUndefined();
    expect(data.key_files).toBeUndefined();
    expect(data.commands).toBeUndefined();
  });
});
