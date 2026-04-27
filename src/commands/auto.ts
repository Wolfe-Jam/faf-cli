import { existsSync } from 'fs';
import { join } from 'path';
import { detectStack } from '../detect/stack.js';
import { writeFaf, readFaf, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { notify } from '../ui/notify.js';
import { bold, dim, fafCyan } from '../ui/colors.js';
import { APP_TYPE_CATEGORIES, SLOTS } from '../core/slots.js';
import { TIERS } from '../core/tiers.js';

export function autoCommand(): void {
  const start = Date.now();
  const dir = process.cwd();
  const fafPath = join(dir, 'project.faf');

  const detected = detectStack(dir);

  // Capture previous tier (for upgrade-detection notification)
  let prevTier: string | null = null;
  if (existsSync(fafPath)) {
    try {
      const prev = enrichScore(kernel.score(readFafRaw(fafPath)));
      prevTier = prev.tier.name;
    } catch { /* fresh score below will succeed or fail uniformly */ }
  }

  if (existsSync(fafPath)) {
    const existing = readFaf(fafPath);
    const merged = mergeDetected(existing, detected);
    writeFaf(fafPath, merged);
    console.log(`${fafCyan('updated')} ${fafPath}`);
  } else {
    const projectType = detected.project?.type ?? 'library';
    const activeCategories = APP_TYPE_CATEGORIES[projectType] || APP_TYPE_CATEGORIES.library;

    for (const slot of SLOTS) {
      if (!activeCategories.includes(slot.category)) {
        const [section, field] = slot.path.split('.');
        if (section === 'stack' && detected.stack) {
          (detected.stack as Record<string, string>)[field] = 'slotignored';
        }
        if (section === 'monorepo' && detected.monorepo) {
          (detected.monorepo as Record<string, string>)[field] = 'slotignored';
        }
      }
    }

    writeFaf(fafPath, detected);
    console.log(`${fafCyan('created')} ${fafPath}`);
  }

  const yaml = readFafRaw(fafPath);
  const result = enrichScore(kernel.score(yaml));
  displayScore(result, fafPath);

  if (result.score < 100) {
    console.log(dim(`\n  run ${bold("'faf go'")} to reach 100%`));
  }

  // Desktop notification: trophy / tier-upgrade / long-scan-complete (in priority order)
  const elapsed = Date.now() - start;
  if (result.score === 100) {
    notify('FAF: Trophy unlocked at 100%');
  } else if (prevTier && tierImproved(prevTier, result.tier.name)) {
    notify(`FAF: tier upgraded ${prevTier} -> ${result.tier.name} (${result.score}%)`);
  } else if (elapsed >= 5000) {
    notify(`FAF: ${result.score}% ${result.tier.name} - stack detected`);
  }
}

function tierImproved(prev: string, next: string): boolean {
  const order = TIERS.map(t => t.name);
  return order.indexOf(next) < order.indexOf(prev);
}

function mergeDetected(existing: Record<string, unknown>, detected: Record<string, unknown>): Record<string, unknown> {
  const result = { ...existing };
  for (const [key, value] of Object.entries(detected)) {
    if (!(key in result) || result[key] === null || result[key] === undefined) {
      result[key] = value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = mergeDetected(
        (result[key] as Record<string, unknown>) ?? {},
        value as Record<string, unknown>,
      );
    }
  }
  return result;
}
