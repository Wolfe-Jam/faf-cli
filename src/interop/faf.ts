import { lstatSync } from 'fs';
import { join, dirname, basename, resolve } from 'path';
import { execFileSync } from 'child_process';
import { isMap, isScalar, parse, stringify, type Document } from 'yaml';
import type { FafData } from '../core/types.js';
import { asFafMapping, describeShape } from '../core/shape.js';
import { isPlaceholder } from '../core/slots.js';
import { readBytesIfPresent, readUtf8, resolveInside, safeWriteFile } from '../core/safe-write.js';
import { applyMapData, editYaml } from '../core/yaml-edit.js';
import { fafSourceOf, setFafSource, type FafSource } from '../core/faf-source.js';

/** The real path to read for the .faf at `path`. A link must stay inside the
 *  folder the .faf sits in and end at a .faf/.fafm file — `project.faf →
 *  ~/.aws/credentials` or `project.faf → .env` throws a SafePathError, and
 *  nothing is read. */
function fafToRead(path: string): string {
  const full = resolve(path);
  return resolveInside(dirname(full), full, { read: true });
}

/** Read and parse a .faf file. Always a mapping: an empty file reads as `{}`;
 *  a file that parses to a scalar or a list throws a clear Error instead of
 *  handing callers a value they would spread into character keys. A link that
 *  leaves the folder, or does not end at a .faf/.fafm file, is refused, and so
 *  is a file that is not UTF-8. The data remembers the text it was read from:
 *  writeFaf refuses to write it back over a file that changed since. */
export function readFaf(path: string): FafData {
  const real = fafToRead(path);
  const text = readUtf8(real);
  const data = asFafMapping(parse(text), path) as FafData;
  setFafSource(data, { real, text });
  return data;
}

/** Serialize .faf data to YAML text — the exact bytes writeFaf writes for a
 *  new file (an existing file is updated in place instead).
 *
 *  If `data._meta.found` is present, it's stripped before serialization and
 *  rendered as a `# found: <list>` YAML comment next to the `type:` field —
 *  Glass Hood doctrine: the user sees WHY the cli classified the project as
 *  it did. `_meta` is a runtime hint, never a serialized .faf field. Used by
 *  writeFaf and by `faf git --stdout`. */
export function serializeFaf(data: FafData): string {
  const meta = (data as FafData & { _meta?: { found?: string[] } })._meta;
  // Strip _meta before serialization — it's never part of the .faf schema.
  const cleanData: FafData = { ...data };
  delete (cleanData as Record<string, unknown>)._meta;

  let text = stringify(cleanData, { lineWidth: 0 });

  // Inject `# found: ...` next to `type:` if rationale was provided.
  if (meta?.found && meta.found.length > 0) {
    const comment = meta.found.join(' + ');
    // Match `  type: <value>` — only inject if there isn't already a comment.
    text = text.replace(
      /^(\s+type:\s+\S+)(\s*)$/m,
      (match, prefix: string, trailing: string) => {
        if (trailing.includes('#')) {return match;}
        return `${prefix}  # found: ${comment}`;
      },
    );
  }

  return text;
}

/** What {@link updateFafFile} did. */
export interface UpdateFafResult {
  /** True when the file changed on disk; false when the change was a no-op and
   *  nothing was written. */
  written: boolean;
  /** The file's text after the update (its original text when nothing changed). */
  text: string;
}

/**
 * Update an existing .faf in place, keeping every byte the change does not
 * touch. The file is parsed with yaml's `parseDocument`; `mutate` changes the
 * Document through its node APIs (`doc.setIn(['stack', 'database'], 'Postgres')`,
 * `doc.deleteIn([...])`, `doc.getIn([...], true)`); only the text of the nodes
 * that changed is rewritten. Comments, blank lines, key order, quoting, scalar
 * source text (`version: 1.10`, `0x1F90`, a 20-digit integer), anchors, unknown
 * keys (a user's own `_meta` included), CRLF and a BOM survive — nothing folds
 * at 80 columns. When the change leaves the document as it was, nothing is
 * written (`written: false`).
 *
 * The file must exist. The same link rules as {@link readFaf} (a link must
 * stay in the folder and end at a .faf/.fafm file) and the atomic write of
 * `safeWriteFile` apply; the write itself goes only through a link to a file
 * of the same name. A file that is not valid YAML, or not UTF-8, is refused
 * (nothing written); so is anything `mutate` throws, and so is a file that
 * changed on disk while faf was writing.
 */
