import { readFileSync } from 'fs';
import * as kernel from '../wasm/kernel.js';

export interface DecompileOptions {
  output?: string;
}

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

  const info = kernel.decompile(bytes);
  console.log(JSON.stringify(info, null, 2));
}
