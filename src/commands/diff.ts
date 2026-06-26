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
import { relative } from 'path';
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

export interface DiffOptions {
  json?: boolean;
}

export function diffCommand(range: string | undefined, options: DiffOptions = {}): void {
  const cwd = process.cwd();
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
    const mb = execFileSync('git', ['merge-base', a, b], { cwd, encoding: 'utf-8' }).trim();
    baseRef = mb.slice(0, 7);
    targetRef = b;
    baseRaw = readFafAtRef(mb, repoRel, cwd);
    targetRaw = readFafAtRef(b, repoRel, cwd);
  } else if (range.includes('..')) {
    const [a, b] = range.split('..');
    baseRef = a;
    targetRef = b;
    baseRaw = readFafAtRef(a, repoRel, cwd);
    targetRaw = readFafAtRef(b, repoRel, cwd);
  } else {
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
