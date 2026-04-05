/**
 * MCP-Native Tool Architecture
 * Mirrors Claude Code's tool system patterns from leaked source
 */

import { z } from 'zod';

// Permission levels matching Claude Code's 4-tier system
export enum PermissionLevel {
  Plan = 'plan',         // Read-only operations
  Standard = 'standard', // Operations requiring confirmation
  Auto = 'auto',         // Pre-approved safe operations
  Bypass = 'bypass'      // Full access operations
}

// Risk classification for tools
export enum RiskLevel {
  Safe = 'safe',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

// Base tool interface matching Claude Code architecture
export interface MCPTool<TInput = unknown, TOutput = unknown> {
  readonly name: string;
  readonly description: string;
  readonly permission: PermissionLevel;
  readonly risk: RiskLevel;
  readonly schema: z.ZodSchema<TInput>;
  readonly tags: string[];
  
  // Core execution method
  execute(input: TInput, context: ToolExecutionContext): Promise<TOutput>;
  
  // Validation methods
  validate(input: unknown): TInput;
  canExecute(context: ToolExecutionContext): boolean;
}

// Execution context for tools
export interface ToolExecutionContext {
  readonly workingDirectory: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly permissionMode: PermissionLevel;
  readonly dryRun: boolean;
  readonly telemetry: boolean;
}

// Tool registry for MCP server
export class MCPToolRegistry {
  private tools = new Map<string, MCPTool>();
  
  register(tool: MCPTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool '${tool.name}' already registered`);
    }
    this.tools.set(tool.name, tool);
  }
  
  get(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }
  
  list(): MCPTool[] {
    return Array.from(this.tools.values());
  }
  
  listByPermission(level: PermissionLevel): MCPTool[] {
    return this.list().filter(tool => tool.permission === level);
  }
  
  listByRisk(level: RiskLevel): MCPTool[] {
    return this.list().filter(tool => tool.risk === level);
  }
}

// Tool execution result
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    permissionUsed: PermissionLevel;
    riskAssessed: RiskLevel;
    toolVersion: string;
  };
}

// Abstract base class for FAF tools
export abstract class BaseFAFTool<TInput, TOutput> implements MCPTool<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly permission: PermissionLevel;
  abstract readonly risk: RiskLevel;
  abstract readonly schema: z.ZodSchema<TInput>;
  
  readonly tags = ['faf', 'ai-context'];
  
  abstract execute(input: TInput, context: ToolExecutionContext): Promise<TOutput>;
  
  validate(input: unknown): TInput {
    const result = this.schema.safeParse(input);
    if (!result.success) {
      throw new Error(`Invalid input for ${this.name}: ${result.error.message}`);
    }
    return result.data;
  }
  
  canExecute(context: ToolExecutionContext): boolean {
    // Basic permission check - can be overridden
    const permissionOrder = [
      PermissionLevel.Plan,
      PermissionLevel.Standard, 
      PermissionLevel.Auto,
      PermissionLevel.Bypass
    ];
    
    const requiredIndex = permissionOrder.indexOf(this.permission);
    const contextIndex = permissionOrder.indexOf(context.permissionMode);
    
    return contextIndex >= requiredIndex;
  }
}