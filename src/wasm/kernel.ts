import type { KernelScoreResult, FafbInfo, SlotState } from '../core/types.js';
import { CANONICAL_TO_CURRENT } from '../core/slots.js';

// faf-scoring-kernel is CommonJS with synchronous WASM loading
 
let kernel: typeof import('faf-scoring-kernel') | null = null;

function getKernel(): typeof import('faf-scoring-kernel') {
  if (kernel) {return kernel;}
  try {
    const loaded = require('faf-scoring-kernel') as typeof import('faf-scoring-kernel');
    kernel = loaded;
    return loaded;
  } catch {
    throw new Error(
      'faf-scoring-kernel not installed.\n\n  Run: npm install faf-scoring-kernel\n'
    );
  }
}

/** The text the kernel scores: a leading UTF-8 BOM (U+FEFF) left out. The
 *  kernel reads a BOM before a file's second top-level key as a second YAML
 *  document and throws; the file itself keeps its BOM. */
const withoutBom = (yaml: string): string => (yaml.startsWith('\uFEFF') ? yaml.slice(1) : yaml);

/** Score a .faf YAML string (always 33 slots — a 21-slot file carries the 12
 *  enterprise slots as `slotignored`), as the file is. A typed None /
 *  N/A / not applicable at a slot is an empty slot, as in every engine. A
 *  leading BOM is not scored (`faf auto` and `faf score` read a BOM file). */
/** Kernel Mk4 names (`stack.css`) → CLI on-wire paths (`stack.css_framework`). */
function remapScore(result: KernelScoreResult): KernelScoreResult {
  const slots: Record<string, SlotState> = {};
  for (const [key, state] of Object.entries(result.slots ?? {})) {
    slots[CANONICAL_TO_CURRENT.get(key) ?? key] = state;
  }
  return { ...result, slots };
}

export function score(yaml: string): KernelScoreResult {
  return remapScore(JSON.parse(getKernel().score_faf(withoutBom(yaml))));
}

/** Same as {@link score} (always 33) — kept for existing callers (a leading BOM is not scored). */
export function scoreEnterprise(yaml: string): KernelScoreResult {
  return remapScore(JSON.parse(getKernel().score_faf_enterprise(withoutBom(yaml))));
}

/** Validate .faf YAML (a leading BOM is left out, as in {@link score}: `faf check` reads a BOM file). */
export function validate(yaml: string): boolean {
  return getKernel().validate_faf(withoutBom(yaml));
}

/** Compile .faf YAML to FAFb binary (a leading BOM is not compiled, as in
 *  {@link score}: `faf compile` and `faf refresh` read a BOM file). */
export function compile(yaml: string): Uint8Array {
  return getKernel().compile_fafb(withoutBom(yaml));
}

/** Decompile FAFb binary to JSON info */
export function decompile(bytes: Uint8Array): FafbInfo {
  return JSON.parse(getKernel().decompile_fafb(bytes));
}

/** Get FAFb file metadata */
export function fafbInfo(bytes: Uint8Array): FafbInfo {
  return JSON.parse(getKernel().fafb_info(bytes));
}

/** Score a compiled .fafb — same JSON shape as {@link score}. */
export function scoreFafb(bytes: Uint8Array): KernelScoreResult {
  return remapScore(JSON.parse(getKernel().score_fafb(bytes)));
}

/** Get WASM SDK version */
export function sdkVersion(): string {
  return getKernel().sdk_version();
}
