/**
 * `faf diff [range]` — a SEMANTIC context diff between two `.faf` versions.
 *
 * `git diff` shows you line changes; `faf diff` shows you what the change DID to
 * your project's DNA — which slots were added / changed / removed, with their
 * registry labels, and the deterministic score delta it produced.
 *
 * Ref resolution (matches git conventions):
 *   faf diff                 HEAD's project.faf  →  working tree
 *   faf diff <ref>           <ref>               →  working tree
 *   faf diff <a>..<b>        <a>                 →  <b>
 *   faf diff <a>...<b>       merge-base(a,b)     →  <b>
 *
 * Engine reuses slots.ts (the 33-slot registry); scores come from the WASM
 * kernel (faf_score is NOT persisted in .faf — each side is scored fresh).
 */
import { execFileSync } from 'child_process';
import { readFileSync, existsSync, appendFileSync } from 'fs';
import { relative, join } from 'path';
import type { FafData } from '../core/types.js';
import { SLOTS, readSlotValue, isPlaceholder } from '../core/slots.js';
import { readFafFromString, readFafRaw, findFafFile } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { getTier, tierBadge } from '../core/tiers.js';

export type SlotChangeKind = 'added' | 'removed' | 'changed';

export interface SlotChange {
  /** Dot-path of the slot, e.g. `stack.build`. */
  path: string;
  /** Registry display label, e.g. `Build`, `CI/CD`, `API`. */
  label: string;
  /** Slot category (for grouping the output). */
  category: string;
  kind: SlotChangeKind;
  /** Prior value — present for `changed` / `removed`. */
  from?: string;
  /** New value — present for `changed` / `added`. */
  to?: string;
}

export interface FafDiff {
  changes: SlotChange[];
  scoreBase: number;
  scoreTarget: number;
  scoreDelta: number;
  filledBase: number;
  filledTarget: number;
}

const val = (v: unknown): string => String(v).trim();

/** The deliberate "this slot is N/A" sentinel — kernel-recognised as *ignored*. */
const IGNORED = 'slotignored';

/**
 * Whether a slot holds no REAL context for diff purposes: a placeholder OR the
 * `slotignored` sentinel. Scoping a slot out (absent → slotignored) isn't a
 * context change worth showing; replacing real context WITH slotignored is a
 * removal. (We don't touch `isPlaceholder` — it's load-bearing elsewhere.)
 */
const emptyForDiff = (v: unknown): boolean =>
  isPlaceholder(v) || (typeof v === 'string' && v.trim().toLowerCase() === IGNORED);

/**
 * Pure slot-by-slot diff of two parsed `.faf` objects.
 * No git, no scoring — just the registry walk. This is the testable core.
 */
export function diffSlots(
  base: FafData,
  target: FafData,
): { changes: SlotChange[]; filledBase: number; filledTarget: number } {
  const changes: SlotChange[] = [];
  let filledBase = 0;
  let filledTarget = 0;

  for (const slot of SLOTS) {
    const b = readSlotValue(base as Record<string, unknown>, slot);
    const t = readSlotValue(target as Record<string, unknown>, slot);
    const bFilled = !emptyForDiff(b);
    const tFilled = !emptyForDiff(t);
    if (bFilled) filledBase++;
    if (tFilled) filledTarget++;

    const label = slot.label ?? slot.path.split('.').pop() ?? slot.path;
    const meta = { path: slot.path, label, category: String(slot.category) };

    if (!bFilled && tFilled) {
      changes.push({ ...meta, kind: 'added', to: val(t) });
    } else if (bFilled && !tFilled) {
      changes.push({ ...meta, kind: 'removed', from: val(b) });
    } else if (bFilled && tFilled && val(b) !== val(t)) {
      changes.push({ ...meta, kind: 'changed', from: val(b), to: val(t) });
    }
  }
  return { changes, filledBase, filledTarget };
}

