import { describe, test, expect } from 'bun:test';
import type { FafData } from '../../src/core/types.js';
import {
  A2A_CONTEXT_URI,
  assertSameBlock,
  generateA2ACard,
  projectCards,
  upsertCatalog,
  type FafaDoc,
} from '../../src/interop/cards.js';
import { fafContextBlock, REGISTRY_PUBLISHER_KEY } from '../../src/interop/servercard.js';

const faf: FafData = {
  faf_version: '2.5.2',
  generated: '2026-05-04T18:00:00.000Z',
  app_type: 'cli',
  project: {
    name: 'faf-agent',
    title: 'FAFA',
    goal: 'The Voice of FAF',
    homepage: 'https://faf.one',
    main_language: 'Python',
  },
};

const fafa: FafaDoc = {
  agent: {
    name: 'faf-agent',
    displayName: 'FAFA — the Voice of FAF',
    vendor: 'WolfeJAM',
    version: '0.1.4',
    description: 'Narrow-domain, citation-mandatory agent for the .faf family.',
    homepage: 'https://faf.one/agent',
  },
  capabilities: [
    { name: 'ask', description: 'Answer a FAF question.', tags: ['faf'] },
    { name: 'cite', description: 'Return a citation.', tags: ['faf', 'citation'] },
  ],
  endpoints: [
    { protocol: 'mcp', transport: 'stdio', location: 'uvx faf-agent-mcp' },
    { protocol: 'a2a', transport: 'http', location: 'https://faf-voice.vercel.app/api/a2a', version: '1.0' },
  ],
};

describe('ENGINE: 🛡️ one projector — faf cards', () => {
  test('block is byte-identical on A2A params · MCP _meta · registry nest', () => {
    const p = projectCards({ faf, fafa });
    const want = JSON.stringify(fafContextBlock(faf));
    expect(JSON.stringify(p.a2a!.capabilities.extensions[0].params)).toBe(want);
    expect(JSON.stringify((p.mcp!._meta as any)['one.faf/context'])).toBe(want);
    expect(
      JSON.stringify((p.registry!._meta as any)[REGISTRY_PUBLISHER_KEY]['one.faf/context']),
    ).toBe(want);
    assertSameBlock(p);
  });

  test('does NOT bake a score or tier', () => {
    const p = projectCards({ faf, fafa });
    expect(p.block.score).toBeUndefined();
    expect(p.block.tier).toBeUndefined();
    expect(p.a2a!.capabilities.extensions[0].params.score).toBeUndefined();
  });

  test('A2A extension URI is the dereference, not the MCP key', () => {
    const card = generateA2ACard(fafa, faf);
    expect(card.capabilities.extensions[0].uri).toBe(A2A_CONTEXT_URI);
    expect(A2A_CONTEXT_URI).toBe('https://faf.one/context');
  });

  test('A2A name prefers displayName', () => {
    expect(generateA2ACard(fafa, faf).name).toBe('FAFA — the Voice of FAF');
  });

  test('A2A has proto REQUIRED fields + skill tags', () => {
    const c = generateA2ACard(fafa, faf);
    expect(c.name).toBeTruthy();
    expect(c.description).toBeTruthy();
    expect(c.version).toBe('0.1.4');
    expect(c.supportedInterfaces[0]).toEqual({
      url: 'https://faf-voice.vercel.app/api/a2a',
      protocolBinding: 'JSONRPC',
      protocolVersion: '1.0',
    });
    expect(c.capabilities).toBeDefined();
    expect(c.defaultInputModes.length).toBeGreaterThan(0);
    expect(c.defaultOutputModes.length).toBeGreaterThan(0);
    expect(c.skills.length).toBe(2);
    c.skills.forEach((s) => {
      expect(s.id && s.name && s.description && Array.isArray(s.tags)).toBe(true);
    });
    expect('url' in c).toBe(false);
  });

  test('no .fafa + explicit a2a target throws', () => {
    expect(() => projectCards({ faf, targets: ['a2a'] })).toThrow(/require a \.fafa/);
  });

  test('no .fafa still emits MCP + registry', () => {
    const p = projectCards({ faf, targets: ['mcp', 'registry'] });
    expect(p.mcp).toBeDefined();
    expect(p.registry).toBeDefined();
    expect(p.a2a).toBeUndefined();
  });

  test('no a2a endpoint + explicit a2a target throws (no invented door)', () => {
    const dry: FafaDoc = { ...fafa, endpoints: [{ protocol: 'mcp', location: 'uvx x' }] };
    expect(() => projectCards({ faf, fafa: dry, targets: ['a2a'] })).toThrow(/Will not invent a door/);
  });

  test('no a2a endpoint + default targets skips A2A', () => {
    const dry: FafaDoc = { ...fafa, endpoints: [{ protocol: 'mcp', location: 'uvx x' }] };
    const p = projectCards({ faf, fafa: dry });
    expect(p.a2a).toBeUndefined();
    expect(p.mcp).toBeDefined();
  });

  test('A2A params omit .fafa provenance.version (block only)', () => {
    const dirty: FafaDoc = {
      ...fafa,
      provenance: { faf: 'x', mediaType: 'application/vnd.faf+yaml', version: '2.5.2' },
    };
    const params = generateA2ACard(dirty, faf).capabilities.extensions[0].params;
    expect(params.version).toBeUndefined();
    expect(params.mediaType).toBe('application/vnd.faf+yaml');
    expect(params.deterministic).toBe(true);
  });

  test('upsertCatalog patches existing A2A row, leaves showcase rows', () => {
    const existing = {
      specVersion: '1.0',
      entries: [
        {
          identifier: 'urn:air:faf.one:a2a:fafa',
          type: 'application/a2a-agent-card+json',
          url: 'https://faf-voice.vercel.app/.well-known/agent-card.json',
        },
        {
          identifier: 'urn:air:faf.one:context:zeph',
          type: 'application/vnd.faf+yaml',
          url: 'https://example.com/zeph.faf',
        },
      ],
    };
    const p = projectCards({
      faf,
      fafa,
      targets: ['catalog'],
      opts: { a2aCardUrl: 'https://faf.one/.well-known/agent-card.json' },
    });
    const next = upsertCatalog(existing, p.catalog!);
    const a2a = next.entries.find((e) => e.identifier === 'urn:air:faf.one:a2a:fafa')!;
    expect(a2a.url).toBe('https://faf.one/.well-known/agent-card.json');
    expect(a2a.type).toBe('application/json');
    expect(a2a.displayName).toBeUndefined();
    expect(next.entries.find((e) => e.identifier.endsWith(':zeph'))!.url).toContain('zeph');
  });

  test('same .faf + same now → deterministic A2A', () => {
    const a = JSON.stringify(generateA2ACard(fafa, faf, { now: '2026-08-17T00:00:00.000Z' }));
    const b = JSON.stringify(generateA2ACard(fafa, faf, { now: '2026-08-17T00:00:00.000Z' }));
    expect(a).toBe(b);
  });
});
