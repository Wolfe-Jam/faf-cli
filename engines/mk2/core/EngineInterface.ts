/**
 * 🏎️⚡️II Engine Interface
 * FAF-CLI v2.0.0 with 🏎️⚡️II
 */

export interface EngineResult {
  score: number;
  engine: string;
  brand: string;
  metadata?: any;
  intelligence?: any;
}

export interface ScoringEngine {
  readonly name: string;
  readonly version: string;
  readonly brand: string;
  
  calculate(data: any): Promise<EngineResult>;
  getSpecs(): EngineSpecs;
}

export interface EngineSpecs {
  slots?: number;
  fields?: number;
  mode: 'RELIABLE' | 'CURATED' | 'CHAOTIC' | 'EVOLVING' | 'RELIABLE + TURBOCHARGED';
  performance: string;
  reliability: string;
  catalyst?: string; // 😽 TURBO-CAT optional catalyst
}

export const ENGINE_BRAND = '🏎️⚡️II';
export const CLI_VERSION = 'FAF-CLI v2.0.0 with 🏎️⚡️II';
export const TURBO_CAT = '😽 TURBO-CAT™';
export const FULL_VERSION = 'FAF-CLI v2.0.0 with 🏎️⚡️II + 😽 TURBO-CAT™';