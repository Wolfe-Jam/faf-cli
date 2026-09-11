/**
 * The pure parts of `faf git` — no git, no network, no child process.
 *
 * `faf git <url>` validates the URL, clones the repo into a temp folder, and
 * authors a fresh .faf from it with the same pipeline `faf auto` runs. The
 * clone is the only step that runs git, and it stays in the CLI command. The
 * rest lives here so consumers (claude-faf-mcp's faf_git, faf-mcp) compose it:
 * they fetch the repo their own way, then call `authorFafFromRepo(dir)` and get
 * the same .faf `faf git` would write — canonical keys, scored by faf's own
 * scorer — instead of a hand-rolled extractor with its own schema.
 */

import type { FafData } from '../core/types.js';
import { assembleFreshFaf } from './assemble.js';
import { readPackageJson } from './scanner.js';

/**
 * Validate + normalize a GitHub repo reference into a safe clone URL.
 *
 * A `faf git` URL is an untrusted CLI/MCP argument. This gate rejects any
 * shell metacharacter or whitespace, and only ever returns a URL built from a
 * strict allowlist pattern — defense in depth alongside the no-shell
 * `execFileSync` clone (which already makes argument injection structurally
 * impossible). Nothing carrying a metacharacter or control char ever reaches
 * `git`: metachars are caught here; anything else fails the allowlist below.
 *
 * Accepts:
 *   owner/repo · github.com/owner/repo · https://github.com/owner/repo
 *   (optional `.git` suffix, optional trailing slash; full http(s) URLs to
 *    any host pass through with a single `.git` suffix)
 *
 * Throws on empty / malformed / unsafe input.
 */
export function normalizeGitUrl(input: string): string {
  const url = (input ?? '').trim();
  if (!url) {
    throw new Error('Please provide a GitHub URL.');
  }
  // Reject shell metacharacters and whitespace up front for a clear error.
  if (/[\s;&|`$(){}<>\\^'"!*?[\]]/.test(url)) {
    throw new Error(`Refusing unsafe URL: ${JSON.stringify(input)}`);
  }

  const bare = url.replace(/\/+$/, '').replace(/\.git$/i, '');

  // owner/repo shorthand (optionally github.com-prefixed, no scheme) → canonical https
  const short = bare.match(
    /^(?:github\.com\/)?([A-Za-z0-9][A-Za-z0-9._-]*)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/,
  );
  if (short) {
    return `https://github.com/${short[1]}/${short[2]}.git`;
  }

  // full http(s) URL → ensure exactly one `.git` suffix (strict allowlist chars)
  if (/^https?:\/\/[A-Za-z0-9._\-/:@~%]+$/.test(bare)) {
    return `${bare}.git`;
  }

  throw new Error(`Not a recognized GitHub repo URL: ${JSON.stringify(input)}`);
}

/** The repo name from a normalized clone URL: .../owner/repo.git → repo. */
export function repoNameFromUrl(repoUrl: string): string {
  return repoUrl.replace(/\.git$/i, '').replace(/\/+$/, '').split('/').pop() || 'project';
}

export interface AuthorFafFromRepoOptions {
  /** The repo's URL (a clone URL, or any form `normalizeGitUrl` accepts).
   *  When the fetched folder gives the project no name of its own (no
   *  package.json name), the project is named after the repo instead of the
   *  folder it was fetched into. */
  repoUrl?: string;
}

/**
 * Author a fresh .faf, as data, from a repo that is already on disk — the
 * function form of `faf git`. Pass the folder you cloned or unpacked the repo
 * into. Runs the full `faf auto` pipeline (detect → interrogate → slotignore →
 * Turbo-Cat → Relentless) on that folder only, and returns the FafData —
 * nothing is written, nothing is fetched, no git is run.
 *
 * Write it with `writeFaf` and score the written text with `scoreFafYaml`, so
 * the score you report is the one faf reports.
 */
export function authorFafFromRepo(dir: string, opts: AuthorFafFromRepoOptions = {}): FafData {
  const data = assembleFreshFaf(dir) as FafData;
  // Name the project after the REPO, not the folder it was fetched into — but
  // only when the name IS that folder fallback (detectStack's
  // `pkg.name ?? dir.split('/').pop()`); a real package.json name is kept.
  if (opts.repoUrl && data.project && !readPackageJson(dir)?.name && data.project.name === dir.split('/').pop()) {
    data.project.name = repoNameFromUrl(opts.repoUrl);
  }
  return data;
}
