/**
 * BRAKE: `faf sync` is one way — .faf → CLAUDE.md. 8.2.2 removed the last
 * back-flow: `--direction pull` (Trophy-gated MD → .faf) and the hidden
 * `bi-sync` alias. Both are refused by the CLI, and neither touches a file.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';

const CLI = join(import.meta.dir, '..', '..', 'src', 'cli.ts');
const FAF = 'faf_version: 2.5.0\nproject:\n  name: canonical\n  goal: canonical goal\n  main_language: TypeScript\n';
const MD = '# CLAUDE.md — drifted\n\n## What This Is\n\nprose that must never reach project.faf\n';

function project(): string {
  const d = mkdtempSync(join(tmpdir(), 'faf-sync-one-way-'));
  writeFileSync(join(d, 'project.faf'), FAF);
  writeFileSync(join(d, 'CLAUDE.md'), MD);
  return d;
}

function run(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

describe('BRAKE: sync is one way — no pull, no bi-sync', () => {
  test('`faf sync --direction pull` is refused and writes nothing', () => {
    const d = project();
    try {
      const r = run(d, ['sync', '--direction', 'pull']);
      expect(r.status).not.toBe(0);
      expect(r.stderr).toContain("unknown option '--direction'");
      expect(readFileSync(join(d, 'project.faf'), 'utf-8')).toBe(FAF);
      expect(readFileSync(join(d, 'CLAUDE.md'), 'utf-8')).toBe(MD);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  }, 30_000);

  test('`faf bi-sync` is no longer a command and writes nothing', () => {
    const d = project();
    try {
      const r = run(d, ['bi-sync']);
      expect(r.status).not.toBe(0);
      expect(readFileSync(join(d, 'project.faf'), 'utf-8')).toBe(FAF);
      expect(readFileSync(join(d, 'CLAUDE.md'), 'utf-8')).toBe(MD);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  }, 30_000);

  test('plain `faf sync` rewrites CLAUDE.md from .faf and leaves project.faf byte for byte', () => {
    const d = project();
    try {
      const r = run(d, ['sync']);
      expect(r.status).toBe(0);
      expect(readFileSync(join(d, 'project.faf'), 'utf-8')).toBe(FAF);
      const md = readFileSync(join(d, 'CLAUDE.md'), 'utf-8');
      expect(md).toContain('canonical');
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  }, 30_000);
});
