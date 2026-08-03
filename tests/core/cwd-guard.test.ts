import { describe, test, expect } from 'bun:test';
import { isNonProjectRoot } from '../../src/core/cwd-guard.js';
import { homedir } from 'os';
import { resolve } from 'path';

describe('WJTTC BRAKE: cwd-guard — home is never a project root', () => {
  test('home directory is forbidden', () => {
    expect(isNonProjectRoot(homedir())).toBe(true);
    expect(isNonProjectRoot(resolve(homedir()))).toBe(true);
  });

  test('filesystem root is forbidden', () => {
    expect(isNonProjectRoot('/')).toBe(true);
  });

  test('a normal project path is allowed', () => {
    expect(isNonProjectRoot(resolve(homedir(), 'FAF/cli'))).toBe(false);
    expect(isNonProjectRoot('/tmp/my-app')).toBe(false);
  });
});
