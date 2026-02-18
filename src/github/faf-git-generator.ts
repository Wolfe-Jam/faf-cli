/**
 * FAF Generation for `faf git`
 *
 * Generates clean, accurate .faf files from GitHub repos without cloning.
 * Output is compact and PR-ready — every line adds value.
 */

import type { GitHubMetadata } from './github-extractor';
import { fetchGitHubFileContent } from './github-extractor';
import { countSlots } from '../utils/slot-counter';

export interface Enhanced6Ws {
  who: string;
  what: string;
  why: string;
  where: string;
  when: string;
  how: string;
  confidence: number;
}

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

// Default sentinel values — if unchanged, we omit from output
const DEFAULT_WHO = 'Open source contributors';
const DEFAULT_WHY = '';
const DEFAULT_HOW = 'See README for usage';

/**
 * Extract 6 Ws from README content
 */
export function extract6WsFromReadme(readme: string, metadata: GitHubMetadata): Enhanced6Ws {
  const result: Enhanced6Ws = {
    who: DEFAULT_WHO,
    what: metadata.description || 'Software project',
    why: '',
    where: 'GitHub',
    when: 'Active',
    how: DEFAULT_HOW,
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
    /##\s*(?:Who|Target Audience)[^#\n]*\n+([\s\S]{10,150})(?=\n##|$)/i,
    /(?:Built for|Designed for|Perfect for)\s+([^.\n]{15,100})/i
  ];

  for (const pattern of whoPatterns) {
    const match = readme.match(pattern);
    if (match?.[1]) {
      const extracted = cleanText(match[1]);
      // Only use if it looks like a real audience description
      if (extracted.length >= 15 && extracted.length <= 120
        && !extracted.includes(':') && !extracted.endsWith('|')
        && !extracted.includes('```') && !extracted.includes('[')) {
        result.who = extracted;
        confidenceBoost += 10;
      }
      break;
    }
  }

  // === HOW: Installation/usage (language-aware) ===
  if (readme.includes('pip install') || readme.includes('pip3 install')) {
    result.how = 'pip install (see README)';
    confidenceBoost += 5;
  } else if (readme.includes('cargo install') || readme.includes('cargo add')) {
    result.how = 'cargo install (see README)';
    confidenceBoost += 5;
  } else if (readme.includes('go install') || readme.includes('go get')) {
    result.how = 'go install (see README)';
    confidenceBoost += 5;
  } else if (readme.includes('npm install') || readme.includes('npx ') || readme.includes('yarn add')) {
    result.how = 'npm install (see README)';
    confidenceBoost += 5;
  } else if (readme.includes('brew install')) {
    result.how = 'brew install (see README)';
    confidenceBoost += 5;
  } else if (readme.includes('docker pull') || readme.includes('docker run')) {
    result.how = 'Docker (see README)';
    confidenceBoost += 5;
  } else if (readme.match(/##\s*(Quick Start|Getting Started|Installation)/i)) {
    result.how = 'See Getting Started in README';
    confidenceBoost += 5;
  }

  result.confidence = Math.min(100, result.confidence + confidenceBoost);
  return result;
}

/**
 * Extract stack from GitHub API languages array (source of truth)
 * Languages are sorted by percentage descending — first entry is primary.
 */
export function extractFromLanguages(metadata: GitHubMetadata): StackAnalysis {
  const analysis: StackAnalysis = {
    frameworks: []
  };

  if (!metadata.languages || metadata.languages.length === 0) {
    return analysis;
  }

  // Use PRIMARY language (highest percentage, first in sorted array)
  const primaryLangName = metadata.languages[0]?.split(' ')[0];
  const langRuntimeMap: Record<string, { language: string; runtime: string }> = {
    'C++': { language: 'C++', runtime: 'C++' },
    'Rust': { language: 'Rust', runtime: 'Rust' },
    'Go': { language: 'Go', runtime: 'Go' },
    'Python': { language: 'Python', runtime: 'Python' },
    'Java': { language: 'Java', runtime: 'JVM' },
    'C': { language: 'C', runtime: 'C' },
    'TypeScript': { language: 'TypeScript', runtime: 'Node.js' },
    'JavaScript': { language: 'JavaScript', runtime: 'Node.js' },
    'Ruby': { language: 'Ruby', runtime: 'Ruby' },
    'Swift': { language: 'Swift', runtime: 'Swift' },
    'Kotlin': { language: 'Kotlin', runtime: 'JVM' },
    'Zig': { language: 'Zig', runtime: 'Zig' },
    'Lua': { language: 'Lua', runtime: 'Lua' },
    'Dart': { language: 'Dart', runtime: 'Dart' },
    'PHP': { language: 'PHP', runtime: 'PHP' },
    'Scala': { language: 'Scala', runtime: 'JVM' },
    'Elixir': { language: 'Elixir', runtime: 'BEAM' },
    'Haskell': { language: 'Haskell', runtime: 'GHC' },
  };

  if (primaryLangName && langRuntimeMap[primaryLangName]) {
    const match = langRuntimeMap[primaryLangName];
    analysis.language = match.language;
    analysis.runtime = match.runtime;
  }

  // Build system + Docker detection from all languages
  const allLangs = metadata.languages.map(l => l.split(' ')[0].toLowerCase());
  if (allLangs.includes('cmake')) {
    analysis.buildTool = 'CMake';
  } else if (allLangs.includes('makefile')) {
    analysis.buildTool = 'Make';
  } else if (allLangs.includes('gradle')) {
    analysis.buildTool = 'Gradle';
  } else if (allLangs.includes('maven')) {
    analysis.buildTool = 'Maven';
  }

  if (allLangs.includes('dockerfile')) {
    analysis.hosting = 'Docker';
  }

  return analysis;
}

/**
 * Analyze package.json for npm ecosystem details
 */
export function analyzePackageJson(packageJson: any, metadata: GitHubMetadata): StackAnalysis {
  const analysis: StackAnalysis = {
    frameworks: []
  };

  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  // Frontend
  if (deps.react) { analysis.frontend = 'React'; }
  else if (deps.vue) { analysis.frontend = 'Vue'; }
  else if (deps.svelte) { analysis.frontend = 'Svelte'; }
  else if (deps['@angular/core']) { analysis.frontend = 'Angular'; }
  else if (deps.next) { analysis.frontend = 'Next.js'; }

  // Backend
  if (deps.express) { analysis.backend = 'Express'; }
  else if (deps.fastify) { analysis.backend = 'Fastify'; }
  else if (deps.koa) { analysis.backend = 'Koa'; }
  else if (deps['@nestjs/core']) { analysis.backend = 'NestJS'; }

  // Database
  if (deps.mongoose) { analysis.database = 'MongoDB'; }
  else if (deps.pg || deps.postgres) { analysis.database = 'PostgreSQL'; }
  else if (deps.mysql || deps.mysql2) { analysis.database = 'MySQL'; }
  else if (deps.sqlite3 || deps['better-sqlite3']) { analysis.database = 'SQLite'; }
  else if (deps.redis) { analysis.database = 'Redis'; }

  // Testing
  if (deps.jest) { analysis.testing = 'Jest'; }
  else if (deps.vitest) { analysis.testing = 'Vitest'; }
  else if (deps.mocha) { analysis.testing = 'Mocha'; }

  // Build tools
  if (deps.vite) { analysis.buildTool = 'Vite'; }
  else if (deps.webpack) { analysis.buildTool = 'Webpack'; }
  else if (deps.rollup) { analysis.buildTool = 'Rollup'; }
  else if (deps.esbuild) { analysis.buildTool = 'esbuild'; }
  else if (deps.turbo) { analysis.buildTool = 'Turborepo'; }

  // Collect frameworks
  if (analysis.frontend) { analysis.frameworks.push(analysis.frontend); }
  if (analysis.backend) { analysis.frameworks.push(analysis.backend); }

  return analysis;
}

/**
 * Generate clean .faf file from GitHub repo metadata
 */
export async function generateEnhancedFaf(
  metadata: GitHubMetadata,
  files: any[]
): Promise<{ content: string; score: number }> {

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
        who: DEFAULT_WHO,
        what: metadata.description || 'Software project',
        why: '',
        where: 'GitHub',
        when: 'Active',
        how: DEFAULT_HOW,
        confidence: 25
      };

  // Extract stack from GitHub API languages (source of truth)
  const langStack = extractFromLanguages(metadata);

  // Analyze stack from package.json (adds npm-specific detail)
  const npmStack = packageJsonContent
    ? analyzePackageJson(packageJsonContent, metadata)
    : { frameworks: [] };

  // Merge: npm takes priority for fields it detects (more specific)
  const stackAnalysis = { ...langStack, ...npmStack, frameworks: npmStack.frameworks || [] };

  // Determine main language
  const mainLanguage = stackAnalysis.language
    || metadata.languages?.[0]?.split(' ')[0]
    || null;

  // Determine project type
  const projectType = determineProjectType(metadata, stackAnalysis, packageJsonContent);

  // Calculate score internally for CLI display (slot-counting)
  const slotCount = countSlots({
    projectName: metadata.repo,
    projectGoal: metadata.description || null,
    mainLanguage: mainLanguage || 'Unknown',
    projectType: projectType,
    who: sixWs.who,
    what: sixWs.what,
    why: sixWs.why || 'slotignored',
    where: sixWs.where,
    when: sixWs.when,
    how: sixWs.how,
    frontend: stackAnalysis.frontend || 'slotignored',
    uiLibrary: 'slotignored',
    backend: stackAnalysis.backend || 'slotignored',
    runtime: stackAnalysis.runtime || 'slotignored',
    database: stackAnalysis.database || 'slotignored',
    build: stackAnalysis.buildTool || 'slotignored',
    packageManager: packageJsonContent ? 'npm' : 'slotignored',
    apiType: 'slotignored',
    hosting: stackAnalysis.hosting || 'slotignored',
    cicd: 'slotignored',
    cssFramework: 'slotignored'
  });

  const score = slotCount.score;

  // === Build clean .faf output ===

  // Project section
  const project: Record<string, any> = {
    name: metadata.repo,
  };
  if (metadata.description) {
    project.description = metadata.description;
  }
  if (mainLanguage) {
    project.language = mainLanguage;
  }
  project.type = projectType;
  if (metadata.license && metadata.license !== 'NOASSERTION') {
    project.license = metadata.license;
  }

  // Metadata section
  const metadataSection: Record<string, any> = {
    repository: metadata.url,
    owner: metadata.owner,
  };
  if (metadata.stars && metadata.stars !== '0') {
    metadataSection.stars = metadata.stars;
  }
  if (metadata.forks && metadata.forks !== '0') {
    metadataSection.forks = metadata.forks;
  }
  if (metadata.topics && metadata.topics.length > 0) {
    metadataSection.topics = metadata.topics;
  }
  if (metadata.languages && metadata.languages.length > 0) {
    // Top 6 languages — enough to understand the stack, not noise
    metadataSection.languages = metadata.languages.slice(0, 6);
  }
  metadataSection.default_branch = metadata.defaultBranch || 'main';

  // Stack section — only populated fields, no slotignored
  const stack: Record<string, string> = {};
  if (stackAnalysis.frontend) { stack.frontend = stackAnalysis.frontend; }
  if (stackAnalysis.backend) { stack.backend = stackAnalysis.backend; }
  if (stackAnalysis.runtime && stackAnalysis.runtime !== mainLanguage) {
    stack.runtime = stackAnalysis.runtime;
  }
  if (stackAnalysis.database) { stack.database = stackAnalysis.database; }
  if (stackAnalysis.buildTool) { stack.build = stackAnalysis.buildTool; }
  if (stackAnalysis.testing) { stack.testing = stackAnalysis.testing; }
  if (packageJsonContent) { stack.package_manager = 'npm'; }
  if (stackAnalysis.hosting) { stack.hosting = stackAnalysis.hosting; }

  // Context section — only non-default, actually extracted values
  const context: Record<string, string> = {};
  if (sixWs.what && sixWs.what !== metadata.description) {
    // Only include if different from description (avoids duplication)
    context.what = sixWs.what;
  }
  if (sixWs.who && sixWs.who !== DEFAULT_WHO) {
    context.who = sixWs.who;
  }
  if (sixWs.why) {
    context.why = sixWs.why;
  }
  if (sixWs.how && sixWs.how !== DEFAULT_HOW) {
    context.how = sixWs.how;
  }

  // Assemble the data
  const fafData: Record<string, any> = {
    faf_version: '2.5.0',
    project,
    metadata: metadataSection,
  };

  if (Object.keys(stack).length > 0) {
    fafData.stack = stack;
  }

  if (Object.keys(context).length > 0) {
    fafData.context = context;
  }

  fafData.generated_by = {
    tool: 'faf-cli',
    version: '4.4.3',
    command: `faf git ${metadata.owner}/${metadata.repo}`,
  };

  // Convert to YAML
  const { stringify: stringifyYAML } = require('../fix-once/yaml');
  const yamlContent = stringifyYAML(fafData);

  // Clean, informative header
  const header = `# project.faf — Machine-readable project context for AI tools
# ${metadata.url}
# Spec: https://faf.dev | MIME: application/vnd.faf+yaml
# Generated: npx faf-cli git ${metadata.owner}/${metadata.repo}

`;

  return {
    content: header + yamlContent,
    score
  };
}

