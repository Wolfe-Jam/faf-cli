import { dirname, resolve } from 'path';
import { readUtf8, resolveInside, safeWriteFile } from '../core/safe-write.js';

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
/** A line that starts with ``` or ~~~ (after trimming). Kept for callers of
 *  7.13's first cut; the scanner below reads fences the CommonMark way. */
export const isFenceLine = (trimmed: string): boolean => trimmed.startsWith('```') || trimmed.startsWith('~~~');
/** A line as the marker rules see it: terminator, a leading BOM and trailing whitespace dropped. */
const bareLine = (line: string): string => stripEnd(line).replace(/^\uFEFF/, '').trimEnd();

// ─── Markdown regions (CommonMark) ───────────────────────────────────────────
//
// Text in fenced code, in a raw HTML block (<pre>, <script>, <style>,
// <textarea>) or in a multi-line HTML comment is shown as code, or not shown
// at all — a marker line there is an example, never a marker. The rules are
// CommonMark's:
//   - a fence opens on a line of 3+ backticks or tildes indented at most 3
//     spaces (a backtick fence's info string has no backtick); it closes on a
//     line of the same character, at least as long, with nothing after it but
//     spaces or tabs, indented at most 3 spaces. A fence right after a list
//     marker (`- ```bash`) sits at the item's content column: its closer may
//     sit there too, and a later line indented less (the item has ended) ends
//     it. A fence that never closes runs to the end of the file.
//   - a raw HTML block opens on a line starting `<pre`, `<script`, `<style` or
//     `<textarea` and ends at the first line (that one included) with
//     `</pre>`, `</script>`, `</style>` or `</textarea>`;
//   - a comment opens on a line starting `<!--` and ends at the first line
//     (that one included) holding `-->` — so a single-line comment, faf's own
//     marker lines among them, opens nothing.

type Region =
  | { kind: 'fence'; char: string; len: number; col: number }
  | { kind: 'raw'; tag: string }
  | { kind: 'comment' };

/** A line's leading indentation in columns (a tab advances to the next
 *  multiple of 4), and the text after it. */
function indentOf(line: string): { width: number; rest: string } {
  let width = 0;
  let i = 0;
  for (; i < line.length; i++) {
    if (line[i] === ' ') {width++;} else if (line[i] === '\t') {width += 4 - (width % 4);} else {break;}
  }
  return { width, rest: line.slice(i) };
}

const RAW_OPEN = /^<(pre|script|style|textarea)(?=[\s>]|$)/i;
const RAW_CLOSE = /<\/(?:pre|script|style|textarea)>/i;
const LIST_MARKER = /^(?:[-+*]|\d{1,9}[.)])( {1,4}|\t)/;

/** The fence `rest` (a line after its indentation) opens, at column `col`. */
function fenceAt(rest: string, col: number): Region | null {
  const m = /^(`{3,}|~{3,})(.*)$/.exec(rest);
  if (!m || (m[1][0] === '`' && m[2].includes('`'))) {return null;}
  return { kind: 'fence', char: m[1][0], len: m[1].length, col };
}

/** The region a line outside every region opens, or null. */
function regionOpenedBy(content: string): Region | null {
  const { width, rest } = indentOf(content);
  if (width > 3) {return null;}
  const fence = fenceAt(rest, 0);
  if (fence) {return fence;}
  const item = LIST_MARKER.exec(rest);
  if (item) {
    const after = rest.slice(item[0].length);
    const inner = indentOf(after);
    if (inner.width <= 3) {
      const col = width + item[0].length + inner.width;
      const listFence = fenceAt(inner.rest, col);
      if (listFence) {return listFence;}
    }
  }
  const raw = RAW_OPEN.exec(rest);
  if (raw) {return RAW_CLOSE.test(rest) ? null : { kind: 'raw', tag: raw[1].toLowerCase() };}
  if (rest.startsWith('<!--')) {return rest.includes('-->') ? null : { kind: 'comment' };}
  return null;
}

/** True when `content` is the line that closes `open` (the line is part of the region). */
function closesRegion(open: Region, content: string): boolean {
  if (open.kind === 'raw') {return RAW_CLOSE.test(content);}
  if (open.kind === 'comment') {return content.includes('-->');}
  const { width, rest } = indentOf(content);
  if (width < open.col || width > open.col + 3) {return false;}
  const m = /^(`+|~+)[ \t]*$/.exec(rest);
  return !!m && m[1][0] === open.char && m[1].length >= open.len;
}

