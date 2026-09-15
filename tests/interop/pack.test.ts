/**
 * The card pack (src/interop/pack.ts): answers in, a .fafa written from them,
 * and every card it feeds out. Neutral by default: no card carries FAF's
 * extension or FAF's media types unless the caller asks.
 */
import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { parse as parseYaml } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  answersToFafa,
  buildPack,
  fafaYaml,
  mcpName,
  projectA2ACard,
  projectPack,
  projectServerCard,
  projectServerJson,
  SERVER_CARD_SCHEMA,
  SERVER_JSON_SCHEMA,
  type PackAnswers,
} from '../../src/interop/pack.js';
import { buildA2ACard, A2A_CONTEXT_URI } from '../../src/interop/cards.js';

const require = createRequire(import.meta.url);
const specDir = dirname(require.resolve('@faf/specification/package.json'));
const fafaSchema = JSON.parse(readFileSync(join(specDir, 'schemas', 'fafa.schema.json'), 'utf8'));
const validateFafa = new Ajv2020({ strict: false, allErrors: true }).compile(fafaSchema);

const NOW = '2026-09-15T00:00:00.000Z';
const agent: PackAnswers = {
  display_name: 'Weather Agent',
  handle: 'weather-agent',
  domain: 'example.com',
  description: 'Answers questions about the weather anywhere.',
  version: '1.2.0',
  endpoints: [{ protocol: 'a2a', url: 'https://example.com/a2a' }],
  skills: [{ name: 'Get forecast', description: 'A three-day forecast for a place.' }],
};
const hostedMcp: PackAnswers = {
  display_name: 'Weather MCP',
  handle: 'weather',
  domain: 'example.com',
  description: 'Weather tools for AI apps.',
  version: '0.3.1',
  endpoints: [{ protocol: 'mcp', url: 'https://mcp.example.com/mcp' }],
  repository: 'https://github.com/example/weather-mcp',
  tags: ['weather', 'forecast'],
  example_requests: ['Will it rain in Leeds tomorrow?'],
};
const installedMcp: PackAnswers = {
  display_name: 'Weather MCP',
  handle: 'weather',
  domain: 'example.com',
  description: 'Weather tools for AI apps.',
  version: '0.3.1',
  packages: [{ registryType: 'npm', identifier: 'weather-mcp', version: '0.3.1' }],
};

describe('pack.ts stays pure', () => {
  test('imports nothing but yaml, so it runs in a browser', () => {
    const src = readFileSync(join(import.meta.dir, '../../src/interop/pack.ts'), 'utf8');
    const sources = [...src.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1]);
    expect(sources).toEqual(['yaml']);
  });
});

describe('answers → .fafa', () => {
  test('writes a .fafa that passes the .fafa schema', () => {
    for (const a of [agent, hostedMcp, installedMcp]) {
      const fafa = answersToFafa(a);
      const ok = validateFafa(fafa);
      expect(validateFafa.errors ?? []).toEqual([]);
      expect(ok).toBe(true);
    }
  });

  test('identity comes from the domain and short name', () => {
    const fafa = answersToFafa(agent);
    expect(fafa.agent).toMatchObject({
      name: 'weather-agent',
      displayName: 'Weather Agent',
      id: 'urn:air:example.com:agent:weather-agent',
      homepage: 'https://example.com',
    });
  });

  test('an installed package becomes a stdio mcp endpoint', () => {
    expect(answersToFafa(installedMcp).endpoints).toEqual([
      { protocol: 'mcp', transport: 'stdio', location: 'weather-mcp' },
    ]);
  });

  test('every skill gets tags: the keywords, else its own name', () => {
    expect(answersToFafa(agent).capabilities?.[0].tags).toEqual(['get forecast']);
    const withKeywords = answersToFafa({ ...agent, tags: ['weather'] });
    expect(withKeywords.capabilities?.[0].tags).toEqual(['weather']);
  });

  test('the YAML reads back as the same document', () => {
    const fafa = answersToFafa(hostedMcp);
    expect(parseYaml(fafaYaml(fafa))).toEqual(fafa);
  });

  test('names the answer that is missing or malformed', () => {
    expect(() => answersToFafa({ ...agent, description: ' ' })).toThrow('Missing answer: description');
    expect(() => answersToFafa({ ...agent, handle: 'Weather Agent' })).toThrow('Short name');
    expect(() => answersToFafa({ ...agent, domain: 'not a domain' })).toThrow('is not a domain name');
    expect(() => answersToFafa({ ...agent, endpoints: [] })).toThrow('Missing answer: endpoints');
  });

  test('a URL typed as the domain is reduced to the domain', () => {
    expect(answersToFafa({ ...agent, domain: 'https://www.Example.com/about' }).agent?.id)
      .toBe('urn:air:example.com:agent:weather-agent');
  });
});

