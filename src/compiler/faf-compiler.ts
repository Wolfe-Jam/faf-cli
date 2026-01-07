/**
 * 🏎️ FAF Scoring Compiler
 * Deterministic, multi-pass compiler for .faf scoring
 *
 * Philosophy: Like Svelte, we compile away the complexity
 * Result: Pure, traceable, reproducible scores
 */

import { parse as parseYAML } from '../fix-once/yaml';
import * as crypto from 'crypto';
import { ChromeExtensionDetector } from '../utils/chrome-extension-detector';
import { FabFormatsProcessor } from '../engines/fab-formats-processor';
import * as path from 'path';

// ============================================================================
// TYPE_DEFINITIONS - Single Source of Truth for Project Types
// ============================================================================
// Design: 21 slots always exist. Types define which slots COUNT toward scoring.
// slot_ignore in .faf file overrides type defaults for edge cases.

/**
 * All 21 slots in the FAF system
 */
const ALL_SLOTS = {
  // Project slots (3)
  project: ['project.name', 'project.goal', 'project.main_language'],

  // Frontend slots (4)
  frontend: ['stack.frontend', 'stack.css_framework', 'stack.ui_library', 'stack.state_management'],

  // Backend slots (5)
  backend: ['stack.backend', 'stack.api_type', 'stack.runtime', 'stack.database', 'stack.connection'],

  // Universal slots (3)
  universal: ['stack.hosting', 'stack.build', 'stack.cicd'],

  // Human context slots (6)
  human: ['human.who', 'human.what', 'human.why', 'human.where', 'human.when', 'human.how']
} as const;

/**
 * TYPE_DEFINITIONS - Maps project types to their applicable slots
 *
 * Each type specifies which slot categories count toward scoring.
 * slot_ignore in .faf can override these for edge cases.
 */
