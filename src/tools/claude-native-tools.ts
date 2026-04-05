/**
 * Claude Code Native Tools - Essential 5-Tool Integration Package
 * Minimal surface area for core Claude Code integration
 */

import { z } from 'zod';
import { BaseFAFTool, PermissionLevel, RiskLevel, ToolExecutionContext } from '../core/mcp-tools.js';
import { FAFCore, FAFProject, FAFScore } from '../core/faf-core.js';

// 1. FAF Init Tool - Essential for project setup
const InitInputSchema = z.object({
  name: z.string().optional().describe('Project name'),
  goal: z.string().optional().describe('Project goal/purpose'),
  language: z.string().optional().describe('Main programming language'),
  framework: z.string().optional().describe('Primary framework'),
  yolo: z.boolean().optional().default(false).describe('Use smart defaults')
});

export class FAFInitTool extends BaseFAFTool<z.infer<typeof InitInputSchema>, FAFProject> {
  readonly name = 'faf_init';
  readonly description = 'Initialize AI-ready project context';
  readonly permission = PermissionLevel.Standard; // File creation
  readonly risk = RiskLevel.Low;
  readonly schema = InitInputSchema;
  readonly tags = ['faf', 'initialization', 'essential'];

  async execute(input: z.infer<typeof InitInputSchema>, context: ToolExecutionContext): Promise<FAFProject> {
    const project = FAFCore.init({
      name: input.name || this.guessProjectName(context.workingDirectory),
      goal: input.goal,
      language: input.language,
      framework: input.framework
    });

    if (!context.dryRun) {
      // In real implementation, would write to filesystem
      // This is pure logic for Claude Code core integration
    }

    return project;
  }

  private guessProjectName(dir: string): string {
    return dir.split('/').pop() || 'My Project';
  }
}

// 2. FAF Score Tool - Essential for assessment
const ScoreInputSchema = z.object({
  content: z.string().describe('FAF YAML content to score'),
  verbose: z.boolean().optional().default(false).describe('Include detailed breakdown')
});

export class FAFScoreTool extends BaseFAFTool<z.infer<typeof ScoreInputSchema>, FAFScore> {
  readonly name = 'faf_score';
  readonly description = 'Assess AI-readiness score (0-100%)';
  readonly permission = PermissionLevel.Plan; // Read-only
  readonly risk = RiskLevel.Safe;
  readonly schema = ScoreInputSchema;
  readonly tags = ['faf', 'assessment', 'essential'];

