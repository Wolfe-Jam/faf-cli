/**
 * WJTTC — Cargo.toml interrogation
 *
 * ENGINE: extract [package].description as goal candidate.
 * BRAKE: never grab fields from non-package sections; never accept slop.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { interrogateCargo } from '../../src/interrogate/cargo.js';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `faf-test-cargo-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeCargo(content: string): void {
  writeFileSync(join(dir, 'Cargo.toml'), content);
}

describe('WJTTC ENGINE: Cargo.toml description extraction', () => {
  test('returns {} when no Cargo.toml', () => {
    expect(interrogateCargo(dir)).toEqual({});
  });

  test('extracts [package].description as goal', () => {
    writeCargo([
      '[package]',
      'name = "my-crate"',
      'version = "0.1.0"',
      'description = "A clear description of what this crate does."',
    ].join('\n'));
    expect(interrogateCargo(dir)).toEqual({
      project: { goal: 'A clear description of what this crate does.' },
    });
  });

  test('strips trailing comments', () => {
    writeCargo([
      '[package]',
      'name = "x"',
      'description = "Real description here."  # this is the description',
    ].join('\n'));
    expect(interrogateCargo(dir).project?.goal).toBe('Real description here.');
  });

  test('handles single-quoted values', () => {
    writeCargo([
      '[package]',
      "description = 'Single-quoted value works too.'",
    ].join('\n'));
    expect(interrogateCargo(dir).project?.goal).toBe('Single-quoted value works too.');
  });
});

describe('WJTTC BRAKE: no cross-section bleeding', () => {
  test('does NOT extract description from non-[package] sections', () => {
    writeCargo([
      '[dependencies]',
      'description = "this is not a description we want"',
      '',
      '[package]',
      'name = "x"',
      // intentionally NO description in [package]
    ].join('\n'));
    expect(interrogateCargo(dir).project?.goal).toBeUndefined();
  });

  test('rejects generic slop', () => {
    writeCargo(['[package]', 'description = "TBD"'].join('\n'));
    expect(interrogateCargo(dir).project?.goal).toBeUndefined();
  });

  test('rejects empty description string', () => {
    writeCargo(['[package]', 'description = ""'].join('\n'));
    expect(interrogateCargo(dir).project?.goal).toBeUndefined();
  });
});
