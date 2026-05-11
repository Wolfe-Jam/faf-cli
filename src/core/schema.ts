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

  // About Repo validation — when app_type is 'about', about.represents is
  // required. Without it, the About says "I'm about something" but doesn't
  // tell anyone WHAT — useless to AI consumers who can't trace back to the
  // source codebase. See memory/private-source-public-about-pattern.md.
  if (faf.app_type === 'about') {
    if (!faf.about?.represents) {
      errors.push("app_type 'about' requires about.represents (owner/repo of the source codebase)");
    } else if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(faf.about.represents)) {
      errors.push(`about.represents must be "owner/repo" format (got: ${faf.about.represents})`);
    }
    // source_score is optional — missing renders as "—" (White ♡). When
    // present, must be 0-100.
    if (faf.about?.source_score !== undefined) {
      const s = faf.about.source_score;
      if (typeof s !== 'number' || s < 0 || s > 100) {
        errors.push(`about.source_score must be a number 0-100 (got: ${s})`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
