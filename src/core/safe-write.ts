/**
 * Safe file access — the one primitive every faf writer, and every read of
 * project context, goes through. It is also the only module in faf that calls
 * a filesystem write, rename, delete, mkdir or chmod API (tests/write-guard
 * enforces that for all of src/).
 *
 * Rule 1 — stay inside the project. Before faf touches a path it resolves it on
 * disk (realpath: every link followed). If that leads outside the project
 * folder, faf refuses. A dangling link is refused — faf never creates a file at
 * the end of a link. Anything whose real path is inside a `.git` folder is
 * refused, always — with two narrow exceptions: faf's own git hook
 * (`allowGitHooks`: one file directly inside the repo's hooks folder), and
 * the repo's own git config file (`allowGitConfig`: the file `config`
 * directly in the folder git names for it), where `faf diff
 * --uninstall-driver` removes the section faf's install wrote.
 *
 * Rule 2 — a link leads to the same kind of file. faf follows a link only to a
 * file with the same name (CLAUDE.md → docs/CLAUDE.md), or from one AI context
 * file to another (CLAUDE.md → AGENTS.md; the set is FAF_CONTEXT_FILES). The
 * link itself survives: faf writes the file it points at. `CLAUDE.md →
 * README.md` or `project.html → package.json` is refused — faf would be
 * writing a file it was never asked to write. A read of project context
 * through a link must land on a .faf or .fafm file instead, so `project.faf →
 * .env` is refused even though .env is in the project — or, for a read of an
 * AI context file, on another AI context file (`faf recover` reads CLAUDE.md →
 * AGENTS.md), the rule the writers use.
 *
 * Rule 3 — never leave a half-written file. A write goes to a temp file in the
 * same folder, is flushed to disk (fsync), then renamed over the original in
 * one step, keeping the original's permissions. If any step fails the temp
 * file is removed and the original is exactly as it was: "not written;
 * original kept". A plain writeFileSync truncates first, so a full disk, a
 * quota or a killed process used to leave the user's file cut short. With
 * `expect` (the bytes the caller read), the file is read again just before the
 * rename and the write is refused if it changed in the meantime. Its mode is
 * checked too: a file made read-only, or given other permissions, while faf
 * was writing is not replaced.
 *
 * Rule 4 — text faf edits is UTF-8. readUtf8 decodes strictly: a UTF-16 file or
 * any bytes that are not UTF-8 are refused, never turned into U+FFFD and
 * written back.
 *
 * Rule 5 — a whole file faf renders replaces a file already there only when
 * faf can prove it wrote it: project.html, the cards, `faf server-card --out`,
 * a `faf taf --output` snapshot and a `faf decompile --output` file must be
 * byte for byte what faf last wrote (their render hash, render-hash.ts); a
 * `.fafb` must carry the FAFB header (see {@link safeReplaceOwned}). Anything
 * else is refused unless the caller passes `force` (the CLI's `--force`).
 *
 * Rule 6 — detection reads stay inside the project. The files faf reads to fill
 * slots and render context (README.md, package.json, pyproject.toml,
 * Cargo.toml, go.mod, …) go through {@link repoFile}: resolved on disk, every
 * link followed. A file whose real path, or the folder it sits in, leaves the
 * project folder, runs through `.git`, or is a dangling link is absent to
 * detection: it does not exist, and reading it gives nothing. A link that
 * stays inside the project is followed (README.md → docs/README.md).
 */
import {
  accessSync,
  closeSync,
  constants,
  existsSync,
  fchmodSync,
  fchownSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
  type Dirent,
  type Stats,
} from 'fs';
import { randomBytes } from 'crypto';
import { tmpdir } from 'os';
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
  | 'changed'
  | 'not-owned'
  | 'not-yaml'
  | 'unplaceable';

