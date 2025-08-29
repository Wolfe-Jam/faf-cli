/**
 * 🎯 .faf Scoring Calculator  
 * Advanced scoring algorithm based on your stone-cold testing feedback
 */

export interface SectionScore {
  percentage: number;
  filled: number;
  total: number;
  missing: string[];
}

export interface ScoreResult {
  totalScore: number;
  filledSlots: number;
  totalSlots: number;
  sectionScores: Record<string, SectionScore>;
  suggestions: string[];
  qualityIndicators: {
    hasAiInstructions: boolean;
    hasHumanContext: boolean;
    hasFreshTimestamp: boolean;
    hasQualityPreferences: boolean;
  };
}

/**
 * Scoring weights for different sections
 * Based on your feedback: some slots worth more than others
 */
const SECTION_WEIGHTS = {
  project: 3,           // Core identity - high weight
  ai_instructions: 3,   // Critical for AI adoption - high weight  
  scores: 2,            // Meta-scoring - medium weight
  stack: 2,             // Tech context - medium weight
  preferences: 2,       // Working style - medium weight
  state: 1,             // Current status - low weight
  human_context: 3,     // The 6 W's - high weight from your feedback
  tags: 1,              // Categorization - low weight
  ai: 1,                // AI config - low weight
  docs: 1               // Documentation sync - low weight
};

/**
 * Calculate comprehensive .faf score
 */
export function calculateFafScore(fafData: any): ScoreResult {
  const sectionScores: Record<string, SectionScore> = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;
  let filledSlots = 0;
  let totalSlots = 0;
  const suggestions: string[] = [];
  
  // Score each section
  Object.entries(SECTION_WEIGHTS).forEach(([section, weight]) => {
    const sectionData = fafData[section];
    const sectionScore = scoreFafSection(section, sectionData);
    
    sectionScores[section] = sectionScore;
    totalWeightedScore += sectionScore.percentage * weight;
    totalWeight += weight;
    filledSlots += sectionScore.filled;
    totalSlots += sectionScore.total;
    
    // Generate suggestions for missing items
    if (sectionScore.missing.length > 0 && sectionScore.percentage < 80) {
      const topMissing = sectionScore.missing.slice(0, 2);
      suggestions.push(`Add ${topMissing.join(' and ')} to ${section} section`);
    }
  });
  
  // Calculate final weighted score
  const totalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  
  // Quality indicators (from your stone-cold testing insights)
  const qualityIndicators = {
    hasAiInstructions: !!fafData.ai_instructions?.message,
    hasHumanContext: !!fafData.human_context?.who,
    hasFreshTimestamp: isTimestampFresh(fafData.generated),
    hasQualityPreferences: !!fafData.preferences?.quality_bar
  };
  
  // Add quality-based suggestions
  if (!qualityIndicators.hasAiInstructions) {
    suggestions.unshift('Add AI instructions for better context handoff');
  }
  
  if (!qualityIndicators.hasHumanContext) {
    suggestions.push('Add human context (who/what/why/where/when/how) for deeper understanding');
  }
  
  if (!qualityIndicators.hasFreshTimestamp) {
    suggestions.push('Update generated timestamp - file may be stale');
  }
  
  return {
    totalScore,
    filledSlots,
    totalSlots,
    sectionScores,
    suggestions: suggestions.slice(0, 10), // Top 10 suggestions
    qualityIndicators
  };
}

/**
 * Score individual .faf section
 */
function scoreFafSection(sectionName: string, sectionData: any): SectionScore {
  if (!sectionData || typeof sectionData !== 'object') {
    return {
      percentage: 0,
      filled: 0,
      total: getSectionExpectedFields(sectionName).length,
      missing: getSectionExpectedFields(sectionName)
    };
  }
  
  const expectedFields = getSectionExpectedFields(sectionName);
  const filledFields: string[] = [];
  const missingFields: string[] = [];
  
  expectedFields.forEach(field => {
    const value = getNestedValue(sectionData, field);
    
    if (isFieldFilled(value)) {
      filledFields.push(field);
    } else {
      missingFields.push(field);
    }
  });
  
  const percentage = expectedFields.length > 0 
    ? (filledFields.length / expectedFields.length) * 100 
    : 100;
  
  return {
    percentage,
    filled: filledFields.length,
    total: expectedFields.length,
    missing: missingFields
  };
}

/**
 * Expected fields for each section
 */
function getSectionExpectedFields(sectionName: string): string[] {
  const fieldMap: Record<string, string[]> = {
    project: ['name', 'goal', 'main_language', 'faf_score'],
    ai_instructions: ['priority', 'usage', 'message'],
    scores: ['faf_score', 'slot_based_percentage', 'total_slots'],
    stack: ['frontend', 'backend', 'runtime', 'build', 'package_manager'],
    preferences: ['quality_bar', 'commit_style', 'communication', 'verbosity'],
    state: ['phase', 'version', 'focus', 'status'],
    human_context: ['who', 'what', 'why', 'where', 'when', 'how'],
    tags: ['auto_generated', 'smart_defaults', 'user_defined'],
    ai: ['context_file', 'handoff_ready', 'session_continuity'],
    docs: ['claude_sync', 'sync_frequency', 'last_updated']
  };
  
  return fieldMap[sectionName] || [];
}

/**
 * Check if a field is considered "filled"
 */
function isFieldFilled(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === 'object' && Object.keys(value).length === 0) return false;
  
  return true;
}

/**
 * Get nested value from object
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Check if timestamp is fresh (within 30 days)
 */
function isTimestampFresh(timestamp: string): boolean {
  if (!timestamp) return false;
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const daysDiff = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysDiff <= 30;
  } catch {
    return false;
  }
}