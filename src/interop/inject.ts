import { dirname, resolve } from 'path';
import { readUtf8, resolveInside, safeWriteFile } from '../core/safe-write.js';
import { BlockReader, MAX_OPEN_CONTAINERS, type HiddenIn } from './commonmark.js';

/**
 * Block markers for the faf-managed front section.
 *
 * Markdown files (AGENTS.md, CLAUDE.md, GEMINI.md) use HTML comments; non-markdown
 * files (.cursorrules) pass hash-comment markers via the `start`/`end` args.
 */
export const FAF_START = '<!-- faf:start -->';
export const FAF_END = '<!-- faf:end -->';

const BOM = '\uFEFF';

/** Split into lines keeping each line's own terminator (\r\n, \r or \n). */
export function linesWithEnds(text: string): string[] {
  return text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g)?.filter((l, i, a) => l !== '' || i < a.length - 1) ?? [];
}

export const stripEnd = (line: string): string => line.replace(/\r?\n$|\r$/, '');
/** A line as the marker rules see it: terminator, a leading BOM and trailing whitespace dropped. */
const bareLine = (line: string): string => stripEnd(line).replace(/^\uFEFF/, '').trimEnd();

// ─── Markdown regions: two readings ──────────────────────────────────────────
//
// Text in fenced or indented code, in a raw HTML block (<pre>, <script>,
// <style>, <textarea>, <?…?>, <!X…>, <![CDATA[…]]>) or in a multi-line HTML
// comment is shown as code, or not shown at all — a marker line there is an
// example, never a marker. faf reads every file two ways (commonmark.ts):
//   (a) as CommonMark reads it: list items and block quotes included. A list
//       item's lines sit at its content column (a tab after the marker
//       advances to the next multiple of 4); a fence or raw block opened in a
//       list item closes at that column and ends when the item does; no
//       fence opens inside an HTML block of types 6 or 7 (<div>, <details>,
//       a lone tag) until a blank line;
//   (b) plainly, every line at column 0: the same blocks, with no list items
//       and no block quotes.
// A START/END pair is faf's block only when both readings find that same
// pair. When they differ the file is the user's, and faf prefixes: when in
// doubt, prefix. A file that nests more than MAX_OPEN_CONTAINERS block quotes,
// lists and list items before faf's block is one faf cannot read for sure:
// the reading stops there, and faf prefixes too.

/** One reading's search: the latest START seen, and the pair once found. */
interface Search {
  reader: BlockReader;
  start: number;
  found: { start: number; end: number } | null;
}

/** One line of the text, where it starts, and its BOM-free content. */
interface ScanLine {
  offset: number;
  /** Where the line's text starts (after a line-1 BOM). */
  from: number;
  /** Where the line's text ends (before its terminator). */
  to: number;
  content: string;
}

function* scanLines(text: string): Generator<ScanLine> {
  let offset = 0;
  for (const line of linesWithEnds(text)) {
    const body = stripEnd(line);
    const bom = offset === 0 && body.charCodeAt(0) === 0xfeff ? 1 : 0;
    yield { offset, from: offset + bom, to: offset + body.length, content: body.slice(bom) };
    offset += line.length;
  }
}

/** Move each reading that shows `line` on: a START there becomes its latest
 *  START, an END after a START completes its pair. */
function advance(shown: Search[], line: ScanLine, isStart: (l: string) => boolean, isEnd: (l: string) => boolean): void {
  const end = shown.some(r => r.start !== -1) && isEnd(line.content);
  const start = isStart(line.content);
  for (const r of shown) {
    if (r.start !== -1 && end) {
      r.found = { start: r.start, end: line.to };
    } else if (start) {
      r.start = line.from;
    }
  }
}

/**
 * faf's marked range in `text`: in each reading, the last START line before
 * the first END line after it (the innermost pair — text between an earlier
 * START and the last one is kept), both outside every Markdown region. The
 * two readings must find the same pair; otherwise there is no range. Returns
 * the char range covering both lines (the END line's terminator excluded), or
 * null. A leading BOM on line 1 stays outside the range. `isStart` and
 * `isEnd` are asked about each line shown as text in at least one reading,
 * once, in order, on the line with its terminator and that BOM removed. Past
 * MAX_OPEN_CONTAINERS open containers the CommonMark reading stops, and there
 * is no range (a pair found before that point still counts). Time grows with
 * the text's length, not with how deep it nests.
 */
