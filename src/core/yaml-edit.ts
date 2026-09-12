/**
 * Document-preserving YAML edits — how faf changes a .faf or .fafm that is
 * already on disk.
 *
 * The file is parsed with yaml's `parseDocument`, the change is made on the
 * Document through its node APIs (`set` / `setIn` / `delete`), and only the
 * text of the nodes that changed is rewritten. Every other byte stays as it
 * was: comments, blank lines, key order, quoting, scalar source text (`1.10`,
 * `0x1F90`, a 20-digit integer), anchors and aliases, unknown keys, CRLF line
 * ends and a BOM.
 *
 * Safety net: the spliced text is parsed again and must hold the same data as
 * the changed Document and serialise the same way (comments, styles, anchors;
 * blank lines aside). If it does not (a shape the splicer does not handle),
 * faf writes the Document's own serialisation instead — `toString({
 * lineWidth: 0 })`, which still keeps comments, anchors, unknown keys and the
 * source text of every number it did not change. A change that leaves the
 * data as it was returns the original text untouched — even when that
 * serialisation would differ — so callers skip the write.
 */

import {
  Document,
  YAMLMap,
  type Alias,
  YAMLSeq,
  isAlias,
  isCollection,
  isMap,
  isNode,
  isScalar,
  isSeq,
  parseDocument,
  type DocumentOptions,
  type Node,
  type Pair,
  type ParseOptions,
  type Scalar,
  type ScalarTag,
  type SchemaOptions,
  type Tags,
  type ToStringOptions,
} from 'yaml';
import { isMapping } from './shape.js';

type YamlOptions = ParseOptions & DocumentOptions & SchemaOptions;

/** The result of {@link editYaml}. */
export interface YamlEditResult {
  /** The new text — the original text when nothing changed. */
  text: string;
  /** False when the change left the document as it was. */
  changed: boolean;
}

// ─── Scalar source text ──────────────────────────────────────────────────────

const NUMBER_TAGS = new Set(['tag:yaml.org,2002:int', 'tag:yaml.org,2002:float']);

function isScalarTag(tag: Tags[number]): tag is ScalarTag {
  return typeof tag === 'object' && tag.collection === undefined;
}

/** The number as it was written (`0x1F90`, `12345678901234567890`, `1e3`),
 *  when the node still holds the value that text parses to. */
function writtenNumber(node: Scalar, tags: readonly ScalarTag[]): string | undefined {
  const src = node.source;
  if (typeof src !== 'string' || src.includes('\n') || typeof node.value !== 'number') {return undefined;}
  const tag = tags.find(t => t.default === true && t.test?.test(src));
  if (!tag || !NUMBER_TAGS.has(tag.tag)) {return undefined;}
  let parsed: unknown;
  try {
    parsed = tag.resolve(src, () => undefined, {});
  } catch {
    return undefined;
  }
  return Object.is(isScalar(parsed) ? parsed.value : parsed, node.value) ? src : undefined;
}

/** The core schema with number tags that re-emit an unchanged number's own
 *  text (yaml would print `0x1F90` as `0x1f90` and round a 20-digit integer). */
function keepNumberText(tags: Tags): Tags {
  const scalars = tags.filter(isScalarTag);
  return tags.map(tag => {
    if (!isScalarTag(tag) || !NUMBER_TAGS.has(tag.tag) || !tag.stringify) {return tag;}
    const inner = tag.stringify;
    return {
      ...tag,
      stringify: (item, ctx, onComment, onChompKeep) =>
        writtenNumber(item, scalars) ?? inner(item, ctx, onComment, onChompKeep),
    };
  });
}

/** Parse options for every document faf edits. */
export const EDIT_OPTIONS: YamlOptions = { keepSourceTokens: true, customTags: keepNumberText };

/** What one `key:` line and the line under it say about the file's
 *  indentation: a key step, or whether lists under keys are indented. */
function indentHint(line: string, next: string): { indent?: number; indentSeq?: boolean } {
  const parent = /^( *)[^\s#-][^#]*?:[ \t]*(?:#.*)?$/.exec(line);
  const child = /^( *)(\S)/.exec(next);
  if (!parent || !child || child[2] === '#') {return {};}
  const step = child[1].length - parent[1].length;
  if (child[2] === '-') {return step >= 0 ? { indentSeq: step > 0 } : {};}
  return step >= 1 && step <= 8 ? { indent: step } : {};
}

/** How the file indents: the step under a `key:` line (default 2), and whether
 *  a list under a key is indented (`key:\n  - a`, the default) or not. */
function styleOf(src: string): { indent: number; indentSeq: boolean } {
  const lines = src.split(/\r?\n/);
  let indent: number | undefined;
  let indentSeq: boolean | undefined;
  for (let i = 0; i + 1 < lines.length; i++) {
    const hint = indentHint(lines[i], lines[i + 1]);
    indent ??= hint.indent;
    indentSeq ??= hint.indentSeq;
  }
  return { indent: indent ?? 2, indentSeq: indentSeq ?? true };
}

/** Parse `src` for editing; a file that is not valid YAML is refused (an
 *  Error whose `cause` is yaml's YAMLParseError, with its line). */
export function parseForEdit(src: string, name: string): Document {
  const doc = parseDocument(src, EDIT_OPTIONS);
  if (doc.errors.length > 0) {
    const why = doc.errors[0].message.split('\n')[0];
    throw new Error(`${name}: not valid YAML (${why}) — faf left it unchanged.`, { cause: doc.errors[0] });
  }
  return doc;
}

// ─── Splicing ────────────────────────────────────────────────────────────────

interface Edit {
  start: number;
  end: number;
  text: string;
  seq: number;
}

interface Ctx {
  src: string;
  eol: string;
  edits: Edit[];
  piece: ToStringOptions;
}

type Slot =
  | { kind: 'value'; key: unknown; col: number }
  | { kind: 'item'; col: number }
  | { kind: 'root' };

function push(ctx: Ctx, start: number, end: number, text: string): void {
  ctx.edits.push({ start, end, text, seq: ctx.edits.length });
}

function lineStart(src: string, pos: number): number {
  return src.lastIndexOf('\n', pos - 1) + 1;
}

/** The end of the line `pos` is on, after its line break (or the end of text).
 *  `pos` already at the start of a line is returned as is. */
function lineEnd(src: string, pos: number): number {
  if (pos > 0 && src[pos - 1] === '\n') {return pos;}
  const nl = src.indexOf('\n', pos);
  return nl < 0 ? src.length : nl + 1;
}

/** `pos` without the line break that ends just before it. */
function beforeBreak(src: string, pos: number): number {
  let q = pos;
  if (src[q - 1] === '\n') {
    q--;
    if (src[q - 1] === '\r') {q--;}
  }
  return q;
}

/** Neither null nor undefined. */
function present<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}

