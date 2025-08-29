/**
 * 🔄 faf sync - Sync Command
 * Sync .faf file with project changes (package.json, git, etc.)
 */
interface SyncOptions {
    auto?: boolean;
    dryRun?: boolean;
}
export declare function syncFafFile(file?: string, options?: SyncOptions): Promise<void>;
export {};
//# sourceMappingURL=sync.d.ts.map