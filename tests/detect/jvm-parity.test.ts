/**
 * 🏎️ JVM detection — PARITY contract (Dart/Go/C# composition twin)
 *
 * Shared fixtures in jvm-parity-fixtures.json run through faf-cli (Truth).
 * Kill line: pom / gradle alone ≠ type.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { detectJvmProject } from '../../src/detect/jvm.js';
import fixtureSet from './jvm-parity-fixtures.json';

interface Fixture {
  name: string;
  files: Record<string, string>;
  expected: {
    appType: string;
    framework: string;
    buildTool: string;
    facets: string[];
  };
}

const fixtures = fixtureSet.fixtures as Fixture[];

let dir: string;
beforeEach(() => {
  dir = join(tmpdir(), `jvm-parity-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function materialize(files: Record<string, string>): void {
  for (const [rel, content] of Object.entries(files)) {
    const p = join(dir, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
}

describe('PIT: PARITY: JVM detection — shared fixtures (TS engine = the Truth)', () => {
  test('fixture set is non-trivial', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(10);
  });

  for (const fx of fixtures) {
    test(fx.name, () => {
      materialize(fx.files);
      const result = detectJvmProject(dir);
      expect(result).not.toBeNull();
      expect(result!.appType).toBe(fx.expected.appType);
      expect(result!.framework).toBe(fx.expected.framework);
      expect(result!.buildTool).toBe(fx.expected.buildTool);
      expect(result!.facets).toEqual(fx.expected.facets);
    });
  }
});