function rangeOf(node: unknown): [number, number, number] | undefined {
  const r = isNode(node) ? (node as Node).range : undefined;
  return r ? [r[0], r[1], r[2]] : undefined;
}

/** A node `b` in the changed Document is the node `a` of the original when it
 *  is a clone of it: same class, same source range. New nodes have no range. */
function sameOrigin(a: unknown, b: unknown): boolean {
  const ra = rangeOf(a);
  const rb = rangeOf(b);
  return !!ra && !!rb && ra[0] === rb[0] && ra[1] === rb[1] && ra[2] === rb[2] &&
    (a as object).constructor === (b as object).constructor;
}

function isBlockNode(node: unknown): boolean {
  if (isScalar(node)) {return node.type === 'BLOCK_LITERAL' || node.type === 'BLOCK_FOLDED';}
  return isCollection(node) && !node.flow;
}

interface Trivia {
  comment?: string | null;
  commentBefore?: string | null;
  spaceBefore?: boolean;
  anchor?: string;
  tag?: string;
}

function sameTrivia(a: Trivia, b: Trivia): boolean {
  return a.anchor === b.anchor && a.tag === b.tag && a.comment === b.comment &&
    a.commentBefore === b.commentBefore && !!a.spaceBefore === !!b.spaceBefore;
}

function sameScalar(a: Scalar, b: Scalar): boolean {
  return Object.is(a.value, b.value) && a.type === b.type && a.format === b.format &&
    a.minFractionDigits === b.minFractionDigits && sameTrivia(a, b);
}

/** Render `node` inside a one-item container and return what follows the
 *  container's own prefix (`k:` or `-`). Continuation lines are shifted to
 *  column `col`. `inline` is true for a single line that follows the prefix
 *  after one space. */
function render(ctx: Ctx, build: (doc: Document) => YAMLMap | YAMLSeq, prefix: number, col: number): { inline: boolean; text: string } {
  const doc = new Document(undefined, EDIT_OPTIONS);
  doc.contents = build(doc);
  const out = doc.toString(ctx.piece).replace(/\n+$/, '');
  const rest = out.slice(prefix);
  const inline = rest.startsWith(' ') && !rest.includes('\n');
  const pad = ' '.repeat(col);
  const text = rest.replace(/\n(?=.)/g, `\n${pad}`).replace(/\n/g, ctx.eol);
  return { inline, text: inline ? rest.slice(1) : text };
}

/** `value` as the value of a pair whose key sits at column `col`. */
function renderValue(ctx: Ctx, value: unknown, col: number): { inline: boolean; text: string } {
  return render(ctx, doc => {
    const map = new YAMLMap();
    map.items.push(doc.createPair('k', value));
    return map;
  }, 2, col);
}

/** `value` as a list item whose `-` sits at column `col` (the text after `- `). */
function renderItem(ctx: Ctx, value: unknown, col: number): { inline: boolean; text: string } | null {
  const piece = render(ctx, () => {
    const seq = new YAMLSeq();
    seq.items.push(value);
    return seq;
  }, 1, col);
  if (piece.inline) {return piece;}
  return piece.text.startsWith(' ') ? { inline: false, text: piece.text.slice(1) } : null;
}

/** A copy of a node without its trailing comment, for rendering its value alone. */
function valueOnly(node: unknown): unknown {
  if (!isNode(node) || !present((node as Trivia).comment)) {return node;}
  const copy = node.clone() as Node & Trivia;
  copy.comment = undefined;
  return copy;
}

/** `b` without the anchor and tag it shares with `a`. A node's range starts
 *  at its value — `&g` and `!!str` sit in front of it and stay in the text —
 *  so the new value is rendered without them, and only the value text inside
 *  the range changes (`goal: &g Old` → `goal: &g New`, not `&g &g New`). */
function withoutSharedProps(a: unknown, b: unknown): unknown {
  if (!isNode(a) || !isNode(b)) {return b;}
  const ta = a as Trivia;
  const tb = b as Trivia;
  if ((!ta.anchor && !ta.tag) || ta.anchor !== tb.anchor || ta.tag !== tb.tag) {return b;}
  const copy = b.clone() as Node & Trivia;
  copy.anchor = undefined;
  copy.tag = undefined;
  return copy;
}

/** Just after the `:` that follows `key`, or -1. */
function afterColon(src: string, key: unknown): number {
  const r = rangeOf(key);
  if (!r) {return -1;}
  let i = r[2];
  while (src[i] === ' ' || src[i] === '\t') {i++;}
  return src[i] === ':' ? i + 1 : -1;
}

/** Text for an empty value (`key:` with nothing after it) that gains one. */
function fillEmpty(src: string, at: number, text: string): string {
  const lead = src[at - 1] === ' ' || src[at - 1] === '\t' ? '' : ' ';
  const tail = src[at] === '#' ? ' ' : '';
  return `${lead}${text}${tail}`;
}

/** How a replaced node's old text ends, and what its new text looks like. */
interface Replacement {
  range: [number, number, number];
  /** The old node's trailing comment stays where it is. */
  keepTail: boolean;
  /** The new node's own trailing comment (rendered in `piece` when the tail goes). */
  newComment: string | null | undefined;
  piece: { inline: boolean; text: string };
}

