/**
 * 🏗️ C-Mirror Core Interfaces
 * TypeScript strict mode - All interfaces for the mirror system
 * Extraction-ready: Generic, reusable, well-defined
 */

import { SyncDirection, IntegrityStatus, ScoreData } from './events/mirror-events';

/**
 * Mirror Configuration
 */
export interface IMirrorConfig {
  // Required
  structuredFile: string;        // Path to YAML file (.faf)
  readableFile: string;          // Path to Markdown file (CLAUDE.md)
  projectPath?: string;          // Project root (defaults to cwd)

  // Optional
  schema?: IYAMLSchema;          // Custom YAML schema
  validators?: IValidator[];     // Custom validators
  dnaChain?: IDNAChainConfig;    // DNA logging configuration
  conflictStrategy?: ConflictStrategy;
  atomicWrites?: boolean;        // Use atomic file operations (recommended)
  selfHealing?: boolean;         // Auto-recovery from errors
  silent?: boolean;              // Suppress broadcasts (not recommended)
}

/**
 * Mirror Result
 */
export interface IMirrorResult {
  success: boolean;
  direction: SyncDirection;
  filesChanged: string[];
  conflicts: string[];
  duration: number;
  integrity: IntegrityStatus;
  score?: ScoreData;
  error?: string;
}

/**
 * YAML Schema Interface
 */
export interface IYAMLSchema {
  requiredFields: string[];
  optionalFields: string[];
  validate(data: any): SchemaValidationResult;
}

/**
 * Schema Validation Result
 */
export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validator Interface
 */
export interface IValidator {
  name: string;
  description?: string;
  validate(data: any): ValidationResult;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

/**
 * DNA Chain Configuration
 */
export interface IDNAChainConfig {
  enabled: boolean;
  path?: string;              // Path to DNA file (defaults to .faf-dna.json)
  logLevel?: 'minimal' | 'standard' | 'verbose';
  maxEntries?: number;        // Max DNA entries before rotation
}

/**
 * DNA Chain Entry
 */
export interface IDNAChainEntry {
  timestamp: Date;
  event: string;
  score?: ScoreData;
  integrity: IntegrityStatus;
  filesChanged: string[];
  duration: number;
  metadata?: Record<string, any>;
}

/**
 * Conflict Resolution Strategy
 */
export type ConflictStrategy = 'faf-wins' | 'claude-wins' | 'merge' | 'prompt' | 'abort';

/**
 * File State (for conflict detection)
 */
export interface FileState {
  path: string;
  exists: boolean;
  modified?: Date;
  size?: number;
  hash?: string;
}

/**
 * Conflict
 */
export interface Conflict {
  type: 'both-modified' | 'missing-file' | 'schema-mismatch' | 'validation-failed';
  file1: FileState;
  file2: FileState;
  message: string;
}

/**
 * Merge Result
 */
export interface MergeResult {
  success: boolean;
  merged: any;
  conflicts: string[];
  warnings: string[];
}

/**
 * Integrity Status
 */
export interface IntegrityCheckResult {
  status: IntegrityStatus;
  checks: {
    yamlValid: boolean;
    markdownValid: boolean;
    roundTripValid: boolean;
    scoreAccurate: boolean;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Restore Options
 */
export interface RestoreOptions {
  fromDNA?: boolean;
  timestamp?: Date;
  entryIndex?: number;
  dryRun?: boolean;
}

/**
 * Restore Result
 */
export interface RestoreResult {
  success: boolean;
  filesRestored: string[];
  scoreRestored?: ScoreData;
  error?: string;
}
