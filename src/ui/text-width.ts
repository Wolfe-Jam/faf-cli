/**
 * Text as a terminal shows it: by grapheme (what a person sees as one
 * character) and by column (CJK and emoji take two, combining marks none).
 * UTF-16 `.length` is neither: it split an emoji on Backspace (writing half
 * of it to project.faf) and under-counted CJK on redraw.
 */

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** `s` without its last grapheme: one Backspace. */
export function dropLastGrapheme(s: string): string {
  let last = -1;
  for (const { index } of segmenter.segment(s)) {last = index;}
  return last < 0 ? s : s.slice(0, last);
}

/** True for a code point that takes two columns (East Asian Wide/Fullwidth). */
function isWide(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  );
}

// Emoji shown as emoji take two columns: emoji-presentation characters (and
// flags), or any character with the emoji variation selector U+FE0F. Symbols
// such as ©, ™, ‼ and ↔ are text by default and take one.
const EMOJI = /\p{Emoji_Presentation}|\uFE0F/u;
// Combining marks (accents, variation selectors) and format characters
// (zero-width space, joiners, direction marks) take no column.
const ZERO_WIDTH = /^[\p{M}\p{Cf}]+$/u;

/** Columns one grapheme takes: 2 for emoji and wide characters, 0 for a
 *  lone zero-width mark, else 1. */
function graphemeWidth(g: string): number {
  if (EMOJI.test(g)) {return 2;}
  const cp = g.codePointAt(0) ?? 0;
  if (cp < 0x20 || ZERO_WIDTH.test(g)) {return 0;}
  return isWide(cp) ? 2 : 1;
}

/** Terminal columns `s` takes. Colour codes take none. */
export function displayWidth(s: string): number {
  // eslint-disable-next-line no-control-regex
  const plain = s.replace(/\u001b\[[0-9;]*m/g, '');
  let w = 0;
  for (const { segment } of segmenter.segment(plain)) {w += graphemeWidth(segment);}
  return w;
}

/** `s` with any half of a character (a lone UTF-16 surrogate) removed, so a
 *  value written to project.faf is always valid text. */
export function wellFormed(s: string): string {
  return s.replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '');
}
