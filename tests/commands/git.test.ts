import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { detectStack } from '../../src/detect/stack.js';
import { parse } from 'yaml';

describe('git command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-git-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  test('detectStack works on a directory with package.json', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'git-test-app',
      dependencies: { react: '^18.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    }));

    const data = detectStack(testDir);
    expect(data.project?.name).toBe('git-test-app');
    expect(data.faf_version).toBe('2.5.0');
  });

  test('detectStack handles empty directory', () => {
    const data = detectStack(testDir);
    expect(data.faf_version).toBe('2.5.0');
    expect(data.project).toBeDefined();
  });

  test('git clone and detect roundtrip on local repo', () => {
    // Create a fake local git repo to clone
    const repoDir = join(testDir, 'source-repo');
    mkdirSync(repoDir);
    execSync(`git init ${repoDir}`, { stdio: 'pipe' });
    execSync(`git -C ${repoDir} config user.email "test@test.com" && git -C ${repoDir} config user.name "Test"`, { stdio: 'pipe' });
    writeFileSync(join(repoDir, 'package.json'), JSON.stringify({ name: 'local-repo' }));
    execSync(`git -C ${repoDir} add -A && git -C ${repoDir} commit -m "init"`, { stdio: 'pipe' });

    // Clone it
    const cloneDir = join(testDir, 'cloned');
    execSync(`git clone ${repoDir} ${cloneDir}`, { stdio: 'pipe' });

    const data = detectStack(cloneDir);
    expect(data.project?.name).toBe('local-repo');
  });
});