/** Score a raw .faf YAML via the kernel. 0 for empty/unscorable — never throws. */
function safeScore(raw: string): number {
  if (!raw.trim()) return 0;
  try {
    return scoreFafYaml(raw).score ?? 0;
  } catch {
    return 0; // malformed at a ref — treat as unscorable, don't crash the diff
  }
}

/** Parse a raw .faf YAML, tolerating empty/malformed input (→ {}). */
function safeParse(raw: string): FafData {
  if (!raw.trim()) return {} as FafData;
  try {
    return readFafFromString(raw) ?? ({} as FafData);
  } catch {
    return {} as FafData;
  }
}

/**
 * Full diff: slot changes + kernel score delta. Takes the two raw YAMLs so it
 * can both parse (for slots) and score (for the delta) each side.
 */
export function computeFafDiff(baseRaw: string, targetRaw: string): FafDiff {
  const { changes, filledBase, filledTarget } = diffSlots(safeParse(baseRaw), safeParse(targetRaw));
  const scoreBase = safeScore(baseRaw);
  const scoreTarget = safeScore(targetRaw);
  return { changes, scoreBase, scoreTarget, scoreDelta: scoreTarget - scoreBase, filledBase, filledTarget };
}

const MARK: Record<SlotChangeKind, string> = { added: '+', removed: '-', changed: '~' };
const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`);
/** Clip a value for the text view so a paragraph-length Goal/Why stays one line. */
const clip = (s: string, n = 64): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Render a FafDiff as a human-readable, category-grouped report. */
export function renderFafDiff(diff: FafDiff, baseRef: string, targetRef: string): string {
  const lines: string[] = [];
  const bBadge = tierBadge(getTier(diff.scoreBase));
  const tBadge = tierBadge(getTier(diff.scoreTarget));

  lines.push(`project.faf  ${baseRef} → ${targetRef}`);
  lines.push(`Score: ${diff.scoreBase}% ${bBadge} → ${diff.scoreTarget}% ${tBadge}  (${signed(diff.scoreDelta)})`);
  lines.push('');

  if (diff.changes.length === 0) {
    lines.push('  (no slot changes)');
  } else {
    let lastCat = '';
    for (const c of diff.changes) {
      if (c.category !== lastCat) {
        lines.push(`  ${c.category}`);
        lastCat = c.category;
      }
      const m = MARK[c.kind];
      const label = c.label.padEnd(16);
      if (c.kind === 'changed') lines.push(`    ${m} ${label} ${clip(c.from!)} → ${clip(c.to!)}`);
      else if (c.kind === 'added') lines.push(`    ${m} ${label} ${clip(c.to!)}   (added)`);
      else lines.push(`    ${m} ${label} ${clip(c.from!)}   (removed)`);
    }
  }

  lines.push('');
  lines.push(`Slots filled: ${diff.filledBase} → ${diff.filledTarget}  (${signed(diff.filledTarget - diff.filledBase)})`);
  return lines.join('\n');
}

/** Does this ref resolve to a commit? Distinguishes a typo'd ref from a ref where
 *  the .faf merely didn't exist yet (the latter is a legit "born here" diff). */
function refExists(ref: string, cwd: string): boolean {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

/** Guard an EXPLICIT user-supplied ref — a typo should error, not render a
 *  misleading "everything added" diff. (The implicit default HEAD stays tolerant
 *  so `faf diff` works in a repo with no commits yet.) */
function assertRef(ref: string, cwd: string): void {
  if (!refExists(ref, cwd)) {
    console.error(`Error: unknown git ref '${ref}' — use a branch, tag, or commit that exists.`);
    process.exit(2);
  }
}

/** Read project.faf at a git ref via `git show` (no shell). '' if absent at the ref. */
function readFafAtRef(ref: string, repoRel: string, cwd: string): string {
  try {
    return execFileSync('git', ['show', `${ref}:${repoRel}`], {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return ''; // the .faf didn't exist at that ref — a "born here" diff
  }
}

/**
 * The 7-arg GIT_EXTERNAL_DIFF protocol handler. When a `.faf` carries the
 * `diff=faf` attribute and `diff.faf.command` is set, git invokes:
 *   <name> <old-file> <old-hex> <old-mode> <new-file> <new-hex> <new-mode>
 * We read BOTH temp files git materialised and emit the semantic delta in place
 * of git's line diff — so `git diff`, `git log -p`, `git show` speak .faf.
 * (A `command` driver, NOT textconv: textconv only ever sees one blob at a time;
 *  a context delta is inherently cross-file.)
 *
 * Two edges git actually hands us, both handled here:
 *  - an UNMERGED path is passed with a SINGLE arg (the path) — there are no two
 *    sides to diff, so we say so instead of rendering a bogus "(absent)" delta.
 *  - the whole thing FAILS OPEN: a driver that throws makes `git diff` abort with
 *    "external diff died". We never let our renderer break the user's `git diff`.
 */
export function diffDriverCommand(argv: string[]): void {
  const path = argv[0] ?? 'project.faf';
  try {
    // Unmerged path → git passes only <path>. Nothing to compare.
    if (argv.length < 5) {
      console.log(`${path} — unmerged (resolve the conflict, then \`faf diff\`)`);
      return;
    }
    const read = (f?: string): string =>
      f && f !== '/dev/null' && existsSync(f) ? readFileSync(f, 'utf-8') : '';
    // Label off the FILE, not the hex: git passes /dev/null for a genuinely
    // absent side, but an all-zero hash for the (present) uncommitted worktree.
    const label = (file?: string, hex?: string): string => {
      if (!file || file === '/dev/null') return '(absent)';
      if (!hex || /^0+$/.test(hex)) return '(working tree)';
      return hex.slice(0, 7);
    };
    const diff = computeFafDiff(read(argv[1]), read(argv[4]));
    console.log(renderFafDiff(diff, label(argv[1], argv[2]), label(argv[4], argv[5])));
  } catch (err) {
    // Fail OPEN — emit a one-liner, exit 0, so `git diff` never errors over us.
    console.log(`${path} — faf diff unavailable (${err instanceof Error ? err.message : 'error'})`);
  }
}

