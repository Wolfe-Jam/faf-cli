/**
 * WJTTC — Turbo-Cat public export (the compose spec, 2026-06-12)
 *
 * BRAKE: turboCatScan/turboCatSlots become PUBLIC API — every FAF MCP composes
 * them through the bridge and deletes its local format map. The contract is
 * semver-stable from here:
 *   - sourced-only / no-guess (ambiguous "npm/yarn/pnpm" hints skipped;
 *     extensions assert LANGUAGE only — a .tsx must not assert React)
 *   - deterministic & order-independent
 *   - pure read (no writes)
 *
 * LESSON ENCODED (from the 6.9.0 interview drop): verify exports are
 * POPULATED on a real fixture, not just present — a symbol can ship while its
 * value reads empty across a serialization boundary. Also guards the
 * INTERVIEW_PATHS plain-object companion (Maps JSON-serialize to {}).
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as api from '../../src/index.js';

describe('WJTTC — Turbo-Cat export: present AND populated', () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'turbocat-export-'));
    // A real-looking project: config files + source extensions
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', version: '1.0.0' }));
    writeFileSync(join(dir, 'tsconfig.json'), '{}');
    writeFileSync(join(dir, 'Cargo.toml'), '[package]\nname = "x"\n');
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src', 'main.ts'), 'export {};\n');
    mkdirSync(join(dir, '.git')); // own .git → no parent walk
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('exports are present on the public API', () => {
    expect(typeof api.turboCatScan).toBe('function');
    expect(typeof api.turboCatSlots).toBe('function');
  });

  test('POPULATED on a real fixture — not just present (the 6.9.0 lesson)', () => {
    const r = api.turboCatScan(dir);
    expect(Object.keys(r.slotFills).length).toBeGreaterThan(0);
    expect(r.confirmedCount).toBeGreaterThan(0);
  });

  test('Option B: discoveredFormats carries the per-format breakdown', () => {
    const r = api.turboCatScan(dir);
    expect(r.discoveredFormats.length).toBeGreaterThan(0);
    const names = r.discoveredFormats.map((f) => f.fileName);
    expect(names).toContain('package.json');
    expect(names).toContain('tsconfig.json');
    for (const f of r.discoveredFormats) {
      expect(typeof f.fileName).toBe('string');
      expect(typeof f.category).toBe('string');
      expect(f.category.length).toBeGreaterThan(0);
      expect(typeof f.priority).toBe('number');
    }
    // deterministic order: priority desc, then name
    const sorted = [...r.discoveredFormats].sort(
      (a, b) => b.priority - a.priority || a.fileName.localeCompare(b.fileName),
    );
    expect(r.discoveredFormats).toEqual(sorted);
  });

  test('Option B: stackSignature is deterministic, lowercase, dash-joined', () => {
    const r = api.turboCatScan(dir);
    expect(r.stackSignature).toBeTruthy();
    expect(r.stackSignature).toBe(r.stackSignature.toLowerCase());
    expect(api.turboCatScan(dir).stackSignature).toBe(r.stackSignature);
  });

  test('turboCatSlots returns a .faf-shaped partial', () => {
    const s = api.turboCatSlots(dir);
    const all = { ...(s.project ?? {}), ...(s.stack ?? {}) };
    expect(Object.keys(all).length).toBeGreaterThan(0);
  });

  test('CONTRACT: deterministic & order-independent (same dir → identical result)', () => {
    const a = api.turboCatScan(dir);
    const b = api.turboCatScan(dir);
    expect(a).toEqual(b);
  });

  test('CONTRACT: sourced-only — no ambiguous multi-option fills', () => {
    const r = api.turboCatScan(dir);
    for (const v of Object.values(r.slotFills)) {
      expect(v.includes('/')).toBe(false); // "npm/yarn/pnpm"-style hints never fill
    }
  });

  test('CONTRACT: extensions assert language only — a stray .tsx must not assert React', () => {
    const d2 = mkdtempSync(join(tmpdir(), 'turbocat-ext-'));
    try {
      mkdirSync(join(d2, '.git'));
      writeFileSync(join(d2, 'app.tsx'), 'export {};\n'); // NO config files
      const r = api.turboCatScan(d2);
      expect(r.slotFills.framework).toBeUndefined(); // no React assertion from extension alone
      expect(r.slotFills.mainLanguage).toBeTruthy(); // language IS asserted
    } finally {
      rmSync(d2, { recursive: true, force: true });
    }
  });

  test('CONTRACT: pure read — the scan writes nothing', () => {
    const before = readdirSync(dir).sort();
    api.turboCatScan(dir);
    expect(readdirSync(dir).sort()).toEqual(before);
  });
});

describe('WJTTC — INTERVIEW_PATHS serialization companion', () => {
  test('plain object, populated, survives JSON (Maps do not)', () => {
    expect(Object.keys(api.INTERVIEW_PATHS).length).toBe(api.INTERVIEW.length);
    const roundTrip = JSON.parse(JSON.stringify(api.INTERVIEW_PATHS));
    expect(Object.keys(roundTrip).length).toBe(api.INTERVIEW.length);
    expect(roundTrip['human_context.who'].question).toBe(api.INTERVIEW_PATHS['human_context.who'].question);
    // The Map demonstrates the footgun this companion kills:
    expect(JSON.stringify(api.INTERVIEW_BY_PATH)).toBe('{}');
  });
});