/**
 * A path faf will not read or write, or a file faf will not change. Nothing
 * was written; the file on disk is exactly as it was.
 *   - `outside`, `dangling`, `not-a-file`, `not-faf`, `other-file`, `git`: the
 *     path is refused (see {@link resolveInside}).
 *   - `not-utf8`: the file is not UTF-8 (see {@link readUtf8}).
 *   - `changed`: the file changed on disk after faf read it — its bytes, or its
 *     mode (see the `expect` option of {@link safeWriteFile}).
 *   - `not-owned`: a whole file faf renders is already there and faf cannot
 *     prove it wrote every byte of it — it has no faf mark, or it was edited
 *     since faf wrote it, or it is from before faf recorded a render hash (see
 *     {@link safeReplaceOwned} and render-hash.ts).
 *   - `not-yaml`: a .faf faf reads or edits is not valid YAML: "<file> is not
 *     valid YAML (<reason>, line N) — faf left it unchanged"; or it parses to
 *     a scalar or a list, not a mapping; or faf's scoring kernel cannot read
 *     it (`faf score`, `faf compile`, `faf refresh`).
 *   - `unplaceable`: faf could not place its managed block where its next run
 *     finds it again, so it wrote nothing (see inject.ts).
 *
 * `onWrite` is true when faf refused at the write itself — it may have read
 * the file before (a `.faf` read through a link, say) — and false when it
 * refused before reading or writing anything.
 */
export class SafePathError extends Error {
  readonly reason: SafePathReason;
  /** The path as the caller named it (absolute). */
  readonly path: string;
  /** True when the refusal came at the write (faf may have read the file first). */
  readonly onWrite: boolean;

  constructor(reason: SafePathReason, path: string, message: string, opts: { onWrite?: boolean; cause?: unknown } = {}) {
    super(message, opts.cause === undefined ? undefined : { cause: opts.cause });
    this.name = 'SafePathError';
    this.reason = reason;
    this.path = path;
    this.onWrite = opts.onWrite === true;
  }
}

export interface ResolveInsideOptions {
  /** Resolving for a read of project context: a link must end at a `.faf` or
   *  `.fafm` file — or, when the name is an AI context file (CLAUDE.md), at
   *  another AI context file (CLAUDE.md → AGENTS.md), the rule the writers
   *  use. A plain file is read under the name the caller gave. */
  read?: boolean;
  /**
   * Resolving faf's own git hook (`faf hooks`) — one of the two exceptions
   * to the `.git` rule. `dir` must be the repo's hooks folder as git names it
   * (`git rev-parse --git-path hooks`, a folder named `hooks`), and `name` a
   * hook file sitting directly in it (`pre-commit`). Only that file may be
   * inside `.git`; nothing below or beside it. Links are still checked: a
   * link must stay inside the hooks folder's real folder and end at a file of
   * the same name.
   */
  allowGitHooks?: boolean;
  /**
   * Resolving the repo's own git config file (`faf diff --uninstall-driver`)
   * — the other exception to the `.git` rule. `dir` must be the folder git
   * names for it (the folder of `git rev-parse --git-path config`), and `name`
   * the file `config` directly in it. Only that file may be inside `.git`;
   * nothing below or beside it. A link must stay inside that folder and end
   * at a file named `config`.
   */
  allowGitConfig?: boolean;
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
   * missing). Omit it to write without the byte check (the mode check below
   * still runs).
   */
  expect?: string | Uint8Array | null;
  /** Write faf's own git hook: see {@link ResolveInsideOptions.allowGitHooks}. `root` is the hooks folder. */
  allowGitHooks?: boolean;
  /** Write the repo's own git config file: see {@link ResolveInsideOptions.allowGitConfig}. `root` is its folder. */
  allowGitConfig?: boolean;
  /** Permission bits for the written file. Default: the original's (a new
   *  file gets the default create mode). */
  mode?: number;
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
/** A git hook's file name (`pre-commit`, `commit-msg`, …). */
const HOOK_NAME = /^[a-z][a-z0-9-]*$/;
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

/** What a resolve is for: a read of project context, and/or one of the two
 *  files faf may reach inside `.git` (its git hook, the repo's git config) —
 *  `inGit`: a file directly in `root` may be inside `.git`. */
interface ResolveMode {
  read: boolean;
  inGit: boolean;
}

/** Resolve the final component when it is a link: it must exist, stay inside
 *  `root` and out of `.git` (a hook may sit directly in the hooks folder, the
 *  git config directly in its folder),
 *  be a regular file and — for a read of project context — be a .faf/.fafm
 *  file; otherwise have the link's own name, or be an AI context file reached
 *  from one. */
function followLink(root: string, requested: string, link: string, mode: ResolveMode): string {
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
  if (inGitDir(real) && !(mode.inGit && dirname(real) === root)) {
    throw new SafePathError('git', requested, `${requested} is a link to ${real}, inside .git/ — refused.`);
  }
  if (!statSync(real).isFile()) {
    throw new SafePathError('not-a-file', requested, `${requested} is a link to ${real}, which is not a regular file — refused.`);
  }
  refuseOtherKind(requested, real, mode.read);
  return real;
}

