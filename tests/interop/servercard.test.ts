import { describe, test, expect } from 'bun:test';
import {
  generateServerCard,
  registryMeta,
  registryName,
  REGISTRY_PUBLISHER_KEY,
} from '../../src/interop/servercard.js';
import type { FafData } from '../../src/core/types.js';

const faf: FafData = {
  faf_version: '2.5.2',
  generated: '2026-05-04T18:00:00.000Z',
  app_type: 'server-card',
  project: { name: 'faf-agent', goal: 'The Voice of FAF', main_language: 'Python' },
};

const NAME_RE = /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/;

describe('ENGINE: 🛡️ server card generator', () => {
  test('emits required Server Card fields', () => {
    const c = generateServerCard(faf);
    expect(String(c.$schema)).toContain('server-card.schema.json');
    expect(typeof c.name).toBe('string');
    expect(c.version).toBeDefined();
    expect((c.description as string).length).toBeGreaterThan(0);
    expect((c.description as string).length).toBeLessThanOrEqual(100);
  });

  test('name matches MCP reverse-DNS pattern', () => {
    expect(String(generateServerCard(faf).name)).toMatch(NAME_RE);
  });

  test('carries the canonical FAF context-block', () => {
    const c = generateServerCard(faf) as { _meta: Record<string, any> };
    const ctx = c._meta['one.faf/context'];
    expect(ctx.mediaType).toBe('application/vnd.faf+yaml');
    expect(ctx.deterministic).toBe(true);
    expect(ctx.faf).toBe('./project.faf');
    expect(ctx.generated).toBe('2026-05-04T18:00:00.000Z'); // from .faf metastamp, not now()
  });

  test('does NOT bake a score (FAF don\'t lie)', () => {
    const ctx = (generateServerCard(faf) as any)._meta['one.faf/context'];
    expect(ctx.score).toBeUndefined();
    expect(ctx.tier).toBeUndefined();
  });

  test('scoreEndpoint: omitted when unset, present + before `generated` when set', () => {
    const lean = (generateServerCard(faf) as any)._meta['one.faf/context'];
    expect(lean.scoreEndpoint).toBeUndefined(); // rig stays lean
    const ep = (generateServerCard(faf, { scoreEndpoint: 'https://faf.one' }) as any)._meta['one.faf/context'];
    expect(ep.scoreEndpoint).toBe('https://faf.one');
    const keys = Object.keys(ep);
    expect(keys.indexOf('scoreEndpoint')).toBeLessThan(keys.indexOf('generated')); // byte-identity: order matters
  });

  test('ONE emitter produces the faf-server-card-ref form (absolute faf + scoreEndpoint)', () => {
    const ctx = (generateServerCard(faf, {
      fafPointer: 'https://context.faf.one/.well-known/project.faf',
      scoreEndpoint: 'https://faf.one',
    }) as any)._meta['one.faf/context'];
    expect(ctx.faf).toBe('https://context.faf.one/.well-known/project.faf'); // absolute, for a served card
    expect(ctx.scoreEndpoint).toBe('https://faf.one');
    expect(ctx.deterministic).toBe(true); // single source, both doors
  });

  test('homepage derives a reverse-DNS namespace', () => {
    const c = generateServerCard({ project: { name: 'context', homepage: 'https://faf.one' } });
    expect(c.name).toBe('one.faf/context');
  });

  test('omits remotes unless an endpoint is supplied (no false claim)', () => {
    expect(generateServerCard(faf).remotes).toBeUndefined();
    const withRemote = generateServerCard(faf, { remoteUrl: 'https://card.faf.one/mcp' });
    expect((withRemote.remotes as any[])[0].url).toBe('https://card.faf.one/mcp');
  });

  test('clamps an over-long description to <=100', () => {
    const long = generateServerCard({ project: { name: 'x', goal: 'g'.repeat(250) } });
    expect((long.description as string).length).toBeLessThanOrEqual(100);
  });
});

describe('ENGINE: 🛡️ registry server.json _meta emitter', () => {
  const PP = 'io.modelcontextprotocol.registry/publisher-provided';

  test('nests one.faf/context under publisher-provided — the only key the registry keeps', () => {
    const m = registryMeta(faf) as Record<string, any>;
    expect(Object.keys(m)).toEqual([PP]);
    expect(m[PP]['one.faf/context']).toBeDefined();
    // a TOP-LEVEL one.faf/context (the card shape) is silently dropped by the registry
    expect(m['one.faf/context']).toBeUndefined();
  });

  test('exports the exact publisher-provided key', () => {
    expect(REGISTRY_PUBLISHER_KEY).toBe(PP);
  });

  test('block is byte-identical to the Server Card block (one context, every door)', () => {
    const cardCtx = (generateServerCard(faf) as any)._meta['one.faf/context'];
    const regCtx = (registryMeta(faf) as any)[PP]['one.faf/context'];
    expect(JSON.stringify(regCtx)).toBe(JSON.stringify(cardCtx));
  });

  test("honest-first: no score baked in the registry block either (FAF don't lie)", () => {
    const ctx = (registryMeta(faf) as any)[PP]['one.faf/context'];
    expect(ctx.score).toBeUndefined();
    expect(ctx.tier).toBeUndefined();
  });

  test('deterministic: same .faf + same now → byte-identical', () => {
    const a = JSON.stringify(registryMeta(faf, { now: '2026-06-14T00:00:00.000Z' }));
    const b = JSON.stringify(registryMeta(faf, { now: '2026-06-14T00:00:00.000Z' }));
    expect(a).toBe(b);
  });

  test('refuses a block over the registry 4KB cap', () => {
    expect(() => registryMeta(faf, { fafPointer: 'x'.repeat(5000) })).toThrow(/4096B cap/);
  });

  test('registryName derives one.faf from the faf.one homepage', () => {
    expect(
      registryName({ project: { name: 'claude-faf-mcp', homepage: 'https://faf.one' } }),
    ).toBe('one.faf/claude-faf-mcp');
  });
});
