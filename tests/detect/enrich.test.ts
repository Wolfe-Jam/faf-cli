/**
 * detect/enrich — export-time enrichment. Detection turns a lean/stale .faf into
 * a complete AGENTS.md source. Guards: detects commands/key-files/secrets;
 * hand-authored .faf ALWAYS wins (fill-if-absent); never mutates the input;
 * empty repo invents nothing.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { enrichFromRepo } from '../../src/detect/enrich.js';

function repo(): string {
  const d = mkdtempSync(join(tmpdir(), 'faf-enrich-'));
  writeFileSync(
    join(d, 'package.json'),
    JSON.stringify({ name: 'demo', scripts: { build: 'tsc', test: 'vitest', lint: 'eslint .' } }),
  );
  writeFileSync(join(d, 'README.md'), '# demo');
  writeFileSync(join(d, 'tsconfig.json'), '{}');
  mkdirSync(join(d, 'src'));
  writeFileSync(join(d, 'src', 'index.ts'), '');
  return d;
}

describe('enrichFromRepo — detects facts at export time', () => {
  test('detects build/test/lint commands from package.json scripts', () => {
    const out = enrichFromRepo(repo(), { project: { name: 'demo' } } as never);
    expect(out.commands?.build).toContain('build');
    expect(out.commands?.test).toContain('test');
    expect(out.commands?.lint).toContain('lint');
  });

  test('detects key files / entry points', () => {
    const out = enrichFromRepo(repo(), { project: { name: 'demo' } } as never);
    expect(out.key_files).toContain('package.json');
    expect(out.key_files).toContain('src/index.ts');
  });

  test('detects a secrets file (.env) + example — location only', () => {
    const d = repo();
    writeFileSync(join(d, '.env'), 'SECRET=x');
    writeFileSync(join(d, '.env.example'), 'SECRET=');
    const out = enrichFromRepo(d, { project: { name: 'demo' } } as never) as {
      security?: { secrets?: string; example?: string };
    };
    expect(out.security?.secrets).toBe('.env');
    expect(out.security?.example).toBe('.env.example');
  });
});

describe('enrichFromRepo — hand-authored .faf WINS (fill-if-absent)', () => {
  test('existing command key preserved; detection fills the gaps', () => {
    const out = enrichFromRepo(repo(), {
      project: { name: 'demo' },
      commands: { test: 'pytest -x' },
    } as never);
    expect(out.commands?.test).toBe('pytest -x'); // hand-authored wins
    expect(out.commands?.build).toContain('build'); // detected fills gap
  });

  test('hand-authored key_files not overwritten', () => {
    const out = enrichFromRepo(repo(), {
      project: { name: 'demo' },
      key_files: ['custom.ts'],
    } as never);
    expect(out.key_files).toEqual(['custom.ts']);
  });
});

describe('enrichFromRepo — safety', () => {
  test('does not mutate the input', () => {
    const input = { project: { name: 'demo' } } as { commands?: unknown; key_files?: unknown };
    enrichFromRepo(repo(), input as never);
    expect(input.commands).toBeUndefined();
    expect(input.key_files).toBeUndefined();
  });

  test('empty repo (no manifest) invents no commands', () => {
    const d = mkdtempSync(join(tmpdir(), 'faf-empty-'));
    const out = enrichFromRepo(d, { project: { name: 'x' } } as never);
    expect(out.commands).toBeUndefined();
  });
});
