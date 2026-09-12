import { dim, fafCyan } from '../ui/colors.js';
import { removeStaleTempDirs } from '../core/safe-write.js';

/** Clear faf-git-* temp directories — faf's own: real folders (never a link)
 *  that belong to this user. */
export function clearCommand(): void {
  let removed = 0;

  try {
    removed = removeStaleTempDirs('faf-git-');
  } catch {
    // tmpdir read failed — nothing to clean
  }

  if (removed > 0) {
    console.log(`${fafCyan('cleared')} ${removed} cached director${removed === 1 ? 'y' : 'ies'}`);
  } else {
    console.log(dim('nothing to clear'));
  }
}
