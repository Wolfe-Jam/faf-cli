import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { readFaf, writeFaf, readFafRaw, findFafFile } from '../../src/interop/faf.js';

describe('interop/faf', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-interop-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('readFaf parses YAML', () => {
    writeFileSync(join(testDir, 'project.faf'), `
faf_version: 2.5.0
project:
  name: test
  goal: Testing
`);
    const data = readFaf(join(testDir, 'project.faf'));
    expect(data.faf_version).toBe('2.5.0');
    expect(data.project?.name).toBe('test');
  });

  test('writeFaf produces valid YAML', () => {
    const path = join(testDir, 'project.faf');
    writeFaf(path, { faf_version: '2.5.0', project: { name: 'write-test' } });
    const raw = readFileSync(path, 'utf-8');
    expect(raw).toContain('faf_version');
    expect(raw).toContain('write-test');

    const data = readFaf(path);
    expect(data.project?.name).toBe('write-test');
  });

  test('readFafRaw returns string', () => {
    writeFileSync(join(testDir, 'project.faf'), 'faf_version: 2.5.0\nproject:\n  name: raw-test\n');
    const raw = readFafRaw(join(testDir, 'project.faf'));
    expect(typeof raw).toBe('string');
    expect(raw).toContain('raw-test');
  });

  test('findFafFile finds .faf', () => {
    writeFileSync(join(testDir, '.faf'), 'faf_version: 2.5.0\nproject:\n  name: dot-faf\n');
    expect(findFafFile(testDir)).toBe(join(testDir, '.faf'));
  });

  test('findFafFile prefers project.faf over .faf', () => {
    writeFileSync(join(testDir, 'project.faf'), 'faf_version: 2.5.0\nproject:\n  name: proj\n');
    writeFileSync(join(testDir, '.faf'), 'faf_version: 2.5.0\nproject:\n  name: dot\n');
    expect(findFafFile(testDir)).toBe(join(testDir, 'project.faf'));
  });

  test('roundtrip preserves data', () => {
    const original = {
      faf_version: '2.5.0',
      project: { name: 'roundtrip', goal: 'Test roundtrip', main_language: 'TypeScript' },
      stack: { frontend: 'React', backend: 'slotignored' },
    };
    const path = join(testDir, 'project.faf');
    writeFaf(path, original);
    const read = readFaf(path);
    expect(read.project?.name).toBe('roundtrip');
    expect(read.project?.goal).toBe('Test roundtrip');
    expect(read.stack?.frontend).toBe('React');
    expect(read.stack?.backend).toBe('slotignored');
  });
});
