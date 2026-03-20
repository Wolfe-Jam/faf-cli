/**
 * FAFb Compiler — WASM Kernel
 * Uses faf-scoring-kernel (Mk4 Rust→WASM) for .faf → .fafb compilation
 * No external binary required — WASM is an npm dependency
 */

import { promises as fs } from 'fs';
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
 * Check if WASM kernel is available — always true (npm dependency)
 */
export async function checkCompilerAvailable(): Promise<{ available: boolean; path?: string; error?: string }> {
  try {
    const kernel = require('faf-scoring-kernel');
    const version = kernel.sdk_version();
    return { available: true, path: `faf-scoring-kernel@${version} (WASM)` };
  } catch {
    return {
      available: false,
      error: 'faf-scoring-kernel not installed. Run: npm install faf-scoring-kernel'
    };
  }
}

/**
 * Compile .faf to .fafb using WASM kernel
 */
export async function compileFAF(options: CompileOptions = {}): Promise<CompileResult> {
  const startTime = Date.now();

  const input = options.input || 'project.faf';
  const output = options.output || input.replace(/\.faf$/, '.fafb');

  try {
    await fs.access(input);

    const inputStats = await fs.stat(input);
    const inputSize = inputStats.size;

    if (options.verbose) {
      console.log(chalk.gray(`   Compiling: ${input} → ${output}`));
    }

    const kernel = require('faf-scoring-kernel');
    const yaml = await fs.readFile(input, 'utf-8');

    // Validate YAML before compiling — kernel may not reject all invalid inputs
    if (!kernel.validate_faf(yaml)) {
      throw new Error(`Invalid YAML in ${input}: file does not contain valid FAF YAML content`);
    }

    const fafbBytes: Uint8Array = kernel.compile_fafb(yaml);

    await fs.writeFile(output, fafbBytes);

    const outputSize = fafbBytes.length;
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
 * Decompile .fafb to JSON using WASM kernel
 */
export async function decompileFAFb(input: string, output?: string): Promise<CompileResult> {
  const startTime = Date.now();
  const outputPath = output || input.replace(/\.fafb$/, '.json');

  try {
    await fs.access(input);

    const kernel = require('faf-scoring-kernel');
    const bytes = new Uint8Array(await fs.readFile(input));
    const jsonStr: string = kernel.decompile_fafb(bytes);

    // Pretty-print the JSON output
    const parsed = JSON.parse(jsonStr);
    const prettyJson = JSON.stringify(parsed, null, 2);

    await fs.writeFile(outputPath, prettyJson, 'utf-8');

    return {
      success: true,
      input,
      output: outputPath,
      size: Buffer.byteLength(prettyJson, 'utf-8'),
      compressionRatio: 0,
      time: Date.now() - startTime
    };
  } catch (error: any) {
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
 * Benchmark .faf vs .fafb parsing speed using WASM kernel
 */
export async function benchmarkParsing(fafPath?: string, fafbPath?: string): Promise<BenchmarkResult> {
  const faf = fafPath || 'project.faf';
  const fafb = fafbPath || 'project.fafb';

  const kernel = require('faf-scoring-kernel');

  const fafContent = await fs.readFile(faf, 'utf-8');
  const fafbContent = new Uint8Array(await fs.readFile(fafb));

  // Benchmark .faf scoring
  const fafStart = performance.now();
  for (let i = 0; i < 100; i++) { kernel.score_faf(fafContent); }
  const fafTime = (performance.now() - fafStart) / 100;

  // Benchmark .fafb scoring
  const fafbStart = performance.now();
  for (let i = 0; i < 100; i++) { kernel.score_fafb(fafbContent); }
  const fafbTime = (performance.now() - fafbStart) / 100;

  return {
    fafParseTime: fafTime,
    fafbParseTime: fafbTime,
    speedup: fafTime / fafbTime,
    fafSize: Buffer.byteLength(fafContent, 'utf-8'),
    fafbSize: fafbContent.length,
    compressionRatio: ((Buffer.byteLength(fafContent, 'utf-8') - fafbContent.length) / Buffer.byteLength(fafContent, 'utf-8')) * 100
  };
}

/**
 * Watch .faf file and auto-recompile on changes
 */
export async function watchAndCompile(input: string, output?: string): Promise<void> {
  const outputPath = output || input.replace(/\.faf$/, '.fafb');

  console.log(chalk.cyan(`Watching: ${input}`));
  console.log(chalk.gray(`   Will compile to: ${outputPath}`));
  console.log(chalk.gray(`   Press Ctrl+C to stop\n`));

  // Initial compile
  const initialResult = await compileFAF({ input, output: outputPath, verbose: true });
  if (initialResult.success) {
    console.log(chalk.green(`Initial compilation successful (${initialResult.time}ms)\n`));
  }

  // Watch for changes
  const watcher = await fs.watch(input);

  for await (const event of watcher) {
    if (event.eventType === 'change') {
      console.log(chalk.yellow(`Change detected, recompiling...`));
      const result = await compileFAF({ input, output: outputPath });

      if (result.success) {
        console.log(chalk.green(`Recompiled successfully (${result.time}ms, ${result.compressionRatio.toFixed(1)}% smaller)\n`));
      } else {
        console.log(chalk.red(`Compilation failed: ${result.error}\n`));
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
      console.log(chalk.green(`   Created ${fafbPath} (${result.size} bytes, ${result.compressionRatio.toFixed(1)}% smaller)`));
    }
    return true;
  } else {
    if (!quiet) {
      console.log(chalk.yellow(`   Binary compilation failed: ${result.error}`));
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
