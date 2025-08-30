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

// NO WEIGHTS - UI uses direct slot counting
// Total slots = PC (15) + PD (6) + FILE (dynamic)
const UI_STRUCTURE = {
  project_components: 15, // The 15 technical fields
  project_details: 6,     // The 6 W's
  files: 0,               // Dynamic based on file intelligence
};

/**
 * Calculate .faf score for v2.5.0 nested_snake format
 */
export function calculateFafScore(fafData: any): ScoreResult {
  // COUNT ONCE, SHARE MANY: Use embedded score if available (v2.5.0+)
  if (fafData.faf_score && fafData.project?.faf_version === '2.5.0') {
    const embeddedScore = parseInt(fafData.faf_score.replace('%', ''));
    const embeddedSlots = fafData.scoring?.filled_slots || 0;
    const embeddedTotal = fafData.scoring?.total_slots || 21;
    
    return {
      totalScore: embeddedScore,
      filledSlots: embeddedSlots,
      totalSlots: embeddedTotal,
      sectionScores: {
        embedded_scoring: {
          percentage: embeddedScore,
          filled: embeddedSlots,
          total: embeddedTotal,
          missing: ['Use faf init to regenerate with current context']
        }
      },
      suggestions: ['Edit .faf file to add missing context', 'Run faf validate to check format'],
      qualityIndicators: {
        hasAiInstructions: !!fafData.ai_instructions,
        hasHumanContext: !!fafData.human_context,
        hasFreshTimestamp: isTimestampFresh(fafData.project?.generated),
        hasQualityPreferences: !!fafData.preferences
      }
    };
  }

  // LEGACY/FALLBACK: Only calculate if no embedded score (older formats)
  let pcSlots = 0;
  
  // Map v2.5.0 nested fields to scoring logic
  const projectName = fafData.project?.name || fafData.projectName;
  const projectGoal = fafData.project?.goal || fafData.instant_context?.what_building || fafData.projectGoal;
  const mainLanguage = fafData.instant_context?.main_language || fafData.project?.main_language || fafData.mainLanguage;
  const framework = fafData.stack?.frontend || fafData.framework;
  const cssFramework = fafData.stack?.css_framework || fafData.cssFramework;
  const uiLibrary = fafData.stack?.ui_library || fafData.uiLibrary;
  const stateManagement = fafData.stack?.state_management || fafData.stateManagement;
  const backend = fafData.stack?.backend || fafData.backend;
  const apiType = fafData.stack?.api_type || fafData.apiType;
  const server = fafData.stack?.runtime || fafData.server;
  const database = fafData.stack?.database || fafData.database;
  const connection = fafData.stack?.connection || fafData.connection;
  const hosting = fafData.stack?.hosting || fafData.instant_context?.deployment || fafData.hosting;
  const buildTool = fafData.stack?.build || fafData.buildTool;
  const cicd = fafData.stack?.cicd || fafData.cicd;
  
  if (projectName?.length >= 3) pcSlots++;
  if (projectGoal && projectGoal !== 'Project development and deployment') pcSlots++;
  if (mainLanguage && mainLanguage !== 'Unknown') pcSlots++;
  if (framework && framework !== 'None') pcSlots++;
  if (cssFramework && cssFramework !== 'None') pcSlots++;
  if (uiLibrary && uiLibrary !== 'None') pcSlots++;
  if (stateManagement && stateManagement !== 'None') pcSlots++;
  if (backend && backend !== 'None') pcSlots++;
  if (apiType && apiType !== 'REST API') pcSlots++;
  if (server && server !== 'None') pcSlots++;
  if (database && database !== 'None') pcSlots++;
  if (connection && connection !== 'None') pcSlots++;
  if (hosting && hosting !== 'None') pcSlots++;
  if (buildTool && buildTool !== 'None') pcSlots++;
  if (cicd && cicd !== 'None') pcSlots++;
  
  // Count PD slots (6 max) - Updated for v2.5.0 nested format
  let pdSlots = 0;
  
  // Map v2.5.0 human_context fields to scoring logic
  const targetUser = fafData.human_context?.who || fafData.targetUser;
  const coreProblem = fafData.human_context?.what || fafData.coreProblem;
  const missionPurpose = fafData.human_context?.why || fafData.missionPurpose;
  const deploymentMarket = fafData.human_context?.where || fafData.deploymentMarket;
  const timeline = fafData.human_context?.when || fafData.timeline;
  const approach = fafData.human_context?.how || fafData.approach;
  
  if (targetUser && targetUser !== 'Not specified') pdSlots++;
  if (coreProblem && coreProblem !== 'Not specified') pdSlots++;
  if (missionPurpose && missionPurpose !== 'Not specified') pdSlots++;
  if (deploymentMarket && deploymentMarket !== 'Not specified') pdSlots++;
  if (timeline && timeline !== 'Not specified') pdSlots++;
  if (approach && approach !== 'Not specified') pdSlots++;
  
  // Count FILE slots (if files are present) - simplified for CLI
  let fileSlots = 0;
  if (fafData.files && Array.isArray(fafData.files)) {
    // Basic file intelligence scoring for CLI
    const totalIntelligence = fafData.files.reduce((sum: number, file: any) => 
      sum + (file.intelligenceBonus || 0), 0);
    
    if (totalIntelligence >= 150) fileSlots += 15;
    else if (totalIntelligence >= 100) fileSlots += 10;
    else if (totalIntelligence >= 70) fileSlots += 7;
    else if (totalIntelligence >= 50) fileSlots += 5;
    else if (totalIntelligence >= 30) fileSlots += 3;
    else if (totalIntelligence > 0) fileSlots += Math.ceil(totalIntelligence / 10);
  }
  
  const filledSlots = pcSlots + pdSlots + fileSlots;
  const totalSlots = 15 + 6 + fileSlots; // PC + PD + dynamic FILE
  
  // Calculate percentage EXACTLY like UI
  const percentage = totalSlots > 0 ? Math.min(100, Math.round((filledSlots / totalSlots) * 100)) : 0;
  
  // Generate section scores for detailed view
  const sectionScores: Record<string, SectionScore> = {
    project_components: {
      percentage: Math.round((pcSlots / 15) * 100),
      filled: pcSlots,
      total: 15,
      missing: getProjectComponentsMissing(fafData),
    },
    project_details: {
      percentage: Math.round((pdSlots / 6) * 100),
      filled: pdSlots,
      total: 6,
      missing: getProjectDetailsMissing(fafData),
    },
  };
  
  // Generate suggestions
  const suggestions: string[] = [];
  if (pcSlots < 15) {
    const missing = sectionScores.project_components.missing.slice(0, 2);
    suggestions.push(`Add ${missing.join(" and ")} to project components`);
  }
  if (pdSlots < 6) {
    const missing = sectionScores.project_details.missing.slice(0, 2);
    suggestions.push(`Add ${missing.join(" and ")} to project details (6 W's)`);
  }
  
  // Quality indicators - simplified
  const qualityIndicators = {
    hasAiInstructions: false, // Not used in UI format
    hasHumanContext: pdSlots > 0,
    hasFreshTimestamp: isTimestampFresh(fafData.generated),
    hasQualityPreferences: false, // Not used in UI format
  };
  
  return {
    totalScore: percentage,
    filledSlots,
    totalSlots,
    sectionScores,
    suggestions: suggestions.slice(0, 10),
    qualityIndicators,
  };
}

