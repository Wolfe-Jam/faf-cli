import type { FafData } from './types.js';
import { REPRESENTS_RE, isAboutFaf } from './about.js';

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

  // about is a repo role, not an app_type.
  if (faf.app_type === 'about') {
    errors.push("about is not an app_type — declare about.represents (owner/repo) instead");
  }

  // About Repo: the about: block is the signal. represents is required.
  if (faf.about !== undefined) {
    if (!isAboutFaf(faf) || typeof faf.about.represents !== 'string') {
      errors.push('about.represents is required (owner/repo of the source codebase)');
    } else if (!REPRESENTS_RE.test(faf.about.represents)) {
      errors.push(`about.represents must be "owner/repo" format (got: ${faf.about.represents})`);
    }
    if (faf.about.source_score !== undefined) {
      const s = faf.about.source_score;
      if (typeof s !== 'number' || s < 0 || s > 100) {
        errors.push(`about.source_score must be a number 0-100 (got: ${s})`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