const TYPE_DEFINITIONS: Record<string, {
  description: string;
  categories: ('project' | 'frontend' | 'backend' | 'universal' | 'human')[];
  aliases?: string[];
}> = {
  // ============================================================================
  // CLI/Tool Types (9 slots: project + human)
  // ============================================================================
  'cli': {
    description: 'Command-line interface tool',
    categories: ['project', 'human'],
    aliases: ['cli-tool', 'command-line', 'cli-ts', 'cli-js']
  },
  'cli-tool': {
    description: 'Command-line interface tool',
    categories: ['project', 'human']
  },

  // ============================================================================
  // Library/Package Types (9 slots: project + human)
  // ============================================================================
  'library': {
    description: 'Reusable code library/package',
    categories: ['project', 'human'],
    aliases: ['lib', 'package', 'typescript', 'pure_typescript']
  },
  'npm-package': {
    description: 'NPM package',
    categories: ['project', 'human']
  },
  'pip-package': {
    description: 'Python pip package',
    categories: ['project', 'human'],
    aliases: ['pypi']
  },
  'crate': {
    description: 'Rust crate',
    categories: ['project', 'human'],
    aliases: ['rust-crate', 'zig']
  },
  'gem': {
    description: 'Ruby gem',
    categories: ['project', 'human'],
    aliases: ['ruby-gem']
  },

  // ============================================================================
  // AI/ML Types
  // ============================================================================
  'mcp-server': {
    description: 'Model Context Protocol server',
    categories: ['project', 'backend', 'human']
  },
  'data-science': {
    description: 'Data science/analysis project',
    categories: ['project', 'backend', 'human'],
    aliases: ['data-analysis', 'analytics']
  },
  'ml-model': {
    description: 'Machine learning model',
    categories: ['project', 'backend', 'human'],
    aliases: ['ai-model', 'ml', 'machine-learning']
  },
  'jupyter': {
    description: 'Jupyter notebook project',
    categories: ['project', 'human'],
    aliases: ['notebook', 'ipynb']
  },
  'data-pipeline': {
    description: 'Data pipeline/ETL',
    categories: ['project', 'backend', 'human'],
    aliases: ['etl', 'pipeline']
  },

  // ============================================================================
  // API/Backend Types
  // ============================================================================
  'backend-api': {
    description: 'Backend API service',
    categories: ['project', 'backend', 'universal', 'human'],
    aliases: ['api', 'backend', 'rest-api']
  },
  'node-api': {
    description: 'Node.js API service',
    categories: ['project', 'backend', 'universal', 'human'],
    aliases: ['express', 'fastify', 'nest', 'nodejs_native', 'nodejs_esm_native']
  },
  'python-api': {
    description: 'Python API service',
    categories: ['project', 'backend', 'universal', 'human'],
    aliases: ['flask', 'fastapi', 'django-api', 'python-flask', 'python-fastapi', 'python-starlette']
  },
  'python-app': {
    description: 'Python application',
    categories: ['project', 'backend', 'human'],
    aliases: ['python-generic']
  },
  'go-api': {
    description: 'Go API service',
    categories: ['project', 'backend', 'universal', 'human'],
    aliases: ['golang', 'gin', 'fiber', 'go']
  },
  'rust-api': {
    description: 'Rust API service',
    categories: ['project', 'backend', 'universal', 'human'],
    aliases: ['actix', 'axum', 'rocket', 'rust']
  },
  'graphql': {
    description: 'GraphQL API service',
    categories: ['project', 'backend', 'universal', 'human'],
    aliases: ['graphql-api']
  },
  'microservice': {
    description: 'Microservice',
    categories: ['project', 'backend', 'universal', 'human'],
    aliases: ['service']
  },

  // ============================================================================
  // Frontend Types
  // ============================================================================
  'frontend': {
    description: 'Frontend-only web application',
    categories: ['project', 'frontend', 'universal', 'human']
  },
  'svelte': {
    description: 'Svelte web application',
    categories: ['project', 'frontend', 'universal', 'human'],
    aliases: ['sveltekit', 'svelte_native', 'svelte_5_runes_native']
  },
  'react': {
    description: 'React web application',
    categories: ['project', 'frontend', 'universal', 'human'],
    aliases: ['reactjs', 'react_native', 'react_17_native']
  },
  'vue': {
    description: 'Vue.js web application',
    categories: ['project', 'frontend', 'universal', 'human'],
    aliases: ['vuejs', 'nuxt', 'vue_native']
  },
  'angular': {
    description: 'Angular web application',
    categories: ['project', 'frontend', 'universal', 'human']
  },
  'nextjs': {
    description: 'Next.js application',
    categories: ['project', 'frontend', 'backend', 'universal', 'human'],
    aliases: ['next', 'nextjs_native']
  },
  'remix': {
    description: 'Remix application',
    categories: ['project', 'frontend', 'backend', 'universal', 'human']
  },
  'astro': {
    description: 'Astro static site',
    categories: ['project', 'frontend', 'universal', 'human']
  },
  'solid': {
    description: 'SolidJS application',
    categories: ['project', 'frontend', 'universal', 'human'],
    aliases: ['solidjs']
  },
  'qwik': {
    description: 'Qwik application',
    categories: ['project', 'frontend', 'universal', 'human']
  },

  // ============================================================================
  // Fullstack Types
  // ============================================================================
  'fullstack': {
    description: 'Full-stack web application',
    categories: ['project', 'frontend', 'backend', 'universal', 'human']
  },
  't3': {
    description: 'T3 Stack (Next.js + tRPC + Prisma)',
    categories: ['project', 'frontend', 'backend', 'universal', 'human'],
    aliases: ['t3-stack', 'create-t3-app']
  },
  'mern': {
    description: 'MERN Stack (MongoDB + Express + React + Node)',
    categories: ['project', 'frontend', 'backend', 'universal', 'human']
  },
  'mean': {
    description: 'MEAN Stack (MongoDB + Express + Angular + Node)',
    categories: ['project', 'frontend', 'backend', 'universal', 'human']
  },
  'lamp': {
    description: 'LAMP Stack (Linux + Apache + MySQL + PHP)',
    categories: ['project', 'frontend', 'backend', 'universal', 'human']
  },
  'django': {
    description: 'Django web application',
    categories: ['project', 'frontend', 'backend', 'universal', 'human'],
    aliases: ['python-django']
  },
  'rails': {
    description: 'Ruby on Rails application',
    categories: ['project', 'frontend', 'backend', 'universal', 'human'],
    aliases: ['ruby-on-rails', 'ror']
  },
  'laravel': {
    description: 'Laravel PHP application',
    categories: ['project', 'frontend', 'backend', 'universal', 'human']
  },

  // ============================================================================
  // Mobile Types
  // ============================================================================
  'mobile': {
    description: 'Mobile application',
    categories: ['project', 'frontend', 'human'],
    aliases: ['mobile-app']
  },
  'react-native': {
    description: 'React Native mobile app',
    categories: ['project', 'frontend', 'human'],
    aliases: ['rn', 'expo']
  },
  'flutter': {
    description: 'Flutter mobile app',
    categories: ['project', 'frontend', 'human'],
    aliases: ['dart']
  },
  'ios': {
    description: 'iOS native app',
    categories: ['project', 'frontend', 'human'],
    aliases: ['swift', 'swiftui']
  },
  'android': {
    description: 'Android native app',
    categories: ['project', 'frontend', 'human'],
    aliases: ['kotlin', 'kotlin-android']
  },
  'ionic': {
    description: 'Ionic mobile app',
    categories: ['project', 'frontend', 'human'],
    aliases: ['capacitor']
  },

  // ============================================================================
  // Desktop Types
  // ============================================================================
  'desktop': {
    description: 'Desktop application',
    categories: ['project', 'frontend', 'human'],
    aliases: ['desktop-app']
  },
  'electron': {
    description: 'Electron desktop app',
    categories: ['project', 'frontend', 'human']
  },
  'tauri': {
    description: 'Tauri desktop app',
    categories: ['project', 'frontend', 'human']
  },
  'qt': {
    description: 'Qt desktop application',
    categories: ['project', 'frontend', 'human'],
    aliases: ['pyqt', 'pyside']
  },
  'gtk': {
    description: 'GTK desktop application',
    categories: ['project', 'frontend', 'human']
  },

  // ============================================================================
  // Browser Extensions
  // ============================================================================
  'chrome-extension': {
    description: 'Chrome browser extension',
    categories: ['project', 'human'],
    aliases: ['browser-extension', 'extension']
  },
  'firefox-extension': {
    description: 'Firefox browser extension',
    categories: ['project', 'human'],
    aliases: ['firefox-addon']
  },
  'safari-extension': {
    description: 'Safari browser extension',
    categories: ['project', 'human']
  },

  // ============================================================================
  // Automation/Workflow Types
  // ============================================================================
  'n8n-workflow': {
    description: 'n8n automation workflow',
    categories: ['project', 'backend', 'human'],
    aliases: ['n8n']
  },
  'zapier': {
    description: 'Zapier integration',
    categories: ['project', 'human']
  },
  'github-action': {
    description: 'GitHub Action',
    categories: ['project', 'human'],
    aliases: ['gha', 'action']
  },

  // ============================================================================
  // DevOps/Infrastructure Types
  // ============================================================================
  'terraform': {
    description: 'Terraform infrastructure',
    categories: ['project', 'human'],
    aliases: ['tf', 'iac']
  },
  'kubernetes': {
    description: 'Kubernetes configuration',
    categories: ['project', 'human'],
    aliases: ['k8s', 'helm']
  },
  'docker': {
    description: 'Docker/container configuration',
    categories: ['project', 'human'],
    aliases: ['dockerfile', 'container']
  },
  'ansible': {
    description: 'Ansible playbooks',
    categories: ['project', 'human']
  },
  'pulumi': {
    description: 'Pulumi infrastructure',
    categories: ['project', 'human']
  },
  'infrastructure': {
    description: 'Infrastructure as code',
    categories: ['project', 'human'],
    aliases: ['infra', 'devops']
  },

  // ============================================================================
  // Static Sites / Documentation
  // ============================================================================
  'static-html': {
    description: 'Static HTML website',
    categories: ['project', 'frontend', 'human'],
    aliases: ['static-site', 'html']
  },
  'landing-page': {
    description: 'Landing page website',
    categories: ['project', 'frontend', 'human'],
    aliases: ['landing']
  },
  'documentation': {
    description: 'Documentation site',
    categories: ['project', 'frontend', 'human'],
    aliases: ['docs']
  },
  'docusaurus': {
    description: 'Docusaurus documentation site',
    categories: ['project', 'frontend', 'human']
  },
  'mkdocs': {
    description: 'MkDocs documentation site',
    categories: ['project', 'human']
  },
  'cookbook': {
    description: 'Example-driven developer onboarding hub with notebooks, scripts, configs, and progressive demos',
    categories: ['project', 'human'],
    aliases: ['examples', 'tutorials', 'demos', 'samples']
  },
  'vitepress': {
    description: 'VitePress documentation site',
    categories: ['project', 'frontend', 'human']
  },
  'storybook': {
    description: 'Storybook component library',
    categories: ['project', 'frontend', 'human']
  },

  // ============================================================================
  // CMS Types
  // ============================================================================
  'wordpress': {
    description: 'WordPress site/plugin/theme',
    categories: ['project', 'frontend', 'backend', 'universal', 'human'],
    aliases: ['wp']
  },
  'cms': {
    description: 'Content management system',
    categories: ['project', 'frontend', 'backend', 'human']
  },
  'strapi': {
    description: 'Strapi headless CMS',
    categories: ['project', 'backend', 'universal', 'human']
  },
  'sanity': {
    description: 'Sanity.io CMS',
    categories: ['project', 'backend', 'human']
  },
  'contentful': {
    description: 'Contentful CMS integration',
    categories: ['project', 'human']
  },

  // ============================================================================
  // Game Development Types
  // ============================================================================
  'game': {
    description: 'Game project',
    categories: ['project', 'frontend', 'human'],
    aliases: ['gamedev']
  },
  'unity': {
    description: 'Unity game',
    categories: ['project', 'frontend', 'human'],
    aliases: ['unity3d']
  },
  'godot': {
    description: 'Godot game',
    categories: ['project', 'frontend', 'human']
  },
  'unreal': {
    description: 'Unreal Engine game',
    categories: ['project', 'frontend', 'human'],
    aliases: ['ue4', 'ue5']
  },
  'phaser': {
    description: 'Phaser.js game',
    categories: ['project', 'frontend', 'human']
  },
  'threejs': {
    description: 'Three.js 3D project',
    categories: ['project', 'frontend', 'human'],
    aliases: ['three', '3d', 'webgl']
  },

  // ============================================================================
  // Blockchain/Web3 Types
  // ============================================================================
  'smart-contract': {
    description: 'Smart contract',
    categories: ['project', 'human'],
    aliases: ['solidity', 'contract']
  },
  'dapp': {
    description: 'Decentralized application',
    categories: ['project', 'frontend', 'human'],
    aliases: ['web3', 'blockchain']
  },
  'hardhat': {
    description: 'Hardhat Ethereum project',
    categories: ['project', 'human']
  },
  'foundry': {
    description: 'Foundry Ethereum project',
    categories: ['project', 'human'],
    aliases: ['forge']
  },

  // ============================================================================
  // Monorepo Types
  // Monorepos are CONTAINERS - they need ALL slots because they can contain
  // any combination of frontend, backend, libraries, etc.
  // The monorepo root .faf describes the overall architecture.
  // Individual packages can have their own .faf files with specific types.
  // ============================================================================
  'monorepo': {
    description: 'Monorepo - multi-package repository',
    categories: ['project', 'frontend', 'backend', 'universal', 'human'],
    aliases: ['mono', 'workspace']
  },
  'turborepo': {
    description: 'Turborepo monorepo',
    categories: ['project', 'frontend', 'backend', 'universal', 'human'],
    aliases: ['turbo']
  },
  'nx': {
    description: 'Nx monorepo',
    categories: ['project', 'frontend', 'backend', 'universal', 'human']
  },
  'lerna': {
    description: 'Lerna monorepo',
    categories: ['project', 'frontend', 'backend', 'universal', 'human']
  },
  'pnpm-workspace': {
    description: 'pnpm workspace monorepo',
    categories: ['project', 'frontend', 'backend', 'universal', 'human'],
    aliases: ['pnpm-mono']
  },
  'yarn-workspace': {
    description: 'Yarn workspace monorepo',
    categories: ['project', 'frontend', 'backend', 'universal', 'human'],
    aliases: ['yarn-mono']
  },

  // ============================================================================
  // Embedded/Systems Types
  // ============================================================================
  'embedded': {
    description: 'Embedded systems',
    categories: ['project', 'human'],
    aliases: ['firmware', 'iot']
  },
  'arduino': {
    description: 'Arduino project',
    categories: ['project', 'human']
  },
  'raspberry-pi': {
    description: 'Raspberry Pi project',
    categories: ['project', 'human'],
    aliases: ['rpi']
  },
  'wasm': {
    description: 'WebAssembly module',
    categories: ['project', 'human'],
    aliases: ['webassembly']
  },

  // ============================================================================
  // Testing Types
  // ============================================================================
  'test-suite': {
    description: 'Test suite/framework',
    categories: ['project', 'human'],
    aliases: ['testing', 'tests']
  },
  'e2e-tests': {
    description: 'End-to-end test suite',
    categories: ['project', 'human'],
    aliases: ['e2e', 'playwright', 'cypress']
  },

  // ============================================================================
  // Default
  // ============================================================================
  'generic': {
    description: 'Generic project (fallback)',
    categories: ['project', 'universal', 'human'],
    aliases: ['latest-idea']
  }
};

