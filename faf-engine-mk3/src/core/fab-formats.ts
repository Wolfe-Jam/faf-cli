/**
 * FAB-Formats Wrapper for MK3 Engine
 * The secret sauce - 150+ format intelligence extraction
 */

import type { DiscoveryResult } from './turbo-cat';

// Import the actual FAB-Formats engine
import { fabFormatsEngine } from '@engines/fab-formats-engine';

export interface AnalysisResult {
  formats: any[];
  intelligence: any;
  quality: any;
  performanceMs: number;
}

class FABFormats {
  /**
   * Analysis Stage - Extract intelligence from discovered files
   * This is where the magic happens - 150+ format handlers
   */
  async analyze(discovery: DiscoveryResult): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      // Use the real FAB-Formats engine
      const result = await fabFormatsEngine.analyze({
        files: discovery.files,
        projectDir: process.cwd()
      });

      return {
        formats: result.discoveredFormats || [],
        intelligence: result.humanContext || {},
        quality: {
          level: result.quality?.grade || 'BASIC',
          score: result.intelligenceScore || 0
        },
        performanceMs: Date.now() - startTime
      };
    } catch (error) {
      // Fallback analysis
      return this.fallbackAnalysis(discovery);
    }
  }

  /**
   * Fallback if FAB-Formats fails
   */
  private fallbackAnalysis(discovery: DiscoveryResult): AnalysisResult {
    return {
      formats: discovery.files.map(f => ({
        type: f.type,
        count: 1,
        quality: 'BASIC'
      })),
      intelligence: {
        extracted: false,
        confidence: 0
      },
      quality: {
        level: 'MINIMAL',
        score: 30
      },
      performanceMs: 0
    };
  }
}

export const fabFormats = new FABFormats();