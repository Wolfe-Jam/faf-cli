import type { FafData } from './types.js';

/** Validate a parsed .faf object */
export function validateFaf(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('File is not a valid YAML mapping');
    return { valid: false, errors };
  }

  const faf = data as FafData;

  if (!faf.faf_version) {
    errors.push('Missing required field: faf_version');
  }

  if (!faf.project?.name) {
    errors.push('Missing required field: project.name');
  }

  return { valid: errors.length === 0, errors };
}
