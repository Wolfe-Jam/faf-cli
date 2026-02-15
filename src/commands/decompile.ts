/**
 * faf decompile - Decompile .fafb binary back to .faf YAML
 *
 * Usage:
 *   faf decompile project.fafb           # Decompile to project.faf
 *   faf decompile input.fafb -o out.faf  # Custom output
 */

import { chalk } from '../fix-once/colors';
import { decompileFAFb, checkCompilerAvailable } from '../utils/fafb-compiler';
import { fileExists } from '../utils/file-utils';

interface DecompileOptions {
  output?: string;
}

export async function decompileCommand(input?: string, options: DecompileOptions = {}): Promise<void> {
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

  const inputPath = input || 'project.fafb';

  // Check if input exists
  if (!(await fileExists(inputPath))) {
    console.log(chalk.red(`❌ Input file not found: ${inputPath}`));
    console.log();
    console.log(chalk.gray('💡 Tip: Use "faf compile" to create .fafb files first'));
    console.log();
    process.exit(1);
  }

  const outputPath = options.output || inputPath.replace(/\.fafb$/, '.faf');

  console.log(chalk.cyan('📤 Decompiling binary to YAML...'));
  console.log(chalk.gray(`   Input:  ${inputPath}`));
  console.log(chalk.gray(`   Output: ${outputPath}`));
  console.log();

  const result = await decompileFAFb(inputPath, outputPath);

  if (result.success) {
    console.log(chalk.green('✅ Decompilation successful!'));
    console.log();
    console.log(chalk.bold('Results:'));
    console.log(chalk.gray('─────────────────────────────────────'));
    console.log(chalk.white(`  Output: ${result.output}`));
    console.log(chalk.white(`  Size: ${result.size} bytes`));
    console.log(chalk.white(`  Time: ${result.time}ms`));
    console.log(chalk.gray('─────────────────────────────────────'));
    console.log();

    console.log(chalk.gray('💡 Use for debugging:'));
    console.log(chalk.gray('   - Verify binary format correctness'));
    console.log(chalk.gray('   - Compare with original .faf'));
    console.log(chalk.gray('   - Troubleshoot compilation issues'));
    console.log();
  } else {
    if (result.error?.includes('not yet implemented')) {
      console.log(chalk.yellow('⚠️ Decompile command coming soon!'));
      console.log();
      console.log(chalk.gray('Currently implementing in xai-faf-rust.'));
      console.log(chalk.gray('For now, use the original .faf file as source of truth.'));
      console.log();
      console.log(chalk.gray('Track progress: https://github.com/Wolfe-Jam/xai-faf-rust'));
      console.log();
    } else {
      console.log(chalk.red('❌ Decompilation failed!'));
      console.log(chalk.red(`   Error: ${result.error}`));
      console.log();
      process.exit(1);
    }
  }
}
