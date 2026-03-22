import { bold, dim, fafCyan } from '../ui/colors.js';
import * as kernel from '../wasm/kernel.js';

export interface InfoOptions {
  version?: boolean;
  faq?: boolean;
  index?: boolean;
  stacks?: boolean;
}

export function infoCommand(options: InfoOptions = {}): void {
  if (options.version || Object.keys(options).length === 0) {
    showVersion();
  }
}

function showVersion(): void {
  const pkg = require('../../package.json');
  console.log(`${fafCyan(bold('faf'))} v${pkg.version}`);
  console.log(dim(`kernel ${kernel.sdkVersion()}  IANA application/vnd.faf+yaml`));
}
