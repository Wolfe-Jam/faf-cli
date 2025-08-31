/**
 * 🏗️ .faf Generator
 * Auto-generate .faf files from project structure and package.json
 */

import { promises as fs } from "fs";
import * as YAML from "yaml";
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

  // 🔍 FORENSIC ANALYSIS - Multi-file intelligence gathering
  let typescriptData: TypeScriptContext | null = null;
  let configData: any = {};
  let sourceCodeData: any = {};

  // Analyze TypeScript configuration (compiler settings, strictness)
  const tsconfigPath = await findTsConfig(projectRoot);
  if (tsconfigPath) {
    try {
      typescriptData = await analyzeTsConfig(tsconfigPath);
    } catch {
      // Continue without tsconfig.json data
    }
  }

  // Analyze build configurations (Vite, Svelte, Webpack)
  try {
    configData = await analyzeConfigFiles(projectRoot);
  } catch {
    // Continue without config data
  }

  // Analyze source code for actual usage patterns
  try {
    sourceCodeData = await analyzeSourceCode(projectRoot, packageData);
  } catch {
    // Continue without source analysis
  }

  // Generate project data from FORENSIC ANALYSIS
  const projectData = generateProjectData(
    packageData,
    pythonData,
    typescriptData,
    readmeData,
    configData,
    sourceCodeData,
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
  projectType: string,
): any {
  const now = new Date().toISOString();

  // Determine project name and version from appropriate source
  let projectName = "untitled-project";
  let version = "1.0.0";
  let description = "Project development and deployment";
  let targetUser: string | undefined;
  let coreProblem: string | undefined;
  let missionPurpose: string | undefined;

  // Extract rich context from README first (best human context)
  if (readmeData.title) projectName = readmeData.title;
  if (readmeData.description) description = readmeData.description;
  if (readmeData.targetUser) targetUser = readmeData.targetUser;
  if (readmeData.coreProblem) coreProblem = readmeData.coreProblem;
  if (readmeData.purpose) missionPurpose = readmeData.purpose;

  // Then enhance with package.json metadata
  if (pythonData.name) {
    projectName = pythonData.name;
    version = pythonData.version || "0.1.0";
    if (!readmeData.description) description = pythonData.description || description;
  } else if (packageData.name) {
    // Clean package name for YAML compatibility
    projectName = packageData.name.replace(/^@/, '').replace('/', '-');
    version = packageData.version || "1.0.0";
    if (!readmeData.description) {
      // Clean description too to avoid YAML issues
      const cleanDesc = packageData.description || description;
      description = cleanDesc.replace(/^@[\w-]+\//, ''); // Remove @scope/ from start
    }
  }

  // Detect stack from appropriate dependency source
  const deps = { ...packageData.dependencies, ...packageData.devDependencies };
  const stack = analyzeStackFromDependencies(
    deps,
    pythonData,
    projectType,
  );

  // 🔍 FORENSIC SCORING - Multi-source intelligence scoring
  const slots = [
    // Basic Project Info (5 slots)
    projectName !== "untitled-project",
    description !== "Project development and deployment", 
    detectMainLanguage(deps, projectType) !== "Unknown",
    stack.frontend,
    stack.backend,
    
    // README Intelligence (6 slots)
    !!targetUser, // README extracted
    !!coreProblem, // README extracted  
    !!missionPurpose, // README extracted
    !!(readmeData.features && readmeData.features.length > 0), // Feature list
    !!(readmeData.quickStart), // Getting started info
    !!(readmeData.installation), // Installation instructions
    
    // Package.json Analysis (3 slots)
    !!(packageData.scripts && Object.keys(packageData.scripts).length > 3), // Rich scripts
    !!(packageData.dependencies && Object.keys(packageData.dependencies).length > 5), // Real project
    !!(packageData.repository), // Repository info
    
    // Config File Analysis (3 slots)
    !!configData.strictMode, // TypeScript strict mode
    !!configData.buildTool, // Build tool configured
    !!configData.deployment, // Deployment configured
    
    // Source Code Analysis (4 slots)
    !!(sourceCodeData.frameworkFeatures && sourceCodeData.frameworkFeatures.length > 0), // Modern framework features
    !!(sourceCodeData.integrations && sourceCodeData.integrations.length > 0), // Service integrations
    !!(configData.qualityIndicators && configData.qualityIndicators.length > 0), // Quality indicators
    !!(configData.performanceOptimizations && configData.performanceOptimizations.length > 0), // Performance focus
  ];
  
  const filledSlots = slots.filter(Boolean).length;
  const totalSlots = 21; // Base slots for scoring
  const slotBasedPercentage = Math.round((filledSlots / totalSlots) * 100);
  const fafScore = slotBasedPercentage; // Honest percentage - now with intelligent extraction

  return {
    projectName: projectName,
    projectGoal: description,
    mainLanguage: detectMainLanguage(deps, projectType),
    framework: stack.frontend || "None",
    cssFramework: stack.css_framework || "None",
    uiLibrary: stack.ui_library || "None",
    stateManagement: stack.state_management || "None",
    backend: stack.backend || "None",
    server: stack.web_server || "None",
    apiType: "REST API",
    database: "None",
    connection: "None",
    hosting: configData.deployment || "None", // 🔍 FORENSIC: From config analysis
    buildTool: configData.buildTool || stack.build || "None", // 🔍 FORENSIC: From config analysis
    cicd: "None",
    fafScore: fafScore,
    slotBasedPercentage: slotBasedPercentage,
    
    // Human Context (Project Details) - extracted from README
    targetUser: targetUser,
    coreProblem: coreProblem,
    missionPurpose: missionPurpose,
    deploymentMarket: readmeData.deployment,
    timeline: readmeData.timeline,
    approach: readmeData.approach,
    
    // 🔍 FORENSIC ANALYSIS DATA - Multi-source intelligence
    forensicData: {
      configAnalysis: configData,
      sourceAnalysis: sourceCodeData,
      qualityIndicators: [
        ...configData.qualityIndicators || [],
        ...sourceCodeData.qualityIndicators || []
      ],
      frameworkFeatures: sourceCodeData.frameworkFeatures || [],
      integrations: sourceCodeData.integrations || [],
      performanceOptimizations: configData.performanceOptimizations || []
    },
    
    // Additional Context Arrays  
    additionalWho: [],
    additionalWhat: sourceCodeData.frameworkFeatures || [],
    additionalWhy: configData.qualityIndicators || [],
    additionalWhere: [configData.deployment].filter(Boolean),
    additionalWhen: [],
    additionalHow: configData.performanceOptimizations || [],
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
  if (projectType.startsWith("python-")) {
    // Package manager detection
    if (pythonData.name) {
      stack.package_manager = "poetry";
    } else if (pythonData.dependencies) {
      stack.package_manager = "pip";
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
): string {
  if (projectType.startsWith("python-")) {return "Python";}

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

  if (projectType.includes("js") || Object.keys(deps).length > 0)
    {return "JavaScript";}
  return "Unknown";
}


function generateAutoTags(packageData: any, projectType: string): string[] {
  const tags = new Set<string>();

  // From project name
  if (packageData.name) {
    const cleanName = packageData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 30);
    if (cleanName) {tags.add(cleanName);}
  }

  // From project type
  if (projectType !== "latest-idea") {
    tags.add(projectType.toLowerCase().replace(/\s+/g, "-"));
  }

  // From description keywords
  if (packageData.description) {
    const keywords = packageData.description
      .toLowerCase()
      .match(
        /\b(api|library|framework|component|dashboard|tool|app|cli|server|client|web|mobile)\b/gi,
      );
    if (keywords) {
      keywords
        .slice(0, 3)
        .forEach((keyword: string) => tags.add(keyword.toLowerCase()));
    }
  }

  return Array.from(tags).slice(0, 10);
}

function generateSmartDefaults(projectType: string): string[] {
  const year = new Date().getFullYear().toString();
  const defaults = [".faf", "ai-ready", year];

  // Project type specific
  if (
    projectType.includes("web") ||
    projectType === "svelte" ||
    projectType === "react"
  ) {
    defaults.push("web-app");
  } else if (
    projectType.includes("api") ||
    projectType.includes("node") ||
    projectType.includes("fastapi")
  ) {
    defaults.push("backend-api");
  } else if (projectType.startsWith("python-")) {
    defaults.push("python-app");
  } else {
    defaults.push("software");
  }

  defaults.push("open-source"); // Default assumption

  return defaults;
}

/**
 * Extract context from README.md content - THE KEY TO HIGH SCORES
 */
function extractReadmeContext(content: string): any {
  const context: any = {};
  
  // Extract title (first # heading)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    context.title = titleMatch[1].replace(/[^a-zA-Z0-9\s\-\.]/g, '').trim();
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
      if (line.trim().startsWith('[![')) continue;
      // Skip quotes/taglines (starts with >)
      if (line.trim().startsWith('>')) continue;
      // Skip empty lines
      if (line.trim() === '') continue;
      // Skip lines that are just markdown formatting
      if (/^[\*\-\_\#]+$/.test(line.trim())) continue;
      
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
        if (line.trim() === '') continue;
        if (line.trim().startsWith('[![')) continue;
        if (line.trim().startsWith('>')) continue;
        if (line.trim().startsWith('```')) continue; // Skip code blocks
        if (line.trim().startsWith('//') || line.trim().startsWith('#')) continue; // Skip comments
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
        if (line.trim() === '') continue;
        if (line.trim().startsWith('[![')) continue;
        if (line.trim().startsWith('>')) continue;
        if (line.trim().startsWith('```')) continue;
        // Skip lines that look like headings without #
        if (/^[A-Z\s]+$/.test(line.trim()) && line.trim().length < 30) continue;
        realDescription = line.trim();
        break;
      }
    }
  }
  
  if (realDescription) {
    context.description = realDescription
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.+?)\*/g, '$1')     // Remove markdown italic  
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
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

    // Check for dependencies section
    if (content.includes("[tool.poetry.dependencies]")) {
      data.dependencies = true;
    }

    return data;
  } catch {
    return {};
  }
}

