/**
 * Whole-file ownership — faf replaces a whole file it renders (project.html,
 * the Server Card, the A2A card, `faf server-card --out`, a `faf taf --output`
 * snapshot) only when the file is byte for byte what faf last wrote there.
 *
 * A mark (`Visual render of project.faf`, `_meta["one.faf/context"]`) only
 * shows that faf wrote the file once: a hand edit made after that — a section
 * added to the page, a `tools` list or a `remotes` endpoint added to the card —
 * still carries the mark, and a rewrite would lose it. So every whole file faf
 * renders records a hash of its own content:
 *
 *   - project.html: a `<meta name="faf-render" content="sha256:…">` line, the
 *     hash of the document without that line;
 *   - a JSON file: `_meta["one.faf/render"] = "sha256:…"`, the hash of the
 *     text without that key. The MCP Server Card and the registry server.json
 *     schemas leave `_meta` open for namespaced keys; the A2A Agent Card has no
 *     `_meta`, and the A2A spec says implementations SHOULD ignore a field they
 *     do not know (the official Python and Go SDKs do).
 *
 * On a rewrite faf recomputes the hash. A match means faf owns every byte, so
 * it replaces the file. A mismatch means the file was edited since faf wrote
 * it: faf refuses in one line and leaves it byte for byte. A file with faf's
 * mark but no hash was written before 7.13: faf takes it as its own only when
 * it is exactly faf's render of the current project.faf (and then leaves it,
 * as there is nothing to change), else refuses once. `force` (`--force`)
 * replaces any of these.
 *
 * Line endings: a checkout with git's `core.autocrlf` ends every line of a
 * file faf wrote with CRLF. A file whose only difference from faf's text is
 * that — every line ending CRLF — is still faf's: the hash is compared with
 * the CRLF line ends read as LF, and the new render is written with CRLF.
 */
import { createHash } from 'crypto';
import { resolve } from 'path';
import { SafePathError, readBytesIfPresent, resolveInside, safeWriteFile } from './safe-write.js';
import { editJsonText, locateJsonKey, removeJsonKey } from './json-edit.js';

/** The `_meta` key a JSON file faf renders carries its render hash under. */
export const RENDER_KEY = 'one.faf/render';

