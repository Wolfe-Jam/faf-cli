// ANSI color helpers — zero deps
// Design: black/white text by default. Cyan + orange are the only brand colors.
const esc = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;

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

export const fafCyan = (s: string) => `\x1b[38;2;0;212;212m${s}\x1b[0m`; // #00D4D4
export const fafCyanDeep = (s: string) => `\x1b[38;2;14;140;140m${s}\x1b[0m`; // #0E8C8C
export const orange = (s: string) => `\x1b[38;5;208m${s}\x1b[0m`;
