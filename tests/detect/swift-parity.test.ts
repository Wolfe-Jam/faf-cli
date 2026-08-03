/**
 * Swift detection — PARITY contract
 * Shared fixtures: Package.swift alone ≠ app.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { detectSwiftProject } from '../../src/detect/swift.js';
import fixtureSet from './swift-parity-fixtures.json';

interface Fixture {
  name: string;
  files: Record<string, string>;
  expected: {
    appType: string;
    framework: string;
    packageManager: string;
  };
}

const fixtures = fixtureSet.fixtures as Fixture[];

let dir: string;
beforeEach(() => {
  dir = join(tmpdir(), `swift-parity-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

describe('PIT: PARITY: Swift detection — shared fixtures (TS engine = the Truth)', () => {
  test('fixture set is non-trivial', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(10);
  });

  for (const fx of fixtures) {
    test(fx.name, () => {
      materialize(fx.files);
      const result = detectSwiftProject(dir);
      expect(result).not.toBeNull();
      expect(result!.appType).toBe(fx.expected.appType);
      expect(result!.framework).toBe(fx.expected.framework);
      expect(result!.packageManager).toBe(fx.expected.packageManager);
    });
  }
});
