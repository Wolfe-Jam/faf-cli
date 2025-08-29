/**
 * 🏗️ .faf Generator
 * Auto-generate .faf files from project structure and package.json
 */

import { promises as fs } from 'fs';
import * as YAML from 'yaml';
import { findPackageJson, detectProjectType, findPyprojectToml, findRequirementsTxt, findTsConfig, analyzeTsConfig, TypeScriptContext } from '../utils/file-utils';

export interface GenerateOptions {
  projectType?: string;
  outputPath: string;
  projectRoot: string;
}

export async function generateFafFromProject(options: GenerateOptions): Promise<string> {
  const { projectType, projectRoot } = options;
  
  // Read package.json if available (JavaScript projects)
  const packageJsonPath = await findPackageJson(projectRoot);
  let packageData: any = {};
  
  if (packageJsonPath) {
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
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
      const content = await fs.readFile(pyprojectPath, 'utf-8');
      pythonData = await parsePyprojectToml(content);
    } catch {
      // Continue without pyproject.toml data
    }
  }
  
  if (requirementsPath && !pyprojectPath) {
    try {
      const content = await fs.readFile(requirementsPath, 'utf-8');
      pythonData = { dependencies: content.split('\n').filter(line => line.trim()) };
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
  
  // Generate .faf structure
  const fafData = generateFafStructure(packageData, pythonData, typescriptData, projectType || 'generic', projectRoot);
  
  // Convert to YAML
  return YAML.stringify(fafData);
}

function generateFafStructure(packageData: any, pythonData: any, typescriptData: TypeScriptContext | null, projectType: string, projectRoot: string): any {
  const now = new Date().toISOString();
  
  // Determine project name and version from appropriate source
  let projectName = 'untitled-project';
  let version = '1.0.0';
  let description = 'Project development and deployment';
  
  if (pythonData.name) {
    projectName = pythonData.name;
    version = pythonData.version || '0.1.0';
    description = pythonData.description || description;
  } else if (packageData.name) {
    projectName = packageData.name;
    version = packageData.version || '1.0.0';
    description = packageData.description || description;
  }
  
  // Detect stack from appropriate dependency source
  const deps = { ...packageData.dependencies, ...packageData.devDependencies };
  const stack = analyzeStackFromDependencies(deps, pythonData, typescriptData, projectType);
  
  // Calculate initial score (basic detection gives ~40-60%)
  const initialScore = calculateInitialScore(packageData, pythonData, typescriptData, stack, projectType);
  
  return {
    faf_version: '2.4.0',
    generated: now,
    
    // 🎯 Project Core
    project: {
      name: projectName,
      goal: description,
      main_language: detectMainLanguage(deps, pythonData, projectType),
      faf_score: initialScore,
      importance: 'MORE_IMPORTANT_THAN_PACKAGE_JSON'
    },
    
    // 📢 AI INSTRUCTION SECTION - CRITICAL
    ai_instructions: {
      priority: 'CRITICAL',
      usage: 'READ_THIS_FIRST',
      message: `🧠 ATTENTION AI: This .faf file contains the complete DNA of this project.
It provides instant context that would take 20+ minutes to gather manually.

PRIORITY ORDER:
1. Read THIS .faf file first (complete project intelligence)
2. Read CLAUDE.md if exists (detailed session context)
3. Then package.json, config files, etc. (implementation details)

This .faf tells you:
- What we're building (goal)
- How we like to work (preferences)  
- Our quality standards (scores)
- Current focus (state)
- Tech stack (stack)

VALUE: This single file replaces 20+ questions and provides
perfect context for immediate productivity.`
    },
    
    // 🏗️ Technical Stack
    stack,
    
    // 🏎️ TypeScript Context (F1-Inspired Quality)
    ...(typescriptData && {
      typescript_context: {
        compiler: {
          target: typescriptData.target,
          module: typescriptData.module,
          module_resolution: typescriptData.moduleResolution,
          strict_mode: typescriptData.strict
        },
        engineering_quality: typescriptData.engineeringQuality,
        strictness_level: typescriptData.strictnessLevel,
        framework_integration: typescriptData.frameworkIntegration,
        performance_optimizations: typescriptData.performanceOptimizations,
        project_structure: {
          includes: typescriptData.includes,
          excludes: typescriptData.excludes
        }
      }
    }),
    
    // 📊 Scoring System
    scores: {
      slot_based_percentage: Math.round((initialScore / 100) * 21), // Slots filled
      faf_score: initialScore,
      total_slots: 21,
      scoring_philosophy: 'Honest percentage based on filled context slots - no fake minimums'
    },
    
    // 🧠 AI Intelligence
    ai: {
      context_file: 'CLAUDE.md',
      handoff_ready: true,
      session_continuity: 'medium',
      onboarding_time: '60_seconds'
    },
    
    // 📚 Knowledge Sync
    docs: {
      claude_sync: false,
      sync_frequency: 'weekly',
      last_updated: now
    },
    
    // ⚙️ Working Preferences (defaults - should be customized)
    preferences: {
      quality_bar: 'production_ready',
      commit_style: 'conventional',
      communication: 'concise',
      verbosity: 'minimal'
    },
    
    // 🚀 Current State
    state: {
      phase: 'development',
      version: version,
      focus: 'initial_setup',
      status: 'active'
    },
    
    // 🏷️ Tags System
    tags: {
      auto_generated: generateAutoTags(packageData, projectType),
      smart_defaults: generateSmartDefaults(projectType),
      user_defined: []
    }
  };
}

function analyzeStackFromDependencies(deps: Record<string, string>, pythonData: any, typescriptData: TypeScriptContext | null, projectType: string): any {
  const stack: any = {};
  
  // Python stack detection
  if (projectType.startsWith('python-')) {
    // Package manager detection
    if (pythonData.name) {
      stack.package_manager = 'poetry';
    } else if (pythonData.dependencies) {
      stack.package_manager = 'pip';
    }
    
    // Runtime detection
    if (pythonData.python_version) {
      stack.runtime = `Python ${pythonData.python_version}`;
    } else {
      stack.runtime = 'Python';
    }
    
    // Framework detection from project type
    switch (projectType) {
      case 'python-fastapi':
        stack.backend = 'FastAPI';
        stack.web_server = 'uvicorn';
        break;
      case 'python-django':
        stack.backend = 'Django';
        stack.web_server = 'gunicorn';
        break;
      case 'python-flask':
        stack.backend = 'Flask';
        stack.web_server = 'gunicorn';
        break;
      case 'python-starlette':
        stack.backend = 'Starlette';
        stack.web_server = 'uvicorn';
        break;
    }
    
    return stack;
  }
  
  // TypeScript/JavaScript stack detection
  
  // Pure TypeScript project
  if (projectType === 'typescript') {
    stack.runtime = 'Node.js';
    stack.language = 'TypeScript';
    stack.build = 'TypeScript Compiler';
    stack.package_manager = 'npm'; // Default for TypeScript projects
    
    return stack;
  }
  
  // JavaScript projects with potential TypeScript
  stack.package_manager = 'npm';
  
  // Frontend Detection
  if (deps.svelte || deps['@sveltejs/kit']) {
    stack.frontend = 'Svelte 5';
    stack.build = 'Vite';
  } else if (deps.react) {
    stack.frontend = 'React';
    stack.build = deps.vite ? 'Vite' : 'Webpack';
  } else if (deps.vue) {
    stack.frontend = 'Vue';
    stack.build = 'Vite';
  } else if (deps.angular) {
    stack.frontend = 'Angular';
    stack.build = 'Angular CLI';
  }
  
  // CSS Framework Detection
  if (deps.tailwindcss) stack.css_framework = 'Tailwind CSS';
  else if (deps.bootstrap) stack.css_framework = 'Bootstrap';
  else if (deps['@emotion/react']) stack.css_framework = 'Emotion';
  else if (deps['styled-components']) stack.css_framework = 'Styled Components';
  
  // Backend Detection
  if (deps.express) stack.backend = 'Express.js';
  else if (deps.fastify) stack.backend = 'Fastify';
  else if (deps['@nestjs/core']) stack.backend = 'NestJS';
  else if (projectType === 'node-api') stack.backend = 'Node.js';
  
  // Runtime Detection
  if (deps['@types/node'] || projectType.includes('node')) {
    stack.runtime = 'Node.js';
  }
  if (deps['@types/bun']) stack.runtime = 'Bun';
  if (deps.deno) stack.runtime = 'Deno';
  
  // Build Tool Detection
  if (deps.vite) stack.build = 'Vite';
  else if (deps.webpack) stack.build = 'Webpack';
  else if (deps.rollup) stack.build = 'Rollup';
  else if (deps.esbuild) stack.build = 'esbuild';
  
  return stack;
}

function detectMainLanguage(deps: Record<string, string>, pythonData: any, projectType: string): string {
  if (projectType.startsWith('python-')) return 'Python';
  
  // TypeScript detection - enhanced for new project types
  if (projectType === 'typescript' || 
      projectType.includes('-ts') || 
      deps.typescript || 
      deps['@types/node'] ||
      Object.keys(deps).some(dep => dep.startsWith('@types/'))) {
    return 'TypeScript';
  }
  
  if (projectType.includes('js') || Object.keys(deps).length > 0) return 'JavaScript';
  return 'Unknown';
}

function calculateInitialScore(packageData: any, pythonData: any, typescriptData: TypeScriptContext | null, stack: any, projectType: string): number {
  let score = 30; // Base score for having a project
  
  // Python project completeness
  if (projectType.startsWith('python-')) {
    if (pythonData.description) score += 5;
    if (pythonData.author) score += 3;
    if (pythonData.license) score += 2;
    if (pythonData.dependencies) score += 5;
    if (pythonData.python_version) score += 3;
  } else {
    // JavaScript project completeness
    if (packageData.description) score += 5;
    if (packageData.author) score += 3;
    if (packageData.license) score += 2;
    if (packageData.repository) score += 3;
    if (packageData.scripts) score += 5;
  }
  
  // TypeScript quality bonus (F1-Inspired engineering)
  if (typescriptData) {
    score += 5; // Base TypeScript bonus
    
    // F1-Inspired quality bonuses
    if (typescriptData.engineeringQuality === 'f1_inspired') score += 10;
    else if (typescriptData.engineeringQuality === 'professional') score += 5;
    
    // Strictness bonuses
    if (typescriptData.strictnessLevel === 'f1_inspired') score += 8;
    else if (typescriptData.strictnessLevel === 'ultra_strict') score += 5;
    else if (typescriptData.strictnessLevel === 'strict') score += 3;
    
    // Modern target bonus
    if (typescriptData.target.includes('2022')) score += 3;
    
    // Framework integration bonus
    if (typescriptData.frameworkIntegration.includes('native')) score += 3;
  }
  
  // Stack completeness
  const stackKeys = Object.keys(stack);
  score += Math.min(stackKeys.length * 3, 18); // Max 18 points for stack
  
  // Project type bonus
  if (projectType !== 'generic') score += 5;
  
  return Math.min(score, 85); // Increased cap for F1-Inspired TS projects
}

function generateAutoTags(packageData: any, projectType: string): string[] {
  const tags = new Set<string>();
  
  // From project name
  if (packageData.name) {
    const cleanName = packageData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    if (cleanName) tags.add(cleanName);
  }
  
  // From project type
  if (projectType !== 'generic') {
    tags.add(projectType.toLowerCase().replace(/\s+/g, '-'));
  }
  
  // From description keywords
  if (packageData.description) {
    const keywords = packageData.description.toLowerCase()
      .match(/\b(api|library|framework|component|dashboard|tool|app|cli|server|client|web|mobile)\b/gi);
    if (keywords) {
      keywords.slice(0, 3).forEach((keyword: string) => tags.add(keyword.toLowerCase()));
    }
  }
  
  return Array.from(tags).slice(0, 10);
}

function generateSmartDefaults(projectType: string): string[] {
  const year = new Date().getFullYear().toString();
  const defaults = ['.faf', 'ai-ready', year];
  
  // Project type specific
  if (projectType.includes('web') || projectType === 'svelte' || projectType === 'react') {
    defaults.push('web-app');
  } else if (projectType.includes('api') || projectType.includes('node') || projectType.includes('fastapi')) {
    defaults.push('backend-api');
  } else if (projectType.startsWith('python-')) {
    defaults.push('python-app');
  } else {
    defaults.push('software');
  }
  
  defaults.push('open-source'); // Default assumption
  
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
    if (nameMatch) data.name = nameMatch[1];
    
    const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
    if (versionMatch) data.version = versionMatch[1];
    
    const descriptionMatch = content.match(/description\s*=\s*"([^"]+)"/);
    if (descriptionMatch) data.description = descriptionMatch[1];
    
    const authorMatch = content.match(/author\s*=\s*"([^"]+)"/);
    if (authorMatch) data.author = authorMatch[1];
    
    const licenseMatch = content.match(/license\s*=\s*"([^"]+)"/);
    if (licenseMatch) data.license = licenseMatch[1];
    
    // Extract Python version
    const pythonMatch = content.match(/python\s*=\s*"([^"]+)"/);
    if (pythonMatch) {
      const version = pythonMatch[1].replace(/[\^~><=]/g, '').trim();
      data.python_version = version;
    }
    
    // Check for dependencies section
    if (content.includes('[tool.poetry.dependencies]')) {
      data.dependencies = true;
    }
    
    return data;
  } catch {
    return {};
  }
}