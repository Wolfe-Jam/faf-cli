/**
 * 🔧 faf lint - Lint Command
 * Format compliance and style checking for .faf files
 */
interface LintOptions {
    fix?: boolean;
    schemaVersion?: string;
}
export declare function lintFafFile(file?: string, options?: LintOptions): Promise<void>;
export {};
//# sourceMappingURL=lint.d.ts.map