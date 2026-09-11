/**
 * Soul — local .fafm model (TS mirror of claude-fafm-sdk 1.0 Soul).
 * INTEROP: load/save fidelity, residual preserve, recall SoT.
 *
 * A soul loaded from a file keeps that file's text. `save` writes only what
 * changed since the load (or the last save) into it — through the YAML
 * Document, so comments, key order, quoting, the `version`, a missing
 * `profile`, a hand-kept `index` and every unknown key stay as they were.
 * Known keys faf does not model in the shape the file has them (a `facts` or
 * `index` written as a mapping, `sessions` as a mapping, …) are kept verbatim;
 * a change that would have to rewrite one is refused, with nothing written.
 */

import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { isMap as isYamlMap, stringify as stringifyYaml, type Document } from 'yaml';
import { readBytesIfPresent, readUtf8, resolveInside, safeWriteFile } from '../core/safe-write.js';
import { describeShape, isMapping } from '../core/shape.js';
import { applyChange, changeAt, editYaml, parseForEdit, sameJs, seqAt } from '../core/yaml-edit.js';
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

/** Plain words for a YAML value's shape, for load errors. */
function shapeOf(v: unknown): string {
  if (Array.isArray(v)) {return `a list (${v.length} item${v.length === 1 ? '' : 's'})`;}
  if (isNil(v)) {return 'empty';}
  if (typeof v === 'string') {return `a string (${JSON.stringify(v.length > 40 ? `${v.slice(0, 40)}…` : v)})`;}
  return `a ${typeof v}`;
}

const isMap = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** A soul file's real path and text. A soul.fafm link must stay inside its
 *  folder and end at a .faf/.fafm file (SafePathError otherwise) — never read
 *  ~/.aws/credentials as a soul — and the text must be UTF-8 (a soul that is
 *  not is refused, never re-encoded). */
function readSoulText(path: string): { real: string; text: string } {
  const full = resolve(path);
  const real = resolveInside(dirname(full), full, { read: true });
  return { real, text: readUtf8(real) };
}

/** Write `text` to `path` unless the file already holds exactly these bytes;
 *  returns the real path. `loaded` is the file a soul was loaded from and the
 *  text read: when this is that file, a text that is still `loaded.text` has
 *  nothing new to write (whatever is on disk now stays), and otherwise the
 *  file must still hold `loaded.text` — else it changed on disk after the
 *  load, and the write is refused (SafePathError `changed`) rather than
 *  written over the edit. Any other path — a soul made with no file, or a
 *  save to a file the soul was not loaded from — must have no file there
 *  (a file that appeared is refused the same way), unless `replace` asks to
 *  write over it. Link rules and the atomic write are safeWriteFile's. */
