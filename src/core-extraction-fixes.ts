/**
 * 🏁 PREVENTIVE FIXES for @faf/core Extraction
 * These adapters prevent breakage BEFORE we extract
 */

// ===============================================
// PROBLEM 1: Score calculation uses file I/O
// WHY IT BREAKS: calculateFafScore() reads files directly
// FIX: Create pure function that takes data, not paths
// ===============================================

import * as fs from 'fs/promises';
import * as path from 'path';
import { chalk } from './fix-once/colors';
import * as YAML from 'yaml';

// OLD WAY (will break in core):
export async function calculateFafScoreOLD(fafPath: string) {
  const content = await fs.readFile(fafPath, 'utf-8'); // ❌ File I/O
  console.log(chalk.cyan('Calculating...')); // ❌ Console output
  const homeDir = process.env.HOME; // ❌ Environment dependency
  // ... calculation
}

// NEW WAY (extraction-ready):
export interface ScoreInput {
  fafData: any;
  projectStats?: {
    fileCount?: number;
    hasTests?: boolean;
    hasCI?: boolean;
  };
}

export function calculateScorePure(input: ScoreInput): number {
  // Pure calculation - no I/O, no console, no env
  let score = 0;

  // Handle null/undefined input
  if (!input || !input.fafData) {
    return 0;
  }

  if (input.fafData.version) score += 10;
  if (input.fafData.project?.name) score += 10;
  if (input.fafData.project?.description) score += 15;
  if (input.projectStats?.hasTests) score += 20;

  return Math.min(score, 100);
}

// CLI Adapter (stays in CLI package):
export async function calculateScoreCLI(fafPath: string) {
  // CLI handles all I/O
  const content = await fs.readFile(fafPath, 'utf-8');
  const fafData = parseFaf(content);

  // CLI handles console output
  console.log(chalk.cyan('Calculating score...'));

  // Call pure function
  const score = calculateScorePure({ fafData });

  // CLI handles display
  console.log(chalk.green(`Score: ${score}%`));
  return score;
}

// ===============================================
// PROBLEM 2: findFafFile() will break imports
// WHY: Deep imports like require('faf-cli/dist/utils/file-utils')
// FIX: Create public API surface
// ===============================================

// Before extraction - add to src/index.ts:
// export { findFafFile } from './utils/file-utils';
// export { calculateFafScore } from './scoring/score-calculator';
// export { FafData, ProjectInfo } from './schema/faf-schema';

// So users can migrate from:
// const { findFafFile } = require('faf-cli/dist/utils/file-utils');
// To:
// const { findFafFile } = require('faf-cli');

// ===============================================
// PROBLEM 3: Commands will lose shared context
// WHY: They share state through imports
// FIX: Create context manager
// ===============================================

export class FafContext {
  private static instance: FafContext;
  private fafPath?: string;
  private fafData?: any;
  private score?: number;

  static getInstance(): FafContext {
    if (!this.instance) {
      this.instance = new FafContext();
    }
    return this.instance;
  }

  // Shared state that commands need
  setCurrentFaf(path: string, data: any) {
    this.fafPath = path;
    this.fafData = data;
  }

  getCachedScore(): number | undefined {
    return this.score;
  }

  setCachedScore(score: number) {
    this.score = score;
  }
}

// ===============================================
// PROBLEM 4: YAML parsing has hidden dependencies
// WHY: Uses custom error messages with chalk
// FIX: Return error codes, format in CLI
// ===============================================

export interface ParseResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    line?: number;
    message: string;
  };
}

// Core version (no chalk):
export function parseFafCore(content: string): ParseResult {
  try {
    const data = YAML.parse(content);
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: {
        code: 'INVALID_YAML',
        line: extractLineNumber(error),
        message: errorMessage
      }
    };
  }
}

// CLI version (with chalk):
export function parseFafCLI(content: string): any {
  const result = parseFafCore(content);
  if (!result.success && result.error) {
    const errorMsg = result.error.line
      ? chalk.red(`❌ Invalid YAML at line ${result.error.line}`)
      : chalk.red(`❌ Invalid YAML: ${result.error.message}`);
    throw new Error(errorMsg);
  }
  return result.data;
}

// ===============================================
// PROBLEM 5: Type exports will break
// WHY: Types are scattered across files
// FIX: Create central type export
// ===============================================

