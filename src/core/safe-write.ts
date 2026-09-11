/**
 * Safe file access — the one primitive every faf writer, and every read of
 * project context, goes through.
 *
 * Rule 1 — stay inside the project. Before faf touches a path it resolves it on
 * disk (realpath: every link followed). If that leads outside the project
 * folder, faf refuses. A dangling link is refused — faf never creates a file at
 * the end of a link. Anything whose real path is inside a `.git` folder is
 * refused, always.
 *
 * Rule 2 — a link leads to the same kind of file. faf follows a link only to a
 * file with the same name (CLAUDE.md → docs/CLAUDE.md), or from one AI context
 * file to another (CLAUDE.md → AGENTS.md; the set is FAF_CONTEXT_FILES). The
 * link itself survives: faf writes the file it points at. `CLAUDE.md →
 * README.md` or `project.html → package.json` is refused — faf would be
 * writing a file it was never asked to write. A read of project context
 * through a link must land on a .faf or .fafm file instead, so `project.faf →
 * .env` is refused even though .env is in the project.
 *
 * Rule 3 — never leave a half-written file. A write goes to a temp file in the
 * same folder, is flushed to disk (fsync), then renamed over the original in
 * one step, keeping the original's permissions. If any step fails the temp
 * file is removed and the original is exactly as it was: "not written;
 * original kept". A plain writeFileSync truncates first, so a full disk, a
 * quota or a killed process used to leave the user's file cut short. With
 * `expect` (the bytes the caller read), the file is read again just before the
 * rename and the write is refused if it changed in the meantime.
 *
 * Rule 4 — text faf edits is UTF-8. readUtf8 decodes strictly: a UTF-16 file or
 * any bytes that are not UTF-8 are refused, never turned into U+FFFD and
 * written back.
 */
