import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { editCommand } from '../../src/commands/edit.js';
import { readFaf } from '../../src/interop/faf.js';

describe('edit command', () => {
  let testDir: string;
  let origCwd: () => string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-edit-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: edit-test\n  goal: original goal\n`);
    origCwd = process.cwd;
    process.cwd = () => testDir;
  });

  afterEach(() => {
    process.cwd = origCwd;
    rmSync(testDir, { recursive: true, force: true });
  });

  test('updates existing field', () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      editCommand('project.name', 'new-name');
    } finally {
      console.log = orig;
    }

    const data = readFaf(join(testDir, 'project.faf'));
    expect(data.project?.name).toBe('new-name');
    expect(data.project?.goal).toBe('original goal');
    expect(logs.some(l => l.includes('updated'))).toBe(true);
  });

  test('adds new field to existing section', () => {
    const orig = console.log;
    console.log = () => {};
    try {
      editCommand('project.main_language', 'Rust');
    } finally {
      console.log = orig;
    }
    const data = readFaf(join(testDir, 'project.faf'));
    expect(data.project?.main_language).toBe('Rust');
  });

  test('creates new section if needed', () => {
    const orig = console.log;
    console.log = () => {};
    try {
      editCommand('stack.frontend', 'Svelte');
    } finally {
      console.log = orig;
    }
    const data = readFaf(join(testDir, 'project.faf'));
    expect(data.stack?.frontend).toBe('Svelte');
  });
});
