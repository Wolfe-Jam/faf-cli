/**
 * 🏆 Enhanced FAF Generation for `faf git`
 *
 * Generates 90%+ AI-ready .faf files from GitHub repos WITHOUT cloning
 *
 * Strategy:
 * 1. Fetch README.md → Extract 6 Ws (+30%)
 * 2. Fetch package.json → Deep stack analysis (+15%)
 * 3. Full FAF schema → Match faf-cli init (+20%)
 * 4. Smart defaults → AI instructions, project type (+15%)
 * 5. Enhanced scoring → Championship grade (+10%)
 */

import type { GitHubMetadata } from './github-extractor';
import { fetchGitHubFileContent } from './github-extractor';
import { countSlots } from '../utils/slot-counter';
import { getSlotsForType } from '../compiler/faf-compiler';

export interface Enhanced6Ws {
  who: string;
  what: string;
  why: string;
  where: string;
  when: string;
  how: string;
  confidence: number;
}

/**
 * Extract 6 Ws from README content (simplified version for git command)
 */
export function extract6WsFromReadme(readme: string, metadata: GitHubMetadata): Enhanced6Ws {
  const result: Enhanced6Ws = {
    who: 'Open source contributors',
    what: metadata.description || 'Software project',
    why: 'Solve problems with code',
    where: 'GitHub + npm registry',
    when: 'Production/Stable',
    how: 'See README for usage',
    confidence: 40
  };

  let confidenceBoost = 0;

  // === WHAT: Extract from README patterns ===

  // Pattern 1: Bold subtitle after H1
  const boldSubtitleMatch = readme.match(/^#\s+[^\n]+\n+\*\*([^*]+)\*\*/m);
  if (boldSubtitleMatch?.[1]) {
    const extracted = cleanText(boldSubtitleMatch[1]);
    if (extracted.length > 10 && extracted.length < 150) {
      result.what = extracted;
      confidenceBoost += 15;
    }
  }

  // Pattern 2: First descriptive paragraph
  if (!boldSubtitleMatch) {
    const firstParaMatch = readme.match(/^#\s+[^\n]+\n+([A-Z][^#\n`*|]{30,200})/m);
    if (firstParaMatch?.[1]) {
      result.what = cleanText(firstParaMatch[1]);
      confidenceBoost += 10;
    }
  }

  // === WHY: Problem/motivation ===

  const whyPatterns = [
    /\*\*Problem:\*\*\s*([^\n]+)/i,
    /##\s*Why[^#\n]*\n+([\s\S]{20,200})(?=\n##|$)/i,
    /(\d+\s*(?:seconds?|minutes?|hours?)\s+(?:replaces?|vs)[^.\n]+)/i
  ];

  for (const pattern of whyPatterns) {
    const match = readme.match(pattern);
    if (match?.[1]) {
      result.why = cleanText(match[1]);
      confidenceBoost += 10;
      break;
    }
  }

  // === WHO: Target audience ===

  const whoPatterns = [
    /##\s*(?:Who|Target Audience|For)[^#\n]*\n+([\s\S]{10,150})(?=\n##|$)/i,
    /(?:Built for|Designed for|Perfect for)\s+([^.\n]{10,100})/i
  ];

  for (const pattern of whoPatterns) {
    const match = readme.match(pattern);
    if (match?.[1]) {
      result.who = cleanText(match[1]);
      confidenceBoost += 10;
      break;
    }
  }

  // === HOW: Usage/installation ===

  if (readme.includes('npm install') || readme.includes('Installation')) {
    result.how = 'npm install + usage guide in README';
    confidenceBoost += 5;
  } else if (readme.includes('Quick Start') || readme.includes('Getting Started')) {
    result.how = 'See Quick Start guide in README';
    confidenceBoost += 5;
  }

  result.confidence = Math.min(100, result.confidence + confidenceBoost);
  return result;
}

/**
 * Enhanced stack detection from package.json
 */
export interface StackAnalysis {
  frontend?: string;
  backend?: string;
  database?: string;
  testing?: string;
  buildTool?: string;
  runtime?: string;
  language?: string;
  hosting?: string;
  frameworks: string[];
}

/**
 * Extract stack from GH API languages array
 * This is the SOURCE OF TRUTH from GitHub - trust it!
 */
export function extractFromLanguages(metadata: GitHubMetadata): StackAnalysis {
  const analysis: StackAnalysis = {
    frameworks: []
  };

  if (!metadata.languages || metadata.languages.length === 0) {
    return analysis;
  }

  // Convert to lowercase for easier matching
  const langs = metadata.languages.map(l => l.toLowerCase());

  // Runtime detection (from primary language)
  const primaryLang = metadata.languages[0]?.split(' ')[0];
  if (langs.some(l => l.startsWith('c++'))) {
    analysis.language = 'C++';
    analysis.runtime = 'C++';
  } else if (langs.some(l => l.startsWith('rust'))) {
    analysis.language = 'Rust';
    analysis.runtime = 'Rust';
  } else if (langs.some(l => l.startsWith('go'))) {
    analysis.language = 'Go';
    analysis.runtime = 'Go';
  } else if (langs.some(l => l.startsWith('python'))) {
    analysis.language = 'Python';
    analysis.runtime = 'Python';
  } else if (langs.some(l => l.startsWith('java'))) {
    analysis.language = 'Java';
    analysis.runtime = 'JVM';
  } else if (langs.some(l => l.startsWith('c ('))) {
    analysis.language = 'C';
    analysis.runtime = 'C';
  } else if (langs.some(l => l.startsWith('typescript'))) {
    analysis.language = 'TypeScript';
    analysis.runtime = 'Node.js';
  } else if (langs.some(l => l.startsWith('javascript'))) {
    analysis.language = 'JavaScript';
    analysis.runtime = 'Node.js';
  }

  // Build system detection
  if (langs.some(l => l.startsWith('cmake'))) {
    analysis.buildTool = 'CMake';
  } else if (langs.some(l => l.startsWith('makefile'))) {
    analysis.buildTool = 'Make';
  } else if (langs.some(l => l.startsWith('gradle'))) {
    analysis.buildTool = 'Gradle';
  } else if (langs.some(l => l.startsWith('maven'))) {
    analysis.buildTool = 'Maven';
  }

  // Hosting detection (from Dockerfile)
  if (langs.some(l => l.startsWith('dockerfile'))) {
    analysis.hosting = 'Docker';
  }

  return analysis;
}

export function analyzePackageJson(packageJson: any, metadata: GitHubMetadata): StackAnalysis {
  const analysis: StackAnalysis = {
    frameworks: []
  };

  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  // Frontend
  if (deps.react) {analysis.frontend = 'React';}
  else if (deps.vue) {analysis.frontend = 'Vue';}
  else if (deps.svelte) {analysis.frontend = 'Svelte';}
  else if (deps['@angular/core']) {analysis.frontend = 'Angular';}
  else if (deps.next) {analysis.frontend = 'Next.js';}

  // Backend
  if (deps.express) {analysis.backend = 'Express';}
  else if (deps.fastify) {analysis.backend = 'Fastify';}
  else if (deps.koa) {analysis.backend = 'Koa';}
  else if (deps['@nestjs/core']) {analysis.backend = 'NestJS';}

  // Database
  if (deps.mongoose) {analysis.database = 'MongoDB';}
  else if (deps.pg || deps.postgres) {analysis.database = 'PostgreSQL';}
  else if (deps.mysql || deps.mysql2) {analysis.database = 'MySQL';}
  else if (deps.sqlite3 || deps['better-sqlite3']) {analysis.database = 'SQLite';}
  else if (deps.redis) {analysis.database = 'Redis';}

  // Testing
  if (deps.jest) {analysis.testing = 'Jest';}
  else if (deps.vitest) {analysis.testing = 'Vitest';}
  else if (deps.mocha) {analysis.testing = 'Mocha';}

  // Build tools (npm ecosystem)
  if (deps.vite) {analysis.buildTool = 'Vite';}
  else if (deps.webpack) {analysis.buildTool = 'Webpack';}
  else if (deps.rollup) {analysis.buildTool = 'Rollup';}
  else if (deps.esbuild) {analysis.buildTool = 'esbuild';}

  // Runtime (npm ecosystem - override if detected from GH languages)
  if (metadata.languages?.some(l => l.startsWith('TypeScript'))) {
    analysis.language = 'TypeScript';
    analysis.runtime = 'Node.js';
  } else if (metadata.languages?.some(l => l.startsWith('JavaScript'))) {
    analysis.language = 'JavaScript';
    analysis.runtime = 'Node.js';
  }

  // Collect frameworks
  if (analysis.frontend) {analysis.frameworks.push(analysis.frontend);}
  if (analysis.backend) {analysis.frameworks.push(analysis.backend);}

  return analysis;
}

/**
 * Calculate enhanced quality score (targeting 90%+)
 */
export function calculateEnhancedScore(
  metadata: GitHubMetadata,
  has6Ws: boolean,
  hasPackageJson: boolean,
  hasReadme: boolean
): number {
  let score = 0;

  // Base metadata (25%)
  if (metadata.description) {score += 5;}
  if (metadata.stars && parseInt(metadata.stars.replace(/[KM]/g, '')) > 0) {score += 5;}
  if (metadata.license) {score += 5;}
  if (metadata.topics && metadata.topics.length > 0) {score += 5;}
  if (metadata.languages && metadata.languages.length > 0) {score += 5;}

  // README extraction (30%)
  if (hasReadme) {
    score += 10; // Has README
    if (has6Ws) {score += 20;} // Extracted 6 Ws
  }

  // package.json analysis (15%)
  if (hasPackageJson) {
    score += 15; // Deep dependency analysis
  }

  // Stack detection (10%)
  if (metadata.hasPackageJson || metadata.hasTsConfig) {score += 5;}
  if (metadata.hasDockerfile) {score += 5;}

  // Recent activity (10%)
  if (metadata.lastUpdated) {
    const daysSince = (Date.now() - new Date(metadata.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 90) {score += 10;}
    else if (daysSince < 180) {score += 5;}
  }

  // File structure (5%)
  score += 5;

  // AI-ready structure (5%)
  score += 5; // Full FAF schema

  return Math.min(100, score);
}

/**
 * Generate full FAF structure (matching faf-cli init output)
 */
export async function generateEnhancedFaf(
  metadata: GitHubMetadata,
  files: any[]
): Promise<{ content: string; score: number }> {
  const timestamp = new Date().toISOString();

  // Fetch README.md
  const readme = await fetchGitHubFileContent(
    metadata.owner,
    metadata.repo,
    'README.md',
    metadata.defaultBranch
  );

  // Fetch package.json
  let packageJsonContent: any = null;
  const packageJsonRaw = await fetchGitHubFileContent(
    metadata.owner,
    metadata.repo,
    'package.json',
    metadata.defaultBranch
  );
  if (packageJsonRaw) {
    try {
      packageJsonContent = JSON.parse(packageJsonRaw);
    } catch {
      // Invalid JSON
    }
  }

  // Extract 6 Ws from README
  const sixWs = readme
    ? extract6WsFromReadme(readme, metadata)
    : {
        who: 'Open source contributors',
        what: metadata.description || 'Software project',
        why: 'Solve problems with code',
        where: 'GitHub',
        when: 'Production',
        how: 'See repository',
        confidence: 25
      };

  // Extract stack from GH API languages (SOURCE OF TRUTH)
  const langStack = extractFromLanguages(metadata);

  // Analyze stack from package.json (if exists - adds npm-specific detail)
  const npmStack = packageJsonContent
    ? analyzePackageJson(packageJsonContent, metadata)
    : { frameworks: [] };

  // Merge: npm takes priority for fields it detects (more specific)
  const stackAnalysis = { ...langStack, ...npmStack, frameworks: npmStack.frameworks || [] };

  // Determine project type
  const projectType = determineProjectType(metadata, stackAnalysis, packageJsonContent);

  // Calculate REAL score using slot-counting (not hardcoded formula)
  // IMPORTANT: Values must match what's written to .faf file (apply same defaults)
  const slotCount = countSlots({
    // Project (4)
    projectName: metadata.repo,
    projectGoal: metadata.description || null,
    mainLanguage: stackAnalysis.language || metadata.languages?.[0]?.split(' ')[0] || 'Unknown',
    projectType: projectType,
    // Human context (6)
    who: sixWs.who,
    what: sixWs.what,
    why: sixWs.why,
    where: sixWs.where,
    when: sixWs.when,
    how: sixWs.how,
    // Stack (11) - Apply same defaults as written to .faf (MUST MATCH!)
    frontend: stackAnalysis.frontend || 'slotignored',
    uiLibrary: 'slotignored',
    backend: stackAnalysis.backend || 'slotignored',
    runtime: stackAnalysis.runtime || 'slotignored',
    database: stackAnalysis.database || 'slotignored',
    build: stackAnalysis.buildTool || 'slotignored',
    packageManager: packageJsonContent ? 'npm' : 'slotignored',
    apiType: 'slotignored',
    hosting: stackAnalysis.hosting || (metadata.topics?.includes('vercel') || metadata.topics?.includes('netlify') ? 'Cloud' : 'slotignored'),
    cicd: 'slotignored',
    cssFramework: 'slotignored'
  });

  const score = slotCount.score;

  // Generate full FAF structure
  const fafData: any = {
    faf_version: '2.5.0',
    generated: timestamp,
    ai_scoring_system: '2025-09-20',
    ai_score: `${score}%`,
    ai_confidence: score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW',
    ai_value: '30_seconds_replaces_20_minutes_of_questions',

    ai_tldr: {
      project: metadata.repo,
      stack: stackAnalysis.frameworks.join('/') || 'See stack section',
      quality_bar: 'production_ready',
      current_focus: 'See README for details',
      your_role: 'Build features with perfect context'
    },

    instant_context: {
      tech_stack: stackAnalysis.frameworks.join('/') || 'See metadata',
      main_language: stackAnalysis.language || metadata.languages?.[0]?.split(' ')[0] || 'Unknown',
      key_files: getKeyFiles(files),
    },

    context_quality: {
      slots_filled: `${slotCount.filled + slotCount.ignored}/21 (${score}%)`,
      ai_confidence: score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW',
      handoff_ready: score >= 85,
      missing_context: slotCount.missingSlots.length > 0 ? slotCount.missingSlots : ['None - fully specified!']
    },

    project: {
      name: metadata.repo,
      goal: metadata.description || null,
      main_language: stackAnalysis.language || metadata.languages?.[0]?.split(' ')[0] || 'Unknown',
      type: projectType
    },

    ai_instructions: {
      priority_order: [
        '1. Read THIS .faf file first',
        '2. Check README.md for usage details',
        '3. Review package.json for dependencies'
      ],
      working_style: {
        code_first: true,
        explanations: 'minimal',
        quality_bar: 'zero_errors',
        testing: 'required'
      },
      warnings: [
        'Check README for project-specific guidelines',
        'Review existing code style before modifying'
      ]
    },

    stack: {
      frontend: stackAnalysis.frontend || 'slotignored',
      ui_library: 'slotignored', // TODO: Detect from package.json
      backend: stackAnalysis.backend || 'slotignored',
      runtime: stackAnalysis.runtime || 'slotignored',
      database: stackAnalysis.database || 'slotignored',
      build: stackAnalysis.buildTool || 'slotignored',
      package_manager: packageJsonContent ? 'npm' : 'slotignored',
      api_type: 'slotignored', // TODO: Detect API type
      hosting: stackAnalysis.hosting || (metadata.topics?.includes('vercel') || metadata.topics?.includes('netlify') ? 'Cloud' : 'slotignored'),
      cicd: 'slotignored', // TODO: Detect from .github/workflows
      css_framework: 'slotignored' // TODO: Detect from package.json
    },

    metadata: {
      url: metadata.url,
      owner: metadata.owner,
      repository: metadata.repo,
      description: metadata.description || 'No description',
      stars: metadata.stars || '0',
      forks: metadata.forks || '0',
      license: metadata.license || 'Not specified',
      topics: metadata.topics || [],
      languages: metadata.languages || [],
      last_updated: metadata.lastUpdated,
      default_branch: metadata.defaultBranch
    },

    human_context: {
      who: sixWs.who,
      what: sixWs.what,
      why: sixWs.why,
      where: sixWs.where,
      when: sixWs.when,
      how: sixWs.how,
      additional_context: readme ? 'See README.md for full details' : null,
      context_score: sixWs.confidence,
      total_prd_score: score,
      success_rate: `${Math.min(100, sixWs.confidence)}%`
    },

    scores: {
      faf_score: score,
      slot_based_percentage: score,
      total_slots: 21
    },

    tags: {
      auto_generated: [
        metadata.repo,
        ...(metadata.topics || []).slice(0, 5)
      ],
      smart_defaults: [
        '.faf',
        'ai-ready',
        new Date().getFullYear().toString(),
        'github',
        'open-source'
      ]
    },

    generated_by: {
      tool: 'faf-cli',
      command: `faf git ${metadata.owner}/${metadata.repo}`,
      version: '4.3.0',
      source: 'github-api'
    }
  };

  // Convert to YAML
  const { stringify: stringifyYAML } = require('../fix-once/yaml');
  const yamlContent = stringifyYAML(fafData);

  // Add header
  const tier = getScoreTier(score);
  const header = `# ========================================
# 🏎️ FAF GIT - ENHANCED GENERATION
# ========================================
#
# Repository: ${metadata.owner}/${metadata.repo}
# URL: ${metadata.url}
# Description: ${metadata.description || 'No description'}
# Stars: ${metadata.stars || '0'} | Forks: ${metadata.forks || '0'}
# License: ${metadata.license || 'Not specified'}
#
# Quality Score: ${score}% ${tier}
# 6 Ws Confidence: ${sixWs.confidence}%
#
# Generated: ${timestamp}
# Command: npx faf-cli git ${metadata.owner}/${metadata.repo}
# Strategy: README extraction + package.json analysis + smart defaults
#
# ========================================
# AI-READY CONTEXT (No Cloning Required!)
# ========================================

`;

  return {
    content: header + yamlContent,
    score
  };
}

// Helper functions

function cleanText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function getScoreTier(score: number): string {
  if (score >= 100) {return '🏆 Trophy';}
  if (score >= 99) {return '🥇 Gold';}
  if (score >= 95) {return '🥈 Silver';}
  if (score >= 85) {return '🥉 Bronze';}
  if (score >= 70) {return '🟢 Green';}
  if (score >= 55) {return '🟡 Yellow';}
  if (score > 0) {return '🔴 Red';}
  return '🤍 White';
}

function determineProjectType(
  metadata: GitHubMetadata,
  stack: StackAnalysis,
  packageJson: any
): string {
  if (packageJson?.bin) {return 'cli';}
  if (stack.frontend && stack.backend) {return 'full-stack';}
  if (stack.frontend) {return 'frontend';}
  if (stack.backend) {return 'backend';}
  if (stack.database) {return 'database';}
  if (packageJson?.name?.includes('lib')) {return 'library';}
  return 'application';
}

function getKeyFiles(files: any[]): string[] {
  const priority = [
    'package.json',
    'README.md',
    'tsconfig.json',
    'vite.config.ts',
    'next.config.js',
    'src/index.ts',
    'src/main.ts',
    'index.js'
  ];

  return files
    .filter(f => priority.includes(f.path))
    .map(f => f.path)
    .slice(0, 10);
}

function getMissingContext(stack: StackAnalysis, score: number): string[] {
  const missing: string[] = [];

  if (!stack.database && score < 90) {missing.push('Database');}
  if (!stack.testing && score < 90) {missing.push('Testing framework');}
  if (!stack.buildTool && score < 85) {missing.push('Build tool');}
  if (score < 80) {missing.push('Deployment info');}
  if (score < 75) {missing.push('CI/CD pipeline');}

  return missing;
}
