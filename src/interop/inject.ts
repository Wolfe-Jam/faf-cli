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
 * note the space). Every faf-generated file begins with it and a user never
 * hand-writes it — so a MARKERLESS file led by it is legacy faf output we can
 * safely reclaim, never genuine user content. The trailing space matters: the
 * START marker `<!-- faf:start -->` must not match this fingerprint.
 */
const FAF_METASTAMP = '<!-- faf: ';

/** Split into lines keeping each line's own terminator (\r\n, \r or \n). */
function linesWithEnds(text: string): string[] {
  return text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g)?.filter((l, i, a) => l !== '' || i < a.length - 1) ?? [];
}

const stripEnd = (line: string): string => line.replace(/\r?\n$|\r$/, '');
const isFenceLine = (trimmed: string): boolean => trimmed.startsWith('```') || trimmed.startsWith('~~~');

/** One scan. START must be a whole marker line at column 0 (trailing whitespace
 *  and the line terminator ignored); when `fenceAware`, START candidates inside
 *  fenced code are skipped. END is the first whole marker line AFTER START —
 *  fence state is deliberately ignored there, so an unbalanced fence pasted
 *  into the block can never hide the real end marker. */
function scanForBlock(text: string, start: string, end: string, fenceAware: boolean): { start: number; end: number } | null {
  let offset = 0;
  let inFence = false;
  let blockStart = -1;
  for (const line of linesWithEnds(text)) {
    const body = stripEnd(line);
    // A leading BOM on line 1 stays outside the managed range.
    const bom = offset === 0 && body.charCodeAt(0) === 0xfeff ? 1 : 0;
    const content = body.slice(bom);
    const atColumn0 = content.trimEnd();
    if (blockStart === -1) {
      if (fenceAware && isFenceLine(content.trim())) {inFence = !inFence;}
      else if (!inFence && atColumn0 === start) {blockStart = offset + bom;}
    } else if (atColumn0 === end) {
      return { start: blockStart, end: offset + body.length };
    }
    offset += line.length;
  }
  return null;
}

/** True when `marker` appears as a whole line anywhere in `text`. */
function hasMarkerLine(text: string, marker: string): boolean {
  return linesWithEnds(text).some(l => stripEnd(l).replace(/^\uFEFF/, '').trimEnd() === marker);
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
 * unclosed fence), so if the first pass finds nothing the second ignores fences
 * entirely. A miss must never be silent: the caller treats "no block" as a
 * user file and prefixes — it does not overwrite.
 */
export function findFafBlock(
  text: string,
  start: string = FAF_START,
  end: string = FAF_END,
): { start: number; end: number } | null {
  return scanForBlock(text, start, end, true) ?? scanForBlock(text, start, end, false);
}

/**
 * Non-destructively write a faf-managed block into a file.
 *
 *   - file does not exist     → create it containing just the block
 *   - file has the markers    → replace ONLY the content between them (update in place)
 *   - legacy faf file         → metastamp-led, no marker lines: reclaim in place
 *   - file exists, no block   → PREFIX the block; everything the user wrote is preserved
 *
 * Idempotent: re-running updates the managed block in place and never duplicates
 * it or touches a byte the user owns. faf owns what's between the markers; the
 * user owns everything else. Enhance, never replace.
 */
export function injectFafBlock(
  path: string,
  block: string,
  start: string = FAF_START,
  end: string = FAF_END,
): void {
  const wrapped = `${start}\n${block.trim()}\n${end}`;

  // 1. No file → create it with just the block.
  if (!existsSync(path)) {
    writeFileSync(path, `${wrapped}\n`, 'utf-8');
    return;
  }

  const existing = readFileSync(path, 'utf-8');

  // 2. Complete block present → replace only the managed block; keep everything around it.
  const found = findFafBlock(existing, start, end);
  if (found) {
    writeFileSync(path, `${existing.slice(0, found.start)}${wrapped}${existing.slice(found.end)}`, 'utf-8');
    return;
  }

  // 3. Legacy faf file — led by faf's own metastamp fingerprint and carrying no
  //    marker line at all. faf reclaims its own output (upgrade in place; no
  //    duplication). A file that has a marker line but no complete block is NOT
  //    legacy output: it falls through to 4 so nothing the user wrote is overwritten.
  if (existing.trimStart().startsWith(FAF_METASTAMP) && !hasMarkerLine(existing, start) && !hasMarkerLine(existing, end)) {
    writeFileSync(path, `${wrapped}\n`, 'utf-8');
    return;
  }

  // 4. Genuine user file → prefix the block; preserve all existing content.
  writeFileSync(path, `${wrapped}\n\n${existing}`, 'utf-8');
}
