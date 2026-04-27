/**
 * Claude Code Native Integration
 * Main entry point for MCP-native FAF tools following Claude Code architecture
 */

import { FAFMCPServer, MCPServerConfig } from '../core/mcp-server.js';
import { setupDefaultFAFHooks, HookSystem, HookType } from '../core/hook-system.js';
import { PermissionLevel } from '../core/mcp-tools.js';
import { existsSync } from 'fs';
import { join } from 'path';

export interface ClaudeCodeIntegrationConfig {
  workingDirectory: string;
  permissionMode?: PermissionLevel;
  telemetryEnabled?: boolean;
  sessionId?: string;
  userId?: string;
  dryRun?: boolean;
  enableHooks?: boolean;
}

export class ClaudeCodeNativeIntegration {
  private server: FAFMCPServer;
  private hooks?: HookSystem;
  private config: Required<ClaudeCodeIntegrationConfig>;
  
  constructor(config: ClaudeCodeIntegrationConfig) {
    // Set defaults matching Claude Code patterns
    this.config = {
      workingDirectory: config.workingDirectory,
      permissionMode: config.permissionMode || PermissionLevel.Standard,
      telemetryEnabled: config.telemetryEnabled ?? true,
      sessionId: config.sessionId || this.generateSessionId(),
      userId: config.userId || 'anonymous',
      dryRun: config.dryRun ?? false,
      enableHooks: config.enableHooks ?? true
    };
    
    // Initialize MCP server
    this.server = new FAFMCPServer({
      permissionMode: this.config.permissionMode,
      telemetryEnabled: this.config.telemetryEnabled,
      workingDirectory: this.config.workingDirectory,
      sessionId: this.config.sessionId,
      userId: this.config.userId,
      dryRun: this.config.dryRun
    });
    
    // Setup hooks if enabled
    if (this.config.enableHooks) {
      this.hooks = setupDefaultFAFHooks();
      this.initializeSession();
    }
  }
  
  /**
   * Get server instance for Claude Code MCP integration
   */
  getServer(): FAFMCPServer {
    return this.server;
  }
  
  /**
   * Execute a FAF tool with full Claude Code integration
   */
  async executeTool(toolName: string, input: unknown): Promise<any> {
    // Execute pre-tool-use hooks if enabled
    if (this.hooks) {
      const hookResult = await this.hooks.execute(HookType.PreToolUse, {
        toolName,
        input,
        context: {
          workingDirectory: this.config.workingDirectory,
          permissionMode: this.config.permissionMode,
          telemetry: this.config.telemetryEnabled,
          sessionId: this.config.sessionId,
          userId: this.config.userId,
          dryRun: this.config.dryRun
        }
      });
      
      // Handle hook results
      if (hookResult.action === 'deny') {
        throw new Error(`Tool execution denied: ${hookResult.reason}`);
      }
      
      if (hookResult.action === 'ask') {
        // In real implementation, this would trigger Claude Code's confirmation dialog
        console.log(`⚠️ Confirmation required: ${hookResult.reason}`);
      }
      
      // Use modified input if provided
      if (hookResult.modifiedInput) {
        input = hookResult.modifiedInput;
      }
    }
    
    // Execute the tool
    const result = await this.server.callTool(toolName, input);
    
    // Execute post-tool-use hooks if enabled
    if (this.hooks && !result.isError) {
      await this.hooks.execute(HookType.PostToolUse, {
        toolName,
        input,
        context: {
          workingDirectory: this.config.workingDirectory,
          permissionMode: this.config.permissionMode,
          telemetry: this.config.telemetryEnabled,
          sessionId: this.config.sessionId,
          userId: this.config.userId,
          dryRun: this.config.dryRun
        },
        metadata: { result }
      });
    }
    
    return result;
  }
  
  /**
   * Get available tools with permission filtering
   */
  async getAvailableTools(): Promise<any[]> {
    const tools = await this.server.listTools();
    
    // Filter tools based on current permission level
    return tools.filter(tool => {
      const requiredPermission = tool.permissions[0] as PermissionLevel;
      return this.hasPermission(requiredPermission);
    });
  }
  
  /**
   * Check if current context has required permission
   */
  private hasPermission(required: PermissionLevel): boolean {
    const permissionOrder = [
      PermissionLevel.Plan,
      PermissionLevel.Standard,
      PermissionLevel.Auto,
      PermissionLevel.Bypass
    ];
    
    const currentIndex = permissionOrder.indexOf(this.config.permissionMode);
    const requiredIndex = permissionOrder.indexOf(required);
    
    return currentIndex >= requiredIndex;
  }
  
  /**
   * Initialize session with FAF context detection
   */
  private async initializeSession(): Promise<void> {
    if (!this.hooks) {return;}
    
    // Detect project context
    const hasProjectFaf = existsSync(join(this.config.workingDirectory, 'project.faf'));
    const hasClaude = existsSync(join(this.config.workingDirectory, 'CLAUDE.md'));
    
    await this.hooks.execute(HookType.SessionStart, {
      toolName: 'session_init',
      input: {},
      context: {
        workingDirectory: this.config.workingDirectory,
        permissionMode: this.config.permissionMode,
        telemetry: this.config.telemetryEnabled,
        sessionId: this.config.sessionId,
        userId: this.config.userId,
        dryRun: this.config.dryRun
      },
      metadata: {
        hasProjectFaf,
        hasClaude
      }
    });
  }
  
  /**
   * Finalize session and save state
   */
  async finalizeSession(): Promise<void> {
    if (!this.hooks) {return;}
    
    await this.hooks.execute(HookType.SessionEnd, {
      toolName: 'session_end',
      input: {},
      context: {
        workingDirectory: this.config.workingDirectory,
        permissionMode: this.config.permissionMode,
        telemetry: this.config.telemetryEnabled,
        sessionId: this.config.sessionId,
        userId: this.config.userId,
        dryRun: this.config.dryRun
      },
      metadata: {
        hasIncompleteInterview: false // Would check actual state
      }
    });
  }
  
  /**
   * Generate session ID matching Claude Code format
   */
  private generateSessionId(): string {
    return `faf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get integration status and health
   */
  async getStatus(): Promise<{
    server: any;
    hooks: boolean;
    permissions: string;
    tools: number;
    session: string;
  }> {
    const serverInfo = await this.server.getInfo();
    const tools = await this.getAvailableTools();
    
    return {
      server: serverInfo,
      hooks: !!this.hooks,
      permissions: this.config.permissionMode,
      tools: tools.length,
      session: this.config.sessionId
    };
  }
}