/** The line that closes `open`, for a body faf renders. */
function closerOf(open: Region): string {
  if (open.kind === 'raw') {return `</${open.tag}>`;}
  if (open.kind === 'comment') {return '-->';}
  return open.char.repeat(open.len);
}

/** Walks a text line by line and says which lines sit in a region. */
class Regions {
  private open: Region | null = null;

  /** Feed one line (terminator and a line-1 BOM removed). True when the line
   *  belongs to a region — its opening and closing lines included — so it is
   *  never a marker. A false line is then passed to {@link after}. */
  inside(content: string): boolean {
    const open = this.open;
    if (!open) {return false;}
    if (open.kind === 'fence' && open.col > 0 && content.trim() !== '' && indentOf(content).width < open.col) {
      this.open = null; // the list item ended, and its fence with it
      return false;
    }
    if (closesRegion(open, content)) {this.open = null;}
    return true;
  }

  /** A line outside every region that was not a marker: it may open one. */
  after(content: string): void {
    this.open = regionOpenedBy(content);
  }

  /** The region still open, when a line of `content` that follows would be
   *  inside it (and so not seen as a marker). */
  hiding(content: string): Region | null {
    const open = this.open;
    if (!open) {return null;}
    const probe = new Regions();
    probe.open = open;
    return probe.inside(content) ? open : null;
  }
}

/**
 * The first line outside every Markdown region for which `isStart` holds, and
 * the first later line outside every region for which `isEnd` holds. Returns
 * the char range covering both lines (the end line's terminator excluded), or
 * null. A leading BOM on line 1 stays outside the range. Marker lines are
 * tested on the line with its terminator and that BOM removed.
 */
export function findMarkedRange(
  text: string,
  isStart: (line: string) => boolean,
  isEnd: (line: string) => boolean,
): { start: number; end: number } | null {
  const regions = new Regions();
  let offset = 0;
  let blockStart = -1;
  for (const line of linesWithEnds(text)) {
    const body = stripEnd(line);
    const bom = offset === 0 && body.charCodeAt(0) === 0xfeff ? 1 : 0;
    const content = body.slice(bom);
    if (!regions.inside(content)) {
      if (blockStart === -1 && isStart(content)) {
        blockStart = offset + bom;
      } else if (blockStart !== -1 && isEnd(content)) {
        return { start: blockStart, end: offset + body.length };
      } else {
        regions.after(content);
      }
    }
    offset += line.length;
  }
  return null;
}

/** A whole marker line at column 0 (trailing whitespace ignored). */
const markerLine = (marker: string) => (line: string): boolean => line.trimEnd() === marker;

/**
 * Locate the faf-managed block in `text`: the first START marker line and the
 * first END marker line after it, both outside fenced code, raw HTML blocks
 * and multi-line HTML comments (see {@link findMarkedRange}). Returns the char
 * range covering both marker lines (terminator of the END line excluded), or
 * null when there is no complete block.
 *
 * Markers are matched as WHOLE LINES at column 0, never as substrings. Substring
 * search was a real bug (7.1.4–7.11.0): renderAgentsMd quoted the marker tokens
 * in its own blockquote, so on every re-run `indexOf(end)` hit the quote, cut
 * the old block in half and appended its stale tail below the new block —
 * `faf export --agents` grew AGENTS.md by ~49 lines per run. The same happened
 * to users who documented the markers in a code fence above the block.
 *
 * Fences are read the CommonMark way (the opening fence's character and
 * length; a closer at least as long with no info string, indented at most 3
 * spaces; an unclosed fence runs to the end of the file), so a ```` fence
 * around a ``` line, a ~~~ fence, an info-string line or an indented ``` never
 * ends a fence early. A START with no END outside a region is not a block:
 * the caller treats "no block" as a user file and prefixes — it never
 * reclaims. faf's own rendered body never leaves a region open (see
 * {@link wrapFafBlock}), so its END line is always found.
 */
