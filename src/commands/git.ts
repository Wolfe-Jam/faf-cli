import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { detectStack } from '../detect/stack.js';
import { writeFaf, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { dim, fafCyan } from '../ui/colors.js';

export function gitCommand(url: string): void {
  if (!url) {
    console.error('Error: Please provide a GitHub URL.\n\n  Usage: faf git <url>');
    process.exit(1);
  }

  const repoUrl = url.endsWith('.git') ? url : `${url}.git`;
  const tmpDir = join(tmpdir(), `faf-git-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    console.log(dim(`cloning ${url}...`));
    execSync(`git clone --depth 1 ${repoUrl} ${tmpDir}`, { stdio: 'pipe' });

    const data = detectStack(tmpDir);
    const outputPath = join(process.cwd(), 'project.faf');
    writeFaf(outputPath, data);

    console.log(`${fafCyan('created')} ${outputPath}`);

    const yaml = readFafRaw(outputPath);
    const result = enrichScore(kernel.score(yaml));
    displayScore(result, outputPath);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