import {
  accessSync,
  closeSync,
  constants,
  fchmodSync,
  fchownSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { randomBytes } from 'crypto';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'path';

/** Why a path was refused. */
export type SafePathReason =
  | 'outside'
  | 'dangling'
  | 'not-a-file'
  | 'not-faf'
  | 'other-file'
  | 'git'
  | 'not-utf8'
  | 'changed';

/**
 * A path faf will not read or write, or a file faf will not change. Nothing
 * was written; the file on disk is exactly as it was.
 *   - `outside`, `dangling`, `not-a-file`, `not-faf`, `other-file`, `git`: the
 *     path is refused (see {@link resolveInside}); nothing was read either.
 *   - `not-utf8`: the file is not UTF-8 (see {@link readUtf8}).
 *   - `changed`: the file changed on disk after faf read it (see the `expect`
 *     option of {@link safeWriteFile}).
 */
export class SafePathError extends Error {
  readonly reason: SafePathReason;
  /** The path as the caller named it (absolute). */
  readonly path: string;

  constructor(reason: SafePathReason, path: string, message: string) {
    super(message);
    this.name = 'SafePathError';
    this.reason = reason;
    this.path = path;
  }
}

export interface ResolveInsideOptions {
  /** Resolving for a read of project context: a link must end at a `.faf` or
   *  `.fafm` file. A plain file is read under the name the caller gave. */
  read?: boolean;
}

export interface SafeWriteOptions {
  /** The project folder the write must stay inside. Default: the file's own folder. */
  root?: string;
  /**
   * The bytes the caller read from the file. Just before the rename the file
   * is read again; when it no longer equals `expect`, the temp file is removed
   * and a SafePathError (`changed`) is thrown: "<file> changed on disk while
   * faf was writing — not written; original kept". A string is compared as its
   * UTF-8 bytes. `null` means the caller found no file there: if one has
   * appeared, the write is refused the same way (a missing file stays
   * missing). Omit it to write without the check.
   */
  expect?: string | Uint8Array | null;
}

/**
 * The files faf's block injector writes — one managed block, every other byte
 * of the file kept. Each injector writer (writeClaudeMd, writeAgentsMd,
 * writeGeminiMd, writeCursorrules, writeCopilotInstructions, writeMemoryMd,
 * writeLlmsTxt, writeClaudeMemory) takes its file name from this table, so
 * the set is exactly the files those writers target. A link from one of these
 * names to another (CLAUDE.md → AGENTS.md) may be followed.
 */
export const FAF_CONTEXT_FILES = Object.freeze({
  claude: 'CLAUDE.md',
  agents: 'AGENTS.md',
  gemini: 'GEMINI.md',
  cursorrules: '.cursorrules',
  copilot: 'copilot-instructions.md',
  memory: 'MEMORY.md',
  llms: 'llms.txt',
} as const);

const CONTEXT_NAMES = new Set<string>(Object.values(FAF_CONTEXT_FILES).map(n => n.toLowerCase()));
/** File names compare without case: a case-insensitive disk (macOS, Windows)
 *  spells one name several ways. */
const sameName = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();
const isContextFile = (name: string): boolean => CONTEXT_NAMES.has(name.toLowerCase());

/** True when a path runs through a `.git` folder, or is `.git` itself. */
function inGitDir(p: string): boolean {
  return p.split(/[\\/]/).some(part => part.toLowerCase() === '.git');
}

const FAF_FILE = /\.fafm?$/i;
const realpath = (p: string): string => realpathSync.native(p);
const errnoOf = (e: unknown): string | undefined => (e as NodeJS.ErrnoException | null)?.code;

/** True when `p` is `root` or below it. Both must already be real paths. */
function isInside(root: string, p: string): boolean {
  const rel = relative(root, p);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

/** Where a link points, as written in the link — for error messages only. */
function linkText(p: string): string {
  try {
    return readlinkSync(p);
  } catch {
    return '?';
  }
}

/** Resolve the final component when it is a link: it must exist, stay inside
 *  `root` and out of `.git`, be a regular file and — for a read of project
 *  context — be a .faf/.fafm file; otherwise have the link's own name, or be
 *  an AI context file reached from one. */
function followLink(root: string, requested: string, link: string, read: boolean): string {
  let real: string;
  try {
    real = realpath(link);
  } catch (e) {
    const code = errnoOf(e);
    if (code === 'ENOENT' || code === 'ELOOP' || code === 'ENOTDIR') {
      throw new SafePathError(
        'dangling',
        requested,
        `${requested} is a link to ${linkText(link)}, which does not exist. faf does not create files through a link — refused.`,
      );
    }
    throw e;
  }
  if (!isInside(root, real)) {
    throw new SafePathError('outside', requested, `${requested} is a link to ${real}, outside ${root} — refused.`);
  }
  if (inGitDir(real)) {
    throw new SafePathError('git', requested, `${requested} is a link to ${real}, inside .git/ — refused.`);
  }
  if (!statSync(real).isFile()) {
    throw new SafePathError('not-a-file', requested, `${requested} is a link to ${real}, which is not a regular file — refused.`);
  }
  refuseOtherKind(requested, real, read);
  return real;
}

/** The file at the end of a link must be the kind the caller asked for: for a
 *  read of project context a .faf/.fafm file; otherwise a file with the
 *  link's own name, or an AI context file when the link is one too. */
function refuseOtherKind(requested: string, real: string, read: boolean): void {
  const asked = basename(requested);
  const got = basename(real);
  if (read && !FAF_FILE.test(got)) {
    throw new SafePathError('not-faf', requested, `${requested} is a link to ${real}, which is not a .faf or .fafm file — refused.`);
  }
  if (!read && !sameName(asked, got) && !(isContextFile(asked) && isContextFile(got))) {
    throw new SafePathError(
      'other-file',
      requested,
      `${requested} is a link to ${real}, a file with another name — refused (faf follows a link only to a file of the same name, or from one AI context file to another).`,
    );
  }
}

/**
 * Resolve `name` inside the project folder `dir` and return the real path to
 * read or write — or throw a SafePathError.
 *
 *   - the folder the file sits in must resolve to `dir` or below it
 *   - a path whose real form runs through `.git` → refused, always
 *   - a file that does not exist yet → its path inside the project
 *   - a regular file → its path (spelled as on disk)
 *   - a link → the file it points at, when that exists, is a regular file, is
 *     inside the project and out of `.git`, and has the link's own name (or
 *     both names are AI context files: CLAUDE.md → AGENTS.md). With `read`, the
 *     file must be a .faf/.fafm file instead (`project.faf → config/team.faf`).
 *   - anything else (a link out, a dangling link, a link to a file with
 *     another name, a folder, a device) → refused
 *
 * `name` may be relative to `dir` or absolute. `dir` and the folder `name` sits
 * in must exist (their ENOENT is thrown as is).
 */
export function resolveInside(dir: string, name: string, opts: ResolveInsideOptions = {}): string {
  const root = realpath(resolve(dir));
  const requested = resolve(dir, name);
  const folder = realpath(dirname(requested));
  if (!isInside(root, folder)) {
    throw new SafePathError('outside', requested, `${requested} is in ${folder}, outside ${root} — refused.`);
  }
  const target = join(folder, basename(requested));
  if (inGitDir(target)) {
    throw new SafePathError(
      'git',
      requested,
      target === requested ? `${requested} is inside .git/ — refused.` : `${requested} resolves to ${target}, inside .git/ — refused.`,
    );
  }
  let st;
  try {
    st = lstatSync(target);
  } catch (e) {
    if (errnoOf(e) === 'ENOENT') {return target;}
    throw e;
  }
  if (st.isSymbolicLink()) {return followLink(root, requested, target, opts.read === true);}
  if (!st.isFile()) {
    throw new SafePathError('not-a-file', requested, `${requested} is not a regular file — refused.`);
  }
  // The name as it is on disk (a case-insensitive disk may spell it differently).
  return realpath(target);
}

const UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

/** `bytes` as text, strictly: see {@link readUtf8}. `path` names the file in the refusal. */
function decodeUtf8(bytes: Uint8Array, path: string): string {
  const utf16Bom = bytes.length >= 2 && ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff));
  if (!utf16Bom) {
    try {
      return UTF8.decode(bytes);
    } catch {
      /* not UTF-8: refused below */
    }
  }
  throw new SafePathError('not-utf8', path, `${path} is not UTF-8 — faf left it unchanged`);
}