/** How `a` is replaced by `b`. `fromColon`: the new text starts right after
 *  the key's colon, over the node's anchor and tag too, so they are rendered
 *  with it; otherwise the new text starts at the node's range, after them. */
function planReplace(ctx: Ctx, a: unknown, b: unknown, slot: Slot, fromColon = false): Replacement | null {
  const range = rangeOf(a);
  if (!range || slot.kind === 'root') {return null;}
  const oldComment = (a as Trivia).comment;
  const newComment = isNode(b) ? (b as Trivia).comment : undefined;
  const keepTail = !present(oldComment) || oldComment === newComment;
  const valueText = keepTail ? valueOnly(b) : b;
  const shown = fromColon ? valueText : withoutSharedProps(a, valueText);
  const piece = slot.kind === 'value' ? renderValue(ctx, shown, slot.col) : renderItem(ctx, shown, slot.col);
  return piece ? { range, keepTail, newComment, piece } : null;
}

/** Where the old node's text ends: before its trailing comment when that
 *  stays, after it when the comment goes with the node. */
function replaceEnd(src: string, a: unknown, r: [number, number, number], keepTail: boolean): number {
  if (!keepTail) {return beforeBreak(src, lineEnd(src, r[2]));}
  return isBlockNode(a) ? beforeBreak(src, r[1]) : r[1];
}

/** Replace the node `a` (a pair's value, or a list item) with `b`; `addComment`
 *  is a line comment the unchanged-style scalar gains. */
function replace(ctx: Ctx, a: unknown, b: unknown, slot: Slot, addComment?: string): boolean {
  const inRange = planReplace(ctx, a, b, slot);
  if (!inRange) {return false;}
  const end = replaceEnd(ctx.src, a, inRange.range, inRange.keepTail);
  if (inRange.piece.inline && (!isBlockNode(a) || slot.kind === 'item')) {
    replaceInline(ctx, inRange, end, slot, addComment);
    return true;
  }
  // A multi-line value (or a block node replaced): no comment can be carried.
  const tailComment = inRange.keepTail ? (a as Trivia).comment : inRange.newComment;
  if (addComment !== undefined || present(tailComment)) {return false;}
  // A pair's value is rewritten from its key's colon, anchor and tag included.
  const plan = slot.kind === 'value' ? planReplace(ctx, a, b, slot, true) : inRange;
  return plan !== null && replaceBlock(ctx, plan.range[0], end, plan.piece, slot);
}

/** One line in, one line out: the new value takes the old value's place. */
function replaceInline(ctx: Ctx, plan: Replacement, end: number, slot: Slot, addComment?: string): void {
  const [start, valueEnd] = plan.range;
  const empty = start === valueEnd && slot.kind === 'value';
  const text = empty ? fillEmpty(ctx.src, start, plan.piece.text) : plan.piece.text;
  push(ctx, start, end, text + (addComment === undefined ? '' : ` #${addComment}`));
}

function replaceBlock(ctx: Ctx, start: number, end: number, piece: { inline: boolean; text: string }, slot: Slot): boolean {
  if (slot.kind === 'item') {
    push(ctx, start, end, piece.text);
    return true;
  }
  if (slot.kind !== 'value') {return false;}
  const colon = afterColon(ctx.src, slot.key);
  if (colon < 0) {return false;}
  push(ctx, colon, end, piece.inline ? ` ${piece.text}` : piece.text);
  return true;
}

/** Same anchor, tag, leading comment and blank line (the trailing comment aside). */
function sameLead(a: Trivia, b: Trivia): boolean {
  return sameTrivia({ ...a, comment: undefined }, { ...b, comment: undefined });
}

/** The line comment a scalar gains (it had none, the change gives it one). */
function gainedComment(a: Scalar, b: Scalar): string | undefined {
  if (present(a.comment) || typeof b.comment !== 'string') {return undefined;}
  return b.comment.includes('\n') ? undefined : b.comment;
}

function diffScalar(ctx: Ctx, a: Scalar, b: Scalar, slot: Slot): boolean {
  if (sameScalar(a, b)) {return true;}
  if (!sameLead(a, b)) {return false;}
  const added = gainedComment(a, b);
  if (a.comment !== b.comment && added === undefined) {return false;}
  return replace(ctx, a, b, slot, added);
}

function diffCollection(ctx: Ctx, a: YAMLMap | YAMLSeq, b: YAMLMap | YAMLSeq, slot: Slot): boolean {
  if (!sameTrivia(a, b) || !!a.flow !== !!b.flow) {return false;}
  if (a.flow) {
    return renderValue(ctx, a, 0).text === renderValue(ctx, b, 0).text || replace(ctx, a, b, slot);
  }
  // Every entry gone: the value becomes `{}` / `[]`, not an empty `key:`.
  if (b.items.length === 0) {return replace(ctx, a, b, slot);}
  return isMap(a) ? diffMap(ctx, a, b as YAMLMap) : diffSeq(ctx, a as YAMLSeq, b as YAMLSeq);
}

function diffNode(ctx: Ctx, a: unknown, b: unknown, slot: Slot): boolean {
  if (!sameOrigin(a, b)) {return replace(ctx, a, b, slot);}
  if (isScalar(a)) {return diffScalar(ctx, a, b as Scalar, slot);}
  if (isAlias(a)) {
    return (isAlias(b) && a.source === b.source && sameTrivia(a, b)) || replace(ctx, a, b, slot);
  }
  if (!isCollection(a) || !isCollection(b)) {return false;}
  return diffCollection(ctx, a as YAMLMap | YAMLSeq, b as YAMLMap | YAMLSeq, slot);
}

/** Column of a block collection's entries (first key, or first `-`). */
function entryColumn(src: string, pos: number): number {
  return pos - lineStart(src, pos);
}

