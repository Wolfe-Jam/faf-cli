/**
 * faf compile — Compile .faf to .fafb binary using WASM kernel
 */

import { chalk } from '../fix-once/colors';
import {
  compileFAF,
  watchAndCompile,
  benchmarkParsing,
} from '../utils/fafb-compiler';

interface CommandOptions {
  output?: string;
  watch?: boolean;
  benchmark?: boolean;
  verbose?: boolean;
}

export async function compileCommand(input?: string, options: CommandOptions = {}): Promise<void> {
  const fafPath = input || 'project.faf';

  // Watch mode
  if (options.watch) {
    return watchAndCompile(fafPath, options.output);
  }

  // Benchmark mode
  if (options.benchmark) {
    try {
      const fafbPath = options.output || fafPath.replace(/\.faf$/, '.fafb');
      const bench = await benchmarkParsing(fafPath, fafbPath);
      console.log(chalk.cyan('\nBenchmark Results:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`  .faf parse:  ${bench.fafParseTime.toFixed(3)}ms`);
      console.log(`  .fafb parse: ${bench.fafbParseTime.toFixed(3)}ms`);
      console.log(`  Speedup:     ${bench.speedup.toFixed(1)}x`);
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`  .faf size:   ${bench.fafSize} bytes`);
      console.log(`  .fafb size:  ${bench.fafbSize} bytes`);
      console.log(`  Reduction:   ${bench.compressionRatio.toFixed(1)}%`);
    } catch (error: any) {
      console.error(chalk.red(`Benchmark failed: ${error.message}`));
      process.exit(1);
    }
    return;
  }

  // Standard compile
  const result = await compileFAF({
    input: fafPath,
    output: options.output,
    verbose: options.verbose
  });

  if (result.success) {
    console.log(chalk.green(`Compiled: ${result.input} → ${result.output}`));
    console.log(chalk.gray(`   ${result.size} bytes (${result.compressionRatio.toFixed(1)}% smaller) in ${result.time}ms`));
  } else {
    console.error(chalk.red(`Compilation failed: ${result.error}`));
    process.exit(1);
  }
}
