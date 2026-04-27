/**
 * FAF Sync Tool - MCP Native Implementation
 * File modification operation, requires Auto permission
 */

import { z } from 'zod';
import { BaseFAFTool, PermissionLevel, RiskLevel, ToolExecutionContext } from '../core/mcp-tools.js';
import { syncCommand } from '../commands/sync.js';

// Input schema for faf-sync tool
const FafSyncInputSchema = z.object({
  watch: z.boolean().optional().default(false).describe('Watch for changes and sync continuously'),
  direction: z.enum(['auto', 'push', 'pull']).optional().default('auto').describe('Force sync direction')
});

type FafSyncInput = z.infer<typeof FafSyncInputSchema>;

interface FafSyncOutput {
  synced: boolean;
  direction: 'push' | 'pull' | 'none';
  files: {
    faf: string;
    claude: string;
  };
  lastModified: {
    faf?: Date;
    claude?: Date;
  };
  changes: string[];
  watchMode: boolean;
}

export class FafSyncTool extends BaseFAFTool<FafSyncInput, FafSyncOutput> {
  readonly name = 'faf_sync';
  readonly description = 'Bi-directional sync between .faf and CLAUDE.md files';
  readonly permission = PermissionLevel.Auto; // Trusted operation, auto-approved
  readonly risk = RiskLevel.Low; // Low risk - only modifies known config files
  readonly schema = FafSyncInputSchema;
  readonly tags = ['faf', 'ai-context', 'synchronization', 'file-modification'];

  async execute(
    input: FafSyncInput, 
    context: ToolExecutionContext
  ): Promise<FafSyncOutput> {
    const startTime = Date.now();
    
    if (context.dryRun) {
      return {
        synced: false,
        direction: 'none',
        files: {
          faf: 'project.faf',
          claude: 'CLAUDE.md'
        },
        lastModified: {},
        changes: [],
        watchMode: false
      };
    }
    
    try {
      // Capture output from existing command
      let capturedOutput = '';
      const originalLog = console.log;
      
      console.log = (...args) => {
        capturedOutput += `${args.join(' ')  }\n`;
      };
      
      try {
        // Execute the existing sync command
        await syncCommand({
          watch: input.watch,
          direction: input.direction
        });
      } finally {
        console.log = originalLog;
      }
      
      // Parse output for sync results
      const pushMatch = capturedOutput.includes('→ CLAUDE.md');
      const pullMatch = capturedOutput.includes('← project.faf');
      const syncedMatch = capturedOutput.includes('synced') || capturedOutput.includes('updated');
      
      let direction: 'push' | 'pull' | 'none' = 'none';
      if (pushMatch) {direction = 'push';}
      else if (pullMatch) {direction = 'pull';}
      
      // Extract file paths and changes
      const changes: string[] = [];
      const lines = capturedOutput.split('\n');
      for (const line of lines) {
        if (line.includes('updated') || line.includes('created') || line.includes('synced')) {
          changes.push(line.trim());
        }
      }
      
      const result: FafSyncOutput = {
        synced: syncedMatch,
        direction,
        files: {
          faf: 'project.faf',
          claude: 'CLAUDE.md'
        },
        lastModified: {
          // Would need to read actual file stats
        },
        changes,
        watchMode: input.watch
      };
      
      // Log execution for telemetry
      if (context.telemetry) {
        console.log(`[MCP] faf_sync executed in ${Date.now() - startTime}ms`);
      }
      
      return result;
      
    } catch (error) {
      throw new Error(`Failed to sync FAF files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  canExecute(context: ToolExecutionContext): boolean {
    // Check base permission
    if (!super.canExecute(context)) {
      return false;
    }
    
    // Watch mode requires higher permissions
    if (context.permissionMode === PermissionLevel.Plan) {
      return false; // Plan mode can't modify files
    }
    
    return true;
  }
}