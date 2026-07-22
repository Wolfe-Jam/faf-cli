/**
 * Soul — local .fafm model (TS mirror of claude-fafm-sdk 1.0 Soul).
 * INTEROP: load/save fidelity, residual preserve, recall SoT.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import {
  KNOWN_DOC_KEYS,
  KNOWN_MEMORY_KEYS,
  LEGACY_PRIORITY,
  PRIORITY_RANK,
  type Fact,
  type SoulDoc,
} from './types.js';

export function utcNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function isNil(v: unknown): v is null | undefined {
  return v === null || v === undefined;
}

export function canonicalPriority(p: string | null | undefined): string {
  if (isNil(p)) {return 'standard';}
  if (LEGACY_PRIORITY[p]) {return LEGACY_PRIORITY[p];}
  if (p in PRIORITY_RANK) {return p;}
  return 'standard';
}

const KNOWN_FACT = new Set([
  'text',
  'id',
  'type',
  'priority',
  'tags',
  'links',
  'timestamp',
  'source',
]);

export function factFromObj(obj: unknown): Fact {
  if (typeof obj === 'string') {
    return {
      text: obj,
      id: null,
      type: null,
      priority: 'standard',
      tags: [],
      links: [],
      timestamp: null,
      source: null,
      extra: {},
    };
  }
  if (!obj || typeof obj !== 'object' || !('text' in obj)) {
    throw new Error(`fact must be a string or a mapping with 'text': ${JSON.stringify(obj)}`);
  }
  const o = obj as Record<string, unknown>;
  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (!KNOWN_FACT.has(k)) {extra[k] = v;}
  }
  return {
    text: String(o.text),
    id: (o.id as string) ?? null,
    type: (o.type as string) ?? null,
    priority: canonicalPriority(o.priority as string | undefined),
    tags: Array.isArray(o.tags) ? (o.tags as string[]).slice() : [],
    links: Array.isArray(o.links) ? (o.links as string[]).slice() : [],
    timestamp: (o.timestamp as string) ?? null,
    source: (o.source as string) ?? null,
    extra,
  };
}

export function factToObj(f: Fact): unknown {
  const bare =
    isNil(f.id) &&
    isNil(f.type) &&
    f.tags.length === 0 &&
    f.links.length === 0 &&
    isNil(f.timestamp) &&
    isNil(f.source) &&
    Object.keys(f.extra).length === 0 &&
    f.priority === 'standard';
  if (bare) {return f.text;}
  const out: Record<string, unknown> = { text: f.text };
  if (!isNil(f.id)) {out.id = f.id;}
  if (!isNil(f.type)) {out.type = f.type;}
  out.priority = f.priority;
  if (f.tags.length) {out.tags = f.tags;}
  if (f.links.length) {out.links = f.links;}
  if (!isNil(f.timestamp)) {out.timestamp = f.timestamp;}
  if (!isNil(f.source)) {out.source = f.source;}
  Object.assign(out, f.extra);
  return out;
}

export class Soul {
  namepoint: string;
  profile: string;
  retention: string;
  created: string;
  last_etched: string;
  private _facts: Fact[];
  private _byId: Map<string, number>;
  private _index: string[];
  private _sessions: unknown[];
  private _preferences: Record<string, unknown>;
  private _custom: Record<string, unknown>;
  private _extra: Record<string, unknown>;
  private _memoryExtra: Record<string, unknown>;

  constructor(
    namepoint: string,
    opts: {
      profile?: string;
      facts?: Fact[];
      retention?: string;
      created?: string | null;
      index?: string[];
      sessions?: unknown[];
      preferences?: Record<string, unknown>;
      custom?: Record<string, unknown>;
      extra?: Record<string, unknown>;
      memoryExtra?: Record<string, unknown>;
    } = {},
  ) {
    this.namepoint = namepoint;
    this.profile = opts.profile ?? 'knowledge';
    this.retention = opts.retention ?? 'forever';
    this.created = opts.created ?? utcNow();
    this.last_etched = this.created;
    this._facts = opts.facts ? opts.facts.slice() : [];
    this._byId = new Map();
    this._facts.forEach((f, i) => {
      if (!isNil(f.id)) {this._byId.set(f.id, i);}
    });
    this._index = opts.index ? opts.index.slice() : [];
    this._sessions = opts.sessions ? structuredClone(opts.sessions) : [];
    this._preferences = opts.preferences ? { ...opts.preferences } : {};
    this._custom = opts.custom ? { ...opts.custom } : {};
    this._extra = opts.extra ? { ...opts.extra } : {};
    this._memoryExtra = opts.memoryExtra ? { ...opts.memoryExtra } : {};
  }

  get facts(): Fact[] {
    return this._facts;
  }

  get index(): string[] {
    return this._index;
  }

  get sessions(): unknown[] {
    return this._sessions;
  }

  get preferences(): Record<string, unknown> {
    return this._preferences;
  }

  get custom(): Record<string, unknown> {
    return this._custom;
  }

  get extra(): Record<string, unknown> {
    return this._extra;
  }

  get memoryExtra(): Record<string, unknown> {
    return this._memoryExtra;
  }

  static load(path: string): Soul {
    if (!existsSync(path)) {
      throw new Error(`soul file not found: ${path}`);
    }
    const raw = readFileSync(path, 'utf-8');
    const doc = parseYaml(raw) as Record<string, unknown> | null;
    if (!doc || typeof doc !== 'object') {
      throw new Error('soul is not a YAML mapping');
    }
    const memory =
      doc.memory && typeof doc.memory === 'object'
        ? (doc.memory as Record<string, unknown>)
        : {};
    const factsRaw = Array.isArray(memory.facts) ? memory.facts : [];
    const docExtra: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc)) {
      if (!KNOWN_DOC_KEYS.has(k)) {docExtra[k] = structuredClone(v);}
    }
    const memoryExtra: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(memory)) {
      if (!KNOWN_MEMORY_KEYS.has(k)) {memoryExtra[k] = structuredClone(v);}
    }
    const soul = new Soul(String(doc.namepoint ?? path.replace(/.*\//, '').replace(/\.fafm$/, '')), {
      profile: String(doc.profile ?? 'voice'),
      facts: factsRaw.map(factFromObj),
      retention: String(doc.retention ?? 'forever'),
      created: (doc.created as string) ?? null,
      index: Array.isArray(doc.index) ? (doc.index as string[]).slice() : [],
      sessions: Array.isArray(memory.sessions) ? structuredClone(memory.sessions) : [],
      preferences:
        memory.preferences && typeof memory.preferences === 'object'
          ? structuredClone(memory.preferences as Record<string, unknown>)
          : {},
      custom:
        memory.custom && typeof memory.custom === 'object'
          ? structuredClone(memory.custom as Record<string, unknown>)
          : {},
      extra: docExtra,
      memoryExtra,
    });
    soul.last_etched = String(doc.last_etched ?? soul.created);
    return soul;
  }

  static fromFile(path: string): Soul {
    return Soul.load(path);
  }

  toDoc(): SoulDoc {
    const memory: SoulDoc['memory'] = {
      facts: this._facts.map(factToObj),
      sessions: structuredClone(this._sessions),
      preferences: structuredClone(this._preferences),
      custom: structuredClone(this._custom),
    };
    for (const [k, v] of Object.entries(this._memoryExtra)) {
      if (!KNOWN_MEMORY_KEYS.has(k)) {memory[k] = structuredClone(v);}
    }
    const doc: SoulDoc = {
      version: '1.1',
      profile: this.profile,
      namepoint: this.namepoint,
      created: this.created,
      last_etched: this.last_etched,
      retention: this.retention,
      index: this._index.slice(),
      memory,
    };
    for (const [k, v] of Object.entries(this._extra)) {
      if (!KNOWN_DOC_KEYS.has(k)) {doc[k] = structuredClone(v);}
    }
    return doc;
  }

  toYaml(): string {
    return stringifyYaml(this.toDoc(), { lineWidth: 100 });
  }

  rebuildIndex(width = 80): string[] {
    this._index = this._facts.map(
      (f) => `${f.id ?? '?'} — ${f.text.slice(0, width)}`,
    );
    return this._index;
  }

  save(path: string, opts: { reindex?: boolean } = {}): string {
    const reindex = opts.reindex !== false;
    if (reindex) {this.rebuildIndex();}
    writeFileSync(path, this.toYaml(), 'utf-8');
    return path;
  }

  toFile(path: string, opts: { reindex?: boolean } = {}): string {
    return this.save(path, opts);
  }

  add(fact: Fact): Fact {
    if (!isNil(fact.id) && this._byId.has(fact.id)) {
      const idx = this._byId.get(fact.id);
      if (idx !== undefined) {
        this._facts[idx] = fact;
      }
    } else {
      this._facts.push(fact);
      if (!isNil(fact.id)) {this._byId.set(fact.id, this._facts.length - 1);}
    }
    if (fact.timestamp && fact.timestamp > (this.last_etched || '')) {
      this.last_etched = fact.timestamp;
    }
    return fact;
  }

  etch(
    text: string,
    opts: {
      id?: string;
      type?: string;
      priority?: string;
      tags?: string[];
      links?: string[];
      source?: string;
    } = {},
  ): Fact {
    return this.add({
      text,
      id: opts.id ?? null,
      type: opts.type ?? null,
      priority: canonicalPriority(opts.priority),
      tags: opts.tags ? opts.tags.slice() : [],
      links: opts.links ? opts.links.slice() : [],
      timestamp: utcNow(),
      source: opts.source ?? null,
      extra: {},
    });
  }

  recall(
    query?: string | null,
    opts: {
      tags?: string[];
      type?: string;
      minPriority?: string;
      limit?: number | null;
    } = {},
  ): Fact[] {
    const floor = PRIORITY_RANK[canonicalPriority(opts.minPriority ?? 'ephemeral')] ?? 0;
    const q = (query ?? '').toLowerCase();
    const wantTags = new Set(opts.tags ?? []);
    const indexed: Array<[number, Fact]> = [];
    this._facts.forEach((f, i) => {
      if (q && !f.text.toLowerCase().includes(q)) {return;}
      if (wantTags.size > 0 && ![...wantTags].some((t) => f.tags.includes(t))) {return;}
      if (!isNil(opts.type) && f.type !== opts.type) {return;}
      if ((PRIORITY_RANK[f.priority] ?? 1) < floor) {return;}
      indexed.push([i, f]);
    });
    indexed.sort((a, b) => {
      const pa = PRIORITY_RANK[a[1].priority] ?? 1;
      const pb = PRIORITY_RANK[b[1].priority] ?? 1;
      if (pb !== pa) {return pb - pa;}
      const ta = a[1].timestamp ?? '';
      const tb = b[1].timestamp ?? '';
      if (tb !== ta) {return tb < ta ? -1 : tb > ta ? 1 : 0;}
      return b[0] - a[0]; // insertion index desc
    });
    const results = indexed.map(([, f]) => f);
    if (!isNil(opts.limit)) {return results.slice(0, opts.limit);}
    return results;
  }

  getFact(id: string): Fact | null {
    const i = this._byId.get(id);
    return i === undefined ? null : this._facts[i];
  }

  deleteFact(id: string): boolean {
    const i = this._byId.get(id);
    if (i === undefined) {return false;}
    this._facts.splice(i, 1);
    this._byId.clear();
    this._facts.forEach((f, j) => {
      if (!isNil(f.id)) {this._byId.set(f.id, j);}
    });
    return true;
  }
}
