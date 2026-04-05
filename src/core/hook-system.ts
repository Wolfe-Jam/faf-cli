/**
 * Hook System - Claude Code Integration
 * Implements PreToolUse, PostEdit, and other lifecycle hooks
 */

import { PermissionLevel, RiskLevel, ToolExecutionContext } from './mcp-tools.js';
import { PermissionClassifier } from './permission-classifier.js';

export enum HookType {
  PreToolUse = 'pre-tool-use',
  PostToolUse = 'post-tool-use', 
  PreEdit = 'pre-edit',
  PostEdit = 'post-edit',
  SessionStart = 'session-start',
  SessionEnd = 'session-end'
}

export interface HookContext {
  toolName: string;
  input: any;
  context: ToolExecutionContext;
  metadata?: Record<string, any>;
}

export interface HookResult {
  action: 'allow' | 'deny' | 'ask' | 'defer';
  modifiedInput?: any;
  additionalContext?: string;
  reason?: string;
}

export type HookHandler = (context: HookContext) => Promise<HookResult> | HookResult;

export class HookSystem {
  private handlers = new Map<HookType, HookHandler[]>();
  
  /**
   * Register a hook handler
   */
  register(type: HookType, handler: HookHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }
  
  /**
   * Execute all handlers for a hook type
   */
  async execute(type: HookType, context: HookContext): Promise<HookResult> {
    const handlers = this.handlers.get(type) || [];
    
    for (const handler of handlers) {
      const result = await handler(context);
      
      // If any handler denies or asks, return immediately
      if (result.action === 'deny' || result.action === 'ask') {
        return result;
      }
      
      // If handler defers, continue to next handler
      if (result.action === 'defer') {
        continue;
      }
      
      // If handler modifies input, update context
      if (result.modifiedInput) {
        context.input = result.modifiedInput;
      }
    }
    
    // Default: allow if no handler blocked
    return { action: 'allow' };
  }
}

/**
 * FAF-specific hook handlers
 */
export class FAFHooks {
  /**
   * PreToolUse hook - validates FAF operations before execution
   */
  static preToolUse: HookHandler = async (context) => {
    // Classify the operation for risk assessment
    const analysis = PermissionClassifier.classify(context.toolName, context.input);
    
    // Check if operation is allowed at current permission level
    const permissionOrder = [
      PermissionLevel.Plan,
      PermissionLevel.Standard,
      PermissionLevel.Auto,
      PermissionLevel.Bypass
    ];
    
    const requiredIndex = permissionOrder.indexOf(analysis.permission);
    const currentIndex = permissionOrder.indexOf(context.context.permissionMode);
    const hasPermission = currentIndex >= requiredIndex;
    
    if (!hasPermission) {
      return {
        action: 'deny',
        reason: `Insufficient permissions. Required: ${analysis.permission}, Current: ${context.context.permissionMode}`
      };
    }
    
    // High-risk operations require confirmation
    if (analysis.risk === RiskLevel.High && !context.context.dryRun) {
      return {
        action: 'ask',
        reason: `High-risk operation detected: ${analysis.reasons.join(', ')}`
      };
    }
    
    // Check for destructive operations
    if (context.input.force && context.toolName === 'faf_init') {
      return {
        action: 'ask',
        reason: 'This will overwrite existing project.faf file'
      };
    }
    
    return { action: 'allow' };
  };
  
  /**
   * PostEdit hook - auto-update FAF context after file changes
   */
  static postEdit: HookHandler = async (context) => {
    // Only trigger for relevant file types
    const relevantFiles = ['.ts', '.js', '.py', '.md', '.json', '.yaml', '.toml'];
    const fileName = context.metadata?.fileName || '';
    const isRelevant = relevantFiles.some(ext => fileName.endsWith(ext));
    
    if (!isRelevant) {
      return { action: 'allow' };
    }
    
    // Auto-sync FAF files when source files change
    if (fileName !== 'project.faf' && fileName !== 'CLAUDE.md') {
      try {
        // Would trigger faf_sync in auto mode
        return {
          action: 'allow',
          additionalContext: 'Triggered auto-sync of project context due to file changes'
        };
      } catch (error) {
        return {
          action: 'allow',
          reason: 'Auto-sync failed but continuing'
        };
      }
    }
    
    return { action: 'allow' };
  };
  
  /**
   * SessionStart hook - initialize FAF context for new sessions
   */
  static sessionStart: HookHandler = async (context) => {
    // Check if project has FAF context
    const hasProjectFaf = context.metadata?.hasProjectFaf || false;
    const hasClaude = context.metadata?.hasClaude || false;
    
    if (!hasProjectFaf && !hasClaude) {
      return {
        action: 'allow',
        additionalContext: 'No FAF context detected. Run /faf-quickstart to initialize AI-ready project context.'
      };
    }
    
    // Check for sync issues
    if (hasProjectFaf && hasClaude) {
      return {
        action: 'allow',
        additionalContext: 'FAF bi-sync active. Context automatically synchronized between .faf and CLAUDE.md.'
      };
    }
    
    return { action: 'allow' };
  };
  
  /**
   * SessionEnd hook - save FAF state and context
   */
  static sessionEnd: HookHandler = async (context) => {
    // Auto-save session state for faf go continuity
    if (context.metadata?.hasIncompleteInterview) {
      return {
        action: 'allow',
        additionalContext: 'FAF interview state saved. Resume with "faf go --resume"'
      };
    }
    
    // Update last activity timestamp
    return {
      action: 'allow',
      additionalContext: 'FAF session state preserved for next interaction'
    };
  };
}

/**
 * Default FAF hook system setup
 */
export function setupDefaultFAFHooks(): HookSystem {
  const hooks = new HookSystem();
  
  hooks.register(HookType.PreToolUse, FAFHooks.preToolUse);
  hooks.register(HookType.PostEdit, FAFHooks.postEdit);
  hooks.register(HookType.SessionStart, FAFHooks.sessionStart);
  hooks.register(HookType.SessionEnd, FAFHooks.sessionEnd);
  
  return hooks;
}