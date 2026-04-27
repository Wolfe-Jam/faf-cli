/**
 * FAF MCP Server - Claude Code Compatible
 * Implements claude-faf-mcp as native MCP tools following leaked architecture
 */

import { MCPToolRegistry, PermissionLevel, ToolExecutionContext } from './mcp-tools.js';
import { FafScoreTool } from '../tools/faf-score-tool.js';
import { FafInitTool } from '../tools/faf-init-tool.js';
import { FafSyncTool } from '../tools/faf-sync-tool.js';

export interface MCPServerConfig {
  permissionMode: PermissionLevel;
  telemetryEnabled: boolean;
  workingDirectory: string;
  sessionId?: string;
  userId?: string;
  dryRun: boolean;
}

export class FAFMCPServer {
  private registry = new MCPToolRegistry();
  private config: MCPServerConfig;
  
  constructor(config: MCPServerConfig) {
    this.config = config;
    this.initializeTools();
  }
  
  private initializeTools(): void {
    // Register all FAF tools with the registry
    const tools = [
      new FafScoreTool(),
      new FafInitTool(), 
      new FafSyncTool()
    ];
    
    for (const tool of tools) {
      this.registry.register(tool);
    }
  }
  
  // List available tools (MCP protocol method)
  async listTools(): Promise<Array<{
    name: string;
    description: string;
    inputSchema: any;
    permissions: string[];
    tags: string[];
  }>> {
    return this.registry.list().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.schema,
      permissions: [tool.permission, tool.risk],
      tags: tool.tags
    }));
  }
  
  // Execute tool (MCP protocol method)
  async callTool(name: string, input: unknown): Promise<{
    content: Array<{
      type: 'text';
      text: string;
    }>;
    isError?: boolean;
  }> {
    const tool = this.registry.get(name);
    if (!tool) {
      return {
        content: [{
          type: 'text',
          text: `Tool '${name}' not found`
        }],
        isError: true
      };
    }
    
    try {
      // Create execution context
      const context: ToolExecutionContext = {
        workingDirectory: this.config.workingDirectory,
        userId: this.config.userId,
        sessionId: this.config.sessionId,
        permissionMode: this.config.permissionMode,
        dryRun: this.config.dryRun,
        telemetry: this.config.telemetryEnabled
      };
      
      // Check if tool can execute
      if (!tool.canExecute(context)) {
        return {
          content: [{
            type: 'text',
            text: `Tool '${name}' cannot execute with current permissions (${this.config.permissionMode})`
          }],
          isError: true
        };
      }
      
      // Validate input
      const validInput = tool.validate(input);
      
      // Execute tool
      const result = await tool.execute(validInput, context);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error executing tool '${name}': ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
  
  // Get tools by permission level
  getToolsByPermission(level: PermissionLevel) {
    return this.registry.listByPermission(level);
  }
  
  // Get server info (MCP protocol method)
  async getInfo(): Promise<{
    name: string;
    version: string;
    description: string;
    tools: number;
    permissions: string[];
  }> {
    const tools = this.registry.list();
    const permissions = [...new Set(tools.map(t => t.permission))];
    
    // Get version dynamically from package.json
    const { readFileSync } = await import('fs');
    const { dirname, join } = await import('path');
    const { fileURLToPath } = await import('url');
    
    let version = 'unknown';
    try {
      const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf-8'));
      version = pkg.version;
    } catch {
      // Fallback if package.json not found
      version = 'dev';
    }
    
    return {
      name: 'claude-faf-mcp',
      version,
      description: 'Foundational AI-Context Format tools for Claude Code',
      tools: tools.length,
      permissions
    };
  }
  
  // Permission elevation (Claude Code pattern)
  async requestPermissionElevation(
    toolName: string, 
    requestedLevel: PermissionLevel
  ): Promise<boolean> {
    const tool = this.registry.get(toolName);
    if (!tool) {return false;}
    
    // In real implementation, this would trigger Claude Code's permission dialog
    // For now, simulate auto-approval for safe operations
    if (tool.risk === 'safe' && requestedLevel <= PermissionLevel.Standard) {
      return true;
    }
    
    return false;
  }
}