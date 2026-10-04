import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { parse as parseYaml } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  cardInitCommand,
  parseSkill,
  shortNameFrom,
  type Ask,
  type CardInitOptions,
} from '../../src/commands/card.js';
import { cardsCommand } from '../../src/commands/cards.js';

const require = createRequire(import.meta.url);
const specDir = dirname(require.resolve('@faf/specification/package.json'));
const fafaSchema = JSON.parse(readFileSync(join(specDir, 'schemas', 'fafa.schema.json'), 'utf8'));
const validateFafa = new Ajv2020({ strict: false, allErrors: true }).compile(fafaSchema);

/** The Pack of Cards post's example, as flags. */
const WEATHER: CardInitOptions = {
  name: 'Weather Agent',
  domain: 'example.com',
  description: 'Answers questions about the weather anywhere.',
  setVersion: '1.2.0',
  url: 'https://example.com/a2a',
  skill: ['Get forecast: A three-day forecast for a place.'],
  example: ['Will it rain in Leeds tomorrow?', 'What is the forecast for Tokyo this weekend?'],
};

/** Answers in order, as a person would type them. */
function scripted(lines: string[]): { ask: Ask; asked: string[] } {
  const asked: string[] = [];
  const queue = [...lines];
  return {
    asked,
    ask: async (q) => {
      asked.push(q);
      return queue.shift() ?? '';
    },
  };
}

async function expectExit(code: number, fn: () => Promise<void>): Promise<string> {
  const errors: string[] = [];
  const exitSpy = spyOn(process, 'exit').mockImplementation(((c?: number) => {
    throw new Error(`__exit_${c}__`);
  }) as never);
  const errSpy = spyOn(console, 'error').mockImplementation((m: unknown) => {
    errors.push(String(m));
  });
  try {
    await fn();
    throw new Error('expected process.exit');
  } catch (e: unknown) {
    expect(e instanceof Error ? e.message : String(e)).toContain(`__exit_${code}__`);
  } finally {
    exitSpy.mockRestore();
    errSpy.mockRestore();
  }
  return errors.join('\n');
}

