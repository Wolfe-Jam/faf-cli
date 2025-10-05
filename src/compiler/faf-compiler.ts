/**
 * 🏎️ FAF Scoring Compiler
 * Deterministic, multi-pass compiler for .faf scoring
 *
 * Philosophy: Like Svelte, we compile away the complexity
 * Result: Pure, traceable, reproducible scores
 */

import * as YAML from 'yaml';
import * as crypto from 'crypto';
import { ChromeExtensionDetector } from '../utils/chrome-extension-detector';
import { FabFormatsProcessor } from '../engines/fab-formats-processor';
import * as path from 'path';

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
      const ast = YAML.parse(source);

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
      if (ctx.projectName) discovered.projectName = ctx.projectName;
      if (ctx.mainLanguage) discovered.mainLanguage = ctx.mainLanguage;
      if (ctx.framework) discovered.framework = ctx.framework;
      if (ctx.database) discovered.database = ctx.database;
      if (ctx.backend) discovered.backend = ctx.backend;
      if (ctx.hosting) discovered.hosting = ctx.hosting;
      if (ctx.buildTool) discovered.buildTool = ctx.buildTool;
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

    // Project slots (3)
    this.addSlot(slots, 'project.name', ast.project?.name, 'string', 'original', 1);
    this.addSlot(slots, 'project.goal', ast.project?.goal, 'string', 'original', 1);
    this.addSlot(slots, 'project.main_language', ast.project?.main_language, 'string', 'original', 1);

    // Detect project type to determine applicable stack slots
    const projectType = this.detectProjectTypeFromContext(ast);
    const isFrontendProject = this.requiresFrontendStack(projectType);
    const isBackendProject = this.requiresBackendStack(projectType);

    // Chrome Extension auto-fill: If it's a Chrome Extension, intelligently fill slots
    if (projectType === 'chrome-extension') {
      // Auto-fill Chrome Extension technical context
      if (!ast.stack) ast.stack = {};
      if (!ast.stack.runtime) ast.stack.runtime = 'Chrome/Browser';
      if (!ast.stack.hosting) ast.stack.hosting = 'Chrome Web Store';
      if (!ast.stack.api_type) ast.stack.api_type = 'Chrome Extension APIs';
      if (!ast.stack.backend) ast.stack.backend = 'Service Worker';
      if (!ast.stack.database) ast.stack.database = 'chrome.storage API';
      if (!ast.deployment) ast.deployment = 'Web Store Upload';

      // Add Chrome Extension specific slots
      this.addSlot(slots, 'stack.runtime', ast.stack.runtime, 'string', 'discovered', 1);
      this.addSlot(slots, 'stack.hosting', ast.stack.hosting, 'string', 'discovered', 1);
      this.addSlot(slots, 'stack.api_type', ast.stack.api_type, 'string', 'discovered', 1);
      this.addSlot(slots, 'stack.backend', ast.stack.backend, 'string', 'discovered', 1);
      this.addSlot(slots, 'stack.database', ast.stack.database, 'string', 'discovered', 1);
      this.addSlot(slots, 'stack.deployment', ast.deployment, 'string', 'discovered', 1);

      // Also include frontend framework if specified (e.g., Svelte Chrome Extension)
      if (ast.stack?.frontend) {
        this.addSlot(slots, 'stack.frontend', ast.stack.frontend, 'string', 'original', 1);
      }
      if (ast.stack?.build) {
        this.addSlot(slots, 'stack.build', ast.stack.build, 'string', 'original', 1);
      }
    }

    // Stack slots - only add relevant ones based on project type
    if (isFrontendProject) {
      this.addSlot(slots, 'stack.frontend', ast.stack?.frontend, 'string', 'original', 1);
      this.addSlot(slots, 'stack.css_framework', ast.stack?.css_framework, 'string', 'original', 1);
      this.addSlot(slots, 'stack.ui_library', ast.stack?.ui_library, 'string', 'original', 1);
      this.addSlot(slots, 'stack.state_management', ast.stack?.state_management, 'string', 'original', 1);
    }

    if (isBackendProject) {
      this.addSlot(slots, 'stack.backend', ast.stack?.backend, 'string', 'original', 1);
      this.addSlot(slots, 'stack.api_type', ast.stack?.api_type, 'string', 'original', 1);
      this.addSlot(slots, 'stack.runtime', ast.stack?.runtime, 'string', 'original', 1);
      this.addSlot(slots, 'stack.database', ast.stack?.database, 'string', 'original', 1);
      this.addSlot(slots, 'stack.connection', ast.stack?.connection, 'string', 'original', 1);
    }

    // Universal stack slots (apply to all project types)
    this.addSlot(slots, 'stack.hosting', ast.stack?.hosting, 'string', 'original', 1);
    this.addSlot(slots, 'stack.build', ast.stack?.build, 'string', 'original', 1);
    this.addSlot(slots, 'stack.cicd', ast.stack?.cicd, 'string', 'original', 1);

    // Human context slots (6) - always applicable
    this.addSlot(slots, 'human.who', ast.human_context?.who, 'string', 'original', 1);
    this.addSlot(slots, 'human.what', ast.human_context?.what, 'string', 'original', 1);
    this.addSlot(slots, 'human.why', ast.human_context?.why, 'string', 'original', 1);
    this.addSlot(slots, 'human.where', ast.human_context?.where, 'string', 'original', 1);
    this.addSlot(slots, 'human.when', ast.human_context?.when, 'string', 'original', 1);
    this.addSlot(slots, 'human.how', ast.human_context?.how, 'string', 'original', 1);

    // Discovered slots (if any)
    if (ast._discovered) {
      const discovered = ast._discovered;
      const mapping = {
        'projectName': 'project.name',
        'mainLanguage': 'project.main_language',
        'framework': 'stack.frontend',
        'database': 'stack.database',
        'backend': 'stack.backend',
        'hosting': 'stack.hosting',
        'buildTool': 'stack.build'
      };

      for (const [key, path] of Object.entries(mapping)) {
        if (discovered[key] && !this.hasValue(ast, path)) {
          this.addSlot(slots, `discovery.${path}`, discovered[key], 'string', 'discovered', 1);
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
    const filled = this.isSlotFilled(value);
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
    if (value === null || value === undefined || value === false) return false;

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
      if (Array.isArray(value)) return value.length > 0;
      return Object.keys(value).length > 0;
    }

    return true;
  }

  private hasValue(ast: any, path: string): boolean {
    const parts = path.split('.');
    let current = ast;

    for (const part of parts) {
      if (!current || !current[part]) return false;
      current = current[part];
    }

    return this.isSlotFilled(current);
  }

  private detectProjectTypeFromContext(ast: any): string {
    // Check for explicit project type
    if (ast.project?.type) return ast.project.type;

    // Infer from goal and context
    const goal = (ast.project?.goal || '').toLowerCase();
    const what = (ast.human_context?.what || '').toLowerCase();
    const mainLanguage = (ast.project?.main_language || '').toLowerCase();

    // CLI tool indicators (check BEFORE Chrome Extension to avoid false positives)
    if (goal.includes('cli') || what.includes('cli') ||
        goal.includes('command line') || what.includes('command line')) {
      return 'cli-tool';
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
      if (ast.stack?.frontend) return 'fullstack';
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
      if (slot.filled) sec.filled++;

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
    if (slots.total === 0) return 0;
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
        if (d.suggestion) console.log(`    → ${d.suggestion}`);
      });
    }

    if (byType.warning.length > 0) {
      console.log(`\n⚠️ ${byType.warning.length} Warnings:`);
      byType.warning.forEach(d => {
        console.log(`  ${d.message}`);
        if (d.suggestion) console.log(`    → ${d.suggestion}`);
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