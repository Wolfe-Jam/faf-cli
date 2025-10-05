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
export { generateFafFromProject } from './generators/faf-generator-championship';

// Export compiler (Mk3)
export { FafCompiler } from './compiler/faf-compiler';
export type { CompilationResult } from './compiler/faf-compiler';

// Export types
export type { FafSchema, ValidationResult } from './schema/faf-schema';