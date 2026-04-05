/**
 * Claude Code Core Integration - Production Ready Package
 * Minimal, zero-friction integration for Claude Code core adoption
 */

import { FAFCore, FAFProject, FAFScore } from '../core/faf-core.js';
import { CLAUDE_NATIVE_TOOLS } from '../tools/claude-native-tools.js';
import { PermissionLevel, RiskLevel, ToolExecutionContext } from '../core/mcp-tools.js';

// Minimal integration interface for Claude Code
export interface ClaudeCoreIntegration {
  // Core functionality
  init(options?: InitOptions): FAFProject;
  score(content: string): FAFScore;
  sync(fafContent: string, claudeContent: string, fafMod: Date, claudeMod: Date): SyncResult;
  status(content?: string): StatusResult;
  export(content: string, format: ExportFormat): ExportResult;
  
  // Tool management
  getTools(): ToolDefinition[];
  executeTool(name: string, input: unknown, context: ExecutionContext): Promise<unknown>;
  
  // Validation and utilities
  validate(content: string): ValidationResult;
  parse(content: string): FAFProject;
  serialize(project: FAFProject): string;
}

export interface InitOptions {
  name?: string;
  goal?: string;
  language?: string;
  framework?: string;
  yolo?: boolean;
}

export interface SyncResult {
  direction: 'push' | 'pull' | 'none';
  result: string;
  synced: boolean;
}

export interface StatusResult {
  hasContext: boolean;
  score: number;
  tier: string;
  populated: number;
  total: number;
  isValid: boolean;
  recommendation: string;
}

export type ExportFormat = 'claude' | 'agents' | 'cursor' | 'gemini';

export interface ExportResult {
  format: string;
  content: string;
  filename: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  permission: PermissionLevel;
  risk: RiskLevel;
  schema: any;
  tags: string[];
}

export interface ExecutionContext {
  workingDirectory: string;
  permissionMode: PermissionLevel;
  dryRun?: boolean;
  userId?: string;
  sessionId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;
}

/**
 * Core integration implementation - designed for embedding in Claude Code
 */
export class ClaudeCoreIntegrationImpl implements ClaudeCoreIntegration {
  private tools = new Map<string, any>();
  
  constructor() {
    this.initializeTools();
  }
  
  /**
   * Initialize project with smart defaults
   */
  init(options: InitOptions = {}): FAFProject {
    return FAFCore.init({
      name: options.name,
      goal: options.goal,
      language: options.language,
      framework: options.framework
    });
  }
  
  /**
   * Score project completeness
   */
  score(content: string): FAFScore {
    const project = FAFCore.parse(content);
    return FAFCore.score(project);
  }
  
  /**
   * Bi-directional synchronization
   */
  sync(fafContent: string, claudeContent: string, fafMod: Date, claudeMod: Date): SyncResult {
    const result = FAFCore.biSync(fafContent, claudeContent, fafMod, claudeMod);
    return {
      direction: result.direction,
      result: result.result,
      synced: result.direction !== 'none'
    };
  }
  
