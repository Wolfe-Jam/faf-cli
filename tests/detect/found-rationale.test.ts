/**
 * WJTTC — #found rationale (Glass Hood transparency for project-type detection)
 *
 * ENGINE: detectProjectTypeWithRationale must report the signals that fired.
 *         writeFaf must inject `# found: <list>` comment next to `type:`.
 * BRAKE:  the comment NEVER references slop / made-up signals — only real
 *         observable evidence.
 *
 * Per faf-auto-no-guess-no-slop: rationale is observable evidence only.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectProjectTypeWithRationale } from '../../src/detect/scanner.js';
import { writeFaf } from '../../src/interop/faf.js';
import type { FafData } from '../../src/core/types.js';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `faf-test-found-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('WJTTC ENGINE: detectProjectTypeWithRationale — signals reported', () => {
  test('cli (pkg.bin) reports "package.json bin"', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({
      name: 'x', version: '1.0.0', bin: { x: 'dist/cli.js' },
    }));
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('cli');
    expect(r.found).toContain('package.json bin');
  });

  test('Zig cli (build.zig + main.zig) reports both signals', () => {
    writeFileSync(join(dir, 'build.zig'), '');
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src/main.zig'), 'pub fn main() void {}');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('cli');
    expect(r.found).toContain('build.zig');
    expect(r.found).toContain('src/main.zig');
  });

  test('Zig library (build.zig + root.zig) reports both signals', () => {
    writeFileSync(join(dir, 'build.zig'), '');
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src/root.zig'), 'pub const x = 1;');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('library');
    expect(r.found).toContain('build.zig');
    expect(r.found).toContain('src/root.zig');
  });

  test('frontend-only reports "frontend framework"', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({
      name: 'x', version: '1.0.0', dependencies: { react: '^18.0.0' },
    }));
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('frontend');
    expect(r.found).toContain('frontend framework');
  });

  test('fallback library reports the fallback signal', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({
      name: 'x', version: '1.0.0',
    }));
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('library');
    // Fallback case — found should still have a rationale entry, not be empty
    expect(r.found.length).toBeGreaterThan(0);
  });
});

describe('WJTTC ENGINE: writeFaf renders # found: comment', () => {
  test('emits `# found: <list>` next to type when _meta.found is set', () => {
    const data: FafData = {
      faf_version: '2.5.0',
      project: { name: 'x', goal: 'g', main_language: 'TS', type: 'cli' },
      _meta: { found: ['package.json bin'] },
    };
    const path = join(dir, 'project.faf');
    writeFaf(path, data);
    const text = readFileSync(path, 'utf-8');
    expect(text).toContain('type: cli  # found: package.json bin');
  });

  test('joins multiple signals with " + "', () => {
    const data: FafData = {
      faf_version: '2.5.0',
      project: { name: 'x', goal: 'g', main_language: 'Zig', type: 'cli' },
      _meta: { found: ['build.zig', 'src/main.zig'] },
    };
    const path = join(dir, 'project.faf');
    writeFaf(path, data);
    const text = readFileSync(path, 'utf-8');
    expect(text).toContain('type: cli  # found: build.zig + src/main.zig');
  });

  test('strips _meta from the serialized output', () => {
    const data: FafData = {
      faf_version: '2.5.0',
      project: { name: 'x', goal: 'g', main_language: 'TS', type: 'cli' },
      _meta: { found: ['package.json bin'] },
    };
    const path = join(dir, 'project.faf');
    writeFaf(path, data);
    const text = readFileSync(path, 'utf-8');
    expect(text).not.toContain('_meta');
    expect(text).not.toContain('found:\n');
  });

  test('omits comment when _meta.found is empty', () => {
    const data: FafData = {
      faf_version: '2.5.0',
      project: { name: 'x', goal: 'g', main_language: 'TS', type: 'cli' },
      _meta: { found: [] },
    };
    const path = join(dir, 'project.faf');
    writeFaf(path, data);
    const text = readFileSync(path, 'utf-8');
    expect(text).not.toContain('# found:');
  });

  test('omits comment when _meta is absent (existing .faf round-trip)', () => {
    const data: FafData = {
      faf_version: '2.5.0',
      project: { name: 'x', goal: 'g', main_language: 'TS', type: 'cli' },
    };
    const path = join(dir, 'project.faf');
    writeFaf(path, data);
    const text = readFileSync(path, 'utf-8');
    expect(text).not.toContain('# found:');
    expect(text).toContain('type: cli');
  });
});
