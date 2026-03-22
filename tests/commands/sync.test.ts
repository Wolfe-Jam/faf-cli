import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFaf, readFafRaw } from '../../src/interop/faf.js';
import { generateClaudeMd, writeClaudeMd } from '../../src/interop/claude.js';

describe('sync command integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-sync-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('push generates CLAUDE.md from .faf', () => {
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'sync-test', goal: 'Testing sync', main_language: 'TypeScript' },
    });

    const data = { faf_version: '2.5.0', project: { name: 'sync-test', goal: 'Testing sync', main_language: 'TypeScript' } };
    const content = generateClaudeMd(data);
    writeClaudeMd(testDir, content);

    expect(existsSync(join(testDir, 'CLAUDE.md'))).toBe(true);
    const md = readFileSync(join(testDir, 'CLAUDE.md'), 'utf-8');
    expect(md).toContain('sync-test');
    expect(md).toContain('BI-SYNC ACTIVE');
  });

  test('generateClaudeMd skips slotignored values', () => {
    const data = {
      faf_version: '2.5.0',
      project: { name: 'cli-tool', main_language: 'TypeScript' },
      stack: { frontend: 'slotignored', backend: 'slotignored', runtime: 'Node.js' },
    };
    const content = generateClaudeMd(data);
    expect(content).not.toContain('slotignored');
    expect(content).toContain('Node.js');
  });
});
