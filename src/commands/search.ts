import { SLOTS } from '../core/slots.js';
import { FORMATS } from '../detect/formats.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

export interface SearchOptions {
  slots?: boolean;
  formats?: boolean;
}

/** Search slots and formats by keyword */
export function searchCommand(query: string, options: SearchOptions = {}): void {
  if (!query) {
    console.error('Usage: faf search <keyword>');
    process.exit(2);
  }

  const q = query.toLowerCase();
  const searchAll = !options.slots && !options.formats;

  let found = 0;

  // Search slots
  if (searchAll || options.slots) {
    const matches = SLOTS.filter(s =>
      s.path.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
    if (matches.length > 0) {
      console.log(`${fafCyan('slots')} ${dim(`— ${matches.length} match${matches.length === 1 ? '' : 'es'}`)}\n`);
      for (const s of matches) {
        console.log(`  ${bold(`#${s.index}`)} ${s.path} ${dim('—')} ${s.description} ${dim(`[${s.category}]`)}`);
      }
      console.log('');
      found += matches.length;
    }
  }

  // Search formats
  if (searchAll || options.formats) {
    const matches = FORMATS.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.extensions.some(e => e.toLowerCase().includes(q)) ||
      f.category.toLowerCase().includes(q)
    );
    if (matches.length > 0) {
      console.log(`${fafCyan('formats')} ${dim(`— ${matches.length} match${matches.length === 1 ? '' : 'es'}`)}\n`);
      for (const f of matches) {
        console.log(`  ${bold(f.name)} ${dim(f.extensions.join(', '))} ${dim(`[${f.category}]`)}`);
      }
      console.log('');
      found += matches.length;
    }
  }

  if (found === 0) {
    console.log(dim(`  No results for "${query}"`));
  }
}