function writeUnlessSame(path: string, text: string, loaded: { real: string; text: string } | undefined, replace: boolean): string {
  const full = resolve(path);
  const target = resolveInside(dirname(full), full);
  if (loaded && loaded.real === target && loaded.text === text) {return target;}
  let now: Buffer | null | undefined;
  try {
    now = readBytesIfPresent(target);
  } catch {
    now = undefined; // unreadable: the write below says why
  }
  if (now && now.equals(Buffer.from(text, 'utf-8'))) {return target;}
  const expect = loaded && loaded.real === target ? loaded.text : replace ? now : null;
  return safeWriteFile(path, text, expect === undefined ? {} : { expect });
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

/** A complete Fact: a bare string, or a partial object (text only, say), is
 *  made whole with factFromObj; a complete Fact is kept as it is. */
function asFact(value: unknown): Fact {
  const f = value as Fact;
  const whole = isMap(value) && typeof f.text === 'string' && Array.isArray(f.tags) &&
    Array.isArray(f.links) && isMap(f.extra) && typeof f.priority === 'string';
  return whole ? f : factFromObj(value);
}

/** A list item that is a fact (a string, or a mapping with `text`), or null. */
function factFromItem(item: unknown): Fact | null {
  if (typeof item === 'string' || (isMap(item) && 'text' in item)) {return factFromObj(item);}
  return null;
}

/** Filters for {@link Soul.recall}. */
export interface RecallOptions {
  tags?: string[];
  type?: string;
  minPriority?: string;
  limit?: number | null;
}

/** Everything a soul models, as plain values — what the file held at load
 *  (or at the last save), compared with the soul's state at save. */
interface SoulState {
  top: Record<string, unknown>;
  index: string[];
  sessions: unknown[];
  preferences: Record<string, unknown>;
  custom: Record<string, unknown>;
  extra: Record<string, unknown>;
  memoryExtra: Record<string, unknown>;
  /** Item position in memory.facts → the fact as it was written there. */
  facts: Map<number, unknown>;
}

/** Where a loaded soul came from. */
interface Origin {
  path: string;
  /** The file's real path (links followed), when the text came from disk. */
  real?: string;
  text: string;
  base: SoulState;
  /** Known keys the file has in a shape faf does not model, and that shape
   *  (`memory.facts` → 'a mapping'). Kept verbatim. */
  residual: Map<string, string>;
}

const TOP_KEYS = ['profile', 'namepoint', 'created', 'last_etched', 'retention'] as const;

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
  private _version: string | undefined;
  /** The file the soul was loaded from or last saved to. Undefined while the
   *  soul was made with no file (in memory, not saved yet): its first save
   *  then refuses a file already at the path — one that appeared since the
   *  caller found none — unless `replace`. */
  private _origin: Origin | undefined;
  /** Each loaded fact's item position in the file's memory.facts. */
  private _factAt = new WeakMap<Fact, number>();
  /** The index was faf-derived when the soul was loaded (or made, or last
   *  saved) — the default save keeps it in step with the facts. */
  private _indexDerived = true;
  /** The index as it was then: an index changed in memory since is the
   *  caller's, and the default save leaves it as it is. */
  private _indexAtRecord: string[] = [];

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
    // Bare strings are facts too: made whole so recall and save see `text`.
    this._facts = opts.facts ? opts.facts.map(asFact) : [];
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
    // A new soul's index is faf's: none given, or exactly the one faf derives.
    this._indexDerived = opts.index === undefined || sameJs(this._index, this.derivedIndex());
    this._indexAtRecord = this._index.slice();
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

  /**
   * Load a soul. The root must be a mapping (anything else is refused). Known
   * keys in a shape faf does not model — `memory.facts` or `index` written as
   * a mapping, `memory.sessions` as a mapping, `memory.preferences` as a list,
   * `memory` itself as a list — load as empty and stay in the file verbatim;
   * so do list items in `memory.facts` that are not facts.
   */
  static load(path: string): Soul {
    if (!existsSync(path)) {
      throw new Error(`soul file not found: ${path}`);
    }
    const { real, text } = readSoulText(path);
    return Soul.fromText(text, path, real);
  }

  private static fromText(raw: string, path: string, real?: string): Soul {
    const doc: unknown = parseForEdit(raw, path).toJS();
    // Shape guard: a list or scalar root would be spread into index keys (or
    // dropped) and the next save would write that back. Refuse; change nothing.
    if (!isMap(doc)) {
      throw new Error(`soul is not a YAML mapping: ${path} is ${shapeOf(doc)}`);
    }
    const shape = new ShapeReader();
    const memory = shape.pick('memory', doc.memory, isMapping) ?? {};
    const soul = new Soul(String(doc.namepoint ?? path.replace(/.*\//, '').replace(/\.fafm$/, '')), {
      profile: String(doc.profile ?? 'voice'),
      retention: String(doc.retention ?? 'forever'),
      created: (doc.created as string) ?? null,
      ...shape.modelled(doc, memory),
    });
    (shape.pick('memory.facts', memory.facts, Array.isArray) ?? []).forEach((item, i) => {
      const fact = factFromItem(item);
      if (fact) {soul.adopt(fact, i);}
    });
    soul.last_etched = String(doc.last_etched ?? soul.created);
    soul._version = isNil(doc.version) ? undefined : String(doc.version);
    soul._origin = { path, real, text: raw, base: soul.state(), residual: shape.residual };
    soul.recordIndex();
    return soul;
  }

  /** Note whether the index is faf-derived now (at load, and after a save). */
  private recordIndex(): void {
    this._indexDerived = this.indexIsDerived();
    this._indexAtRecord = this._index.slice();
  }

  /** Take a fact read from item `i` of the file's memory.facts. */
  private adopt(fact: Fact, i: number): void {
    this._facts.push(fact);
    if (!isNil(fact.id)) {this._byId.set(fact.id, this._facts.length - 1);}
    this._factAt.set(fact, i);
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
      version: this._version ?? '1.1',
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

  /** The index faf derives from the facts (INTEROP §5 formula,
   *  `${id ?? '?'} — ${text[:width]}` per fact) — without changing the soul. */
  derivedIndex(width = 80): string[] {
    return this._facts.map((f) => `${f.id ?? '?'} — ${String(f.text).slice(0, width)}`);
  }

  /** True when the stored index is exactly the one faf derives from the facts
   *  (so faf wrote it, and may rewrite it). A hand-kept index is not. */
  indexIsDerived(width = 80): boolean {
    return !this._origin?.residual.has('index') && sameJs(this._index, this.derivedIndex(width));
  }

  rebuildIndex(width = 80): string[] {
    this._index = this.derivedIndex(width);
    // Rebuilt by faf: the default save keeps it in step from here on.
    this._indexDerived = true;
    this._indexAtRecord = this._index.slice();
    return this._index;
  }

  /**
   * Write the soul — atomically (a failure leaves the original as it was)
   * and never through a link that leaves the folder or dangles.
   *
   * A soul loaded from a file is written as that file's text with only what
   * changed since the load (or the last save) edited into it; a save that
   * changes nothing writes nothing.
   *
   * The index: `reindex: true` rebuilds it from the facts, `reindex: false`
   * keeps it as it is. Left out, the index is rebuilt only when it was
   * faf-derived — {@link indexIsDerived} when the soul was loaded or last
   * saved; a new soul counts as derived unless it was given an index of its
   * own — and has not been changed in memory since. A hand-kept index is
   * never touched.
   * Refused, with nothing written: a change to a known key the file holds in
   * a shape faf does not model (adding a fact to `memory.facts` written as a
   * mapping, say); a save over the file the soul was loaded from (or last
   * saved to) when that file changed on disk since — SafePathError `changed`,
   * so an edit made meanwhile is never written over; and a save of a soul
   * made with no file (or to a path it was not loaded from) when a file is
   * already there — the same `changed` refusal, so a soul.fafm that appeared
   * after the caller found none is kept. `replace: true` is the explicit
   * overwrite of such a file (`faf memory convert --force`).
   */
  save(path: string, opts: { reindex?: boolean; replace?: boolean } = {}): string {
    const reindex = opts.reindex ?? (this._indexDerived && sameJs(this._index, this._indexAtRecord));
    if (reindex) {this.rebuildIndex();}
    const replace = opts.replace === true;
    const origin = this._origin;
    if (!origin) {
      const text = this.toYaml();
      // Made with no file: nothing may be there now (unless replace).
      const real = writeUnlessSame(path, text, undefined, replace);
      this.settle(path, text, new Map(this._facts.map((f, i) => [f, i])), real);
      return path;
    }
    let positions = new Map<Fact, number>();
    const { text } = editYaml(origin.text, (doc) => {
      positions = this.applyTo(doc, origin, reindex);
    }, path);
    // Refused, with nothing written, if the file changed on disk since the load.
    const real = writeUnlessSame(path, text, origin.real === undefined ? undefined : { real: origin.real, text: origin.text }, replace);
    this.settle(path, text, positions, real);
    return path;
  }

  toFile(path: string, opts: { reindex?: boolean; replace?: boolean } = {}): string {
    return this.save(path, opts);
  }

  /** After a save: the written text (at `real`) is the new origin. */
  private settle(path: string, text: string, positions: Map<Fact, number>, real: string): void {
    this._factAt = new WeakMap();
    for (const [f, i] of positions) {this._factAt.set(f, i);}
    this._origin = { path, real, text, base: this.state(), residual: this._origin?.residual ?? new Map() };
    this.recordIndex();
  }

  /** The soul's modelled state as plain values. */
  private state(): SoulState {
    const facts = new Map<number, unknown>();
    for (const f of this._facts) {
      const at = this._factAt.get(f);
      if (at !== undefined) {facts.set(at, structuredClone(factToObj(f)));}
    }
    return {
      top: Object.fromEntries(TOP_KEYS.map((k) => [k, this[k]])),
      index: this._index.slice(),
      sessions: structuredClone(this._sessions),
      preferences: structuredClone(this._preferences),
      custom: structuredClone(this._custom),
      extra: structuredClone(this._extra),
      memoryExtra: structuredClone(this._memoryExtra),
      facts,
    };
  }

  /** Refuse a change that would rewrite a key kept verbatim. */
  private static refuse(origin: Origin, key: string, what: string): never {
    throw new Error(
      `${origin.path}: ${key} is ${origin.residual.get(key)} in the file, not the shape faf writes — ` +
        `faf keeps it as it is and will not ${what}. Nothing written.`,
    );
  }

  /** Edit the loaded Document with what changed since `origin.base`; returns
   *  each fact's item position in memory.facts afterwards. */
  private applyTo(doc: Document, origin: Origin, reindexed: boolean): Map<Fact, number> {
    const base = origin.base;
    const now = this.state();
    const name = origin.path;
    for (const key of TOP_KEYS) {
      if (base.top[key] !== now.top[key]) {doc.set(key, now.top[key]);}
    }
    if (!sameJs(base.index, now.index)) {
      if (origin.residual.has('index') && !reindexed) {Soul.refuse(origin, 'index', 'replace it');}
      changeAt(doc, ['index'], origin.residual.has('index') ? undefined : base.index, now.index, name);
    }
    for (const key of unionKeys(base.extra, now.extra)) {
      changeAt(doc, [key], base.extra[key], now.extra[key], name);
    }
    this.applyMemory(doc, origin, base, now);
    return this.applyFacts(doc, origin);
  }

  private applyMemory(doc: Document, origin: Origin, base: SoulState, now: SoulState): void {
    const parts: Array<[string, unknown, unknown]> = [
      ['sessions', base.sessions, now.sessions],
      ['preferences', base.preferences, now.preferences],
      ['custom', base.custom, now.custom],
      ...unionKeys(base.memoryExtra, now.memoryExtra).map(
        (k): [string, unknown, unknown] => [k, base.memoryExtra[k], now.memoryExtra[k]],
      ),
    ];
    for (const [key, before, after] of parts) {
      if (sameJs(before, after)) {continue;}
      if (origin.residual.has('memory')) {Soul.refuse(origin, 'memory', `change memory.${key}`);}
      if (origin.residual.has(`memory.${key}`)) {Soul.refuse(origin, `memory.${key}`, 'replace it');}
      changeAt(doc, ['memory', key], before, after, origin.path);
    }
  }

  /** Which facts are still at their place in the file, and which are new.
   *  Kept facts must be in the file's order, new ones after them. */
  private sortFacts(origin: Origin): { kept: Array<[Fact, number]>; added: Fact[] } {
    const kept: Array<[Fact, number]> = [];
    const added: Fact[] = [];
    for (const f of this._facts) {
      const at = this._factAt.get(f);
      if (at === undefined) {
        added.push(f);
        continue;
      }
      if (added.length > 0 || (kept.length > 0 && at <= kept[kept.length - 1][1])) {
        throw new Error(`${origin.path}: the facts were reordered — faf keeps the order soul.fafm has. Nothing written.`);
      }
      kept.push([f, at]);
    }
    return { kept, added };
  }

  /** Facts: changed facts are edited where they are (only the fields that
   *  changed), deleted ones removed, new ones appended. List items that are
   *  not facts are never touched. */
  private applyFacts(doc: Document, origin: Origin): Map<Fact, number> {
    const { kept, added } = this.sortFacts(origin);
    const keptAt = new Set(kept.map(([, at]) => at));
    const gone = [...origin.base.facts.keys()].filter((at) => !keptAt.has(at)).sort((a, b) => b - a);
    const changed = kept.filter(([f, at]) => !sameJs(origin.base.facts.get(at), factToObj(f)));
    const positions = new Map<Fact, number>(kept);
    if (added.length === 0 && gone.length === 0 && changed.length === 0) {return positions;}
    for (const key of ['memory', 'memory.facts']) {
      if (origin.residual.has(key)) {Soul.refuse(origin, key, 'add facts to it');}
    }
    const seq = seqAt(doc, ['memory', 'facts'], origin.path);
    for (const [f, at] of changed) {
      seq.items[at] = editFact(doc, seq.items[at], origin.base.facts.get(at), factToObj(f));
    }
    for (const at of gone) {seq.items.splice(at, 1);}
    for (const [f, at] of kept) {positions.set(f, at - gone.filter((g) => g < at).length);}
    for (const f of added) {
      positions.set(f, seq.items.length);
      seq.items.push(doc.createNode(factToObj(f)));
    }
    return positions;
  }

  /** Insert or overwrite a Fact by id, preserving every field it carries (its
   *  timestamp included) — the INTEROP merge primitive: on an existing id the
   *  whole Fact is replaced. `etch` merges instead. */
  add(fact: Fact): Fact {
    const whole = asFact(fact);
    if (!isNil(whole.id) && this._byId.has(whole.id)) {
      const idx = this._byId.get(whole.id);
      if (idx !== undefined) {
        const at = this._factAt.get(this._facts[idx]);
        this._facts[idx] = whole;
        if (at !== undefined) {this._factAt.set(whole, at);}
      }
    } else {
      this._facts.push(whole);
      if (!isNil(whole.id)) {this._byId.set(whole.id, this._facts.length - 1);}
    }
    if (whole.timestamp && whole.timestamp > (this.last_etched || '')) {
      this.last_etched = whole.timestamp;
    }
    return whole;
  }

  /**
   * Write a fact. With an `id` that is already in the soul, the fact is
   * updated in place: the text and timestamp are new, and of the other fields
   * only those passed here change — links, source, tags, type, priority and
   * any extra fields the fact carries are kept (a priority is never lowered
   * unless one is passed). Otherwise the fact is appended.
   */
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
    const existing = isNil(opts.id) ? null : this.getFact(opts.id);
    if (existing) {return this.add(mergeFact(existing, text, opts));}
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

  /**
   * Deterministic recall (INTEROP §6). Call it as `recall(query, filters)` or
   * `recall({ query, ...filters })`. Bare-string facts are facts: their text
   * is matched and returned like any other.
   */
  recall(
    query?: string | null | (RecallOptions & { query?: string | null }),
    opts: RecallOptions = {},
  ): Fact[] {
    const filters: RecallOptions = isMap(query) ? { ...query, ...opts } : opts;
    const text = isMap(query) ? query.query : query;
    const floor = PRIORITY_RANK[canonicalPriority(filters.minPriority ?? 'ephemeral')] ?? 0;
    const q = typeof text === 'string' ? text.toLowerCase() : '';
    const wantTags = new Set(filters.tags ?? []);
    const indexed: Array<[number, Fact]> = [];
    this._facts.forEach((f, i) => {
      if (q && !String(f.text ?? '').toLowerCase().includes(q)) {return;}
      if (wantTags.size > 0 && ![...wantTags].some((t) => (f.tags ?? []).includes(t))) {return;}
      if (!isNil(filters.type) && f.type !== filters.type) {return;}
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
    if (!isNil(filters.limit)) {return results.slice(0, filters.limit);}
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

/** `existing` with a new text and timestamp, and only the fields passed in
 *  `opts` replaced; a priority is never lowered unless one is passed. */
function mergeFact(
  existing: Fact,
  text: string,
  opts: { type?: string; priority?: string; tags?: string[]; links?: string[]; source?: string },
): Fact {
  const or = <T>(passed: T | undefined, kept: T): T => (isNil(passed) ? kept : passed);
  return {
    ...existing,
    text,
    type: or(opts.type, existing.type),
    priority: isNil(opts.priority) ? existing.priority : canonicalPriority(opts.priority),
    tags: or(opts.tags, existing.tags).slice(),
    links: or(opts.links, existing.links).slice(),
    source: or(opts.source, existing.source),
    timestamp: utcNow(),
    extra: { ...existing.extra },
  };
}

/** Reads known keys, keeping those in a shape faf does not model as residual. */
class ShapeReader {
  readonly residual = new Map<string, string>();

  /** `value` when it fits; undefined (and noted as residual) when it does not. */
  pick<T>(key: string, value: unknown, fits: (v: unknown) => v is T): T | undefined {
    if (isNil(value)) {return undefined;}
    if (fits(value)) {return value;}
    this.residual.set(key, describeShape(value));
    return undefined;
  }

  /** The Soul constructor options for the index, memory subtrees and unknown keys. */
  modelled(doc: Record<string, unknown>, memory: Record<string, unknown>): {
    index: string[];
    sessions: unknown[];
    preferences: Record<string, unknown>;
    custom: Record<string, unknown>;
    extra: Record<string, unknown>;
    memoryExtra: Record<string, unknown>;
  } {
    return {
      index: (this.pick('index', doc.index, Array.isArray) ?? []).map(String),
      sessions: this.pick('memory.sessions', memory.sessions, Array.isArray) ?? [],
      preferences: structuredClone(this.pick('memory.preferences', memory.preferences, isMapping) ?? {}),
      custom: structuredClone(this.pick('memory.custom', memory.custom, isMapping) ?? {}),
      extra: residualKeys(doc, KNOWN_DOC_KEYS),
      memoryExtra: residualKeys(memory, KNOWN_MEMORY_KEYS),
    };
  }
}

/** Keys of `obj` outside `known`, deep-copied — the residual a soul carries. */
function residualKeys(obj: Record<string, unknown>, known: ReadonlySet<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!known.has(k)) {out[k] = structuredClone(v);}
  }
  return out;
}

function unionKeys(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])];
}

/** Edit one fact item where it is: only the fields that changed. A bare-string
 *  item that gains fields becomes a mapping; a mapping item stays one. */
function editFact(doc: Document, node: unknown, before: unknown, after: unknown): unknown {
  if (!isYamlMap(node)) {return applyChange(doc, node, before, after);}
  const asMap = (v: unknown): unknown => (typeof v === 'string' ? { text: v } : v);
  return applyChange(doc, node, asMap(before), asMap(after));
}
