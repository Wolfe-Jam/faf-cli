import { readFileSync, writeFileSync, existsSync } from 'fs';

/**
 * Block markers for the faf-managed front section.
 *
 * Markdown files (AGENTS.md, CLAUDE.md, GEMINI.md) use HTML comments; non-markdown
 * files (.cursorrules) pass hash-comment markers via the `start`/`end` args.
 */
export const FAF_START = '<!-- faf:start -->';
export const FAF_END = '<!-- faf:end -->';

/**
 * Non-destructively write a faf-managed block into a file.
 *
 *   - file does not exist     → create it containing just the block
 *   - file has the markers    → replace ONLY the content between them (update in place)
 *   - file exists, no markers → PREFIX the block; everything the user wrote is preserved
 *
 * Idempotent: re-running updates the managed block in place and never duplicates
 * it or touches a byte the user owns. faf owns what's between the markers; the
 * user owns everything else. Enhance, never replace.
 */
export function injectFafBlock(
  path: string,
  block: string,
  start: string = FAF_START,
  end: string = FAF_END,
): void {
  const wrapped = `${start}\n${block.trim()}\n${end}`;

  // 1. No file → create it with just the block.
  if (!existsSync(path)) {
    writeFileSync(path, `${wrapped}\n`, 'utf-8');
    return;
  }

  const existing = readFileSync(path, 'utf-8');
  const s = existing.indexOf(start);
  const e = existing.indexOf(end);

  // 2. Markers present → replace only the managed block; keep everything around it.
  if (s !== -1 && e !== -1 && e > s) {
    const before = existing.slice(0, s);
    const after = existing.slice(e + end.length);
    writeFileSync(path, `${before}${wrapped}${after}`, 'utf-8');
    return;
  }

  // 3. Existing file, no markers → prefix the block; preserve all existing content.
  writeFileSync(path, `${wrapped}\n\n${existing}`, 'utf-8');
}
