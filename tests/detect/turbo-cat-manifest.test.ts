/**
 * WJTTC — manifest.json disambiguation (the no-guess blocker fix, 2026-06-12)
 *
 * BRAKE: `manifest.json` is overloaded (chrome extension / mcpb MCP manifest /
 * PWA / plain config). Asserting a Chrome stack from the FILENAME is a guess —
 * sourced-only forbids it. Every FAF MCP ships an mcpb manifest.json and was
 * mis-detected as a JS Chrome Extension, blocking the fleet from composing
 * Turbo-Cat. Chrome is asserted ONLY when content proves it:
 * manifest_version is a NUMBER and a chrome field is present.
 */
import { describe, test, expect, afterEach } from 'bun:test';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { turboCatScan } from '../../src/detect/turbo-cat.js';

const dirs: string[] = [];
function project(files: Record<string, string>): string {
  const d = mkdtempSync(join(tmpdir(), 'tc-manifest-'));
  dirs.push(d);
  mkdirSync(join(d, '.git'));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(d, name), content);
  }
  return d;
}

afterEach(() => {
  while (dirs.length) {rmSync(dirs.pop()!, { recursive: true, force: true });}
});

describe('ENGINE: WJTTC — manifest.json: content decides, never the filename', () => {
  test('THE BLOCKER REPRO: TS project + mcpb manifest stays TypeScript, no Chrome', () => {
    const d = project({
      'package.json': '{"devDependencies":{"typescript":"^5"}}',
      'tsconfig.json': '{}',
      'index.ts': 'export {};\n',
      'manifest.json': '{"manifest_version":"0.3","name":"x","server":{"type":"node"},"display_name":"X"}',
    });
    const r = turboCatScan(d);
    expect(r.slotFills.mainLanguage).toBe('TypeScript');
    expect(r.slotFills.framework).not.toBe('Chrome Extension');
    expect(r.stackSignature).toBe('typescript');
    expect(r.discoveredFormats.map((f) => f.fileName)).not.toContain('manifest.json');
  });

  test('real chrome extension (manifest_version NUMBER + chrome field) → still detected', () => {
    const d = project({
      'manifest.json': '{"manifest_version":3,"name":"x","content_scripts":[]}',
    });
    const r = turboCatScan(d);
    expect(r.slotFills.framework).toBe('Chrome Extension');
    expect(r.discoveredFormats.map((f) => f.fileName)).toContain('manifest.json');
  });

  test('manifest_version 2 (legacy chrome) + background → still detected', () => {
    const d = project({
      'manifest.json': '{"manifest_version":2,"name":"x","background":{"scripts":["bg.js"]}}',
    });
    expect(turboCatScan(d).slotFills.framework).toBe('Chrome Extension');
  });

  test('PWA manifest (start_url/display/icons) → asserts nothing', () => {
    const d = project({
      'manifest.json': '{"name":"x","start_url":"/","display":"standalone","icons":[]}',
      'index.ts': 'export {};\n',
    });
    const r = turboCatScan(d);
    expect(r.slotFills.framework).toBeUndefined();
    expect(r.slotFills.mainLanguage).toBe('TypeScript'); // real evidence wins
  });

  test('number manifest_version WITHOUT chrome fields → asserts nothing (not proven)', () => {
    const d = project({
      'manifest.json': '{"manifest_version":3,"name":"x"}',
    });
    expect(turboCatScan(d).slotFills.framework).toBeUndefined();
  });

  test('unreadable/garbage manifest.json → asserts nothing (honest empty beats guessed stack)', () => {
    const d = project({
      'manifest.json': '{ not json',
      'index.ts': 'export {};\n',
    });
    const r = turboCatScan(d);
    expect(r.slotFills.framework).toBeUndefined();
    expect(r.slotFills.mainLanguage).toBe('TypeScript');
  });
});
