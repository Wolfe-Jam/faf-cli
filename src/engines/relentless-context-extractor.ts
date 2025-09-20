/**
 * 🏎️ RelentlessContextExtractor - F1-Inspired Context Hunting System
 * NEVER gives up on finding context. Fights for every bit of information.
 * Three-tier confidence system: CERTAIN | PROBABLE | INFERRED
 *
 * This is the AERO PACKAGE - Makes the Power Unit sing!
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export type ConfidenceLevel = 'CERTAIN' | 'PROBABLE' | 'INFERRED' | 'DEFAULT' | 'MISSING';
export type Priority = 'CRITICAL' | 'IMPORTANT' | 'Key' | 'Important' | 'CRUCIAL';

export interface ExtractedContext {
  value: string;
  confidence: ConfidenceLevel;
  source?: string;
  needsUserInput: boolean;
}

export interface ContextTodo {
  field: string;
  priority: Priority;
  currentValue: string;
  confidence: ConfidenceLevel;
  prompt: string;
  examples: string[];
  scoreboost: number;
}

export interface HumanContext {
  who: ExtractedContext;
  what: ExtractedContext;
  why: ExtractedContext;
  where: ExtractedContext;
  when: ExtractedContext;
  how: ExtractedContext;
  todos: ContextTodo[];
}

export class RelentlessContextExtractor {
  private techStack: Set<string> = new Set();
  private fileContent: string = '';
  private packageJson: any = null;
  private readmeContent: string = '';
  private projectPath: string = '';

  /**
   * 🏁 Main extraction entry point - RELENTLESS pursuit of context!
   */
  async extractFromProject(projectPath: string): Promise<HumanContext> {
    this.projectPath = projectPath;

    // Load all available sources
    await this.loadProjectFiles(projectPath);

    // Extract with RELENTLESS determination
    const who = this.extractWHO();
    const what = this.extractWHAT();
    const why = this.extractWHY();
    const where = this.extractWHERE();
    const when = this.extractWHEN();
    const how = this.extractHOW();

    // Generate TODOs for missing context
    const todos = this.generateContextTodos({
      who, what, why, where, when, how
    });

    return {
      who, what, why, where, when, how, todos
    };
  }

  /**
   * Load all project files for context extraction
   */
  private async loadProjectFiles(projectPath: string): Promise<void> {
    // Load README if exists
    const readmePath = path.join(projectPath, 'README.md');
    try {
      this.readmeContent = await fs.readFile(readmePath, 'utf-8');
      this.fileContent += this.readmeContent + '\n';
    } catch {
      // No README
    }

    // Load package.json if exists
    const packagePath = path.join(projectPath, 'package.json');
    try {
      const pkgContent = await fs.readFile(packagePath, 'utf-8');
      this.packageJson = JSON.parse(pkgContent);
      this.fileContent += pkgContent + '\n';

      // Extract tech stack from dependencies
      if (this.packageJson.dependencies) {
        Object.keys(this.packageJson.dependencies).forEach(dep => {
          this.techStack.add(dep);
        });
      }
      if (this.packageJson.devDependencies) {
        Object.keys(this.packageJson.devDependencies).forEach(dep => {
          this.techStack.add(dep);
        });
      }
    } catch {
      // No package.json
    }

    // Load requirements.txt for Python projects
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    try {
      const reqContent = await fs.readFile(requirementsPath, 'utf-8');
      this.fileContent += reqContent + '\n';

      // Extract Python packages
      reqContent.split('\n').forEach(line => {
        const pkg = line.split('==')[0].split('>=')[0].split('~=')[0].trim();
        if (pkg && !pkg.startsWith('#')) {
          this.techStack.add(pkg);
        }
      });
    } catch {
      // No requirements.txt
    }
  }

  /**
   * 🎯 RELENTLESS WHO EXTRACTION - Fight for user context!
   */
  private extractWHO(): ExtractedContext {
    // TIER 1: CERTAIN - High confidence patterns
    const certainPatterns = [
      /for\s+([\w\s]+(?:developers?|engineers?|teams?|companies?|organizations?))/gi,
      /built\s+(?:specifically\s+)?for\s+([^.,\n]+)/gi,
      /designed\s+for\s+([^.,\n]+)/gi,
      /perfect\s+for\s+([^.,\n]+)/gi,
      /target(?:ing|ed|s)?\s+(?:at|to|for)?\s*([^.,\n]+)/gi,
      /helps?\s+([^.,\n]+(?:developers?|engineers?|teams?))/gi,
      /enables?\s+([^.,\n]+)\s+to/gi,
      /empowers?\s+([^.,\n]+)/gi
    ];

    for (const pattern of certainPatterns) {
      const matches = this.fileContent.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 5) {
          return {
            value: this.cleanExtractedText(match[1]),
            confidence: 'CERTAIN',
            source: 'Direct statement',
            needsUserInput: false
          };
        }
      }
    }

    // TIER 2: PROBABLE - Medium confidence
    const probablePatterns = [
      /\b(beginners?|professionals?|students?|enterprises?|startups?|agencies?)\b/gi,
      /\b(frontend|backend|fullstack|full-stack|mobile|web|desktop)\s+developers?\b/gi,
      /\b(data\s+scientists?|designers?|marketers?|managers?|devops|analysts?)\b/gi,
      /"As\s+an?\s+([^"]+)"/gi,
      /users?\s+can\s+([^.,]+)/gi,
      /ideal\s+for\s+([^.,\n]+)/gi
    ];

    for (const pattern of probablePatterns) {
      const matches = this.fileContent.matchAll(pattern);
      for (const match of matches) {
        if (match[1] || match[0]) {
          const extracted = match[1] || match[0];
          return {
            value: this.cleanExtractedText(extracted),
            confidence: 'PROBABLE',
            source: 'Context clues',
            needsUserInput: true
          };
        }
      }
    }

    // TIER 3: INFERRED - From tech stack
    const inference = this.inferAudienceFromTech();
    if (inference) {
      return {
        value: inference,
        confidence: 'INFERRED',
        source: 'Tech stack analysis',
        needsUserInput: true
      };
    }

    // DEFAULT - We NEVER give up!
    return {
      value: 'Development teams',
      confidence: 'DEFAULT',
      source: 'Standard assumption',
      needsUserInput: true
    };
  }

  /**
   * 🎯 RELENTLESS WHAT EXTRACTION - Core problem/purpose
   */
  private extractWHAT(): ExtractedContext {
    // TIER 1: CERTAIN - Direct problem statements
    const certainPatterns = [
      /solves?\s+(?:the\s+)?(?:problem\s+of\s+)?([^.,\n]+)/gi,
      /addresses?\s+(?:the\s+)?(?:issue\s+of\s+)?([^.,\n]+)/gi,
      /fixes?\s+([^.,\n]+)/gi,
      /eliminates?\s+([^.,\n]+)/gi,
      /prevents?\s+([^.,\n]+)/gi,
      /(?:core|main|primary)\s+(?:problem|issue|challenge)(?:\s+is)?\s*:?\s*([^.,\n]+)/gi,
      /pain\s+points?\s*:?\s*([^.,\n]+)/gi
    ];

    for (const pattern of certainPatterns) {
      const matches = this.fileContent.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          return {
            value: this.cleanExtractedText(match[1]),
            confidence: 'CERTAIN',
            source: 'Problem statement',
            needsUserInput: false
          };
        }
      }
    }

    // TIER 2: PROBABLE - Feature descriptions
    const description = this.packageJson?.description || '';
    if (description.length > 20) {
      return {
        value: description,
        confidence: 'PROBABLE',
        source: 'Package description',
        needsUserInput: true
      };
    }

    // Extract from README first paragraph
    const firstPara = this.readmeContent.match(/^#\s+.+\n+(.+?)(?:\n\n|\n#|$)/ms);
    if (firstPara && firstPara[1]) {
      return {
        value: this.cleanExtractedText(firstPara[1]),
        confidence: 'PROBABLE',
        source: 'README introduction',
        needsUserInput: true
      };
    }

    // TIER 3: INFERRED - From project name
    if (this.packageJson?.name) {
      const inferredPurpose = this.inferPurposeFromName(this.packageJson.name);
      return {
        value: inferredPurpose,
        confidence: 'INFERRED',
        source: 'Project name',
        needsUserInput: true
      };
    }

    return {
      value: 'Software development solution',
      confidence: 'DEFAULT',
      source: 'Standard assumption',
      needsUserInput: true
    };
  }

  /**
   * 🎯 RELENTLESS WHY EXTRACTION - Mission/purpose
   */
  private extractWHY(): ExtractedContext {
    // TIER 1: CERTAIN - Mission statements
    const certainPatterns = [
      /(?:our\s+)?mission(?:\s+is)?\s*:?\s*([^.,\n]+)/gi,
      /(?:our\s+)?purpose(?:\s+is)?\s*:?\s*([^.,\n]+)/gi,
      /(?:our\s+)?goal(?:\s+is)?\s*:?\s*([^.,\n]+)/gi,
      /(?:we\s+)?aim(?:\s+to)?\s+([^.,\n]+)/gi,
      /(?:we\s+)?strive(?:\s+to)?\s+([^.,\n]+)/gi,
      /because\s+([^.,\n]+)/gi,
      /so\s+that\s+([^.,\n]+)/gi
    ];

    for (const pattern of certainPatterns) {
      const matches = this.fileContent.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 15) {
          return {
            value: this.cleanExtractedText(match[1]),
            confidence: 'CERTAIN',
            source: 'Mission statement',
            needsUserInput: false
          };
        }
      }
    }

    // TIER 2: PROBABLE - Benefits/outcomes
    const benefitPatterns = [
      /enables?\s+(?:you\s+to\s+)?([^.,\n]+)/gi,
      /allows?\s+(?:you\s+to\s+)?([^.,\n]+)/gi,
      /helps?\s+(?:you\s+)?([^.,\n]+)/gi,
      /makes?\s+(?:it\s+)?([^.,\n]+)/gi
    ];

    for (const pattern of benefitPatterns) {
      const matches = this.fileContent.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 15) {
          return {
            value: 'To ' + this.cleanExtractedText(match[1]),
            confidence: 'PROBABLE',
            source: 'Benefit statement',
            needsUserInput: true
          };
        }
      }
    }

    // TIER 3: INFERRED - From what
    return {
      value: 'Improve development efficiency',
      confidence: 'INFERRED',
      source: 'Standard goal',
      needsUserInput: true
    };
  }

  /**
   * 🎯 RELENTLESS WHERE EXTRACTION - Deployment/market
   */
  private extractWHERE(): ExtractedContext {
    // Check package.json homepage
    if (this.packageJson?.homepage) {
      const url = this.packageJson.homepage;
      if (url.includes('vercel')) return this.createContext('Vercel platform', 'CERTAIN');
      if (url.includes('netlify')) return this.createContext('Netlify platform', 'CERTAIN');
      if (url.includes('github.io')) return this.createContext('GitHub Pages', 'CERTAIN');
      if (url.includes('heroku')) return this.createContext('Heroku platform', 'CERTAIN');

      return {
        value: 'Web platform',
        confidence: 'PROBABLE',
        source: 'Homepage URL',
        needsUserInput: true
      };
    }

    // Check for cloud indicators
    if (this.techStack.has('aws-sdk')) return this.createContext('AWS Cloud', 'CERTAIN');
    if (this.techStack.has('@google-cloud/storage')) return this.createContext('Google Cloud', 'CERTAIN');
    if (this.techStack.has('@azure/storage-blob')) return this.createContext('Azure Cloud', 'CERTAIN');

    // Check for deployment configs
    const deploymentPatterns = [
      /deploy(?:ed|ing|ment)?\s+(?:to|on|at)\s+([^.,\n]+)/gi,
      /hosted?\s+(?:on|at)\s+([^.,\n]+)/gi,
      /runs?\s+(?:on|in)\s+([^.,\n]+)/gi
    ];

    for (const pattern of deploymentPatterns) {
      const match = this.fileContent.match(pattern);
      if (match && match[1]) {
        return {
          value: this.cleanExtractedText(match[1]),
          confidence: 'PROBABLE',
          source: 'Deployment mention',
          needsUserInput: true
        };
      }
    }

    return {
      value: 'Cloud platform',
      confidence: 'DEFAULT',
      source: 'Standard deployment',
      needsUserInput: true
    };
  }

  /**
   * 🎯 RELENTLESS WHEN EXTRACTION - Timeline/schedule
   */
  private extractWHEN(): ExtractedContext {
    // Look for timeline indicators
    const timelinePatterns = [
      /(?:timeline|schedule|deadline|launch|release)(?:\s+is)?\s*:?\s*([^.,\n]+)/gi,
      /(?:launching|releasing|deploying|shipping)\s+(?:in|on|by)\s+([^.,\n]+)/gi,
      /(?:expected|planned|scheduled)\s+(?:for|by|on)\s+([^.,\n]+)/gi,
      /(?:MVP|beta|alpha|v1)\s+(?:by|in|on)\s+([^.,\n]+)/gi
    ];

    for (const pattern of timelinePatterns) {
      const match = this.fileContent.match(pattern);
      if (match && match[1]) {
        return {
          value: this.cleanExtractedText(match[1]),
          confidence: 'PROBABLE',
          source: 'Timeline mention',
          needsUserInput: true
        };
      }
    }

    // Check version for stage inference
    const version = this.packageJson?.version;
    if (version) {
      if (version.startsWith('0.')) {
        return this.createContext('Pre-release/Beta phase', 'INFERRED', true);
      } else if (version.startsWith('1.')) {
        return this.createContext('Production/Stable', 'INFERRED', true);
      }
    }

    return {
      value: 'Ongoing development',
      confidence: 'DEFAULT',
      source: 'Standard timeline',
      needsUserInput: true
    };
  }

  /**
   * 🎯 RELENTLESS HOW EXTRACTION - Approach/methodology
   */
  private extractHOW(): ExtractedContext {
    // Look for methodology patterns
    const methodPatterns = [
      /(?:built|created|developed)\s+(?:using|with)\s+([^.,\n]+)/gi,
      /(?:powered|driven)\s+by\s+([^.,\n]+)/gi,
      /(?:based|built)\s+on\s+([^.,\n]+)/gi,
      /(?:uses?|utilizes?|leverages?)\s+([^.,\n]+)/gi,
      /approach(?:\s+is)?\s*:?\s*([^.,\n]+)/gi,
      /methodology(?:\s+is)?\s*:?\s*([^.,\n]+)/gi
    ];

    for (const pattern of methodPatterns) {
      const match = this.fileContent.match(pattern);
      if (match && match[1]) {
        return {
          value: this.cleanExtractedText(match[1]),
          confidence: 'PROBABLE',
          source: 'Approach description',
          needsUserInput: true
        };
      }
    }

    // Infer from tech stack
    const approach = this.inferApproachFromTech();
    if (approach) {
      return {
        value: approach,
        confidence: 'INFERRED',
        source: 'Tech stack analysis',
        needsUserInput: true
      };
    }

    return {
      value: 'Modern development practices',
      confidence: 'DEFAULT',
      source: 'Standard approach',
      needsUserInput: true
    };
  }

  /**
   * Generate TODOs for missing or low-confidence context
   */
  private generateContextTodos(context: Omit<HumanContext, 'todos'>): ContextTodo[] {
    const todos: ContextTodo[] = [];

    // WHO TODO
    if (context.who.confidence !== 'CERTAIN') {
      todos.push({
        field: 'WHO',
        priority: 'CRITICAL',
        currentValue: context.who.value,
        confidence: context.who.confidence,
        prompt: 'Who is your target user or audience?',
        examples: [
          'Full-stack developers',
          'Enterprise development teams',
          'Open source contributors',
          'Data scientists and analysts'
        ],
        scoreboost: 5
      });
    }

    // WHAT TODO
    if (context.what.confidence !== 'CERTAIN') {
      todos.push({
        field: 'WHAT',
        priority: 'CRITICAL',
        currentValue: context.what.value,
        confidence: context.what.confidence,
        prompt: 'What problem does this solve?',
        examples: [
          'Eliminates context loss in AI conversations',
          'Automates deployment workflows',
          'Simplifies state management',
          'Reduces development friction'
        ],
        scoreboost: 5
      });
    }

    // WHY TODO
    if (context.why.confidence !== 'CERTAIN') {
      todos.push({
        field: 'WHY',
        priority: 'IMPORTANT',
        currentValue: context.why.value,
        confidence: context.why.confidence,
        prompt: 'Why does this project exist?',
        examples: [
          'To make AI development trust-driven',
          'To accelerate time to market',
          'To reduce cognitive load',
          'To enable better collaboration'
        ],
        scoreboost: 5
      });
    }

    // WHERE TODO
    if (context.where.confidence !== 'CERTAIN') {
      todos.push({
        field: 'WHERE',
        priority: 'Important',
        currentValue: context.where.value,
        confidence: context.where.confidence,
        prompt: 'Where will this be deployed?',
        examples: [
          'AWS Cloud infrastructure',
          'Vercel Edge Network',
          'On-premise servers',
          'Kubernetes clusters'
        ],
        scoreboost: 3
      });
    }

    // WHEN TODO
    if (context.when.confidence !== 'CERTAIN') {
      todos.push({
        field: 'WHEN',
        priority: 'Key',
        currentValue: context.when.value,
        confidence: context.when.confidence,
        prompt: 'What is your timeline?',
        examples: [
          'Q1 2025 launch',
          'MVP by end of month',
          'Continuous deployment',
          'Beta testing phase'
        ],
        scoreboost: 3
      });
    }

    // HOW TODO
    if (context.how.confidence !== 'CERTAIN') {
      todos.push({
        field: 'HOW',
        priority: 'Important',
        currentValue: context.how.value,
        confidence: context.how.confidence,
        prompt: 'What is your development approach?',
        examples: [
          'Test-driven development',
          'Agile sprints',
          'F1-inspired engineering',
          'Open source collaboration'
        ],
        scoreboost: 3
      });
    }

    return todos;
  }

  /**
   * Helper: Infer audience from tech stack
   */
  private inferAudienceFromTech(): string | null {
    if (this.techStack.has('react') || this.techStack.has('vue') || this.techStack.has('svelte')) {
      return 'Frontend developers';
    }
    if (this.techStack.has('express') || this.techStack.has('fastify') || this.techStack.has('nestjs')) {
      return 'Backend developers';
    }
    if (this.techStack.has('tensorflow') || this.techStack.has('pytorch') || this.techStack.has('scikit-learn')) {
      return 'Data scientists and ML engineers';
    }
    if (this.techStack.has('react-native') || this.techStack.has('expo')) {
      return 'Mobile developers';
    }
    return null;
  }

  /**
   * Helper: Infer purpose from project name
   */
  private inferPurposeFromName(name: string): string {
    const cleaned = name.replace(/[-_]/g, ' ');
    return `${cleaned} - software solution`;
  }

  /**
   * Helper: Infer approach from tech stack
   */
  private inferApproachFromTech(): string | null {
    if (this.techStack.has('jest') || this.techStack.has('vitest') || this.techStack.has('mocha')) {
      return 'Test-driven development';
    }
    if (this.techStack.has('typescript')) {
      return 'Type-safe development';
    }
    if (this.techStack.has('docker') || this.techStack.has('kubernetes')) {
      return 'Containerized deployment';
    }
    if (this.techStack.has('graphql')) {
      return 'GraphQL API architecture';
    }
    return null;
  }

  /**
   * Helper: Clean extracted text
   */
  private cleanExtractedText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^[,.\s]+|[,.\s]+$/g, '')
      .substring(0, 200);
  }

  /**
   * Helper: Create context object
   */
  private createContext(value: string, confidence: ConfidenceLevel, needsInput = false): ExtractedContext {
    return {
      value,
      confidence,
      source: 'Analysis',
      needsUserInput: needsInput
    };
  }
}

/**
 * Export singleton instance
 */
export const relentlessExtractor = new RelentlessContextExtractor();