export function updateFafFile(path: string, mutate: (doc: Document) => void): UpdateFafResult {
  return updateFaf(path, mutate, undefined);
}

/** updateFafFile, checked against `base` — the read the caller's data came
 *  from — when it is a read of this same file. */
function updateFaf(path: string, mutate: (doc: Document) => void, base: FafSource | undefined): UpdateFafResult {
  const real = fafToRead(path);
  const text = readUtf8(real);
  const result = editYaml(text, mutate, path);
  if (!result.changed) {return { written: false, text };}
  // The file must still be what the caller's data was read from (else a stale
  // read would write over a newer edit), and what faf read here.
  safeWriteFile(path, result.text, { expect: base && base.real === real ? base.text : text });
  return { written: true, text: result.text };
}

/** Options for {@link writeFaf}. */
export interface WriteFafOptions {
  /** Write a fresh file from `data` even when one exists — the explicit
   *  overwrite (`faf init --force`, `faf git --force`). Default: an existing
   *  file is updated in place with {@link updateFafFile}. */
  replace?: boolean;
}

/** True when something is already at `path` (a file or a link). */
function exists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

/** `project.type` as the file has it, before a write. */
function projectType(doc: Document): unknown {
  const node = doc.getIn(['project', 'type'], true);
  return isScalar(node) ? node.value : node;
}

/** Make the .faf Document hold `data`. faf's runtime `_meta` (detection
 *  rationale) is never written: a `_meta` in `data` is faf's own unless the
 *  file already carries a `_meta` key — then it is the user's, kept like any
 *  other key. The `# found:` rationale is written only next to a `type:` this
 *  write fills; a type already in the file is left exactly as it is. */
function applyFafData(doc: Document, data: FafData, path: string): void {
  const root = doc.contents;
  if (root !== null && root !== undefined && !isMap(root)) {
    throw new Error(`${path}: a .faf must be a YAML mapping (key: value pairs), but this one is ${describeShape(doc.toJS())}. faf left it unchanged — fix it by hand.`);
  }
  const fileHasMeta = isMap(root) && root.items.some(p => isScalar(p.key) && p.key.value === '_meta');
  const { _meta: meta, ...rest } = data as FafData & { _meta?: { found?: string[] } };
  const typeBefore = projectType(doc);
  const map = isMap(root) ? root : doc.createNode({});
  doc.contents = map;
  applyMapData(doc, map, fileHasMeta ? { ...data } : rest);
  if (!fileHasMeta) {addFoundRationale(doc, meta?.found, typeBefore);}
}

/** `# found: …` next to `project.type` — only when this write filled it. */
function addFoundRationale(doc: Document, found: string[] | undefined, typeBefore: unknown): void {
  if (!found || found.length === 0 || !isPlaceholder(typeBefore)) {return;}
  const node = doc.getIn(['project', 'type'], true);
  if (isScalar(node) && !isPlaceholder(node.value) && (node.comment === null || node.comment === undefined)) {
    node.comment = ` found: ${found.join(' + ')}`;
  }
}

/** Write a .faf file from data — atomically (temp file, fsync, rename; a
 *  failure leaves the original as it was), and never through a link that
 *  leaves the folder or dangles (SafePathError). An in-project link is written
 *  through and stays a link.
 *
 *  An existing file is updated in place ({@link updateFafFile}): only the
 *  values that differ from `data` are rewritten, so comments, formatting,
 *  source text and key order survive, and a write that changes nothing writes
 *  nothing. A key the file has and `data` leaves out is kept (faf removes
 *  nothing it did not write). Pass `{ replace: true }` to overwrite the file
 *  with a fresh render instead. Returns false when nothing was written.
 *
 *  When `data` came from readFaf of this file (directly, or through
 *  updateExistingFaf), the write is refused if the file changed on disk since
 *  that read (SafePathError `changed`: "not written; original kept"), so an
 *  edit made meanwhile is never written over. A new file is not written over
 *  one that appeared meanwhile. */