  async execute(input: z.infer<typeof ScoreInputSchema>, context: ToolExecutionContext): Promise<FAFScore> {
    try {
      const project = FAFCore.parse(input.content);
      return FAFCore.score(project);
    } catch (error) {
      throw new Error(`Failed to score FAF content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 3. FAF Sync Tool - Essential for context management
const SyncInputSchema = z.object({
  fafContent: z.string().describe('Current .faf content'),
  claudeContent: z.string().describe('Current CLAUDE.md content'),
  fafModified: z.string().describe('FAF last modified timestamp'),
  claudeModified: z.string().describe('CLAUDE.md last modified timestamp'),
  direction: z.enum(['auto', 'push', 'pull']).optional().default('auto').describe('Sync direction')
});

export class FAFSyncTool extends BaseFAFTool<z.infer<typeof SyncInputSchema>, {
  direction: 'push' | 'pull' | 'none';
  result: string;
  synced: boolean;
}> {
  readonly name = 'faf_sync';
  readonly description = 'Bi-directional context synchronization';
  readonly permission = PermissionLevel.Auto; // Trusted operation
  readonly risk = RiskLevel.Low;
  readonly schema = SyncInputSchema;
  readonly tags = ['faf', 'synchronization', 'essential'];

  async execute(input: z.infer<typeof SyncInputSchema>, context: ToolExecutionContext) {
    const fafModTime = new Date(input.fafModified);
    const claudeModTime = new Date(input.claudeModified);
    
    let direction: 'push' | 'pull' | 'auto' = input.direction;
    
    if (direction === 'auto') {
      // Determine direction based on modification times
      if (fafModTime > claudeModTime) {
        direction = 'push';
      } else if (claudeModTime > fafModTime) {
        direction = 'pull';
      } else {
        return {
          direction: 'none' as const,
          result: input.fafContent,
          synced: false
        };
      }
    }

    const syncResult = FAFCore.biSync(
      input.fafContent,
      input.claudeContent,
      fafModTime,
      claudeModTime
    );

    return {
      direction: syncResult.direction,
      result: syncResult.result,
      synced: syncResult.direction !== 'none'
    };
  }
}

// 4. FAF Status Tool - Essential for quick checks
const StatusInputSchema = z.object({
  content: z.string().optional().describe('FAF content to check (optional)')
});

export class FAFStatusTool extends BaseFAFTool<z.infer<typeof StatusInputSchema>, {
  hasContext: boolean;
  score: number;
  tier: string;
  populated: number;
  total: number;
  isValid: boolean;
  recommendation: string;
}> {
  readonly name = 'faf_status';
  readonly description = 'Quick context status check';
  readonly permission = PermissionLevel.Plan; // Read-only
  readonly risk = RiskLevel.Safe;
  readonly schema = StatusInputSchema;
  readonly tags = ['faf', 'status', 'essential'];

  async execute(input: z.infer<typeof StatusInputSchema>, context: ToolExecutionContext) {
    if (!input.content) {
      return {
        hasContext: false,
        score: 0,
        tier: 'NONE',
        populated: 0,
        total: 9,
        isValid: false,
        recommendation: 'Run faf_init to create AI-ready project context'
      };
    }

    try {
      const project = FAFCore.parse(input.content);
      const scoreResult = FAFCore.score(project);
      
      let recommendation = 'Context is ready!';
      if (scoreResult.score < 70) {
        recommendation = 'Consider adding more context details for better AI understanding';
      } else if (scoreResult.score < 100) {
        recommendation = 'Almost perfect! Fill remaining slots for championship score';
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
        recommendation: `Fix FAF syntax errors: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// 5. FAF Export Tool - Essential for format conversion
const ExportInputSchema = z.object({
  content: z.string().describe('FAF content to export'),
  format: z.enum(['claude', 'agents', 'cursor', 'gemini']).describe('Output format')
});

export class FAFExportTool extends BaseFAFTool<z.infer<typeof ExportInputSchema>, {
  format: string;
  content: string;
  filename: string;
}> {
  readonly name = 'faf_export';
  readonly description = 'Export to AI platform formats';
  readonly permission = PermissionLevel.Plan; // Read-only transformation
  readonly risk = RiskLevel.Safe;
  readonly schema = ExportInputSchema;
  readonly tags = ['faf', 'export', 'essential'];

  async execute(input: z.infer<typeof ExportInputSchema>, context: ToolExecutionContext) {
    const project = FAFCore.parse(input.content);
    
    let content: string;
    let filename: string;
    
    switch (input.format) {
      case 'claude':
        content = FAFCore.toClaude(project);
        filename = 'CLAUDE.md';
        break;
      case 'agents':
        content = this.toAgents(project);
        filename = 'AGENTS.md';
        break;
      case 'cursor':
        content = this.toCursor(project);
        filename = '.cursorrules';
        break;
      case 'gemini':
        content = this.toGemini(project);
        filename = 'GEMINI.md';
        break;
      default:
        throw new Error(`Unsupported format: ${input.format}`);
    }

    return {
      format: input.format,
      content,
      filename
    };
  }

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

// Essential tools registry for Claude Code integration
export const CLAUDE_NATIVE_TOOLS = [
  FAFInitTool,
  FAFScoreTool,
  FAFSyncTool,
  FAFStatusTool,
  FAFExportTool
] as const;

// Tools exported via CLAUDE_NATIVE_TOOLS constant