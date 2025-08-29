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
  [key: string]: any; // Allow additional fields
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
 * Required fields for a valid .faf file
 */
const REQUIRED_FIELDS = [
  'faf_version',
  'generated', 
  'project.name',
  'project.main_language',
  'scores.faf_score',
  'scores.slot_based_percentage'
];

/**
 * Core sections that should be present
 */
const CORE_SECTIONS = [
  'project',
  'stack', 
  'scores',
  'ai_instructions',
  'preferences',
  'state'
];

/**
 * Validate .faf file against schema
 */
export function validateSchema(data: any, schemaVersion: string = 'latest'): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Check required fields
  let requiredFieldsFound = 0;
  
  REQUIRED_FIELDS.forEach(fieldPath => {
    const value = getNestedValue(data, fieldPath);
    if (value !== undefined && value !== null && value !== '') {
      requiredFieldsFound++;
    } else {
      errors.push({
        message: `Required field missing: ${fieldPath}`,
        path: fieldPath,
        severity: 'error'
      });
    }
  });
  
  // Check core sections
  let sectionsFound = 0;
  
  CORE_SECTIONS.forEach(section => {
    if (data[section] && typeof data[section] === 'object') {
      sectionsFound++;
    } else {
      warnings.push({
        message: `Core section missing or invalid: ${section}`,
        path: section,
        severity: 'warning'
      });
    }
  });
  
  // Version validation
  if (data.faf_version) {
    if (!isValidVersion(data.faf_version)) {
      warnings.push({
        message: `Invalid faf_version format: ${data.faf_version}`,
        path: 'faf_version',
        severity: 'warning'
      });
    }
  }
  
  // Score validation
  if (data.scores) {
    if (typeof data.scores.faf_score === 'number') {
      if (data.scores.faf_score < 0 || data.scores.faf_score > 100) {
        errors.push({
          message: 'faf_score must be between 0-100',
          path: 'scores.faf_score',
          severity: 'error'
        });
      }
    }
    
    if (typeof data.scores.slot_based_percentage === 'number') {
      if (data.scores.slot_based_percentage < 0 || data.scores.slot_based_percentage > 100) {
        errors.push({
          message: 'slot_based_percentage must be between 0-100',
          path: 'scores.slot_based_percentage',
          severity: 'error'
        });
      }
    }
  }
  
  // Generate timestamp validation
  if (data.generated) {
    try {
      const date = new Date(data.generated);
      if (isNaN(date.getTime())) {
        warnings.push({
          message: 'Invalid generated timestamp format',
          path: 'generated',
          severity: 'warning'
        });
      }
    } catch {
      warnings.push({
        message: 'Invalid generated timestamp format',
        path: 'generated', 
        severity: 'warning'
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    schemaVersion,
    sectionsFound,
    requiredFieldsFound,
    requiredFieldsTotal: REQUIRED_FIELDS.length
  };
}

/**
 * Get nested object value by dot path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Validate version string format (semantic versioning)
 */
function isValidVersion(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/;
  return semverRegex.test(version);
}