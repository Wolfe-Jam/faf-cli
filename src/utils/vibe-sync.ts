/**
 * FAF VIBE Sync - Alternative sync targets for no-file-system platforms
 * When there's no CLAUDE.md, we sync to platform-native locations
 */

import * as fs from 'fs';
import * as path from 'path';
import { chalk } from '../fix-once/colors';

export interface VibeSyncTarget {
  platform: string;
  target: string;
  method: 'file' | 'env' | 'api' | 'clipboard';
  instructions: string;
}

export class VibeSync {
  /**
   * Get sync target based on platform
   */
  public static getSyncTarget(platform: string): VibeSyncTarget {
    switch(platform.toLowerCase()) {
      case 'replit':
        return {
          platform: 'Replit',
          target: '.faf-context.md',  // Visible in file tree
          method: 'file',
          instructions: 'FAF syncs to .faf-context.md - Share this with any AI!'
        };
        
      case 'lovable':
        return {
          platform: 'Lovable',
          target: 'README.faf.md',  // Shows in their UI
          method: 'file',
          instructions: 'Copy README.faf.md content to Claude/ChatGPT for instant context'
        };
        
      case 'wix':
      case 'base44':
        return {
          platform: 'Wix/Base44',
          target: 'Clipboard',
          method: 'clipboard',
          instructions: 'FAF copied context to clipboard - Paste in any AI!'
        };
        
      case 'glitch':
        return {
          platform: 'Glitch',
          target: '.env',
          method: 'env',
          instructions: 'FAF context in .env as FAF_CONTEXT (copy to AI)'
        };
        
      case 'codesandbox':
        return {
          platform: 'CodeSandbox',
          target: 'faf-context.json',
          method: 'file',
          instructions: 'Context saved to faf-context.json for AI sharing'
        };
        
      default:
        return {
          platform: 'Professional',
          target: 'CLAUDE.md',
          method: 'file',
          instructions: 'Synced to CLAUDE.md for Claude Desktop and other AI tools'
        };
    }
  }

  /**
   * Perform platform-specific sync
   */
  public static async syncContext(
    content: string, 
    platform: string, 
    projectPath: string
  ): Promise<boolean> {
    const target = this.getSyncTarget(platform);

    try {
      switch(target.method) {
        case 'file': {
          const filePath = path.join(projectPath, target.target);
          await fs.promises.writeFile(filePath, content);
          return true;
        }

        case 'env': {
          // For .env files, add as multiline string
          const envPath = path.join(projectPath, '.env');
          const envContent = `\n# FAF Context for AI\nFAF_CONTEXT="${content.replace(/"/g, '\\"')}"\n`;
          await fs.promises.appendFile(envPath, envContent);
          return true;
        }

        case 'clipboard': {
          // Use clipboardy or similar
          console.log('📋 Context ready for clipboard (install clipboardy for auto-copy)');
          console.log('\n--- COPY BELOW FOR AI ---\n');
          console.log(content);
          console.log('\n--- END CONTEXT ---\n');
          return true;
        }

        case 'api': {
          // Future: POST to FAF cloud service
          console.log(chalk.gray('API sync not available - use clipboard mode'));
          return false;
        }

        default: {
          return false;
        }
      }
    } catch {
      // Sync failed
      return false;
    }
  }

  /**
   * Generate VIBE progression message
   */
  public static getProgressionMessage(currentScore: number): string {
    if (currentScore < 40) {
      return `
🎯 Your Prototype Score: ${currentScore}%
📈 With FAF VIBE: Could reach 65%+
🚀 With Claude Desktop: Could reach 85%+

You're building something cool! Let FAF help you level up:
1. Run 'faf enhance' to boost your score
2. Add more context about your decisions
3. Consider Claude Desktop for bi-directional sync
`;
    } else if (currentScore < 70) {
      return `
✨ Your Score: ${currentScore}% - Getting Professional!
📈 With Claude Desktop: Could reach 85%+

You're on the path to championship context:
1. Add technical decisions to your .faf
2. Document your architecture choices
3. Get Claude Desktop for seamless AI workflow
`;
    } else {
      return `
🏆 Championship Score: ${currentScore}%!

You've graduated from prototype to professional!
Consider the $100 Pro plan for enterprise features.
`;
    }
  }
}