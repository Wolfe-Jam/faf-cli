/**
 * AI-Optimized YAML Generator v2.5.0
 * Generates .faf files with instant AI onboarding structure
 */

// Helper function to restore markdown formatting from escaped YAML
export function unescapeFromYaml(value: string): string {
  if (!value) return value;

  // Remove surrounding quotes if present
  let unquoted = value;
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    unquoted = value.slice(1, -1);
  }

  // Unescape special characters
  unquoted = unquoted.replace(/\\"/g, '"');

  // Could optionally restore markdown if we detect patterns
  // But for now, just return the clean unescaped value
  return unquoted;
}

// Helper function to generate stack string
function generateStackString(data: any): string {
  const parts = [];
  if (data.framework && data.framework !== 'None') {parts.push(data.framework);}
  if (data.mainLanguage && data.mainLanguage !== 'Unknown') {parts.push(data.mainLanguage);}
  if (data.buildTool && data.buildTool !== 'None') {parts.push(data.buildTool);}
  if (data.hosting && data.hosting !== 'None') {parts.push(data.hosting);}
  if (data.backend && data.backend !== 'None') {parts.push(data.backend);}
  return parts.join('/') || 'Not specified';
}

// Helper function to determine confidence level
function getConfidenceLevel(percentage: number): string {
  if (percentage >= 90) {return 'VERY_HIGH';}
  if (percentage >= 80) {return 'HIGH';}
  if (percentage >= 70) {return 'GOOD';}
  if (percentage >= 60) {return 'MODERATE';}
  return 'LOW';
}

// Helper function to safely escape YAML values
export function escapeForYaml(value: string | undefined): string {
  if (!value) {return 'Not specified';}

  // Clean up markdown-style lists and formatting
  const cleaned = value
    .replace(/^[\s]*[-*]\s*/gm, '') // Remove list markers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1')     // Remove italic
    .replace(/\n+/g, ' ')            // Replace newlines with spaces
    .trim();

  // If it looks like JSON or already quoted, return as-is to avoid double-escaping
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    return cleaned;
  }

  // If it contains special characters or starts with special chars, quote it
  if (cleaned.includes(':') || cleaned.includes('-') || cleaned.includes('[') ||
      cleaned.includes('#') || cleaned.includes('|') || cleaned.includes('>') ||
      cleaned.match(/^[\d\-[\]{}]/)) {
    // Single-escape quotes only
    return `"${cleaned.replace(/"/g, '\\"')}"`;
  }

  return cleaned;
}

// Helper function to detect key files
function detectKeyFiles(data: any): string[] {
  const files = [];
  // Based on framework
  if (data.framework?.toLowerCase().includes('svelte')) {
    files.push('+page.svelte', '+layout.svelte', 'app.html');
  } else if (data.framework?.toLowerCase().includes('react')) {
    files.push('App.tsx', 'index.tsx');
  } else if (data.framework?.toLowerCase().includes('vue')) {
    files.push('App.vue', 'main.ts');
  } else if (data.mainLanguage?.toLowerCase().includes('python')) {
    files.push('main.py', 'requirements.txt');
  }
  
  // 🐍 PYTHON CONTEXT-ON-DEMAND: Add appropriate config files
  if (!data.mainLanguage?.toLowerCase().includes('python')) {
    // Only add JS/TS files for non-Python projects
    files.push('package.json', 'tsconfig.json');
  }
  return files.slice(0, 5); // Max 5 files
}

// Generate project tags
function generateProjectTags(projectData: any) {
  const autoTags = new Set<string>();
  
  // From project name
  if (projectData.projectName) {
    const cleanName = projectData.projectName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    if (cleanName) {autoTags.add(cleanName);}
  }
  
  // From tech stack
  if (projectData.framework) {autoTags.add(projectData.framework.toLowerCase().replace(/\s+/g, '-'));}
  if (projectData.mainLanguage) {autoTags.add(projectData.mainLanguage.toLowerCase().replace(/\s+/g, '-'));}
  if (projectData.buildTool) {autoTags.add(projectData.buildTool.toLowerCase().replace(/\s+/g, '-'));}
  if (projectData.hosting) {autoTags.add(projectData.hosting.toLowerCase().replace(/\s+/g, '-'));}
  if (projectData.backend) {autoTags.add(projectData.backend.toLowerCase().replace(/\s+/g, '-'));}
  
  // Remove empty tags
  autoTags.delete('');
  autoTags.delete('-');
  
  const year = new Date().getFullYear().toString();
  const smartTags: string[] = [
    '.faf',      // ALWAYS - Ecosystem builder!
    'ai-ready',  // ALWAYS - We're AI-optimized
    year,        // Current year for freshness
  ];
  
  // Smart category detection
  if (projectData.projectGoal?.toLowerCase().includes('api') || projectData.framework?.toLowerCase().includes('express')) {
    smartTags.push('backend-api');
  } else if (projectData.framework?.toLowerCase().match(/react|vue|svelte|angular/)) {
    smartTags.push('web-app');
  } else if (projectData.projectGoal?.toLowerCase().includes('library')) {
    smartTags.push('dev-tools');
  } else {
    smartTags.push('software');
  }
  
  // License/sharing detection (simplified for now)
  smartTags.push('open-source'); // Default to open-source for community
  
  return {
    auto_generated: Array.from(autoTags).slice(0, 21),
    smart_defaults: smartTags,
    user_defined: []
  };
}

