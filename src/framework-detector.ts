/**
 * 🏎️ Framework Detection Lookup Implementation
 * 
 * Ready-to-use TypeScript/JSON structure for instant framework detection
 * Import this directly into the .faf CLI for rapid framework identification
 */

export interface FrameworkSignature {
  framework: string;
  confidence: number;
  versionCheck?: string;
  additionalCheck?: string;
  requiresCombination?: string[];
  pattern?: boolean;
  ecosystem?: string;
  language?: string;
}

export interface DetectionResult {
  framework: string;
  confidence: number;
  version?: string;
  ecosystem?: string;
  language?: string;
  features: string[];
  deployment?: string;
  database?: string;
  testing?: string;
  monorepo?: string;
  detectedBy: 'unique' | 'directory' | 'combination' | 'package';
  detectionTime: number;
}

/**
 * TIER 1: Unique File Signatures
 * These files identify specific frameworks with 100% confidence
 */
export const UNIQUE_SIGNATURES: Record<string, FrameworkSignature> = {
  // Next.js
  'next.config.js': {
    framework: 'Next.js',
    confidence: 100,
    versionCheck: 'package.json:next',
    ecosystem: 'npm/yarn/pnpm',
    language: 'JavaScript/TypeScript'
  },
  'next.config.mjs': {
    framework: 'Next.js',
    confidence: 100,
    versionCheck: 'package.json:next',
    ecosystem: 'npm/yarn/pnpm',
    language: 'JavaScript/TypeScript'
  },
  'next.config.ts': {
    framework: 'Next.js 13+',
    confidence: 100,
    versionCheck: 'package.json:next',
    ecosystem: 'npm/yarn/pnpm',
    language: 'TypeScript'
  },
  
  // Nuxt
  'nuxt.config.js': {
    framework: 'Nuxt 2',
    confidence: 100,
    versionCheck: 'package.json:nuxt',
    ecosystem: 'npm/yarn/pnpm',
    language: 'JavaScript'
  },
  'nuxt.config.ts': {
    framework: 'Nuxt 3',
    confidence: 100,
    versionCheck: 'package.json:nuxt',
    ecosystem: 'npm/yarn/pnpm',
    language: 'TypeScript'
  },
  
  // Django
  'manage.py': {
    framework: 'Django',
    confidence: 100,
    additionalCheck: 'contains:django',
    ecosystem: 'pip/pipenv/poetry',
    language: 'Python'
  },
  
  // Laravel
  'artisan': {
    framework: 'Laravel',
    confidence: 100,
    additionalCheck: 'contains:laravel',
    ecosystem: 'composer',
    language: 'PHP'
  },
  
  // Angular
  'angular.json': {
    framework: 'Angular',
    confidence: 100,
    versionCheck: 'package.json:@angular/core',
    ecosystem: 'npm/yarn/pnpm',
    language: 'TypeScript'
  },
  
  // SvelteKit
  'svelte.config.js': {
    framework: 'SvelteKit',
    confidence: 100,
    versionCheck: 'package.json:@sveltejs/kit',
    ecosystem: 'npm/yarn/pnpm',
    language: 'JavaScript/TypeScript'
  },
  
  // Remix
  'remix.config.js': {
    framework: 'Remix',
    confidence: 100,
    versionCheck: 'package.json:@remix-run/node',
    ecosystem: 'npm/yarn/pnpm',
    language: 'JavaScript/TypeScript'
  },
  
  // Gatsby
  'gatsby-config.js': {
    framework: 'Gatsby',
    confidence: 100,
    versionCheck: 'package.json:gatsby',
    ecosystem: 'npm/yarn/pnpm',
    language: 'JavaScript'
  },
  'gatsby-config.ts': {
    framework: 'Gatsby 5+',
    confidence: 100,
    versionCheck: 'package.json:gatsby',
    ecosystem: 'npm/yarn/pnpm',
    language: 'TypeScript'
  },
  
  // Astro
  'astro.config.mjs': {
    framework: 'Astro',
    confidence: 100,
    versionCheck: 'package.json:astro',
    ecosystem: 'npm/yarn/pnpm',
    language: 'JavaScript/TypeScript'
  },
  
  // Ruby on Rails
  'Rakefile': {
    framework: 'Ruby on Rails',
    confidence: 85,
    additionalCheck: 'contains:Rails',
    ecosystem: 'bundler',
    language: 'Ruby'
  },
  
  // Flutter
  'pubspec.yaml': {
    framework: 'Flutter/Dart',
    confidence: 95,
    additionalCheck: 'contains:flutter',
    ecosystem: 'pub',
    language: 'Dart'
  },
  
  // React Native
  'metro.config.js': {
    framework: 'React Native',
    confidence: 95,
    versionCheck: 'package.json:react-native',
    ecosystem: 'npm/yarn/pnpm',
    language: 'JavaScript/TypeScript'
  },
  
  // Spring Boot
  'mvnw': {
    framework: 'Spring Boot/Maven',
    confidence: 85,
    additionalCheck: 'pom.xml:spring-boot',
    ecosystem: 'maven',
    language: 'Java'
  },
  'gradlew': {
    framework: 'Spring Boot/Gradle',
    confidence: 85,
    additionalCheck: 'build.gradle:spring-boot',
    ecosystem: 'gradle',
    language: 'Java/Kotlin'
  },
  
  // Go
  'go.mod': {
    framework: 'Go',
    confidence: 100,
    ecosystem: 'go modules',
    language: 'Go'
  },
  
  // Rust
  'Cargo.toml': {
    framework: 'Rust',
    confidence: 100,
    ecosystem: 'cargo',
    language: 'Rust'
  },

  // Zig
  'build.zig': {
    framework: 'Zig',
    confidence: 100,
    ecosystem: 'zig package manager',
    language: 'Zig'
  },
  
  // Phoenix/Elixir
  'mix.exs': {
    framework: 'Phoenix/Elixir',
    confidence: 95,
    additionalCheck: 'contains:phoenix',
    ecosystem: 'mix',
    language: 'Elixir'
  },
  
  // RedwoodJS
  'redwood.toml': {
    framework: 'RedwoodJS',
    confidence: 100,
    versionCheck: 'package.json:@redwoodjs/core',
    ecosystem: 'npm/yarn/pnpm',
    language: 'JavaScript/TypeScript'
  },
  
  // Qwik
  'qwik.config.ts': {
    framework: 'Qwik',
    confidence: 100,
    versionCheck: 'package.json:@builder.io/qwik',
    ecosystem: 'npm/yarn/pnpm',
    language: 'TypeScript'
  },
  
  // NestJS
  'nest-cli.json': {
    framework: 'NestJS',
    confidence: 100,
    versionCheck: 'package.json:@nestjs/core',
    ecosystem: 'npm/yarn/pnpm',
    language: 'TypeScript'
  }
};

