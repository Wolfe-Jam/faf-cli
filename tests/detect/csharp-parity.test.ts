/**
 * C# detection — PARITY contract (language-host edition)
 *
 * Shared fixtures in csharp-parity-fixtures.json run through faf-cli (Truth).
 * Kill line: .csproj alone ≠ type.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { detectCsharpProject } from '../../src/detect/csharp.js';
import fixtureSet from './csharp-parity-fixtures.json';

interface Fixture {
  name: string;
  files: Record<string, string>;
  expected: {
    appType: string;
    projectName: string;
    targetFramework: string;
    sdk: string;
    framework: string;
    found: string;
  };
}

const fixtures = fixtureSet.fixtures as Fixture[];

let dir: string;
beforeEach(() => {
  dir = join(tmpdir(), `cs-parity-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

describe('PIT: PARITY: C# detection — shared fixtures (TS engine = the Truth)', () => {
  test('fixture set is non-trivial', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(12);
  });

  for (const fx of fixtures) {
    test(fx.name, () => {
      materialize(fx.files);
      const result = detectCsharpProject(dir);
      expect(result).not.toBeNull();
      expect(result).toEqual(fx.expected);
    });
  }
});
