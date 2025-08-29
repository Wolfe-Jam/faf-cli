/**
 * 🚀 faf init - Initialization Command
 * Generate .faf file from project structure with auto-detection
 */
interface InitOptions {
    force?: boolean;
    template?: string;
    output?: string;
}
export declare function initFafFile(projectPath?: string, options?: InitOptions): Promise<void>;
export {};
//# sourceMappingURL=init.d.ts.map