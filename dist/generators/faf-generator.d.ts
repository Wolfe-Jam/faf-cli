/**
 * 🏗️ .faf Generator
 * Auto-generate .faf files from project structure and package.json
 */
export interface GenerateOptions {
    projectType?: string;
    outputPath: string;
    projectRoot: string;
}
export declare function generateFafFromProject(options: GenerateOptions): Promise<string>;
//# sourceMappingURL=faf-generator.d.ts.map