import { dirname, resolve } from 'path';
import { findFafFile, readFafRaw } from '../interop/faf.js';
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

export function compileCommand(file?: string, options: CompileOptions = {}): void {
  const fafPath = file ?? findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const yaml = readFafRaw(fafPath);
  const binary = kernel.compile(yaml);

  // Next to the .faf by default (the project folder is the boundary); an
  // --output path is its own folder's. Atomic, never through a link that leaves
  // that folder or dangles, and never over a file that is not a .fafb.
  const outputPath = options.output ?? fafPath.replace(/\.faf$/, '.fafb');
  const root = options.output ? dirname(resolve(outputPath)) : dirname(resolve(fafPath));
  safeReplaceOwned(outputPath, binary, { root, owns: isFafbBytes, mark: FAFB_MARK, force: options.force });

  console.log(`${fafCyan('compiled')} ${outputPath} ${dim(`(${binary.length} bytes)`)}`);
}
