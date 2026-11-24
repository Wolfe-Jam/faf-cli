/**
 * The `faf git` URL gate and the repo name from a clone URL. No imports: the
 * fetch entry (faf-cli/fetch) uses these without bundling detection.
 */

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

/**
 * `owner/repo` for a GitHub remote, or null for any other host or shape:
 * `https://github.com/o/r(.git)`, `git@github.com:o/r(.git)`,
 * `ssh://git@github.com/o/r(.git)` and `o/r`. Names use GitHub's characters
 * only (letters, digits, `.`, `_`, `-`), so the result is safe in an API path.
 */
export function githubRepoOf(remote: string, options: { urlOnly?: boolean } = {}): string | null {
  const t = remote.trim();
  const m =
    /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i.exec(t) ??
    /^(?:ssh:\/\/)?git@github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/i.exec(t) ??
    (options.urlOnly ? null : /^([^/:@\s]+)\/([^/:@\s]+?)(?:\.git)?$/.exec(t));
  if (!m) {return null;}
  const ok = (s: string): boolean => /^[A-Za-z0-9._-]+$/.test(s) && s !== '.' && s !== '..';
  return ok(m[1]) && ok(m[2]) ? `${m[1]}/${m[2]}` : null;
}
