import { gzipSync } from 'zlib';
import { findFafFile, readFafRaw } from '../interop/faf.js';
import { fafCyan, dim } from '../ui/colors.js';

export interface ShareOptions {
  copy?: boolean;
  raw?: boolean;
}

/** Share .faf via URL */
export function shareCommand(options: ShareOptions = {}): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const yaml = readFafRaw(fafPath);
  const compressed = gzipSync(Buffer.from(yaml));
  const encoded = compressed.toString('base64url');

  if (options.raw) {
    console.log(encoded);
    return;
  }

  const url = `https://faf.one/share?d=${encoded}`;
  console.log(`${fafCyan('◆')} share  ${dim(fafPath)}\n`);
  console.log(`  ${url}`);

  if (options.copy) {
    try {
      const { execSync } = require('child_process');
      const platform = process.platform;
      if (platform === 'darwin') {
        execSync('pbcopy', { input: url });
      } else if (platform === 'linux') {
        execSync('xclip -selection clipboard', { input: url });
      }
      console.log(dim('\n  copied to clipboard'));
    } catch {
      console.log(dim('\n  copy failed — install xclip or pbcopy'));
    }
  }
}