/**
 * Get applicable slots for a project type
 */
export function getSlotsForType(projectType: string): string[] {
  // Check for aliases first
  for (const [type, def] of Object.entries(TYPE_DEFINITIONS)) {
    if (def.aliases?.includes(projectType)) {
      projectType = type;
      break;
    }
  }

  const typeDef = TYPE_DEFINITIONS[projectType] || TYPE_DEFINITIONS['generic'];
  const slots: string[] = [];

  for (const category of typeDef.categories) {
    slots.push(...ALL_SLOTS[category]);
  }

  return slots;
}

/**
 * Get the number of applicable slots for a project type
 * Used by yaml-generator to calculate correct slot_based_percentage
 */
export function getSlotCountForType(projectType: string): number {
  return getSlotsForType(projectType).length;
}

/**
 * Parse slot_ignore from .faf content
 * Accepts: slot_ignore: [hosting, cicd] or slot_ignore: hosting, cicd
 */
function parseSlotIgnore(ast: any): string[] {
  const slotIgnore = ast.slot_ignore || ast.slotIgnore || ast.ignore_slots;
  if (!slotIgnore) {return [];}

  // Handle array format
  if (Array.isArray(slotIgnore)) {
    return slotIgnore.map((s: string) => normalizeSlotName(s));
  }

  // Handle string format (comma-separated)
  if (typeof slotIgnore === 'string') {
    return slotIgnore.split(',').map((s: string) => normalizeSlotName(s.trim()));
  }

  return [];
}