/**
 * TIER 2: Directory Pattern Signatures
 * Specific folder structures that strongly indicate frameworks
 */
export const DIRECTORY_PATTERNS: Record<string, FrameworkSignature> = {
  // Next.js App Router
  'app/layout.tsx': {
    framework: 'Next.js 13+ App Router',
    confidence: 100,
    language: 'TypeScript'
  },
  'app/page.tsx': {
    framework: 'Next.js 13+ App Router',
    confidence: 100,
    language: 'TypeScript'
  },
  'app/layout.js': {
    framework: 'Next.js 13+ App Router',
    confidence: 100,
    language: 'JavaScript'
  },
  
  // Next.js Pages Router
  'pages/_app.tsx': {
    framework: 'Next.js Pages Router',
    confidence: 100,
    language: 'TypeScript'
  },
  'pages/_document.tsx': {
    framework: 'Next.js Pages Router',
    confidence: 100,
    language: 'TypeScript'
  },
  'pages/api': {
    framework: 'Next.js API Routes',
    confidence: 95,
    language: 'JavaScript/TypeScript'
  },
  
  // Django
  'models.py': {
    framework: 'Django',
    confidence: 90,
    pattern: true,
    language: 'Python'
  },
  'views.py': {
    framework: 'Django',
    confidence: 85,
    pattern: true,
    language: 'Python'
  },
  'serializers.py': {
    framework: 'Django REST Framework',
    confidence: 95,
    pattern: true,
    language: 'Python'
  },
  
  // Laravel
  'app/Http/Controllers': {
    framework: 'Laravel',
    confidence: 95,
    language: 'PHP'
  },
  'app/Models': {
    framework: 'Laravel',
    confidence: 95,
    language: 'PHP'
  },
  'database/migrations': {
    framework: 'Laravel',
    confidence: 90,
    language: 'PHP'
  },
  
  // Rails
  'app/controllers': {
    framework: 'Ruby on Rails',
    confidence: 95,
    language: 'Ruby'
  },
  'app/models': {
    framework: 'Ruby on Rails',
    confidence: 95,
    language: 'Ruby'
  },
  'db/migrate': {
    framework: 'Ruby on Rails',
    confidence: 95,
    language: 'Ruby'
  },
  
  // Angular
  'src/app/app.module.ts': {
    framework: 'Angular',
    confidence: 100,
    language: 'TypeScript'
  },
  'src/app/app.component.ts': {
    framework: 'Angular',
    confidence: 100,
    language: 'TypeScript'
  },
  
  // Vue
  'src/App.vue': {
    framework: 'Vue',
    confidence: 90,
    language: 'JavaScript/TypeScript'
  },
  'src/components': {
    framework: 'Vue',
    confidence: 70,
    pattern: true,
    additionalCheck: '.vue files',
    language: 'JavaScript/TypeScript'
  },
  
  // SvelteKit
  'src/routes/+page.svelte': {
    framework: 'SvelteKit',
    confidence: 100,
    language: 'JavaScript/TypeScript'
  },
  'src/lib': {
    framework: 'SvelteKit',
    confidence: 80,
    language: 'JavaScript/TypeScript'
  },
  
  // Spring Boot
  'src/main/java': {
    framework: 'Spring Boot/Java',
    confidence: 85,
    language: 'Java'
  },
  'src/main/resources/application.properties': {
    framework: 'Spring Boot',
    confidence: 95,
    language: 'Java'
  },
  'src/main/resources/application.yml': {
    framework: 'Spring Boot',
    confidence: 95,
    language: 'Java'
  },
  
  // .NET
  'Controllers': {
    framework: '.NET MVC/API',
    confidence: 90,
    language: 'C#'
  },
  'Views': {
    framework: '.NET MVC',
    confidence: 95,
    language: 'C#'
  },
  
  // Flutter
  'lib/main.dart': {
    framework: 'Flutter',
    confidence: 100,
    language: 'Dart'
  },
  'ios/Runner': {
    framework: 'Flutter',
    confidence: 95,
    language: 'Dart'
  }
};

