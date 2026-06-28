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
 * User-safety guarantees:
 *  - Opt-in only — installed by an explicit command, never on npm install.
 *  - Refuses when `core.hooksPath` is set (husky / lefthook / pre-commit own it).
 *  - Never clobbers an existing pre-commit hook — appends a sentinel-marked block.
 *  - Worktree/submodule-safe hook path (`git rev-parse --git-path`).
 *  - The hook skips entirely (zero cost) when no `.faf` is staged, and when
 *    `faf` isn't on PATH.
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, chmodSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { findFafFile, gitRepoRel } from '../interop/faf.js';
import { computeFafDiff, runnerWorks } from './diff.js';

const START = '# >>> faf >>>';
const END = '# <<< faf <<<';
const RUNNER = 'faf hooks-run';

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
  /** Internal: the command the hook calls. Defaults to `faf hooks-run`. Tests override. */
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
  // (faf ≥ 7.0). A --strict hook wired to an older faf would error on every
  // commit and BLOCK it — refuse that outright. Warn for the harmless warn case.
  if (!runnerWorks(runner)) {
    const cmd = runner.trim().split(/\s+/)[0];
    if (options.strict) {
      console.error(`Error: \`${cmd}\` on PATH doesn't support \`hooks-run\` yet (needs faf ≥ 7.0).`);
      console.error('  A --strict hook against an older faf would BLOCK your commits. Upgrade faf, then re-install.');
      return false;
    }
    console.log(`⚠  \`${cmd}\` on PATH doesn't support \`hooks-run\` yet (needs faf ≥ 7.0) — the hook no-ops until you upgrade.`);
  }

  const block = buildBlock(runner, !!options.strict);

  let content = existsSync(hookFile) ? readFileSync(hookFile, 'utf-8') : '';
  const s = content.indexOf(START);
  const e = content.indexOf(END);
  if (s !== -1 && e !== -1) {
    // Update in place (mode change / re-install) — splice, don't duplicate.
    const after = content.slice(e + END.length).replace(/^\n/, '');
    content = content.slice(0, s) + block + after;
  } else if (content.trim()) {
    // Append to an existing user hook — never clobber their content.
    content = content.endsWith('\n') ? `${content}\n${block}` : `${content}\n\n${block}`;
  } else {
    content = `#!/bin/sh\n${block}`;
  }

  mkdirSync(dirname(hookFile), { recursive: true });
  writeFileSync(hookFile, content);
  chmodSync(hookFile, 0o755);
  console.log(`✅ pre-commit context guard installed — ${options.strict ? 'STRICT (blocks on score regression)' : 'warn (informs only)'}`);
  console.log('   Skips when no .faf is staged · respects `git commit --no-verify` · fails open.');
  return true;
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
  const content = readFileSync(hookFile, 'utf-8');
  const s = content.indexOf(START);
  const e = content.indexOf(END);
  if (s === -1 || e === -1) {
    console.log('• faf block not found in pre-commit — nothing to remove.');
    return true;
  }
  const next = (content.slice(0, s) + content.slice(e + END.length).replace(/^\n/, '')).replace(/^#!\/bin\/sh\s*$/, '#!/bin/sh\n');
  writeFileSync(hookFile, next);
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
