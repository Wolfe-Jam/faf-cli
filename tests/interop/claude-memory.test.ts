/**
 * WJTTC BRAKE — the canonical MEMORY.md writer and Claude Code's memory path
 * (#27, #14, Q10).
 *
 * Q10: Claude Code's own auto-memory file (<config>/projects/<id>/memory/
 * MEMORY.md, one managed section) is the canonical tri-sync target. Its writer
 * and path resolver move from claude-faf-mcp into faf-cli, with the audit's
 * findings fixed:
 *   - the id is Claude Code's: canonical git root, every non-[a-zA-Z0-9] → '-',
 *     a 200-char cut + hash (claude-faf-mcp replaced only '/', so
 *     /Users/me/my_app became -Users-me-my_app, a folder Claude never reads)
 *   - markers are whole lines, not substrings; no fresh write after a read
 *     error; CRLF and BOM kept; every line Claude wrote kept
 * and Pro `faf sync` (tri-sync) writes that file instead of <project>/MEMORY.md.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import * as api from '../../src/index.js';
import {
  claudeMemoryStatus,
  claudeProjectId,
  claudeProjectRoot,
  resolveClaudeMemoryDir,
  resolveClaudeMemoryPath,
  writeClaudeMemory,
} from '../../src/interop/claude-memory.js';
import { FAF_END, FAF_START } from '../../src/interop/inject.js';
import { SafePathError } from '../../src/core/safe-write.js';
import type { FafData } from '../../src/core/types.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const posix = process.platform !== 'win32';
const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;

/** Claude Code 2.1.x's rule, restated independently of the code under test. */
function expectedId(path: string): string {
  const s = path.replace(/[^a-zA-Z0-9]/g, '-');
  if (s.length <= 200) {return s;}
  let h = 0;
  for (let i = 0; i < path.length; i++) {h = ((h << 5) - h + path.charCodeAt(i)) | 0;}
  return `${s.slice(0, 200)}-${Math.abs(h).toString(36)}`;
}

const DATA: FafData = {
  project: { name: 'demo', goal: 'A small API for the team', main_language: 'TypeScript', type: 'cli' },
  stack: { build: 'tsc', database: 'slotignored', runtime: 'Node.js' },
  human_context: { who: 'Platform team', what: 'An internal API' },
};