/** The .gitattributes line that opts .faf files into the driver. */
const GA_LINE = '*.faf diff=faf';

/**
 * Does the configured runner actually resolve AND support its subcommand?
 * Catches the version-ordering trap: a driver/hook wired to a `faf` older than
 * 7.0 (which lacks `diff-driver`/`hooks-run`). Runs it with no args — a safe
 * no-op that exits 0 on a 7.0+ faf and errors ("unknown command") on an old one.
 */
export function runnerWorks(runnerCmd: string): boolean {
  const [cmd, ...args] = runnerCmd.trim().split(/\s+/);
  try {
    execFileSync(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
}

/** Resolve the git repo root, or exit(2) if not in a repo. */
function repoRoot(cwd: string): string {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf-8' }).trim();
  } catch {
    console.error('Error: not a git repository.');
    process.exit(2);
    throw new Error('unreachable');
  }
}

/**
 * Wire `faf diff` into native git: writes `.gitattributes` (*.faf diff=faf) and
 * sets `git config diff.faf.command "faf diff-driver"`. Idempotent.
 */
export function installDriver(cwd: string): void {
  const top = repoRoot(cwd);
  const ga = join(top, '.gitattributes');
  const existing = existsSync(ga) ? readFileSync(ga, 'utf-8') : '';
  if (!existing.split('\n').some((l) => l.trim() === GA_LINE)) {
    appendFileSync(ga, `${existing && !existing.endsWith('\n') ? '\n' : ''}${GA_LINE}\n`);
    console.log(`✅ .gitattributes  ${GA_LINE}`);
  } else {
    console.log(`•  .gitattributes already opts in (${GA_LINE})`);
  }
  execFileSync('git', ['config', 'diff.faf.command', 'faf diff-driver'], { cwd });
  console.log('✅ git config       diff.faf.command = faf diff-driver');
  console.log('\n→ `git diff`, `git log -p`, `git show` now render the .faf score + slot delta.');
  // Pre-flight: the `faf` git will invoke must actually support diff-driver (≥ 7.0).
  if (!runnerWorks('faf diff-driver')) {
    console.log('\n⚠  the `faf` on your PATH does not support `diff-driver` yet (needs faf ≥ 7.0).');
    console.log('   `git diff` on .faf files falls back to the raw text diff until you upgrade.');
  }
}

/** Remove the driver wiring (git config). Leaves .gitattributes for the user to keep or delete. */
export function uninstallDriver(cwd: string): void {
  repoRoot(cwd);
  try {
    execFileSync('git', ['config', '--unset', 'diff.faf.command'], { cwd, stdio: 'pipe' });
  } catch {
    /* wasn't set — fine */
  }
  console.log('✅ removed diff.faf.command (the .gitattributes line is left for you to keep or delete).');
}

export interface DiffOptions {
  json?: boolean;
  installDriver?: boolean;
  uninstallDriver?: boolean;
}

export function diffCommand(range: string | undefined, options: DiffOptions = {}, cwd: string = process.cwd()): void {
  // Driver management is a separate verb that lives on the same command.
  if (options.installDriver) return installDriver(cwd);
  if (options.uninstallDriver) return uninstallDriver(cwd);

  const fafPath = findFafFile(cwd);
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  // Resolve the .faf path relative to the git repo root (for `git show <ref>:<path>`).
  let top: string;
  try {
    top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf-8' }).trim();
  } catch {
    console.error('Error: not a git repository — faf diff compares .faf versions across git history.');
    process.exit(2);
    return;
  }
  const repoRel = relative(top, fafPath as string).split('\\').join('/'); // git wants forward slashes

  let baseRef: string;
  let targetRef: string;
  let baseRaw: string;
  let targetRaw: string;

  if (!range) {
    baseRef = 'HEAD';
    targetRef = '(working tree)';
    baseRaw = readFafAtRef('HEAD', repoRel, cwd);
    targetRaw = readFafRaw(fafPath as string);
  } else if (range.includes('...')) {
    const [a, b] = range.split('...');
    assertRef(a, cwd);
    assertRef(b, cwd);
    let mb: string;
    try {
      mb = execFileSync('git', ['merge-base', a, b], { cwd, encoding: 'utf-8' }).trim();
    } catch {
      console.error(`Error: '${a}' and '${b}' have no common ancestor — can't compute a merge-base diff.`);
      process.exit(2);
      return;
    }
    baseRef = mb.slice(0, 7);
    targetRef = b;
    baseRaw = readFafAtRef(mb, repoRel, cwd);
    targetRaw = readFafAtRef(b, repoRel, cwd);
  } else if (range.includes('..')) {
    const [a, b] = range.split('..');
    assertRef(a, cwd);
    assertRef(b, cwd);
    baseRef = a;
    targetRef = b;
    baseRaw = readFafAtRef(a, repoRel, cwd);
    targetRaw = readFafAtRef(b, repoRel, cwd);
  } else {
    assertRef(range, cwd);
    baseRef = range;
    targetRef = '(working tree)';
    baseRaw = readFafAtRef(range, repoRel, cwd);
    targetRaw = readFafRaw(fafPath as string);
  }

  const diff = computeFafDiff(baseRaw, targetRaw);

  if (options.json) {
    console.log(JSON.stringify({ base: baseRef, target: targetRef, ...diff }, null, 2));
  } else {
    console.log(renderFafDiff(diff, baseRef, targetRef));
  }
}
