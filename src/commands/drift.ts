import { findFafFile, readFaf } from '../interop/faf.js';
import { computeDrift, type DriftReport } from '../core/drift.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

export interface DriftOptions {
  json?: boolean;
}

/** Check context drift between .faf and context files */
export function driftCommand(options: DriftOptions = {}): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    // `--json` means JSON on every path — a consumer that asked for it should
    // never have to parse a stderr string. Exit 2 still signals the failure.
    if (options.json) {
      console.log(
        JSON.stringify({ error: 'project.faf not found', hint: "run 'faf init' to create one" }, null, 2),
      );
    } else {
      console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    }
    process.exit(2);
  }

  const report = computeDrift(fafPath, process.cwd());

  if (options.json) {
    // The drift report plus a self-describing metadata header (project /
    // source / faf_version), the same shape `faf score --json` uses. `report`
    // already carries `source`. Raw *_ms numbers only — the consumer formats
    // its own "5d ago" so the payload stays deterministic (no Date.now()).
    const data = readFaf(fafPath);
    const snapshot = {
      faf_version: data.faf_version ?? 'unknown',
      project: data.project?.name ?? 'unknown',
      ...report,
    };
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  printDriftTable(report);
}

/** The human view — the formatted mtime table (unchanged output). */
function printDriftTable(report: DriftReport): void {
  console.log(`${fafCyan('drift')} ${dim('— context file sync status')}\n`);
  console.log(`  ${bold('.faf')} ${dim(formatAge(report.source_mtime_ms))}`);

  for (const target of report.targets) {
    if (target.status === 'missing' || target.mtime_ms === null) {
      console.log(`  ${dim('○')} ${target.file} ${dim('missing')}`);
      continue;
    }

    const age = dim(formatAge(target.mtime_ms));
    if (target.status === 'in-sync') {
      console.log(`  ${fafCyan('●')} ${target.file} ${dim('in sync')}`);
    } else if (target.status === 'newer') {
      console.log(`  ${bold('!')} ${target.file} ${bold('newer')} ${age}`);
    } else {
      console.log(`  ${dim('○')} ${target.file} ${dim('older')} ${age}`);
    }
  }

  if (report.drifted > 0) {
    console.log(dim(`\n  run ${bold("'faf sync'")} to resolve drift`));
  }
}

function formatAge(mtimeMs: number): string {
  const ago = Date.now() - mtimeMs;
  const secs = Math.floor(ago / 1000);
  if (secs < 60) {return `${secs}s ago`;}
  const mins = Math.floor(secs / 60);
  if (mins < 60) {return `${mins}m ago`;}
  const hours = Math.floor(mins / 60);
  if (hours < 24) {return `${hours}h ago`;}
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
