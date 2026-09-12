/**
 * `faf hooks` — a pre-commit CONTEXT GUARD.
 *
 * Wires a git pre-commit hook that scores the *staged* project.faf against HEAD
 * (reusing the `faf diff` engine) and reports the score delta this commit makes:
 *
 *   ✓ faf: context 85% → 92% (+7)
 *   ⚠ faf: context 92% → 85% (−7) — context regression
 *
 * Default is WARN (informs, never blocks). `--strict` blocks a commit that
 * *regresses* the score (override with `git commit --no-verify`).
 *
 * Cardinal rule for a commit-time tool: NEVER break a legitimate commit because
 * the tool itself failed. Everything fails OPEN — only a deliberate, detected
 * regression under `--strict` ever returns non-zero.
 *
 * User-safety rules:
 *  - Opt-in only — installed by an explicit command, never on npm install.
 *  - Refuses when `core.hooksPath` is set (husky / lefthook / pre-commit own it).
 *  - Never clobbers an existing pre-commit hook — faf adds or updates only its
 *    own sentinel-marked section (whole marker lines, one pair), and removes
 *    only that section. A hook whose markers are broken is refused in one line.
 *  - A hooks folder linked outside the repo (shared by other repos) is written
 *    only to create a new hook or update faf's own section; a hook there that
 *    faf did not write is refused.
 *  - Every write goes through safe-write's one allowance for faf's git hook:
 *    atomic, link-checked, never over an edit made meanwhile.
 *  - Worktree/submodule-safe hook path (`git rev-parse --git-path`).
 *  - The hook skips entirely (zero cost) when no `.faf` is staged, and when
 *    `faf` isn't on PATH.
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, realpathSync, statSync } from 'fs';
import { resolve, dirname, relative, isAbsolute, sep } from 'path';
import { NotWrittenError, SafePathError, resolveInside, safeWriteFile } from '../core/safe-write.js';
import { readIfPresent } from '../interop/inject.js';
import { findFafFile, gitRepoRel } from '../interop/faf.js';
import { computeFafDiff, runnerWorks } from './diff.js';

const START = '# >>> faf >>>';
const END = '# <<< faf <<<';
/** The `#!/bin/sh` line install writes on top of faf's section in a hook
 *  that is blank (or not there). */
const SHEBANG = '#!/bin/sh\n';
// Canonical bin name, never the `faf` alias — a `faf` on PATH can be shadowed by
// another tool of the same name (a Rust `faf`, etc.); `faf-cli` is unambiguous
// and is installed alongside `faf` by the same package.
const RUNNER = 'faf-cli hooks-run';