/**
 * Get missing Project Components fields (v2.5.0 format)
 */
function getProjectComponentsMissing(fafData: any): string[] {
  const missing: string[] = [];
  
  // Use same mapping logic as scoring
  const projectName = fafData.project?.name || fafData.projectName;
  const projectGoal = fafData.project?.goal || fafData.instant_context?.what_building || fafData.projectGoal;
  const mainLanguage = fafData.instant_context?.main_language || fafData.project?.main_language || fafData.mainLanguage;
  const framework = fafData.stack?.frontend || fafData.framework;
  const cssFramework = fafData.stack?.css_framework || fafData.cssFramework;
  const uiLibrary = fafData.stack?.ui_library || fafData.uiLibrary;
  const stateManagement = fafData.stack?.state_management || fafData.stateManagement;
  const backend = fafData.stack?.backend || fafData.backend;
  const apiType = fafData.stack?.api_type || fafData.apiType;
  const server = fafData.stack?.runtime || fafData.server;
  const database = fafData.stack?.database || fafData.database;
  const connection = fafData.stack?.connection || fafData.connection;
  const hosting = fafData.stack?.hosting || fafData.instant_context?.deployment || fafData.hosting;
  const buildTool = fafData.stack?.build || fafData.buildTool;
  const cicd = fafData.stack?.cicd || fafData.cicd;
  
  if (!projectName || projectName.length < 3) missing.push("project.name");
  if (!projectGoal || projectGoal === 'Project development and deployment') missing.push("project.goal");
  if (!mainLanguage || mainLanguage === 'Unknown') missing.push("main_language");
  if (!framework || framework === 'None') missing.push("stack.frontend");
  if (!cssFramework || cssFramework === 'None') missing.push("stack.css_framework");
  if (!uiLibrary || uiLibrary === 'None') missing.push("stack.ui_library");
  if (!stateManagement || stateManagement === 'None') missing.push("stack.state_management");
  if (!backend || backend === 'None') missing.push("stack.backend");
  if (!apiType || apiType === 'REST API') missing.push("stack.api_type");
  if (!server || server === 'None') missing.push("stack.runtime");
  if (!database || database === 'None') missing.push("stack.database");
  if (!connection || connection === 'None') missing.push("stack.connection");
  if (!hosting || hosting === 'None') missing.push("stack.hosting");
  if (!buildTool || buildTool === 'None') missing.push("stack.build");
  if (!cicd || cicd === 'None') missing.push("stack.cicd");
  
  return missing;
}

/**
 * Get missing Project Details (6 W's) fields (v2.5.0 format)
 */
function getProjectDetailsMissing(fafData: any): string[] {
  const missing: string[] = [];
  
  // Use same mapping logic as scoring
  const targetUser = fafData.human_context?.who || fafData.targetUser;
  const coreProblem = fafData.human_context?.what || fafData.coreProblem;
  const missionPurpose = fafData.human_context?.why || fafData.missionPurpose;
  const deploymentMarket = fafData.human_context?.where || fafData.deploymentMarket;
  const timeline = fafData.human_context?.when || fafData.timeline;
  const approach = fafData.human_context?.how || fafData.approach;
  
  if (!targetUser || targetUser === 'Not specified') missing.push("human_context.who (WHO)");
  if (!coreProblem || coreProblem === 'Not specified') missing.push("human_context.what (WHAT)");
  if (!missionPurpose || missionPurpose === 'Not specified') missing.push("human_context.why (WHY)");
  if (!deploymentMarket || deploymentMarket === 'Not specified') missing.push("human_context.where (WHERE)");
  if (!timeline || timeline === 'Not specified') missing.push("human_context.when (WHEN)");
  if (!approach || approach === 'Not specified') missing.push("human_context.how (HOW)");
  
  return missing;
}


/**
 * Check if timestamp is fresh (within 30 days)
 */
function isTimestampFresh(timestamp: string): boolean {
  if (!timestamp) {return false;}

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const daysDiff =
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff <= 30;
  } catch {
    return false;
  }
}
