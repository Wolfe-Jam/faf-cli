/**
 * 📊 .faf Scoring Calculator
 * Championship scoring with FAB-FORMATS Power Unit
 * 150+ file handlers delivering 86%+ scores!
 */

import { FabFormatsProcessor } from '../engines/fab-formats-processor';
import path from 'path';

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
// const UI_STRUCTURE = {
//   project_components: 15, // The 15 technical fields
//   project_details: 6,     // The 6 W's
//   files: 0,               // Dynamic based on file intelligence
// };

/**
 * Calculate .faf score for v2.5.0 nested_snake format with fab-formats discovery
 */
export async function calculateFafScore(fafData: any, projectPath?: string): Promise<ScoreResult> {
  // 🚨 CRITICAL: Handle null/undefined data safely
  if (!fafData || typeof fafData !== 'object') {
    fafData = {};
  }

  // CHAMPIONSHIP ENGINE: FAB-FORMATS Power Unit from web (86% scores!)
  // This is the REAL engine, not simplified version
  // 150+ file handlers with deep intelligence extraction

  let discoveredContext: any = {};

  if (projectPath) {
    try {
      // Fire up the championship engine! 🏎️
      const projectDir = path.dirname(projectPath);
      const fabProcessor = new FabFormatsProcessor();
      const analysis = await fabProcessor.processFiles(projectDir);

      // Championship Context Extraction - Fill ALL the slots!
      if (analysis.context) {
        const ctx = analysis.context;

        // Project slots (core identity)
        if (ctx.projectName && !fafData.project?.name) {
          if (!fafData.project) fafData.project = {};
          fafData.project.name = ctx.projectName;
        }
        if (ctx.projectGoal && !fafData.project?.goal) {
          if (!fafData.project) fafData.project = {};
          fafData.project.goal = ctx.projectGoal;
        }
        if (ctx.mainLanguage && !fafData.project?.main_language) {
          if (!fafData.project) fafData.project = {};
          fafData.project.main_language = ctx.mainLanguage;
        }

        // Stack slots (technical architecture)
        if (!fafData.stack) fafData.stack = {};
        if (ctx.framework && !fafData.stack.frontend) {
          fafData.stack.frontend = ctx.framework;
        }
        if (ctx.backend && !fafData.stack.backend) {
          fafData.stack.backend = ctx.backend;
        }
        if (ctx.server && !fafData.stack.server) {
          fafData.stack.server = ctx.server;
        }
        if (ctx.database && !fafData.stack.database) {
          fafData.stack.database = ctx.database;
        }
        if (ctx.hosting && !fafData.stack.hosting) {
          fafData.stack.hosting = ctx.hosting;
        }

        // Build slots (development tools)
        if (!fafData.build) fafData.build = {};
        if (ctx.buildTool && !fafData.build.tool) {
          fafData.build.tool = ctx.buildTool;
        }
        if (ctx.packageManager && !fafData.build.package_manager) {
          fafData.build.package_manager = ctx.packageManager;
        }
        if (ctx.testFramework && !fafData.build.test_framework) {
          fafData.build.test_framework = ctx.testFramework;
        }
        if (ctx.linter && !fafData.build.linter) {
          fafData.build.linter = ctx.linter;
        }

        // Human context slots (6 W's)
        if (!fafData.human) fafData.human = {};
        if (ctx.targetUser && !fafData.human.who) {
          fafData.human.who = ctx.targetUser;
        }
        if (ctx.coreProblem && !fafData.human.what) {
          fafData.human.what = ctx.coreProblem;
        }
        if (ctx.missionPurpose && !fafData.human.why) {
          fafData.human.why = ctx.missionPurpose;
        }
        if (ctx.deploymentMarket && !fafData.human.where) {
          fafData.human.where = ctx.deploymentMarket;
        }
        if (ctx.timeline && !fafData.human.when) {
          fafData.human.when = ctx.timeline;
        }
        if (ctx.approach && !fafData.human.how) {
          fafData.human.how = ctx.approach;
        }
      }

      // Process intelligence from each file result
      if (analysis.results && analysis.results.length > 0) {
        // Track quality for bonus scoring
        const hasExceptional = analysis.results.some((r: any) =>
          r.metadata?.grade === 'EXCEPTIONAL'
        );
        const hasProfessional = analysis.results.some((r: any) =>
          r.metadata?.grade === 'PROFESSIONAL'
        );

        // Apply quality bonuses
        if (hasExceptional) {
          // EXCEPTIONAL quality = major score boost
          discoveredContext.qualityBonus = 30;
        } else if (hasProfessional) {
          discoveredContext.qualityBonus = 20;
        }

        // Store discovery metadata
        discoveredContext.filesAnalyzed = analysis.results.length;
        discoveredContext.totalIntelligence = analysis.totalBonus;

      }
    } catch (error) {
      // Log the error so we can see what's wrong with TURBO-CAT
      console.error('TURBO-CAT Discovery failed:', error);
    }
  }
  
  // LEGACY/FALLBACK: Only calculate if no embedded score (older formats)
  let pcSlots = 0;
  
  // Map v2.5.0 nested fields to scoring logic (now enhanced with fab-formats discovery!)
  const projectName = fafData.project?.name || fafData.projectName || discoveredContext.projectName;
  const projectGoal = fafData.project?.goal || fafData.instant_context?.what_building || fafData.projectGoal || discoveredContext.projectGoal;
  const mainLanguage = fafData.instant_context?.main_language || fafData.project?.main_language || fafData.mainLanguage || discoveredContext.mainLanguage;
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
  
  if (projectName?.length >= 3) {pcSlots++;}
  if (projectGoal && projectGoal !== 'Project development and deployment') {pcSlots++;}
  if (mainLanguage && mainLanguage !== 'Unknown') {pcSlots++;}
  if (framework && framework !== 'None') {pcSlots++;}
  if (cssFramework && cssFramework !== 'None') {pcSlots++;}
  if (uiLibrary && uiLibrary !== 'None') {pcSlots++;}
  if (stateManagement && stateManagement !== 'None') {pcSlots++;}
  if (backend && backend !== 'None') {pcSlots++;}
  if (apiType && apiType !== 'REST API') {pcSlots++;}
  if (server && server !== 'None') {pcSlots++;}
  if (database && database !== 'None') {pcSlots++;}
  if (connection && connection !== 'None') {pcSlots++;}
  if (hosting && hosting !== 'None') {pcSlots++;}
  if (buildTool && buildTool !== 'None') {pcSlots++;}
  if (cicd && cicd !== 'None') {pcSlots++;}
  
  // Count PD slots (6 max) - Updated for v2.5.0 nested format
  let pdSlots = 0;
  
  // Map v2.5.0 human_context fields to scoring logic (handle nested objects)
  const hasWho = fafData.human_context?.who && 
                 (typeof fafData.human_context.who === 'object' || 
                  (typeof fafData.human_context.who === 'string' && fafData.human_context.who !== 'Not specified'));
  const hasWhat = fafData.human_context?.what && 
                  (typeof fafData.human_context.what === 'object' || 
                   (typeof fafData.human_context.what === 'string' && fafData.human_context.what !== 'Not specified'));
  const hasWhy = fafData.human_context?.why && 
                 (typeof fafData.human_context.why === 'object' || 
                  (typeof fafData.human_context.why === 'string' && fafData.human_context.why !== 'Not specified'));
  const hasWhere = fafData.human_context?.where && 
                   (typeof fafData.human_context.where === 'object' || 
                    (typeof fafData.human_context.where === 'string' && fafData.human_context.where !== 'Not specified'));
  const hasWhen = fafData.human_context?.when && 
                  (typeof fafData.human_context.when === 'object' || 
                   (typeof fafData.human_context.when === 'string' && fafData.human_context.when !== 'Not specified'));
  const hasHow = fafData.human_context?.how && 
                 (typeof fafData.human_context.how === 'object' || 
                  (typeof fafData.human_context.how === 'string' && fafData.human_context.how !== 'Not specified'));
  
  if (hasWho) {pdSlots++;}
  if (hasWhat) {pdSlots++;}
  if (hasWhy) {pdSlots++;}
  if (hasWhere) {pdSlots++;}
  if (hasWhen) {pdSlots++;}
  if (hasHow) {pdSlots++;}
  
  // Count FILE slots (if files are present) - simplified for CLI
  let fileSlots = 0;
  if (fafData.files && Array.isArray(fafData.files)) {
    // Basic file intelligence scoring for CLI
    const totalIntelligence = fafData.files.reduce((sum: number, file: any) => 
      sum + (file.intelligenceBonus || 0), 0);
    
    if (totalIntelligence >= 150) {fileSlots += 15;}
    else if (totalIntelligence >= 100) {fileSlots += 10;}
    else if (totalIntelligence >= 70) {fileSlots += 7;}
    else if (totalIntelligence >= 50) {fileSlots += 5;}
    else if (totalIntelligence >= 30) {fileSlots += 3;}
    else if (totalIntelligence > 0) {fileSlots += Math.ceil(totalIntelligence / 10);}
  }
  
  const filledSlots = pcSlots + pdSlots + fileSlots;
  const totalSlots = 15 + 6 + fileSlots; // PC + PD + dynamic FILE
  
  // Calculate percentage EXACTLY like UI
  const percentage = totalSlots > 0 ? Math.min(100, Math.round((filledSlots / totalSlots) * 100)) : 0;
  
  // Generate section scores for detailed view
  const sectionScores: Record<string, SectionScore> = {
    project: {
      percentage: Math.round((pcSlots / 15) * 100),
      filled: pcSlots,
      total: 15,
      missing: getProjectComponentsMissing(fafData),
    },
    human_context: {
      percentage: Math.round((pdSlots / 6) * 100),
      filled: pdSlots,
      total: 6,
      missing: getProjectDetailsMissing(fafData),
    },
  };
  
  // Add AI instructions section if present
  if (fafData.ai_instructions) {
    const aiSlots = calculateAIInstructionsScore(fafData.ai_instructions);
    sectionScores.ai_instructions = aiSlots;
  }
  
  // Add technical context section if present  
  if (fafData.technical_context) {
    const techSlots = calculateTechnicalContextScore(fafData.technical_context);
    sectionScores.technical_context = techSlots;
  }
  
  // Generate suggestions
  const suggestions: string[] = [];
  if (pcSlots < 15 && sectionScores.project) {
    const missing = sectionScores.project.missing.slice(0, 2);
    if (missing.length > 0) {
      suggestions.push(`Add ${missing.join(" and ")} to project components`);
    }
  }
  if (pdSlots < 6 && sectionScores.human_context) {
    const missing = sectionScores.human_context.missing.slice(0, 2);
    if (missing.length > 0) {
      suggestions.push(`Add ${missing.join(" and ")} to human context (6 W's)`);
    }
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
  
  if (!projectName || projectName.length < 3) {missing.push("project.name");}
  if (!projectGoal || projectGoal === 'Project development and deployment') {missing.push("project.goal");}
  if (!mainLanguage || mainLanguage === 'Unknown') {missing.push("main_language");}
  if (!framework || framework === 'None') {missing.push("stack.frontend");}
  if (!cssFramework || cssFramework === 'None') {missing.push("stack.css_framework");}
  if (!uiLibrary || uiLibrary === 'None') {missing.push("stack.ui_library");}
  if (!stateManagement || stateManagement === 'None') {missing.push("stack.state_management");}
  if (!backend || backend === 'None') {missing.push("stack.backend");}
  if (!apiType || apiType === 'REST API') {missing.push("stack.api_type");}
  if (!server || server === 'None') {missing.push("stack.runtime");}
  if (!database || database === 'None') {missing.push("stack.database");}
  if (!connection || connection === 'None') {missing.push("stack.connection");}
  if (!hosting || hosting === 'None') {missing.push("stack.hosting");}
  if (!buildTool || buildTool === 'None') {missing.push("stack.build");}
  if (!cicd || cicd === 'None') {missing.push("stack.cicd");}
  
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
  
  if (!targetUser || targetUser === 'Not specified') {missing.push("human_context.who (WHO)");}
  if (!coreProblem || coreProblem === 'Not specified') {missing.push("human_context.what (WHAT)");}
  if (!missionPurpose || missionPurpose === 'Not specified') {missing.push("human_context.why (WHY)");}
  if (!deploymentMarket || deploymentMarket === 'Not specified') {missing.push("human_context.where (WHERE)");}
  if (!timeline || timeline === 'Not specified') {missing.push("human_context.when (WHEN)");}
  if (!approach || approach === 'Not specified') {missing.push("human_context.how (HOW)");}
  
  return missing;
}


/**
 * Calculate AI Instructions section score
 */
function calculateAIInstructionsScore(aiInstructions: any): SectionScore {
  let filled = 0;
  const total = 5; // 5 key AI instruction elements
  const missing: string[] = [];
  
  if (aiInstructions.priority) {filled++;}
  else {missing.push('ai_instructions.priority');}
  
  if (aiInstructions.message) {filled++;}
  else {missing.push('ai_instructions.message');}
  
  if (aiInstructions.guidelines && Array.isArray(aiInstructions.guidelines) && aiInstructions.guidelines.length > 0) {filled++;}
  else {missing.push('ai_instructions.guidelines');}
  
  if (aiInstructions.priority_order) {filled++;}
  else {missing.push('ai_instructions.priority_order');}
  
  if (aiInstructions.working_style) {filled++;}
  else {missing.push('ai_instructions.working_style');}
  
  return {
    percentage: Math.round((filled / total) * 100),
    filled,
    total,
    missing
  };
}

/**
 * Calculate Technical Context section score
 */
function calculateTechnicalContextScore(techContext: any): SectionScore {
  let filled = 0;
  const total = 4; // 4 key technical context elements
  const missing: string[] = [];
  
  if (techContext.architecture) {filled++;}
  else {missing.push('technical_context.architecture');}
  
  if (techContext.tech_stack) {filled++;}
  else {missing.push('technical_context.tech_stack');}
  
  if (techContext.key_files && Array.isArray(techContext.key_files) && techContext.key_files.length > 0) {filled++;}
  else {missing.push('technical_context.key_files');}
  
  if (techContext.patterns || techContext.infrastructure) {filled++;}
  else {missing.push('technical_context.patterns');}
  
  return {
    percentage: Math.round((filled / total) * 100),
    filled,
    total,
    missing
  };
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
