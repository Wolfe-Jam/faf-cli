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
 * Detect project type from files and structure
 */
export declare function detectProjectType(projectDir?: string): Promise<string>;
/**
 * Calculate days since file was modified
 */
export declare function daysSinceModified(date: Date): number;
//# sourceMappingURL=file-utils.d.ts.map