const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`);

function gitTop(cwd: string): string {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf-8' }).trim();
}
function gitShow(ref: string, cwd: string): string | null {
  try {
    return execFileSync('git', ['show', ref], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch {
    return null;
  }
}
function gitConfigGet(key: string, cwd: string): string | null {
  try {
    const v = execFileSync('git', ['config', '--get', key], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    return v || null;
  } catch {
    return null;
  }
}
/** Worktree/submodule-safe absolute path to the pre-commit hook. */
function preCommitPath(cwd: string): string {
  const p = execFileSync('git', ['rev-parse', '--git-path', 'hooks/pre-commit'], { cwd, encoding: 'utf-8' }).trim();
  return resolve(cwd, p);
}

/** True when the hooks folder's real path is outside the repo's git folder —
 *  a hooks folder linked elsewhere (often shared by other repos). */
function hooksLinkedOut(cwd: string, hooksDir: string): { out: boolean; real: string } {
  const common = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd, encoding: 'utf-8' }).trim();
  const gitDir = realpathSync.native(resolve(cwd, common));
  const real = realpathSync.native(hooksDir);
  const rel = relative(gitDir, real);
  return { out: rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel), real };
}

/** Where faf's section sits in a hook: whole marker lines (a trailing CR
 *  allowed), exactly one START before exactly one END — from the start of
 *  the START line to just past the END line. null when the hook has no
 *  marker line; 'broken' when the markers are anything but one clean pair
 *  (faf cannot tell its section from yours). */
export function fafHookSection(text: string): { start: number; end: number } | null | 'broken' {
  const starts: number[] = [];
  const ends: number[] = [];
  let at = 0;
  for (const line of text.split(/(?<=\n)/)) {
    const bare = line.replace(/\n$/, '').replace(/\r$/, '');
    if (bare === START) {starts.push(at);}
    if (bare === END) {ends.push(at + line.length);}
    at += line.length;
  }
  if (starts.length === 0 && ends.length === 0) {return null;}
  if (starts.length !== 1 || ends.length !== 1 || ends[0] <= starts[0]) {return 'broken';}
  return { start: starts[0], end: ends[0] };
}

/** The mode for the hook faf writes: a new hook 0755; an existing one keeps
 *  its bits, with execute added wherever read is set (`chmod +x`). */
function hookMode(real: string, exists: boolean): number {
  if (!exists) {return 0o755;}
  const mode = statSync(real).mode & 0o777;
  return mode | ((mode & 0o444) >> 2);
}

/** The hook's real path and text, or a one-line reason faf will not touch it. */
function readHook(hookFile: string): { real: string; text: string | null } | string {
  try {
    const real = resolveInside(dirname(hookFile), hookFile, { allowGitHooks: true });
    return { real, text: readIfPresent(real) };
  } catch (e) {
    if (e instanceof SafePathError) {return `${e.message} faf left the hook as it is.`;}
    throw e;
  }
}

/** Write the hook through safe-write's git-hook allowance. A refusal — or a
 *  write that failed with the hook left as it was ("not written; original
 *  kept": a read-only hook, a full disk) — is returned as one line, never a
 *  stack trace. */
function writeHook(hookFile: string, next: string, expect: string | null, mode: number): string | null {
  try {
    safeWriteFile(hookFile, next, { root: dirname(hookFile), allowGitHooks: true, expect, mode });
    return null;
  } catch (e) {
    if (e instanceof SafePathError || e instanceof NotWrittenError) {return e.message;}
    throw e;
  }
}

const BROKEN = 'has a faf marker line without its pair (or more than one faf block) — faf cannot tell its section from yours, so it left the hook as it is. Fix the marker lines by hand.';

// ── the guard the hook invokes ────────────────────────────────────────────────

export interface HooksRunOptions {
  strict?: boolean;
}

/**
 * The pre-commit guard. Scores staged project.faf vs HEAD and reports the delta.
 * Fails OPEN on everything except a deliberate strict-mode regression.
 */
export function hooksRun(options: HooksRunOptions = {}, cwd: string = process.cwd()): void {
  try {
    let top: string;
    try {
      top = gitTop(cwd);
    } catch {
      return; // not a git repo — nothing to guard
    }
    const fafPath = findFafFile(cwd);
    if (!fafPath) {return;} // no context file — nothing to guard

    void top; // computed above purely as the in-repo guard
    const repoRel = gitRepoRel(fafPath, cwd); // git-computed → Windows 8.3-safe
    const staged = gitShow(`:${repoRel}`, cwd);
    if (staged === null) {return;} // project.faf not staged (or staged for deletion) — silent pass

    const head = gitShow(`HEAD:${repoRel}`, cwd) ?? ''; // '' on first commit / newly-added file
    const diff = computeFafDiff(head, staged);
    const arrow = `${diff.scoreBase}% → ${diff.scoreTarget}% (${signed(diff.scoreDelta)})`;

    if (diff.scoreDelta < 0) {
      console.error(`⚠ faf: context regressed ${arrow} — ${diff.changes.length} slot change(s)`);
      if (options.strict) {
        console.error('  commit blocked (--strict). Fix with `faf score` / `faf sync`, or `git commit --no-verify` to override.');
        process.exit(1); // the ONE deliberate block
      }
    } else {
      console.log(`✓ faf: context ${arrow}`);
    }
  } catch (err) {
    // Fail OPEN: a guard must never break a commit because it crashed.
    console.error(`faf hooks: skipped (${err instanceof Error ? err.message : 'error'})`);
  }
}

// ── install / uninstall / status ──────────────────────────────────────────────

/** Build the sentinel-wrapped hook block. Composable (no early `exit` in warn). */
function buildBlock(runnerCmd: string, strict: boolean): string {
  const guard = runnerCmd.trim().split(/\s+/)[0]; // first token, e.g. `faf`
  // Only spend the faf startup when a .faf is actually staged, and only if the
  // runner is installed. Warn → `|| true` (never blocks). Strict → `|| exit 1`.
  const tail = strict ? `${runnerCmd} --strict || exit 1` : `${runnerCmd} || true`;
  return [
    START,
    `if command -v ${guard} >/dev/null 2>&1 && git diff --cached --name-only 2>/dev/null | grep -qE '\\.faf$'; then`,
    `  ${tail}`,
    'fi',
    END,
    '',
  ].join('\n');
}

export interface InstallOptions {
  strict?: boolean;
  /** Internal: the command the hook calls. Defaults to `faf-cli hooks-run`. Tests override. */
  runnerCmd?: string;
}

/** Install (or update) the pre-commit guard. Returns false if refused (caller decides exit). */
export function installHooks(cwd: string, options: InstallOptions = {}): boolean {
  let top: string;
  try {
    top = gitTop(cwd);
  } catch {
    console.error('Error: not a git repository — run `git init` first.');
    return false;
  }

  // Don't fight a hook manager that owns the hooks directory.
  const hooksPath = gitConfigGet('core.hooksPath', cwd);
  if (hooksPath) {
    const runner = options.runnerCmd ?? RUNNER;
    console.error(`Error: core.hooksPath is set (${hooksPath}) — a hook manager (husky/lefthook/pre-commit) owns hooks here.`);
    console.error('  faf won\'t touch a managed hooks directory. Add this to your pre-commit yourself:');
    console.error(`    ${runner}${options.strict ? ' --strict' : ''}`);
    return false;
  }

  void top; // (repo confirmed; path resolved below is worktree-safe)
  const hookFile = preCommitPath(cwd);
  const runner = options.runnerCmd ?? RUNNER;

  // Pre-flight the version-ordering trap: the runner must support `hooks-run`
  // (faf-cli ≥ 7.0). A --strict hook wired to an older faf-cli would error on
  // every commit and BLOCK it — refuse that outright. Warn for the harmless case.
  if (!runnerWorks(runner)) {
    const cmd = runner.trim().split(/\s+/)[0];
    if (options.strict) {
      console.error(`Error: \`${cmd}\` on PATH doesn't support \`hooks-run\` yet (needs faf-cli ≥ 7.0).`);
      console.error('  A --strict hook against an older faf-cli would BLOCK your commits. Upgrade, then re-install.');
      return false;
    }
    console.log(`⚠  \`${cmd}\` on PATH doesn't support \`hooks-run\` yet (needs faf-cli ≥ 7.0) — the hook no-ops until you upgrade.`);
  }

  const block = buildBlock(runner, !!options.strict);

  // faf never creates a folder inside .git: a missing hooks folder is the user's to make.
  const hooksDir = dirname(hookFile);
  if (!existsSync(hooksDir)) {
    console.error(`Error: ${hooksDir} does not exist — faf does not create folders inside .git. Create it (mkdir -p) and re-run.`);
    return false;
  }
  const read = readHook(hookFile);
  if (typeof read === 'string') {
    console.error(`Error: ${read}`);
    return false;
  }
  const { real, text } = read;
  const section = text === null ? null : fafHookSection(text);
  if (section === 'broken') {
    console.error(`Error: ${hookFile} ${BROKEN}`);
    return false;
  }
  let content: string;
  if (text === null) {
    content = `${SHEBANG}${block}`;
  } else if (section) {
    // Update faf's own section in place (mode change / re-install) — never duplicate.
    content = text.slice(0, section.start) + block + text.slice(section.end);
  } else {
    // A hook faf did not write: in a hooks folder shared outside this repo it
    // is left alone; here, faf adds its own section after the user's lines.
    const linked = hooksLinkedOut(cwd, hooksDir);
    if (linked.out) {
      console.error(`Error: ${hookFile} is in a hooks folder outside this repo (${linked.real}) and faf did not write it — faf left it as it is. Add \`${runner}${options.strict ? ' --strict' : ''}\` to it yourself.`);
      return false;
    }
    if (text.trim() === '') {content = `${SHEBANG}${block}${text}`;}
    else {content = text.endsWith('\n') ? `${text}\n${block}` : `${text}\n\n${block}`;}
  }

  const refused = writeHook(hookFile, content, text, hookMode(real, text !== null));
  if (refused) {
    console.error(`Error: ${refused}`);
    return false;
  }
  console.log(`✅ pre-commit context guard installed — ${options.strict ? 'STRICT (blocks on score regression)' : 'warn (informs only)'}`);
  console.log('   Skips when no .faf is staged · respects `git commit --no-verify` · fails open.');
  return true;
}

