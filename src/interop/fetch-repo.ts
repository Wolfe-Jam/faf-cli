/**
 * The fetch step of `faf git`: normalize the URL, shallow-clone it into a temp
 * folder of faf's own, and take out link placeholders. `faf git` and the MCP
 * servers use this one copy (#236), then author with authorFafFromRepo.
 *
 * This module runs git. It is public only through the `faf-cli/fetch` entry,
 * never through the main `faf-cli` import, which runs no git.
 */
import { execFile, execFileSync } from 'child_process';
import { join } from 'path';
import { promisify } from 'util';
import { makeTempDir, readBytesIfPresent, removeTempDir, safeUnlink } from '../core/safe-write.js';
import { normalizeGitUrl } from '../detect/git-url.js';

const execFileAsync = promisify(execFile);

/** The `git clone` argv — split out so the --ref plumbing is testable without a network. */
export function cloneArgs(repoUrl: string, tmpDir: string, ref?: string): string[] {
  // core.symlinks=false: a link in the repo arrives as a plain file holding the
  // link's text, so a README.md that links to ~/.aws/credentials is never
  // followed. --depth 1 keeps it instant; --branch pins a branch or tag for
  // versioned context. `--` stops the URL ever being read as a flag.
  return ['clone', '-c', 'core.symlinks=false', '--depth', '1', ...(ref ? ['--branch', ref] : []), '--', repoUrl, tmpDir];
}

/**
 * With core.symlinks=false, every path git records as a link (mode 120000)
 * arrives in the clone as a plain file holding the link's target text. That
 * text is not the file: detection would read `docs/README.md` as the README
 * and write it into project.goal. The placeholders are taken out of faf's own
 * throwaway clone, so detection sees them as absent, as it sees any link.
 * Returns how many were taken out.
 */
export function dropLinkPlaceholders(cloneDir: string): number {
  let listing: string;
  try {
    listing = execFileSync('git', ['-C', cloneDir, 'ls-files', '-s', '-z'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  } catch {
    return 0;
  }
  let dropped = 0;
  for (const rec of listing.split('\0')) {
    if (!rec.startsWith('120000 ')) {continue;}
    const tab = rec.indexOf('\t');
    if (tab < 0) {continue;}
    const full = join(cloneDir, rec.slice(tab + 1));
    const bytes = readBytesIfPresent(full);
    if (bytes === null) {continue;}
    try {
      if (safeUnlink(full, { root: cloneDir, expect: bytes })) {dropped++;}
    } catch {
      // Not a plain placeholder (a folder or something unexpected): leave it.
    }
  }
  return dropped;
}

/** Why a fetch failed: `url` (not a repo URL faf accepts) or `clone` (git
 *  could not clone it; `reason` is git's last lines). */
export class FetchRepoError extends Error {
  constructor(
    message: string,
    readonly kind: 'url' | 'clone',
    readonly reason?: string,
  ) {
    super(message);
    this.name = 'FetchRepoError';
  }
}

export interface FetchRepoOptions {
  /** Clone this branch or tag. */
  ref?: string;
}

export interface FetchedRepo {
  /** The cloned folder, link placeholders taken out. Read it; don't keep it. */
  dir: string;
  /** The normalized URL, for authorFafFromRepo(dir, { repoUrl }). */
  repoUrl: string;
  /** Removes the temp folder. Safe to call more than once. */
  cleanup(): void;
}

/**
 * Fetch a repo the way `faf git` does: normalize the URL, shallow clone
 * (no shell, links not followed) into a temp folder, take out link
 * placeholders. Call `cleanup()` when done, in a `finally`.
 *
 * ```ts
 * import { fetchRepo } from 'faf-cli/fetch';
 * import { authorFafFromRepo, suggestIntent } from 'faf-cli';
 * const repo = await fetchRepo('tokio-rs/axum');
 * try {
 *   const data = authorFafFromRepo(repo.dir, { repoUrl: repo.repoUrl });
 *   const suggestions = suggestIntent(repo.dir);
 * } finally {
 *   repo.cleanup();
 * }
 * ```
 */
export async function fetchRepo(url: string, options: FetchRepoOptions = {}): Promise<FetchedRepo> {
  let repoUrl: string;
  try {
    repoUrl = normalizeGitUrl(url);
  } catch (e) {
    throw new FetchRepoError((e as Error).message, 'url');
  }

  // A fresh temp folder of faf's own (mkdtemp, with faf's marker file in it).
  // The clone goes in a subfolder beside the marker (git clones only into an
  // empty folder).
  const tmpDir = makeTempDir('faf-git-');
  const dir = join(tmpDir, 'repo');
  let cleaned = false;
  const cleanup = (): void => {
    if (cleaned) {return;}
    cleaned = true;
    removeTempDir(tmpDir);
  };

  try {
    // execFile runs git directly — NO shell — so the URL can never be
    // interpreted as a command.
    await execFileAsync('git', cloneArgs(repoUrl, dir, options.ref));
  } catch (err) {
    cleanup();
    const stderr = String((err as { stderr?: unknown })?.stderr ?? '');
    const reason = stderr.trim().split('\n').slice(-2).join(' ').trim() || 'git clone failed';
    throw new FetchRepoError(`could not clone ${url}: ${reason}`, 'clone', reason);
  }

  dropLinkPlaceholders(dir);
  return { dir, repoUrl, cleanup };
}
