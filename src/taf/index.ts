/**
 * TAF Core Library - MCP-Portable Functions
 *
 * This module contains ALL pure, MCP-portable functions for .taf
 * Can be extracted directly to claude-faf-mcp or claude-taf-mcp
 *
 * Zero CLI dependencies - only uses:
 * - yaml (for parsing)
 * - TypeScript types
 * - Pure functions
 */

// Types
export * from './types';

// Parser functions
export {
  parseTAF,
  serializeTAF,
  createTAF,
  formatTAF,
} from './parser';

// Validation functions
export {
  validateTAF,
  isTAFValid,
} from './validator';

// Statistics functions
export {
  calculateStats,
  calculateScoreContribution,
  getPassRateTrend,
  getFailurePatterns,
} from './stats';

// Logger functions
export {
  appendTestRun,
  createMinimalRun,
  createDetailedRun,
  detectResult,
  calculateRecovery,
  getRecentRuns,
  getRunsInRange,
  updateFAFIntegration,
} from './logger';

// Test output parser (stdin auto-parse)
export {
  stripAnsi,
  parseJestOutput,
  parseVitestOutput,
  parseTestOutput,
  ParsedTestOutput,
} from './test-output-parser';