// Create src/types/index.ts BEFORE extraction:
export interface FafData {
  version: string;
  project: ProjectInfo;
  instant_context?: InstantContext;
  key_files?: KeyFileInfo[];
  faf_score?: number;
}

export interface ProjectInfo {
  name: string;
  description?: string;
  // ... all fields
}

export interface InstantContext {
  what_building?: string;
  main_language?: string;
  // ... all fields
}

export interface KeyFileInfo {
  path: string;
  purpose?: string;
}

// Then in package.json:
/*
"exports": {
  ".": {
    "types": "./dist/types/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.js"
  },
  "./types": {
    "types": "./dist/types/index.d.ts"
  }
}
*/

// ===============================================
// PROBLEM 6: Tests will fail on missing globals
// WHY: Tests assume chalk is available globally
// FIX: Mock or inject formatters
// ===============================================

export interface Formatter {
  success(msg: string): string;
  error(msg: string): string;
  info(msg: string): string;
}

// Core version (no formatting):
export class PlainFormatter implements Formatter {
  success(msg: string) { return `✓ ${msg}`; }
  error(msg: string) { return `✗ ${msg}`; }
  info(msg: string) { return `ℹ ${msg}`; }
}

// CLI version (with chalk):
export class ChalkFormatter implements Formatter {
  success(msg: string) { return chalk.green(`✓ ${msg}`); }
  error(msg: string) { return chalk.red(`✗ ${msg}`); }
  info(msg: string) { return chalk.cyan(`ℹ ${msg}`); }
}

// Injectable formatting:
export function validateFaf(data: any, formatter: Formatter = new PlainFormatter()) {
  if (!data.version) {
    return formatter.error('Missing version field');
  }
  return formatter.success('Valid .faf file');
}

// ===============================================
// PROBLEM 7: Path resolution will break
// WHY: Core can't use process.cwd() or __dirname
// FIX: Pass paths explicitly
// ===============================================

// OLD (breaks in core):
function getDefaultFafPathOLD() {
  return path.join(process.cwd(), '.faf'); // ❌ process.cwd()
}

// NEW (extraction-ready):
export function getDefaultFafPath(projectDir: string) {
  return path.join(projectDir, '.faf'); // ✅ Explicit path
}

// ===============================================
// PROBLEM 8: Circular dependencies
// WHY: Utils import from commands, commands import from utils
// FIX: Dependency inversion
// ===============================================

// Create interfaces that both can use:
export interface ScoreProvider {
  calculateScore(data: any): number;
}

export interface FileProvider {
  readFaf(path: string): Promise<any>;
  findFaf(dir: string): Promise<string | null>;
}

// Commands depend on interfaces, not implementations
export class ScoreCommand {
  constructor(
    private scoreProvider: ScoreProvider,
    private fileProvider: FileProvider
  ) {}

  async execute(filePath?: string) {
    const fafPath = filePath || await this.fileProvider.findFaf('.');
    if (!fafPath) {
      throw new Error('No .faf file found');
    }
    const data = await this.fileProvider.readFaf(fafPath);
    return this.scoreProvider.calculateScore(data);
  }
}

// ===============================================
// PROBLEM 9: Global state in utilities
// WHY: Some utils use module-level variables
// FIX: Make everything functional or class-based
// ===============================================

// OLD (stateful):
let cachedScore: number | null = null;
export function getCachedScore() {
  return cachedScore; // ❌ Global state
}

// NEW (stateless):
export class ScoreCache {
  private cache = new Map<string, number>();

  get(path: string): number | undefined {
    return this.cache.get(path);
  }

  set(path: string, score: number): void {
    this.cache.set(path, score);
  }
}

// ===============================================
// PROBLEM 10: Import paths will change
// WHY: @faf/core vs faf-cli imports
// FIX: Create compatibility layer
// ===============================================

// In faf-cli after extraction, re-export everything:
// src/compat.ts
// export * from '@faf/core';
// export * from '@faf/core/types';

// Old code can still do:
// import { FafData } from 'faf-cli/compat';
// Instead of breaking with:
// import { FafData } from '@faf/core';

function extractLineNumber(error: any): number | undefined {
  // Extract line number from YAML error
  const match = error.message?.match(/line (\d+)/);
  return match ? parseInt(match[1]) : undefined;
}

function parseFaf(content: string): any {
  // Parse YAML content
  return YAML.parse(content);
}