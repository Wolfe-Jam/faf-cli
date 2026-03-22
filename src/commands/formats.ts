import { FORMATS } from '../detect/formats.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

/** Show supported formats grouped by category */
export function formatsCommand(): void {
  console.log(`${fafCyan('formats')} ${dim('— supported file types')}\n`);

  const categories = new Map<string, typeof FORMATS>();
  for (const f of FORMATS) {
    const list = categories.get(f.category) ?? [];
    list.push(f);
    categories.set(f.category, list);
  }

  for (const [category, entries] of categories) {
    console.log(`  ${bold(category)}`);
    for (const entry of entries) {
      console.log(`    ${entry.name} ${dim(entry.extensions.join(', '))}`);
    }
    console.log();
  }

  console.log(dim(`  ${FORMATS.length} formats across ${categories.size} categories`));
}
