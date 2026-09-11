import { readFileSync, writeFileSync, existsSync } from 'fs';

/**
 * Block markers for the faf-managed front section.
 *
 * Markdown files (AGENTS.md, CLAUDE.md, GEMINI.md) use HTML comments; non-markdown
 * files (.cursorrules) pass hash-comment markers via the `start`/`end` args.
 */
export const FAF_START = '<!-- faf:start -->';
export const FAF_END = '<!-- faf:end -->';

/**
 * faf's own metastamp fingerprint (fafMetaTag output: `<!-- faf: name | … -->`,
 * note the space). faf output from before the markers existed begins with it.
 * The trailing space matters: the START marker `<!-- faf:start -->` must not
 * match this fingerprint.
 */
const FAF_METASTAMP = '<!-- faf: ';

/**
 * faf's own sync footer — the last line of every CLAUDE.md faf rendered before
 * the markers existed: `*STATUS: BI-SYNC ACTIVE — <ISO>*` (≤7.12.0) or
 * `*STATUS: SYNC ACTIVE — <ISO>*` (7.12.1+). The metastamp opens faf's legacy
 * output and this line closes it; whatever follows it was written by someone else.
 */
const FAF_FOOTER = /^\*STATUS: (?:BI-)?SYNC ACTIVE — .*\*$/;

const BOM = '\uFEFF';

/** Split into lines keeping each line's own terminator (\r\n, \r or \n). */
function linesWithEnds(text: string): string[] {
  return text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g)?.filter((l, i, a) => l !== '' || i < a.length - 1) ?? [];
}

const stripEnd = (line: string): string => line.replace(/\r?\n$|\r$/, '');
const isFenceLine = (trimmed: string): boolean => trimmed.startsWith('```') || trimmed.startsWith('~~~');
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

/** True when `marker` appears as a whole line anywhere in `text`. */
function hasMarkerLine(text: string, marker: string): boolean {
  return linesWithEnds(text).some(l => bareLine(l) === marker);
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

/**
 * Where faf's legacy output ends: the end of its footer line (terminator
 * excluded). Legacy output is a file led by faf's metastamp, carrying no marker
 * line, and closed by faf's footer line — the first one wins, so the least text
 * is claimed. Returns -1 when any of the three is missing: faf cannot prove it
 * wrote that file, so it is a user file.
 */
function legacyOutputEnd(text: string, start: string, end: string): number {
  if (!text.trimStart().startsWith(FAF_METASTAMP)) {return -1;}
  if (hasMarkerLine(text, start) || hasMarkerLine(text, end)) {return -1;}
  let offset = 0;
  for (const line of linesWithEnds(text)) {
    if (FAF_FOOTER.test(bareLine(line))) {return offset + stripEnd(line).length;}
    offset += line.length;
  }
  return -1;
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

/**
 * Non-destructively write a faf-managed block into a file.
 *
 *   - file does not exist     → create it containing just the block
 *   - file has the markers    → replace ONLY the content between them (update in place)
 *   - legacy faf output       → metastamp-led, no marker lines, faf's footer line present:
 *                               replace from the start through that footer line; every
 *                               byte after it is kept
 *   - anything else           → PREFIX the block; everything already there is preserved
 *                               (a leading BOM stays at byte 0)
 *
 * Idempotent: re-running updates the managed block in place and never duplicates
 * it or touches a byte the user owns. faf replaces only text it can prove it
 * wrote — what's between its markers, or its own legacy output bounded by its
 * metastamp and footer. Enhance, never replace.
 */
export function injectFafBlock(
  path: string,
  block: string,
  start: string = FAF_START,
  end: string = FAF_END,
): void {
  const wrapped = `${start}\n${guardBody(block.trim(), start, end)}\n${end}`;

  // 1. No file → create it with just the block.
  if (!existsSync(path)) {
    writeFileSync(path, `${wrapped}\n`, 'utf-8');
    return;
  }

  const existing = readFileSync(path, 'utf-8');
  const bom = existing.startsWith(BOM) ? BOM : '';

  // 2. Complete block present → replace only the managed block; keep everything around it.
  const found = findFafBlock(existing, start, end);
  if (found) {
    writeFileSync(path, `${existing.slice(0, found.start)}${wrapped}${existing.slice(found.end)}`, 'utf-8');
    return;
  }

  // 3. Legacy faf output (pre-marker CLAUDE.md): replace it through its footer
  //    line; notes appended after the footer are kept byte-for-byte. No footer →
  //    faf cannot prove where its output ends, so it falls through to 4.
  const legacyEnd = legacyOutputEnd(existing, start, end);
  if (legacyEnd !== -1) {
    writeFileSync(path, `${bom}${wrapped}${existing.slice(legacyEnd)}`, 'utf-8');
    return;
  }

  // 4. Everything else → prefix the block; preserve all existing content.
  writeFileSync(path, `${bom}${wrapped}\n\n${existing.slice(bom.length)}`, 'utf-8');
}