/**
 * Convert JavaScript object to YAML format
 */
function objectToYaml(obj: Record<string, any>, indent = 0): string {
  let yaml = '';
  const spacing = '  '.repeat(indent);
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {continue;}
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      yaml += `${spacing}${key}:\n`;
      yaml += objectToYaml(value, indent + 1);
    } else if (Array.isArray(value)) {
      yaml += `${spacing}${key}:\n`;
      for (const item of value) {
        // Also escape array items if they're strings
        const escapedItem = typeof item === 'string' ? escapeForYaml(item) : item;
        yaml += `${spacing}  - ${escapedItem}\n`;
      }
    } else {
      // ALWAYS use escapeForYaml for strings to remove markdown and special chars
      let escapedValue = value;
      if (typeof value === 'string') {
        escapedValue = escapeForYaml(value);
      }
      yaml += `${spacing}${key}: ${escapedValue}\n`;
    }
  }
  
  return yaml;
}

export function generateFafContent(projectData: {
  projectName: string;
  projectGoal?: string | undefined;
  mainLanguage: string;
  framework: string;
  cssFramework?: string;
  uiLibrary?: string;
  stateManagement?: string;
  backend: string;
  apiType: string;
  server: string;
  database: string;
  connection: string;
  hosting: string;
  buildTool: string;
  packageManager?: string;
  cicd: string;
  fafScore: number;
  slotBasedPercentage: number;
  projectType?: string;  // Project type for compiler slot-filling patterns
  // Human Context (Project Details)
  targetUser?: string;
  coreProblem?: string;
  missionPurpose?: string;
  deploymentMarket?: string;
  timeline?: string;
  approach?: string;
  // Additional Context Arrays (magical + add Context)
  additionalWho?: string[];
  additionalWhat?: string[];
  additionalWhy?: string[];
  additionalWhere?: string[];
  additionalWhen?: string[];
  additionalHow?: string[];
  projectDetailsScore?: number;
  projectSuccessRate?: number;
}): string {
  // Calculate filled vs total slots for missing context
  const totalSlotsCount = 21; // Base slots
  const filledSlotsCount = Math.round((projectData.slotBasedPercentage / 100) * totalSlotsCount);
  const missingSlots = [];
  if (!projectData.targetUser) {missingSlots.push('Target users');}
  if (!projectData.coreProblem) {missingSlots.push('Core problem');}
  if (!projectData.timeline) {missingSlots.push('Timeline');}
  if (!projectData.cicd || projectData.cicd === 'None') {missingSlots.push('CI/CD pipeline');}
  if (!projectData.database || projectData.database === 'None') {missingSlots.push('Database');}

  const fafData = {
    // FAF schema version (not CLI version)
    faf_version: '2.5.0',
    // 🤖 AI-FIRST SCORING SYSTEM - Championship Engine with FAB-FORMATS
    ai_scoring_system: '2025-09-20',  // faf-engine-mk3 compiler live date
    ai_score: `${projectData.fafScore}%`,  // MY evaluation
    ai_confidence: getConfidenceLevel(projectData.fafScore),  // MY trust level
    ai_value: '30_seconds_replaces_20_minutes_of_questions',
    
    // 🧠 AI READ THIS FIRST - 5-LINE TL;DR
    ai_tldr: {
      project: `${projectData.projectName} - ${escapeForYaml(projectData.projectGoal) || 'Universal AI-context Infrastructure - Make Your AI Happy! 🤖'}`,
      stack: generateStackString(projectData),
      quality_bar: 'ZERO_ERRORS_F1_STANDARDS',
      current_focus: 'Production deployment preparation',
      your_role: 'Build features with perfect context'
    },
    
    // ⚡ INSTANT CONTEXT - Everything critical in one place
    instant_context: {
      what_building: projectData.projectGoal ? escapeForYaml(projectData.projectGoal) : '🚀 Universal AI-context CLI - Trust-Driven Infrastructure that eliminates developer anxiety',
      tech_stack: generateStackString(projectData),
      main_language: projectData.mainLanguage || 'TypeScript',
      deployment: projectData.hosting || 'Cloud platform',
      key_files: detectKeyFiles(projectData)
    },
    
    // 📊 CONTEXT QUALITY METRICS
    context_quality: {
      slots_filled: `${filledSlotsCount}/${totalSlotsCount} (${projectData.slotBasedPercentage}%)`,
      ai_confidence: getConfidenceLevel(projectData.slotBasedPercentage),
      handoff_ready: projectData.slotBasedPercentage > 70,
      missing_context: missingSlots.length > 0 ? missingSlots : ['None - fully specified!']
    },
    
    // 📄 Project Details (Progressive Disclosure)
    project: {
      name: projectData.projectName || 'Untitled Project',
      goal: projectData.projectGoal ? escapeForYaml(projectData.projectGoal) : '⚡️ Transform developer psychology from hope-driven to trust-driven AI development - 30 seconds replaces 20 minutes of questions',
      main_language: projectData.mainLanguage || 'Unknown',
      type: projectData.projectType,  // Project type for compiler slot-filling patterns
      generated: new Date().toISOString(),
      mission: '🚀 Make Your AI Happy! 🧡 Trust-Driven 🤖',
      revolution: '30 seconds replaces 20 minutes of questions',
      brand: 'F1-Inspired Software Engineering - Championship AI Context'
    },
    
    // 🧠 AI OPERATING INSTRUCTIONS
    ai_instructions: {
      priority_order: [
        '1. Read THIS .faf file first',
        '2. Check CLAUDE.md for session context',
        projectData.mainLanguage?.toLowerCase().includes('python') 
          ? '3. Review requirements.txt and main.py for dependencies'
          : '3. Review package.json for dependencies'
      ],
      working_style: {
        code_first: true,
        explanations: 'minimal',
        quality_bar: 'zero_errors',
        testing: 'required'
      },
      warnings: [
        'Never modify dial components without approval',
        'All TypeScript must pass strict mode',
        'Test coverage required for new features'
      ]
    },
    
    // 🏗️ Technical Stack (Full Details)
    stack: {
      frontend: projectData.framework || 'None',
      css_framework: projectData.cssFramework || 'None',
      ui_library: projectData.uiLibrary || 'None', 
      state_management: projectData.stateManagement || 'None',
      backend: projectData.backend || 'None',
      runtime: projectData.server || 'None',
      database: projectData.database || 'None',
      build: projectData.buildTool || 'None',
      package_manager: projectData.packageManager || 'npm',
      api_type: projectData.apiType || 'REST API',
      hosting: projectData.hosting || 'None',
      cicd: projectData.cicd || 'None'
    },
    
    // ⚙️ Development Preferences
    preferences: {
      quality_bar: 'zero_errors',
      commit_style: 'conventional_emoji',
      response_style: 'concise_code_first',
      explanation_level: 'minimal',
      communication: 'direct',
      testing: 'required',
      documentation: 'as_needed'
    },
    
    // 🚀 Project State
    state: {
      phase: 'development',
      version: '1.0.0',
      focus: 'production_deployment',
      status: 'green_flag',
      next_milestone: 'npm_publication',
      blockers: []
    },
    
    // 🏷️ Search & Discovery Tags
    tags: generateProjectTags(projectData),
    
    // 👥 Human Context (The 6 W's) - ALWAYS ESCAPE to remove markdown
    human_context: projectData.targetUser || projectData.coreProblem ? {
      who: escapeForYaml(projectData.targetUser || 'Not specified'),
      what: escapeForYaml(projectData.coreProblem || 'Not specified'),
      why: escapeForYaml(projectData.missionPurpose || 'Not specified'),
      where: escapeForYaml(projectData.deploymentMarket || 'Not specified'),
      when: escapeForYaml(projectData.timeline || 'Not specified'),
      how: escapeForYaml(projectData.approach || 'Not specified'),
      additional_context: {
        who: projectData.additionalWho && projectData.additionalWho.length > 0 ? projectData.additionalWho : undefined,
        what: projectData.additionalWhat && projectData.additionalWhat.length > 0 ? projectData.additionalWhat : undefined,
        why: projectData.additionalWhy && projectData.additionalWhy.length > 0 ? projectData.additionalWhy : undefined,
        where: projectData.additionalWhere && projectData.additionalWhere.length > 0 ? projectData.additionalWhere : undefined,
        when: projectData.additionalWhen && projectData.additionalWhen.length > 0 ? projectData.additionalWhen : undefined,
        how: projectData.additionalHow && projectData.additionalHow.length > 0 ? projectData.additionalHow : undefined
      },
      context_score: projectData.projectDetailsScore || 0,
      total_prd_score: (projectData.projectDetailsScore || 0) + (projectData.fafScore || 0),
      success_rate: `${projectData.projectSuccessRate || 50}%`
    } : undefined,
    
    // 📊 AI Scoring Details (For Transparency)
    ai_scoring_details: {
      system_date: '2025-09-20',  // faf-engine-mk3 Championship Engine
      slot_based_percentage: projectData.slotBasedPercentage,
      ai_score: projectData.fafScore,
      total_slots: 21,
      filled_slots: filledSlotsCount,
      scoring_method: 'Honest percentage - no fake minimums',
      trust_embedded: 'COUNT ONCE architecture - trust MY embedded scores'
    }
  };

  // Use native YAML library and fix any !CI placeholder issues
  const yamlContent = objectToYaml(fafData);
  
  // Championship fix: Replace !CI placeholders with revolutionary content
  const championshipContent = yamlContent
    .replace(/what_building: !CI/g, 'what_building: "🚀 Universal AI-context CLI - Trust-Driven Infrastructure that eliminates developer anxiety"')
    .replace(/goal: !CI/g, 'goal: "⚡️ Transform developer psychology from hope-driven to trust-driven AI development - 30 seconds replaces 20 minutes of questions"');
  
  return championshipContent;
}