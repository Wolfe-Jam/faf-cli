/**
 * WJTTC — `faf refresh` (the re-ground primitive, PR #75 landed)
 *
 * Intent under test (the spec the command was written to):
 *   drift → refresh → re-grounded
 *   1. re-read + re-score the LIVE .faf (authoritative)
 *   2. measure score-delta vs the DNA baseline
 *   3. keep the .fafb fast tier current — but NEVER force a binary on a
 *      YAML-only project
 *   4. record the re-score on the DNA journey
 *
 * Distinct from `faf drift` (mtime sync) and `faf score` (point-in-time).
 * Grok-driven, root-banked: every surface (CLI, MCPs' refresh_faf, SDKs)
 * inherits this one implementation.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { refreshCommand } from '../../src/commands/refresh.js';
import * as kernel from '../../src/wasm/kernel.js';

const FAF = (goal: string) => `faf_version: "2.5.0"
project:
  name: refresh-test
  goal: ${goal}
  main_language: TypeScript
`;

function captureJson(fn: () => void): any {
  const orig = console.log;
  let out = '';
  console.log = (s: any) => { out += String(s); };
  try { fn(); } finally { console.log = orig; }
  return JSON.parse(out);
}

describe('WJTTC — faf refresh (re-ground)', () => {
  let dir: string;
  let prevCwd: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'faf-refresh-'));
    prevCwd = process.cwd();
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(prevCwd);
    rmSync(dir, { recursive: true, force: true });
  });

  test('re-grounds: re-reads the live .faf and reports the authoritative score', () => {
    writeFileSync(join(dir, 'project.faf'), FAF('prove the re-ground'));
    const r = captureJson(() => refreshCommand({ json: true }));
    expect(r.reGrounded).toBe(true);
    expect(typeof r.score).toBe('number');
    expect(r.score).toBeGreaterThan(0);
  });

  test('YAML-only project: NEVER forces a .fafb into existence', () => {
    writeFileSync(join(dir, 'project.faf'), FAF('no binary here'));
    const r = captureJson(() => refreshCommand({ json: true }));
    expect(r.fafb.reCompiled).toBe(false);
    expect(existsSync(join(dir, 'project.fafb'))).toBe(false);
  });

  test('existing .fafb is re-compiled current (the fast tier never goes stale)', () => {
    const fafPath = join(dir, 'project.faf');
    const fafbPath = join(dir, 'project.fafb');
    writeFileSync(fafPath, FAF('binary tier v1'));
    writeFileSync(fafbPath, kernel.compile(readFileSync(fafPath, 'utf-8')));
    const staleBytes = readFileSync(fafbPath);

    // The .faf moves on; the binary is now stale.
    writeFileSync(fafPath, FAF('binary tier v2 — changed'));
    const r = captureJson(() => refreshCommand({ json: true }));

    expect(r.fafb.reCompiled).toBe(true);
    expect(r.fafb.bytes).toBeGreaterThan(0);
    const freshBytes = readFileSync(fafbPath);
    expect(Buffer.compare(staleBytes, freshBytes)).not.toBe(0); // actually re-compiled
    // Round-trip: the fresh binary decompiles to the CURRENT yaml's content
    const info = kernel.decompile(new Uint8Array(freshBytes));
    expect(JSON.stringify(info)).toContain('refresh-test');
  });

  test('first refresh births the baseline — "baseline set" is never a lie', () => {
    writeFileSync(join(dir, 'project.faf'), FAF('no dna yet'));
    const r = captureJson(() => refreshCommand({ json: true }));
    expect(r.baseline).toBe(null); // honest: there was no prior ground
    expect(r.drifted).toBe(false);
    // ...but the ground now PERSISTS:
    const r2 = captureJson(() => refreshCommand({ json: true }));
    expect(r2.baseline).toBe(r.score); // the baseline the first run set
  });

  test('THE INTENT: drift → refresh → re-grounded (full cycle)', () => {
    const fafPath = join(dir, 'project.faf');
    writeFileSync(fafPath, FAF('v1'));
    const first = captureJson(() => refreshCommand({ json: true }));

    // The .faf improves — drift exists.
    writeFileSync(fafPath, FAF('v1') + 'stack:\n  runtime: Bun\n  build: tsc\n');
    const second = captureJson(() => refreshCommand({ json: true }));
    expect(second.baseline).toBe(first.score);
    expect(second.score).toBeGreaterThan(first.score);
    expect(second.drifted).toBe(true);
    expect(second.delta).toBe(second.score - first.score);

    // Re-grounded: steady state, no drift.
    const third = captureJson(() => refreshCommand({ json: true }));
    expect(third.drifted).toBe(false);
    expect(third.baseline).toBe(second.score);
  });

  test('deterministic: same .faf → same score on repeated refresh (no churn)', () => {
    writeFileSync(join(dir, 'project.faf'), FAF('steady state'));
    const a = captureJson(() => refreshCommand({ json: true }));
    const b = captureJson(() => refreshCommand({ json: true }));
    expect(a.score).toBe(b.score);
    expect(a.drifted).toBe(b.drifted);
  });
});
