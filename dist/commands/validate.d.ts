/**
 * 🔍 faf validate - Validation Command
 * Validates .faf files against schema with detailed feedback
 */
interface ValidateOptions {
    schema?: string;
    verbose?: boolean;
}
export declare function validateFafFile(file?: string, options?: ValidateOptions): Promise<void>;
export {};
//# sourceMappingURL=validate.d.ts.map