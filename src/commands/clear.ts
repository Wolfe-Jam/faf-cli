import { readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { dim, fafCyan } from '../ui/colors.js';

/** Clear faf-git-* temp directories */
export function clearCommand(): void {
  const tmp = tmpdir();
  let removed = 0;

  try {
    const entries = readdirSync(tmp);
    for (const entry of entries) {
      if (entry.startsWith('faf-git-')) {
        rmSync(join(tmp, entry), { recursive: true, force: true });
        removed++;
      }
    }
  } catch {
    // tmpdir read failed — nothing to clean
  }

  if (removed > 0) {
    console.log(`${fafCyan('cleared')} ${removed} cached director${removed === 1 ? 'y' : 'ies'}`);
  } else {
    console.log(dim('nothing to clear'));
  }
}
