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
      this.fileContent += `${this.readmeContent  }\n`;
    } catch {
      // No README
    }

    // Load package.json if exists
    const packagePath = path.join(projectPath, 'package.json');
    try {
      const pkgContent = await fs.readFile(packagePath, 'utf-8');
      this.packageJson = JSON.parse(pkgContent);
      this.fileContent += `${pkgContent  }\n`;

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
      this.fileContent += `${reqContent  }\n`;

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
    // TIER 1: AUTHORITATIVE - package.json author
    if (this.packageJson?.author) {
      const author = typeof this.packageJson.author === 'string'
        ? this.packageJson.author
        : this.packageJson.author.name || this.packageJson.author.email || '';

      if (author.length > 0) {
        return {
          value: `${author} team`,
          confidence: 'CERTAIN',
          source: 'Package author (authoritative)',
          needsUserInput: false
        };
      }
    }

    // TIER 2: README - Specific "for X" patterns with minimum length
    const cleanedReadme = this.getCleanedReadme();
    const certainPatterns = [
      /(?:built|designed|created)\s+(?:specifically\s+)?for\s+([\w\s]+(?:developers?|engineers?|teams?|companies?|organizations?))/gi,
      /target\s+(?:audience|users?)(?:\s+is)?\s*:?\s*([\w\s]+)/gi,
      /perfect\s+for\s+([\w\s]+(?:developers?|engineers?|teams?))/gi
    ];

    for (const pattern of certainPatterns) {
      const match = cleanedReadme.match(pattern);
      if (match && match[1] && match[1].length > 5) {
        return {
          value: this.cleanExtractedText(match[1]),
          confidence: 'CERTAIN',
          source: 'README target audience',
          needsUserInput: false
        };
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

    // HONEST SCORING: 0% is a valid score - no fake placeholders
    return {
      value: '',
      confidence: 'MISSING',
      source: 'No audience found',
      needsUserInput: true
    };
  }

  /**
   * 🎯 RELENTLESS WHAT EXTRACTION - Core problem/purpose
   */
  private extractWHAT(): ExtractedContext {
    // TIER 1: AUTHORITATIVE - package.json description
    // Manifest files are the source of truth, ALWAYS prioritize them
    const description = this.packageJson?.description || '';
    if (description.length > 20) {
      return {
        value: description,
        confidence: 'CERTAIN',
        source: 'Package description (authoritative)',
        needsUserInput: false
      };
    }

    // TIER 2: README - But skip HTML/badges and extract carefully
    const cleanedReadme = this.getCleanedReadme();

    // Try to extract from specific sections first
    const purposeSection = cleanedReadme.match(/##?\s+(?:Purpose|What|About|Overview)\s*\n+(.+?)(?:\n\n|\n##?|$)/is);
    if (purposeSection && purposeSection[1] && purposeSection[1].length > 20) {
      return {
        value: this.cleanExtractedText(purposeSection[1]),
        confidence: 'PROBABLE',
        source: 'README Purpose section',
        needsUserInput: true
      };
    }

    // Try first paragraph after skipping HTML/badges
    const firstPara = cleanedReadme.match(/^(.+?)(?:\n\n|\n##?|$)/s);
    if (firstPara && firstPara[1] && firstPara[1].length > 30) {
      return {
        value: this.cleanExtractedText(firstPara[1]),
        confidence: 'PROBABLE',
        source: 'README introduction',
        needsUserInput: true
      };
    }

    // TIER 3: Problem statement patterns - More specific, minimum length 30 chars
    const certainPatterns = [
      /(?:core|main|primary)\s+(?:problem|issue|challenge)(?:\s+is)?\s*:?\s*([^.\n]{30,})/gi,
      /pain\s+points?\s*:?\s*([^.\n]{30,})/gi,
      /solves?\s+(?:the\s+)?(?:problem\s+of\s+)?([^.\n]{30,})/gi,
      /(?:purpose|mission)(?:\s+is)?\s*:?\s*([^.\n]{30,})/gi
    ];

    for (const pattern of certainPatterns) {
      const match = cleanedReadme.match(pattern);
      if (match && match[1]) {
        return {
          value: this.cleanExtractedText(match[1]),
          confidence: 'PROBABLE',
          source: 'Problem statement',
          needsUserInput: true
        };
      }
    }

    // TIER 4: INFERRED - From project name
    if (this.packageJson?.name) {
      const inferredPurpose = this.inferPurposeFromName(this.packageJson.name);
      return {
        value: inferredPurpose,
        confidence: 'INFERRED',
        source: 'Project name',
        needsUserInput: true
      };
    }

    // HONEST SCORING: 0% is a valid score - no fake placeholders
    return {
      value: '',
      confidence: 'MISSING',
      source: 'No problem statement found',
      needsUserInput: true
    };
  }

  /**
   * 🎯 RELENTLESS WHY EXTRACTION - Mission/purpose
   */
  private extractWHY(): ExtractedContext {
    const cleanedReadme = this.getCleanedReadme();

    // TIER 1: CERTAIN - Explicit mission/purpose sections
    const missionSection = cleanedReadme.match(/##?\s+(?:Mission|Purpose|Why|Vision)\s*\n+(.+?)(?:\n\n|\n##?|$)/is);
    if (missionSection && missionSection[1] && missionSection[1].length > 20) {
      return {
        value: this.cleanExtractedText(missionSection[1]),
        confidence: 'CERTAIN',
        source: 'README Mission section',
        needsUserInput: false
      };
    }

    // TIER 2: PROBABLE - Specific mission/goal patterns with minimum length
    const certainPatterns = [
      /(?:our\s+)?(?:mission|purpose|goal)(?:\s+is)?\s*:?\s*([^.\n]{30,})/gi,
      /(?:we\s+)?(?:aim|strive)(?:\s+to)?\s+([^.\n]{30,})/gi,
      /(?:built|created|designed)\s+(?:because|to)\s+([^.\n]{30,})/gi
    ];

    for (const pattern of certainPatterns) {
      const match = cleanedReadme.match(pattern);
      if (match && match[1]) {
        return {
          value: this.cleanExtractedText(match[1]),
          confidence: 'PROBABLE',
          source: 'Mission statement',
          needsUserInput: true
        };
      }
    }

    // TIER 3: Check package.json keywords for mission clues
    if (this.packageJson?.keywords && Array.isArray(this.packageJson.keywords)) {
      const keywords = this.packageJson.keywords.join(', ');
      if (keywords.length > 20) {
        return {
          value: `To enable ${keywords}`,
          confidence: 'INFERRED',
          source: 'Package keywords',
          needsUserInput: true
        };
      }
    }

    // HONEST SCORING: 0% is a valid score - no fake placeholders
    return {
      value: '',
      confidence: 'MISSING',
      source: 'No mission/purpose found',
      needsUserInput: true
    };
  }

  /**
   * 🎯 RELENTLESS WHERE EXTRACTION - Deployment/market
   */
  private extractWHERE(): ExtractedContext {
    // TIER 1: AUTHORITATIVE - Check package.json repository and npm registry
    if (this.packageJson?.name) {
      // If it's an npm package, it's on npm registry
      return {
        value: 'npm registry + GitHub',
        confidence: 'CERTAIN',
        source: 'Package registry (authoritative)',
        needsUserInput: false
      };
    }

    // TIER 2: Check package.json homepage
    if (this.packageJson?.homepage) {
      const url = this.packageJson.homepage;
      if (url.includes('vercel')) {return this.createContext('Vercel platform', 'CERTAIN');}
      if (url.includes('netlify')) {return this.createContext('Netlify platform', 'CERTAIN');}
      if (url.includes('github.io')) {return this.createContext('GitHub Pages', 'CERTAIN');}
      if (url.includes('heroku')) {return this.createContext('Heroku platform', 'CERTAIN');}

      return {
        value: 'Web platform',
        confidence: 'PROBABLE',
        source: 'Homepage URL',
        needsUserInput: true
      };
    }

    // TIER 3: Check for cloud indicators
    if (this.techStack.has('aws-sdk')) {return this.createContext('AWS Cloud', 'PROBABLE', true);}
    if (this.techStack.has('@google-cloud/storage')) {return this.createContext('Google Cloud', 'PROBABLE', true);}
    if (this.techStack.has('@azure/storage-blob')) {return this.createContext('Azure Cloud', 'PROBABLE', true);}

    // TIER 4: Check README for deployment mentions
    const cleanedReadme = this.getCleanedReadme();
    const deploymentPatterns = [
      /deploy(?:ed|ing|ment)?\s+(?:to|on|at)\s+([^.,\n]{10,})/gi,
      /hosted?\s+(?:on|at)\s+([^.,\n]{10,})/gi
    ];

    for (const pattern of deploymentPatterns) {
      const match = cleanedReadme.match(pattern);
      if (match && match[1]) {
        return {
          value: this.cleanExtractedText(match[1]),
          confidence: 'PROBABLE',
          source: 'Deployment mention',
          needsUserInput: true
        };
      }
    }

    // HONEST SCORING: 0% is a valid score - no fake placeholders
    return {
      value: '',
      confidence: 'MISSING',
      source: 'No deployment target found',
      needsUserInput: true
    };
  }

  /**
   * 🎯 RELENTLESS WHEN EXTRACTION - Timeline/schedule
   */
  private extractWHEN(): ExtractedContext {
    // TIER 1: Check version for stage inference (AUTHORITATIVE)
    const version = this.packageJson?.version;
    if (version) {
      if (version.startsWith('0.')) {
        return this.createContext('Pre-release/Beta phase', 'CERTAIN', false);
      } else if (parseFloat(version) >= 1.0) {
        return this.createContext('Production/Stable', 'CERTAIN', false);
      }
    }

    // TIER 2: Look for specific timeline sections in README
    const cleanedReadme = this.getCleanedReadme();
    const roadmapSection = cleanedReadme.match(/##?\s+(?:Roadmap|Timeline|Schedule)\s*\n+(.+?)(?:\n\n|\n##?|$)/is);
    if (roadmapSection && roadmapSection[1] && roadmapSection[1].length > 15) {
      return {
        value: this.cleanExtractedText(roadmapSection[1]),
        confidence: 'PROBABLE',
        source: 'README Roadmap section',
        needsUserInput: true
      };
    }

    // TIER 3: Look for timeline indicators (minimum length to avoid fragments)
    const timelinePatterns = [
      /(?:launch|release)(?:\s+date)?(?:\s+is)?\s*:?\s*([^.,\n]{15,})/gi,
      /(?:launching|releasing|shipping)\s+(?:in|on|by)\s+([^.,\n]{10,})/gi,
      /(?:expected|planned|scheduled)\s+(?:for|by|on)\s+([^.,\n]{10,})/gi
    ];

    for (const pattern of timelinePatterns) {
      const match = cleanedReadme.match(pattern);
      if (match && match[1]) {
        return {
          value: this.cleanExtractedText(match[1]),
          confidence: 'PROBABLE',
          source: 'Timeline mention',
          needsUserInput: true
        };
      }
    }

    // HONEST SCORING: 0% is a valid score - no fake placeholders
    return {
      value: '',
      confidence: 'MISSING',
      source: 'No timeline found',
      needsUserInput: true
    };
  }

  /**
   * 🎯 RELENTLESS HOW EXTRACTION - Approach/methodology
   */
  private extractHOW(): ExtractedContext {
    // TIER 1: Infer from tech stack (AUTHORITATIVE for technical approach)
    const approach = this.inferApproachFromTech();
    if (approach) {
      return {
        value: approach,
        confidence: 'CERTAIN',
        source: 'Tech stack analysis (authoritative)',
        needsUserInput: false
      };
    }

    // TIER 2: Look for methodology sections in README
    const cleanedReadme = this.getCleanedReadme();
    const methodSection = cleanedReadme.match(/##?\s+(?:Approach|Methodology|How|Architecture)\s*\n+(.+?)(?:\n\n|\n##?|$)/is);
    if (methodSection && methodSection[1] && methodSection[1].length > 20) {
      return {
        value: this.cleanExtractedText(methodSection[1]),
        confidence: 'PROBABLE',
        source: 'README Methodology section',
        needsUserInput: true
      };
    }

    // TIER 3: Look for methodology patterns (minimum length to avoid fragments)
    const methodPatterns = [
      /(?:approach|methodology)(?:\s+is)?\s*:?\s*([^.\n]{20,})/gi,
      /(?:built|created|developed)\s+(?:using|with)\s+([^.\n]{20,})/gi,
      /(?:powered|driven)\s+by\s+([^.\n]{15,})/gi
    ];

    for (const pattern of methodPatterns) {
      const match = cleanedReadme.match(pattern);
      if (match && match[1]) {
        return {
          value: this.cleanExtractedText(match[1]),
          confidence: 'PROBABLE',
          source: 'Approach description',
          needsUserInput: true
        };
      }
    }

    // HONEST SCORING: 0% is a valid score - no fake placeholders
    return {
      value: '',
      confidence: 'MISSING',
      source: 'No approach found',
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
   * Helper: Get cleaned README with HTML/badges removed
   */
  private getCleanedReadme(): string {
    let cleaned = this.readmeContent;

    // Remove HTML tags and badge images
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
    cleaned = cleaned.replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, '');

    // Remove badge URLs
    cleaned = cleaned.replace(/https?:\/\/img\.shields\.io\/[^\s)]+/g, '');
    cleaned = cleaned.replace(/https?:\/\/badge[^\s)]+/g, '');

    // Remove excessive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Skip to first markdown heading or content
    const contentStart = cleaned.search(/^#{1,2}\s+\w+|\n\n[A-Z]/m);
    if (contentStart > 0) {
      cleaned = cleaned.substring(contentStart);
    }

    return cleaned.trim();
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