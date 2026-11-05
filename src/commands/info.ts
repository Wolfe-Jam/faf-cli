import { bold, dim, fafCyan } from '../ui/colors.js';
import * as kernel from '../wasm/kernel.js';

export interface InfoOptions {
  version?: boolean;
}

/** `faf info` and `faf info --version` print the same: the version, kernel and media type. */
export function infoCommand(_options: InfoOptions = {}): void {
  showVersion();
}

function showVersion(): void {
  const pkg = require('../../package.json');
  console.log(`${fafCyan(bold('faf'))} v${pkg.version}`);
  console.log(dim(`kernel ${kernel.sdkVersion()}  IANA application/vnd.faf+yaml`));
}