/** `before` (the hook's text up to faf's start marker) without what install
 *  wrote there: the blank separator line between your lines and faf's
 *  section — one `\n` after your last line end, when your lines hold more
 *  than blank space — or, when everything outside faf's section is blank
 *  (`after` is the text past its end marker), the `#!/bin/sh` line install
 *  wrote directly above the start marker. Anything else before the marker is
 *  left as it is. */
function withoutInstallLines(before: string, after: string): string {
  if (before === SHEBANG && after.trim() === '') {return '';}
  return before.endsWith('\n\n') && before.slice(0, -1).trim() !== '' ? before.slice(0, -1) : before;
}

/** Remove only the faf sentinel block; preserve any other hook content. */
export function uninstallHooks(cwd: string): boolean {
  let hookFile: string;
  try {
    hookFile = preCommitPath(cwd);
  } catch {
    console.error('Error: not a git repository.');
    return false;
  }
  if (!existsSync(hookFile)) {
    console.log('• no pre-commit hook to clean.');
    return true;
  }
  const read = readHook(hookFile);
  if (typeof read === 'string') {
    console.error(`Error: ${read}`);
    return false;
  }
  const { real, text } = read;
  const section = text === null ? null : fafHookSection(text);
  if (section === 'broken') {
    console.error(`Error: ${hookFile} ${BROKEN}`);
    return false;
  }
  if (text === null || section === null) {
    console.log('• faf block not found in pre-commit — nothing to remove.');
    return true;
  }
  // Only faf's own section goes — with the blank line install put before it
  // in a hook of yours, or the `#!/bin/sh` line it put on top of a blank
  // hook — and every other byte of the hook stays.
  const after = text.slice(section.end);
  const refused = writeHook(hookFile, withoutInstallLines(text.slice(0, section.start), after) + after, text, statSync(real).mode & 0o777);
  if (refused) {
    console.error(`Error: ${refused}`);
    return false;
  }
  console.log('✅ faf pre-commit block removed (other hook content preserved).');
  return true;
}

