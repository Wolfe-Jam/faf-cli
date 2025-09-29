/**
 * Turbo-Cat Wrapper for MK3 Engine
 * Imports the real Turbo-Cat from main codebase
 */

// Import the actual Turbo-Cat implementation
import { runTurboCat } from '@utils/turbo-cat';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

export interface DiscoveryResult {
  files: FileInfo[];
  confidence: number;
  performanceMs: number;
}

export interface FileInfo {
  path: string;
  name: string;
  type: string;
  size: number;
}

class TurboCat {
  /**
   * Discovery Stage - Find all relevant files
   * Returns in <50ms as per F1 philosophy
   */
  async discover(projectDir: string): Promise<DiscoveryResult> {
    const startTime = Date.now();

    try {
      // Use the real Turbo-Cat for discovery
      const result = await runTurboCat(projectDir);

      // Transform to internal format
      const files: FileInfo[] = [];

      // Get all discovered files
      if (result.discoveredFormats) {
        for (const format of result.discoveredFormats) {
          files.push({
            path: format.fileName,
            name: path.basename(format.fileName),
            type: format.formatType,
            size: 0  // Size calculated if needed
          });
        }
      }

      return {
        files,
        confidence: result.intelligenceScore || 0,
        performanceMs: Date.now() - startTime
      };
    } catch (error) {
      // Fallback to basic discovery
      return this.fallbackDiscovery(projectDir);
    }
  }

  /**
   * Fallback discovery if Turbo-Cat fails
   */
  private async fallbackDiscovery(projectDir: string): Promise<DiscoveryResult> {
    const startTime = Date.now();

    const patterns = [
      'package.json',
      'requirements.txt',
      'Gemfile',
      'go.mod',
      '*.ts',
      '*.tsx',
      '*.js',
      '*.jsx',
      '*.py',
      'README*'
    ];

    const files: FileInfo[] = [];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: projectDir,
        nodir: true,
        ignore: ['node_modules/**', '.git/**']
      });

      for (const match of matches) {
        files.push({
          path: match,
          name: path.basename(match),
          type: path.extname(match).slice(1) || 'unknown',
          size: 0
        });
      }
    }

    return {
      files,
      confidence: files.length > 0 ? 50 : 0,
      performanceMs: Date.now() - startTime
    };
  }
}

export const turboCat = new TurboCat();