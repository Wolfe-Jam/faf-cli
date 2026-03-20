/**
 * faf decompile — Decompile .fafb binary to JSON using WASM kernel
 */

import { chalk } from '../fix-once/colors';
import { decompileFAFb } from '../utils/fafb-compiler';

interface DecompileOptions {
  output?: string;
}

export async function decompileCommand(input?: string, options: DecompileOptions = {}): Promise<void> {
  const fafbPath = input || 'project.fafb';

  const result = await decompileFAFb(fafbPath, options.output);

  if (result.success) {
    console.log(chalk.green(`Decompiled: ${result.input} → ${result.output}`));
    console.log(chalk.gray(`   ${result.size} bytes in ${result.time}ms`));
  } else {
    console.error(chalk.red(`Decompilation failed: ${result.error}`));
    process.exit(1);
  }
}
