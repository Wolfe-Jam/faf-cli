/**
 * 📁 File Utilities
 * Helper functions for finding and working with .faf files
 */
/**
 * Find .faf file in current directory or parent directories
 */
export declare function findFafFile(startDir?: string): Promise<string | null>;
/**
 * Check if file exists and is readable
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * Get file modification time
 */
export declare function getFileModTime(filePath: string): Promise<Date | null>;
/**
 * Find package.json in project
 */
export declare function findPackageJson(startDir?: string): Promise<string | null>;
/**
 * Find pyproject.toml in project (Python Poetry/PEP 518)
 */
export declare function findPyprojectToml(startDir?: string): Promise<string | null>;
/**
 * Find requirements.txt in project (Python pip)
 */
export declare function findRequirementsTxt(startDir?: string): Promise<string | null>;
/**
 * Find tsconfig.json in project (TypeScript)
 */
export declare function findTsConfig(startDir?: string): Promise<string | null>;
/**
 * Analyze tsconfig.json for F1-Inspired TypeScript intelligence
 */
export declare function analyzeTsConfig(filePath: string): Promise<TypeScriptContext | null>;
export interface TypeScriptContext {
    target: string;
    module: string;
    moduleResolution: string;
    strict: boolean;
    strictnessLevel: 'basic' | 'strict' | 'ultra_strict' | 'f1_inspired';
    frameworkIntegration: string;
    performanceOptimizations: string[];
    includes: string[];
    excludes: string[];
    engineeringQuality: 'standard' | 'professional' | 'f1_inspired';
}
/**
 * Detect project type from files and structure
 */
export declare function detectProjectType(projectDir?: string): Promise<string>;
/**
 * Calculate days since file was modified
 */
export declare function daysSinceModified(date: Date): number;
/**
 * Detect Python project type using dependency files (Option A)
 */
export declare function detectPythonProjectType(projectDir: string): Promise<string>;
/**
 * Detect Python frameworks using code patterns (Option B)
 */
export declare function detectPythonPatterns(projectDir: string, pythonFiles: string[]): Promise<string>;
//# sourceMappingURL=file-utils.d.ts.map