/**
 * 🔍 FORENSIC ANALYSIS: Config Files Detective Work
 * Analyzes build configurations to understand project architecture
 */
async function analyzeConfigFiles(projectRoot: string): Promise<any> {
  const configData: any = {
    buildTool: null,
    deployment: null,
    strictMode: false,
    qualityIndicators: [],
    performanceOptimizations: []
  };

  // Analyze tsconfig.json for strictness and quality
  try {
    const tsconfigPath = path.join(projectRoot, "tsconfig.json");
    const tsconfigContent = await fs.readFile(tsconfigPath, "utf-8");
    
    // Check for strictness indicators
    if (tsconfigContent.includes('"strict": true')) {
      configData.strictMode = true;
      configData.qualityIndicators.push("Strict TypeScript");
    }
    
    // Look for quality comments
    if (tsconfigContent.includes("ULTRA STRICT") || tsconfigContent.includes("STRICT")) {
      configData.qualityIndicators.push("Ultra-strict configuration");
    }
    
    // Check ES target
    const targetMatch = tsconfigContent.match(/"target":\s*"([^"]+)"/);
    if (targetMatch) {
      configData.esTarget = targetMatch[1];
    }
  } catch {}

  // Analyze Vite configuration
  try {
    const viteConfigPath = path.join(projectRoot, "vite.config.js");
    let viteContent = "";
    try {
      viteContent = await fs.readFile(viteConfigPath, "utf-8");
    } catch {
      const viteConfigTsPath = path.join(projectRoot, "vite.config.ts");
      viteContent = await fs.readFile(viteConfigTsPath, "utf-8");
    }
    
    configData.buildTool = "Vite";
    
    // Check for performance optimizations
    if (viteContent.includes("terser") || viteContent.includes("minify")) {
      configData.performanceOptimizations.push("Code minification");
    }
  } catch {}

  // Analyze Svelte configuration
  try {
    const svelteConfigPath = path.join(projectRoot, "svelte.config.js");
    const svelteContent = await fs.readFile(svelteConfigPath, "utf-8");
    
    // Check for deployment adapter
    if (svelteContent.includes("adapter-vercel")) {
      configData.deployment = "Vercel Edge Runtime";
      if (svelteContent.includes("F1") || svelteContent.includes("MAXIMUM PERFORMANCE")) {
        configData.performanceOptimizations.push("F1-inspired optimization");
      }
    } else if (svelteContent.includes("adapter-netlify")) {
      configData.deployment = "Netlify";
    } else if (svelteContent.includes("adapter-node")) {
      configData.deployment = "Node.js";
    }
  } catch {}

  return configData;
}

