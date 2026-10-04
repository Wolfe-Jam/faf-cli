/**
 * faf card init — write an agent.fafa from the seven answers.
 *
 * Seven answers describe an agent or a server: name, short name, domain, what
 * it does, version, where it runs, what it can do. `answersToFafa` turns them
 * into a valid .fafa; this command asks for them (or takes them as flags) and
 * writes the file `faf cards` projects every card from.
 */
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { createInterface } from 'readline';
import { answersToFafa, fafaYaml, type PackAnswers } from '../interop/pack.js';
import { findFafFile } from '../interop/faf.js';
import { cardsCommand } from './cards.js';
import { betterTargets, readFafa, type CardTarget } from '../interop/cards.js';
import { safeWriteFile } from '../core/safe-write.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface CardInitOptions {
  name?: string;
  shortName?: string;
  domain?: string;
  description?: string;
  setVersion?: string;
  url?: string;
  protocol?: string;
  package?: string;
  skill?: string[];
  example?: string[];
  dir?: string;
  out?: string;
  force?: boolean;
}

/** Ask one question, return the answer (trimmed). Injected in tests. */
export type Ask = (question: string) => Promise<string>;

const PROTOCOLS = ['a2a', 'mcp'];

/** Each card's name, as a person reads it. */
const CARD_NAMES: Record<CardTarget, string> = {
  a2a: 'A2A card',
  mcp: 'MCP Server Card',
  registry: 'registry server.json',
  catalog: 'AI Catalog',
  ard: 'ARD',
};

/** "Weather Agent" → "weather-agent": the short name a URN can carry. */
export function shortNameFrom(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/-+$/, '');
}

/** "Get forecast: A three-day forecast" → { name, description }. */
export function parseSkill(raw: string): { name: string; description?: string } {
  const i = raw.indexOf(':');
  if (i < 0) {return { name: raw.trim() };}
  const description = raw.slice(i + 1).trim();
  return { name: raw.slice(0, i).trim(), ...(description ? { description } : {}) };
}

/** The version in ./package.json, if there is one — a sensible default. */
function packageVersion(dir: string): string | undefined {
  try {
    const v = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8')).version;
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  } catch {
    return undefined;
  }
}

/** "Where it runs": a URL becomes an endpoint, anything else an npm package. */
function whereItRuns(answers: PackAnswers, where: string, protocol: string): void {
  if (/^https?:\/\//i.test(where)) {
    answers.endpoints = [{ protocol, url: where }];
  } else {
    answers.packages = [{ registryType: 'npm', identifier: where }];
  }
}

/** A flag's value, trimmed ('' when absent). */
function flag(v: string | undefined): string {
  return (v ?? '').trim();
}

/** Answers from flags only. Missing ones stay missing; `answersToFafa` names them. */
export function answersFromFlags(o: CardInitOptions): PackAnswers {
  const name = flag(o.name);
  const answers: PackAnswers = {
    display_name: name,
    handle: flag(o.shortName) || shortNameFrom(name),
    domain: flag(o.domain),
    description: flag(o.description),
    version: flag(o.setVersion),
    skills: (o.skill ?? []).map(parseSkill).filter((s) => s.name),
    example_requests: (o.example ?? []).map(flag).filter(Boolean),
  };
  if (o.url) {whereItRuns(answers, flag(o.url), flag(o.protocol).toLowerCase() || 'a2a');}
  if (o.package) {answers.packages = [{ registryType: 'npm', identifier: flag(o.package) }];}
  return answers;
}

/** Ask, offering a default; an empty reply takes it. */
function withDefault(ask: Ask): (q: string, def?: string) => Promise<string> {
  return async (q, def) => (await ask(def ? `${q} ${dim(`(${def})`)}: ` : `${q}: `)).trim() || def || '';
}

/** Ask for items until an empty reply, or `max`. */
async function askList(ask: Ask, first: string, more: string, max: number): Promise<string[]> {
  const items: string[] = [];
  while (items.length < max) {
    const got = (await ask(`${items.length ? more : first}: `)).trim();
    if (!got) {break;}
    items.push(got);
  }
  return items;
}

async function askWhere(a: PackAnswers, ask: Ask): Promise<void> {
  const q = withDefault(ask);
  const where = await q('Where it runs — a URL people call, or an npm package');
  if (!where) {return;}
  let protocol = 'a2a';
  if (/^https?:\/\//i.test(where)) {
    const said = (await q('Protocol at that URL — a2a or mcp', 'a2a')).toLowerCase();
    protocol = PROTOCOLS.includes(said) ? said : 'a2a';
  }
  whereItRuns(a, where, protocol);
}

