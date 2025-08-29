/**
 * 🔍 faf audit - Audit Command
 * Check .faf file freshness and completeness gaps
 */
interface AuditOptions {
    warnDays?: string;
    errorDays?: string;
}
export declare function auditFafFile(file?: string, options?: AuditOptions): Promise<void>;
export {};
//# sourceMappingURL=audit.d.ts.map