export function writeFaf(path: string, data: FafData, opts: WriteFafOptions = {}): boolean {
  if (!opts.replace && exists(path)) {
    const result = updateFaf(path, doc => applyFafData(doc, data, path), fafSourceOf(data));
    setFafSource(data, { real: fafToRead(path), text: result.text });
    return result.written;
  }
  const full = resolve(path);
  const text = serializeFaf(data);
  const expect = exists(path) ? readBytesIfPresent(resolveInside(dirname(full), full)) : null;
  const real = safeWriteFile(path, text, { expect });
  setFafSource(data, { real, text });
  return true;
}

/** Read raw YAML text from a .faf file (the same link rules as readFaf; a
 *  file that is not UTF-8 is refused). */
export function readFafRaw(path: string): string {
  return readUtf8(fafToRead(path));
}

/** Parse .faf data from a YAML string — e.g. the output of `git show <ref>:project.faf`.
 *  The readers above are path-only; `faf diff` needs to parse a version that
 *  lives in git history, never on disk. */
export function readFafFromString(text: string): FafData {
  return parse(text) as FafData;
}

/** True when `full` is a .faf faf may read: a regular file, or a link that
 *  stays inside `folder` and ends at a .faf/.fafm file. Nothing there, or a
 *  folder that happens to be named `.faf`, is not a candidate. A link that
 *  leaves `folder`, dangles or ends anywhere else throws a SafePathError —
 *  refused out loud, never skipped (skipping would let `faf init` create a
 *  file through it). */
function isFafCandidate(folder: string, full: string): boolean {
  let st;
  try {
    st = lstatSync(full);
  } catch {
    return false;
  }
  if (!st.isSymbolicLink() && !st.isFile()) {return false;}
  resolveInside(folder, resolve(full), { read: true });
  return true;
}

/** Find the .faf file in a directory (walks up one level). The path is
 *  returned as spelled; a symlinked candidate must pass the readFaf link rules
 *  or this throws a SafePathError. */
export function findFafFile(dir: string = process.cwd()): string | null {
  const candidates = ['project.faf', '.faf'];
  // Use path.join for cross-platform separator handling — earlier
  // template-literal `${dir}/${name}` produced forward-slash paths
  // even on Windows, breaking strict path equality and any consumer
  // that path-compared the result.
  for (const name of candidates) {
    const full = join(dir, name);
    if (isFafCandidate(dir, full)) {return full;}
  }
  // Walk up one level — use path.dirname for cross-platform parent
  // resolution. The earlier regex `dir.replace(/\/[^/]+$/, '')`
  // only matched POSIX separators and silently no-op'd on Windows.
  const parent = dirname(dir);
  if (parent !== dir) {
    for (const name of candidates) {
      const full = join(parent, name);
      if (isFafCandidate(parent, full)) {return full;}
    }
  }
  return null;
}

/** Repo-root-relative path of a .faf, computed BY git — runtime- and OS-independent.
 *  Replaces `path.relative(top, fafPath)`, which breaks on Windows when git's
 *  long-form `--show-toplevel` and an 8.3 short-name cwd (e.g. `RUNNER~1`) disagree.
 *  git resolves both representations internally and emits forward slashes; works for
 *  tracked AND untracked .faf (it's the cwd's location under the root, not file status).
 *  Caller must already be inside a git repo. */
export function gitRepoRel(fafPath: string, cwd: string = process.cwd()): string {
  const prefix = execFileSync('git', ['-C', dirname(fafPath), 'rev-parse', '--show-prefix'], {
    cwd,
    encoding: 'utf-8',
  }).trim(); // '' at repo root, or 'sub/dir/' (trailing slash)
  return prefix + basename(fafPath);
}
