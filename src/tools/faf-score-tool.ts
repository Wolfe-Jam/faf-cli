/**
 * FAF Score Tool - MCP Native Implementation
 * Read-only operation, safe for Plan permission level
 */

import { z } from 'zod';
import { BaseFAFTool, PermissionLevel, RiskLevel, ToolExecutionContext, ToolResult } from '../core/mcp-tools.js';
import { scoreCommand } from '../commands/score.js';

// Input schema for faf-score tool
const FafScoreInputSchema = z.object({
  file: z.string().optional().describe('Path to .faf file to score (defaults to project.faf)'),
  verbose: z.boolean().optional().default(false).describe('Show detailed slot breakdown'),
  status: z.boolean().optional().default(false).describe('Compact one-liner output'),
  json: z.boolean().optional().default(false).describe('Output as JSON')
});

type FafScoreInput = z.infer<typeof FafScoreInputSchema>;

// Output schema for faf-score tool
interface FafScoreOutput {
  score: number;
  tier: string;
  populated: number;
  total: number;
  empty: string[];
  ignored: string[];
  file: string;
  raw?: any; // For JSON output
}

export class FafScoreTool extends BaseFAFTool<FafScoreInput, FafScoreOutput> {
  readonly name = 'faf_score';
  readonly description = 'Score AI-readiness of .faf file (0-100%)';
  readonly permission = PermissionLevel.Plan; // Read-only, safe
  readonly risk = RiskLevel.Safe;
  readonly schema = FafScoreInputSchema;
  readonly tags = ['faf', 'ai-context', 'scoring', 'read-only'];

  async execute(
    input: FafScoreInput, 
    context: ToolExecutionContext
  ): Promise<FafScoreOutput> {
    const startTime = Date.now();
    
    try {
      // Capture output from existing command
      let capturedOutput = '';
      const capturedData: any = null;
      
      const originalLog = console.log;
      const originalError = console.error;
      
      // Intercept console output for processing
      console.log = (...args) => {
        capturedOutput += `${args.join(' ')  }\n`;
      };
      console.error = (...args) => {
        capturedOutput += `${args.join(' ')  }\n`;
      };
      
      try {
        // Execute the existing score command
        await scoreCommand(input.file, {
          verbose: input.verbose,
          status: input.status,
          json: input.json
        });
      } finally {
        // Restore console
        console.log = originalLog;
        console.error = originalError;
      }
      
      // Parse the output to extract structured data
      const scoreMatch = capturedOutput.match(/(\d+)%/);
      const tierMatch = capturedOutput.match(/(RED|YELLOW|GREEN|SILVER|GOLD|TROPHY)/);
      const slotMatch = capturedOutput.match(/(\d+)\/(\d+) slots/);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      const tier = tierMatch ? tierMatch[1] : 'UNKNOWN';
      const populated = slotMatch ? parseInt(slotMatch[1]) : 0;
      const total = slotMatch ? parseInt(slotMatch[2]) : 0;
      
      // Extract empty slots if verbose
      const empty: string[] = [];
      const ignored: string[] = [];
      
      if (input.verbose && capturedOutput.includes('empty')) {
        const lines = capturedOutput.split('\n');
        for (const line of lines) {
          if (line.includes('empty') && line.includes('○')) {
            const match = line.match(/([a-z_]+\.[a-z_]+)/);
            if (match) {empty.push(match[1]);}
          }
        }
      }
      
      const result: FafScoreOutput = {
        score,
        tier,
        populated,
        total,
        empty,
        ignored,
        file: input.file || 'project.faf'
      };
      
      if (input.json) {
        result.raw = capturedData;
      }
      
      // Log execution for telemetry
      if (context.telemetry) {
        console.log(`[MCP] faf_score executed in ${Date.now() - startTime}ms`);
      }
      
      return result;
      
    } catch (error) {
      throw new Error(`Failed to score FAF file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  canExecute(context: ToolExecutionContext): boolean {
    // Always allow scoring - it's read-only
    return true;
  }
}