/** Report the guard's install state + any hook-manager conflict. */
export function hooksStatus(cwd: string): void {
  let hookFile: string;
  try {
    hookFile = preCommitPath(cwd);
  } catch {
    console.error('Error: not a git repository.');
    return;
  }
  const hooksPath = gitConfigGet('core.hooksPath', cwd);
  const content = existsSync(hookFile) ? readFileSync(hookFile, 'utf-8') : '';
  const installed = content.includes(START);
  const strict = /hooks-run --strict/.test(content);
  console.log('faf pre-commit context guard');
  console.log(`  installed:  ${installed ? `yes (${strict ? 'strict' : 'warn'})` : 'no'}`);
  if (hooksPath) {console.log(`  ⚠ core.hooksPath = ${hooksPath} (a hook manager owns hooks — faf won't install here)`);}
  if (!installed && !hooksPath) {console.log('  → `faf hooks --install` (add --strict to block on regression)');}
}

export interface HooksOptions {
  install?: boolean;
  uninstall?: boolean;
  strict?: boolean;
}

export function hooksCommand(options: HooksOptions = {}): void {
  const cwd = process.cwd();
  if (options.install) {
    if (!installHooks(cwd, { strict: options.strict })) {process.exit(2);}
    return;
  }
  if (options.uninstall) {
    if (!uninstallHooks(cwd)) {process.exit(2);}
    return;
  }
  hooksStatus(cwd);
}