let tmp: string;
let config: string;
beforeEach(() => {
  tmp = realpathSync(mkdtempSync(join(tmpdir(), 'faf-claude-mem-')));
  config = join(tmp, 'claude-config');
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

/** A project folder (not in git) under the mkdtemp root. */
const project = (name = 'proj'): string => {
  const p = join(tmp, name);
  mkdirSync(p, { recursive: true });
  return p;
};
const memPath = (dir: string): string => resolveClaudeMemoryPath(dir, { configDir: config });

describe('BRAKE: the project id is the one Claude Code reads', () => {
  test('every character outside [a-zA-Z0-9] becomes "-"', () => {
    expect(claudeProjectId('/Users/me/my_app')).toBe('-Users-me-my-app');
    expect(claudeProjectId('/Users/me/a.b c/é')).toBe('-Users-me-a-b-c--');
    expect(claudeProjectId('C:\\Users\\me\\proj')).toBe('C--Users-me-proj');
    // Observed on disk: Claude Code's folder for /Users/wolfejam/.claude/projects/-Users-wolfejam/memory
    expect(claudeProjectId('/Users/wolfejam/.claude/projects/-Users-wolfejam/memory')).toBe(
      '-Users-wolfejam--claude-projects--Users-wolfejam-memory',
    );
  });

  test('past 200 characters: cut to 200, then "-" and a base-36 hash of the full path', () => {
    const long = `/Users/me/${'deep_folder/'.repeat(20)}app`;
    const id = claudeProjectId(long);
    expect(id).toBe(expectedId(long));
    expect(id.slice(0, 201)).toBe(`${long.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 200)}-`);
    expect(id.length).toBeGreaterThan(201);
    expect(claudeProjectId(`${long}x`)).not.toBe(id); // same 200-char prefix, different hash
  });
});

describe('BRAKE: the project root is the canonical git root', () => {
  test('a folder not in git is its own root; a subfolder of a repo maps to the repo', () => {
    const plain = project('plain');
    expect(claudeProjectRoot(plain)).toBe(plain);

    const repo = project('repo');
    mkdirSync(join(repo, '.git'));
    mkdirSync(join(repo, 'packages', 'web'), { recursive: true });
    expect(claudeProjectRoot(join(repo, 'packages', 'web'))).toBe(repo);
    expect(memPath(join(repo, 'packages', 'web'))).toBe(memPath(repo));
  });

  /** git's own layout for `git worktree add ../wt`: .git is a file, pointers agree. */
  const worktree = (main: string, wt: string, back = join(wt, '.git')): void => {
    const gitDir = join(main, '.git', 'worktrees', 'wt');
    mkdirSync(gitDir, { recursive: true });
    mkdirSync(wt, { recursive: true });
    writeFileSync(join(wt, '.git'), `gitdir: ${gitDir}\n`);
    writeFileSync(join(gitDir, 'commondir'), '../..\n');
    writeFileSync(join(gitDir, 'gitdir'), `${back}\n`);
  };

  test('a linked worktree maps to its main checkout (all worktrees share one memory)', () => {
    const main = project('main');
    const wt = join(tmp, 'wt.feature');
    worktree(main, wt);
    expect(claudeProjectRoot(wt)).toBe(main);
    expect(claudeProjectRoot(join(wt))).toBe(main);
    expect(resolveClaudeMemoryDir(wt, { configDir: config })).toBe(
      join(config, 'projects', expectedId(main), 'memory'),
    );
  });

  test('pointers that disagree are not followed: the worktree is its own root', () => {
    const main = project('main');
    const wt = join(tmp, 'wt.other');
    worktree(main, wt, join(tmp, 'somewhere-else', '.git'));
    mkdirSync(join(tmp, 'somewhere-else', '.git'), { recursive: true });
    expect(claudeProjectRoot(wt)).toBe(wt);
  });

  test('a real `git worktree add` resolves to the main checkout', () => {
    if (spawnSync('git', ['--version']).status !== 0) {return;}
    const main = project('real-main');
    const git = (...args: string[]): void => {
      const r = spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', ...args], { cwd: main, encoding: 'utf-8' });
      expect(r.status).toBe(0);
    };
    git('init', '-q');
    git('commit', '-q', '--allow-empty', '-m', 'init');
    git('worktree', 'add', '-q', join(tmp, 'real_wt.1'));
    expect(claudeProjectRoot(join(tmp, 'real_wt.1'))).toBe(main);
  });
});

describe('BRAKE: where the file is', () => {
  test('<config>/projects/<id>/memory/MEMORY.md, config from CLAUDE_CONFIG_DIR, remote dir first', () => {
    const dir = project('my_app.v2');
    expect(memPath(dir)).toBe(join(config, 'projects', expectedId(dir), 'memory', 'MEMORY.md'));

    const saved = { c: process.env.CLAUDE_CONFIG_DIR, r: process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR };
    try {
      delete process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR;
      process.env.CLAUDE_CONFIG_DIR = join(tmp, 'env-config');
      expect(resolveClaudeMemoryDir(dir)).toBe(join(tmp, 'env-config', 'projects', expectedId(dir), 'memory'));
      process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR = join(tmp, 'remote');
      expect(resolveClaudeMemoryDir(dir)).toBe(join(tmp, 'remote', 'projects', expectedId(dir), 'memory'));
    } finally {
      if (saved.c === undefined) {delete process.env.CLAUDE_CONFIG_DIR;} else {process.env.CLAUDE_CONFIG_DIR = saved.c;}
      if (saved.r === undefined) {delete process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR;} else {process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR = saved.r;}
    }
  });

  test('exported from the package index', () => {
    expect(api.writeClaudeMemory).toBe(writeClaudeMemory);
    expect(api.resolveClaudeMemoryPath).toBe(resolveClaudeMemoryPath);
    expect(api.claudeProjectId).toBe(claudeProjectId);
    expect(api.claudeProjectRoot).toBe(claudeProjectRoot);
    expect(typeof api.renderClaudeMemory).toBe('function');
    expect(typeof api.resolveClaudeMemoryDir).toBe('function');
    expect(api.claudeMemoryStatus).toBe(claudeMemoryStatus);
  });

  test('claudeMemoryStatus reads the same file and writes nothing', () => {
    const dir = project();
    const none = claudeMemoryStatus(dir, { configDir: config });
    expect(none).toMatchObject({ path: memPath(dir), exists: false, hasBlock: false });
    expect(existsSync(join(memPath(dir), '..'))).toBe(false);

    mkdirSync(join(memPath(dir), '..'), { recursive: true });
    writeFileSync(memPath(dir), '# Project Context (from project.faf)\n- old\n*This section is managed by tri-sync. x*\n- N1\n- N2\n');
    expect(claudeMemoryStatus(dir, { configDir: config })).toMatchObject({ exists: true, hasBlock: false, hasLegacySection: true });

    writeClaudeMemory(dir, DATA, { configDir: config });
    const s = claudeMemoryStatus(dir, { configDir: config });
    expect(s).toMatchObject({ exists: true, hasBlock: true, hasLegacySection: false, otherLines: 2 });
    expect(s.blockLines).toBeGreaterThan(3);
    expect(s.lines).toBe(s.blockLines + 2);
  });
});

describe('BRAKE: the writer keeps every line Claude wrote', () => {
  test('no file → created with the block; a second run writes nothing', () => {
    const dir = project();
    const r = writeClaudeMemory(dir, DATA, { configDir: config });
    expect(r.action).toBe('created');
    expect(r.written).toBe(true);
    const text = readFileSync(memPath(dir), 'utf-8');
    expect(text.startsWith(`${FAF_START}\n`)).toBe(true);
    expect(text.endsWith(`${FAF_END}\n`)).toBe(true);
    expect(text).toContain('- **Name:** demo');
    expect(text).toContain('A small API for the team');
    expect(text).not.toContain('slotignored');

    const ino = statSync(memPath(dir)).ino;
    const again = writeClaudeMemory(dir, DATA, { configDir: config });
    expect(again.action).toBe('unchanged');
    expect(again.written).toBe(false);
    expect(readFileSync(memPath(dir), 'utf-8')).toBe(text);
    expect(statSync(memPath(dir)).ino).toBe(ino);
  });

  test("Claude's notes with CRLF and a BOM: block on top, every byte kept, BOM at byte 0", () => {
    const dir = project();
    const notes = '\uFEFF# Memory\r\n\r\n- [Deploy steps](deploy.md) — how we ship\r\n- NOTE-LAST\r\n';
    mkdirSync(join(memPath(dir), '..'), { recursive: true });
    writeFileSync(memPath(dir), notes);

    const r = writeClaudeMemory(dir, DATA, { configDir: config });
    expect(r.action).toBe('added');
    expect(r.preserved).toBe(true);
    const text = readFileSync(memPath(dir), 'utf-8');
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text.slice(1).startsWith(FAF_START)).toBe(true);
    expect(text.endsWith(notes.slice(1))).toBe(true);

    // Update in place: the notes stay exactly where they are.
    const r2 = writeClaudeMemory(dir, { ...DATA, project: { ...DATA.project, goal: 'A changed goal' } }, { configDir: config });
    expect(r2.action).toBe('updated');
    const text2 = readFileSync(memPath(dir), 'utf-8');
    expect(text2).toContain('A changed goal');
    expect(text2.endsWith(notes.slice(1))).toBe(true);
    expect(text2.split(FAF_START).length).toBe(2);
  });

  test('the old tri-sync heading quoted in a note or a fenced example is not a section', () => {
    const dir = project();
    const notes = [
      '- NOTE-A1: tri-sync used to write "# Project Context (from project.faf)" at the top',
      '```md',
      '# Project Context (from project.faf)',
      '```',
      '- NOTE-A2: *This section is managed by tri-sync. (quoted)',
      '',
    ].join('\n');
    mkdirSync(join(memPath(dir), '..'), { recursive: true });
    writeFileSync(memPath(dir), notes);
    const r = writeClaudeMemory(dir, DATA, { configDir: config });
    expect(r.action).toBe('added');
    expect(readFileSync(memPath(dir), 'utf-8').endsWith(notes)).toBe(true);
  });

  test("claude-faf-mcp's earlier section is replaced in place, once; notes around it stay", () => {
    const dir = project();
    const legacy = [
      '# Project Context (from project.faf)',
      '',
      '## Quick Reference',
      '- **Name:** old',
      '---',
      '*Seeded from project.faf by claude-faf-mcp tri-sync — 2026-08-01*',
      "*This section is managed by tri-sync. Claude's own notes below are preserved.*",
    ].join('\n');
    const before = '- NOTE-BEFORE\n\n';
    const after = '\n\n- NOTE-AFTER-1\n- NOTE-AFTER-2\n';
    mkdirSync(join(memPath(dir), '..'), { recursive: true });
    writeFileSync(memPath(dir), `${before}${legacy}${after}`);

    const r = writeClaudeMemory(dir, DATA, { configDir: config });
    expect(r.action).toBe('migrated');
    expect(r.preserved).toBe(true);
    const text = readFileSync(memPath(dir), 'utf-8');
    expect(text.startsWith(`${before}${FAF_START}\n`)).toBe(true);
    expect(text.endsWith(`${FAF_END}${after}`)).toBe(true);
    expect(text).not.toContain('managed by tri-sync');
    expect(text).not.toContain('**Name:** old');
    expect(writeClaudeMemory(dir, DATA, { configDir: config }).action).toBe('unchanged');
  });

  test('a closing line above the heading (no section after it) migrates nothing', () => {
    const dir = project();
    const notes = "*This section is managed by tri-sync. Claude's own notes below are preserved.*\n- N1\n# Project Context (from project.faf)\n- N2\n";
    mkdirSync(join(memPath(dir), '..'), { recursive: true });
    writeFileSync(memPath(dir), notes);
    expect(writeClaudeMemory(dir, DATA, { configDir: config }).action).toBe('added');
    expect(readFileSync(memPath(dir), 'utf-8').endsWith(notes)).toBe(true);
  });

  test.skipIf(!posix || isRoot)('a read error is not "no file": it throws and writes nothing', () => {
    const dir = project();
    mkdirSync(join(memPath(dir), '..'), { recursive: true });
    writeFileSync(memPath(dir), '- 150 notes Claude wrote\n');
    chmodSync(memPath(dir), 0o000);
    try {
      expect(() => writeClaudeMemory(dir, DATA, { configDir: config })).toThrow();
    } finally {
      chmodSync(memPath(dir), 0o644);
    }
    expect(readFileSync(memPath(dir), 'utf-8')).toBe('- 150 notes Claude wrote\n');
  });

  test.skipIf(!posix)('a MEMORY.md link that leaves the memory folder is refused', () => {
    const dir = project();
    const outside = join(tmp, 'dotfile');
    writeFileSync(outside, 'export SECRET=1\n');
    mkdirSync(join(memPath(dir), '..'), { recursive: true });
    symlinkSync(outside, memPath(dir));
    expect(() => writeClaudeMemory(dir, DATA, { configDir: config })).toThrow(SafePathError);
    expect(readFileSync(outside, 'utf-8')).toBe('export SECRET=1\n');
  });

  test('past the 200 lines Claude Code loads: a warning, and nothing is dropped', () => {
    const dir = project();
    const notes = `${Array.from({ length: 195 }, (_, i) => `- note ${i + 1}`).join('\n')}\n`;
    mkdirSync(join(memPath(dir), '..'), { recursive: true });
    writeFileSync(memPath(dir), notes);
    const r = writeClaudeMemory(dir, DATA, { configDir: config });
    expect(r.lines).toBeGreaterThan(200);
    expect(r.warnings.join(' ')).toContain('first 200');
    expect(readFileSync(memPath(dir), 'utf-8').endsWith(notes)).toBe(true);
  });
});

describe('BRAKE: Pro faf sync (tri-sync) writes Claude Code\'s MEMORY.md', () => {
  test('the block lands in <config>/projects/<id>/memory/MEMORY.md; no <project>/MEMORY.md', () => {
    const dir = project('tri_sync.app');
    writeFileSync(join(dir, 'project.faf'), 'faf_version: 2.5.0\nproject:\n  name: tri-demo\n  goal: Ship the thing\n  main_language: TypeScript\n');
    const memFile = join(config, 'projects', expectedId(dir), 'memory', 'MEMORY.md');
    mkdirSync(join(memFile, '..'), { recursive: true });
    writeFileSync(memFile, '- [Claude note](note.md) — keep me\n');

    const env = { ...process.env, FAF_PRO: '1', CLAUDE_CONFIG_DIR: config };
    delete env.CLAUDE_CODE_REMOTE_MEMORY_DIR;
    const r = spawnSync('bun', [CLI, 'sync'], { cwd: dir, env, encoding: 'utf-8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('MEMORY.md');

    expect(existsSync(join(dir, 'MEMORY.md'))).toBe(false);
    const text = readFileSync(memFile, 'utf-8');
    expect(text).toContain(FAF_START);
    expect(text).toContain('- **Name:** tri-demo');
    expect(text.endsWith('- [Claude note](note.md) — keep me\n')).toBe(true);

    const again = spawnSync('bun', [CLI, 'sync'], { cwd: dir, env, encoding: 'utf-8' });
    expect(again.status).toBe(0);
    expect(again.stdout).toContain('unchanged');
    expect(readFileSync(memFile, 'utf-8')).toBe(text);
  });
});
