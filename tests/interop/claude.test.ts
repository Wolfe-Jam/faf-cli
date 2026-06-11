import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fafMetaTag, generateClaudeMd, parseClaudeMd, readClaudeMd, writeClaudeMd } from '../../src/interop/claude.js';
import type { FafData } from '../../src/core/types.js';

describe('interop/claude', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-claude-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  const sampleData: FafData = {
    faf_version: '2.5.0',
    project: {
      name: 'test-project',
      goal: 'A test project for validation',
      main_language: 'TypeScript',
    },
    stack: {
      frontend: 'React',
      backend: 'slotignored',
      runtime: 'Node.js',
    },
  };

  test('generateClaudeMd includes project name', () => {
    const content = generateClaudeMd(sampleData);
    expect(content).toContain('test-project');
    expect(content).toContain('BI-SYNC ACTIVE');
    expect(content).toContain('TypeScript');
  });

  test('parseClaudeMd extracts fields', () => {
    const content = generateClaudeMd(sampleData);
    const parsed = parseClaudeMd(content);
    expect(parsed.project?.name).toBe('test-project');
    expect(parsed.project?.main_language).toBe('TypeScript');
  });

  test('write and read CLAUDE.md (non-destructive: content lives in the faf block)', () => {
    writeClaudeMd(testDir, 'test content');
    const content = readClaudeMd(testDir);
    expect(content).toContain('test content');
  });

  test('readClaudeMd returns null when missing', () => {
    expect(readClaudeMd(testDir)).toBeNull();
  });

  // ─── #64: 2-line FAF stamp (canonical per cross-ai-2-line-meta-stamp.md) ───

  describe('fafMetaTag — canonical 2-line stamp (#64)', () => {
    const fullData: FafData = {
      project: {
        name: 'demo',
        main_language: 'TypeScript',
        type: 'cli',
        goal: 'A demo project',
      },
    };

    test('emits exactly 2 lines', () => {
      const stamp = fafMetaTag(fullData);
      expect(stamp.split('\n')).toHaveLength(2);
    });

    test('line 1 has 4 pipe-separated positional segments: name | lang | type | description', () => {
      const [line1] = fafMetaTag(fullData).split('\n');
      const inner = line1.replace(/^<!-- faf: /, '').replace(/ -->$/, '');
      const parts = inner.split(' | ');
      expect(parts).toEqual(['demo', 'TypeScript', 'cli', 'A demo project']);
    });

    test('line 2 defaults to claim=project.faf | family=FAF', () => {
      const [, line2] = fafMetaTag(fullData).split('\n');
      expect(line2).toBe('<!-- faf: claim=project.faf | family=FAF -->');
    });

    test('line 2 includes score when provided', () => {
      const [, line2] = fafMetaTag(fullData, { score: 100 }).split('\n');
      expect(line2).toContain('score=100');
      expect(line2).toContain('claim=project.faf');
      expect(line2).toContain('family=FAF');
    });

    test('line 2 includes siblings when provided', () => {
      const [, line2] = fafMetaTag(fullData, {
        siblings: ['README.md', 'CHANGELOG.md', 'project.faf'],
      }).split('\n');
      expect(line2).toContain('siblings=README.md,CHANGELOG.md,project.faf');
    });

    test('doc opt swaps claim= for doc= (repo-meta files: README, CHANGELOG, …)', () => {
      const [, line2] = fafMetaTag(fullData, { doc: 'readme' }).split('\n');
      expect(line2).toContain('doc=readme');
      expect(line2).not.toContain('claim=');
    });

    test('family override (TAF, WJTTC, …)', () => {
      const [, line2] = fafMetaTag(fullData, { family: 'TAF' }).split('\n');
      expect(line2).toContain('family=TAF');
    });

    test('partial data: missing fields leave empty positional slots, not omit them', () => {
      // Spec invariant: line 1 has 4 segments always — empty string preserves position.
      const stamp = fafMetaTag({ project: { name: 'partial' } });
      const [line1] = stamp.split('\n');
      const inner = line1.replace(/^<!-- faf: /, '').replace(/ -->$/, '');
      const parts = inner.split(' | ');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe('partial');
      expect(parts[1]).toBe(''); // lang
      expect(parts[2]).toBe(''); // type
      expect(parts[3]).toBe(''); // description
    });

    test('regression #64: stamp must NOT be a single line', () => {
      // The bug: faf sync emitted `<!-- faf: name | lang | desc -->` as one line.
      // Fix: stamp is two HTML comments separated by \n.
      const stamp = fafMetaTag(fullData);
      const htmlComments = stamp.match(/<!-- faf: [^>]+ -->/g);
      expect(htmlComments).toHaveLength(2);
    });
  });

  test('generateClaudeMd output starts with the 2-line stamp (#64)', () => {
    const content = generateClaudeMd(sampleData);
    const firstTwoLines = content.split('\n').slice(0, 2);
    expect(firstTwoLines[0]).toMatch(/^<!-- faf: .* -->$/);
    expect(firstTwoLines[1]).toMatch(/^<!-- faf: .* -->$/);
  });

  // ─── #62: parseClaudeMd strips trailing vN.N.N from project.name ───

  describe('parseClaudeMd — strip version trailer from heading (#62)', () => {
    test('strips full semver: # CLAUDE.md — faf-agent v0.1.0 → faf-agent', () => {
      const parsed = parseClaudeMd('# CLAUDE.md — faf-agent v0.1.0\n');
      expect(parsed.project?.name).toBe('faf-agent');
    });

    test('strips major-only: # CLAUDE.md — pkg v1 → pkg', () => {
      const parsed = parseClaudeMd('# CLAUDE.md — pkg v1\n');
      expect(parsed.project?.name).toBe('pkg');
    });

    test('strips major.minor: # CLAUDE.md — pkg v2.10 → pkg', () => {
      const parsed = parseClaudeMd('# CLAUDE.md — pkg v2.10\n');
      expect(parsed.project?.name).toBe('pkg');
    });

    test('strips deep version: # CLAUDE.md — pkg v1.2.3.4 → pkg', () => {
      const parsed = parseClaudeMd('# CLAUDE.md — pkg v1.2.3.4\n');
      expect(parsed.project?.name).toBe('pkg');
    });

    test('case-insensitive: # CLAUDE.md — pkg V1.0.0 → pkg', () => {
      const parsed = parseClaudeMd('# CLAUDE.md — pkg V1.0.0\n');
      expect(parsed.project?.name).toBe('pkg');
    });

    test('preserves names with embedded "v" but no whitespace: faf-cli-v6 stays', () => {
      const parsed = parseClaudeMd('# CLAUDE.md — faf-cli-v6\n');
      expect(parsed.project?.name).toBe('faf-cli-v6');
    });

    test('preserves names that just contain "version" word: version-tracker stays', () => {
      const parsed = parseClaudeMd('# CLAUDE.md — version-tracker\n');
      expect(parsed.project?.name).toBe('version-tracker');
    });

    test('no version trailer: name unchanged', () => {
      const parsed = parseClaudeMd('# CLAUDE.md — plain-name\n');
      expect(parsed.project?.name).toBe('plain-name');
    });

    test('also strips version trailer in old "**Name:** ..." fallback format', () => {
      const parsed = parseClaudeMd('**Name:** legacy-pkg v3.2.1\n');
      expect(parsed.project?.name).toBe('legacy-pkg');
    });
  });
});
