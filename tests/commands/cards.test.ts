import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { cardsCommand } from '../../src/commands/cards.js';
import { readFaf } from '../../src/interop/faf.js';
import { A2A_CONTEXT_URI, projectCards, readFafa } from '../../src/interop/cards.js';
import { projectPack } from '../../src/interop/pack.js';

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
    expect(printed.a2a.capabilities.extensions[0].params.provenance.faf).toBe(
      'https://example.com/project.faf',
    );
    expect(printed.a2a.capabilities.extensions[0].params.mediaTypes).toContain(
      'application/vnd.faf+yaml',
    );
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
    expect(card.capabilities.extensions[0].uri).toBe('https://faf.one/ext/context/v1');
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

describe('TYRE: faf cards — an agent.fafa with no project.faf (BETTER)', () => {
  let testDir: string;
  let errors: string[];
  let errSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-cards-good-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'agent.fafa'), readFileSync(join(FIX, 'agent.fafa'), 'utf-8'));
    errors = [];
    errSpy = spyOn(console, 'error').mockImplementation((m: unknown) => {
      errors.push(String(m));
    });
  });

  afterEach(() => {
    errSpy.mockRestore();
    rmSync(testDir, { recursive: true, force: true });
  });

  test('writes the plain A2A card, the catalog and ARD, and names the BEST step', () => {
    cardsCommand({ dir: testDir });
    const card = readFileSync(join(testDir, '.well-known', 'agent-card.json'), 'utf-8');
    expect(existsSync(join(testDir, '.well-known', 'ai-catalog.json'))).toBe(true);
    expect(existsSync(join(testDir, '.well-known', 'ard.json'))).toBe(true);
    expect(existsSync(join(testDir, 'server-card'))).toBe(false);
    // BETTER: no FAF context extension, nothing pointing at a project.faf.
    expect(JSON.parse(card).capabilities.extensions).toEqual([]);
    expect(card).not.toContain('project.faf');
    expect(card).not.toContain('faf.one/ext/context');
    // The catalog still lists the .fafa: it is what makes these cards BETTER.
    expect(readFileSync(join(testDir, '.well-known', 'ai-catalog.json'), 'utf-8')).toContain('application/vnd.fafa+yaml');
    expect(errors.join('\n')).toContain('BEST: add your project.faf');
  });

  test('a second run changes nothing: faf owns the plain card by its render hash', () => {
    cardsCommand({ dir: testDir });
    errors.length = 0;
    cardsCommand({ dir: testDir });
    const said = errors.join('\n');
    for (const f of ['agent-card.json', 'ai-catalog.json', 'ard.json']) {
      expect(said).toMatch(new RegExp(`${f.replace('.', '\\.')}\\S* .*\\(unchanged\\)`));
    }
  });

  test('adding project.faf moves the A2A card up to BEST: the FAF context extension is added', () => {
    cardsCommand({ dir: testDir });
    writeFileSync(join(testDir, 'project.faf'), readFileSync(join(FIX, 'project.faf'), 'utf-8'));
    cardsCommand({ dir: testDir, target: 'a2a' });
    const card = JSON.parse(readFileSync(join(testDir, '.well-known', 'agent-card.json'), 'utf-8'));
    expect(card.capabilities.extensions[0].uri).toBe(A2A_CONTEXT_URI);
  });

  test('the MCP and registry cards come from project.faf: asked for without one, refused', () => {
    errSpy.mockRestore();
    expectExit(2, () => cardsCommand({ dir: testDir, target: 'mcp' }));
    expectExit(2, () => cardsCommand({ dir: testDir, target: 'a2a,registry' }));
    errSpy = spyOn(console, 'error').mockImplementation(() => {});
    expect(existsSync(join(testDir, '.well-known'))).toBe(false);
  });

  test('neither file: names faf card init, where cards start', () => {
    rmSync(join(testDir, 'agent.fafa'));
    errSpy.mockRestore();
    const said: string[] = [];
    const exitSpy = spyOn(process, 'exit').mockImplementation(((c?: number) => {
      throw new Error(`__exit_${c}__`);
    }) as never);
    errSpy = spyOn(console, 'error').mockImplementation((m: unknown) => {
      said.push(String(m));
    });
    expect(() => cardsCommand({ dir: testDir })).toThrow('__exit_2__');
    exitSpy.mockRestore();
    expect(said.join('\n')).toContain('faf card init');
  });
});

