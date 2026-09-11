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
export const isFenceLine = (trimmed: string): boolean => trimmed.startsWith('```') || trimmed.startsWith('~~~');
/** A line as the marker rules see it: terminator, a leading BOM and trailing whitespace dropped. */
const bareLine = (line: string): string => stripEnd(line).replace(/^\uFEFF/, '').trimEnd();

interface Scan {
  block: { start: number; end: number } | null;
  /** Offset of the fence line left open at the end of a fence-aware scan
   *  that found no START (-1 when every fence closed, or START was found). */
  openFence: number;
}

/** One scan, from char offset `from` (a line start). START must be a whole
 *  marker line at column 0 (trailing whitespace and the line terminator
 *  ignored); when `fenceAware`, START candidates inside fenced code are
 *  skipped. END is the first whole marker line AFTER START — fence state is
 *  deliberately ignored there, so an unbalanced fence pasted into the block
 *  can never hide the real end marker. */
function scanForBlock(text: string, start: string, end: string, fenceAware: boolean, from = 0): Scan {
  let offset = 0;
  let inFence = false;
  let openedAt = -1;
  let blockStart = -1;
  for (const line of linesWithEnds(text)) {
    if (offset < from) {
      offset += line.length;
      continue;
    }
    const body = stripEnd(line);
    // A leading BOM on line 1 stays outside the managed range.
    const bom = offset === 0 && body.charCodeAt(0) === 0xfeff ? 1 : 0;
    const content = body.slice(bom);
    const atColumn0 = content.trimEnd();
    if (blockStart === -1) {
      if (fenceAware && isFenceLine(content.trim())) {
        inFence = !inFence;
        if (inFence) {openedAt = offset;}
      } else if (!inFence && atColumn0 === start) {blockStart = offset + bom;}
    } else if (atColumn0 === end) {
      return { block: { start: blockStart, end: offset + body.length }, openFence: -1 };
    }
    offset += line.length;
  }
  return { block: null, openFence: blockStart === -1 && inFence ? openedAt : -1 };
}

/**
 * Locate the faf-managed block in `text`: the first START marker line and the
 * first END marker line after it. Returns the char range covering both marker
 * lines (terminator of the END line excluded), or null when there is no
 * complete block.
 *
 * Markers are matched as WHOLE LINES at column 0, never as substrings. Substring
 * search was a real bug (7.1.4–7.11.0): renderAgentsMd quoted the marker tokens
 * in its own blockquote, so on every re-run `indexOf(end)` hit the quote, cut
 * the old block in half and appended its stale tail below the new block —
 * `faf export --agents` grew AGENTS.md by ~49 lines per run. The same happened
 * to users who documented the markers in a code fence above the block.
 *
 * Two passes. The first skips START candidates inside fenced code, so a fenced
 * example is not mistaken for the block. Fence detection is a plain toggle and
 * Markdown has shapes it misreads (list-item fences, ```` around ```, a stray
 * unclosed fence). Only when the first pass ENDS INSIDE AN UNCLOSED FENCE — the
 * one sign of a misread — does a second pass ignore fences, and only from the
 * fence left open onward. Balanced fenced examples, including ones above that
 * open fence, are never taken over. A miss must never be silent: the caller
 * treats "no block" as a user file and prefixes — it does not overwrite.
 */
export function findFafBlock(
  text: string,
  start: string = FAF_START,
  end: string = FAF_END,
): { start: number; end: number } | null {
  const aware = scanForBlock(text, start, end, true);
  if (aware.block || aware.openFence === -1) {return aware.block;}
  return scanForBlock(text, start, end, false, aware.openFence).block;
}

/** A rendered body line that is itself a whole marker line (a .faf value that
 *  documents the markers, say) would let the next write cut the block there and
 *  grow the file every run. Indent it one space: no longer a column-0 marker,
 *  and the text is unchanged. */
function guardBody(body: string, start: string, end: string): string {
  return linesWithEnds(body)
    .map(line => {
      const bare = bareLine(line);
      return bare === start || bare === end ? ` ${line}` : line;
    })
    .join('');
}

/** The managed block: START, the body (marker-shaped body lines guarded), END. */
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
