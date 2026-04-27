/**
 * FAF Init Tool - MCP Native Implementation
 * File creation operation, requires Standard permission
 */

import { z } from 'zod';
import { BaseFAFTool, PermissionLevel, RiskLevel, ToolExecutionContext } from '../core/mcp-tools.js';
import { initCommand } from '../commands/init.js';
import { existsSync } from 'fs';
import { join } from 'path';

// Input schema for faf-init tool
const FafInitInputSchema = z.object({
  yolo: z.boolean().optional().default(false).describe('Quick init with sensible defaults'),
  quick: z.boolean().optional().default(false).describe('Alias for --yolo'),
  force: z.boolean().optional().default(false).describe('Overwrite existing project.faf'),
  output: z.string().optional().describe('Output path for generated .faf file')
});

type FafInitInput = z.infer<typeof FafInitInputSchema>;

interface FafInitOutput {
  created: boolean;
  file: string;
  score: number;
  overwritten: boolean;
  detectedStack?: string[];
  detectedLanguage?: string;
}

export class FafInitTool extends BaseFAFTool<FafInitInput, FafInitOutput> {
  readonly name = 'faf_init';
  readonly description = 'Initialize .faf file for current project';
  readonly permission = PermissionLevel.Standard; // Creates files, needs confirmation
  readonly risk = RiskLevel.Low; // Low risk - only creates config files
  readonly schema = FafInitInputSchema;
  readonly tags = ['faf', 'ai-context', 'initialization', 'file-creation'];

  async execute(
    input: FafInitInput, 
    context: ToolExecutionContext
  ): Promise<FafInitOutput> {
    const startTime = Date.now();
    
    // Check if file exists for overwrite detection
    const outputPath = input.output || join(context.workingDirectory, 'project.faf');
    const fileExists = existsSync(outputPath);
    
    // Prevent overwriting without force flag
    if (fileExists && !input.force && !context.dryRun) {
      throw new Error(`File ${outputPath} already exists. Use force: true to overwrite.`);
    }
    
    if (context.dryRun) {
      return {
        created: false,
        file: outputPath,
        score: 0,
        overwritten: false
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
        // Execute the existing init command
        await initCommand({
          yolo: input.yolo || input.quick,
          force: input.force,
          output: input.output
        });
      } finally {
        console.log = originalLog;
      }
      
      // Parse output for results
      const createdMatch = capturedOutput.includes('created');
      const updatedMatch = capturedOutput.includes('updated');
      const scoreMatch = capturedOutput.match(/(\d+)%/);
      
      const result: FafInitOutput = {
        created: createdMatch || !fileExists,
        file: outputPath,
        score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
        overwritten: fileExists && input.force
      };
      
      // Try to detect stack and language from output
      if (capturedOutput.includes('TypeScript')) {
        result.detectedLanguage = 'TypeScript';
      } else if (capturedOutput.includes('JavaScript')) {
        result.detectedLanguage = 'JavaScript';
      } else if (capturedOutput.includes('Python')) {
        result.detectedLanguage = 'Python';
      }
      
      // Log execution for telemetry
      if (context.telemetry) {
        console.log(`[MCP] faf_init executed in ${Date.now() - startTime}ms`);
      }
      
      return result;
      
    } catch (error) {
      throw new Error(`Failed to initialize FAF file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  canExecute(context: ToolExecutionContext): boolean {
    // Check base permission
    if (!super.canExecute(context)) {
      return false;
    }
    
    // Additional checks for file operations
    const outputPath = join(context.workingDirectory, 'project.faf');
    
    // In plan mode, only allow if file doesn't exist
    if (context.permissionMode === PermissionLevel.Plan && existsSync(outputPath)) {
      return false;
    }
    
    return true;
  }
}