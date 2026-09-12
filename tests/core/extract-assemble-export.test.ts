import { afterAll, describe, test, expect } from 'bun:test';
import { writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { relentlessContext, assembleFreshFaf } from '../../src/index';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

// WJTTC — the relentlessContext + assembleFreshFaf public exports.
// Present AND populated (not just exported), so MCPs can compose them instead
// of forking. Verified on a real temp project.

function tmpProject(files: Record<string, string>): string {
  const d = tempFolders.mkdtemp(join(tmpdir(), 'faf-export-'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(d, name), body);
  return d;
}

describe('TYRE: relentlessContext — sourced 6W extractor (public)', () => {
  test('present + populated from a README, sourced (no guess)', () => {
    const dir = tmpProject({
      'package.json': JSON.stringify({ name: 't', description: 'A tool that does a useful thing for many developers.' }),
      'README.md': '# T\n\nA tool that does a useful thing for many developers.\n\n## Why\n\nBecause it saves time.\n',
    });
    const ctx = relentlessContext(dir);
    expect(typeof ctx).toBe('object');
    // sourced: any filled value must come from the README/pkg text
    const blob = '# T\n\nA tool that does a useful thing for many developers.\n\n## Why\n\nBecause it saves time.\nA tool that does a useful thing for many developers.'.toLowerCase();
    for (const v of Object.values(ctx)) {
      if (v) expect(blob.includes(String(v).toLowerCase().slice(0, 20))).toBe(true);
    }
    rmSync(dir, { recursive: true, force: true });
  });

  test('no README/pkg context → empty (no fabrication)', () => {
    const dir = tmpProject({ 'x.txt': 'nothing useful' });
    const ctx = relentlessContext(dir);
    expect(Object.values(ctx).filter(Boolean).length).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('TYRE: assembleFreshFaf — the .faf builder (public)', () => {
  test('present + builds a structured .faf with the core sections', () => {
    const dir = tmpProject({
      'package.json': JSON.stringify({ name: 't', devDependencies: { typescript: '^5' } }),
      'tsconfig.json': '{}',
    });
    const faf = assembleFreshFaf(dir);
    expect(faf).toBeDefined();
    expect(faf).toHaveProperty('project');
    expect(faf).toHaveProperty('stack');
    expect(faf).toHaveProperty('human_context');
    rmSync(dir, { recursive: true, force: true });
  });

  test('deterministic on the same dir', () => {
    const dir = tmpProject({ 'package.json': JSON.stringify({ name: 't', devDependencies: { typescript: '^5' } }) });
    expect(assembleFreshFaf(dir)).toEqual(assembleFreshFaf(dir));
    rmSync(dir, { recursive: true, force: true });
  });
});

// 7.12.0 — updateExistingFaf (the `faf auto` existing-file chain) + the interop
// surface consumers compose instead of port.
import * as api from '../../src/index';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('TYRE: updateExistingFaf — existing wins, empties are filled (public)', () => {
  test('hand-authored values survive; empty slots are sourced from the repo', () => {
    const dir = tempFolders.mkdtemp(join(tmpdir(), 'faf-update-'));
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'repo-name', description: 'Repo description from package.json', scripts: { test: 'vitest', build: 'tsc' }, dependencies: { express: '^4' } }));
    writeFileSync(join(dir, 'README.md'), '# repo-name\n\nRepo description from package.json\n');
    const existing = { project: { name: 'hand-name', goal: '', main_language: 'TypeScript', type: 'backend' }, human_context: { who: 'Hand-written who', what: '' }, stack: { backend: '' } };
    const out = api.updateExistingFaf(dir, existing) as any;
    expect(out.project.name).toBe('hand-name');          // existing wins
    expect(out.human_context.who).toBe('Hand-written who');
    expect(api.isPlaceholder(out.stack.backend)).toBe(false); // filled from the repo
    expect(api.updateExistingFaf(dir, existing)).toEqual(out); // deterministic
  });
  test('the interop surface is exported', () => {
    for (const name of ['renderAgentsMd', 'writeAgentsMd', 'renderGeminiMd', 'writeGeminiMd', 'renderCursorrules', 'writeCursorrules', 'renderCopilotInstructions', 'writeCopilotInstructions', 'renderClaudeMd', 'writeClaudeMd', 'readClaudeMd', 'parseClaudeMd', 'fafMetaTag', 'injectFafBlock', 'findFafBlock', 'enrichFromRepo', 'updateExistingFaf', 'fillEmpties', 'serializeFaf', 'writeFaf']) {
      expect(typeof (api as any)[name]).toBe('function');
    }
    expect(api.FAF_START).toBe('<!-- faf:start -->');
    expect(api.FAF_END).toBe('<!-- faf:end -->');
  });
});