/** True when only spaces (and, for a list item, its `-`) precede `pos` on its line. */
function startsLine(src: string, pos: number, dash: boolean): boolean {
  const lead = src.slice(lineStart(src, pos), pos);
  return dash ? /^ *- +$/.test(lead) || /^ *$/.test(lead) : /^ *$/.test(lead);
}

function hasLeadingTrivia(node: unknown): boolean {
  return isNode(node) && (present((node as Trivia).commentBefore) || !!(node as Trivia).spaceBefore);
}

/** End of an entry's last line (after its line break). */
function entryEnd(ctx: Ctx, value: unknown, key?: unknown): number {
  const r = rangeOf(value) ?? rangeOf(key);
  return r ? lineEnd(ctx.src, r[2]) : -1;
}

function renderEntries(ctx: Ctx, container: YAMLMap | YAMLSeq, col: number): string {
  const doc = new Document(undefined, EDIT_OPTIONS);
  doc.contents = container;
  const pad = ' '.repeat(col);
  const lines = doc.toString(ctx.piece).replace(/\n+$/, '').split('\n');
  return lines.map(line => (line ? pad + line : line)).join(ctx.eol) + ctx.eol;
}

/** Insert text for new entries at `at` (a line start, or the end of a file
 *  without a final line break — which then still ends without one). */
function insertAt(ctx: Ctx, at: number, body: string): void {
  const openEnd = at === ctx.src.length && at > 0 && !ctx.src.endsWith('\n');
  push(ctx, at, at, openEnd ? ctx.eol + body.slice(0, -ctx.eol.length) : body);
}

/** Insert new entries after the entry ending at `afterEnd` (or before the
 *  first entry, `first`, when -1). */
function insertEntries(ctx: Ctx, first: unknown, afterEnd: number, container: YAMLMap | YAMLSeq, col: number, dash: boolean): boolean {
  let at = afterEnd;
  if (at < 0) {
    const r = rangeOf(first);
    if (!r || hasLeadingTrivia(first) || !startsLine(ctx.src, r[0], dash)) {return false;}
    at = lineStart(ctx.src, r[0]);
  }
  insertAt(ctx, at, renderEntries(ctx, container, col));
  return true;
}

/** Start of the lines that belong to an entry: its own line, plus the comment
 *  lines and blank lines the parser attached before it. */
function entryStart(src: string, head: unknown, pos: number): number {
  let start = lineStart(src, pos);
  const t = head as Trivia;
  const comments = present(t.commentBefore);
  let blank = !!t.spaceBefore;
  while (start > 0) {
    const prev = lineStart(src, start - 1);
    const line = src.slice(prev, start).trim();
    if (comments && line.startsWith('#')) {
      start = prev;
    } else if (blank && line === '') {
      start = prev;
      blank = false;
    } else {
      break;
    }
  }
  return start;
}

function deleteEntry(ctx: Ctx, head: unknown, value: unknown, dash: boolean): boolean {
  const r = rangeOf(head);
  if (!r || !startsLine(ctx.src, r[0], dash)) {return false;}
  const end = entryEnd(ctx, value, head);
  if (end < 0) {return false;}
  push(ctx, entryStart(ctx.src, head, r[0]), end, '');
  return true;
}

/** Finds, for a node of the changed Document, the index of the original
 *  entry it was cloned from (-1 for a new node). */
function originIndex(items: readonly unknown[], pick: (x: unknown) => unknown): (b: unknown) => number {
  const at = new Map<string, number>();
  const id = (node: unknown): string | undefined => {
    const r = rangeOf(node);
    return r ? r.join(':') : undefined;
  };
  items.forEach((item, i) => {
    const key = id(pick(item));
    if (key !== undefined && !at.has(key)) {at.set(key, i);}
  });
  return (b) => {
    const key = id(pick(b));
    const i = key === undefined ? undefined : at.get(key);
    return i !== undefined && sameOrigin(pick(items[i]), pick(b)) ? i : -1;
  };
}

function sameKey(a: unknown, b: unknown): boolean {
  return isScalar(a) && isScalar(b) ? sameScalar(a, b) : a === b;
}

function diffMap(ctx: Ctx, a: YAMLMap, b: YAMLMap): boolean {
  const firstKey = a.items[0]?.key;
  const kr = rangeOf(firstKey);
  if (!kr) {return false;}
  const col = entryColumn(ctx.src, kr[0]);
  const matched = new Set<number>();
  const flush = (pending: Pair[], last: number): boolean => {
    if (pending.length === 0) {return true;}
    const container = new YAMLMap();
    container.items.push(...pending);
    const end = last < 0 ? -1 : entryEnd(ctx, a.items[last].value, a.items[last].key);
    return insertEntries(ctx, firstKey, end, container, col, false);
  };
  const origin = originIndex(a.items, p => (p as Pair).key);
  let last = -1;
  let pending: Pair[] = [];
  for (const bp of b.items) {
    const ai = origin(bp);
    if (ai < 0) {
      pending.push(bp);
      continue;
    }
    if (ai <= last || !flush(pending, last) || !sameKey(a.items[ai].key, bp.key)) {return false;}
    pending = [];
    if (!diffNode(ctx, a.items[ai].value, bp.value, { kind: 'value', key: a.items[ai].key, col })) {return false;}
    matched.add(ai);
    last = ai;
  }
  if (!flush(pending, last)) {return false;}
  return a.items.every((p, i) => matched.has(i) || deletePair(ctx, a, i));
}

/** Remove pair `i` of `map`. The first pair of a map that is a list item
 *  (`- id: x`) shares its line with the `-`: the next key moves up to it. */
function deletePair(ctx: Ctx, map: YAMLMap, i: number): boolean {
  const pair = map.items[i];
  const r = rangeOf(pair.key);
  if (!r) {return false;}
  if (startsLine(ctx.src, r[0], false)) {return deleteEntry(ctx, pair.key, pair.value, false);}
  const next = map.items[i + 1];
  const nr = rangeOf(next?.key);
  if (i !== 0 || !nr || hasLeadingTrivia(pair.key) || hasLeadingTrivia(next.key)) {return false;}
  push(ctx, r[0], nr[0], '');
  return true;
}

