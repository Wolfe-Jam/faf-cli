/**
 * 📋 .faf Schema Definition and Validation
 * Complete schema for .faf format validation
 */
export interface FafSchema {
    faf_version: string;
    generated: string;
    project: {
        name: string;
        goal?: string;
        main_language: string;
        faf_score?: number;
        importance?: string;
    };
    ai_instructions?: {
        priority: string;
        usage: string;
        message: string;
    };
    stack: {
        frontend?: string;
        css_framework?: string;
        ui_library?: string;
        state_management?: string;
        backend?: string;
        runtime?: string;
        build?: string;
        package_manager?: string;
        api_type?: string;
    };
    scores: {
        slot_based_percentage: number;
        faf_score: number;
        total_slots: number;
        scoring_philosophy?: string;
    };
    ai?: {
        context_file?: string;
        handoff_ready?: boolean;
        session_continuity?: string;
        onboarding_time?: string;
    };
    preferences?: {
        quality_bar?: string;
        commit_style?: string;
        communication?: string;
        verbosity?: string;
    };
    state?: {
        phase?: string;
        version?: string;
        focus?: string;
        status?: string;
    };
    tags?: {
        auto_generated?: string[];
        smart_defaults?: string[];
        user_defined?: string[];
    };
    human_context?: {
        who?: string;
        what?: string;
        why?: string;
        where?: string;
        when?: string;
        how?: string;
        additional_context?: Record<string, string[]>;
        context_score?: number;
        total_prd_score?: number;
        success_rate?: string;
    };
    [key: string]: any;
}
export interface ValidationError {
    message: string;
    path?: string;
    severity: 'error' | 'warning';
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    schemaVersion: string;
    sectionsFound: number;
    requiredFieldsFound: number;
    requiredFieldsTotal: number;
}
/**
 * Validate .faf file against schema
 */
export declare function validateSchema(data: any, schemaVersion?: string): ValidationResult;
//# sourceMappingURL=faf-schema.d.ts.map