/** The file at the end of a link must be the kind the caller asked for: for a
 *  read of project context a .faf/.fafm file (or, for an AI context file,
 *  another AI context file); otherwise a file with the link's own name, or an
 *  AI context file when the link is one too. */
function refuseOtherKind(requested: string, real: string, read: boolean): void {
  const asked = basename(requested);
  const got = basename(real);
  const contextToContext = isContextFile(asked) && isContextFile(got);
  if (read && !FAF_FILE.test(got) && !contextToContext) {
    const kind = isContextFile(asked) ? 'a .faf or .fafm file, nor another AI context file' : 'a .faf or .fafm file';
    throw new SafePathError('not-faf', requested, `${requested} is a link to ${real}, which is not ${kind} — refused.`);
  }
  if (!read && !sameName(asked, got) && !contextToContext) {
    throw new SafePathError(
      'other-file',
      requested,
      `${requested} is a link to ${real}, a file with another name — refused (faf follows a link only to a file of the same name, or from one AI context file to another).`,
    );
  }
}

/** With allowGitHooks: `dir` must be a hooks folder and `requested` a hook
 *  file directly in it — the whole of the exception. */
function checkHookTarget(dir: string, requested: string, root: string, folder: string): void {
  if (basename(resolve(dir)) !== 'hooks' || !HOOK_NAME.test(basename(requested))) {
    throw new SafePathError('git', requested, `${requested} is not a git hook in a hooks folder — refused.`);
  }
  if (folder !== root) {
    throw new SafePathError('git', requested, `${requested} is not directly in the hooks folder ${root} — refused.`);
  }
}

/** With allowGitConfig: `requested` must be the file `config` directly in the
 *  folder git names for it — the whole of the exception. */
function checkConfigTarget(requested: string, root: string, folder: string): void {
  if (basename(requested) !== 'config' || folder !== root) {
    throw new SafePathError('git', requested, `${requested} is not the git config file directly in ${root} — refused.`);
  }
}

/**
 * Resolve `name` inside the project folder `dir` and return the real path to
 * read or write — or throw a SafePathError.
 *
 *   - the folder the file sits in must resolve to `dir` or below it
 *   - a path whose real form runs through `.git` → refused, always (the two
 *     exceptions: `allowGitHooks`, a hook file directly in the hooks folder,
 *     and `allowGitConfig`, the file `config` directly in its git folder)
 *   - a file that does not exist yet → its path inside the project
 *   - a regular file → its path (spelled as on disk)
 *   - a link → the file it points at, when that exists, is a regular file, is
 *     inside the project and out of `.git`, and has the link's own name (or
 *     both names are AI context files: CLAUDE.md → AGENTS.md). With `read`, the
 *     file must be a .faf/.fafm file instead (`project.faf → config/team.faf`),
 *     or — for an AI context file — another AI context file.
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
  const hooks = opts.allowGitHooks === true;
  const gitConfig = opts.allowGitConfig === true;
  if (hooks) {checkHookTarget(dir, requested, root, folder);}
  if (gitConfig) {checkConfigTarget(requested, root, folder);}
  const target = join(folder, basename(requested));
  if (inGitDir(target) && !hooks && !gitConfig) {
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
  if (st.isSymbolicLink()) {return followLink(root, requested, target, { read: opts.read === true, inGit: hooks || gitConfig });}
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

/**
 * Where detection may read `rel` in the project folder `dir` — its real path —
 * or null when detection treats it as absent (Rule 6). `rel` names a file or a
 * folder, relative to `dir` (as `join(dir, rel)`). Every link on the way is
 * followed, the folders included; the result is null when:
 *   - nothing is there, or a link on the way dangles or loops
 *   - the real path leaves `dir` (README.md → ~/.aws/credentials, or a folder
 *     on the way that is a link out)
 *   - the real path runs through `.git` (README.md → .git/config)
 * A link that stays inside `dir` is followed. `dir` is the folder detection
 * was handed: the project, or a folder below it that detection reads on its
 * own (a subfolder's manifest), so a link may not leave that folder either.
 */
