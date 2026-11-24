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

import { basename } from 'path';
import type { FafData } from '../core/types.js';
import { assembleFreshFaf } from './assemble.js';
import { readPackageJson } from './scanner.js';
import { repoNameFromUrl } from './git-url.js';

// The URL gate and repo name live in git-url.ts (no imports), so the fetch
// entry (faf-cli/fetch) can use them without bundling detection.
export { normalizeGitUrl, repoNameFromUrl } from './git-url.js';

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
  // `pkg.name ?? basename(dir)`); a real package.json name is kept.
  if (opts.repoUrl && data.project && !readPackageJson(dir)?.name && data.project.name === basename(dir)) {
    data.project.name = repoNameFromUrl(opts.repoUrl);
  }
  return data;
}
