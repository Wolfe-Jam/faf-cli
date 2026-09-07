/**
 * Context-drift engine — SINGLE SOURCE.
 *
 * A pure, snapshot comparison: given a `project.faf` and its directory, report
 * the mtime relationship between the .faf and each AI-context file it feeds
 * (CLAUDE.md, AGENTS.md, .cursorrules, GEMINI.md). A target NEWER than the .faf
 * has drifted — the human edited the context file and the DNA hasn't caught up.
 *
 * No console, no ANSI, no process.exit. The CLI `faf drift` renders the human
 * table on top of this; `faf drift --json` emits this shape with a metadata
 * header; the VS Code extension imports `computeDrift` directly (faf-cli as a
 * library, never a shell-out). One comparison, every consumer.
 */

import { existsSync, statSync } from 'fs';
import { dirname, join } from 'path';

/** AI-context files the .faf feeds — the drift targets, in report order. */
export const CONTEXT_FILES = ['CLAUDE.md', 'AGENTS.md', '.cursorrules', 'GEMINI.md'];

/** mtime window (ms) inside which a target counts as in sync with the .faf. */
export const DRIFT_TOLERANCE_MS = 1000;

/** 'newer' = target newer than the .faf → needs sync. */
export type DriftStatus = 'newer' | 'older' | 'in-sync' | 'missing';

export interface DriftTarget {
  /** Context-file name, e.g. 'CLAUDE.md'. */
  file: string;
  /** Whether the file exists alongside the .faf. */
  exists: boolean;
  /** File mtime in epoch ms, or null when missing. */
  mtime_ms: number | null;
  /** 'newer' = target newer than the .faf → needs sync. */
  status: DriftStatus;
  /** mtime_ms - source_mtime_ms, or null when missing. */
  delta_ms: number | null;
}

export interface DriftReport {
  /** The `project.faf` path compared against. */
  source: string;
  /** .faf mtime in epoch ms. */
  source_mtime_ms: number;
  targets: DriftTarget[];
  /** Count of targets with status 'newer' or 'older'. */
  drifted: number;
  /** Count of targets with status 'in-sync'. */
  in_sync: number;
  /** Count of targets with status 'missing'. */
  missing: number;
}

/**
 * Compare a `project.faf` against its AI-context files by mtime.
 *
 * @param fafPath  path to `project.faf`
 * @param dir      directory holding the context files; defaults to the .faf's
 *                 own directory. Never `process.cwd()` — the CLI passes it
 *                 explicitly, and a library caller (the VS Code extension)
 *                 passes the .faf's directory, which for a monorepo sub-package
 *                 is the package dir, not the workspace root.
 */
export function computeDrift(fafPath: string, dir: string = dirname(fafPath)): DriftReport {
  const sourceMtimeMs = statSync(fafPath).mtimeMs;

  const targets: DriftTarget[] = CONTEXT_FILES.map((file) => {
    const path = join(dir, file);
    if (!existsSync(path)) {
      return { file, exists: false, mtime_ms: null, status: 'missing', delta_ms: null };
    }

    const mtimeMs = statSync(path).mtimeMs;
    const deltaMs = mtimeMs - sourceMtimeMs;
    let status: DriftStatus;
    if (Math.abs(deltaMs) < DRIFT_TOLERANCE_MS) {
      status = 'in-sync';
    } else if (deltaMs > 0) {
      status = 'newer';
    } else {
      status = 'older';
    }

    return { file, exists: true, mtime_ms: mtimeMs, status, delta_ms: deltaMs };
  });

  return {
    source: fafPath,
    source_mtime_ms: sourceMtimeMs,
    targets,
    drifted: targets.filter((t) => t.status === 'newer' || t.status === 'older').length,
    in_sync: targets.filter((t) => t.status === 'in-sync').length,
    missing: targets.filter((t) => t.status === 'missing').length,
  };
}