  /**
   * Quick status check
   */
  status(content?: string): StatusResult {
    if (!content) {
      return {
        hasContext: false,
        score: 0,
        tier: 'NONE',
        populated: 0,
        total: 9,
        isValid: false,
        recommendation: 'Initialize project context with faf_init'
      };
    }
    
    try {
      const project = FAFCore.parse(content);
      const scoreResult = FAFCore.score(project);
      
      let recommendation = 'Context is ready!';
      if (scoreResult.score < 70) {
        recommendation = 'Add more context details for better AI understanding';
      } else if (scoreResult.score < 100) {
        recommendation = 'Fill remaining slots for perfect score';
      }
      
      return {
        hasContext: true,
        score: scoreResult.score,
        tier: scoreResult.tier,
        populated: scoreResult.populated,
        total: scoreResult.total,
        isValid: scoreResult.validation.isValid,
        recommendation
      };
    } catch (error) {
      return {
        hasContext: true,
        score: 0,
        tier: 'INVALID',
        populated: 0,
        total: 9,
        isValid: false,
        recommendation: `Fix syntax: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Export to different AI platform formats
   */
  export(content: string, format: ExportFormat): ExportResult {
    const project = FAFCore.parse(content);
    
    switch (format) {
      case 'claude':
        return {
          format,
          content: FAFCore.toClaude(project),
          filename: 'CLAUDE.md'
        };
      case 'agents':
        return {
          format,
          content: this.toAgents(project),
          filename: 'AGENTS.md'
        };
      case 'cursor':
        return {
          format,
          content: this.toCursor(project),
          filename: '.cursorrules'
        };
      case 'gemini':
        return {
          format,
          content: this.toGemini(project),
          filename: 'GEMINI.md'
        };
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
  
  /**
   * Get available tools for Claude Code registration
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(ToolClass => {
      const instance = new ToolClass();
      return {
        name: instance.name,
        description: instance.description,
        permission: instance.permission,
        risk: instance.risk,
        schema: instance.schema,
        tags: instance.tags
      };
    });
  }
  
  /**
   * Execute tool with Claude Code context
   */
  async executeTool(name: string, input: unknown, context: ExecutionContext): Promise<unknown> {
    const ToolClass = this.tools.get(name);
    if (!ToolClass) {
      throw new Error(`Tool '${name}' not found`);
    }
    
    const tool = new ToolClass();
    
    // Convert context to tool execution format
    const toolContext: ToolExecutionContext = {
      workingDirectory: context.workingDirectory,
      permissionMode: context.permissionMode,
      dryRun: context.dryRun || false,
      userId: context.userId,
      sessionId: context.sessionId,
      telemetry: true
    };
    
    // Validate tool can execute
    if (!tool.canExecute(toolContext)) {
      throw new Error(`Tool '${name}' cannot execute with permission level '${context.permissionMode}'`);
    }
    
    // Validate and execute
    const validInput = tool.validate(input);
    return await tool.execute(validInput, toolContext);
  }
  
  /**
   * Validate FAF content
   */
  validate(content: string): ValidationResult {
    try {
      const project = FAFCore.parse(content);
      const score = FAFCore.score(project);
      
      return {
        isValid: score.validation.isValid,
        errors: score.validation.errors,
        warnings: score.validation.warnings,
        score: score.score
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };
    }
  }
  
  /**
   * Parse FAF content
   */
  parse(content: string): FAFProject {
    return FAFCore.parse(content);
  }
  
  /**
   * Serialize FAF project
   */
  serialize(project: FAFProject): string {
    return FAFCore.serialize(project);
  }
  
  /**
   * Initialize tools registry
   */
  private initializeTools(): void {
    for (const ToolClass of CLAUDE_NATIVE_TOOLS) {
      const instance = new ToolClass();
      this.tools.set(instance.name, ToolClass);
    }
  }
  
  /**
   * Export format converters
   */
  private toAgents(project: FAFProject): string {
    return `# AGENTS.md — ${project.project.name}

## Project Context

${project.project.goal}

${project.human_context?.what || 'Building ' + project.project.name}

## Tech Stack

${project.stack ? Object.entries(project.stack).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'No stack specified'}

## Key Instructions

- Maintain project context awareness
- Follow established patterns
- Ask clarifying questions when needed
`;
  }
  
  private toCursor(project: FAFProject): string {
    const rules = [
      `You are working on ${project.project.name}`,
      `Project goal: ${project.project.goal}`
    ];
    
    if (project.project.main_language) {
      rules.push(`Primary language: ${project.project.main_language}`);
    }
    
    if (project.stack?.frontend) {
      rules.push(`Frontend framework: ${project.stack.frontend}`);
    }
    
    return rules.join('\n') + '\n\nAlways maintain context awareness and follow project conventions.';
  }
  
  private toGemini(project: FAFProject): string {
    return `# ${project.project.name}

**Goal:** ${project.project.goal}

${project.human_context?.what || ''}

## Context

${project.human_context?.why || 'Building this project to create value and solve problems.'}

## Technical Details

${project.stack ? Object.entries(project.stack).map(([k, v]) => `**${k}:** ${v}`).join('\n\n') : ''}

---
*Generated from FAF context*`;
  }
}

// Factory function for Claude Code integration
export function createClaudeCoreIntegration(): ClaudeCoreIntegration {
  return new ClaudeCoreIntegrationImpl();
}

// Convenience exports for direct usage
export const claudeFAF = createClaudeCoreIntegration();
export { FAFCore };