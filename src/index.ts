/**
 * 🚀 .faf CLI - Main Export
 * Universal AI Context Format Tooling
 */

// Export main CLI function
export { program } from './cli';

// Export core functionality for programmatic use
export { validateFafFile } from './commands/validate';
export { initFafFile } from './commands/init';
export { scoreFafFile } from './commands/score';
export { syncFafFile } from './commands/sync';
export { auditFafFile } from './commands/audit';
export { lintFafFile } from './commands/lint';

// Export utilities
export { findFafFile, detectProjectType } from './utils/file-utils';
export { validateSchema } from './schema/faf-schema';
export { calculateFafScore } from './scoring/score-calculator';
export { generateFafFromProject } from './generators/faf-generator';

// Export types
export type { FafSchema, ValidationResult } from './schema/faf-schema';
export type { ScoreResult, SectionScore } from './scoring/score-calculator';