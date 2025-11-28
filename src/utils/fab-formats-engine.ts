/**
 * 😽 TURBO-CAT™ v2.0.0 - POWERED BY FAB-FORMATS ENGINE!
 *
 * The KILLER FEATURE from fafdev.tools - now in CLI!
 * Two-stage blitz pattern for massive codebases
 * 86% scores from just 2 files!
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { KNOWLEDGE_BASE, FormatKnowledge } from './turbo-cat-knowledge';

export interface FabFormatsResult {
  fileName: string;
  formatType: string;
  category: string;
  intelligence: any; // Rich extracted data
  priority: number;
  grade?: string; // EXCEPTIONAL/PROFESSIONAL/GOOD/BASIC/MINIMAL
  score?: number;
  frameworks?: string[];
}

export interface FabFormatsAnalysis {
  discoveredFormats: FabFormatsResult[];
  totalIntelligenceScore: number;
  stackSignature: string;
  slotFillRecommendations: Record<string, any>;
  extractedContext: {
    projectName?: string;
    projectGoal?: string;
    mainLanguage?: string;
    frameworks?: string[];
    dependencies?: Record<string, string>;
    hasTests?: boolean;
    hasBuild?: boolean;
    hasTypeScript?: boolean;
  };
}

export class FabFormatsEngine {
  private processedCategories: Map<string, FabFormatsResult> = new Map();

  /**
   * STAGE 1: DISCOVER - Find all formats in directory (FAST)
   */
  async discoverFormats(projectDir: string): Promise<FabFormatsAnalysis> {
    const startTime = Date.now();

    // Reset for new scan
    this.processedCategories.clear();

    // Stage 1: Find ALL format files first
    const allFiles = await this.findAllFormats(projectDir);

    // Stage 2: Process by category (deduplication)
    const categorizedFiles = this.categorizeAndDeduplicate(allFiles);

    // Stage 3: Extract intelligence from best files
    const results = await this.extractIntelligence(categorizedFiles);

    // Stage 4: Analyze and generate recommendations
    const analysis = this.analyzeResults(results);

    // Silent operation - let the command handle output

    return analysis;
  }

  /**
   * Find all format files (no content reading yet!)
   *
   * MONOREPO SUPPORT: If the project directory has its own .git, we only scan
   * that directory (not parent dirs) to avoid polluting with parent project configs.
   */
  private async findAllFormats(projectDir: string): Promise<string[]> {
    const formats: string[] = [];

    // Check if starting directory has its own .git - if so, don't traverse up
    const hasOwnGit = await this.hasGitDirectory(projectDir);

    // Upward traversal for root configs (but respect monorepo boundaries)
    let currentDir = projectDir;
    for (let i = 0; i < 10; i++) {
      try {
        const files = await fs.readdir(currentDir);

        for (const file of files) {
          // Check against known formats
          if (KNOWLEDGE_BASE[file] || this.isKnownExtension(file)) {
            formats.push(path.join(currentDir, file));
          }
        }

        // MONOREPO BOUNDARY: If project has its own .git, stop after first dir
        if (hasOwnGit && i === 0) {
          break; // Don't pollute with parent project configs
        }

        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        currentDir = parentDir;
      } catch {
        break;
      }
    }

    return formats;
  }

  /**
   * Check if directory has a .git folder (indicates project boundary)
   */
  private async hasGitDirectory(dir: string): Promise<boolean> {
    try {
      const gitPath = path.join(dir, '.git');
      const stats = await fs.stat(gitPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private isKnownExtension(fileName: string): boolean {
    const knownExtensions = ['.md', '.json', '.yaml', '.yml', '.toml', '.xml'];
    return knownExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * STAGE 2: CATEGORIZE - Smart deduplication
   */
  private categorizeAndDeduplicate(files: string[]): Map<string, string> {
    const categorized = new Map<string, string>();

    for (const filePath of files) {
      const fileName = path.basename(filePath);
      const category = this.categorizeFile(fileName);

      // Only keep first file per category (closest to project root)
      if (!categorized.has(category)) {
        categorized.set(category, filePath);
      }
    }

    return categorized;
  }

  /**
   * Categorize files - STRAIGHT FROM FAB-FORMATS!
   */
  private categorizeFile(fileName: string): string {
    // Chrome Extension Files (highest priority for extensions)
    if (fileName === 'manifest.json') return 'chrome-extension';

    // Package Management Files (only one per project)
    if (fileName === 'package.json') return 'package-manager';
    if (fileName === 'Cargo.toml') return 'package-manager';
    if (fileName === 'requirements.txt' || fileName === 'requirements.in') return 'package-manager';
    if (fileName === 'pyproject.toml') return 'package-manager';
    if (fileName === 'pom.xml') return 'package-manager';
    if (fileName === 'build.gradle' || fileName === 'build.gradle.kts') return 'package-manager';
    if (fileName === 'Pipfile') return 'package-manager';
    if (fileName === 'composer.json') return 'package-manager';

    // Documentation Files (one main README/REQUIREMENTS)
    if (fileName === 'README.md' || fileName === 'README.rst' || fileName === 'README.txt') return 'documentation';
    if (fileName === 'REQUIREMENTS.md' || fileName === 'REQUIREMENTS.rst' || fileName === 'REQUIREMENTS.txt') return 'requirements';

    // Configuration Files (one per type)
    if (fileName === 'tsconfig.json') return 'typescript-config';
    if (fileName === 'svelte.config.js' || fileName === 'svelte.config.ts') return 'svelte-config';
    if (fileName === 'vite.config.js' || fileName === 'vite.config.ts') return 'vite-config';
    if (fileName === 'next.config.js' || fileName === 'next.config.mjs') return 'next-config';
    if (fileName === 'nuxt.config.js' || fileName === 'nuxt.config.ts') return 'nuxt-config';
    if (fileName === 'astro.config.mjs' || fileName === 'astro.config.js') return 'astro-config';

    // Testing Configuration
    if (fileName === 'vitest.config.ts' || fileName === 'vitest.config.js') return 'test-config';
    if (fileName === 'jest.config.js' || fileName === 'jest.config.ts') return 'test-config';
    if (fileName === 'playwright.config.js' || fileName === 'playwright.config.ts') return 'test-config';

    // Linting Configuration
    if (fileName.startsWith('.eslintrc') || fileName === 'eslint.config.js') return 'lint-config';
    if (fileName === '.prettierrc' || fileName === 'prettier.config.js') return 'lint-config';

    // Deployment Configuration
    if (fileName === 'Dockerfile' || fileName.startsWith('Dockerfile.')) return 'docker-config';
    if (fileName === 'docker-compose.yml' || fileName === 'docker-compose.yaml') return 'docker-compose-config';
    if (fileName === 'vercel.json') return 'vercel-config';
    if (fileName === 'netlify.toml') return 'netlify-config';

    // FAF Files - HIGHEST PRIORITY!
    if (fileName === '.faf') return 'faf-context';
    if (fileName === 'CLAUDE.md') return 'claude-context';

    // Default: use file extension as category
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    return `file-type-${ext}`;
  }

  /**
   * STAGE 3: EXTRACT - Deep intelligence extraction
   */
  private async extractIntelligence(categorizedFiles: Map<string, string>): Promise<FabFormatsResult[]> {
    const results: FabFormatsResult[] = [];

    // Process in priority order
    const priorityOrder = [
      'faf-context',
      'package-manager',
      'documentation',
      'typescript-config',
      'svelte-config',
      'vite-config'
    ];

    // Process high-priority first
    for (const category of priorityOrder) {
      if (categorizedFiles.has(category)) {
        const filePath = categorizedFiles.get(category)!;
        const result = await this.processFile(filePath, category);
        if (result) {
          results.push(result);
          categorizedFiles.delete(category);
        }
      }
    }

    // Process remaining files
    for (const [category, filePath] of categorizedFiles) {
      const result = await this.processFile(filePath, category);
      if (result) results.push(result);
    }

    return results;
  }

  /**
   * Process individual file with intelligence extraction
   */
  private async processFile(filePath: string, category: string): Promise<FabFormatsResult | null> {
    const fileName = path.basename(filePath);

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Special handling for package.json
      if (fileName === 'package.json') {
        return this.processPackageJson(filePath, content);
      }

      // Basic processing for other files
      return {
        fileName,
        formatType: fileName,
        category,
        intelligence: { exists: true, size: content.length },
        priority: this.getPriority(fileName),
        frameworks: this.detectFrameworks(fileName, content)
      };
    } catch {
      return null;
    }
  }

  /**
   * Process package.json with FAB-FORMATS quality grading
   */
  private async processPackageJson(filePath: string, content: string): Promise<FabFormatsResult> {
    const packageData = JSON.parse(content);
    const allDeps = { ...packageData.dependencies, ...packageData.devDependencies, ...packageData.peerDependencies };

    // Grade the quality
    const qualityGrade = this.gradePackageJsonQuality(packageData);

    // Detect frameworks
    const frameworks: string[] = [];
    if (allDeps['svelte'] || allDeps['@sveltejs/kit']) frameworks.push('Svelte');
    if (allDeps['react'] || allDeps['next']) frameworks.push('React');
    if (allDeps['vue'] || allDeps['nuxt']) frameworks.push('Vue');
    if (allDeps['@angular/core']) frameworks.push('Angular');
    if (allDeps['astro']) frameworks.push('Astro');

    return {
      fileName: 'package.json',
      formatType: 'package.json',
      category: 'package-manager',
      intelligence: {
        name: packageData.name,
        description: packageData.description,
        version: packageData.version,
        scripts: packageData.scripts,
        dependencies: allDeps,
        author: packageData.author,
        license: packageData.license,
        repository: packageData.repository,
        frameworks,
        depCount: Object.keys(allDeps).length,
        hasTests: !!(packageData.scripts?.test || packageData.scripts?.check),
        hasBuild: !!packageData.scripts?.build,
        hasTypeScript: !!(allDeps['typescript'] || allDeps['@types/node']),
        hasLinting: !!(allDeps['eslint'] || allDeps['prettier'])
      },
      priority: 35,
      grade: qualityGrade.grade,
      score: qualityGrade.baseScore,
      frameworks
    };
  }

  /**
   * Grade package.json quality - THE SECRET SAUCE!
   */
  private gradePackageJsonQuality(packageData: any): { grade: string, baseScore: number, criteria: string[] } {
    const criteria: string[] = [];

    // TIER 1: EXCEPTIONAL (90%+ Claude Recommended)
    let exceptionalCount = 0;

    if (packageData.name && packageData.description && packageData.version) {
      exceptionalCount++; criteria.push('Complete project metadata');
    }

    const scripts = packageData.scripts || {};
    const scriptKeys = Object.keys(scripts);
    if (scriptKeys.includes('dev') && scriptKeys.includes('build') &&
        (scriptKeys.includes('test') || scriptKeys.includes('check'))) {
      exceptionalCount++; criteria.push('Complete dev lifecycle scripts');
    }

    const totalDeps = Object.keys(packageData.dependencies || {}).length +
                     Object.keys(packageData.devDependencies || {}).length;
    if (totalDeps >= 15 && packageData.devDependencies) {
      exceptionalCount++; criteria.push('Professional dependency structure');
    }

    const allDeps = { ...packageData.dependencies, ...packageData.devDependencies };
    let modernTools = 0;
    if (allDeps['typescript'] || allDeps['@types/node']) modernTools++;
    if (allDeps['vite'] || allDeps['webpack'] || allDeps['rollup']) modernTools++;
    if (allDeps['jest'] || allDeps['vitest'] || allDeps['playwright']) modernTools++;
    if (allDeps['eslint'] || allDeps['prettier']) modernTools++;

    if (modernTools >= 3) {
      exceptionalCount++; criteria.push('Modern development toolchain');
    }

    // Framework sophistication
    let frameworkSophistication = 0;
    if (allDeps['svelte'] || allDeps['react'] || allDeps['vue'] || allDeps['next'] || allDeps['nuxt']) frameworkSophistication++;
    if (allDeps['@sveltejs/kit'] || allDeps['next'] || allDeps['nuxt']) frameworkSophistication++;
    if (allDeps['tailwindcss'] || allDeps['styled-components']) frameworkSophistication++;

    if (frameworkSophistication >= 2) {
      exceptionalCount++; criteria.push('Sophisticated framework stack');
    }

    if (packageData.repository && packageData.author && packageData.license) {
      exceptionalCount++; criteria.push('Professional project setup');
    }

    // TIER GRADING
    if (exceptionalCount >= 5) {
      return { grade: 'EXCEPTIONAL', baseScore: 120, criteria };
    }

    let professionalCount = 0;
    if (packageData.name && packageData.description) professionalCount++;
    if (totalDeps >= 8) professionalCount++;
    if (modernTools >= 2) professionalCount++;
    if (scriptKeys.length >= 3) professionalCount++;

    if (professionalCount >= 3 || exceptionalCount >= 3) {
      return { grade: 'PROFESSIONAL', baseScore: 85, criteria };
    }

    if (packageData.name && totalDeps >= 5 && scriptKeys.length >= 2) {
      return { grade: 'GOOD', baseScore: 65, criteria };
    }

    if (packageData.name && totalDeps >= 1) {
      return { grade: 'BASIC', baseScore: 45, criteria };
    }

    return { grade: 'MINIMAL', baseScore: 25, criteria };
  }

  private getPriority(fileName: string): number {
    const knowledge = KNOWLEDGE_BASE[fileName];
    return knowledge?.priority || 10;
  }

  private detectFrameworks(fileName: string, content: string): string[] {
    const frameworks: string[] = [];

    if (content.includes('svelte') || content.includes('@sveltejs')) frameworks.push('Svelte');
    if (content.includes('react') || content.includes('React')) frameworks.push('React');
    if (content.includes('vue') || content.includes('Vue')) frameworks.push('Vue');

    return frameworks;
  }

  /**
   * STAGE 4: ANALYZE - Generate final intelligence report
   */
  private analyzeResults(results: FabFormatsResult[]): FabFormatsAnalysis {
    const totalIntelligenceScore = results.reduce((sum, r) => sum + (r.score || r.priority || 0), 0);

    // Extract context from results
    const extractedContext: any = {};
    const slotFillRecommendations: Record<string, any> = {};

    // Process package.json intelligence
    const packageJson = results.find(r => r.formatType === 'package.json');
    if (packageJson?.intelligence) {
      extractedContext.projectName = packageJson.intelligence.name;
      extractedContext.projectGoal = packageJson.intelligence.description;
      extractedContext.dependencies = packageJson.intelligence.dependencies;
      extractedContext.frameworks = packageJson.intelligence.frameworks;
      extractedContext.hasTests = packageJson.intelligence.hasTests;
      extractedContext.hasBuild = packageJson.intelligence.hasBuild;
      extractedContext.hasTypeScript = packageJson.intelligence.hasTypeScript;

      // Generate slot recommendations
      if (packageJson.intelligence.hasTypeScript) {
        slotFillRecommendations.mainLanguage = 'TypeScript';
      }
      if (packageJson.intelligence.frameworks?.length > 0) {
        slotFillRecommendations.framework = packageJson.intelligence.frameworks[0];
      }
    }

    // Generate stack signature
    const stackParts: string[] = [];
    if (extractedContext.hasTypeScript) stackParts.push('typescript');
    else if (packageJson) stackParts.push('javascript');
    if (extractedContext.frameworks?.length > 0) {
      stackParts.push(extractedContext.frameworks[0].toLowerCase());
    }

    const stackSignature = stackParts.join('-') || 'unknown-stack';

    return {
      discoveredFormats: results,
      totalIntelligenceScore,
      stackSignature,
      slotFillRecommendations,
      extractedContext
    };
  }
}