export function repoFile(dir: string, rel: string): string | null {
  const full = resolve(join(dir, rel));
  if (!existsSync(full)) {return null;} // not there, or a dangling link
  let root: string;
  let real: string;
  try {
    root = realpath(detectionBoundary(dir));
    real = realpath(full);
  } catch {
    return null; // a loop, or gone meanwhile
  }
  if (!isInside(root, real) || inGitDir(relative(root, real))) {return null;}
  return real;
}

/** The project folders detection is running in, outermost first (see
 *  {@link withRepoRoot}). */
const detectionRoots: string[] = [];

/** The folder a read in `dir` may not leave: the outermost project folder
 *  detection is running in that holds `dir`, or `dir` itself. */
function detectionBoundary(dir: string): string {
  const base = resolve(dir);
  return detectionRoots.find(r => base === r || base.startsWith(r.endsWith(sep) ? r : r + sep)) ?? base;
}

/**
 * Run `scan` with `root` as the project folder for every detection read under
 * it: a read in a subfolder (web/package.json) may then follow a link to
 * anywhere inside `root` (../shared/web-package.json), not only inside that
 * subfolder. A link out of `root` is still absent. Subfolder scans use this.
 */
export function withRepoRoot<T>(root: string, scan: () => T): T {
  detectionRoots.push(resolve(root));
  try {
    return scan();
  } finally {
    detectionRoots.pop();
  }
}

/** True when `rel` (a file or a folder) is in the project folder `dir` for
 *  detection: see {@link repoFile}. */
export function repoExists(dir: string, rel: string): boolean {
  return repoFile(dir, rel) !== null;
}

/** The text of the file `rel` in the project folder `dir` (UTF-8, read the way
 *  detection reads it), or null when detection treats it as absent (see
 *  {@link repoFile}), it is not a regular file, or it cannot be read. */
export function readRepoFile(dir: string, rel: string): string | null {
  const real = repoFile(dir, rel);
  if (real === null) {return null;}
  try {
    return statSync(real).isFile() ? readFileSync(real, 'utf-8') : null;
  } catch {
    return null;
  }
}

/** What `rel` is (its real path's stats) in the project folder `dir`, or null
 *  when detection treats it as absent (see {@link repoFile}). */
export function statRepoFile(dir: string, rel: string): Stats | null {
  const real = repoFile(dir, rel);
  if (real === null) {return null;}
  try {
    return statSync(real);
  } catch {
    return null;
  }
}

/**
 * The entries of the folder `rel` (default: `dir` itself) in the project
 * folder `dir`, or null when detection treats the folder as absent (see
 * {@link repoFile}) or it cannot be read. A link among them that leaves `dir`,
 * dangles, or leads into `.git` is left out: detection does not see it. Each
 * entry says what it is itself (a link is a link, as readdirSync gives it).
 */
export function readRepoDir(dir: string, rel = '.'): Dirent[] | null {
  const real = repoFile(dir, rel);
  if (real === null) {return null;}
  let entries: Dirent[];
  try {
    entries = readdirSync(real, { withFileTypes: true });
  } catch {
    return null;
  }
  return entries.filter(e => !e.isSymbolicLink() || repoFile(dir, join(rel, e.name)) !== null);
}

/** What to keep from the file already at `target` — its permission bits and
 *  owner — or undefined when there is none yet. */
interface Kept {
  /** Permission bits given to the new file (rwx for owner, group, other). */
  mode: number;
  /** Every mode bit as it was (setuid, setgid and sticky included), to notice a change. */
  perm: number;
  uid: number;
  gid: number;
}

function existingFile(target: string): Kept | undefined {
  try {
    const st = statSync(target);
    return { mode: st.mode & 0o777, perm: st.mode & 0o7777, uid: st.uid, gid: st.gid };
  } catch (e) {
    if (errnoOf(e) === 'ENOENT') {return undefined;}
    throw e;
  }
}

/**
 * A write that failed partway — a full disk, a quota, a read-only file, a
 * killed rename — with the file on disk exactly as it was: "<file>: not
 * written; original kept (<why>)" ("not written" alone when there was no file).
 * `cause` is the error underneath. The CLI prints it as one line.
 */
export class NotWrittenError extends Error {
  /** The file that was not written. */
  readonly path: string;

  constructor(path: string, message: string, opts: { cause?: unknown } = {}) {
    super(message, { cause: opts.cause });
    this.path = path;
  }
}

const changedOnDisk = (target: string): SafePathError =>
  new SafePathError('changed', target, `${target} changed on disk while faf was writing — not written; original kept`, { onWrite: true });

