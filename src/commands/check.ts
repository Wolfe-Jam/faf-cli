import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { findFafFile, readFafFromString, readFafRaw, withKernel } from '../interop/faf.js';
import { validateFaf } from '../core/schema.js';
import type { FafData } from '../core/types.js';
import * as kernel from '../wasm/kernel.js';
import { scoreFafYaml } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

export interface CheckOptions {
  strict?: boolean;
  fix?: boolean;
  doctor?: boolean;
  trust?: boolean;
  verbose?: boolean;
}

export function checkCommand(file?: string, options: CheckOptions = {}): void {
  const fafPath = file ?? findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  // Read as every .faf reader reads it, before anything else: a file that is
  // not valid YAML, or that is a scalar or a list, is the one-line not-yaml
  // refusal (exit 1). Exit 3 is check's own verdict on a .faf it could read:
  // a required field missing, or text the kernel does not validate.
  const data = readFafFromString(readFafRaw(fafPath), fafPath);
  const validation = validateFaf(data);

  if (!validation.valid) {
    console.log(`${bold('invalid')} ${fafPath}`);
    for (const err of validation.errors) {
      console.log(`  ${dim('x')} ${err}`);
    }
    process.exit(3);
  }

  const yaml = readFafRaw(fafPath);
  if (!kernel.validate(yaml)) {
    console.log(`${bold('invalid yaml')} ${fafPath}`);
    process.exit(3);
  }

  console.log(`${fafCyan('valid')} ${fafPath}`);

  // A key_files path that no longer exists is context that went stale: say
  // so, but as a warning. The file is still valid and the score is unchanged.
  printKeyFiles(checkKeyFiles(data, dirname(fafPath)));

  const result = withKernel(fafPath, () => scoreFafYaml(yaml));
  displayScore(result, fafPath, options.verbose);

  if (options.strict && result.score < 100) {
    console.log(dim('\n  --strict requires 100%'));
    process.exit(1);
  }
}

function printKeyFiles(paths: KeyFilesCheck): void {
  for (const p of paths.missing) {
    console.log(`  ${bold('!')} key_files: ${p} ${bold('not found')}`);
  }
  for (const p of paths.skipped) {
    console.log(`  ${dim('○')} key_files: ${p} ${dim('not checked (pattern)')}`);
  }
}

export interface KeyFilesCheck {
  /** Paths listed in key_files that are not on disk. */
  missing: string[];
  /** Glob patterns, which name no single path and are not checked. */
  skipped: string[];
}

/** Check each key_files path against the directory the .faf lives in.
 *  Reads `key_files`, or the legacy `instant_context.key_files`, the same
 *  list `faf export --agents` writes. A " — role" annotation is stripped
 *  first; a file or a directory both count as present. */
export function checkKeyFiles(data: FafData, baseDir: string): KeyFilesCheck {
  const instant = data.instant_context as { key_files?: unknown } | undefined;
  const list = data.key_files ?? instant?.key_files;
  const out: KeyFilesCheck = { missing: [], skipped: [] };
  if (!Array.isArray(list)) {return out;}

  for (const entry of list) {
    if (typeof entry !== 'string') {continue;}
    const at = entry.indexOf(' — ');
    const path = (at > 0 ? entry.slice(0, at) : entry).trim();
    if (!path) {continue;}
    if (/[*?[\]{}]/.test(path)) {
      out.skipped.push(path);
    } else if (!existsSync(resolve(baseDir, path))) {
      out.missing.push(path);
    }
  }
  return out;
}
