/**
 * faf compile - Compile .faf to .fafb binary format
 *
 * Usage:
 *   faf compile                    # Compile project.faf → project.fafb
 *   faf compile input.faf          # Compile specific file
 *   faf compile -o output.fafb     # Custom output path
 *   faf compile --watch            # Watch and auto-recompile
 *   faf compile --benchmark        # Compare parse speeds
 */

import { chalk } from '../fix-once/colors';
import {
  compileFAF,
  watchAndCompile,
  benchmarkParsing,
  checkCompilerAvailable,
  type CompileOptions
} from '../utils/fafb-compiler';
import { fileExists } from '../utils/file-utils';

interface CommandOptions {
  output?: string;
  watch?: boolean;
  benchmark?: boolean;
  verbose?: boolean;
}

export async function compileCommand(input?: string, options: CommandOptions = {}): Promise<void> {
  console.log();

  // Check if compiler is available
  const compilerCheck = await checkCompilerAvailable();
  if (!compilerCheck.available) {
    console.log(chalk.red('❌ xai-faf-rust compiler not found'));
    console.log();
    console.log(chalk.yellow('Installation options:'));
    console.log(chalk.gray('   1. Install from cargo: cargo install xai-faf'));
    console.log(chalk.gray('   2. Download from: https://github.com/Wolfe-Jam/xai-faf-rust'));
    console.log(chalk.gray('   3. Build from source: cd ~/FAF/xai-faf-rust && cargo build --release'));
    console.log();
    process.exit(1);
  }

  const inputPath = input || 'project.faf';

  // Check if input exists
  if (!(await fileExists(inputPath))) {
    console.log(chalk.red(`❌ Input file not found: ${inputPath}`));
    console.log();
    process.exit(1);
  }

  // Watch mode
  if (options.watch) {
    await watchAndCompile(inputPath, options.output);
    return;
  }

  // Benchmark mode
  if (options.benchmark) {
    const fafbPath = options.output || inputPath.replace(/\.faf$/, '.fafb');

    // Compile first if .fafb doesn't exist
    if (!(await fileExists(fafbPath))) {
      console.log(chalk.cyan('📦 Compiling before benchmark...'));
      const result = await compileFAF({ input: inputPath, output: fafbPath, verbose: true });
      if (!result.success) {
        console.log(chalk.red(`❌ Compilation failed: ${result.error}`));
        process.exit(1);
      }
      console.log();
    }

    console.log(chalk.cyan('🏁 Running benchmark...'));
    console.log();

    try {
      const benchmark = await benchmarkParsing(inputPath, fafbPath);

      console.log(chalk.bold('Results:'));
      console.log(chalk.gray('─────────────────────────────────────'));
      console.log(chalk.white(`  .faf  parse time: ${benchmark.fafParseTime.toFixed(2)}ms`));
      console.log(chalk.white(`  .fafb parse time: ${benchmark.fafbParseTime.toFixed(2)}ms`));
      console.log();
      console.log(chalk.green(`  ⚡️ Speedup: ${benchmark.speedup.toFixed(2)}x faster`));
      console.log();
      console.log(chalk.white(`  .faf  size: ${benchmark.fafSize} bytes`));
      console.log(chalk.white(`  .fafb size: ${benchmark.fafbSize} bytes`));
      console.log(chalk.green(`  📦 Compression: ${benchmark.compressionRatio.toFixed(1)}% smaller`));
      console.log(chalk.gray('─────────────────────────────────────'));
      console.log();
    } catch (error: any) {
      console.log(chalk.red(`❌ Benchmark failed: ${error.message}`));
      process.exit(1);
    }

    return;
  }

  // Normal compile mode
  const outputPath = options.output || inputPath.replace(/\.faf$/, '.fafb');

  console.log(chalk.cyan('📦 Compiling to binary format...'));
  console.log(chalk.gray(`   Input:  ${inputPath}`));
  console.log(chalk.gray(`   Output: ${outputPath}`));
  console.log();

  const result = await compileFAF({
    input: inputPath,
    output: outputPath,
    verbose: options.verbose
  });

  if (result.success) {
    console.log(chalk.green('✅ Compilation successful!'));
    console.log();
    console.log(chalk.bold('Results:'));
    console.log(chalk.gray('─────────────────────────────────────'));
    console.log(chalk.white(`  Output: ${result.output}`));
    console.log(chalk.white(`  Size: ${result.size} bytes`));
    console.log(chalk.green(`  Compression: ${result.compressionRatio.toFixed(1)}% smaller`));
    console.log(chalk.white(`  Time: ${result.time}ms`));
    console.log(chalk.gray('─────────────────────────────────────'));
    console.log();

    console.log(chalk.gray('💡 Use with MCP servers:'));
    console.log(chalk.gray('   - claude-faf-mcp reads .fafb automatically'));
    console.log(chalk.gray('   - Faster parsing (O(1) section lookup)'));
    console.log(chalk.gray('   - Smaller size (priority truncation)'));
    console.log();
  } else {
    console.log(chalk.red('❌ Compilation failed!'));
    console.log(chalk.red(`   Error: ${result.error}`));
    console.log();
    process.exit(1);
  }
}