/**
 * TIER 3: File Combination Patterns
 * Multiple files that together indicate a specific framework/stack
 */
export const COMBINATION_PATTERNS = {
  't3-stack': {
    files: ['next.config.mjs', 'prisma/schema.prisma', 'src/server/api/routers'],
    framework: 'T3 Stack',
    confidence: 95,
    features: ['Next.js', 'Prisma', 'tRPC', 'TypeScript'],
    language: 'TypeScript'
  },
  'mean-stack': {
    files: ['angular.json', 'server.js', 'package.json'],
    checks: ['express', 'mongoose', '@angular/core'],
    framework: 'MEAN Stack',
    confidence: 90,
    features: ['MongoDB', 'Express', 'Angular', 'Node.js'],
    language: 'TypeScript/JavaScript'
  },
  'mern-stack': {
    files: ['client/package.json', 'server/index.js'],
    checks: ['react', 'express', 'mongoose'],
    framework: 'MERN Stack',
    confidence: 90,
    features: ['MongoDB', 'Express', 'React', 'Node.js'],
    language: 'JavaScript/TypeScript'
  },
  'django-drf': {
    files: ['manage.py', 'requirements.txt'],
    checks: ['djangorestframework'],
    framework: 'Django + DRF',
    confidence: 95,
    features: ['Django', 'Django REST Framework'],
    language: 'Python'
  },
  'laravel-vue': {
    files: ['artisan', 'resources/js/app.js'],
    checks: ['vue'],
    framework: 'Laravel + Vue',
    confidence: 90,
    features: ['Laravel', 'Vue.js'],
    language: 'PHP/JavaScript'
  },
  'fastapi': {
    files: ['main.py', 'requirements.txt'],
    checks: ['fastapi', 'uvicorn'],
    framework: 'FastAPI',
    confidence: 95,
    features: ['FastAPI', 'Uvicorn'],
    language: 'Python'
  },
  'nestjs-graphql': {
    files: ['nest-cli.json', 'src/app.module.ts'],
    checks: ['@nestjs/graphql'],
    framework: 'NestJS + GraphQL',
    confidence: 95,
    features: ['NestJS', 'GraphQL'],
    language: 'TypeScript'
  }
};

