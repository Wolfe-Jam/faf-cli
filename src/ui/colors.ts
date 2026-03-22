// ANSI color helpers — zero deps
// Design: black/white text by default. Cyan + orange are the only brand colors.
const esc = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;

export const bold = esc('1');
export const dim = esc('2');
export const italic = esc('3');

// Brand colors only — no red/green/yellow rainbow
export const fafCyan = (s: string) => `\x1b[38;2;0;212;212m${s}\x1b[0m`; // #00D4D4
export const orange = (s: string) => `\x1b[38;5;208m${s}\x1b[0m`;
