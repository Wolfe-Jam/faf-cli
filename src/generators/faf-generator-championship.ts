/**
 * 🏎️ Championship .faf Generator
 * Uses FAB-FORMATS Power Unit for 86%+ context extraction
 */

import { promises as fs } from "fs";
import path from "path";
import {
  findPackageJson,
  findPyprojectToml,
  findRequirementsTxt,
  findTsConfig,
  analyzeTsConfig,
  TypeScriptContext,
} from "../utils/file-utils";
import { generateFafContent } from "../utils/yaml-generator";
import { FabFormatsProcessor, FabFormatsAnalysis } from "../engines/fab-formats-processor";
import { relentlessExtractor } from "../engines/relentless-context-extractor";
import { detectClaudeCode, type ClaudeCodeResult } from "../framework-detector";

export interface GenerateOptions {
  projectType?: string;
  outputPath: string;
  projectRoot: string;
  // Quick mode fields (optional)
  projectName?: string;
  projectGoal?: string;
  mainLanguage?: string;
  framework?: string;
  hosting?: string;
  [key: string]: any;  // Allow additional fields
}

export async function generateFafFromProject(
  options: GenerateOptions,
): Promise<string> {
  const { projectType, projectRoot } = options;

  // Validate projectRoot
  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error(`Invalid projectRoot: ${projectRoot}. Expected a valid directory path.`);
  }

  // Read README.md if available (HUMAN CONTEXT SOURCE)
  let readmeData: any = {};
  const readmePath = path.join(projectRoot, "README.md");
  try {
    const readmeContent = await fs.readFile(readmePath, "utf-8");
    readmeData = extractReadmeContext(readmeContent);
  } catch {
    // Continue without README data
  }

  // Read package.json if available (JavaScript projects)
  const packageJsonPath = await findPackageJson(projectRoot);
  let packageData: any = {};

  if (packageJsonPath) {
    try {
      const content = await fs.readFile(packageJsonPath, "utf-8");
      packageData = JSON.parse(content);
    } catch {
      // Continue without package.json data
    }
  }

  // Read pyproject.toml if available (Python projects)
  const pyprojectPath = await findPyprojectToml(projectRoot);
  const pyprojectData: any = {};

  if (pyprojectPath) {
    try {
      const content = await fs.readFile(pyprojectPath, "utf-8");
      // Basic parsing for Python projects
      if (content.includes('[tool.poetry]')) {
        pyprojectData.packageManager = 'Poetry';
      }
      const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch) {
        pyprojectData.name = nameMatch[1];
      }
      const descMatch = content.match(/description\s*=\s*"([^"]+)"/);
      if (descMatch) {
        pyprojectData.description = descMatch[1];
      }
      const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
      if (versionMatch) {
        pyprojectData.version = versionMatch[1];
      }
    } catch {
      // Continue without pyproject.toml data
    }
  }

  // Read requirements.txt if available (Python projects)
  const requirementsPath = await findRequirementsTxt(projectRoot);
  const requirementsData: any = {};

  if (requirementsPath) {
    try {
      const content = await fs.readFile(requirementsPath, "utf-8");
      const lines = content.split('\n').filter(line => line && !line.startsWith('#'));
      requirementsData.dependencies = lines;
    } catch {
      // Continue without requirements.txt data
    }
  }

  // 🏎️ CHAMPIONSHIP ENGINE - FAB-FORMATS Power Unit with 150+ handlers!
  const fabProcessor = new FabFormatsProcessor();
  let fabAnalysis: FabFormatsAnalysis;
  try {
    fabAnalysis = await fabProcessor.processFiles(projectRoot);
  } catch {
    // Fallback to empty analysis if discovery fails
    fabAnalysis = {
      results: [],
      totalBonus: 0,
      context: {},
      qualityMetrics: {
        highestGrade: 'MINIMAL',
        averageScore: 0,
        filesCovered: 0,
        intelligenceDepth: 0
      }
    };
  }

  // 🏎️ AERO PACKAGE - RelentlessContextExtractor for human context!
  let humanContext;
  try {
    humanContext = await relentlessExtractor.extractFromProject(projectRoot);
  } catch {
    // Fallback to empty context
    humanContext = null;
  }

  // TypeScript configuration analysis
  const tsConfigPath = await findTsConfig(projectRoot);
  let tsContext: TypeScriptContext | null = null;
  if (tsConfigPath) {
    const result = await analyzeTsConfig(tsConfigPath);
    if (result) {
      tsContext = result;
    }
  }

  // 🏎️ Claude Code Detection - Detect .claude/agents, .claude/commands, CLAUDE.md
  let claudeCodeResult: ClaudeCodeResult | null = null;
  try {
    claudeCodeResult = await detectClaudeCode(projectRoot);
  } catch {
    // Continue without Claude Code detection
  }

  // 🦊 Bun Detection - Check for bun.lockb
  let isBunProject = false;
  try {
    await fs.access(path.join(projectRoot, 'bun.lockb'));
    isBunProject = true;
  } catch {
    // Not a Bun project
  }

  // START ENHANCED SCORING - Championship grade with FAB-FORMATS!
  // HONEST SCORING: 0% is a valid score - no base points for merely existing!
  let enhancedScore = 0;

  // Map all discovered slots (21-slot system)
  const contextSlotsFilled: Record<string, any> = {};

  // IF: Quick mode data takes priority (user explicitly provided it)
  if (options.projectGoal) {
    contextSlotsFilled['project_goal'] = options.projectGoal;
  }
  if (options.projectName) {
    contextSlotsFilled['project_name'] = options.projectName;
  }
  if (options.mainLanguage) {
    contextSlotsFilled['main_language'] = options.mainLanguage;
  }
  if (options.framework && options.framework !== 'none') {
    contextSlotsFilled['framework'] = options.framework;
  }
  if (options.hosting && options.hosting !== 'cloud') {
    contextSlotsFilled['hosting'] = options.hosting;
  }

  // Apply championship context extraction
  if (fabAnalysis.context) {
    const ctx = fabAnalysis.context;

    // Technical slots (15) - only fill if not already set by quick mode
    if (ctx.projectName && !contextSlotsFilled['project_name']) {contextSlotsFilled['project_name'] = ctx.projectName;}
    if (ctx.projectGoal && !contextSlotsFilled['project_goal']) {contextSlotsFilled['project_goal'] = ctx.projectGoal;}
    if (ctx.mainLanguage) {contextSlotsFilled['main_language'] = ctx.mainLanguage;}
    if (ctx.framework) {contextSlotsFilled['framework'] = ctx.framework;}
    if (ctx.backend) {contextSlotsFilled['backend'] = ctx.backend;}
    if (ctx.server) {contextSlotsFilled['server'] = ctx.server;}
    if (ctx.apiType) {contextSlotsFilled['api_type'] = ctx.apiType;}
    if (ctx.database) {contextSlotsFilled['database'] = ctx.database;}
    if (ctx.hosting) {contextSlotsFilled['hosting'] = ctx.hosting;}
    if (ctx.cicd) {contextSlotsFilled['cicd'] = ctx.cicd;}
    if (ctx.buildTool) {contextSlotsFilled['build_tool'] = ctx.buildTool;}
    if (ctx.packageManager) {contextSlotsFilled['package_manager'] = ctx.packageManager;}
    if (ctx.testFramework) {contextSlotsFilled['test_framework'] = ctx.testFramework;}
    if (ctx.linter) {contextSlotsFilled['linter'] = ctx.linter;}

    // Human context slots (6 W's)
    if (ctx.targetUser) {contextSlotsFilled['who'] = ctx.targetUser;}
    if (ctx.coreProblem) {contextSlotsFilled['what'] = ctx.coreProblem;}
    if (ctx.missionPurpose) {contextSlotsFilled['why'] = ctx.missionPurpose;}
    if (ctx.deploymentMarket) {contextSlotsFilled['where'] = ctx.deploymentMarket;}
    if (ctx.timeline) {contextSlotsFilled['when'] = ctx.timeline;}
    if (ctx.approach) {contextSlotsFilled['how'] = ctx.approach;}
  }

  // Apply RELENTLESS human context extraction (overrides if higher confidence)
  if (humanContext) {
    if (humanContext.who.confidence === 'CERTAIN' || !contextSlotsFilled['who']) {
      contextSlotsFilled['who'] = humanContext.who.value;
    }
    if (humanContext.what.confidence === 'CERTAIN' || !contextSlotsFilled['what']) {
      contextSlotsFilled['what'] = humanContext.what.value;
    }
    if (humanContext.why.confidence === 'CERTAIN' || !contextSlotsFilled['why']) {
      contextSlotsFilled['why'] = humanContext.why.value;
    }
    if (humanContext.where.confidence === 'CERTAIN' || !contextSlotsFilled['where']) {
      contextSlotsFilled['where'] = humanContext.where.value;
    }
    if (humanContext.when.confidence === 'CERTAIN' || !contextSlotsFilled['when']) {
      contextSlotsFilled['when'] = humanContext.when.value;
    }
    if (humanContext.how.confidence === 'CERTAIN' || !contextSlotsFilled['how']) {
      contextSlotsFilled['how'] = humanContext.how.value;
    }
  }

  // CLI-specific detection and smart slot reuse
  const deps = {
    ...packageData.dependencies,
    ...packageData.devDependencies
  };

  // 🦀 RUST CLI DETECTION: Check Cargo.toml for [bin] section
  let isRustCLI = false;
  const cargoTomlData: any = {};
  const cargoTomlPath = path.join(projectRoot, 'Cargo.toml');
  try {
    const cargoContent = await fs.readFile(cargoTomlPath, 'utf-8');
    // Detect CLI: [bin] section or clap/structopt dependencies
    isRustCLI = cargoContent.includes('[bin]') ||
                cargoContent.includes('clap') ||
                cargoContent.includes('structopt') ||
                cargoContent.includes('argh');
    // Extract name from Cargo.toml
    const nameMatch = cargoContent.match(/^name\s*=\s*"([^"]+)"/m);
    if (nameMatch) {cargoTomlData.name = nameMatch[1];}
    const descMatch = cargoContent.match(/^description\s*=\s*"([^"]+)"/m);
    if (descMatch) {cargoTomlData.description = descMatch[1];}
    const versionMatch = cargoContent.match(/^version\s*=\s*"([^"]+)"/m);
    if (versionMatch) {cargoTomlData.version = versionMatch[1];}
  } catch {
    // No Cargo.toml or can't read it
  }

  // Node.js CLI detection
  const isNodeCLI = packageData.bin ||
                packageData.name?.includes('cli') ||
                packageData.keywords?.includes('cli') ||
                packageData.keywords?.includes('command-line') ||
                deps?.commander ||
                deps?.yargs ||
                deps?.oclif ||
                deps?.inquirer;

  // 🦀 RUST CLI: Smart slot assignment
  if (isRustCLI) {
    contextSlotsFilled['framework'] = 'CLI';
    contextSlotsFilled['api_type'] = 'CLI';
    contextSlotsFilled['hosting'] = 'crates.io / Binary distribution';
    contextSlotsFilled['backend'] = 'Rust';
    contextSlotsFilled['main_language'] = 'Rust';
    contextSlotsFilled['build_tool'] = 'Cargo';
    contextSlotsFilled['package_manager'] = 'Cargo';
    contextSlotsFilled['runtime'] = 'Native binary';
    // Set 'None' for non-applicable slots (standardized - matches yaml-generator check)
    contextSlotsFilled['css_framework'] = 'None';
    contextSlotsFilled['ui_library'] = 'None';
    contextSlotsFilled['database'] = 'None';
    contextSlotsFilled['frontend'] = 'None';
    // Cargo.toml is AUTHORITATIVE for Rust - always override FAB/README guesses
    if (cargoTomlData.name) {
      contextSlotsFilled['project_name'] = cargoTomlData.name;
    }
    if (cargoTomlData.description) {
      contextSlotsFilled['project_goal'] = cargoTomlData.description;
    }
    if (cargoTomlData.version) {
      contextSlotsFilled['version'] = cargoTomlData.version;
    }
  }

  if (isNodeCLI) {
    // Smart slot reuse for CLI projects
    contextSlotsFilled['framework'] = 'CLI';  // frontend = CLI
    contextSlotsFilled['api_type'] = 'CLI';
    contextSlotsFilled['hosting'] = 'npm registry';
    contextSlotsFilled['backend'] = 'Node.js';

    // Detect terminal UI framework
    if (deps?.chalk) {contextSlotsFilled['css_framework'] = 'chalk (terminal colors)';}
    else if (deps?.colors) {contextSlotsFilled['css_framework'] = 'colors';}
    else if (deps?.ora) {contextSlotsFilled['css_framework'] = 'ora';}

    // Detect interactive framework
    if (deps?.inquirer) {contextSlotsFilled['ui_library'] = 'inquirer (interactive prompts)';}
    else if (deps?.prompts) {contextSlotsFilled['ui_library'] = 'prompts';}
    else if (deps?.enquirer) {contextSlotsFilled['ui_library'] = 'enquirer';}

    // Detect CLI framework
    if (deps?.commander) {contextSlotsFilled['cli_framework'] = 'commander';}
    else if (deps?.yargs) {contextSlotsFilled['cli_framework'] = 'yargs';}
    else if (deps?.oclif) {contextSlotsFilled['cli_framework'] = 'oclif';}

    // Set 'None' for non-applicable slots (CLI tools don't have databases/frontend)
    contextSlotsFilled['database'] = 'None';
    if (!contextSlotsFilled['frontend']) {
      contextSlotsFilled['frontend'] = 'None';  // Unless already set
    }

    // Detect runtime (Bun takes priority if bun.lockb exists)
    if (isBunProject) {
      contextSlotsFilled['runtime'] = 'Bun';
      contextSlotsFilled['package_manager'] = 'Bun';
    } else if (packageData.engines?.node) {
      contextSlotsFilled['runtime'] = `Node.js ${packageData.engines.node}`;
    } else {
      contextSlotsFilled['runtime'] = 'Node.js v16+';
    }

    // Detect build system
    if (deps?.typescript || deps?.['@types/node']) {
      contextSlotsFilled['build_tool'] = 'TypeScript (tsc)';
    }

    // Detect testing
    if (deps?.jest) {contextSlotsFilled['test_framework'] = 'Jest';}
    else if (deps?.mocha) {contextSlotsFilled['test_framework'] = 'Mocha';}
    else if (deps?.vitest) {contextSlotsFilled['test_framework'] = 'Vitest';}

    // Detect CI/CD - check for .github/workflows directory
    try {
      const githubWorkflowsPath = path.join(projectRoot, '.github', 'workflows');
      const githubWorkflowsExists = await fs.access(githubWorkflowsPath).then(() => true).catch(() => false);
      if (githubWorkflowsExists) {
        contextSlotsFilled['cicd'] = 'GitHub Actions';
      }
    } catch {
      // Continue without CI/CD detection
    }
  }

  // 🦊 Bun Detection - applies to ALL JavaScript/Node.js projects
  if (isBunProject) {
    contextSlotsFilled['runtime'] = 'Bun';
    contextSlotsFilled['package_manager'] = 'Bun';
  }

  // package.json is AUTHORITATIVE - always override FAB/README guesses
  if (packageData.name) {
    contextSlotsFilled['project_name'] = packageData.name;
  }
  if (packageData.description) {
    contextSlotsFilled['project_goal'] = packageData.description;
  }
  if (packageData.version) {
    contextSlotsFilled['version'] = packageData.version;
  }

  // pyproject.toml is AUTHORITATIVE for Python - always override FAB/README guesses
  if (pyprojectData.name) {
    contextSlotsFilled['project_name'] = pyprojectData.name;
  }
  if (pyprojectData.description) {
    contextSlotsFilled['project_goal'] = pyprojectData.description;
  }
  if (pyprojectData.version) {
    contextSlotsFilled['version'] = pyprojectData.version;
  }

  // Apply README data ONLY if package.json/pyproject.toml/Cargo.toml don't have it
  // package.json/Cargo.toml/pyproject.toml are AUTHORITATIVE for name/description
  if (readmeData.projectName && !contextSlotsFilled['project_name'] &&
      !packageData.name && !pyprojectData.name && !cargoTomlData.name) {
    contextSlotsFilled['project_name'] = readmeData.projectName;
  }
  if (readmeData.description && !contextSlotsFilled['project_goal'] &&
      !packageData.description && !pyprojectData.description && !cargoTomlData.description) {
    contextSlotsFilled['project_goal'] = readmeData.description;
  }
  if (readmeData.targetUser && !contextSlotsFilled['who']) {
    contextSlotsFilled['who'] = readmeData.targetUser;
  }

  // Calculate slot-based score
  const technicalSlots = [
    'project_name', 'project_goal', 'main_language', 'framework',
    'backend', 'server', 'api_type', 'database', 'hosting',
    'cicd', 'build_tool', 'package_manager', 'test_framework', 'linter'
  ];
  const humanSlots = ['who', 'what', 'why', 'where', 'when', 'how'];

  let technicalFilled = 0;
  let humanFilled = 0;

  technicalSlots.forEach(slot => {
    if (contextSlotsFilled[slot]) {
      technicalFilled++;
      enhancedScore += 4; // Each technical slot = 4%
    }
  });

  humanSlots.forEach(slot => {
    if (contextSlotsFilled[slot]) {
      humanFilled++;
      enhancedScore += 5; // Each human slot = 5%
    }
  });

  // Quality bonuses from FAB-FORMATS
  if (fabAnalysis.qualityMetrics) {
    const grade = fabAnalysis.qualityMetrics.highestGrade;
    if (grade === 'EXCEPTIONAL') {
      enhancedScore += 20;
    } else if (grade === 'PROFESSIONAL') {
      enhancedScore += 15;
    } else if (grade === 'GOOD') {
      enhancedScore += 10;
    } else if (grade === 'BASIC') {
      enhancedScore += 5;
    }
  }

  // Intelligence depth bonus
  if (fabAnalysis.qualityMetrics.intelligenceDepth > 80) {
    enhancedScore += 15;
  } else if (fabAnalysis.qualityMetrics.intelligenceDepth > 60) {
    enhancedScore += 10;
  } else if (fabAnalysis.qualityMetrics.intelligenceDepth > 40) {
    enhancedScore += 5;
  }

  // TypeScript bonus
  if (tsContext) {
    enhancedScore += 5;
    if ((tsContext as any).strictMode) {
      enhancedScore += 5;
    }
  }

  // Cap at 99% (100% requires human verification)
  const fafScore = Math.min(Math.round(enhancedScore), 99);

  // Build confidence level
  let _confidence = 'LOW';
  if (fafScore >= 85) {_confidence = 'HIGH';}
  else if (fafScore >= 70) {_confidence = 'GOOD';}
  else if (fafScore >= 50) {_confidence = 'MODERATE';}

  // Build quality indicators
  const qualityIndicators = [];
  if (fabAnalysis.qualityMetrics.highestGrade === 'EXCEPTIONAL') {
    qualityIndicators.push('Exceptional project structure');
  }
  if (fabAnalysis.qualityMetrics.filesCovered > 10) {
    qualityIndicators.push('Comprehensive file coverage');
  }
  if (technicalFilled >= 10) {
    qualityIndicators.push('Rich technical context');
  }
  if (humanFilled >= 3) {
    qualityIndicators.push('Strong human context');
  }
  if ((tsContext as any)?.strictMode) {
    qualityIndicators.push('TypeScript strict mode');
  }

  // Extract the stack for display
  // HONEST SCORING: No fake defaults - 0% is a valid score!
  const _stack = {
    frontend: contextSlotsFilled['framework'] || (packageData.dependencies?.react ? 'React' : undefined),
    backend: contextSlotsFilled['backend'],
    database: contextSlotsFilled['database'],
    build: contextSlotsFilled['build_tool'],
    package_manager: contextSlotsFilled['package_manager'] || undefined,
    hosting: contextSlotsFilled['hosting'],
  };

  // Build the data structure for generateFafContent
  // HONEST SCORING: No fake defaults - 0% is a valid score!
  const fafData = {
    projectName: contextSlotsFilled['project_name'] || path.basename(projectRoot),
    version: contextSlotsFilled['version'] || undefined,
    projectGoal: contextSlotsFilled['project_goal'] || undefined,
    mainLanguage: contextSlotsFilled['main_language'] || undefined,
    framework: contextSlotsFilled['framework'] || undefined,
    cssFramework: contextSlotsFilled['css_framework'] || undefined,
    uiLibrary: contextSlotsFilled['ui_library'] || undefined,
    stateManagement: undefined,
    backend: contextSlotsFilled['backend'] || undefined,
    apiType: contextSlotsFilled['api_type'] || undefined,
    server: contextSlotsFilled['runtime'] || contextSlotsFilled['server'] || undefined,
    database: contextSlotsFilled['database'] || undefined,
    connection: undefined,
    hosting: contextSlotsFilled['hosting'] || undefined,
    buildTool: contextSlotsFilled['build_tool'] || undefined,
    packageManager: contextSlotsFilled['package_manager'] || undefined,
    cicd: contextSlotsFilled['cicd'] || undefined,
    fafScore,
    slotBasedPercentage: Math.round(((technicalFilled + humanFilled) / 21) * 100),
    projectType,  // Pass project type for compiler slot-filling patterns
    // Human Context (Project Details)
    targetUser: contextSlotsFilled['who'],
    coreProblem: contextSlotsFilled['what'],
    missionPurpose: contextSlotsFilled['why'],
    deploymentMarket: contextSlotsFilled['where'],
    timeline: contextSlotsFilled['when'],
    approach: contextSlotsFilled['how'],
    // Quality indicators
    qualityIndicators,
    fabFormatsIntelligence: {
      filesAnalyzed: fabAnalysis.results.length,
      totalIntelligence: fabAnalysis.totalBonus,
      highestGrade: fabAnalysis.qualityMetrics.highestGrade,
      depth: fabAnalysis.qualityMetrics.intelligenceDepth
    },
    // Claude Code detection results
    claudeCode: claudeCodeResult
  };

  // Generate YAML content
  const content = generateFafContent(fafData);

  return content;
}

/**
 * Extract context from README.md
 */
function extractReadmeContext(content: string): any {
  const context: any = {};

  // Extract project name from title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    context.projectName = titleMatch[1].trim();
  }

  // Extract description from first paragraph or description section
  const descMatch = content.match(/^#+\s+(?:description|about|overview|introduction)\s*\n+(.+?)(?:\n#|\n\n#|$)/ims);
  if (descMatch) {
    context.description = descMatch[1].trim().substring(0, 200);
  } else {
    // Try to get first paragraph after title
    const firstParaMatch = content.match(/^#\s+.+\n+(.+?)(?:\n#|\n\n#|$)/ms);
    if (firstParaMatch) {
      context.description = firstParaMatch[1].trim().substring(0, 200);
    }
  }

  // Look for target users
  if (content.match(/##\s+(?:for\s+)?(?:developers|engineers|teams)/i)) {
    context.targetUser = 'Developers';
  } else if (content.match(/##\s+(?:for\s+)?(?:users|customers|clients)/i)) {
    context.targetUser = 'End users';
  }

  return context;
}