/**
 * 🔍 FORENSIC ANALYSIS: Source Code Detective Work  
 * Scans actual source code for usage patterns and framework features
 */
async function analyzeSourceCode(projectRoot: string, packageData: any): Promise<any> {
  const sourceData: any = {
    frameworkFeatures: [],
    integrations: [],
    architecturePatterns: [],
    qualityIndicators: []
  };

  // Analyze Svelte 5 Runes usage
  if (packageData.dependencies?.svelte || packageData.devDependencies?.svelte) {
    try {
      const srcPath = path.join(projectRoot, "src");
      
      // Check for Svelte 5 Runes in .svelte files
      const svelteFiles = await findSvelteFiles(srcPath);
      for (const filePath of svelteFiles.slice(0, 5)) { // Limit to first 5 files
        try {
          const content = await fs.readFile(filePath, "utf-8");
          
          // Check for Runes usage
          if (content.includes("$state") || content.includes("$derived") || content.includes("$effect")) {
            sourceData.frameworkFeatures.push("Svelte 5 Runes");
            break;
          }
        } catch {}
      }
    } catch {}
  }

  // Analyze React patterns
  if (packageData.dependencies?.react || packageData.devDependencies?.react) {
    try {
      const srcPath = path.join(projectRoot, "src");
      const reactFiles = await findReactFiles(srcPath);
      
      for (const filePath of reactFiles.slice(0, 3)) {
        try {
          const content = await fs.readFile(filePath, "utf-8");
          
          // Check for hooks usage
          if (content.includes("useState") || content.includes("useEffect")) {
            sourceData.frameworkFeatures.push("React Hooks");
          }
          
          // Check for TypeScript React
          if (content.includes("React.FC") || content.includes("JSX.Element")) {
            sourceData.frameworkFeatures.push("TypeScript React");
          }
        } catch {}
      }
    } catch {}
  }

  // Analyze authentication integrations
  if (packageData.dependencies?.["svelte-clerk"] || packageData.dependencies?.clerk) {
    sourceData.integrations.push("Clerk Authentication (10k free MAUs)");
  }
  
  if (packageData.dependencies?.["@supabase/supabase-js"]) {
    sourceData.integrations.push("Supabase Database");
  }
  
  if (packageData.dependencies?.stripe) {
    sourceData.integrations.push("Stripe Payments");
  }

  // Analyze quality indicators from comments
  try {
    const srcPath = path.join(projectRoot, "src");
    const allFiles = await findSourceFiles(srcPath);
    
    for (const filePath of allFiles.slice(0, 10)) { // Sample first 10 files
      try {
        const content = await fs.readFile(filePath, "utf-8");
        
        // Look for quality indicators in comments
        if (content.includes("F1") && (content.includes("performance") || content.includes("quality"))) {
          sourceData.qualityIndicators.push("F1-inspired development");
        }
        
        if (content.includes("STRICT") || content.includes("strict")) {
          sourceData.qualityIndicators.push("Strict coding standards");
        }
      } catch {}
    }
  } catch {}

  return sourceData;
}

/**
 * Helper functions for file discovery
 */
async function findSvelteFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        const subFiles = await findSvelteFiles(fullPath);
        files.push(...subFiles);
      } else if (item.name.endsWith('.svelte')) {
        files.push(fullPath);
      }
    }
  } catch {}
  
  return files;
}

async function findReactFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        const subFiles = await findReactFiles(fullPath);
        files.push(...subFiles);
      } else if (item.name.endsWith('.tsx') || item.name.endsWith('.jsx')) {
        files.push(fullPath);
      }
    }
  } catch {}
  
  return files;
}

async function findSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        const subFiles = await findSourceFiles(fullPath);
        files.push(...subFiles.slice(0, 5)); // Limit depth
      } else if (item.name.match(/\.(js|ts|jsx|tsx|svelte|vue)$/)) {
        files.push(fullPath);
      }
    }
  } catch {}
  
  return files;
}
