/**
 * 🏗️ .faf Generator
 * Auto-generate .faf files from project structure and package.json
 */

import { promises as fs } from "fs";
// YAML import removed - unused
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
import { FabFormatsEngine, FabFormatsAnalysis } from "../utils/fab-formats";

export interface GenerateOptions {
  projectType?: string;
  outputPath: string;
  projectRoot: string;
}

export async function generateFafFromProject(
  options: GenerateOptions,
): Promise<string> {
  const { projectType, projectRoot } = options;

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

  // Read Python project files if available
  let pythonData: any = {};
  const pyprojectPath = await findPyprojectToml(projectRoot);
  const requirementsPath = await findRequirementsTxt(projectRoot);

  if (pyprojectPath) {
    try {
      const content = await fs.readFile(pyprojectPath, "utf-8");
      pythonData = await parsePyprojectToml(content);
    } catch {
      // Continue without pyproject.toml data
    }
  }

  if (requirementsPath && !pyprojectPath) {
    try {
      const content = await fs.readFile(requirementsPath, "utf-8");
      pythonData = {
        dependencies: content.split("\n").filter((line) => line.trim()),
      };
    } catch {
      // Continue without requirements.txt data
    }
  }

  // 🎯 FAB-FORMATS DISCOVERY - Activate the 200+ format knowledge base
  const fabEngine = new FabFormatsEngine();
  let fabAnalysis: FabFormatsAnalysis;
  try {
    fabAnalysis = await fabEngine.discoverFormats(projectRoot);
  } catch {
    // Fallback to empty analysis if discovery fails
    fabAnalysis = {
      discoveredFormats: [],
      totalIntelligenceScore: 0,
      confirmedFormats: [],
      frameworkConfidence: {},
      slotFillRecommendations: {}
    };
  }

  // 🔍 ENHANCED ANALYSIS - TypeScript + fab-formats intelligence
  let typescriptData: TypeScriptContext | null = null;

  // Analyze TypeScript configuration (compiler settings, strictness)
  const tsconfigPath = await findTsConfig(projectRoot);
  if (tsconfigPath) {
    try {
      typescriptData = await analyzeTsConfig(tsconfigPath);
    } catch {
      // Continue without tsconfig.json data
    }
  }

  // Extract quality indicators from fab-formats analysis
  const configData = extractConfigDataFromFab(fabAnalysis);
  const sourceCodeData = extractSourceDataFromFab(fabAnalysis);

  // Generate project data from FORENSIC ANALYSIS + FAB-FORMATS DISCOVERY
  const projectData = generateProjectData(
    packageData,
    pythonData,
    typescriptData,
    readmeData,
    configData,
    sourceCodeData,
    fabAnalysis,
    projectType || "latest-idea",
  );

  // Generate AI-optimized .faf content using v2.5.0 format
  return generateFafContent(projectData);
}

