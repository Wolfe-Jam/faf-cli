import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { editCommand } from '../../src/commands/edit.js';
import { readFaf } from '../../src/interop/faf.js';
import { FafDNAManager } from '../../src/core/faf-dna.js';

describe('TYRE: edit command', () => {
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

describe('ENGINE: edit records growth on the DNA journey', () => {
  let testDir: string;
  let origCwd: () => string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-edit-dna-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: edit-dna\n`);
    origCwd = process.cwd;
    process.cwd = () => testDir;
  });

  afterEach(() => {
    process.cwd = origCwd;
    rmSync(testDir, { recursive: true, force: true });
  });

  const quiet = (fn: () => void) => {
    const orig = console.log;
    console.log = () => {};
    try { fn(); } finally { console.log = orig; }
  };

  test('a slot filled by hand adds a version; the birth certificate is untouched', () => {
    new FafDNAManager(testDir).birth(0);
    const before = new FafDNAManager(testDir).load()!;
    quiet(() => editCommand('project.goal', 'Record every climb'));
    const after = new FafDNAManager(testDir).load()!;
    expect(after.current.score).toBeGreaterThan(before.current.score);
    expect(after.versions.length).toBe(before.versions.length + 1);
    expect(after.versions.at(-1)!.changes).toEqual(['faf edit project.goal']);
    expect(after.birthCertificate).toEqual(before.birthCertificate);
  });

  test('no .faf-dna → edit never creates one', () => {
    quiet(() => editCommand('project.goal', 'No birth here'));
    expect(existsSync(join(testDir, '.faf-dna'))).toBe(false);
  });

  test('an edit that leaves the score where it is adds no version', () => {
    new FafDNAManager(testDir).birth(0);
    quiet(() => editCommand('project.goal', 'First'));
    const once = new FafDNAManager(testDir).load()!;
    quiet(() => editCommand('project.goal', 'Second wording, same slot'));
    expect(new FafDNAManager(testDir).load()!.versions.length).toBe(once.versions.length);
  });
});
