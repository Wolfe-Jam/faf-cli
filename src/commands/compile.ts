import { writeFileSync } from 'fs';
import { findFafFile, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

export interface CompileOptions {
  output?: string;
}

export function compileCommand(file?: string, options: CompileOptions = {}): void {
  const fafPath = file ?? findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const yaml = readFafRaw(fafPath);
  const binary = kernel.compile(yaml);

  const outputPath = options.output ?? fafPath.replace(/\.faf$/, '.fafb');
  writeFileSync(outputPath, binary);

  console.log(`${fafCyan('compiled')} ${outputPath} ${dim(`(${binary.length} bytes)`)}`);
}