// === Helper functions ===

function cleanText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Score tier for CLI display (not written to file)
 */
export function getScoreTier(score: number): string {
  if (score >= 100) { return '🏆 Trophy'; }
  if (score >= 99) { return '🥇 Gold'; }
  if (score >= 95) { return '🥈 Silver'; }
  if (score >= 85) { return '🥉 Bronze'; }
  if (score >= 70) { return '🟢 Green'; }
  if (score >= 55) { return '🟡 Yellow'; }
  if (score > 0) { return '🔴 Red'; }
  return '🤍 White';
}

function determineProjectType(
  metadata: GitHubMetadata,
  stack: StackAnalysis,
  packageJson: any
): string {
  // CLI tools
  if (packageJson?.bin) { return 'cli'; }

  // Detect from topics
  const topics = (metadata.topics || []).map(t => t.toLowerCase());
  if (topics.includes('framework') || topics.includes('library')) { return 'library'; }

  // Language/runtime repos
  const languageRepos = ['cpython', 'rust', 'go', 'swift', 'deno', 'bun', 'node'];
  if (languageRepos.includes(metadata.repo.toLowerCase())) { return 'runtime'; }

  // Full-stack / frontend / backend
  if (stack.frontend && stack.backend) { return 'full-stack'; }
  if (stack.frontend) { return 'frontend'; }
  if (stack.backend) { return 'backend'; }
  if (stack.database) { return 'database'; }

  // Library detection
  if (packageJson?.name?.includes('lib') || packageJson?.name?.includes('sdk')) { return 'library'; }
  if (topics.includes('sdk') || topics.includes('api')) { return 'library'; }

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