export function findMarkedRange(
  text: string,
  isStart: (line: string) => boolean,
  isEnd: (line: string) => boolean,
): { start: number; end: number } | null {
  const [a, b]: Search[] = [new BlockReader(true), new BlockReader(false)].map(reader => ({ reader, start: -1, found: null }));
  for (const line of scanLines(text)) {
    const hidden = [a, b].map(r => r.reader.line(line.content));
    if (a.reader.tooDeep) {return null;} // nested too deep to read for sure: the file is the user's
    const shown = [a, b].filter((_, i) => hidden[i] === null);
    if (shown.length > 0) {advance(shown, line, isStart, isEnd);}
    // Both readings end their pair on this same line, or they do not agree.
    if (a.found || b.found) {return a.found && b.found && a.found.start === b.found.start ? a.found : null;}
  }
  return null;
}

/** A whole marker line at column 0: exactly the marker text (a CRLF line's
 *  `\r` is its terminator). Trailing spaces or tabs make it text, not a marker. */
const markerLine = (marker: string) => (line: string): boolean => line === marker;

/**
 * Locate the faf-managed block in `text`: a START marker line and the first
 * END marker line after it, both outside fenced and indented code, raw HTML
 * blocks and multi-line HTML comments, under both readings (see
 * {@link findMarkedRange}). Returns the char range covering both marker lines
 * (terminator of the END line excluded), or null when there is no complete
 * block both readings agree on.
 *
 * Markers are matched as WHOLE LINES at column 0 — exactly the marker text,
 * nothing after it — never as substrings. Substring search was a real bug
 * (7.1.4–7.11.0): renderAgentsMd quoted the marker tokens in its own
 * blockquote, so on every re-run `indexOf(end)` hit the quote, cut the old
 * block in half and appended its stale tail below the new block — `faf
 * export --agents` grew AGENTS.md by ~49 lines per run. The same happened to
 * users who documented the markers in a code fence above the block.
 *
 * Two START lines before an END: the pair is the last START and that END.
 * faf's own body never holds a column-0 START (see {@link wrapFafBlock}), so
 * the text between the two STARTs is the user's and stays. A START with no
 * END is not a block: the caller treats "no block" as a user file and
 * prefixes — it never reclaims. faf's own block is always found again where
 * faf put it (see {@link placeFafBlock}).
 */
export function findFafBlock(
  text: string,
  start: string = FAF_START,
  end: string = FAF_END,
): { start: number; end: number } | null {
  return findMarkedRange(text, markerLine(start), markerLine(end));
}

/** For each reading that would hide a line of `end` after `text`: the line
 *  that ends the region it sits in (null when no single line does). */
function closersFor(text: string, end: string): Array<string | null> {
  const closers: Array<string | null> = [];
  for (const containers of [true, false]) {
    const reader = new BlockReader(containers);
    for (const line of linesWithEnds(text)) {reader.line(stripEnd(line));}
    if (reader.clone().line(end) !== null) {closers.push(reader.closer());}
  }
  return closers;
}

/** faf's own body, made safe to wrap between its markers:
 *   - a body line that is itself a marker line (a .faf value that documents
 *     the markers, say — with or without trailing spaces) would let the next
 *     write cut the block there and grow the file every run — it is indented
 *     one space: no longer a column-0 marker, and the text is unchanged;
 *   - a body that leaves fenced code, a raw HTML block or a comment open (a
 *     .faf value holding a ``` line, say) would hide the END line from the
 *     next scan, and faf would prefix a second block — the region is closed
 *     on a line of its own at the end of the body, in each reading. A closer
 *     that would hide the END line in the other reading is not added: such a
 *     body is quoted by {@link placeFafBlock} instead. */
function guardBody(body: string, start: string, end: string): string {
  const lines = linesWithEnds(body).map(line => {
    const bare = bareLine(line);
    return bare === start || bare === end ? ` ${line}` : line;
  });
  let text = lines.join('');
  let hiding = closersFor(text, end);
  while (hiding.length > 0 && hiding[0] !== null) {
    const next = `${text}\n${hiding[0]}`;
    const after = closersFor(next, end);
    if (after.length >= hiding.length) {break;}
    text = next;
    hiding = after;
  }
  return text;
}

/** The same block with every body line quoted (`> `; a blank line `>`): a
 *  block quote in the CommonMark reading and plain text in the column-0 one,
 *  so no body line can hide the END line in either — whatever the text
 *  before the block leaves open. The fallback for a body the closers cannot
 *  settle. */
