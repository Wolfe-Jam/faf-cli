// ANSI color helpers — zero deps
// Design: black/white text by default. Cyan + orange are the only brand colors.

/** Colour only where a person reads it: a terminal. FORCE_COLOR decides first
 *  (Node's rule: 0 or false turns it off, any other value, even empty, on);
 *  then NO_COLOR (any value, no-color.org) turns it off; otherwise only when
 *  the stream is a TTY, so piped output, CI logs and agent tools get plain
 *  text. Read on every call: tests set the env at runtime. */
export function colorOn(stream: { isTTY?: boolean } = process.stdout): boolean {
  const force = process.env.FORCE_COLOR;
  if (force !== undefined) {return force !== '0' && force !== 'false';}
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '') {return false;}
  return Boolean(stream.isTTY);
}

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/** Text is coloured for stdout. Error output goes to stderr, which can be a
 *  file while stdout is a terminal: there, drop the colour. */
export function plainOnStderr(text: string): string {
  return colorOn(process.stderr) ? text : text.replace(ANSI, '');
}

const paint = (open: string, s: string) => (colorOn() ? `\x1b[${open}m${s}\x1b[0m` : s);
const esc = (code: string) => (s: string) => paint(code, s);

export const bold = esc('1');
export const dim = esc('2');
export const italic = esc('3');

// Brand colors only — no red/green/yellow rainbow.
// FAF_HEX is the single source of record for brand hex — ANSI fns below
// AND HTML renders (project.html) derive from it. Change here, propagates.
export const FAF_HEX = {
  cyan: '#00D4D4', // Silver tier · interaction
  cyanDeep: '#0E8C8C', // Bronze tier — same cyan lane, one rung down
  orange: '#FF6B35', // Trophy/Gold · CTAs
} as const;

export const fafCyan = (s: string) => paint('38;2;0;212;212', s); // #00D4D4
export const fafCyanDeep = (s: string) => paint('38;2;14;140;140', s); // #0E8C8C
export const orange = (s: string) => paint('38;5;208', s);