/** `sha256:<hex>` of `text` (UTF-8). */
export function renderHash(text: string): string {
  return `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
}

const HASH = /^sha256:[0-9a-f]{64}$/;

/** How faf records its hash in a file: an HTML meta line, or a JSON `_meta` key. */
export type RenderFormat = 'html' | 'json';

// ── project.html ───────────────────────────────────────────────────────────────

const HTML_LINE = /^<meta name="faf-render" content="(sha256:[0-9a-f]{64})">$/;
/** Any line that starts like faf's render line: one that is not exactly faf's
 *  form (a trailing space, an upper-case hash) is faf's line, edited. */
const HTML_LINE_START = '<meta name="faf-render"';
const HTML_ANCHOR = '<meta name="description" content="Visual render of project.faf.';

/** `doc` with faf's render line added after its description line (or at the top). */
function stampHtml(doc: string): string {
  const lines = doc.split(/(?<=\n)/);
  const at = lines.findIndex(l => l.startsWith(HTML_ANCHOR));
  lines.splice(at + 1, 0, `<meta name="faf-render" content="${renderHash(doc)}">\n`);
  return lines.join('');
}

/** The hash a page carries and the page without its render line; 'many'
 *  when it has more than one, or a line that starts like faf's render line
 *  but is not exactly its form (edited since faf wrote it); null when it has
 *  none. */
function splitHtml(text: string): { hash: string; canonical: string } | 'many' | null {
  const lines = text.split(/(?<=\n)/);
  const found: { at: number; hash: string }[] = [];
  let edited = false;
  lines.forEach((l, at) => {
    const bare = l.replace(/\r?\n$/, '');
    const m = HTML_LINE.exec(bare);
    if (m) {
      found.push({ at, hash: m[1] });
    } else if (bare.startsWith(HTML_LINE_START)) {
      edited = true;
    }
  });
  if (found.length === 0 && !edited) {return null;}
  if (found.length !== 1 || edited) {return 'many';}
  lines.splice(found[0].at, 1);
  return { hash: found[0].hash, canonical: lines.join('') };
}

// ── JSON ───────────────────────────────────────────────────────────────────────

const PATH = ['_meta', RENDER_KEY] as const;

/** `text` with faf's render key added to `_meta` (made when missing) — a
 *  text edit, so every other byte stays. */
function stampJson(text: string): string {
  return editJsonText(text, { _meta: { [RENDER_KEY]: renderHash(text) } }).text;
}

/** `text` without a render key (with a `_meta` left empty by that, removed). */
function withoutJsonKey(text: string): string {
  try {
    return removeJsonKey(text, PATH, { dropEmptyParent: true }) ?? text;
  } catch {
    return text;
  }
}

/** The hash a JSON file carries and its text without that key; 'many' when
 *  the key (or `_meta`) is there more than once, or is not a hash; null when
 *  it has none (or the text is not a JSON object). */
function splitJson(text: string): { hash: string; canonical: string } | 'many' | null {
  let found: { count: number; value?: unknown };
  try {
    found = locateJsonKey(text, PATH);
  } catch {
    return null; // not a JSON object (or nested past what the reader takes)
  }
  if (found.count === 0) {return null;}
  if (found.count > 1 || typeof found.value !== 'string' || !HASH.test(found.value)) {return 'many';}
  const canonical = removeJsonKey(text, PATH, { dropEmptyParent: true });
  return canonical === null ? 'many' : { hash: found.value, canonical };
}

/** faf's canonical render (no render hash in it) with the hash added. */
function stamp(format: RenderFormat, canonical: string): string {
  return format === 'html' ? stampHtml(canonical) : stampJson(canonical);
}

/** A render with any render hash already in it taken out — a render hash in a
 *  file faf edits (a server.json copied from an earlier --out) is never hashed. */
function canonicalOf(format: RenderFormat, render: string): string {
  if (format === 'json') {return withoutJsonKey(render);}
  const split = splitHtml(render);
  return split === null || split === 'many' ? render : split.canonical;
}

/**
 * Whether the bytes of a whole file faf renders are exactly what faf wrote:
 * `match` — they carry faf's render hash, the hash is that of the rest of the
 * file, and the file is laid out exactly as faf writes it; `mismatch` — they
 * carry a render hash that no longer fits, or (project.html) a render line
 * that is not exactly faf's form (the file was edited since faf wrote it);
 * `none` — they carry no render hash (a file from before 7.13, or one faf
 * never wrote). The bytes are taken as they are: see {@link writeRendered}
 * for a file git checked out with CRLF line ends.
 */
export function renderOwnership(bytes: Uint8Array, format: RenderFormat): 'match' | 'mismatch' | 'none' {
  const text = new TextDecoder().decode(bytes);
  const split = format === 'html' ? splitHtml(text) : splitJson(text);
  if (split === null) {return 'none';}
  if (split === 'many') {return 'mismatch';}
  const exact = Buffer.from(text, 'utf-8').equals(Buffer.from(bytes)); // valid UTF-8, nothing lost in decoding
  return exact && split.hash === renderHash(split.canonical) && stamp(format, split.canonical) === text ? 'match' : 'mismatch';
}

/** Options for {@link writeRendered}. */
export interface RenderedWriteOptions {
  /** The project folder the write must stay inside. */
  root: string;
  /** How the hash is recorded: `html` (project.html) or `json` (the cards, server.json, a snapshot). */
  format: RenderFormat;
  /** True when the bytes carry faf's older mark — a file faf wrote before render hashes. */
  hasMark: (bytes: Buffer) => boolean;
  /** That mark in words, for the refusal of a file without it. */
  mark: string;
  /** Replace the file whatever it holds — the explicit overwrite (`--force`). */
  force?: boolean;
}

/** What {@link writeRendered} did. */
export type RenderedResult = 'created' | 'updated' | 'unchanged';

/** `bytes` with each CRLF line end read as LF, when every line of the file
 *  ends CRLF (git's `core.autocrlf` checkout) and the bytes are UTF-8; null
 *  otherwise (LF line ends, mixed ones, or none). */
function crlfAsLf(bytes: Buffer): Buffer | null {
  const text = new TextDecoder().decode(bytes);
  if (!text.includes('\r\n') || /(?:^|[^\r])\n/.test(text) || !Buffer.from(text, 'utf-8').equals(bytes)) {return null;}
  return Buffer.from(text.replace(/\r\n/g, '\n'), 'utf-8');
}

/** Ownership of the bytes on disk, or of their LF reading (`lf`) when only
 *  the CRLF line ends keep them from being faf's. */
function ownershipOf(existing: Buffer, lf: Buffer | null, format: RenderFormat): 'match' | 'mismatch' | 'none' {
  const raw = renderOwnership(existing, format);
  return raw !== 'match' && lf !== null && renderOwnership(lf, format) === 'match' ? 'match' : raw;
}

/**
 * Write the whole file faf renders at `path`: `render` (faf's text, without a
 * render hash) with faf's render hash added. The link rules and the atomic,
 * compare-before-rename write are safe-write's. A file already there is
 * replaced only when {@link renderOwnership} says `match`; with a `mismatch`,
 * or with no hash, it is refused (SafePathError `not-owned`) and left byte for
 * byte:
 *   - "<file> was edited since faf wrote it — faf left it unchanged. Use --force to replace it."
 *   - with faf's older mark (written before 7.13): exactly faf's `render` →
 *     nothing to change (`unchanged`); otherwise "<file> has no faf render hash
 *     (written before 7.13), so faf cannot tell whether it was edited — faf
 *     left it unchanged. Use --force once to replace it; after that faf
 *     recognises its own output."
 *   - without the mark: "<file> has no <mark>, so faf did not write it — faf left it unchanged."
 * `force` replaces it anyway. A file already holding exactly the new bytes is
 * not written again. A file whose every line ends CRLF (git's
 * `core.autocrlf`) is judged with those line ends read as LF, and is written
 * back with CRLF line ends.
 */
export function writeRendered(path: string, render: string, opts: RenderedWriteOptions): { path: string; result: RenderedResult } {
  const full = resolve(path);
  const target = resolveInside(opts.root, full);
  const canonical = canonicalOf(opts.format, render);
  const next = stamp(opts.format, canonical);
  const existing = readBytesIfPresent(target);
  if (existing === null) {
    safeWriteFile(target, next, { root: opts.root, expect: null });
    return { path: target, result: 'created' };
  }
  if (existing.equals(Buffer.from(next, 'utf-8'))) {return { path: target, result: 'unchanged' };}
  const lf = crlfAsLf(existing);
  const out = lf === null ? next : next.replace(/\r?\n/g, '\r\n');
  if (lf !== null && existing.equals(Buffer.from(out, 'utf-8'))) {return { path: target, result: 'unchanged' };}
  if (opts.force !== true && !ownedOrRefused(full, existing, lf, canonical, opts)) {return { path: target, result: 'unchanged' };}
  safeWriteFile(target, out, { root: opts.root, expect: existing });
  return { path: target, result: 'updated' };
}

/** For a file already there (`existing`; `lf`, its LF reading when every
 *  line ends CRLF): true when faf may replace it (its render hash matches);
 *  false when it is faf's pre-7.13 render of this very content (nothing to
 *  change); otherwise a SafePathError `not-owned` — see {@link writeRendered}. */
function ownedOrRefused(full: string, existing: Buffer, lf: Buffer | null, canonical: string, opts: RenderedWriteOptions): boolean {
  const state = ownershipOf(existing, lf, opts.format);
  if (state === 'match') {return true;}
  if (state === 'mismatch') {
    throw new SafePathError('not-owned', full, `${full} was edited since faf wrote it — faf left it unchanged. Use --force to replace it.`, { onWrite: true });
  }
  if (!opts.hasMark(existing)) {
    throw new SafePathError('not-owned', full, `${full} has no ${opts.mark}, so faf did not write it — faf left it unchanged.`, { onWrite: true });
  }
  const exact = Buffer.from(canonical, 'utf-8');
  if (existing.equals(exact) || (lf !== null && lf.equals(exact))) {return false;}
  throw new SafePathError(
    'not-owned',
    full,
    `${full} has no faf render hash (written before 7.13), so faf cannot tell whether it was edited — faf left it unchanged. Use --force once to replace it; after that faf recognises its own output.`,
    { onWrite: true },
  );
}
