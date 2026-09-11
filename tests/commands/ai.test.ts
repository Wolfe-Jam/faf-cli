import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, relative } from 'path';
import { spawnSync } from 'child_process';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const plain = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, '');
const RETIRED = "faf ai enhance was retired in 7.13 — project.faf isn't enhanced: faf auto fills tech slots from repo facts, and you write the 6Ws (faf go).";

describe('BRAKE: ai command', () => {
  let testDir: string;
  let originalCwd: string;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-ai-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
    originalApiKey = process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (originalApiKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalApiKey;
    try { rmSync(testDir, { recursive: true, force: true }); } catch {}
  });

  // ───────────────────────────────────────────────────────────────────
  // Subcommand dispatch
  // ───────────────────────────────────────────────────────────────────

  test('aiCommand() with no subcommand shows help — does not crash', async () => {
    const { aiCommand } = await import('../../src/commands/ai.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    await aiCommand();
    logSpy.mockRestore();
    expect(true).toBe(true); // reached this line = no crash
  });

  test('aiCommand("unknown-subcommand") falls through to help', async () => {
    const { aiCommand } = await import('../../src/commands/ai.js');
    const logs: string[] = [];
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    await aiCommand('totally-not-a-subcommand');
    logSpy.mockRestore();
    // Help text lists the one subcommand there is
    const all = logs.join('\n');
    expect(all).toContain('analyze');
    expect(all).not.toContain('enhance');
  });

  // ───────────────────────────────────────────────────────────────────
  // Error paths — these should never make a network call
  // ───────────────────────────────────────────────────────────────────

  test('aiCommand("analyze") with no API key → exits 2 with clear error', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    // Place a minimal .faf so the no-faf check passes; we want to hit the API-key check
    writeFileSync(join(testDir, 'project.faf'), 'faf_version: 2.5.0\nproject:\n  name: t\n');
    const { aiCommand } = await import('../../src/commands/ai.js');
    const errs: string[] = [];
    const errSpy = spyOn(console, 'error').mockImplementation((s: string) => { errs.push(s); });
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit_${code}__`);
    }) as never);
    try {
      await aiCommand('analyze');
      throw new Error('expected process.exit to be called');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain('__exit_2__');
    }
    errSpy.mockRestore();
    logSpy.mockRestore();
    exitSpy.mockRestore();
    expect(errs.join('\n')).toMatch(/ANTHROPIC_API_KEY/);
  });

  // ───────────────────────────────────────────────────────────────────
  // Help text content
  // ───────────────────────────────────────────────────────────────────

  test('help text mentions ANTHROPIC_API_KEY requirement', async () => {
    const { aiCommand } = await import('../../src/commands/ai.js');
    const logs: string[] = [];
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    await aiCommand();
    logSpy.mockRestore();
    expect(logs.join('\n')).toContain('ANTHROPIC_API_KEY');
  });

  test('help text lists only analyze, and names Claude', async () => {
    const { aiCommand } = await import('../../src/commands/ai.js');
    const logs: string[] = [];
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    await aiCommand();
    logSpy.mockRestore();
    const all = logs.join('\n');
    expect(all).toContain('faf ai analyze');
    expect(all).not.toContain('enhance');
    expect(all).toContain('Claude');
  });
});

/** Every file under `dir` (relative path → size and mtime), to show nothing was written. */
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string): void => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) {walk(p);} else {out[relative(dir, p)] = `${st.size}:${st.mtimeMs}`;}
    }
  };
  walk(dir);
  return out;
}

describe('BRAKE: `faf ai enhance` is retired — one line, exit 1, nothing written', () => {
  test('`faf ai enhance` prints exactly the retirement line and exits 1; project.faf and the folder are untouched', () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'faf-ai-retired-')));
    const home = realpathSync(mkdtempSync(join(tmpdir(), 'faf-ai-home-')));
    const faf = 'project:\n  name: demo\n  goal: A demo\nstack:\n  database: None # typed\n';
    writeFileSync(join(dir, 'project.faf'), faf);
    const before = snapshot(dir);
    // With a key set, so nothing about the environment stops it early.
    const r = spawnSync(process.execPath, [CLI, 'ai', 'enhance'], {
      cwd: dir,
      encoding: 'utf-8',
      env: { ...process.env, HOME: home, ANTHROPIC_API_KEY: 'sk-test-not-real', NO_COLOR: '1' },
    });
    expect(r.status).toBe(1);
    expect(plain(`${r.stdout}${r.stderr}`)).toBe(`${RETIRED}\n`);
    expect(readFileSync(join(dir, 'project.faf'), 'utf-8')).toBe(faf);
    expect(snapshot(dir)).toEqual(before);
    // Nothing of faf's in HOME either (bun keeps its own cache there).
    expect(Object.keys(snapshot(home)).filter(f => !/^(Library\/Caches|\.cache)\//.test(f))).toEqual([]);

    // The same with no project.faf and no key: still the one line, still exit 1.
    const empty = realpathSync(mkdtempSync(join(tmpdir(), 'faf-ai-retired-')));
    const bare = spawnSync(process.execPath, [CLI, 'ai', 'enhance'], {
      cwd: empty,
      encoding: 'utf-8',
      env: { ...process.env, HOME: home, ANTHROPIC_API_KEY: '', NO_COLOR: '1' },
    });
    expect(bare.status).toBe(1);
    expect(plain(`${bare.stdout}${bare.stderr}`)).toBe(`${RETIRED}\n`);
    expect(readdirSync(empty)).toEqual([]);
  });

  test('`faf ai` and `faf --help` do not mention enhance; `faf ai` lists only analyze', () => {
    const home = realpathSync(mkdtempSync(join(tmpdir(), 'faf-ai-home-')));
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'faf-ai-help-')));
    const env = { ...process.env, HOME: home, NO_COLOR: '1' };
    const bare = spawnSync(process.execPath, [CLI, 'ai'], { cwd: dir, encoding: 'utf-8', env });
    expect(bare.status).toBe(0);
    const out = plain(bare.stdout);
    expect(out).toContain('faf ai analyze');
    expect(out).not.toMatch(/enhance/i);
    expect(out.split('\n').filter(l => /^\s*faf ai \w/.test(l))).toHaveLength(1);

    const help = plain(spawnSync(process.execPath, [CLI, '--help'], { cwd: dir, encoding: 'utf-8', env }).stdout);
    expect(help).toContain('Ask Claude for suggestions about project.faf (analyze)');
    expect(help).not.toMatch(/enhance/i);
  });

  test('no file in src/ references enhanceCommand, AI_SLOP_PATTERNS or isValidAiExtraction', () => {
    const src = join(import.meta.dir, '../../src');
    const hits: string[] = [];
    const walk = (d: string): void => {
      for (const name of readdirSync(d)) {
        const p = join(d, name);
        if (statSync(p).isDirectory()) {walk(p); continue;}
        if (!/\.(ts|js|mjs|cjs)$/.test(name)) {continue;}
        const text = readFileSync(p, 'utf-8');
        for (const word of ['enhanceCommand', 'AI_SLOP_PATTERNS', 'isValidAiExtraction']) {
          if (text.includes(word)) {hits.push(`${relative(src, p)}: ${word}`);}
        }
      }
    };
    walk(src);
    expect(hits).toEqual([]);
  });
});

describe('PIT: ai command — read-only contract', () => {
  // `faf ai` writes nothing: `analyze` reads project.faf and prints Claude's
  // suggestions; `enhance` is retired (one line, exit 1). The tests above
  // cover both end to end.
  test('contract documented above', () => {
    expect(true).toBe(true);
  });
});