function diffSeq(ctx: Ctx, a: YAMLSeq, b: YAMLSeq): boolean {
  const sr = rangeOf(a);
  if (!sr || a.items.length === 0) {return false;}
  const col = entryColumn(ctx.src, sr[0]);
  const matched = new Set<number>();
  const flush = (pending: unknown[], last: number): boolean => {
    if (pending.length === 0) {return true;}
    const container = new YAMLSeq();
    container.items.push(...pending);
    const end = last < 0 ? -1 : entryEnd(ctx, a.items[last]);
    return insertEntries(ctx, a.items[0], end, container, col, true);
  };
  const origin = originIndex(a.items, x => x);
  let last = -1;
  let pending: unknown[] = [];
  for (const bi of b.items) {
    const ai = origin(bi);
    if (ai < 0) {
      pending.push(bi);
      continue;
    }
    if (ai <= last || !flush(pending, last)) {return false;}
    pending = [];
    if (!diffNode(ctx, a.items[ai], bi, { kind: 'item', col })) {return false;}
    matched.add(ai);
    last = ai;
  }
  if (!flush(pending, last)) {return false;}
  return a.items.every((item, i) => matched.has(i) || deleteEntry(ctx, item, item, true));
}

/** Apply non-overlapping edits, last first. Returns null on an overlap. */
function applyEdits(src: string, edits: Edit[]): string | null {
  const sorted = [...edits].sort((x, y) => y.start - x.start || y.end - x.end || y.seq - x.seq);
  let out = src;
  let bound = Infinity;
  for (const e of sorted) {
    if (e.end > bound) {return null;}
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    bound = e.start;
  }
  return out;
}

/** An empty (or comments-only) document gains its first content. */
function fillDocument(ctx: Ctx, base: Document, b: unknown): boolean {
  if (!isMap(b) && !isSeq(b)) {return false;}
  const lead = ctx.src.length > 0 && !ctx.src.endsWith('\n') ? ctx.eol : '';
  const gap = base.commentBefore ? ctx.eol : '';
  push(ctx, ctx.src.length, ctx.src.length, lead + gap + renderEntries(ctx, b, 0));
  return true;
}

function spliceRoot(ctx: Ctx, base: Document, next: Document): boolean {
  if (base.commentBefore !== next.commentBefore || base.comment !== next.comment) {return false;}
  const a = base.contents;
  const b = next.contents;
  if (!present(a)) {return !present(b) || fillDocument(ctx, base, b);}
  return present(b) && diffNode(ctx, a, b, { kind: 'root' });
}

function splice(src: string, base: Document, next: Document, eol: string, piece: ToStringOptions): string | null {
  const ctx: Ctx = { src, eol, edits: [], piece };
  if (!spliceRoot(ctx, base, next)) {return null;}
  return applyEdits(src, ctx.edits);
}

/** Blank lines carry no data outside block scalars, and the parser may pin a
 *  blank line to a neighbouring node; the data itself is compared separately. */
const withoutBlankLines = (text: string): string => text.replace(/^[ \t]*\n/gm, '');

/** True when `text` parses to the same data as `next`, with the same comments,
 *  styles and structure (its serialisation equals `want`, blank lines aside). */
function reads(text: string, next: Document, want: string, opts: ToStringOptions): boolean {
  const doc = parseDocument(text, EDIT_OPTIONS);
  if (doc.errors.length > 0 || !sameJs(doc.toJS(), next.toJS())) {return false;}
  const got = doc.toString(opts);
  return got === want || withoutBlankLines(got) === withoutBlankLines(want);
}

/**
 * Parse `text`, let `mutate` change the Document, and return the new text with
 * every byte outside the changed nodes kept. `name` labels errors (a file that
 * is not valid YAML is refused — nothing is guessed). When the change leaves
 * the data as it was (the same values, whatever the nodes or their order),
 * the original `text` is returned with `changed: false`.
 */
export function editYaml(text: string, mutate: (doc: Document) => void, name = 'YAML'): YamlEditResult {
  const { text: out, changed } = editYamlDetailed(text, mutate, name);
  return { text: out, changed };
}

/** {@link editYaml}, also saying how the text was made: `spliced` is true when
 *  only the changed nodes were rewritten, false when faf fell back to the
 *  Document's own serialisation (or nothing changed). For tests. */
export function editYamlDetailed(
  text: string,
  mutate: (doc: Document) => void,
  name = 'YAML',
): YamlEditResult & { spliced: boolean } {
  const bom = text.startsWith('\uFEFF') ? '\uFEFF' : '';
  const src = text.slice(bom.length);
  const base = parseForEdit(src, name);
  const next = cloneDocument(base);
  mutate(next);
  const unchanged = { text, changed: false, spliced: false };
  // A change that leaves the data as it was writes nothing — not even the
  // Document's own serialisation, which could differ from the file's text.
  if (sameJs(next.toJS(), base.toJS())) {return unchanged;}
  const canon: ToStringOptions = { lineWidth: 0, ...styleOf(src) };
  const want = next.toString(canon);
  if (want === base.toString(canon)) {return unchanged;}
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const candidate = splice(src, base, next, eol, { ...canon, verifyAliasOrder: false });
  const spliced = candidate !== null && reads(candidate, next, want, canon);
  const out = spliced && candidate !== null ? candidate : want.replace(/\r?\n/g, eol);
  return { text: bom + out, changed: bom + out !== text, spliced };
}

/** `doc.clone()`, keeping the document-end marker (`...`): yaml's clone
 *  copies the `%YAML` directive and the `---` start marker but drops `...`,
 *  so every edit of a file ending in `...` fell back to a full rewrite. */
function cloneDocument(doc: Document): Document {
  const copy = doc.clone();
  if (doc.directives && copy.directives) {copy.directives.docEnd = doc.directives.docEnd;}
  return copy;
}

