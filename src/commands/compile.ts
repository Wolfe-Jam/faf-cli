import { statSync } from 'fs';
import { dirname, resolve } from 'path';
import { findFafFile, readFafFromString, readFafRaw, withKernel } from '../interop/faf.js';
import { safeReplaceOwned } from '../core/safe-write.js';
import * as kernel from '../wasm/kernel.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface CompileOptions {
  output?: string;
  /** Replace an output file that is not a .fafb faf compiled. */
  force?: boolean;
}

/** True when `bytes` are a .fafb — they start with the FAFB magic every
 *  .fafb faf compiles carries. faf replaces only such a file. */
export function isFafbBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x46 && bytes[1] === 0x41 && bytes[2] === 0x46 && bytes[3] === 0x42;
}

/** faf's mark on a .fafb, in words, for the refusal. */
export const FAFB_MARK = 'FAFB header (a .fafb faf compiled)';

/** The .fafb a .faf compiles to by default: its name with a `.faf` ending
 *  (any case) turned into `.fafb`, or `.fafb` added to any other name
 *  (`notes.fafm` → `notes.fafm.fafb`) — never the source's own path. */
export function fafbPathFor(fafPath: string): string {
  return /\.faf$/i.test(fafPath) ? fafPath.replace(/\.faf$/i, '.fafb') : `${fafPath}.fafb`;
}

/** True when `a` and `b` name the same file on disk (same path, or the same
 *  device and inode: a case variant on a case-insensitive disk, a link). */
export function sameFile(a: string, b: string): boolean {
  if (resolve(a) === resolve(b)) {return true;}
  try {
    const x = statSync(a);
    const y = statSync(b);
    return x.dev === y.dev && x.ino === y.ino;
  } catch {
    return false; // one of them is not there: not the same file
  }
}

export function compileCommand(file?: string, options: CompileOptions = {}): void {
  const fafPath = file ?? findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const yaml = readFafRaw(fafPath);
  // Parsed first: text that is not valid YAML is the one-line refusal every
  // .faf reader gives; what the kernel cannot read is one line too. A
  // leading BOM is not compiled (kernel.compile), as in faf score.
  readFafFromString(yaml, fafPath);
  const binary = withKernel(fafPath, () => kernel.compile(yaml));

  // Next to the .faf by default (the project folder is the boundary); an
  // --output path is its own folder's. Atomic, never through a link that leaves
  // that folder or dangles, and never over a file that is not a .fafb.
  const outputPath = options.output ?? fafbPathFor(fafPath);
  // The binary never goes over its own source — not even with --force, which
  // is for an output file faf did not compile.
  if (sameFile(outputPath, fafPath)) {
    console.error(`faf: ${resolve(outputPath)} is the file being compiled — faf does not write the .fafb over its source, and left it unchanged. Name another output with --output.`);
    process.exit(1);
  }
  const root = options.output ? dirname(resolve(outputPath)) : dirname(resolve(fafPath));
  safeReplaceOwned(outputPath, binary, { root, owns: isFafbBytes, mark: FAFB_MARK, force: options.force });

  console.log(`${fafCyan('compiled')} ${outputPath} ${dim(`(${binary.length} bytes)`)}`);
}