describe('TYRE: faf card init', () => {
  let dir: string;
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    dir = join(tmpdir(), `faf-card-init-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    logSpy = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    rmSync(dir, { recursive: true, force: true });
  });

  test('flags alone write a schema-valid agent.fafa with the seven answers', async () => {
    await cardInitCommand({ ...WEATHER, dir });
    const text = readFileSync(join(dir, 'agent.fafa'), 'utf-8');
    const doc = parseYaml(text);
    expect(validateFafa(doc)).toBe(true);
    expect(doc.agent.name).toBe('weather-agent');
    expect(doc.agent.displayName).toBe('Weather Agent');
    expect(doc.agent.id).toBe('urn:air:example.com:agent:weather-agent');
    expect(doc.agent.version).toBe('1.2.0');
    expect(doc.capabilities[0].name).toBe('Get forecast');
    expect(doc.capabilities[0].description).toBe('A three-day forecast for a place.');
    expect(doc.endpoints).toEqual([{ protocol: 'a2a', transport: 'http', location: 'https://example.com/a2a' }]);
    expect(doc.metadata.cards.examples).toHaveLength(2);
  });

  test('a file people keep: no YAML anchors or aliases', async () => {
    await cardInitCommand({ ...WEATHER, dir });
    expect(readFileSync(join(dir, 'agent.fafa'), 'utf-8')).not.toMatch(/[&*]a\d/);
  });

  test('beside a project.faf, faf cards writes the catalog and ARD from it', async () => {
    writeFileSync(join(dir, 'project.faf'), readFileSync(join(import.meta.dir, '../fixtures/cards/project.faf'), 'utf-8'));
    await cardInitCommand({ ...WEATHER, dir });
    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    try {
      cardsCommand({ dir, target: 'catalog,ard' });
    } finally {
      errSpy.mockRestore();
    }
    const read = (file: string) => readFileSync(join(dir, '.well-known', file), 'utf-8');
    expect(read('ai-catalog.json')).toContain('urn:air:example.com:a2a:weather-agent');
    // The example questions are ARD's representativeQueries; the catalog has no place for them.
    const ard = JSON.parse(read('ard.json'));
    expect(ard.entries[0].identifier).toBe('urn:air:example.com:a2a:weather-agent');
    expect(ard.entries[0].representativeQueries).toEqual(WEATHER.example);
  });

  test('asked interactively, the same answers write the same file', async () => {
    await cardInitCommand({ ...WEATHER, dir, out: 'from-flags.fafa' });
    const { ask, asked } = scripted([
      'Weather Agent', // name
      '', // short name: accept the default
      'example.com', // domain
      'Answers questions about the weather anywhere.', // what it does
      '1.2.0', // version
      'https://example.com/a2a', // where it runs
      '', // protocol: accept a2a
      'Get forecast', // what it can do
      'A three-day forecast for a place.',
      '', // no more capabilities
      'Will it rain in Leeds tomorrow?',
      'What is the forecast for Tokyo this weekend?',
      '', // no more questions
      '', // write the catalog and ARD now: accept yes
    ]);
    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    try {
      await cardInitCommand({ dir }, ask);
    } finally {
      errSpy.mockRestore();
    }
    expect(asked.length).toBe(14);
    // Good, in one command: the agent.fafa, then the catalog and ARD from it.
    expect(existsSync(join(dir, '.well-known', 'ai-catalog.json'))).toBe(true);
    expect(existsSync(join(dir, '.well-known', 'ard.json'))).toBe(true);
    const fromFlags = parseYaml(readFileSync(join(dir, 'from-flags.fafa'), 'utf-8'));
    const fromQuestions = parseYaml(readFileSync(join(dir, 'agent.fafa'), 'utf-8'));
    expect(fromQuestions).toEqual(fromFlags);
  });

  test('flags that cover everything ask nothing', async () => {
    const { ask, asked } = scripted([]);
    await cardInitCommand({ ...WEATHER, dir }, ask);
    expect(asked).toHaveLength(0);
  });

  test('an npm package is where an MCP server runs (stdio)', async () => {
    await cardInitCommand({ ...WEATHER, url: undefined, package: 'weather-mcp', dir });
    const doc = parseYaml(readFileSync(join(dir, 'agent.fafa'), 'utf-8'));
    expect(validateFafa(doc)).toBe(true);
    expect(doc.endpoints).toEqual([{ protocol: 'mcp', transport: 'stdio', location: 'weather-mcp' }]);
  });

  test('the version defaults to package.json when asked', async () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ version: '3.4.5' }));
    const { ask } = scripted(['']); // accept the default version
    await cardInitCommand({ ...WEATHER, setVersion: undefined, dir }, ask);
    expect(parseYaml(readFileSync(join(dir, 'agent.fafa'), 'utf-8')).agent.version).toBe('3.4.5');
  });

  test('an existing agent.fafa is never replaced without --force', async () => {
    writeFileSync(join(dir, 'agent.fafa'), 'mine\n');
    const err = await expectExit(2, () => cardInitCommand({ ...WEATHER, dir }));
    expect(err).toContain('already exists');
    expect(readFileSync(join(dir, 'agent.fafa'), 'utf-8')).toBe('mine\n');
    await cardInitCommand({ ...WEATHER, dir, force: true });
    expect(readFileSync(join(dir, 'agent.fafa'), 'utf-8')).toContain('weather-agent');
  });

  test('a missing answer names itself and writes nothing', async () => {
    const { ask } = scripted(['']); // no domain given
    const err = await expectExit(2, () => cardInitCommand({ ...WEATHER, domain: undefined, dir }, ask));
    expect(err).toContain('Domain');
    expect(existsSync(join(dir, 'agent.fafa'))).toBe(false);
  });

  test('no capability is a missing answer, not an empty card', async () => {
    const { ask } = scripted(['']); // no capability given
    const err = await expectExit(2, () => cardInitCommand({ ...WEATHER, skill: undefined, dir }, ask));
    expect(err).toContain('what it can do');
    expect(existsSync(join(dir, 'agent.fafa'))).toBe(false);
  });

  test('from flags: names the next step, and the BEST one when there is no project.faf', async () => {
    const lines: string[] = [];
    logSpy.mockImplementation((m: unknown) => {
      lines.push(String(m));
    });
    await cardInitCommand({ ...WEATHER, dir });
    const said = lines.join('\n');
    expect(said).toContain('next: faf cards --target a2a,catalog,ard');
    expect(said).toContain('BEST: add your project.faf (faf init)');
    expect(existsSync(join(dir, '.well-known'))).toBe(false); // flags never write more than asked
  });

  test('declining the offer writes only the agent.fafa', async () => {
    const { ask } = scripted(['1.2.0', 'n']); // version asked, then the offer declined
    await cardInitCommand({ ...WEATHER, setVersion: undefined, dir }, ask);
    expect(existsSync(join(dir, 'agent.fafa'))).toBe(true);
    expect(existsSync(join(dir, '.well-known'))).toBe(false);
  });

  test('short names and skills parse as people type them', () => {
    expect(shortNameFrom('Weather Agent')).toBe('weather-agent');
    expect(shortNameFrom('  My Agent! v2 ')).toBe('my-agent-v2');
    expect(parseSkill('Get forecast: A three-day forecast')).toEqual({ name: 'Get forecast', description: 'A three-day forecast' });
    expect(parseSkill('Get forecast')).toEqual({ name: 'Get forecast' });
  });
});
