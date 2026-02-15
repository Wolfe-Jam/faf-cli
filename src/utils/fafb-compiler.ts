/**
 * 🏎️ FAFb Compiler Wrapper
 * Wraps xai-faf-rust compiler for .faf → .fafb compilation
 */

import { execSync, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { chalk } from '../fix-once/colors';

export interface CompileOptions {
  input?: string;
  output?: string;
  verbose?: boolean;
  watch?: boolean;
}

export interface CompileResult {
  success: boolean;
  input: string;
  output: string;
  size: number;
  compressionRatio: number;
  time: number;
  error?: string;
}

export interface BenchmarkResult {
  fafParseTime: number;
  fafbParseTime: number;
  speedup: number;
  fafSize: number;
  fafbSize: number;
  compressionRatio: number;
}

/**
 * Check if xai-faf-rust compiler is available
 */
export async function checkCompilerAvailable(): Promise<{ available: boolean; path?: string; error?: string }> {
  // Try multiple locations
  const possiblePaths = [
    '/usr/local/bin/xai-faf',
    path.join(process.env.HOME || '~', '.cargo/bin/xai-faf'),
    path.join(process.env.HOME || '~', 'FAF/xai-faf-rust/target/release/xai-faf'),
    'xai-faf', // In PATH
  ];

  for (const compilerPath of possiblePaths) {
    try {
      const expandedPath = compilerPath.replace('~', process.env.HOME || '~');
      execSync(`"${expandedPath}" --version`, { stdio: 'pipe' });
      return { available: true, path: expandedPath };
    } catch {
      // Try next path
    }
  }

  return {
    available: false,
    error: 'xai-faf-rust compiler not found. Install from: https://github.com/Wolfe-Jam/xai-faf-rust'
  };
}

/**
 * Get compiler path or throw error
 */
async function getCompilerPath(): Promise<string> {
  const check = await checkCompilerAvailable();
  if (!check.available) {
    throw new Error(check.error);
  }
  return check.path!;
}

/**
 * Compile .faf to .fafb
 */
export async function compileFAF(options: CompileOptions = {}): Promise<CompileResult> {
  const startTime = Date.now();

  // Default input/output
  const input = options.input || 'project.faf';
  const output = options.output || input.replace(/\.faf$/, '.fafb');

  try {
    // Check if input exists
    await fs.access(input);

    // Get input size
    const inputStats = await fs.stat(input);
    const inputSize = inputStats.size;

    // Get compiler
    const compilerPath = await getCompilerPath();

    // Run compilation
    if (options.verbose) {
      console.log(chalk.gray(`   Compiling: ${input} → ${output}`));
    }

    execSync(`"${compilerPath}" compile --input "${input}" --output "${output}"`, {
      stdio: options.verbose ? 'inherit' : 'pipe'
    });

    // Get output size
    const outputStats = await fs.stat(output);
    const outputSize = outputStats.size;

    const compressionRatio = ((inputSize - outputSize) / inputSize) * 100;
    const time = Date.now() - startTime;

    return {
      success: true,
      input,
      output,
      size: outputSize,
      compressionRatio,
      time
    };
  } catch (error: any) {
    return {
      success: false,
      input,
      output,
      size: 0,
      compressionRatio: 0,
      time: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Decompile .fafb to .faf (for debugging)
 */
export async function decompileFAFb(input: string, output?: string): Promise<CompileResult> {
  const startTime = Date.now();
  const outputPath = output || input.replace(/\.fafb$/, '.faf');

  try {
    // Check if input exists
    await fs.access(input);

    const compilerPath = await getCompilerPath();

    // Run decompilation (will add this command to xai-faf-rust)
    execSync(`"${compilerPath}" decompile --input "${input}" --output "${outputPath}"`, {
      stdio: 'pipe'
    });

    const outputStats = await fs.stat(outputPath);

    return {
      success: true,
      input,
      output: outputPath,
      size: outputStats.size,
      compressionRatio: 0,
      time: Date.now() - startTime
    };
  } catch (error: any) {
    // If decompile command doesn't exist yet, read binary manually
    if (error.message.includes('decompile')) {
      return {
        success: false,
        input,
        output: outputPath,
        size: 0,
        compressionRatio: 0,
        time: Date.now() - startTime,
        error: 'Decompile command not yet implemented in xai-faf-rust. Coming soon!'
      };
    }

    return {
      success: false,
      input,
      output: outputPath,
      size: 0,
      compressionRatio: 0,
      time: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Benchmark .faf vs .fafb parsing speed
 */
export async function benchmarkParsing(fafPath?: string, fafbPath?: string): Promise<BenchmarkResult> {
  const faf = fafPath || 'project.faf';
  const fafb = fafbPath || 'project.fafb';

  try {
    const compilerPath = await getCompilerPath();

    const output = execSync(`"${compilerPath}" bench --faf "${faf}" --fafb "${fafb}"`, {
      encoding: 'utf-8'
    });

    // Parse output (xai-faf bench returns JSON)
    const result = JSON.parse(output);

    return {
      fafParseTime: result.faf_parse_time_ms,
      fafbParseTime: result.fafb_parse_time_ms,
      speedup: result.speedup,
      fafSize: result.faf_size,
      fafbSize: result.fafb_size,
      compressionRatio: result.compression_ratio
    };
  } catch (error: any) {
    throw new Error(`Benchmark failed: ${error.message}`);
  }
}

/**
 * Watch .faf file and auto-recompile on changes
 */
export async function watchAndCompile(input: string, output?: string): Promise<void> {
  const outputPath = output || input.replace(/\.faf$/, '.fafb');

  console.log(chalk.cyan(`👁️  Watching: ${input}`));
  console.log(chalk.gray(`   Will compile to: ${outputPath}`));
  console.log(chalk.gray(`   Press Ctrl+C to stop\n`));

  // Initial compile
  const initialResult = await compileFAF({ input, output: outputPath, verbose: true });
  if (initialResult.success) {
    console.log(chalk.green(`✅ Initial compilation successful (${initialResult.time}ms)\n`));
  }

  // Watch for changes
  const watcher = await fs.watch(input);

  for await (const event of watcher) {
    if (event.eventType === 'change') {
      console.log(chalk.yellow(`🔄 Change detected, recompiling...`));
      const result = await compileFAF({ input, output: outputPath });

      if (result.success) {
        console.log(chalk.green(`✅ Recompiled successfully (${result.time}ms, ${result.compressionRatio.toFixed(1)}% smaller)\n`));
      } else {
        console.log(chalk.red(`❌ Compilation failed: ${result.error}\n`));
      }
    }
  }
}

/**
 * Auto-compile after .faf generation
 * Used by init, auto, go, sync commands
 */
export async function autoCompile(fafPath: string, quiet: boolean = false): Promise<boolean> {
  const fafbPath = fafPath.replace(/\.faf$/, '.fafb');

  if (!quiet) {
    console.log(chalk.gray(`   Compiling to binary format...`));
  }

  const result = await compileFAF({
    input: fafPath,
    output: fafbPath,
    verbose: false
  });

  if (result.success) {
    if (!quiet) {
      console.log(chalk.green(`   ☑️ Created ${fafbPath} (${result.size} bytes, ${result.compressionRatio.toFixed(1)}% smaller)`));
    }
    return true;
  } else {
    if (!quiet) {
      console.log(chalk.yellow(`   ⚠️ Binary compilation skipped (compiler not found)`));
    }
    return false;
  }
}

/**
 * Detect if file is .faf or .fafb
 */
export async function detectFormat(filePath: string): Promise<'faf' | 'fafb' | 'unknown'> {
  try {
    const buffer = await fs.readFile(filePath);

    // Check for FAFb magic bytes: "FAFB"
    if (buffer.length >= 4 &&
        buffer[0] === 0x46 && // F
        buffer[1] === 0x41 && // A
        buffer[2] === 0x46 && // F
        buffer[3] === 0x42) { // B
      return 'fafb';
    }

    // Check if it's YAML (starts with valid YAML)
    const text = buffer.toString('utf-8', 0, Math.min(100, buffer.length));
    if (text.includes('faf_version:') || text.includes('project:')) {
      return 'faf';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}
