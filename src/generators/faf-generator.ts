/**
 * 🏗️ .faf Generator
 * Auto-generate .faf files from project structure and package.json
 */

import { promises as fs } from "fs";
import * as YAML from "yaml";
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

  // Read TypeScript configuration if available
  let typescriptData: TypeScriptContext | null = null;
  const tsconfigPath = await findTsConfig(projectRoot);

  if (tsconfigPath) {
    try {
      typescriptData = await analyzeTsConfig(tsconfigPath);
    } catch {
      // Continue without tsconfig.json data
    }
  }

  // Generate project data from analysis
  const projectData = generateProjectData(
    packageData,
    pythonData,
    typescriptData,
    projectType || "latest-idea",
  );

  // Generate AI-optimized .faf content using v2.5.0 format
  return generateFafContent(projectData);
}

function generateProjectData(
  packageData: any,
  pythonData: any,
  typescriptData: TypeScriptContext | null,
  projectType: string,
): any {
  const now = new Date().toISOString();

  // Determine project name and version from appropriate source
  let projectName = "untitled-project";
  let version = "1.0.0";
  let description = "Project development and deployment";

  if (pythonData.name) {
    projectName = pythonData.name;
    version = pythonData.version || "0.1.0";
    description = pythonData.description || description;
  } else if (packageData.name) {
    projectName = packageData.name;
    version = packageData.version || "1.0.0";
    description = packageData.description || description;
  }

  // Detect stack from appropriate dependency source
  const deps = { ...packageData.dependencies, ...packageData.devDependencies };
  const stack = analyzeStackFromDependencies(
    deps,
    pythonData,
    projectType,
  );

  // Calculate slot-based scoring
  const slots = [
    projectName !== "untitled-project",
    description !== "Project development and deployment",
    detectMainLanguage(deps, projectType) !== "Unknown",
    stack.frontend,
    stack.backend,
    stack.build,
    // Add more slots as needed
  ];
  
  const filledSlots = slots.filter(Boolean).length;
  const totalSlots = 21; // Base slots for scoring
  const slotBasedPercentage = Math.round((filledSlots / totalSlots) * 100);
  const fafScore = slotBasedPercentage; // Honest percentage only - no artificial bonuses

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
    hosting: "None",
    buildTool: stack.build || "None",
    cicd: "None",
    fafScore: fafScore,
    slotBasedPercentage: slotBasedPercentage,
    // Human Context (Project Details) - empty for CLI auto-generation
    targetUser: undefined,
    coreProblem: undefined,
    missionPurpose: undefined,
    deploymentMarket: undefined,
    timeline: undefined,
    approach: undefined,
    // Additional Context Arrays
    additionalWho: [],
    additionalWhat: [],
    additionalWhy: [],
    additionalWhere: [],
    additionalWhen: [],
    additionalHow: [],
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