describe('TYRE: faf cards — an MCP server named in the .fafa', () => {
  let testDir: string;
  let errSpy: ReturnType<typeof spyOn>;
  const HOSTED = [
    'version: "1.0"',
    'agent:',
    '  name: weather',
    '  displayName: Weather MCP',
    '  description: Forecasts for anywhere.',
    '  version: 2.0.0',
    '  homepage: https://example.com',
    'endpoints:',
    '  - protocol: mcp',
    '    location: https://mcp.example.com/mcp',
    '',
  ].join('\n');

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-cards-mcp-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'agent.fafa'), HOSTED);
    errSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errSpy.mockRestore();
    rmSync(testDir, { recursive: true, force: true });
  });

  test('BETTER: a plain Server Card from the .fafa, no FAF context', () => {
    cardsCommand({ dir: testDir });
    const text = readFileSync(join(testDir, 'server-card'), 'utf-8');
    const card = JSON.parse(text);
    expect(card.name).toBe('com.example/weather');
    expect(card.remotes).toEqual([{ type: 'streamable-http', url: 'https://mcp.example.com/mcp' }]);
    expect(text).not.toContain('one.faf/context');
    expect(text).not.toContain('project.faf');
    const catalog = readFileSync(join(testDir, '.well-known', 'ai-catalog.json'), 'utf-8');
    expect(catalog).toContain('application/mcp-server-card+json');
  });

  test('BEST: the same Server Card plus FAF context; identity stays the .fafa', () => {
    cardsCommand({ dir: testDir });
    const before = JSON.parse(readFileSync(join(testDir, 'server-card'), 'utf-8'));
    writeFileSync(join(testDir, 'project.faf'), 'project:\n  name: something-else\n  goal: Another goal\n');
    cardsCommand({ dir: testDir, target: 'mcp' });
    const after = JSON.parse(readFileSync(join(testDir, 'server-card'), 'utf-8'));
    for (const k of ['name', 'version', 'description', 'title', 'remotes']) {expect(after[k]).toEqual(before[k]);}
    expect(after._meta['one.faf/context'].faf).toBe('./project.faf');
  });
});

describe('ENGINE: one truth — faf cards and the pack projector write the same cards', () => {
  const NOW = '2026-10-04T00:00:00.000Z';
  const fafa = readFafa(join(FIX, 'agent.fafa'));
  // The fixture names an A2A door; add a remote MCP URL so every card is in play.
  const both = { ...fafa, endpoints: [...(fafa.endpoints ?? []), { protocol: 'mcp', location: 'https://mcp.example.com/mcp' }] };
  const strip = (rows: unknown) => JSON.parse(JSON.stringify(rows));

  for (const [rung, faf] of [['BETTER', undefined], ['BEST', readFaf(join(FIX, 'project.faf'))]] as const) {
    test(`${rung}: A2A card, Server Card, registry identity and catalog rows match`, () => {
      const cli = projectCards({ faf, fafa: both, opts: { now: NOW } });
      const pack = projectPack(both, { cards: ['a2a', 'server_card', 'server_json', 'ai_catalog', 'ard'], faf, now: NOW });
      expect(cli.a2a).toEqual(pack.a2a);
      expect(cli.mcp).toEqual(pack.server_card);
      expect(cli.registry!.name).toBe(pack.server_json!.name);
      expect(cli.registry!.title).toBe(pack.server_json!.title as string | undefined);
      expect(cli.registry!._meta).toEqual(pack.server_json!._meta);
      expect(strip(cli.catalog)).toEqual((pack.ai_catalog as { entries: unknown[] }).entries);
      expect(strip(cli.ard)).toEqual((pack.ard as { entries: unknown[] }).entries);
    });
  }
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
    const params = p.a2a!.capabilities.extensions[0].params as any;
    const mcpBlock = p.mcp!._meta['one.faf/context'] as any;
    expect(params.provenance.faf).toBe(mcpBlock.faf);
    expect(params.provenance.mediaType).toBe(mcpBlock.mediaType);
    expect(params.version).toBeUndefined();
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
    expect(p.a2a!.capabilities.extensions[0].uri).toBe('https://faf.one/ext/context/v1');
    expect(p.a2a!.capabilities.extensions[0].params.version).toBeUndefined();
    expect((p.a2a!.capabilities.extensions[0].params as any).fafaSpecVersion).toBeTruthy();
  });
});