/**
 * Read a text file faf may write back — strictly as UTF-8. A UTF-8 BOM is kept
 * (U+FEFF at the start of the text, as a plain read gives it). A UTF-16 BOM
 * (FF FE or FE FF) or any byte sequence that is not UTF-8 is refused with a
 * SafePathError (`not-utf8`): "<file> is not UTF-8 — faf left it unchanged". A
 * lenient read would turn those bytes into U+FFFD, and the next write would
 * lose them. Other read errors (ENOENT, EACCES, …) are thrown as they are.
 * `path` is read as given: resolve it with {@link resolveInside} first.
 */
export function readUtf8(path: string): string {
  return decodeUtf8(readFileSync(path), path);
}

/** The bytes at `path`, or null when nothing is there (only ENOENT). */
export function readBytesIfPresent(path: string): Buffer | null {
  try {
    return readFileSync(path);
  } catch (e) {
    if (errnoOf(e) === 'ENOENT') {return null;}
    throw e;
  }
}

/** Refuse the rename when the file is no longer what the caller read. */
function assertUnchanged(target: string, expect: string | Uint8Array | null): void {
  const now = readBytesIfPresent(target);
  const want = expect === null ? null : typeof expect === 'string' ? Buffer.from(expect, 'utf-8') : Buffer.from(expect);
  const same = now === null || want === null ? now === want : now.equals(want);
  if (!same) {
    throw new SafePathError('changed', target, `${target} changed on disk while faf was writing — not written; original kept`);
  }
}

/** What to keep from the file already at `target` — its permission bits and
 *  owner — or undefined when there is none yet. */
interface Kept {
  mode: number;
  uid: number;
  gid: number;
}

