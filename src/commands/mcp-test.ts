/**
 * MCP Test Command - Test Claude Code Native Integration
 */

import { ClaudeCodeNativeIntegration } from '../integrations/claude-code-native.js';
import { PermissionLevel } from '../core/mcp-tools.js';
import { fafCyan, bold, dim } from '../ui/colors.js';

export interface MCPTestOptions {
  permission?: string;
  tool?: string;
  dryRun?: boolean;
  hooks?: boolean;
  status?: boolean;
}

export async function mcpTestCommand(options: MCPTestOptions = {}): Promise<void> {
  const cwd = process.cwd();
  
  // Parse permission level
  let permissionLevel = PermissionLevel.Standard;
  if (options.permission) {
    switch (options.permission.toLowerCase()) {
      case 'plan': permissionLevel = PermissionLevel.Plan; break;
      case 'standard': permissionLevel = PermissionLevel.Standard; break;
      case 'auto': permissionLevel = PermissionLevel.Auto; break;
      case 'bypass': permissionLevel = PermissionLevel.Bypass; break;
      default:
        console.log(`${fafCyan('!')} Unknown permission level: ${options.permission}`);
        return;
    }
  }
  
  console.log(`${fafCyan('◆')} Testing Claude Code MCP Native Integration...`);
  console.log(`${dim('  Working Directory:')} ${cwd}`);
  console.log(`${dim('  Permission Level:')} ${permissionLevel}`);
  console.log('');
  
  // Initialize integration
  const integration = new ClaudeCodeNativeIntegration({
    workingDirectory: cwd,
    permissionMode: permissionLevel,
    dryRun: options.dryRun || false,
    enableHooks: options.hooks !== false,
    telemetryEnabled: true
  });
  
  try {
    // Show status if requested
    if (options.status) {
      const status = await integration.getStatus();
      console.log(`${bold('Integration Status:')}`);
      console.log(`  Server: ${status.server.name} v${status.server.version}`);
      console.log(`  Tools Available: ${status.tools}`);
      console.log(`  Hooks Enabled: ${status.hooks ? 'Yes' : 'No'}`);
      console.log(`  Permission Mode: ${status.permissions}`);
      console.log(`  Session ID: ${status.session}`);
      console.log('');
    }
    
    // Test specific tool if provided
    if (options.tool) {
      console.log(`${bold('Testing Tool:')} ${options.tool}`);
      
      let input = {};
      if (options.tool === 'faf_score') {
        input = { verbose: true };
      } else if (options.tool === 'faf_init') {
        input = { yolo: true, dryRun: options.dryRun };
      } else if (options.tool === 'faf_sync') {
        input = { direction: 'auto' };
      }
      
      const result = await integration.executeTool(options.tool, input);
      
      if (result.isError) {
        console.log(`${fafCyan('✗')} Error: ${result.content[0].text}`);
      } else {
        console.log(`${fafCyan('✓')} Success:`);
        console.log(result.content[0].text);
      }
      console.log('');
    } else {
      // Test all available tools
      const tools = await integration.getAvailableTools();
      
      console.log(`${bold('Available Tools:')}`);
      for (const tool of tools) {
        const permissions = tool.permissions.join(', ');
        const tags = tool.tags.join(', ');
        console.log(`  ${bold(tool.name)} - ${tool.description}`);
        console.log(`    ${dim('Permissions:')} ${permissions}`);
        console.log(`    ${dim('Tags:')} ${tags}`);
      }
      console.log('');
      
      // Test each tool with minimal input
      for (const tool of tools.slice(0, 2)) { // Limit to first 2 for demo
        console.log(`${fafCyan('→')} Testing ${tool.name}...`);
        
        try {
          let input = {};
          if (tool.name === 'faf_score') {
            input = { status: true };
          } else if (tool.name === 'faf_init') {
            input = { yolo: true, dryRun: true }; // Always dry run for init
          } else if (tool.name === 'faf_sync') {
            input = { direction: 'auto' };
          }
          
          const result = await integration.executeTool(tool.name, input);
          
          if (result.isError) {
            console.log(`  ${fafCyan('✗')} ${result.content[0].text.split('\\n')[0]}`);
          } else {
            console.log(`  ${fafCyan('✓')} Success`);
          }
        } catch (error) {
          console.log(`  ${fafCyan('✗')} ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // Finalize session
    await integration.finalizeSession();
    
    console.log(`${fafCyan('✓')} MCP integration test completed`);
    console.log('');
    console.log(`${dim('Next steps:')}`);
    console.log(`  • Run ${bold('faf claude-sync')} to sync with Claude Code skills`);
    console.log(`  • Use ${bold('/faf-champion')} skill in Claude Code for guided setup`);
    console.log(`  • Configure ${bold('claude.json')} for team-wide MCP integration`);
    
  } catch (error) {
    console.error(`${fafCyan('✗')} MCP test failed:`, error);
    process.exit(1);
  }
}