function generateProjectData(
  packageData: any,
  pythonData: any,
  typescriptData: TypeScriptContext | null,
  readmeData: any,
  configData: any,
  sourceCodeData: any,
  fabAnalysis: FabFormatsAnalysis,
  projectType: string,
): any {
  // Determine project name and version from appropriate source
  let projectName = "untitled-project";
  let description = "Project development and deployment";
  let targetUser: string | undefined;
  let coreProblem: string | undefined;
  let missionPurpose: string | undefined;

  // Extract rich context from README first (best human context)
  if (readmeData.title) {projectName = readmeData.title;}
  if (readmeData.description) {description = readmeData.description;}
  if (readmeData.targetUser) {targetUser = readmeData.targetUser;}
  if (readmeData.coreProblem) {coreProblem = readmeData.coreProblem;}
  if (readmeData.purpose) {missionPurpose = readmeData.purpose;}

  // Then enhance with package.json metadata
  if (pythonData.name) {
    projectName = pythonData.name;
    if (!readmeData.description) {description = pythonData.description || description;}
  } else if (packageData.name) {
    // Clean package name for YAML compatibility
    projectName = packageData.name.replace(/^@/, '').replace('/', '-');
    if (!readmeData.description) {
      // Clean description too to avoid YAML issues
      const cleanDesc = packageData.description || description;
      description = cleanDesc.replace(/^@[\w-]+\//, ''); // Remove @scope/ from start
    }
  }

  // Detect stack from appropriate dependency source + FAB-FORMATS INTELLIGENCE
  const deps = { ...packageData.dependencies, ...packageData.devDependencies };
  const stack = analyzeStackFromDependencies(
    deps,
    pythonData,
    projectType,
  );
  
  // 🎯 ENHANCE WITH FAB-FORMATS INTELLIGENCE
  const topFramework = fabAnalysis.confirmedFormats.length > 0 
    ? Object.entries(fabAnalysis.frameworkConfidence)
        .reduce((max, current) => current[1] > max[1] ? current : max, ['', 0])
    : null;
  
  // Apply fab-formats slot recommendations
  const fabSlots = fabAnalysis.slotFillRecommendations;
  if (fabSlots.frontend && !stack.frontend) {stack.frontend = fabSlots.frontend;}
  if (fabSlots.backend && !stack.backend) {stack.backend = fabSlots.backend;}
  if (fabSlots.build && !stack.build) {stack.build = fabSlots.build;}
  if (fabSlots.hosting && !configData.deployment) {configData.deployment = fabSlots.hosting;}
  if (fabSlots.database && !stack.database) {stack.database = fabSlots.database;}
  if (fabSlots.css_framework && !stack.css_framework) {stack.css_framework = fabSlots.css_framework;}
  if (fabSlots.ui_library && !stack.ui_library) {stack.ui_library = fabSlots.ui_library;}
  if (fabSlots.state_management && !stack.state_management) {stack.state_management = fabSlots.state_management;}

  // 🎯 ENHANCED SCORING - Multi-source + FAB-FORMATS intelligence (Universal: JS/TS + Python)
  // Base intelligence score from fab-formats discovery
  const fabIntelligenceBonus = Math.min(fabAnalysis.totalIntelligenceScore / 10, 5); // Max 5 bonus slots
  
  const slots = [
    // Basic Project Info (5 slots)
    projectName !== "untitled-project",
    description !== "Project development and deployment", 
    detectMainLanguage(deps, projectType, fabAnalysis) !== "Unknown",
    stack.frontend || stack.backend, // Any framework detected
    stack.package_manager !== "npm" || Object.keys(deps).length > 0, // Dependencies managed
    
    // README Intelligence (6 slots)
    !!targetUser, // README extracted
    !!coreProblem, // README extracted  
    !!missionPurpose, // README extracted
    !!(readmeData.features && readmeData.features.length > 0), // Feature list
    !!(readmeData.quickStart), // Getting started info
    !!(readmeData.installation), // Installation instructions
    
    // Dependency Analysis (3 slots) - Universal for JS/Python
    !!(
      (packageData.scripts && Object.keys(packageData.scripts).length > 3) || // JS: Rich scripts
      (pythonData.dependencies && pythonData.dependencies.length > 5) || // Python: Rich dependencies
      (pythonData.name && pythonData.version) // Python: Project metadata
    ),
    !!(
      (packageData.dependencies && Object.keys(packageData.dependencies).length > 5) || // JS: Real project
      (pythonData.dependencies && pythonData.dependencies.length > 0) || // Python: Has requirements
      (pythonData.python_version) // Python: Version specified
    ),
    !!(packageData.repository || pythonData.author || pythonData.license), // Repository/Author info
    
    // Config File Analysis (3 slots) - Universal + FAB-FORMATS Enhanced
    !!configData.strictMode || !!(configData.qualityIndicators && configData.qualityIndicators.length > 0) || fabAnalysis.confirmedFormats.length > 5, // Quality config + format diversity
    !!configData.buildTool || !!stack.build || !!stack.runtime || fabSlots.build, // Build/Runtime configured + fab detection
    !!configData.deployment || !!stack.web_server || fabSlots.hosting, // Deployment configured + fab detection
    
    // Source Code Analysis (4 slots) - Universal + FAB-FORMATS Enhanced
    !!(sourceCodeData.frameworkFeatures && sourceCodeData.frameworkFeatures.length > 0) || fabAnalysis.confirmedFormats.length > 3, // Modern framework features + format detection
    !!(sourceCodeData.integrations && sourceCodeData.integrations.length > 0) || topFramework, // Service integrations + framework confidence
    !!(configData.qualityIndicators && configData.qualityIndicators.length > 0) || fabAnalysis.totalIntelligenceScore > 50, // Quality indicators + high fab score
    !!(configData.performanceOptimizations && configData.performanceOptimizations.length > 0) || fabSlots.cicd, // Performance focus + CI/CD detection
    
    // 🎯 FAB-FORMATS BONUS SLOTS - Intelligent format discovery bonus
    ...Array(Math.floor(fabIntelligenceBonus)).fill(true), // Add bonus slots based on format intelligence
  ];
  
  const filledSlots = slots.filter(Boolean).length;
  const totalSlots = 21; // Base slots for scoring
  const slotBasedPercentage = Math.round((filledSlots / totalSlots) * 100);
  
  // 🎯 FAB-FORMATS ENHANCEMENT - Apply intelligent scoring boost
  let enhancedScore = slotBasedPercentage;
  if (fabAnalysis.totalIntelligenceScore > 0) {
    // Add percentage boost based on format discovery intelligence
    const fabBoost = Math.min(fabAnalysis.totalIntelligenceScore / 2, 20); // Max 20% boost
    enhancedScore = Math.min(slotBasedPercentage + fabBoost, 100);
  }
  
  const fafScore = Math.round(enhancedScore); // Enhanced percentage with fab-formats intelligence

  return {
    projectName: projectName,
    projectGoal: description,
    mainLanguage: detectMainLanguage(deps, projectType, fabAnalysis),
    framework: stack.frontend || "None",
    cssFramework: stack.css_framework || "None",
    uiLibrary: stack.ui_library || "None",
    stateManagement: stack.state_management || "None",
    backend: stack.backend || "None",
    server: stack.web_server || "None",
    apiType: "REST API",
    database: stack.database || "None",
    connection: "None",
    hosting: configData.deployment || "None", // 🔍 FORENSIC: From config analysis
    buildTool: configData.buildTool || stack.build || "None", // 🔍 FORENSIC: From config analysis
    cicd: configData.cicdPipeline || "None",
    packageManager: stack.package_manager || "npm",
    fafScore: fafScore,
    slotBasedPercentage: slotBasedPercentage,
    
    // Human Context (Project Details) - extracted from README
    targetUser: targetUser,
    coreProblem: coreProblem,
    missionPurpose: missionPurpose,
    deploymentMarket: readmeData.deployment,
    timeline: readmeData.timeline,
    approach: readmeData.approach,
    
    // 🎯 FORENSIC ANALYSIS DATA - Multi-source + FAB-FORMATS intelligence
    forensicData: {
      configAnalysis: configData,
      sourceAnalysis: sourceCodeData,
      fabFormatsAnalysis: {
        discoveredFormats: fabAnalysis.discoveredFormats.length,
        confirmedFormats: fabAnalysis.confirmedFormats.length,
        totalIntelligenceScore: fabAnalysis.totalIntelligenceScore,
        topFramework: topFramework?.[0] || 'Unknown',
        frameworkConfidence: topFramework?.[1] || 0,
        slotEnhancements: Object.keys(fabSlots).length
      },
      qualityIndicators: [
        ...configData.qualityIndicators || [],
        ...sourceCodeData.qualityIndicators || [],
        ...(fabAnalysis.confirmedFormats.length > 5 ? ['High Format Diversity'] : []),
        ...(fabAnalysis.totalIntelligenceScore > 80 ? ['Ultra-High Format Intelligence'] : [])
      ],
      frameworkFeatures: [
        ...sourceCodeData.frameworkFeatures || [],
        ...(topFramework ? [`Detected: ${topFramework[0]} (${Math.round(topFramework[1])}% confidence)`] : [])
      ],
      integrations: sourceCodeData.integrations || [],
      performanceOptimizations: configData.performanceOptimizations || []
    },
    
    // Additional Context Arrays  
    additionalWho: [],
    additionalWhat: sourceCodeData.frameworkFeatures || [],
    additionalWhy: configData.qualityIndicators || [],
    additionalWhere: [configData.deployment].filter(Boolean),
    additionalWhen: [],
    additionalHow: [
      ...(configData.performanceOptimizations || []),
      ...(configData.environmentVariables > 0 ? [`Environment Configuration (${configData.environmentVariables} variables)`] : [])
    ],
    projectDetailsScore: 0,
    projectSuccessRate: 50
  };
}

function analyzeStackFromDependencies(
  deps: Record<string, string>,
  pythonData: any,
  projectType: string,
): any {
  const stack: any = {};

  // Python stack detection
  if (projectType.startsWith("python-") || pythonData.name || pythonData.dependencies) {
    // Package manager detection
    if (pythonData.name) {
      stack.package_manager = "poetry";
    } else if (pythonData.dependencies) {
      stack.package_manager = "pip";
    } else {
      stack.package_manager = "python"; // Default for Python projects
    }

    // Runtime detection
    if (pythonData.python_version) {
      stack.runtime = `Python ${pythonData.python_version}`;
    } else {
      stack.runtime = "Python";
    }

    // Framework detection from project type
    switch (projectType) {
      case "python-fastapi":
        stack.backend = "FastAPI";
        stack.web_server = "uvicorn";
        break;
      case "python-django":
        stack.backend = "Django";
        stack.web_server = "gunicorn";
        break;
      case "python-flask":
        stack.backend = "Flask";
        stack.web_server = "gunicorn";
        break;
      case "python-starlette":
        stack.backend = "Starlette";
        stack.web_server = "uvicorn";
        break;
    }

    return stack;
  }

  // TypeScript/JavaScript stack detection

  // Pure TypeScript project
  if (projectType === "typescript") {
    stack.runtime = "Node.js";
    stack.language = "TypeScript";
    stack.build = "TypeScript Compiler";
    stack.package_manager = "npm"; // Default for TypeScript projects

    return stack;
  }

  // JavaScript projects with potential TypeScript
  stack.package_manager = "npm";

  // Frontend Detection
  if (deps.svelte || deps["@sveltejs/kit"]) {
    stack.frontend = "Svelte 5";
    stack.build = "Vite";
  } else if (deps.react) {
    stack.frontend = "React";
    stack.build = deps.vite ? "Vite" : "Webpack";
  } else if (deps.vue) {
    stack.frontend = "Vue";
    stack.build = "Vite";
  } else if (deps.angular) {
    stack.frontend = "Angular";
    stack.build = "Angular CLI";
  }

  // CSS Framework Detection
  if (deps.tailwindcss) {stack.css_framework = "Tailwind CSS";}
  else if (deps.bootstrap) {stack.css_framework = "Bootstrap";}
  else if (deps["@emotion/react"]) {stack.css_framework = "Emotion";}
  else if (deps["styled-components"]) {stack.css_framework = "Styled Components";}
  else if (deps.bulma) {stack.css_framework = "Bulma";}
  else if (deps.foundation) {stack.css_framework = "Foundation";}

  // UI Library Detection
  if (deps["@mui/material"]) {stack.ui_library = "Material-UI (MUI)";}
  else if (deps.antd) {stack.ui_library = "Ant Design";}
  else if (deps["@chakra-ui/react"]) {stack.ui_library = "Chakra UI";}
  else if (deps["@mantine/core"]) {stack.ui_library = "Mantine";}
  else if (deps.vuetify) {stack.ui_library = "Vuetify";}
  else if (deps.quasar) {stack.ui_library = "Quasar";}

  // State Management Detection
  if (deps.redux || deps["@reduxjs/toolkit"]) {stack.state_management = "Redux Toolkit";}
  else if (deps.zustand) {stack.state_management = "Zustand";}
  else if (deps.jotai) {stack.state_management = "Jotai";}
  else if (deps.vuex) {stack.state_management = "Vuex";}
  else if (deps.pinia) {stack.state_management = "Pinia";}
  else if (deps.mobx) {stack.state_management = "MobX";}

  // Backend Detection
  if (deps.express) {stack.backend = "Express.js";}
  else if (deps.fastify) {stack.backend = "Fastify";}
  else if (deps["@nestjs/core"]) {stack.backend = "NestJS";}
  else if (projectType === "node-api") {stack.backend = "Node.js";}

  // Runtime Detection
  if (deps["@types/node"] || projectType.includes("node")) {
    stack.runtime = "Node.js";
  }
  if (deps["@types/bun"]) {stack.runtime = "Bun";}
  if (deps.deno) {stack.runtime = "Deno";}

  // Build Tool Detection
  if (deps.vite) {stack.build = "Vite";}
  else if (deps.webpack) {stack.build = "Webpack";}
  else if (deps.rollup) {stack.build = "Rollup";}
  else if (deps.esbuild) {stack.build = "esbuild";}

  return stack;
}

function detectMainLanguage(
  deps: Record<string, string>,
  projectType: string,
  fabAnalysis?: any
): string {
  // Python detection - enhanced with fab-formats intelligence
  if (projectType.startsWith("python-")) {return "Python";}
  
  // Use fab-formats to detect Python projects
  if (fabAnalysis) {
    const hasPythonFormats = fabAnalysis.confirmedFormats?.some((f: any) => 
      f.formatType === 'requirements.txt' || 
      f.formatType === '.py' || 
      f.formatType === 'pyproject.toml'
    );
    const hasPythonFrameworks = Object.keys(fabAnalysis.frameworkConfidence || {}).some((fw: string) => 
      fw.toLowerCase().includes('python') || 
      fw.toLowerCase().includes('fastapi') || 
      fw.toLowerCase().includes('django')
    );
    if (hasPythonFormats || hasPythonFrameworks) {
      return "Python";
    }
  }

  // TypeScript detection - enhanced for new project types
  if (
    projectType === "typescript" ||
    projectType.includes("-ts") ||
    deps.typescript ||
    deps["@types/node"] ||
    Object.keys(deps).some((dep) => dep.startsWith("@types/"))
  ) {
    return "TypeScript";
  }

  // JavaScript detection - only for JS projects with package.json
  if (projectType.includes("js") || (Object.keys(deps).length > 0 && deps.name))
    {return "JavaScript";}
  return "Unknown";
}


// Removed unused functions: generateAutoTags and generateSmartDefaults

/**
 * Extract context from README.md content - THE KEY TO HIGH SCORES
 */
function extractReadmeContext(content: string): any {
  const context: any = {};
  
  // Extract title (first # heading)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    context.title = titleMatch[1].replace(/[^a-zA-Z0-9\s\-.]/g, '').trim();
  }
  
  // If no proper title found, try to infer project purpose from sections
  if (!titleMatch && !context.title) {
    // Look for meaningful section titles that might indicate purpose
    const sectionMatch = content.match(/##\s+.*?(?:Sacred|Core|Heart|Main|Purpose|About).*?\n+([^\n#][^\n]*)/i);
    if (sectionMatch) {
      context.title = sectionMatch[1].trim().substring(0, 50);
    }
  }
  
  // Extract description (content after title, before next major section)  
  let realDescription = '';
  
  // Try title-based extraction first (normal READMEs)
  const descMatch = content.match(/^#\s+.+\n\n([\s\S]*?)(?=\n##|\n#|$)/m);
  if (descMatch) {
    // Split into lines and filter out badges, quotes, and empty lines
    const lines = descMatch[1].split('\n');
    
    for (const line of lines) {
      // Skip badges (starts with [![)
      if (line.trim().startsWith('[![')) {continue;}
      // Skip quotes/taglines (starts with >)
      if (line.trim().startsWith('>')) {continue;}
      // Skip empty lines
      if (line.trim() === '') {continue;}
      // Skip lines that are just markdown formatting
      if (/^[*\-_#]+$/.test(line.trim())) {continue;}
      
      // Found real content!
      realDescription = line.trim();
      break;
    }
  }
  
  // If no description found, look for content after meaningful ## sections
  if (!realDescription) {
    const altMatch = content.match(/##\s+.*?(?:What is|About|Description|Overview|Sacred|Core|Heart|Purpose).*?\n+([^\n#][\s\S]*?)(?=\n##|\n###|$)/i);
    if (altMatch) {
      const altLines = altMatch[1].split('\n');
      for (const line of altLines) {
        if (line.trim() === '') {continue;}
        if (line.trim().startsWith('[![')) {continue;}
        if (line.trim().startsWith('>')) {continue;}
        if (line.trim().startsWith('```')) {continue;} // Skip code blocks
        if (line.trim().startsWith('//') || line.trim().startsWith('#')) {continue;} // Skip comments
        realDescription = line.trim();
        break;
      }
    }
  }
  
  // If still no description, look for any meaningful content in the first few paragraphs
  if (!realDescription && !descMatch) {
    const anyContentMatch = content.match(/^([^\n#][\s\S]*?)(?=\n##|\n#|$)/m);
    if (anyContentMatch) {
      const contentLines = anyContentMatch[1].split('\n');
      for (const line of contentLines) {
        if (line.trim() === '') {continue;}
        if (line.trim().startsWith('[![')) {continue;}
        if (line.trim().startsWith('>')) {continue;}
        if (line.trim().startsWith('```')) {continue;}
        // Skip lines that look like headings without #
        if (/^[A-Z\s]+$/.test(line.trim()) && line.trim().length < 30) {continue;}
        realDescription = line.trim();
        break;
      }
    }
  }
  
  if (realDescription) {
    context.description = realDescription
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.+?)\*/g, '$1')     // Remove markdown italic  
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .substring(0, 200);
  }
  
  // Extract features (look for Features, Key Features, Core Features sections)
  const featuresMatch = content.match(/##?\s*(?:Key\s+)?(?:Core\s+)?Features[\s\S]*?\n([\s\S]*?)(?=\n##|\n#|$)/i);
  if (featuresMatch) {
    const features = featuresMatch[1].match(/[-*]\s+(.+)/g);
    if (features) {
      context.features = features.map(f => f.replace(/[-*]\s+/, '').trim()).slice(0, 5);
    }
  }
  
  // Extract tech stack (look for Tech Stack, Stack, Built With sections)
  const techMatch = content.match(/##?\s*(?:Tech\s+Stack|Stack|Built\s+With|Technology)[\s\S]*?\n([\s\S]*?)(?=\n##|\n#|$)/i);
  if (techMatch) {
    const stack = techMatch[1].match(/[-*]\s+(.+)/g);
    if (stack) {
      context.techStack = stack.map(s => s.replace(/[-*]\s+/, '').trim()).slice(0, 8);
    }
  }
  
  // Extract installation/setup info
  const installMatch = content.match(/##?\s*(?:Installation|Setup|Quick\s+Start|Getting\s+Started)[\s\S]*?\n([\s\S]*?)(?=\n##|\n#|$)/i);
  if (installMatch) {
    context.installation = true;
    context.quickStart = installMatch[1].includes('```') || installMatch[1].includes('npm') || installMatch[1].includes('pip');
  }
  
  // Extract architecture info
  const archMatch = content.match(/##?\s*(?:Architecture|Structure|Design)[\s\S]*?\n([\s\S]*?)(?=\n##|\n#|$)/i);
  if (archMatch) {
    context.architecture = true;
  }
  
  // Extract usage/examples
  const usageMatch = content.match(/##?\s*(?:Usage|Examples|API|How\s+to\s+Use)[\s\S]*?\n([\s\S]*?)(?=\n##|\n#|$)/i);
  if (usageMatch) {
    context.usage = true;
    context.examples = usageMatch[1].includes('```');
  }
  
  // Smart inference of target user and problem
  const content_lower = content.toLowerCase();
  
  // Target user inference
  if (content_lower.includes('developer') || content_lower.includes('engineers')) {
    context.targetUser = 'Developers and engineers';
  } else if (content_lower.includes('business') || content_lower.includes('enterprise')) {
    context.targetUser = 'Business and enterprise users';
  } else if (content_lower.includes('team') || content_lower.includes('collaboration')) {
    context.targetUser = 'Development teams';
  }
  
  // Core problem inference
  if (content_lower.includes('automat') || content_lower.includes('streamlin')) {
    context.coreProblem = 'Process automation and workflow optimization';
  } else if (content_lower.includes('manag') || content_lower.includes('organiz')) {
    context.coreProblem = 'Organization and management challenges';
  } else if (content_lower.includes('performance') || content_lower.includes('speed')) {
    context.coreProblem = 'Performance and efficiency improvements';
  }
  
  // Purpose inference from mission/vision language
  if (content_lower.includes('transform') || content_lower.includes('revolution')) {
    context.purpose = 'Transform and revolutionize existing processes';
  } else if (content_lower.includes('simplif') || content_lower.includes('easier')) {
    context.purpose = 'Simplify and improve user experience';
  } else if (content_lower.includes('connect') || content_lower.includes('integrat')) {
    context.purpose = 'Connect and integrate systems and workflows';
  }
  
  return context;
}

/**
 * Parse pyproject.toml content for Python project metadata
 */
async function parsePyprojectToml(content: string): Promise<any> {
  try {
    // Simple string-based parsing for key information
    const data: any = {};

    // Extract [tool.poetry] section data
    const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
    if (nameMatch) {data.name = nameMatch[1];}

    const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
    if (versionMatch) {data.version = versionMatch[1];}

    const descriptionMatch = content.match(/description\s*=\s*"([^"]+)"/);
    if (descriptionMatch) {data.description = descriptionMatch[1];}

    const authorMatch = content.match(/author\s*=\s*"([^"]+)"/);
    if (authorMatch) {data.author = authorMatch[1];}

    const licenseMatch = content.match(/license\s*=\s*"([^"]+)"/);
    if (licenseMatch) {data.license = licenseMatch[1];}

    // Extract Python version
    const pythonMatch = content.match(/python\s*=\s*"([^"]+)"/);
    if (pythonMatch) {
      const version = pythonMatch[1].replace(/[\^~><=]/g, "").trim();
      data.python_version = version;
    }

    // Extract dependencies from [tool.poetry.dependencies] section
    const depsSection = content.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?=\[|$)/);
    if (depsSection) {
      const depsContent = depsSection[1];
      // Match lines with dependency names (with possible indentation)
      const depMatches = depsContent.match(/^\s*[a-zA-Z0-9_-]+\s*=/gm);
      if (depMatches) {
        data.dependencies = depMatches.map(match => 
          match.replace(/^\s*/, '').replace(/\s*=.*$/, '').trim()
        ).filter(dep => dep !== 'python'); // Exclude Python itself, count real deps
      } else {
        data.dependencies = []; // No additional dependencies found
      }
    }

    return data;
  } catch {
    return {};
  }
}

/**
 * 🎯 Extract config data from fab-formats analysis (replaces analyzeConfigFiles)
 */
function extractConfigDataFromFab(fabAnalysis: FabFormatsAnalysis): any {
  const configData: any = {
    buildTool: null,
    deployment: null,
    strictMode: false,
    qualityIndicators: [],
    performanceOptimizations: [],
    environmentVariables: 0
  };

  // Extract build tools from fab-formats slot recommendations
  const slots = fabAnalysis.slotFillRecommendations;
  if (slots.build) {configData.buildTool = slots.build;}
  if (slots.hosting) {configData.deployment = slots.hosting;}
  if (slots.cicd) {configData.cicdPipeline = slots.cicd;}

  // Quality indicators based on format diversity and intelligence
  if (fabAnalysis.totalIntelligenceScore > 80) {
    configData.qualityIndicators.push("Ultra-High Format Intelligence");
  }
  if (fabAnalysis.confirmedFormats.length > 5) {
    configData.qualityIndicators.push("High Format Diversity");
  }
  
  // Check for specific quality formats
  const hasTypeScript = fabAnalysis.confirmedFormats.some(f => 
    f.formatType === 'tsconfig.json' || f.formatType === '.ts'
  );
  if (hasTypeScript) {
    configData.strictMode = true;
    configData.qualityIndicators.push("TypeScript Project");
  }

  // CI/CD detection from formats
  const hasCICD = fabAnalysis.confirmedFormats.some(f => 
    f.formatType.includes('.yml') || f.formatType.includes('actions')
  );
  if (hasCICD) {
    configData.qualityIndicators.push("CI/CD Pipeline Detected");
  }

  // Performance optimizations from confirmed formats
  const hasPerformanceFormats = fabAnalysis.confirmedFormats.some(f => 
    f.formatType.includes('vite') || f.formatType.includes('webpack')
  );
  if (hasPerformanceFormats) {
    configData.performanceOptimizations.push("Modern Build Tooling");
  }

  return configData;
}

/**
 * 🎯 Extract source data from fab-formats analysis (replaces analyzeSourceCode)
 */
function extractSourceDataFromFab(fabAnalysis: FabFormatsAnalysis): any {
  const sourceData: any = {
    frameworkFeatures: [],
    integrations: [],
    architecturePatterns: [],
    qualityIndicators: []
  };

  // Extract framework features from fab-formats intelligence
  const topFramework = Object.entries(fabAnalysis.frameworkConfidence)
    .reduce((max, current) => current[1] > max[1] ? current : max, ['', 0]);
  
  if (topFramework[0]) {
    sourceData.frameworkFeatures.push(`${topFramework[0]} (${Math.round(topFramework[1])}% confidence)`);
  }

  // Language-specific features from confirmed formats
  const hasTypeScript = fabAnalysis.confirmedFormats.some(f => f.formatType === '.ts');
  const hasSvelte = fabAnalysis.confirmedFormats.some(f => f.formatType === '.svelte');
  const hasPython = fabAnalysis.confirmedFormats.some(f => f.formatType === '.py');
  
  if (hasTypeScript) {
    sourceData.frameworkFeatures.push("TypeScript Source Files");
    sourceData.qualityIndicators.push("Type-Safe Development");
  }
  if (hasSvelte) {
    sourceData.frameworkFeatures.push("Svelte Components");
  }
  if (hasPython) {
    sourceData.frameworkFeatures.push("Python Scripts");
  }

  // Quality indicators from format intelligence score
  if (fabAnalysis.totalIntelligenceScore > 100) {
    sourceData.qualityIndicators.push("High-Quality Project Structure");
  }
  if (fabAnalysis.confirmedFormats.length > 8) {
    sourceData.qualityIndicators.push("Rich Development Environment");
  }

  // Extract integrations from slot recommendations
  const slots = fabAnalysis.slotFillRecommendations;
  if (slots.database) {
    sourceData.integrations.push(`${slots.database} Integration`);
  }
  if (slots.hosting) {
    sourceData.integrations.push(`${slots.hosting} Deployment`);
  }

  return sourceData;
}

