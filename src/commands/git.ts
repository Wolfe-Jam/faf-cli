import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { assembleFreshFaf } from '../detect/assemble.js';
import { writeFaf, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { dim, fafCyan } from '../ui/colors.js';

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

export function gitCommand(url: string): void {
  let repoUrl: string;
  try {
    repoUrl = normalizeGitUrl(url);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}\n\n  Usage: faf git <url>`);
    process.exit(1);
  }

  const tmpDir = join(tmpdir(), `faf-git-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    console.log(dim(`cloning ${url}...`));
    try {
      // execFileSync runs git directly — NO shell — so the URL can never be
      // interpreted as a command. `--` stops it being read as a flag.
      execFileSync('git', ['clone', '--depth', '1', '--', repoUrl, tmpDir], { stdio: 'pipe' });
    } catch (err) {
      const stderr = (err as { stderr?: Buffer })?.stderr?.toString() ?? '';
      const reason = stderr.trim().split('\n').slice(-2).join(' ').trim() || 'git clone failed';
      console.error(`Error: could not clone ${url}\n\n  ${reason}`);
      process.exit(1);
    }

    // Full slot-filling pipeline (shared with `faf auto`) — not detectStack alone.
    const data = assembleFreshFaf(tmpDir);
    const outputPath = join(process.cwd(), 'project.faf');
    writeFaf(outputPath, data);

    console.log(`${fafCyan('created')} ${outputPath}`);

    const yaml = readFafRaw(outputPath);
    const result = enrichScore(kernel.score(yaml));
    displayScore(result, outputPath);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