/**
 * Normalize slot names to full path
 * Examples: "hosting" -> "stack.hosting", "who" -> "human.who"
 */
function normalizeSlotName(slot: string): string {
  // Already has prefix
  if (slot.includes('.')) {return slot;}

  // Check each category for the slot
  for (const [_category, slots] of Object.entries(ALL_SLOTS)) {
    const fullSlot = slots.find(s => s.endsWith(`.${slot}`));
    if (fullSlot) {return fullSlot;}
  }

  // Return as-is if not found (will be ignored)
  return slot;
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface CompilationResult {
  score: number;
  filled: number;
  total: number;
  breakdown: SectionBreakdown;
  trace: CompilationTrace;
  diagnostics: Diagnostic[];
  ir: IntermediateRepresentation;
  checksum: string;
}

interface SectionBreakdown {
  project: SlotSection;
  stack: SlotSection;
  human: SlotSection;
  discovery: SlotSection;
}

interface SlotSection {
  filled: number;
  total: number;
  percentage: number;
  slots: SlotInfo[];
}

interface SlotInfo {
  id: string;
  value: any;
  filled: boolean;
  source: 'original' | 'discovered' | 'default';
  points: number;
}

interface CompilationTrace {
  version: string;
  timestamp: string;
  inputHash: string;
  passes: PassResult[];
}

interface PassResult {
  name: string;
  duration: number;
  input: any;
  output: any;
  changes: string[];
}

interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: {
    line: number;
    column: number;
    field: string;
  };
  suggestion?: string;
}

interface IntermediateRepresentation {
  version: string;
  slots: IRSlot[];
  metadata: Record<string, any>;
}

interface IRSlot {
  id: string;
  path: string;
  value: any;
  type: string;
  source: 'original' | 'discovered';
  weight: number;
  filled: boolean;
}

// ============================================================================
// Main Compiler Class
// ============================================================================

export class FafCompiler {
  private static readonly VERSION = '3.0.0-compiler';
  private static readonly COMPILER_ID = 'faf-compiler-v3';

  private diagnostics: Diagnostic[] = [];
  private trace: CompilationTrace;
  private ir: IntermediateRepresentation;

  constructor() {
    this.trace = {
      version: FafCompiler.VERSION,
      timestamp: new Date().toISOString(),
      inputHash: '',
      passes: []
    };
    this.ir = {
      version: FafCompiler.VERSION,
      slots: [],
      metadata: {}
    };
  }