function existingFile(target: string): Kept | undefined {
  try {
    const st = statSync(target);
    return { mode: st.mode & 0o777, uid: st.uid, gid: st.gid };
  } catch (e) {
    if (errnoOf(e) === 'ENOENT') {return undefined;}
    throw e;
  }
}

/** Give the temp file the original's owner (best effort: only root, or a
 *  group member for the group, may) and exactly its permission bits. */
function keepOwnerAndMode(fd: number, kept: Kept): void {
  if (process.platform !== 'win32') {
    try { fchownSync(fd, kept.uid, kept.gid); } catch { /* not ours to give */ }
  }
  fchmodSync(fd, kept.mode); // the umask narrowed the create mode
}

/** Flush the folder entry after the rename. Best effort: the data is already
 *  safe, and some platforms (Windows) cannot open a folder. */
function syncFolder(folder: string): void {
  if (process.platform === 'win32') {return;}
  try {
    const fd = openSync(folder, 'r');
    try {
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
  } catch {
    /* best effort */
  }
}

/** The temp file a write goes through; `fd` is set while it is open. */
interface TempFile {
  path: string;
  fd?: number;
  created: boolean;
}

/** Create the temp file (never opening anything already at its name — 'wx' is
 *  O_CREAT | O_EXCL, a link included), write it in full, keep the original's
 *  owner and mode, flush it to disk and close it. */
function fillTemp(temp: TempFile, content: string | Uint8Array, kept: Kept | undefined): void {
  temp.fd = openSync(temp.path, 'wx', kept?.mode ?? 0o666);
  temp.created = true;
  writeFileSync(temp.fd, content);
  if (kept) {keepOwnerAndMode(temp.fd, kept);}
  fsyncSync(temp.fd);
  closeSync(temp.fd);
  temp.fd = undefined;
}

/** Close and remove a temp file after a failure. Never touches a file this
 *  write did not create. */
function discardTemp(temp: TempFile): void {
  if (temp.fd !== undefined) {
    try { closeSync(temp.fd); } catch { /* already failing */ }
  }
  if (temp.created) {
    try { unlinkSync(temp.path); } catch { /* already failing */ }
  }
}

/** Write `content` to `target` atomically: temp file in the same folder,
 *  fsync, then — when the file is still what the caller read (`expect`) —
 *  rename over. `target` must already be resolved. */
function replaceAtomically(target: string, content: string | Uint8Array, expect: SafeWriteOptions['expect']): void {
  const folder = dirname(target);
  const temp: TempFile = {
    path: join(folder, `.${basename(target).slice(0, 100)}.${process.pid}.${randomBytes(6).toString('hex')}.faf-tmp`),
    created: false,
  };
  const kept = existingFile(target);
  try {
    // A file faf may not write in place (read-only) is not replaced either.
    if (kept) {accessSync(target, constants.W_OK);}
    fillTemp(temp, content, kept);
    if (expect !== undefined) {assertUnchanged(target, expect);}
    renameSync(temp.path, target);
  } catch (e) {
    discardTemp(temp);
    if (e instanceof SafePathError) {throw e;}
    const why = errnoOf(e) ?? (e instanceof Error ? e.message : String(e));
    throw new Error(`${target}: not written${kept ? '; original kept' : ''} (${why})`, { cause: e });
  }
  syncFolder(folder);
}

/**
 * Write a file inside a project, safely: resolved with {@link resolveInside}
 * (a link that leaves the project, dangles, or leads to a file with another
 * name, and anything in `.git`, is refused), then replaced atomically (temp
 * file in the same folder, fsync, rename; the original's permissions — and,
 * where the OS allows, its owner — kept). On any failure the original is
 * untouched and the Error says "not written; original kept". With `expect`,
 * a file that changed after the caller read it is not replaced either
 * (SafePathError `changed`). Returns the real path written — the link's target
 * when `path` is an in-project link.
 */
export function safeWriteFile(path: string, content: string | Uint8Array, opts: SafeWriteOptions = {}): string {
  const full = resolve(path);
  const target = resolveInside(opts.root ?? dirname(full), full);
  replaceAtomically(target, content, opts.expect);
  return target;
}
