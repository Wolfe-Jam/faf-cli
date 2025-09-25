/**
 * @faf/core - Pure scoring engine with zero dependencies
 */

import type { FafData, ScoreResult, SlotDefinition } from './types';

// Core slot definitions
const CORE_SLOTS: Record<string, SlotDefinition> = {
  'project.name': { required: true, weight: 10, description: 'Project name' },
  'project.description': { required: false, weight: 8, description: 'Project description' },
  'project.goal': { required: false, weight: 7, description: 'Project goal' },
  'instant_context.what_building': { required: true, weight: 15, description: 'What you are building' },
  'instant_context.main_language': { required: true, weight: 12, description: 'Main programming language' },
  'instant_context.frameworks': { required: false, weight: 10, description: 'Frameworks used' },
  'instant_context.tech_stack': { required: false, weight: 8, description: 'Technology stack' },
  'instant_context.context_for_ai': { required: false, weight: 10, description: 'AI context' },
  'paths.root': { required: false, weight: 5, description: 'Root path' },
  'paths.src': { required: false, weight: 5, description: 'Source path' },
  'key_files': { required: false, weight: 15, description: 'Key files list' },
  'context_quality.overall_assessment': { required: false, weight: 10, description: 'Quality assessment' }
};

/**
 * Calculate FAF score from data
 */
export function calculateScore(fafData: FafData): ScoreResult {
  const breakdown = {
    fileScore: 0,
    slotScore: 0,
    contextScore: 0,
    formatBonus: 0
  };

  const details = {
    filledSlots: 0,
    totalSlots: Object.keys(CORE_SLOTS).length,
    keyFiles: 0,
    hasContext: false,
    hasQuality: false
  };

  const recommendations: string[] = [];

  // Calculate slot score
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const [slotPath, definition] of Object.entries(CORE_SLOTS)) {
    totalWeight += definition.weight;
    const value = getNestedValue(fafData, slotPath);

    if (value !== undefined && value !== null && value !== '') {
      earnedWeight += definition.weight;
      details.filledSlots++;

      // Special handling for arrays
      if (slotPath === 'key_files' && Array.isArray(value)) {
        details.keyFiles = value.length;
        breakdown.fileScore = Math.min(value.length * 5, 25);
      }
    } else if (definition.required) {
      recommendations.push(`Add ${definition.description} (${slotPath})`);
    }
  }

  // Calculate percentages
  breakdown.slotScore = Math.round((earnedWeight / totalWeight) * 50);

  // Context bonus
  if (fafData.instant_context?.context_for_ai) {
    breakdown.contextScore = 15;
    details.hasContext = true;
  }

  // Quality bonus
  if (fafData.context_quality?.overall_assessment) {
    breakdown.contextScore += 10;
    details.hasQuality = true;
  }

  // Format bonus for having proper structure
  if (fafData.faf_version && fafData.format_version) {
    breakdown.formatBonus = 5;
  }

  // Calculate total
  const totalScore = Math.min(
    breakdown.fileScore +
    breakdown.slotScore +
    breakdown.contextScore +
    breakdown.formatBonus,
    100
  );

  return {
    totalScore,
    breakdown,
    details,
    recommendations
  };
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Validate FAF data structure
 */
export function validateFafData(data: any): data is FafData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (typeof data.faf_version === 'string' || data.faf_version === undefined) &&
    (typeof data.project === 'object' || data.project === undefined)
  );
}

/**
 * Get missing required slots
 */
export function getMissingRequiredSlots(fafData: FafData): string[] {
  const missing: string[] = [];

  for (const [slotPath, definition] of Object.entries(CORE_SLOTS)) {
    if (definition.required) {
      const value = getNestedValue(fafData, slotPath);
      if (value === undefined || value === null || value === '') {
        missing.push(slotPath);
      }
    }
  }

  return missing;
}

/**
 * Export for convenience
 */
export { CORE_SLOTS };
export type { FafData, ScoreResult, SlotDefinition };