/**
 * TIER 4: Configuration File Indicators
 * Files that indicate specific tools, features, or deployment targets
 */
export const CONFIG_INDICATORS = {
  // Testing Frameworks
  'jest.config.js': { feature: 'Jest', type: 'testing' },
  'jest.config.ts': { feature: 'Jest', type: 'testing' },
  'vitest.config.ts': { feature: 'Vitest', type: 'testing' },
  'cypress.config.js': { feature: 'Cypress', type: 'e2e-testing' },
  'playwright.config.ts': { feature: 'Playwright', type: 'e2e-testing' },
  
  // Linting & Formatting
  '.eslintrc.js': { feature: 'ESLint', type: 'linting' },
  '.eslintrc.json': { feature: 'ESLint', type: 'linting' },
  '.prettierrc': { feature: 'Prettier', type: 'formatting' },
  'biome.json': { feature: 'Biome', type: 'formatting' },
  
  // CI/CD
  '.github/workflows': { feature: 'GitHub Actions', type: 'ci-cd' },
  '.gitlab-ci.yml': { feature: 'GitLab CI', type: 'ci-cd' },
  'Jenkinsfile': { feature: 'Jenkins', type: 'ci-cd' },
  '.circleci/config.yml': { feature: 'CircleCI', type: 'ci-cd' },
  
  // Deployment
  'vercel.json': { feature: 'Vercel', type: 'deployment' },
  'netlify.toml': { feature: 'Netlify', type: 'deployment' },
  'render.yaml': { feature: 'Render', type: 'deployment' },
  'fly.toml': { feature: 'Fly.io', type: 'deployment' },
  'railway.json': { feature: 'Railway', type: 'deployment' },
  'Dockerfile': { feature: 'Docker', type: 'containerization' },
  'docker-compose.yml': { feature: 'Docker Compose', type: 'orchestration' },
  
  // Database/ORM
  'prisma/schema.prisma': { feature: 'Prisma', type: 'orm' },
  'drizzle.config.ts': { feature: 'Drizzle', type: 'orm' },
  'ormconfig.js': { feature: 'TypeORM', type: 'orm' },
  'knexfile.js': { feature: 'Knex.js', type: 'query-builder' },
  
  // Monorepo Tools
  'nx.json': { feature: 'Nx', type: 'monorepo' },
  'turbo.json': { feature: 'Turborepo', type: 'monorepo' },
  'lerna.json': { feature: 'Lerna', type: 'monorepo' },
  'rush.json': { feature: 'Rush', type: 'monorepo' },
  'pnpm-workspace.yaml': { feature: 'pnpm workspaces', type: 'monorepo' }
};

/**
 * TIER 5: Claude Code Detection
 * Detects Claude Code specific structures (.claude/ folder)
 */
export interface ClaudeCodeResult {
  detected: boolean;
  subagents: string[];
  commands: string[];
  skills: string[];  // Claude Code 2.1.0+
  permissions: string[];
  hasClaudeMd: boolean;
  mcpServers: string[];
}

export async function detectClaudeCode(projectPath: string): Promise<ClaudeCodeResult> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const result: ClaudeCodeResult = {
    detected: false,
    subagents: [],
    commands: [],
    skills: [],
    permissions: [],
    hasClaudeMd: false,
    mcpServers: []
  };

  // Check for CLAUDE.md
  try {
    await fs.access(path.join(projectPath, 'CLAUDE.md'));
    result.hasClaudeMd = true;
    result.detected = true;
  } catch {}

  // Check for .claude/agents/
  try {
    const agentsPath = path.join(projectPath, '.claude', 'agents');
    const files = await fs.readdir(agentsPath);
    result.subagents = files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
    if (result.subagents.length > 0) {result.detected = true;}
  } catch {}

  // Check for .claude/commands/
  try {
    const commandsPath = path.join(projectPath, '.claude', 'commands');
    const files = await fs.readdir(commandsPath);
    result.commands = files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
    if (result.commands.length > 0) {result.detected = true;}
  } catch {}

  // Check for .claude/skills/ (Claude Code 2.1.0+)
  try {
    const skillsPath = path.join(projectPath, '.claude', 'skills');
    const files = await fs.readdir(skillsPath);
    result.skills = files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
    if (result.skills.length > 0) {result.detected = true;}
  } catch {}

  // Check for .claude/settings.json permissions
  try {
    const settingsPath = path.join(projectPath, '.claude', 'settings.json');
    const content = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(content);
    if (settings.permissions?.allow) {
      result.permissions = settings.permissions.allow
        .slice(0, 10)
        .map((p: string) => p.split('(')[0]); // Extract tool name
    }
    if (result.permissions.length > 0) {result.detected = true;}
  } catch {}

  // Check for .mcp.json (project-scoped MCP servers)
  try {
    const mcpPath = path.join(projectPath, '.mcp.json');
    const content = await fs.readFile(mcpPath, 'utf-8');
    const mcpConfig = JSON.parse(content);
    if (mcpConfig.mcpServers) {
      result.mcpServers = Object.keys(mcpConfig.mcpServers).slice(0, 10);
    }
    if (result.mcpServers.length > 0) {result.detected = true;}
  } catch {}

  return result;
}