// ─── Applying plain data to a Document ──────────────────────────────────────

/** Deep equality of plain parsed values (mappings compared key by key). */
export function sameJs(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {return true;}
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => sameJs(x, b[i]));
  }
  if (isMapping(a) && isMapping(b)) {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(k => k in b && sameJs(a[k], b[k]));
  }
  return false;
}

function keyText(pair: Pair): string | undefined {
  const k = isScalar(pair.key) ? pair.key.value : pair.key;
  return typeof k === 'string' || typeof k === 'number' || typeof k === 'boolean' ? String(k) : undefined;
}

function findPair(map: YAMLMap, key: string): Pair | undefined {
  return map.items.find(p => keyText(p) === key);
}

function nodeJs(doc: Document, node: unknown): unknown {
  return isNode(node) ? node.toJS(doc) : node;
}

/** How {@link applyMapData} treats keys the data does not name. */
export interface ApplyOptions {
  /** Remove keys of a mapping that the data leaves out (or sets `undefined`).
   *  Default false: a key the data does not mention stays exactly as it is. */
  prune?: boolean;
  /** Leave every alias (`*name`) as written, whatever the data holds there:
   *  it is never expanded or replaced (see {@link keptAliases}). */
  keepAliases?: boolean;
}

/** The node already holds `value`, or is an alias kept as written. */
function staysAsWritten(doc: Document, node: unknown, value: unknown, opts: ApplyOptions): boolean {
  return (opts.keepAliases === true && isAlias(node)) || sameJs(nodeJs(doc, node), value);
}

/**
 * Set `node` to hold `value` with the fewest changes: a mapping is updated key
 * by key, a list item by item (items still there are kept as they are), a
 * scalar in place (its comment, quoting and position kept). Returns the node
 * to store — `node` itself, or a new node when the shape changed.
 */
export function applyValue(doc: Document, node: unknown, value: unknown, opts: ApplyOptions = {}): unknown {
  if (staysAsWritten(doc, node, value, opts)) {return node;}
  if (isMapping(value) && isMap(node)) {
    applyMapData(doc, node, value, opts);
    return node;
  }
  if (Array.isArray(value) && isSeq(node)) {
    applySeqData(doc, node, value, opts);
    return node;
  }
  if (!isMapping(value) && !Array.isArray(value) && isScalar(node)) {
    node.value = value;
    return node;
  }
  return withCommentOf(node, doc.createNode(value));
}

/** `created`, which takes the place of `old`, with `old`'s comments: a
 *  scalar or an alias keeps its line comment (`summary: *g # note` →
 *  `summary: New # note`); a scalar lifted to a mapping or a list
 *  (`project: demo # note`, `stack: # note`) keeps it as a comment line above
 *  the new entries, or on the key line when the new value is empty
 *  (`stack: {} # note`). */
function withCommentOf(old: unknown, created: Node): Node {
  if (!isScalar(old) && !isAlias(old)) {return created;}
  const was = old as Trivia;
  const target = created as Node & Trivia;
  if (isCollection(created) && created.items.length > 0 && !created.flow) {
    target.commentBefore = joinComments(target.commentBefore, was.commentBefore, was.comment);
    return created;
  }
  if (isCollection(created)) {created.flow = true;}
  target.comment = joinComments(target.comment ?? was.comment);
  target.commentBefore = joinComments(target.commentBefore ?? was.commentBefore);
  return created;
}

/** Comment texts joined as lines, or undefined when there are none. */
function joinComments(...parts: Array<string | null | undefined>): string | undefined {
  const lines = parts.filter(present);
  return lines.length > 0 ? lines.join('\n') : undefined;
}

/** Make `map` hold `data`: changed keys updated in place, new keys appended in
 *  `data`'s order. Keys `data` leaves out stay, unless `prune` is set. */
export function applyMapData(doc: Document, map: YAMLMap, data: Record<string, unknown>, opts: ApplyOptions = {}): void {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {continue;}
    const pair = findPair(map, key);
    if (pair) {
      pair.value = applyValue(doc, pair.value, value, opts);
    } else {
      map.items.push(doc.createPair(key, value));
    }
  }
  if (!opts.prune) {return;}
  map.items = map.items.filter(p => {
    const key = keyText(p);
    return key === undefined || data[key] !== undefined;
  });
}

/**
 * Merge `data` into `map`, whose parsed value (the file as it was read) is
 * `before`, writing only the paths where `data` differs from `before`:
 *   - a key whose value in `data` equals its value in `before` is not touched
 *     — its node stays exactly as written, so an alias (`summary: *g`), a
 *     merge key or a comment on it survives even when `data` spells out the
 *     value the alias read as (a stale copy never replaces a live `*alias`);
 *   - a changed mapping is merged key by key the same way;
 *   - any other changed value is set with {@link applyValue};
 *   - an alias (`stack: *base`) is never replaced or expanded, at any depth:
 *     it stays as written, and a change `data` makes under it is not written
 *     ({@link keptAliases} lists those paths);
 *   - keys `data` leaves out (or sets `undefined`) stay; new keys are appended.
 * This is how writeFaf applies full .faf data to an existing file.
 */
export function mergeData(doc: Document, map: YAMLMap, before: unknown, data: Record<string, unknown>): void {
  const was: Record<string, unknown> = isMapping(before) ? before : {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {continue;}
    const pair = findPair(map, key);
    if (!pair) {
      map.items.push(doc.createPair(key, value));
    } else if (Object.prototype.hasOwnProperty.call(was, key) && sameJs(was[key], value)) {
      continue; // unchanged: the node stays as written
    } else if (isMapping(value) && isMapping(was[key]) && isMap(pair.value)) {
      mergeData(doc, pair.value, was[key], value);
    } else {
      pair.value = applyValue(doc, pair.value, value, { keepAliases: true });
    }
  }
}