async function askSkills(ask: Ask): Promise<Array<{ name: string; description?: string }>> {
  const skills: Array<{ name: string; description?: string }> = [];
  for (;;) {
    const [name] = await askList(ask, skills.length ? 'Another thing it can do (Enter to finish)' : 'What it can do — one capability, e.g. Get forecast', '', 1);
    if (!name) {break;}
    const description = (await ask(`  ${dim('what it does')}: `)).trim();
    skills.push({ name, ...(description ? { description } : {}) });
  }
  return skills;
}

/** Fill whatever the flags left empty by asking. */
export async function askMissing(answers: PackAnswers, ask: Ask, dir: string): Promise<PackAnswers> {
  const a = { ...answers };
  const q = withDefault(ask);
  a.display_name ||= await q('Name — what people see, e.g. Weather Agent');
  a.handle ||= await q('Short name — lowercase, no spaces', shortNameFrom(a.display_name));
  a.domain ||= await q('Domain — where it is published, e.g. example.com');
  a.description ||= await q('What it does — one sentence');
  a.version ||= await q('Version', packageVersion(dir) ?? '0.1.0');
  if (!a.endpoints?.length && !a.packages?.length) {await askWhere(a, ask);}
  if (!a.skills?.length) {a.skills = await askSkills(ask);}
  if (!a.example_requests?.length) {
    a.example_requests = await askList(ask, 'A question people ask it — search finds it by these (2-5)', 'Another (Enter to finish)', 5);
  }
  return a;
}

/** Answers → the .fafa text. Throws, naming the answer, when one is missing. */
export function fafaFromAnswers(answers: PackAnswers): string {
  if (!answers.skills?.length) {throw new Error('Missing answer: what it can do (at least one capability)');}
  return fafaYaml(answersToFafa(answers));
}

function complete(o: CardInitOptions): boolean {
  return Boolean(o.name && o.domain && o.description && o.setVersion && (o.url || o.package) && o.skill?.length);
}

/** A person at a terminal (or a test's `ask`), or nobody to ask. */
function asker(ask?: Ask): { ask?: Ask; close: () => void } {
  if (ask) {return { ask, close: () => {} };}
  if (!process.stdin.isTTY) {return { close: () => {} };}
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return { ask: (q) => new Promise((r) => rl.question(q, r)), close: () => rl.close() };
}

export async function cardInitCommand(options: CardInitOptions = {}, ask?: Ask): Promise<void> {
  const dir = resolve(options.dir ?? process.cwd());
  const out = resolve(dir, options.out ?? 'agent.fafa');

  if (existsSync(out) && !options.force) {
    console.error(`Error: ${out} already exists — edit it, or use --force to replace it.`);
    process.exit(2);
  }

  // Flags first; a person at a terminal is asked for the rest.
  const person = complete(options) ? { close: () => {} } : asker(ask);
  try {
    let answers = answersFromFlags(options);
    if (person.ask) {
      if (!ask) {console.log(`${fafCyan('card init')} ${dim('— seven answers, one agent.fafa')}\n`);}
      answers = await askMissing(answers, person.ask, dir);
    }

    let text: string;
    try {
      text = fafaFromAnswers(answers);
    } catch (e) {
      console.error(`Error: ${(e as Error).message}`);
      process.exit(2);
    }

    safeWriteFile(out, text, { root: dir });
    console.log(`${fafCyan('✓')} ${out}`);
    if ((answers.example_requests ?? []).length < 2) {
      console.error(`${dim('note')} add 2-5 questions people ask it (metadata.cards.examples) — search finds it by these.`);
    }

    // BETTER: the A2A card (if it names an A2A door), catalog and ARD, from this file alone. Offered.
    const better = betterTargets(readFafa(out));
    const named = better.map((t) => CARD_NAMES[t]).join(', ');
    if (person.ask) {
      const go = (await person.ask(`Write your ${named} now? ${dim('(Y/n)')} `)).trim().toLowerCase();
      if (go === '' || go.startsWith('y')) {
        cardsCommand({ dir, fafa: out, target: better.join(',') });
        return;
      }
    }
    console.log(dim(`  next: faf cards --target ${better.join(',')}`));
    if (!findFafFile(dir)) {
      console.log(dim('  BEST: add your project.faf (faf init) for the FAF context, MCP and registry cards.'));
    }
  } finally {
    person.close();
  }
}
