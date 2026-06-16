/**
 * 🏎️ Dart detection — CROSS-LANGUAGE PARITY contract (A+B hybrid)
 *
 * This suite runs the SHARED fixtures in tests/detect/dart-parity-fixtures.json
 * through the faf-cli (TypeScript) engine and asserts the expected projection.
 *
 * faf-python-sdk runs the SAME fixtures (byte-identical, synced) through its
 * Python detector in tests/test_dart_parity.py and asserts the SAME expected.
 * Same input + same expected on both engines = parity PROVEN by test, not by eye.
 *
 * The expected values here ARE the Truth (faf-cli is the source). If you change
 * Dart detection behavior, update the fixtures here, then re-sync to the SDK.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { detectDartProject } from '../../src/detect/dart.js';
import fixtureSet from './dart-parity-fixtures.json';

interface Fixture {
  name: string;
  files: Record<string, string>;
  expected: {
    appType: string;
    isFlutter: boolean;
    framework: string;
    stateManagement: string;
    routing: string;
    testing: string;
    found: string;
  };
}

const fixtures = fixtureSet.fixtures as Fixture[];

let dir: string;
beforeEach(() => {
  dir = join(tmpdir(), `dart-parity-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

describe('PARITY: Dart detection — shared fixtures (TS engine = the Truth)', () => {
  test('fixture set is non-trivial', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(20);
  });

  for (const fx of fixtures) {
    test(fx.name, () => {
      materialize(fx.files);
      const result = detectDartProject(dir);
      expect(result).not.toBeNull();
      expect(result).toEqual(fx.expected);
    });
  }
});
