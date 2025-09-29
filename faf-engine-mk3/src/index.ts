/**
 * FAF Engine MK3 - Protected Scoring Core
 *
 * This is the public API that gets compiled and protected
 * All implementation details are hidden in the binary
 */

import { FAFEngineMK3 } from './protected/engine';

// Export only the public API
export const engine = new FAFEngineMK3();

// Export types for TypeScript consumers
export type {
  ScoreResult,
  AnalysisResult,
  CompileResult,
  EngineOptions
} from './types/public';

// Version info (visible)
export const VERSION = '1.0.0';
export const ENGINE_NAME = 'FAF-ENGINE-MK3';

// Default export for convenience
export default engine;