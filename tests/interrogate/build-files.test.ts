import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { interrogateBuildFiles } from '../../src/interrogate/build-files.js';

let dir: string;
beforeEach(() => { dir = join(tmpdir(), `faf-bf-${Date.now()}-${Math.random().toString(36).slice(2)}`); mkdirSync(dir, { recursive: true }); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('ENGINE: interrogateBuildFiles — real project commands', () => {
  test('root Makefile targets → make <target>', () => {
    writeFileSync(join(dir, 'Makefile'), 'build:\n\tgo build\ntest:\n\tgo test ./...\nlint:\n\tgolangci-lint run\n');
    const r = interrogateBuildFiles(dir);
    expect(r.commands).toEqual({ test: 'make test', build: 'make build', lint: 'make lint' });
  });

  test('check-all wins the lint slot over a bare lint target', () => {
    writeFileSync(join(dir, 'Makefile'), 'test:\n\tpytest\nlint:\n\truff\ncheck-all: lint mypy test\n');
    const r = interrogateBuildFiles(dir);
    expect(r.commands?.lint).toBe('make check-all');
  });

  test('nested backend Makefile → cd <dir> && make ...', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'root', devDependencies: { husky: '^9' } }));
    mkdirSync(join(dir, 'futureagi'), { recursive: true });
    writeFileSync(join(dir, 'futureagi', 'manage.py'), '# django');
    writeFileSync(join(dir, 'futureagi', 'Makefile'), 'test:\n\tpytest\ncheck-all: test\n');
    const r = interrogateBuildFiles(dir);
    expect(r.commands?.test).toBe('cd futureagi && make test');
    expect(r.commands?.lint).toBe('cd futureagi && make check-all');
  });

  test('the primary backend Makefile beats a secondary service one', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'root' }));
    mkdirSync(join(dir, 'gateway'), { recursive: true });
    writeFileSync(join(dir, 'gateway', 'go.mod'), 'module g\n\ngo 1.23\n');
    writeFileSync(join(dir, 'gateway', 'Makefile'), 'build:\n\tgo build\ntest:\n\tgo test\nlint:\n\tvet\n');
    mkdirSync(join(dir, 'backend'), { recursive: true });
    writeFileSync(join(dir, 'backend', 'manage.py'), '# django');
    writeFileSync(join(dir, 'backend', 'Makefile'), 'test:\n\tpytest\ncheck-all: test\n');
    const r = interrogateBuildFiles(dir);
    expect(r.commands?.test).toBe('cd backend && make test');
  });

  test('justfile targets → just <target>', () => {
    writeFileSync(join(dir, 'justfile'), 'test:\n    cargo test\nbuild:\n    cargo build\n');
    const r = interrogateBuildFiles(dir);
    expect(r.commands?.test).toBe('just test');
  });

  test('no build file → empty', () => {
    expect(interrogateBuildFiles(dir)).toEqual({});
  });
});