function quoteBody(wrapped: string, start: string, end: string): string {
  const body = wrapped.slice(start.length + 1, wrapped.length - end.length - 1);
  const quoted = linesWithEnds(body).map(line => (stripEnd(line) === '' ? `>${line}` : `> ${line}`)).join('');
  return `${start}\n${quoted}\n${end}`;
}

/**
 * `head`, faf's block (`wrapped`, from {@link wrapFafBlock}) and `tail` as one
 * text in which {@link findFafBlock} finds the block exactly where it was put
 * — so the next write updates it in place and never stacks a second one. A
 * body that would not be found there (it leaves a region open in only one
 * reading, or the text before it holds a raw HTML block the body continues)
 * is quoted line by line instead. Throws, and nothing is written, if even
 * that is not found.
 */
export function placeFafBlock(head: string, wrapped: string, tail: string, start: string = FAF_START, end: string = FAF_END): string {
  const placed = (block: string): string | null => {
    const text = `${head}${block}${tail}`;
    const found = findFafBlock(text, start, end);
    return found && found.start === head.length && found.end === head.length + block.length ? text : null;
  };
  const text = placed(wrapped) ?? placed(quoteBody(wrapped, start, end));
  if (text === null) {throw new Error("faf could not place its block where the next run finds it again — nothing written.");}
  return text;
}

/** The managed block: START, the body (guarded — see guardBody), END. */
export function wrapFafBlock(block: string, start: string = FAF_START, end: string = FAF_END): string {
  return `${start}\n${guardBody(block.trim(), start, end)}\n${end}`;
}

/** The file's new text: `existing` (null when there is no file) with `wrapped`
 *  as its managed block, placed where the next scan finds it again (see
 *  {@link placeFafBlock}). */
export function withFafBlock(existing: string | null, wrapped: string, start: string = FAF_START, end: string = FAF_END): string {
  // 1. No file → just the block.
  if (existing === null) {return placeFafBlock('', wrapped, '\n', start, end);}

  // 2. A complete block → replace only the managed block; keep everything around it.
  const found = findFafBlock(existing, start, end);
  if (found) {return placeFafBlock(existing.slice(0, found.start), wrapped, existing.slice(found.end), start, end);}

  // 3. Everything else → prefix the block and keep every byte already there. A
  //    file with no marker lines is the user's, whatever its first line says —
  //    a faf-looking stamp or footer proves nothing. A leading BOM stays at byte 0.
  const bom = existing.startsWith(BOM) ? BOM : '';
  return placeFafBlock(bom, wrapped, `\n\n${existing.slice(bom.length)}`, start, end);
}

/** Read a resolved path, or null when nothing is there yet. Only ENOENT reads
 *  as "no file"; any other error is thrown, so a file faf could not read is
 *  never treated as empty and written fresh. The text is decoded strictly: a
 *  file that is not UTF-8 (a UTF-16 file, cp1252 bytes) is refused
 *  (SafePathError `not-utf8`) and left as it is — see readUtf8. */
export function readIfPresent(path: string): string | null {
  try {
    return readUtf8(path);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {return null;}
    throw e;
  }
}

export interface InjectOptions {
  /** The project folder the file must stay inside. Default: the file's own
   *  folder. Pass it when the file sits in a subfolder (`.github/…`), so a
   *  linked subfolder cannot carry the write out of the project. */
  root?: string;
}

/**
 * Non-destructively write a faf-managed block into a file.
 *
 *   - file does not exist     → create it containing just the block
 *   - file has the markers    → replace ONLY the content between them (update in place)
 *   - anything else           → PREFIX the block; everything already there is preserved
 *                               (a leading BOM stays at byte 0)
 *
 * faf replaces only text it can prove it wrote: what sits between its own
 * marker lines. A file with no marker lines is never reclaimed, whatever it
 * starts or ends with. Idempotent: re-running updates the managed block in
 * place and never duplicates it. Enhance, never replace.
 *
 * The file is resolved inside its project first: a link that leads outside,
 * a dangling link, a link to a file with another name (CLAUDE.md → README.md)
 * and anything in `.git` are refused (SafePathError) and nothing is written; a
 * link to a file of the same name, or between AI context files (CLAUDE.md →
 * AGENTS.md), is written through and stays a link. A file that is not UTF-8
 * is refused and left as it is. The write is atomic — a failure leaves the
 * original exactly as it was — and is refused if the file changed on disk
 * after faf read it.
 */