  /**
   * Main compilation pipeline
   */
  async compile(fafPath: string): Promise<CompilationResult> {
    // Reset state for new compilation
    this.diagnostics = [];
    this.trace.passes = [];
    this.ir.slots = [];

    try {
      // PASS 1: Parse
      const source = await this.readSource(fafPath);
      const ast = this.parse(source);

      // PASS 2: Analyze
      const analyzed = this.analyze(ast);

      // PASS 3: Optimize (with discovery)
      const optimized = await this.optimize(analyzed, fafPath);

      // PASS 4: Generate
      const result = this.generate(optimized);

      // Add final checksum
      const checksum = this.calculateChecksum(result);

      return {
        ...result,
        trace: this.trace,
        diagnostics: this.diagnostics,
        ir: this.ir,
        checksum
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addDiagnostic('error', `Compilation failed: ${message}`);
      throw error;
    }
  }

  // ============================================================================
  // PASS 1: Parser
  // ============================================================================

  private async readSource(fafPath: string): Promise<string> {
    const start = Date.now();
    const fs = await import('fs/promises');

    try {
      const source = await fs.readFile(fafPath, 'utf-8');
      this.trace.inputHash = crypto.createHash('md5').update(source).digest('hex');

      this.recordPass('read', start, fafPath, source.length, [
        `Read ${source.length} bytes from ${fafPath}`
      ]);

      return source;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addDiagnostic('error', `Cannot read file: ${fafPath}`, undefined, message);
      throw error;
    }
  }

  private parse(source: string): any {
    const start = Date.now();

    try {
      const ast = parseYAML(source);

      if (!ast || typeof ast !== 'object') {
        this.addDiagnostic('error', 'Invalid YAML: must be an object');
        return {};
      }

      this.recordPass('parse', start, source.length, ast, [
        `Parsed YAML into AST with ${Object.keys(ast).length} top-level keys`
      ]);

      return ast;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addDiagnostic('error', `Parse error: ${message}`);
      return {};
    }
  }

  // ============================================================================
  // PASS 2: Analyzer
  // ============================================================================

  private analyze(ast: any): any {
    const start = Date.now();
    const analyzed = { ...ast };
    const changes: string[] = [];

    // Validate and normalize structure
    if (!analyzed.project) {
      analyzed.project = {};
      changes.push('Added missing project section');
    }
    if (!analyzed.stack) {
      analyzed.stack = {};
      changes.push('Added missing stack section');
    }
    if (!analyzed.human_context) {
      analyzed.human_context = {};
      changes.push('Added missing human_context section');
    }

    // Type validation
    this.validateTypes(analyzed);

    // Check for deprecated fields
    if (analyzed.ai_score !== undefined) {
      this.addDiagnostic('warning', 'Embedded ai_score is deprecated and will be ignored');
      delete analyzed.ai_score;
      changes.push('Removed deprecated ai_score');
    }

    this.recordPass('analyze', start, ast, analyzed, changes);
    return analyzed;
  }

  private validateTypes(data: any): void {
    // Project validation
    if (data.project?.name && typeof data.project.name !== 'string') {
      this.addDiagnostic('error', 'project.name must be a string', {
        line: 0, column: 0, field: 'project.name'
      });
    }

    // Stack validation
    const stackFields = ['frontend', 'backend', 'database', 'hosting'];
    for (const field of stackFields) {
      if (data.stack?.[field] && typeof data.stack[field] !== 'string') {
        this.addDiagnostic('error', `stack.${field} must be a string`, {
          line: 0, column: 0, field: `stack.${field}`
        });
      }
    }

    // Human context validation
    const humanFields = ['who', 'what', 'why', 'where', 'when', 'how'];
    for (const field of humanFields) {
      const value = data.human_context?.[field];
      if (value && typeof value !== 'string' && typeof value !== 'object') {
        this.addDiagnostic('warning', `human_context.${field} should be a string or object`);
      }
    }
  }

  // ============================================================================
  // PASS 3: Optimizer (with Discovery)
  // ============================================================================

  private async optimize(ast: any, fafPath: string): Promise<any> {
    const start = Date.now();
    const optimized = { ...ast };
    const changes: string[] = [];

    // Discovery phase
    if (fafPath) {
      try {
        const projectDir = path.dirname(fafPath);
        const discovered = await this.discover(projectDir);

        // Apply discovered values WITHOUT mutation
        optimized._discovered = discovered;
        changes.push(`Discovered ${Object.keys(discovered).length} items`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.addDiagnostic('warning', `Discovery failed: ${message}`);
      }
    }

    // Remove None/Unknown values (optimization)
    this.removeDefaults(optimized, changes);

    this.recordPass('optimize', start, ast, optimized, changes);
    return optimized;
  }

  private async discover(projectDir: string): Promise<Record<string, any>> {
    const processor = new FabFormatsProcessor();
    const analysis = await processor.processFiles(projectDir);

    const discovered: Record<string, any> = {};

    if (analysis.context) {
      const ctx = analysis.context;

      // Map discovered items (WITHOUT modifying original)
      if (ctx.projectName) {discovered.projectName = ctx.projectName;}
      if (ctx.mainLanguage) {discovered.mainLanguage = ctx.mainLanguage;}
      if (ctx.framework) {discovered.framework = ctx.framework;}
      if (ctx.database) {discovered.database = ctx.database;}
      if (ctx.backend) {discovered.backend = ctx.backend;}
      if (ctx.hosting) {discovered.hosting = ctx.hosting;}
      if (ctx.buildTool) {discovered.buildTool = ctx.buildTool;}
    }

    return discovered;
  }

  private removeDefaults(data: any, changes: string[]): void {
    const defaults = ['None', 'Unknown', 'Not specified', 'N/A'];

    const removeFromObject = (obj: any, path: string) => {
      for (const key in obj) {
        const value = obj[key];
        const fullPath = path ? `${path}.${key}` : key;

        if (defaults.includes(value)) {
          delete obj[key];
          changes.push(`Removed default value at ${fullPath}`);
        } else if (typeof value === 'object' && value !== null) {
          removeFromObject(value, fullPath);
        }
      }
    };

    removeFromObject(data, '');
  }

  // ============================================================================
  // PASS 4: Generator
  // ============================================================================

  private generate(ast: any): Omit<CompilationResult, 'trace' | 'diagnostics' | 'ir' | 'checksum'> {
    const start = Date.now();

    // Build IR first
    const ir = this.buildIR(ast);
    this.ir = {
      version: FafCompiler.VERSION,
      slots: ir,
      metadata: { compiled: new Date().toISOString() }
    };

    // Calculate from IR
    const slots = this.calculateSlots(ir);
    const score = this.calculateScore(slots);

    const result = {
      score: Math.round(score),
      filled: slots.filled,
      total: slots.total,
      breakdown: slots.breakdown
    };

    this.recordPass('generate', start, ast, result, [
      `Generated score: ${result.score}% (${result.filled}/${result.total} slots)`
    ]);

    return result;
  }

  private buildIR(ast: any): IRSlot[] {
    const slots: IRSlot[] = [];

    // Detect project type to determine applicable slots
    const projectType = this.detectProjectTypeFromContext(ast);
    if (process.env.FAF_DEBUG) {
      console.log(`\n[DEBUG] Project type detected: ${projectType}`);
    }

    // Parse slot_ignore from the .faf file
    const ignoredSlots = parseSlotIgnore(ast);
    if (process.env.FAF_DEBUG && ignoredSlots.length > 0) {
      console.log(`[DEBUG] slot_ignore: ${ignoredSlots.join(', ')}`);
    }

    // Get applicable slots for this project type
    const applicableSlots = getSlotsForType(projectType);
    if (process.env.FAF_DEBUG) {
      console.log(`[DEBUG] Applicable slots (${applicableSlots.length}): ${applicableSlots.join(', ')}`);
    }

    // Filter out ignored slots
    const activeSlots = applicableSlots.filter(slot => !ignoredSlots.includes(slot));
    if (process.env.FAF_DEBUG && ignoredSlots.length > 0) {
      console.log(`[DEBUG] Active slots after ignore (${activeSlots.length}): ${activeSlots.join(', ')}`);
    }

    // Helper to get value from ast based on slot path
    // Checks both nested structure (project.goal) AND flat structure (projectGoal)
    // to handle inconsistency between init (nested) and sync (flat)
    const getSlotValue = (slotPath: string): any => {
      const parts = slotPath.split('.');
      if (parts[0] === 'project') {
        // Check nested first, then flat fallback
        const nested = ast.project?.[parts[1]];
        if (nested !== undefined && nested !== null) return nested;
        // Flat fallback: project.goal -> projectGoal, project.name -> projectName
        const flatKey = 'project' + parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
        return ast[flatKey];
      } else if (parts[0] === 'stack') {
        return ast.stack?.[parts[1]];
      } else if (parts[0] === 'human') {
        return ast.human_context?.[parts[1]];
      }
      return undefined;
    };

    // Add all active slots to the IR
    for (const slotPath of activeSlots) {
      const value = getSlotValue(slotPath);
      this.addSlot(slots, slotPath, value, 'string', 'original', 1);
    }

    // Special handling for certain project types (auto-fill missing values)
    // Chrome Extension: auto-fill technical context
    if (projectType === 'chrome-extension') {
      if (!ast.stack) {ast.stack = {};}
      if (!ast.stack.runtime) {ast.stack.runtime = 'Chrome/Browser';}
      if (!ast.stack.hosting) {ast.stack.hosting = 'Chrome Web Store';}
      if (!ast.stack.api_type) {ast.stack.api_type = 'Chrome Extension APIs';}
      if (!ast.stack.backend) {ast.stack.backend = 'Service Worker';}
      if (!ast.stack.database) {ast.stack.database = 'chrome.storage API';}

      // Add auto-filled slots (only if they're in the active slots list)
      const chromeSlots = ['stack.runtime', 'stack.hosting', 'stack.api_type', 'stack.backend', 'stack.database'];
      for (const slot of chromeSlots) {
        if (activeSlots.includes(slot) && !slots.find(s => s.path === slot)) {
          this.addSlot(slots, slot, getSlotValue(slot), 'string', 'discovered', 1);
        }
      }
    }

    // Static HTML: auto-fill technical context
    if (projectType === 'static-html' || projectType === 'landing-page') {
      if (!ast.stack) {ast.stack = {};}
      if (!ast.stack.frontend) {ast.stack.frontend = 'HTML/CSS/JavaScript';}
      if (!ast.stack.runtime) {ast.stack.runtime = 'Browser';}
      if (!ast.stack.hosting) {ast.stack.hosting = 'Static Hosting';}
      if (!ast.stack.build) {ast.stack.build = 'Direct HTML (no build step)';}
    }

    // n8n Workflow: auto-fill technical context
    if (projectType === 'n8n-workflow') {
      if (!ast.project) {ast.project = {};}
      if (!ast.project.main_language) {
        ast.project.main_language = ast.tech_stack?.primary_language || 'JSON (workflow definition)';
      }
      if (!ast.stack) {ast.stack = {};}
      if (!ast.stack.runtime) {ast.stack.runtime = ast.tech_stack?.workflow_engine || 'n8n';}
      if (!ast.stack.backend) {ast.stack.backend = 'Node.js (n8n server)';}
      if (!ast.stack.api_type) {ast.stack.api_type = 'Webhooks + HTTP';}
      if (!ast.stack.database) {ast.stack.database = ast.tech_stack?.infrastructure?.vector_db || 'Workflow State';}
      if (!ast.stack.hosting) {ast.stack.hosting = 'n8n Cloud';}
      if (!ast.stack.build) {ast.stack.build = 'n8n Visual Editor';}
    }

    // Discovered slots (if any) - only add if slot is active and not already filled
    if (ast._discovered) {
      const discovered = ast._discovered;
      const mapping: Record<string, string> = {
        'projectName': 'project.name',
        'mainLanguage': 'project.main_language',
        'framework': 'stack.frontend',
        'database': 'stack.database',
        'backend': 'stack.backend',
        'hosting': 'stack.hosting',
        'buildTool': 'stack.build'
      };

      for (const [key, slotPath] of Object.entries(mapping)) {
        if (discovered[key] && activeSlots.includes(slotPath) && !this.hasValue(ast, slotPath)) {
          // Only add to discovery if not already in slots
          if (!slots.find(s => s.path === slotPath)) {
            this.addSlot(slots, `discovery.${slotPath}`, discovered[key], 'string', 'discovered', 1);
          }
        }
      }
    }

    return slots;
  }

  private addSlot(
    slots: IRSlot[],
    path: string,
    value: any,
    type: string,
    source: 'original' | 'discovered',
    weight: number
  ): void {
    // Deduplication: Check if slot path already exists
    const exists = slots.some(slot => slot.path === path);
    if (exists) {
      if (process.env.FAF_DEBUG) {
        console.log(`[DEBUG] Skipped duplicate slot: ${path}`);
      }
      return; // Skip duplicate slot
    }

    const filled = this.isSlotFilled(value);
    if (process.env.FAF_DEBUG) {
      const valueStr = JSON.stringify(value) || '';
      console.log(`[DEBUG] Added slot: ${path} | filled: ${filled} | value: ${valueStr.substring(0, 50)}`);
    }
    slots.push({
      id: `slot_${slots.length + 1}`,
      path,
      value,
      type,
      source,
      weight,
      filled
    });
  }

  private isSlotFilled(value: any): boolean {
    // Handle null, undefined, false explicitly
    if (value === null || value === undefined || value === false) {return false;}

    if (typeof value === 'string') {
      // Also treat string representations of null/undefined as empty
      const empty = ['', 'None', 'Unknown', 'Not specified', 'N/A', 'null', 'undefined', '~'];
      // Also reject generic placeholders that provide no real context
      const genericPlaceholders = [
        'Development teams',
        'Software development solution',
        'Improve development efficiency',
        'Cloud platform',
        'Ongoing development',
        'Modern development practices',
        'Development teams building next-generation software',
        'AI-powered development infrastructure with trust-driven workflows'
      ];
      const trimmed = value.trim();
      return !empty.includes(trimmed) && !genericPlaceholders.includes(trimmed);
    }

    if (typeof value === 'number') {
      // Numbers are valid unless they're NaN or Infinity
      return !isNaN(value) && isFinite(value);
    }

    if (typeof value === 'object') {
      // Arrays and objects need content
      if (Array.isArray(value)) {return value.length > 0;}
      return Object.keys(value).length > 0;
    }

    return true;
  }

  private hasValue(ast: any, path: string): boolean {
    const parts = path.split('.');
    let current = ast;

    for (const part of parts) {
      if (!current || !current[part]) {return false;}
      current = current[part];
    }

    return this.isSlotFilled(current);
  }

  private detectProjectTypeFromContext(ast: any): string {
    // Check for explicit project type first
    if (ast.project?.type) {
      const explicitType = ast.project.type.toLowerCase();
      // Resolve aliases to canonical type
      for (const [type, def] of Object.entries(TYPE_DEFINITIONS)) {
        if (type === explicitType || def.aliases?.includes(explicitType)) {
          return type;
        }
      }
      // If the explicit type is in TYPE_DEFINITIONS, use it directly
      if (TYPE_DEFINITIONS[explicitType]) {
        return explicitType;
      }
      // Unknown explicit type - use as-is (will fall to generic in getSlotsForType)
      return explicitType;
    }

    // Infer from goal and context
    const goal = (ast.project?.goal || '').toLowerCase();
    const what = (ast.human_context?.what || '').toLowerCase();
    const mainLanguage = (ast.project?.main_language || '').toLowerCase();

    // CLI tool indicators (check BEFORE Chrome Extension to avoid false positives)
    if (goal.includes('cli') || what.includes('cli') ||
        goal.includes('command line') || what.includes('command line')) {
      return 'cli';
    }

    // MCP Server indicators
    if (goal.includes('mcp') || what.includes('mcp server') ||
        goal.includes('model context protocol')) {
      return 'mcp-server';
    }

    // Chrome Extension detection with fuzzy matching (only if not CLI)
    const goalDetection = ChromeExtensionDetector.detect(goal);
    const whatDetection = ChromeExtensionDetector.detect(what);

    if (goalDetection.detected || whatDetection.detected ||
        ast.stack?.framework === 'Chrome Extension') {
      return 'chrome-extension';
    }

    // Library indicators
    if (goal.includes('library') || what.includes('library') ||
        goal.includes('package') || what.includes('npm package')) {
      return 'library';
    }

    // API/Backend indicators
    if (goal.includes('api') || what.includes('api') ||
        goal.includes('backend') || what.includes('backend') ||
        ast.stack?.backend && !ast.stack?.frontend) {
      return 'backend-api';
    }

    // Frontend indicators
    if (ast.stack?.frontend || ast.stack?.css_framework || ast.stack?.ui_library) {
      return ast.stack?.backend ? 'fullstack' : 'frontend';
    }

    // Language-based defaults
    if (mainLanguage === 'python') {
      if (ast.stack?.frontend) {return 'fullstack';}
      return 'python-app'; // Could be CLI, API, or data science
    }

    return 'generic';
  }

  private requiresFrontendStack(projectType: string): boolean {
    const frontendTypes = ['frontend', 'fullstack', 'svelte', 'react', 'vue', 'angular'];
    // Chrome extensions don't need traditional frontend stack
    return frontendTypes.includes(projectType) && projectType !== 'chrome-extension';
  }

  private requiresBackendStack(projectType: string): boolean {
    const backendTypes = ['backend-api', 'fullstack', 'cli-tool', 'library', 'python-app', 'node-api'];
    // Chrome extensions don't need traditional backend stack
    return backendTypes.includes(projectType) && projectType !== 'chrome-extension';
  }

  private calculateSlots(ir: IRSlot[]): {
    filled: number;
    total: number;
    breakdown: SectionBreakdown;
  } {
    const sections = {
      project: { filled: 0, total: 0, slots: [] as SlotInfo[] },
      stack: { filled: 0, total: 0, slots: [] as SlotInfo[] },
      human: { filled: 0, total: 0, slots: [] as SlotInfo[] },
      discovery: { filled: 0, total: 0, slots: [] as SlotInfo[] }
    };

    for (const slot of ir) {
      const [section] = slot.path.split('.');
      const sectionKey = section === 'human' ? 'human' :
                       section === 'discovery' ? 'discovery' :
                       section === 'project' ? 'project' : 'stack';

      const sec = sections[sectionKey];
      sec.total++;
      if (slot.filled) {sec.filled++;}

      sec.slots.push({
        id: slot.id,
        value: slot.value,
        filled: slot.filled,
        source: slot.source,
        points: slot.filled ? slot.weight : 0
      });
    }

    // Calculate percentages
    const breakdown: SectionBreakdown = {
      project: {
        ...sections.project,
        percentage: sections.project.total > 0
          ? Math.round((sections.project.filled / sections.project.total) * 100)
          : 0
      },
      stack: {
        ...sections.stack,
        percentage: sections.stack.total > 0
          ? Math.round((sections.stack.filled / sections.stack.total) * 100)
          : 0
      },
      human: {
        ...sections.human,
        percentage: sections.human.total > 0
          ? Math.round((sections.human.filled / sections.human.total) * 100)
          : 0
      },
      discovery: {
        ...sections.discovery,
        percentage: sections.discovery.total > 0
          ? Math.round((sections.discovery.filled / sections.discovery.total) * 100)
          : 0
      }
    };

    const filled = Object.values(sections).reduce((sum, sec) => sum + sec.filled, 0);
    const total = Object.values(sections).reduce((sum, sec) => sum + sec.total, 0);

    return { filled, total, breakdown };
  }

  private calculateScore(slots: { filled: number; total: number }): number {
    if (slots.total === 0) {return 0;}
    return (slots.filled / slots.total) * 100;
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private calculateChecksum(result: any): string {
    const data = JSON.stringify({
      score: result.score,
      filled: result.filled,
      total: result.total,
      version: FafCompiler.VERSION
    });
    return crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
  }

  private recordPass(name: string, startTime: number, input: any, output: any, changes: string[]): void {
    this.trace.passes.push({
      name,
      duration: Date.now() - startTime,
      input: this.sanitize(input),
      output: this.sanitize(output),
      changes
    });
  }

  private sanitize(data: any): any {
    // Limit size for trace
    const str = JSON.stringify(data);
    if (str.length > 1000) {
      return { _truncated: true, size: str.length };
    }
    return data;
  }

  private addDiagnostic(
    severity: 'error' | 'warning' | 'info',
    message: string,
    location?: { line: number; column: number; field: string },
    suggestion?: string
  ): void {
    this.diagnostics.push({ severity, message, location, suggestion });
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Compile with trace output
   */
  async compileWithTrace(fafPath: string): Promise<CompilationResult> {
    const result = await this.compile(fafPath);
    this.printTrace(result);
    return result;
  }

  /**
   * Verify a checksum
   */
  async verify(fafPath: string, checksum: string): Promise<boolean> {
    const result = await this.compile(fafPath);
    return result.checksum === checksum;
  }

  /**
   * Get intermediate representation
   */
  async getIR(fafPath: string): Promise<IntermediateRepresentation> {
    const result = await this.compile(fafPath);
    return result.ir;
  }

  /**
   * Print diagnostic report
   */
  printDiagnostics(): void {
    if (this.diagnostics.length === 0) {
      console.log('✓ No issues found');
      return;
    }

    const byType = {
      error: this.diagnostics.filter(d => d.severity === 'error'),
      warning: this.diagnostics.filter(d => d.severity === 'warning'),
      info: this.diagnostics.filter(d => d.severity === 'info')
    };

    if (byType.error.length > 0) {
      console.log(`\n❌ ${byType.error.length} Errors:`);
      byType.error.forEach(d => {
        console.log(`  ${d.message}`);
        if (d.suggestion) {console.log(`    → ${d.suggestion}`);}
      });
    }

    if (byType.warning.length > 0) {
      console.log(`\n⚠️ ${byType.warning.length} Warnings:`);
      byType.warning.forEach(d => {
        console.log(`  ${d.message}`);
        if (d.suggestion) {console.log(`    → ${d.suggestion}`);}
      });
    }

    if (byType.info.length > 0) {
      console.log(`\nℹ️ ${byType.info.length} Info:`);
      byType.info.forEach(d => {
        console.log(`  ${d.message}`);
      });
    }
  }

  /**
   * Print compilation trace
   */
  private printTrace(result: CompilationResult): void {
    console.log('\n📊 FAF Compilation Trace');
    console.log('═'.repeat(60));
    console.log(`Version: ${result.trace.version}`);
    console.log(`Input Hash: ${result.trace.inputHash}`);
    console.log(`Checksum: ${result.checksum}`);
    console.log();

    console.log('Compilation Passes:');
    result.trace.passes.forEach((pass, i) => {
      console.log(`  ${i + 1}. ${pass.name.toUpperCase()} (${pass.duration}ms)`);
      pass.changes.forEach(change => {
        console.log(`     → ${change}`);
      });
    });

    console.log();
    console.log('Result:');
    console.log(`  Score: ${result.score}%`);
    console.log(`  Filled: ${result.filled}/${result.total} slots`);

    console.log();
    console.log('Breakdown:');
    console.log(`  Project: ${result.breakdown.project.filled}/${result.breakdown.project.total} (${result.breakdown.project.percentage}%)`);
    console.log(`  Stack: ${result.breakdown.stack.filled}/${result.breakdown.stack.total} (${result.breakdown.stack.percentage}%)`);
    console.log(`  Human: ${result.breakdown.human.filled}/${result.breakdown.human.total} (${result.breakdown.human.percentage}%)`);
    if (result.breakdown.discovery.total > 0) {
      console.log(`  Discovery: ${result.breakdown.discovery.filled}/${result.breakdown.discovery.total} (${result.breakdown.discovery.percentage}%)`);
    }

    if (result.diagnostics.length > 0) {
      console.log();
      this.printDiagnostics();
    }

    console.log('═'.repeat(60));
  }
}

// ============================================================================
// Export convenience functions
// ============================================================================

/**
 * Compile a .faf file
 */
export async function compile(fafPath: string): Promise<CompilationResult> {
  const compiler = new FafCompiler();
  return compiler.compile(fafPath);
}

/**
 * Compile with trace output
 */
export async function compileWithTrace(fafPath: string): Promise<CompilationResult> {
  const compiler = new FafCompiler();
  return compiler.compileWithTrace(fafPath);
}

/**
 * Verify a checksum
 */
export async function verify(fafPath: string, checksum: string): Promise<boolean> {
  const compiler = new FafCompiler();
  return compiler.verify(fafPath, checksum);
}