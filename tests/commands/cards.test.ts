import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { cardsCommand } from '../../src/commands/cards.js';
import { readFaf } from '../../src/interop/faf.js';
import { projectCards, readFafa } from '../../src/interop/cards.js';

const FIX = join(import.meta.dir, '../fixtures/cards');

function seed(dir: string) {
  writeFileSync(join(dir, 'project.faf'), readFileSync(join(FIX, 'project.faf'), 'utf-8'));
  writeFileSync(join(dir, 'agent.fafa'), readFileSync(join(FIX, 'agent.fafa'), 'utf-8'));
}

function expectExit(code: number, fn: () => void) {
  const exitSpy = spyOn(process, 'exit').mockImplementation(((c?: number) => {
    throw new Error(`__exit_${c}__`);
  }) as never);
  const errSpy = spyOn(console, 'error').mockImplementation(() => {});
  try {
    fn();
    throw new Error('expected process.exit');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    expect(msg).toContain(`__exit_${code}__`);
  } finally {
    exitSpy.mockRestore();
    errSpy.mockRestore();
  }
}

describe('TYRE: faf cards command', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-cards-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('missing project.faf exits 2', () => {
    expectExit(2, () => cardsCommand({ dir: testDir, target: 'mcp' }));
  });

  test('--target a2a without .fafa exits 2', () => {
    writeFileSync(join(testDir, 'project.faf'), readFileSync(join(FIX, 'project.faf'), 'utf-8'));
    expectExit(2, () => cardsCommand({ dir: testDir, target: 'a2a' }));
  });

  test('--check prints JSON with the context block (no write)', () => {
    seed(testDir);
    const chunks: string[] = [];
    const outSpy = spyOn(process.stdout, 'write').mockImplementation(((s: string) => {
      chunks.push(s);
      return true;
    }) as never);
    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    try {
      cardsCommand({
        dir: testDir,
        target: 'a2a,mcp',
        check: true,
        fafPointer: 'https://example.com/project.faf',
      });
    } finally {
      outSpy.mockRestore();
      errSpy.mockRestore();
    }
    const printed = JSON.parse(chunks.join(''));
    expect(printed.a2a.capabilities.extensions[0].params.faf).toBe(
      'https://example.com/project.faf',
    );
    expect(printed.a2a.capabilities.extensions[0].params.iana).toContain('vnd.faf+yaml');
    expect(printed.mcp._meta['one.faf/context'].faf).toBe('https://example.com/project.faf');
    expect(existsSync(join(testDir, '.well-known', 'agent-card.json'))).toBe(false);
    expect(existsSync(join(testDir, 'server-card'))).toBe(false);
  });

  test('--door-url projects A2A when .fafa has no a2a endpoint', () => {
    writeFileSync(join(testDir, 'project.faf'), readFileSync(join(FIX, 'project.faf'), 'utf-8'));
    writeFileSync(
      join(testDir, 'agent.fafa'),
      readFileSync(join(FIX, 'agent.fafa'), 'utf-8').replace(
        /  - protocol: a2a\n    transport: http\n    location: https:\/\/faf-voice\.vercel\.app\/api\/a2a\n    version: "1.0"\n/,
        '',
      ),
    );
    const chunks: string[] = [];
    const outSpy = spyOn(process.stdout, 'write').mockImplementation(((s: string) => {
      chunks.push(s);
      return true;
    }) as never);
    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    try {
      cardsCommand({
        dir: testDir,
        target: 'a2a',
        check: true,
        doorUrl: 'https://mcpaas.live/claude/a2a',
      });
    } finally {
      outSpy.mockRestore();
      errSpy.mockRestore();
    }
    const printed = JSON.parse(chunks.join(''));
    expect(printed.a2a.supportedInterfaces[0].url).toBe('https://mcpaas.live/claude/a2a');
  });

  test('--target a2a writes .well-known/agent-card.json', () => {
    seed(testDir);
    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    try {
      cardsCommand({ dir: testDir, target: 'a2a' });
    } finally {
      errSpy.mockRestore();
    }
    const card = JSON.parse(readFileSync(join(testDir, '.well-known', 'agent-card.json'), 'utf-8'));
    expect(card.name).toBe('FAFA — the Voice of FAF');
    expect(card.capabilities.extensions[0].uri).toBe('https://faf.one/context');
    expect(card.capabilities.extensions[0].params.version).toBeUndefined();
  });

  test('--target mcp writes server-card without a .fafa', () => {
    writeFileSync(join(testDir, 'project.faf'), readFileSync(join(FIX, 'project.faf'), 'utf-8'));
    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    try {
      cardsCommand({ dir: testDir, target: 'mcp' });
    } finally {
      errSpy.mockRestore();
    }
    expect(existsSync(join(testDir, 'server-card'))).toBe(true);
    const card = JSON.parse(readFileSync(join(testDir, 'server-card'), 'utf-8'));
    expect(card._meta['one.faf/context'].mediaType).toBe('application/vnd.faf+yaml');
  });
});

describe('ENGINE: fixture golden — projector vs tests/fixtures/cards', () => {
  test('real fixture files project a proto-complete A2A card + identical block', () => {
    const faf = readFaf(join(FIX, 'project.faf'));
    const fafa = readFafa(join(FIX, 'agent.fafa'));
    const p = projectCards({
      faf,
      fafa,
      opts: { fafPointer: 'https://github.com/Wolfe-Jam/faf-agent/blob/main/project.faf' },
    });
    expect(p.a2a).toBeDefined();
    expect(p.a2a!.supportedInterfaces[0].protocolBinding).toBe('JSONRPC');
    expect(p.a2a!.skills.every((s) => Array.isArray(s.tags))).toBe(true);
    expect(JSON.stringify(p.a2a!.capabilities.extensions[0].params)).toBe(
      JSON.stringify(p.mcp!._meta['one.faf/context']),
    );
    expect(p.a2a!.capabilities.extensions[0].params.version).toBeUndefined();
  });
});

describe('ENGINE: optional sibling faf-agent golden', () => {
  const siblingFafa = join(import.meta.dir, '../../../faf-agent/agent.fafa');
  const siblingFaf = join(import.meta.dir, '../../../faf-agent/project.faf');
  const have = existsSync(siblingFafa) && existsSync(siblingFaf);

  test.skipIf(!have)('live faf-agent inputs emit required A2A fields + no invented version in params', () => {
    const p = projectCards({
      faf: readFaf(siblingFaf),
      fafa: readFafa(siblingFafa),
      opts: { fafPointer: 'https://github.com/Wolfe-Jam/faf-agent/blob/main/project.faf' },
    });
    expect(p.a2a!.name).toBeTruthy();
    expect(p.a2a!.supportedInterfaces.length).toBeGreaterThan(0);
    expect(p.a2a!.skills.length).toBeGreaterThan(0);
    expect(p.a2a!.capabilities.extensions[0].uri).toBe('https://faf.one/context');
    expect(p.a2a!.capabilities.extensions[0].params.version).toBeUndefined();
    expect(p.a2a!.capabilities.extensions[0].params.deterministic).toBe(true);
  });
});
