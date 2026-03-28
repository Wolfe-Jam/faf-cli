import type { KernelScoreResult, FafbInfo } from '../core/types.js';

// faf-scoring-kernel is CommonJS with synchronous WASM loading
 
let kernel: typeof import('faf-scoring-kernel') | null = null;

function getKernel(): typeof import('faf-scoring-kernel') {
  if (!kernel) {
    try {
      kernel = require('faf-scoring-kernel');
    } catch {
      throw new Error(
        'faf-scoring-kernel not installed.\n\n  Run: npm install faf-scoring-kernel\n'
      );
    }
  }
  return kernel;
}

/** Score a .faf YAML string (21 base slots) */
export function score(yaml: string): KernelScoreResult {
  return JSON.parse(getKernel().score_faf(yaml));
}

/** Score a .faf YAML string (33 enterprise slots) */
export function scoreEnterprise(yaml: string): KernelScoreResult {
  return JSON.parse(getKernel().score_faf_enterprise(yaml));
}

/** Validate .faf YAML */
export function validate(yaml: string): boolean {
  return getKernel().validate_faf(yaml);
}

/** Compile .faf YAML to FAFb binary */
export function compile(yaml: string): Uint8Array {
  return getKernel().compile_fafb(yaml);
}

/** Decompile FAFb binary to JSON info */
export function decompile(bytes: Uint8Array): FafbInfo {
  return JSON.parse(getKernel().decompile_fafb(bytes));
}

/** Get FAFb file metadata */
export function fafbInfo(bytes: Uint8Array): FafbInfo {
  return JSON.parse(getKernel().fafb_info(bytes));
}

/** Get FAFb binary metadata (name, version, source) */
export interface FafbMeta {
  source: string;
  name: string;
  faf_version: string;
}

export function scoreFafb(bytes: Uint8Array): FafbMeta {
  return JSON.parse(getKernel().score_fafb(bytes));
}

/** Get WASM SDK version */
export function sdkVersion(): string {
  return getKernel().sdk_version();
}