export function injectFafBlock(
  path: string,
  block: string,
  start: string = FAF_START,
  end: string = FAF_END,
  opts: InjectOptions = {},
): void {
  const wrapped = wrapFafBlock(block, start, end);
  const full = resolve(path);
  const root = opts.root ?? dirname(full);
  const target = resolveInside(root, full);
  const existing = readIfPresent(target);
  safeWriteFile(target, withFafBlock(existing, wrapped, start, end), { root, expect: existing });
}

/** faf's old metastamp line — the two-line `<!-- faf: … -->` stamp older faf
 *  versions put at the top of CLAUDE.md and friends, with no markers. */
const LEGACY_STAMP = '<!-- faf:';

/** How the note names the region an old START line sits in. */
function regionName(hidden: HiddenIn): string {
  if (hidden === 'code fence') {return 'a code fence';}
  if (hidden === 'indented code') {return 'an indented code block';}
  if (hidden === 'comment') {return 'an HTML comment';}
  return hidden === 'html' ? 'an HTML block' : `a ${hidden} block`;
}

/** The region a whole-line START of `text` sits in — in either reading — or
 *  null when every START line is shown as text (or there is none). `'too
 *  deep'` when a whole-line START sits past the point where the file nests
 *  more than MAX_OPEN_CONTAINERS containers (faf stopped reading there). */
function hiddenStart(text: string, start: string): HiddenIn | 'too deep' | null {
  const readers = [new BlockReader(true), new BlockReader(false)];
  let deep = false;
  for (const { content } of scanLines(text)) {
    if (deep) {
      if (content === start) {return 'too deep';}
      continue;
    }
    const [a, b] = readers.map(r => r.line(content));
    deep = readers[0].tooDeep;
    const hidden = a ?? b;
    if (content === start && (deep || hidden !== null)) {return deep ? 'too deep' : hidden;}
  }
  return null;
}

/**
 * The one line the CLI prints when faf's block goes on top of a file that has
 * no block of its own but holds older faf text — or null:
 *   - the file's first line is faf's old metastamp (`<!-- faf: … -->`): faf
 *     never reclaims such a file (it cannot prove it wrote the text), so the
 *     old faf text stays below the new block;
 *   - a whole-line START marker sits inside a code fence, a raw HTML block
 *     or an HTML comment (in either reading — see {@link findFafBlock}): the
 *     older block there is an example to faf, and stays below the new one;
 *   - a whole-line START marker sits past more than MAX_OPEN_CONTAINERS
 *     nested lists or quotes: faf did not read that far, and the older block
 *     stays below the new one.
 * `label` names the file (`CLAUDE.md`). `existing` is the file's text before
 * the write (null when there was none). faf-mcp and claude-faf-mcp print the
 * same line through this export.
 */
export function legacyStampNote(
  label: string,
  existing: string | null,
  start: string = FAF_START,
  end: string = FAF_END,
): string | null {
  if (existing === null || findFafBlock(existing, start, end)) {return null;}
  const first = bareLine(linesWithEnds(existing)[0] ?? '');
  if (first.startsWith(LEGACY_STAMP) && first !== start && first !== end) {
    return `${label}: faf's block is now on top; the old faf text below it is left as you had it — delete it by hand if you no longer want it.`;
  }
  const hidden = hiddenStart(existing, start);
  if (hidden === null) {return null;}
  if (hidden === 'too deep') {
    return `${label}: faf's block is now on top; the file nests more than ${MAX_OPEN_CONTAINERS} lists or quotes before an older faf block, so faf did not read that far — the older block is left as you had it; delete it by hand if you no longer want it.`;
  }
  return `${label}: faf's block is now on top; an older faf block below sits inside ${regionName(hidden)} and is left as you had it — delete it by hand if you no longer want it.`;
}

/** {@link legacyStampNote} for the file at `path`, read the way
 *  injectFafBlock reads it — before the write. Null when there is no note, or
 *  when the file cannot be read (the write itself then says why). */
export function legacyStampNoteAt(
  path: string,
  label: string,
  start: string = FAF_START,
  end: string = FAF_END,
  opts: InjectOptions = {},
): string | null {
  try {
    const full = resolve(path);
    return legacyStampNote(label, readIfPresent(resolveInside(opts.root ?? dirname(full), full)), start, end);
  } catch {
    return null;
  }
}