/** Refuse the rename when the file is no longer what the caller read (its
 *  bytes, with `expect`), or when its mode changed or it stopped being
 *  writable since faf looked at it (`kept`): a file the user made read-only,
 *  or gave other permissions, while faf was writing is left as it is. */
function assertUnchanged(target: string, expect: SafeWriteOptions['expect'], kept: Kept | undefined): void {
  if (expect !== undefined) {
    const now = readBytesIfPresent(target);
    const want = expect === null ? null : typeof expect === 'string' ? Buffer.from(expect, 'utf-8') : Buffer.from(expect);
    const same = now === null || want === null ? now === want : now.equals(want);
    if (!same) {throw changedOnDisk(target);}
  }
  if (!kept) {return;}
  let st;
  try {
    st = statSync(target);
  } catch (e) {
    if (errnoOf(e) === 'ENOENT') {return;} // gone: the byte check above decides
    throw e;
  }
  if ((st.mode & 0o7777) !== kept.perm) {throw changedOnDisk(target);}
  try {
    accessSync(target, constants.W_OK);
  } catch {
    throw changedOnDisk(target);
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
 *  owner and mode (or give it `mode`), flush it to disk and close it. */
function fillTemp(temp: TempFile, content: string | Uint8Array, kept: Kept | undefined, mode: number | undefined): void {
  temp.fd = openSync(temp.path, 'wx', mode ?? kept?.mode ?? 0o666);
  temp.created = true;
  writeFileSync(temp.fd, content);
  if (kept) {keepOwnerAndMode(temp.fd, kept);}
  if (mode !== undefined) {fchmodSync(temp.fd, mode);}
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
 *  fsync, then — when the file is still what the caller read (`expect`), with
 *  the same mode, and still writable — rename over. `target` must already be
 *  resolved. */
function replaceAtomically(target: string, content: string | Uint8Array, opts: SafeWriteOptions): void {
  const folder = dirname(target);
  const temp: TempFile = {
    path: join(folder, `.${basename(target).slice(0, 100)}.${process.pid}.${randomBytes(6).toString('hex')}.faf-tmp`),
    created: false,
  };
  const kept = existingFile(target);
  try {
    // A file faf may not write in place (read-only) is not replaced either.
    if (kept) {accessSync(target, constants.W_OK);}
    fillTemp(temp, content, kept, opts.mode);
    assertUnchanged(target, opts.expect, kept);
    renameSync(temp.path, target);
  } catch (e) {
    discardTemp(temp);
    if (e instanceof SafePathError) {throw e;}
    const why = errnoOf(e) ?? (e instanceof Error ? e.message : String(e));
    throw new NotWrittenError(target, `${target}: not written${kept ? '; original kept' : ''} (${why})`, { cause: e });
  }
  syncFolder(folder);
}

/** A refusal raised while writing: the same SafePathError, marked `onWrite`. */
function atWrite(e: unknown): unknown {
  return e instanceof SafePathError && !e.onWrite ? new SafePathError(e.reason, e.path, e.message, { onWrite: true }) : e;
}

/**
 * Write a file inside a project, safely: resolved with {@link resolveInside}
 * (a link that leaves the project, dangles, or leads to a file with another
 * name, and anything in `.git`, is refused), then replaced atomically (temp
 * file in the same folder, fsync, rename; the original's permissions — and,
 * where the OS allows, its owner — kept). On any failure the original is
 * untouched and the Error says "not written; original kept". With `expect`,
 * a file that changed after the caller read it is not replaced either
 * (SafePathError `changed`); nor is one whose mode changed, or that became
 * read-only, while faf was writing. Returns the real path written — the
 * link's target when `path` is an in-project link.
 */
export function safeWriteFile(path: string, content: string | Uint8Array, opts: SafeWriteOptions = {}): string {
  const full = resolve(path);
  let target: string;
  try {
    target = resolveInside(opts.root ?? dirname(full), full, { allowGitHooks: opts.allowGitHooks, allowGitConfig: opts.allowGitConfig });
  } catch (e) {
    throw atWrite(e);
  }
  replaceAtomically(target, content, opts);
  return target;
}

/** Options for {@link safeReplaceOwned}. */
export interface ReplaceOwnedOptions {
  /** The project folder the write must stay inside. Default: the file's own folder. */
  root?: string;
  /** True when the bytes already at the path carry faf's own mark (faf wrote them). */
  owns: (existing: Buffer) => boolean;
  /** faf's mark in words, for the refusal: "the `_meta[\"one.faf/context\"]` block". */
  mark: string;
  /** Replace a file without the mark anyway — the explicit overwrite (`--force`). */
  force?: boolean;
  /** The bytes the caller read there earlier (`null`: no file then). When
   *  given, the file must still hold them, else SafePathError `changed`. */
  expect?: string | Uint8Array | null;
}

/**
 * Write a whole file faf renders (project.html, a Server Card, an A2A card, a
 * `.fafb`), replacing a file already at `path` only when faf can prove it wrote
 * it: its bytes carry faf's own mark (`owns`). A file without the mark is
 * refused — SafePathError `not-owned`: "<file> has no <mark>, so faf did not
 * write it — faf left it unchanged." — and stays byte for byte, unless `force`
 * asks to replace it. The link rules and the atomic write are
 * {@link safeWriteFile}'s, and the write is refused if the file changed on
 * disk after faf read it. Returns the real path written.
 */
export function safeReplaceOwned(path: string, content: string | Uint8Array, opts: ReplaceOwnedOptions): string {
  const full = resolve(path);
  const root = opts.root ?? dirname(full);
  const target = resolveInside(root, full);
  const existing = readBytesIfPresent(target);
  if (opts.expect !== undefined) {assertUnchanged(target, opts.expect, undefined);}
  if (existing !== null && opts.force !== true && !opts.owns(existing)) {
    throw new SafePathError('not-owned', full, `${full} has no ${opts.mark}, so faf did not write it — faf left it unchanged.`, { onWrite: true });
  }
  return safeWriteFile(target, content, { root, expect: existing });
}

/**
 * Create the folder `dir` inside the project folder `root`, with any missing
 * folders between them, and return its real path. `root` itself is the
 * caller's own folder: it is created as named when missing. Below it, faf
 * never creates a folder through a link: an existing folder on the way that
 * is a link leading out of `root` (or a dangling link) is refused, as is any
 * part inside `.git` and anything on the way that is not a folder — so
 * `.github → ~/elsewhere` cannot make faf create `~/elsewhere/workflows`.
 */
export function makeDirInside(root: string, dir: string = root): string {
  const top = resolve(root);
  mkdirSync(top, { recursive: true });
  const realRoot = realpath(top);
  const want = resolve(top, dir);
  const rel = relative(top, want);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new SafePathError('outside', want, `${want} is outside ${realRoot} — refused.`, { onWrite: true });
  }
  let cur = realRoot;
  for (const part of rel.split(/[\\/]/).filter(Boolean)) {
    const next = join(cur, part);
    if (inGitDir(next)) {
      throw new SafePathError('git', want, `${want} runs through ${next}, inside .git/ — refused.`, { onWrite: true });
    }
    cur = stepInto(realRoot, want, next);
  }
  return cur;
}

/** One folder on the way down in makeDirInside: made when missing, followed
 *  when it is a link that stays inside `root`, refused otherwise. */
function stepInto(root: string, want: string, next: string): string {
  let st;
  try {
    st = lstatSync(next);
  } catch (e) {
    if (errnoOf(e) !== 'ENOENT') {throw e;}
    mkdirSync(next);
    return next;
  }
  let real = next;
  if (st.isSymbolicLink()) {
    try {
      real = realpath(next);
    } catch {
      throw new SafePathError('dangling', want, `${next} is a link to ${linkText(next)}, which does not exist. faf does not create folders through a link — refused.`, { onWrite: true });
    }
    if (!isInside(root, real)) {
      throw new SafePathError('outside', want, `${next} is a link to ${real}, outside ${root} — refused.`, { onWrite: true });
    }
    if (inGitDir(real)) {
      throw new SafePathError('git', want, `${next} is a link to ${real}, inside .git/ — refused.`, { onWrite: true });
    }
  }
  if (!statSync(real).isDirectory()) {
    throw new SafePathError('not-a-file', want, `${next} is not a folder — refused.`, { onWrite: true });
  }
  return real;
}

/**
 * Remove a file faf wrote — only when it still holds exactly `expect` (the
 * bytes faf wrote or read there) and is a regular file inside `root` (default:
 * its own folder), out of `.git`. A link is never removed (faf did not make
 * it), and a file whose bytes changed is left as it is (SafePathError
 * `changed`). Returns false when nothing was there.
 */
export function safeUnlink(path: string, opts: { root?: string; expect: string | Uint8Array }): boolean {
  const full = resolve(path);
  const realRoot = realpath(resolve(opts.root ?? dirname(full)));
  const folder = realpath(dirname(full));
  if (!isInside(realRoot, folder)) {
    throw new SafePathError('outside', full, `${full} is in ${folder}, outside ${realRoot} — refused.`, { onWrite: true });
  }
  const target = join(folder, basename(full));
  if (inGitDir(target)) {
    throw new SafePathError('git', full, `${full} is inside .git/ — refused.`, { onWrite: true });
  }
  let st;
  try {
    st = lstatSync(target);
  } catch (e) {
    if (errnoOf(e) === 'ENOENT') {return false;}
    throw e;
  }
  if (!st.isFile()) {
    throw new SafePathError('not-a-file', full, `${full} is not a regular file faf wrote — left as it is.`, { onWrite: true });
  }
  assertUnchanged(target, opts.expect, undefined);
  unlinkSync(target);
  return true;
}

/** The temp folders makeTempDir made in this process — the only ones removeTempDir removes. */
const TEMP_DIRS = new Set<string>();

/** The marker file makeTempDir writes into every temp folder it makes, and
 *  its exact content: `faf clear` removes only a folder that carries it. */
export const TEMP_MARKER = '.faf-temp';
const TEMP_MARKER_TEXT = 'faf made this temp folder; `faf clear` removes it.\n';

/** Make a new temp folder for faf's own use — `<os temp>/<prefix>XXXXXX`, a
 *  fresh name no one else can have made (mkdtemp) — write faf's marker file
 *  into it ({@link TEMP_MARKER}), and return its real path. Anything faf puts
 *  there (a clone, say) goes in a subfolder, beside the marker. */
export function makeTempDir(prefix: string): string {
  const dir = realpath(mkdtempSync(join(tmpdir(), prefix)));
  TEMP_DIRS.add(dir);
  const fd = openSync(join(dir, TEMP_MARKER), 'wx', 0o644);
  try {
    writeFileSync(fd, TEMP_MARKER_TEXT);
  } finally {
    closeSync(fd);
  }
  return dir;
}

/** Remove a temp folder {@link makeTempDir} made in this process, with what is
 *  in it. Any other folder is refused (an Error; nothing removed). */
export function removeTempDir(dir: string): void {
  if (!TEMP_DIRS.has(dir)) {throw new Error(`${dir} is not a temp folder faf made — not removed`);}
  rmSync(dir, { recursive: true, force: true });
  TEMP_DIRS.delete(dir);
}

/** True when the folder `dir` carries makeTempDir's marker: a regular file
 *  (never a link) holding exactly the marker text. */
function hasTempMarker(dir: string): boolean {
  const marker = join(dir, TEMP_MARKER);
  try {
    if (!lstatSync(marker).isFile()) {return false;}
    return readFileSync(marker, 'utf-8') === TEMP_MARKER_TEXT;
  } catch {
    return false;
  }
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Remove faf's own temp folders left behind by earlier runs (`faf clear`):
 * only folders faf made — entries of the OS temp folder named exactly as
 * mkdtemp names them (`prefix` plus six letters or digits), that are real
 * folders (a link is left alone), belong to this user and carry the marker
 * file {@link makeTempDir} writes into each one. A folder of yours that only
 * starts with the prefix (`faf-git-my-notes`) stays. Returns how many were
 * removed. A folder that cannot be read or removed is skipped.
 */
export function removeStaleTempDirs(prefix: string): number {
  const tmp = tmpdir();
  const uid = typeof process.getuid === 'function' ? process.getuid() : undefined;
  const shape = new RegExp(`^${escapeRe(prefix)}[A-Za-z0-9]{6}$`);
  let removed = 0;
  for (const entry of readdirSync(tmp)) {
    if (!shape.test(entry)) {continue;}
    const p = join(tmp, entry);
    try {
      const st = lstatSync(p);
      if (!st.isDirectory() || (uid !== undefined && st.uid !== uid) || !hasTempMarker(p)) {continue;}
      rmSync(p, { recursive: true, force: true });
      removed++;
    } catch {
      /* not ours to remove, or already gone */
    }
  }
  return removed;
}
