import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import * as kernel from '../wasm/kernel.js';
import { writeRendered } from '../core/render-hash.js';
import { refuseMissingOutputFolder } from '../core/refusal.js';
import { withKernel } from '../interop/faf.js';
import { sameFile } from './compile.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface DecompileOptions {
  output?: string;
  /** With --output: replace a file faf cannot prove it wrote (edited since, or not a faf decompile). */
  force?: boolean;
}

/**
 * `faf decompile <file>` — print a .fafb's structure as JSON, or write it to
 * `--output`. The output file carries faf's render hash
 * (`_meta["one.faf/render"]`), as every whole file faf writes does: a file
 * already there is replaced only while it is byte for byte what faf last
 * wrote there, anything else is refused in one line and left as it is unless
 * `--force`, and the output never goes over the .fafb being read — not even
 * with `--force`. The write is atomic and never goes through a link that
 * leaves the output's folder or dangles.
 */
export function decompileCommand(file: string, options: DecompileOptions = {}): void {
  if (!file) {
    console.error('Error: Please specify a .fafb file to decompile.');
    process.exit(1);
  }

  const bytes = new Uint8Array(readFileSync(file));

  // Check FAFB magic
  if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'FAFB') {
    console.error('Error: Not a valid .fafb file (missing FAFB magic bytes).');
    process.exit(3);
  }

  // A .fafb the kernel cannot read (cut short, say) is one line.
  const info = withKernel(file, () => kernel.decompile(bytes));
  const json = JSON.stringify(info, null, 2);
  if (!options.output) {
    console.log(json);
    return;
  }

  if (sameFile(options.output, file)) {
    console.error(`faf: ${resolve(options.output)} is the file being decompiled — faf does not write the JSON over it, and left it unchanged. Name another output with --output.`);
    process.exit(1);
  }
  // An --output folder that is not there is one line: faf does not create it.
  refuseMissingOutputFolder(options.output);
  // No decompile output before 7.13 was ever written (--output was ignored),
  // so a file without faf's render hash is not faf's.
  const { result } = writeRendered(options.output, `${json}\n`, {
    root: dirname(resolve(options.output)),
    format: 'json',
    hasMark: () => false,
    mark: 'faf render hash (`_meta["one.faf/render"]`)',
    force: options.force,
  });
  console.log(`${fafCyan('decompiled')} ${options.output}${result === 'unchanged' ? ` ${dim('(unchanged)')}` : ''}`);
}