/**
 * TIER 6: Package Manager Indicators
 * Lock files that indicate the package manager being used
 */
export const PACKAGE_MANAGERS = {
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
  'bun.lockb': 'bun',
  'Gemfile.lock': 'bundler',
  'Pipfile.lock': 'pipenv',
  'poetry.lock': 'poetry',
  'composer.lock': 'composer',
  'Cargo.lock': 'cargo',
  'go.sum': 'go modules',
  'Package.resolved': 'swift-pm',
  'Podfile.lock': 'cocoapods'
};

/**
 * Main Detection Class
 */
export class FrameworkDetector {
  private projectPath: string;
  private detectionStartTime: number;
  
  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.detectionStartTime = Date.now();
  }
  
  /**
   * Run the complete detection pipeline
   */
  async detect(): Promise<DetectionResult> {
    // Phase 1: Check unique signatures (fastest)
    const uniqueResult = await this.checkUniqueSignatures();
    if (uniqueResult) {
      return this.createResult(uniqueResult, 'unique');
    }
    
    // Phase 2: Check directory patterns
    const dirResult = await this.checkDirectoryPatterns();
    if (dirResult && dirResult.confidence && dirResult.confidence > 80) {
      return this.createResult(dirResult, 'directory');
    }
    
    // Phase 3: Check file combinations
    const comboResult = await this.checkCombinations();
    if (comboResult && comboResult.confidence && comboResult.confidence > 70) {
      return this.createResult(comboResult, 'combination');
    }
    
    // Phase 4: Package analysis fallback
    const packageResult = await this.analyzePackages();
    return this.createResult(packageResult, 'package');
  }
  
  /**
   * Check for unique file signatures
   */
  private async checkUniqueSignatures(): Promise<Partial<DetectionResult> | null> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    for (const [file, signature] of Object.entries(UNIQUE_SIGNATURES)) {
      const filePath = path.join(this.projectPath, file);
      try {
        await fs.access(filePath);
        
        // File exists, check additional conditions if needed
        if (signature.additionalCheck) {
          const content = await fs.readFile(filePath, 'utf-8');
          if (!content.includes(signature.additionalCheck.split(':')[1])) {
            continue;
          }
        }
        
        // Get version if needed
        let version: string | undefined;
        if (signature.versionCheck) {
          version = await this.getVersionFromPackageJson(signature.versionCheck);
        }
        
        return {
          framework: signature.framework,
          confidence: signature.confidence,
          version,
          ecosystem: signature.ecosystem,
          language: signature.language,
          features: []
        };
      } catch {
        // File doesn't exist, continue checking
        continue;
      }
    }
    
    return null;
  }
  
  /**
   * Check directory patterns
   */
  private async checkDirectoryPatterns(): Promise<Partial<DetectionResult> | null> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    for (const [pattern, signature] of Object.entries(DIRECTORY_PATTERNS)) {
      const fullPath = path.join(this.projectPath, pattern);
      try {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory() || stats.isFile()) {
          return {
            framework: signature.framework,
            confidence: signature.confidence,
            language: signature.language,
            features: []
          };
        }
      } catch {
        continue;
      }
    }
    
    return null;
  }
  
  /**
   * Check file combinations
   */
  private async checkCombinations(): Promise<Partial<DetectionResult> | null> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    for (const [key, pattern] of Object.entries(COMBINATION_PATTERNS)) {
      let allFilesExist = true;
      
      for (const file of pattern.files) {
        const filePath = path.join(this.projectPath, file);
        try {
          await fs.access(filePath);
        } catch {
          allFilesExist = false;
          break;
        }
      }
      
      if (allFilesExist) {
        // Check additional conditions
        if ('checks' in pattern && pattern.checks) {
          const packageJson = await this.readPackageJson();
          if (packageJson) {
            for (const check of ('checks' in pattern ? pattern.checks : [])) {
              const deps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
              };
              if (!deps[check]) {
                allFilesExist = false;
                break;
              }
            }
          }
        }
        
        if (allFilesExist) {
          return {
            framework: pattern.framework,
            confidence: pattern.confidence,
            features: pattern.features || [],
            language: pattern.language
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Analyze package.json as fallback
   */
  private async analyzePackages(): Promise<Partial<DetectionResult>> {
    const packageJson = await this.readPackageJson();
    
    if (!packageJson) {
      return {
        framework: 'Unknown',
        confidence: 0,
        features: []
      };
    }
    
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    // Check for common frameworks in dependencies
    const frameworkChecks = [
      { dep: 'next', framework: 'Next.js' },
      { dep: '@angular/core', framework: 'Angular' },
      { dep: 'vue', framework: 'Vue' },
      { dep: 'react', framework: 'React' },
      { dep: 'svelte', framework: 'Svelte' },
      { dep: '@remix-run/node', framework: 'Remix' },
      { dep: 'gatsby', framework: 'Gatsby' },
      { dep: 'astro', framework: 'Astro' },
      { dep: '@nestjs/core', framework: 'NestJS' },
      { dep: 'express', framework: 'Express.js' },
      { dep: 'fastify', framework: 'Fastify' }
    ];
    
    for (const check of frameworkChecks) {
      if (deps[check.dep]) {
        return {
          framework: check.framework,
          confidence: 70,
          version: deps[check.dep],
          features: Object.keys(deps).slice(0, 10),
          language: 'JavaScript/TypeScript'
        };
      }
    }
    
    return {
      framework: 'Node.js Project',
      confidence: 50,
      features: Object.keys(deps).slice(0, 10),
      language: 'JavaScript/TypeScript'
    };
  }
  
  /**
   * Helper: Read package.json
   */
  private async readPackageJson(): Promise<any> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const content = await fs.readFile(
        path.join(this.projectPath, 'package.json'),
        'utf-8'
      );
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  
  /**
   * Helper: Get version from package.json
   */
  private async getVersionFromPackageJson(check: string): Promise<string | undefined> {
    const [file, dep] = check.split(':');
    if (file !== 'package.json') {return undefined;}
    
    const packageJson = await this.readPackageJson();
    if (!packageJson) {return undefined;}
    
    return packageJson.dependencies?.[dep] || 
           packageJson.devDependencies?.[dep];
  }
  
  /**
   * Create final detection result
   */
  private createResult(
    partial: Partial<DetectionResult>,
    detectedBy: DetectionResult['detectedBy']
  ): DetectionResult {
    return {
      framework: partial.framework || 'Unknown',
      confidence: partial.confidence || 0,
      version: partial.version,
      ecosystem: partial.ecosystem,
      language: partial.language,
      features: partial.features || [],
      deployment: partial.deployment,
      database: partial.database,
      testing: partial.testing,
      monorepo: partial.monorepo,
      detectedBy,
      detectionTime: Date.now() - this.detectionStartTime
    };
  }
}

/**
 * Export a simple detection function for CLI usage
 */
export async function detectFramework(projectPath: string = '.'): Promise<DetectionResult> {
  const detector = new FrameworkDetector(projectPath);
  return detector.detect();
}

/**
 * CLI Usage Example
 */
if (require.main === module) {
  detectFramework(process.argv[2] || '.').then(result => {
    console.log('🏎️ Framework Detection Result:');
    console.log(`   Framework: ${result.framework} (${result.confidence}% confidence)`);
    console.log(`   Language: ${result.language || 'Unknown'}`);
    console.log(`   Ecosystem: ${result.ecosystem || 'Unknown'}`);
    console.log(`   Detected by: ${result.detectedBy}`);
    console.log(`   Detection time: ${result.detectionTime}ms`);
    
    if (result.version) {
      console.log(`   Version: ${result.version}`);
    }
    
    if (result.features.length > 0) {
      console.log(`   Features: ${result.features.join(', ')}`);
    }
  });
}