describe('.fafa → cards', () => {
  test('the A2A card is neutral: no extension unless one is passed', () => {
    const card = projectA2ACard(answersToFafa(agent));
    expect(card.capabilities.extensions).toEqual([]);
    expect(card).toMatchObject({
      name: 'Weather Agent',
      version: '1.2.0',
      supportedInterfaces: [{ url: 'https://example.com/a2a', protocolBinding: 'JSONRPC', protocolVersion: '1.0' }],
      skills: [{ id: 'Get forecast', name: 'Get forecast', tags: ['get forecast'] }],
    });
  });

  test('faf cards still adds FAF\'s extension on top of the same core', () => {
    const fafa = answersToFafa(agent);
    const neutral = projectA2ACard(fafa);
    const faf = buildA2ACard(fafa, { generated: NOW } as never);
    expect(faf.capabilities.extensions.map((e) => e.uri)).toEqual([A2A_CONTEXT_URI]);
    expect({ ...faf, capabilities: { ...faf.capabilities, extensions: [] } }).toEqual(neutral);
  });

  test('Server Card: reverse-DNS name, the fixed schema, capped description, the remote', () => {
    const long = { ...hostedMcp, description: 'x'.repeat(140) };
    const card = projectServerCard(answersToFafa(long));
    expect(card.$schema).toBe(SERVER_CARD_SCHEMA);
    expect(card.name).toBe('com.example/weather');
    expect(String(card.description).length).toBe(100);
    expect(card.remotes).toEqual([{ type: 'streamable-http', url: 'https://mcp.example.com/mcp' }]);
    expect(card.repository).toEqual({ url: 'https://github.com/example/weather-mcp', source: 'github' });
    expect(card).not.toHaveProperty('_meta');
  });

  test('a Server Card needs a remote MCP URL', () => {
    expect(() => projectServerCard(answersToFafa(installedMcp))).toThrow('remote MCP server');
  });

  test('server.json: the dated schema and the package, published by its owner', () => {
    const entry = projectServerJson(answersToFafa(installedMcp));
    expect(entry).toMatchObject({
      $schema: SERVER_JSON_SCHEMA,
      name: 'com.example/weather',
      version: '0.3.1',
      packages: [{ registryType: 'npm', identifier: 'weather-mcp', version: '0.3.1', transport: { type: 'stdio' } }],
    });
    expect(entry).not.toHaveProperty('remotes');
    expect(entry).not.toHaveProperty('_meta');
  });

  test('a registry entry needs a package or a remote', () => {
    const fafa = answersToFafa(agent); // an A2A agent: no MCP at all
    expect(() => projectServerJson(fafa)).toThrow('package people install or a remote MCP URL');
  });

  test('AI Catalog and ARD list the cards the domain serves, with display names', () => {
    const fafa = answersToFafa({ ...hostedMcp, endpoints: [...hostedMcp.endpoints!, { protocol: 'a2a', url: 'https://example.com/a2a' }] });
    const pack = projectPack(fafa, { cards: ['a2a', 'server_card', 'ai_catalog', 'ard'], now: NOW });
    const entries = (pack.ai_catalog as { entries: Array<Record<string, unknown>> }).entries;
    expect(entries.map((e) => [e.identifier, e.type, e.url])).toEqual([
      ['urn:air:example.com:a2a:weather', 'application/a2a-agent-card+json', 'https://example.com/.well-known/agent-card.json'],
      ['urn:air:example.com:mcp:weather', 'application/mcp-server-card+json', 'https://mcp.example.com/mcp/server-card'],
    ]);
    expect(entries.every((e) => e.displayName === 'Weather MCP')).toBe(true);
    const ard = (pack.ard as { entries: Array<Record<string, unknown>> }).entries;
    expect(ard[0]).toMatchObject({ tags: ['weather', 'forecast'], representativeQueries: ['Will it rain in Leeds tomorrow?'] });
    expect(pack.ai_catalog).toMatchObject({ specVersion: '1.0', host: { displayName: 'Weather MCP', identifier: 'example.com' } });
  });

  test('the .fafa is listed only when asked', () => {
    const fafa = answersToFafa(agent);
    const plain = projectPack(fafa, { cards: ['a2a', 'ai_catalog'], now: NOW });
    const listed = projectPack(fafa, { cards: ['a2a', 'ai_catalog'], now: NOW, listFafa: true });
    const types = (p: typeof plain) => (p.ai_catalog as { entries: Array<{ type: string }> }).entries.map((e) => e.type);
    expect(types(plain)).toEqual(['application/a2a-agent-card+json']);
    expect(types(listed)).toEqual(['application/a2a-agent-card+json', 'application/vnd.fafa+yaml']);
  });

  test('neutral by default: no FAF extension, media type or domain in any card', () => {
    const pack = buildPack(
      { ...hostedMcp, endpoints: [...hostedMcp.endpoints!, { protocol: 'a2a', url: 'https://example.com/a2a' }], packages: installedMcp.packages },
      { cards: ['a2a', 'server_card', 'server_json', 'ai_catalog', 'ard'], now: NOW },
    );
    const cards = JSON.stringify([pack.a2a, pack.server_card, pack.server_json, pack.ai_catalog, pack.ard]);
    expect(cards).not.toContain('faf.one');
    expect(cards).not.toContain('vnd.faf');
    expect(cards).not.toContain('one.faf/context');
  });

  test('mcpName reverses the domain', () => {
    expect(mcpName(answersToFafa({ ...agent, domain: 'tools.acme.co.uk' }))).toBe('uk.co.acme.tools/weather-agent');
  });

  test('buildPack = projectPack(answersToFafa(...))', () => {
    const opts = { cards: ['a2a', 'ai_catalog', 'ard'] as const, now: NOW };
    expect(buildPack(agent, { ...opts, cards: [...opts.cards] })).toEqual(
      projectPack(answersToFafa(agent), { ...opts, cards: [...opts.cards] }),
    );
  });
});
