import { describe, test, expect } from 'bun:test';
import { generateServerCard } from '../../src/interop/servercard.js';
import type { FafData } from '../../src/core/types.js';

const faf: FafData = {
  faf_version: '2.5.2',
  generated: '2026-05-04T18:00:00.000Z',
  app_type: 'server-card',
  project: { name: 'faf-agent', goal: 'The Voice of FAF', main_language: 'Python' },
};

const NAME_RE = /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/;

describe('🛡️ server card generator', () => {
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
