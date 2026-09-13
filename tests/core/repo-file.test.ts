/**
 * BRAKE: repoFile — the one helper every detection read goes through (7.13.1).
 *
 * repoFile(dir, rel) resolves `rel` on disk, every link followed (the folders
 * on the way included). When the real path leaves `dir`, runs through `.git`,
 * or a link on the way dangles or loops, detection treats the file as absent:
 * repoExists → false, readRepoFile / statRepoFile / repoFile → null, and
 * readRepoDir leaves such a link out of a listing. A link that stays inside
 * the project is followed. Every folder here is a mkdtemp folder.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { tmpdir } from 'os';
import { readRepoDir, readRepoFile, repoExists, repoFile, statRepoFile } from '../../src/core/safe-write.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const posix = process.platform !== 'win32';
const SECRET = 'aws_secret_access_key = OUTSIDE-SECRET-DO-NOT-READ\n';

/** A project folder, and a folder outside it holding a secret file. */
function fixture(): { dir: string; outside: string; secret: string } {
  const dir = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-repofile-')));
  const outside = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-repofile-outside-')));
  const secret = join(outside, 'credentials');
  writeFileSync(secret, SECRET);
  return { dir, outside, secret };
}

function put(dir: string, rel: string, text: string): void {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), text);
}

/** Every way detection can ask about `rel` says it is absent. */
function expectAbsent(dir: string, rel: string): void {
  expect(repoFile(dir, rel)).toBeNull();
  expect(repoExists(dir, rel)).toBe(false);
  expect(readRepoFile(dir, rel)).toBeNull();
  expect(statRepoFile(dir, rel)).toBeNull();
}

describe('BRAKE: repoFile — detection reads stay inside the project', () => {
  test('a file in the project is found and read', () => {
    const { dir } = fixture();
    put(dir, 'README.md', '# Demo\n');
    expect(repoFile(dir, 'README.md')).toBe(join(dir, 'README.md'));
    expect(repoExists(dir, 'README.md')).toBe(true);
    expect(readRepoFile(dir, 'README.md')).toBe('# Demo\n');
    expect(statRepoFile(dir, 'README.md')?.isFile()).toBe(true);
  });

  test('a file that is not there is absent', () => {
    const { dir } = fixture();
    expectAbsent(dir, 'README.md');
    expect(readRepoDir(dir, 'docs')).toBeNull();
  });

  test('a folder is found; reading it as a file gives nothing', () => {
    const { dir } = fixture();
    put(dir, '.github/workflows/ci.yml', 'on: push\n');
    expect(repoExists(dir, '.github/workflows')).toBe(true);
    expect(statRepoFile(dir, '.github/workflows')?.isDirectory()).toBe(true);
    expect(readRepoFile(dir, '.github/workflows')).toBeNull();
    expect(readRepoDir(dir, '.github/workflows')?.map(e => e.name)).toEqual(['ci.yml']);
  });

  test.skipIf(!posix)('a link to a file outside the project is absent, and left out of a listing', () => {
    const { dir, secret } = fixture();
    symlinkSync(secret, join(dir, 'README.md'));
    put(dir, 'index.ts', 'export {};\n');
    expectAbsent(dir, 'README.md');
    expect(readRepoDir(dir)?.map(e => e.name)).toEqual(['index.ts']);
  });

  test.skipIf(!posix)('a relative link that climbs out of the project is absent', () => {
    const { dir, outside } = fixture();
    symlinkSync(join('..', basename(outside), 'credentials'), join(dir, 'package.json'));
    expectAbsent(dir, 'package.json');
    expectAbsent(dir, join('..', basename(outside), 'credentials'));
  });

  test.skipIf(!posix)('a file in a folder that is a link out of the project is absent', () => {
    const { dir, outside } = fixture();
    writeFileSync(join(outside, 'README.md'), SECRET);
    symlinkSync(outside, join(dir, 'docs'));
    expectAbsent(dir, 'docs');
    expectAbsent(dir, 'docs/README.md');
    expect(readRepoDir(dir, 'docs')).toBeNull();
    expect(readRepoDir(dir)?.map(e => e.name)).toEqual([]);
  });

  test.skipIf(!posix)('a dangling link and a link loop are absent', () => {
    const { dir } = fixture();
    symlinkSync(join(dir, 'nowhere.md'), join(dir, 'README.md'));
    symlinkSync('b.json', join(dir, 'a.json'));
    symlinkSync('a.json', join(dir, 'b.json'));
    expectAbsent(dir, 'README.md');
    expectAbsent(dir, 'a.json');
    expect(readRepoDir(dir)?.map(e => e.name)).toEqual([]);
  });

  test.skipIf(!posix)('anything in .git is absent, a link into .git included', () => {
    const { dir } = fixture();
    put(dir, '.git/config', SECRET);
    symlinkSync(join('.git', 'config'), join(dir, 'README.md'));
    expectAbsent(dir, '.git/config');
    expectAbsent(dir, '.git');
    expectAbsent(dir, 'README.md');
  });

  test.skipIf(!posix)('a link that stays inside the project is followed (README.md → docs/README.md)', () => {
    const { dir } = fixture();
    put(dir, 'docs/README.md', '# In-project README\n');
    symlinkSync(join('docs', 'README.md'), join(dir, 'README.md'));
    put(dir, 'src/cmd/main.go', 'package main\n');
    symlinkSync(join('src', 'cmd'), join(dir, 'cmd'));
    expect(repoFile(dir, 'README.md')).toBe(join(dir, 'docs', 'README.md'));
    expect(readRepoFile(dir, 'README.md')).toBe('# In-project README\n');
    expect(readRepoDir(dir, 'cmd')?.map(e => e.name)).toEqual(['main.go']);
    expect(readRepoDir(dir)?.map(e => e.name).sort()).toEqual(['README.md', 'cmd', 'docs', 'src']);
  });

  test.skipIf(!posix)('a project reached through a link reads its own files', () => {
    const { dir, outside } = fixture();
    put(dir, 'README.md', '# Demo\n');
    const alias = join(outside, 'alias');
    symlinkSync(dir, alias);
    expect(readRepoFile(alias, 'README.md')).toBe('# Demo\n');
    expect(repoFile(alias, 'README.md')).toBe(join(dir, 'README.md'));
  });
});
