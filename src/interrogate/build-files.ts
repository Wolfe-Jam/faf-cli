/**
 * Makefile / justfile / Taskfile interrogation — the real project commands.
 *
 * `detectCommands` in scanner.ts only reads root package.json scripts + language
 * defaults. Many repos (esp. polyglot ones) drive test/build/lint through a
 * Makefile — `make test`, `make check-all`. Read the target names and map the
 * obvious ones. Facts from files, not README prose.
 */

import { join } from 'path';
import { readRepoDir, readRepoFile, repoExists, withRepoRoot } from '../core/safe-write.js';
import type { ExtractedContext } from './types.js';

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'vendor', 'target', 'e2e', 'docs', 'scripts',
]);

interface BuildFile {
  file: string;
  runner: string;
  /** extract target names from the file body */
  targets: (body: string) => string[];
}

const BUILD_FILES: BuildFile[] = [
  {
    file: 'Makefile',
    runner: 'make',
    // `target:` at column 0, not `.PHONY` / pattern rules / variables
    targets: (b) => [...b.matchAll(/^([a-zA-Z][\w-]*)\s*:(?!=)/gm)].map(m => m[1]),
  },
  {
    file: 'justfile',
    runner: 'just',
    targets: (b) => [...b.matchAll(/^([a-zA-Z][\w-]*)\s*(?:\([^)]*\))?\s*:/gm)].map(m => m[1]),
  },
  {
    file: 'Taskfile.yml',
    runner: 'task',
    targets: (b) => {
      const i = b.indexOf('tasks:');
      if (i === -1) {return [];}
      return [...b.slice(i).matchAll(/^\s{2}([a-zA-Z][\w-]*):/gm)].map(m => m[1]);
    },
  },
];

/** Pick the best target for a command slot, preferring the more complete one. */
function pick(targets: string[], patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const hit = targets.find(t => p.test(t));
    if (hit) {return hit;}
  }
  return null;
}

/** Root, then each depth-1 subdir (so a nested `backend/Makefile` is found). */
function buildFileDirs(dir: string): string[] {
  const dirs = [dir];
  for (const e of readRepoDir(dir) ?? []) { // unreadable: root only
    if (e.isDirectory() && !e.name.startsWith('.') && !IGNORE_DIRS.has(e.name)) {
      dirs.push(join(dir, e.name));
    }
  }
  return dirs;
}

/** Does `d` look like the primary backend/app dir? (raises its command priority) */
function looksPrimary(d: string): number {
  let s = 0;
  if (repoExists(d, 'manage.py') || repoExists(d, 'pyproject.toml') || repoExists(d, 'Gemfile')) {s += 3;}
  if (/(?:^|\/)(backend|api|server|core|app)$/.test(d)) {s += 2;}
  return s;
}

export function interrogateBuildFiles(dir: string): ExtractedContext {
  // The project folder bounds the subfolder reads: a nested Makefile may link
  // anywhere inside the project, never out of it.
  return withRepoRoot(dir, () => buildFileContext(dir));
}

function buildFileContext(dir: string): ExtractedContext {
  const candidates: Array<{ score: number; commands: Record<string, string> }> = [];

  for (const scanDir of buildFileDirs(dir)) {
    const isRoot = scanDir === dir;
    const prefix = isRoot ? '' : `cd ${scanDir.slice(dir.length + 1)} && `;
    for (const bf of BUILD_FILES) {
      const body = readRepoFile(scanDir, bf.file);
      if (body === null) {continue;}
      const targets = bf.targets(body);
      if (targets.length === 0) {continue;}

      const commands: Record<string, string> = {};
      const test = pick(targets, [/^test$/i, /^tests$/i, /test-all/i, /^test-unit/i, /^test/i]);
      const build = pick(targets, [/^build$/i, /^compile$/i, /^build/i]);
      const lint = pick(targets, [/^check-all$/i, /^check$/i, /^lint$/i, /^lint/i, /^fmt$/i, /^format$/i]);
      if (test) {commands.test = `${prefix}${bf.runner} ${test}`;}
      if (build) {commands.build = `${prefix}${bf.runner} ${build}`;}
      if (lint) {commands.lint = `${prefix}${bf.runner} ${lint}`;}
      if (Object.keys(commands).length === 0) {continue;}

      candidates.push({
        score: Object.keys(commands).length + (isRoot ? 10 : looksPrimary(scanDir)),
        commands,
      });
    }
  }

  const best = candidates.sort((a, b) => b.score - a.score)[0];
  return best ? { commands: best.commands } : {};
}
