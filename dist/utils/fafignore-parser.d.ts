/**
 * 🚫 .fafignore Parser
 * Handles exclusion patterns for .faf file generation
 */
/**
 * Parse .fafignore file and return patterns
 */
export declare function parseFafIgnore(projectRoot: string): Promise<string[]>;
/**
 * Check if a file path should be ignored
 */
export declare function shouldIgnore(filePath: string, patterns: string[]): boolean;
/**
 * Create a default .fafignore file with helpful comments
 */
export declare function createDefaultFafIgnore(projectRoot: string): Promise<void>;
/**
 * Get file size limit for inclusion (default 1MB)
 */
export declare function getFileSizeLimit(): number;
//# sourceMappingURL=fafignore-parser.d.ts.map