import { findFafFile, readFaf } from '../interop/faf.js';
import { SLOTS, isPlaceholder } from '../core/slots.js';
import { dim, fafCyan } from '../ui/colors.js';

/** Generate compact context dump for AI prompts */
export function contextCommand(): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const data = readFaf(fafPath);
  const lines: string[] = [];

  for (const slot of SLOTS) {
    const [section, field] = slot.path.split('.');
    const sectionData = data[section] as Record<string, unknown> | undefined;
    const value = sectionData?.[field];

    if (isPlaceholder(value) || value === 'slotignored') continue;
    lines.push(`${slot.path}: ${value}`);
  }

  if (lines.length === 0) {
    console.log(dim('no populated slots'));
    return;
  }

  console.log(lines.join('\n'));
}