export function findFafBlock(
  text: string,
  start: string = FAF_START,
  end: string = FAF_END,
): { start: number; end: number } | null {
  return findMarkedRange(text, markerLine(start), markerLine(end));
}

/** faf's own body, made safe to wrap between its markers:
 *   - a body line that is itself a whole marker line (a .faf value that
 *     documents the markers, say) would let the next write cut the block there
 *     and grow the file every run — it is indented one space: no longer a
 *     column-0 marker, and the text is unchanged;
 *   - a body that leaves fenced code, a raw HTML block or a comment open (a
 *     .faf value holding a ``` line, say) would hide the END line from the
 *     next scan, and faf would prefix a second block — the region is closed
 *     on a line of its own at the end of the body. */
function guardBody(body: string, start: string, end: string): string {
  const lines = linesWithEnds(body).map(line => {
    const bare = bareLine(line);
    return bare === start || bare === end ? ` ${line}` : line;
  });
  const regions = new Regions();
  for (const line of lines) {
    const content = stripEnd(line);
    if (!regions.inside(content)) {regions.after(content);}
  }
  const open = regions.hiding(end);
  const text = lines.join('');
  return open ? `${text}\n${closerOf(open)}` : text;
}

/** The managed block: START, the body (guarded — see guardBody), END. */
export function wrapFafBlock(block: string, start: string = FAF_START, end: string = FAF_END): string {
  return `${start}\n${guardBody(block.trim(), start, end)}\n${end}`;
}

/** The file's new text: `existing` (null when there is no file) with `wrapped`
 *  as its managed block. */
export function withFafBlock(existing: string | null, wrapped: string, start: string = FAF_START, end: string = FAF_END): string {
  // 1. No file → just the block.
  if (existing === null) {return `${wrapped}\n`;}

  // 2. A complete block → replace only the managed block; keep everything around it.
  const found = findFafBlock(existing, start, end);
  if (found) {return `${existing.slice(0, found.start)}${wrapped}${existing.slice(found.end)}`;}

  // 3. Everything else → prefix the block and keep every byte already there. A
  //    file with no marker lines is the user's, whatever its first line says —
  //    a faf-looking stamp or footer proves nothing. A leading BOM stays at byte 0.
  const bom = existing.startsWith(BOM) ? BOM : '';
  return `${bom}${wrapped}\n\n${existing.slice(bom.length)}`;
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

/**
 * The one line the CLI prints when faf's block goes on top of a file whose
 * first line is faf's old metastamp (`<!-- faf: … -->`) and that has no block
 * of its own — or null. faf never reclaims such a file (it cannot prove it
 * wrote the text), so the old faf text stays below the new block; the note
 * says so. `label` names the file (`CLAUDE.md`). `existing` is the file's
 * text before the write (null when there was none).
 */
export function legacyStampNote(
  label: string,
  existing: string | null,
  start: string = FAF_START,
  end: string = FAF_END,
): string | null {
  if (existing === null || findFafBlock(existing, start, end)) {return null;}
  const first = bareLine(linesWithEnds(existing)[0] ?? '');
  if (!first.startsWith(LEGACY_STAMP) || first === start || first === end) {return null;}
  return `${label}: faf's block is now on top; the old faf text below it is left as you had it — delete it by hand if you no longer want it.`;
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