/** An alias faf left as written: where it is (`stack`, `key_files.2`) and
 *  what it says (`*base`). With `kind: 'anchor'` the path holds an anchor an
 *  alias reads (`alias` then says `&name`): `faf auto` would have filled it,
 *  which would change every alias that reads it, so it is left as written. */
export interface KeptAlias {
  path: string;
  alias: string;
  kind?: 'alias' | 'anchor';
}

/** Every alias in a mapping or list, with its path — not looking through aliases. */
function aliasesIn(node: unknown, path: readonly (string | number)[], out: Array<{ path: (string | number)[]; node: Alias }>): void {
  if (isAlias(node)) {
    out.push({ path: [...path], node });
  } else if (isMap(node)) {
    for (const pair of node.items) {
      const key = keyText(pair);
      if (key !== undefined) {aliasesIn(pair.value, [...path, key], out);}
    }
  } else if (isSeq(node)) {
    node.items.forEach((item, i) => aliasesIn(item, [...path, i], out));
  }
}

/** The plain value at `path` of parsed data, or undefined. */
function jsAt(data: unknown, path: readonly (string | number)[]): unknown {
  let cur = data;
  for (const step of path) {
    if (Array.isArray(cur) && typeof step === 'number') {
      cur = cur[step];
    } else if (isMapping(cur) && typeof step === 'string') {
      cur = cur[step];
    } else {
      return undefined;
    }
  }
  return cur;
}

/** The aliases in `doc` where `data` changed the value the file held
 *  (`before`) and the alias does not read as the new value — a change under
 *  an alias that faf did not write, because it never replaces or expands an
 *  alias. A value `data` only repeats (a stale copy of what the alias read
 *  as) is not a change. */
export function keptAliases(doc: Document, data: unknown, before: unknown): KeptAlias[] {
  const found: Array<{ path: (string | number)[]; node: Alias }> = [];
  aliasesIn(doc.contents, [], found);
  return found
    .filter(({ path, node }) => {
      const want = jsAt(data, path);
      return want !== undefined && !sameJs(jsAt(before, path), want) && !sameJs(node.toJS(doc), want);
    })
    .map(({ path, node }) => ({ path: path.join('.'), alias: `*${node.source}` }));
}

/** The node at `path` of a Document, and a way to put another node in its
 *  place — or null when nothing is there. A list item is put back only over a
 *  node the change made (one with no place in the file); an item of the file
 *  that moved there is left. */
function slotAt(doc: Document, path: readonly (string | number)[]): { node: unknown; put: (n: Node) => boolean } | null {
  let parent: unknown = doc.contents;
  for (let i = 0; i < path.length - 1 && parent !== undefined; i++) {parent = childAt(parent, path[i]);}
  const step = path[path.length - 1];
  if (isMap(parent) && typeof step === 'string') {
    const pair = findPair(parent, step);
    return pair ? { node: pair.value, put: n => ((pair.value = n), true) } : null;
  }
  if (isSeq(parent) && typeof step === 'number' && step < parent.items.length) {
    const seq = parent;
    const node = seq.items[step];
    return { node, put: n => (rangeOf(node) === undefined ? ((seq.items[step] = n), true) : false) };
  }
  return null;
}

/** The value a mapping holds under `step`, or a list's item `step`. */
function childAt(node: unknown, step: string | number): unknown {
  if (isMap(node) && typeof step === 'string') {return findPair(node, step)?.value;}
  if (isSeq(node) && typeof step === 'number') {return node.items[step];}
  return undefined;
}

/**
 * Put back every alias of `before` that `after` (the same Document, changed)
 * holds something else in place of: faf never replaces an alias, so that
 * path keeps the file's `*name` and its change is not written. A key the
 * change removed stays removed. Returns the aliases put back.
 */
export function restoreAliases(before: Document, after: Document): KeptAlias[] {
  const found: Array<{ path: (string | number)[]; node: Alias }> = [];
  aliasesIn(before.contents, [], found);
  const kept: KeptAlias[] = [];
  for (const { path, node } of found) {
    const slot = slotAt(after, path);
    if (!slot || (isAlias(slot.node) && slot.node.source === node.source)) {continue;}
    if (!slot.put(node.clone() as Alias)) {continue;}
    kept.push({ path: path.join('.'), alias: `*${node.source}` });
  }
  return kept;
}

/** Every node with an anchor in `names`, with its path — not looking through aliases. */
function anchoredIn(node: unknown, path: readonly (string | number)[], names: ReadonlySet<string>, out: Array<{ path: (string | number)[]; node: Node }>): void {
  if (!isNode(node) || isAlias(node)) {return;}
  const anchor = (node as Trivia).anchor;
  if (anchor && names.has(anchor)) {out.push({ path: [...path], node });}
  if (isMap(node)) {
    for (const pair of node.items) {
      const key = keyText(pair);
      if (key !== undefined) {anchoredIn(pair.value, [...path, key], names, out);}
    }
  } else if (isSeq(node)) {
    node.items.forEach((item, i) => anchoredIn(item, [...path, i], names, out));
  }
}

/**
 * Put back every node of `before` that carries an anchor an alias reads
 * (`frontend: &x None` while `ui_library: *x`) and that `after` (the same
 * Document, changed) holds something else in place of: a fill there would
 * change the value of every alias that reads it, so faf leaves the node as
 * written and its change is not written. Returns those paths (`kind:
 * 'anchor'`, `alias` saying `&name`).
 */
export function restoreAnchors(before: Document, after: Document): KeptAlias[] {
  const aliases: Array<{ path: (string | number)[]; node: Alias }> = [];
  aliasesIn(before.contents, [], aliases);
  const names = new Set(aliases.map(a => a.node.source));
  if (names.size === 0) {return [];}
  const found: Array<{ path: (string | number)[]; node: Node }> = [];
  anchoredIn(before.contents, [], names, found);
  const kept: KeptAlias[] = [];
  for (const { path, node } of found) {
    const slot = slotAt(after, path);
    if (!slot) {continue;}
    const anchor = (node as Trivia).anchor as string;
    const same = isNode(slot.node) && (slot.node as Trivia).anchor === anchor && sameJs(node.toJS(before), (slot.node as Node).toJS(after));
    if (same || !slot.put(node.clone() as Node)) {continue;}
    kept.push({ path: path.join('.'), alias: `&${anchor}`, kind: 'anchor' });
  }
  return kept;
}

/** Index pairs [i, j] of a longest common subsequence of `a` and `b`. */
function commonItems(a: readonly unknown[], b: readonly unknown[]): Array<[number, number]> {
  const n = a.length;
  const m = b.length;
  const len: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      len[i][j] = sameJs(a[i], b[j]) ? len[i + 1][j + 1] + 1 : Math.max(len[i + 1][j], len[i][j + 1]);
    }
  }
  const pairs: Array<[number, number]> = [];
  for (let i = 0, j = 0; i < n && j < m;) {
    if (sameJs(a[i], b[j])) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (len[i + 1][j] >= len[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return pairs;
}

/** Make `seq` hold `data`. Items that are still there are kept as they are
 *  (so removing or adding one item touches only that item); between them,
 *  items are changed in place, then removed or added. */
function applySeqData(doc: Document, seq: YAMLSeq, data: unknown[], opts: ApplyOptions): void {
  const old = seq.items;
  const oldJs = old.map(item => nodeJs(doc, item));
  const items: unknown[] = [];
  let i = 0;
  let j = 0;
  for (const [mi, mj] of [...commonItems(oldJs, data), [old.length, data.length] as [number, number]]) {
    for (; i < mi && j < mj; i++, j++) {items.push(applyValue(doc, old[i], data[j], opts));}
    for (; j < mj; j++) {items.push(doc.createNode(data[j]));}
    if (mi < old.length) {items.push(old[mi]);}
    i = mi + 1;
    j = mj + 1;
  }
  seq.items = items;
}

/**
 * Apply the change from `before` to `after` to `node`, touching nothing the
 * change does not name: for mappings, only keys added, removed or changed
 * between the two are written — a key in the file that neither side mentions
 * stays as it is. Returns the node to store.
 */
export function applyChange(doc: Document, node: unknown, before: unknown, after: unknown): unknown {
  if (sameJs(before, after)) {return node;}
  if (!isMapping(before) || !isMapping(after) || !isMap(node)) {return applyValue(doc, node, after);}
  const gone = new Set(Object.keys(before).filter(key => !(key in after) || after[key] === undefined));
  node.items = node.items.filter(p => {
    const key = keyText(p);
    return key === undefined || !gone.has(key);
  });
  for (const [key, value] of Object.entries(after)) {
    if (value === undefined) {continue;}
    const pair = findPair(node, key);
    if (!pair) {
      node.items.push(doc.createPair(key, value));
    } else if (!sameJs(before[key], value)) {
      pair.value = applyChange(doc, pair.value, before[key], value);
    }
  }
  return node;
}

/** The mapping at `path` (created when absent or empty). Throws when something
 *  else is there — faf never replaces a scalar or a list to make room. */
export function mapAt(doc: Document, path: readonly string[], name: string): YAMLMap {
  let cur: unknown = doc.contents;
  if (cur === null || cur === undefined) {
    doc.contents = new YAMLMap();
    cur = doc.contents;
  }
  if (!isMap(cur)) {throw new Error(`${name}: the document is not a mapping — faf left it unchanged.`);}
  let map: YAMLMap = cur;
  for (const key of path) {
    const pair = findPair(map, key);
    if (pair && isMap(pair.value)) {
      map = pair.value;
      continue;
    }
    if (pair && !isEmptyValue(pair.value)) {throw new Error(`${name}: ${key} is not a mapping — faf left it unchanged.`);}
    const created = new YAMLMap();
    if (pair) {pair.value = filling(pair.value, created);} else {map.items.push(doc.createPair(key, created));}
    map = created;
  }
  return map;
}

/**
 * Apply the change `before` → `after` at `path` (see {@link applyChange}).
 * The parent mapping is created when absent; `after === undefined` removes the
 * key. Nothing is touched when the two are equal.
 */
export function changeAt(doc: Document, path: readonly string[], before: unknown, after: unknown, name: string): void {
  if (sameJs(before, after)) {return;}
  const parent = mapAt(doc, path.slice(0, -1), name);
  const key = path[path.length - 1];
  const pair = findPair(parent, key);
  if (after === undefined) {
    parent.items = parent.items.filter(p => p !== pair);
  } else if (!pair) {
    parent.items.push(doc.createPair(key, after));
  } else {
    pair.value = applyChange(doc, pair.value, before, after);
  }
}

/** The list at `path`, created (as an empty list) when absent or empty.
 *  Throws when something else is there. */
export function seqAt(doc: Document, path: readonly string[], name: string): YAMLSeq {
  const parent = mapAt(doc, path.slice(0, -1), name);
  const key = path[path.length - 1];
  const pair = findPair(parent, key);
  if (pair && isSeq(pair.value)) {return pair.value;}
  if (pair && !isEmptyValue(pair.value)) {throw new Error(`${name}: ${path.join('.')} is not a list — faf left it unchanged.`);}
  const seq = new YAMLSeq();
  if (pair) {pair.value = filling(pair.value, seq);} else {parent.items.push(doc.createPair(key, seq));}
  return seq;
}

/** `created` taking the place of an empty value (`facts: # note`) that entries
 *  are about to fill: the empty value's comment becomes a comment line above
 *  those entries, so it is not lost. */
function filling<T extends YAMLMap | YAMLSeq>(empty: unknown, created: T): T {
  if (!isScalar(empty)) {return created;}
  const lines = [empty.commentBefore, empty.comment].filter(present);
  if (lines.length > 0) {created.commentBefore = lines.join('\n');}
  return created;
}

/** `key:` with nothing after it (or `~` / `null`). */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {return true;}
  return isScalar(value) && (value.value === null || value.value === undefined);
}

