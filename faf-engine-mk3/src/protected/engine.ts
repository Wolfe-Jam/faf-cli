/**
 * FAF Engine MK3 - Protected Implementation
 *
 * This file combines all the protected modules:
 * - Turbo-Cat (Discovery)
 * - FAB-Formats (Analysis)
 * - Compiler (Calculation)
 *
 * Everything here gets compiled into a protected binary
 */

import type {
  ScoreResult,
  AnalysisResult,
  CompileResult,
  EngineOptions
} from '../types/public';

// Import the actual implementations
import { turboCat } from '../core/turbo-cat';
import { fabFormats } from '../core/fab-formats';
import { compiler } from '../core/compiler';

export class FAFEngineMK3 {
  private readonly _version = '1.0.0';
  private readonly _engine = 'MK3-PROTECTED';

  /**
   * Score a project - Main API
   */
  async score(projectDir: string, options?: EngineOptions): Promise<ScoreResult> {
    const startTime = Date.now();

    try {
      // Stage 1: Discovery (Turbo-Cat)
      const discovered = await turboCat.discover(projectDir);

      // Stage 2: Analysis (FAB-Formats)
      const analyzed = await fabFormats.analyze(discovered);

      // Stage 3: Calculation (Compiler gets FED)
      const result = compiler.calculate(analyzed);

      // Add metadata
      return {
        ...result,
        performance: Date.now() - startTime,
        timestamp: Date.now()
      };
    } catch (error) {
      // Silent fail with zero score
      return {
        score: 0,
        checksum: 'failed',
        timestamp: Date.now(),
        performance: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze a project - Returns intelligence
   */
  async analyze(projectDir: string): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Stage 1: Discovery
    const discovered = await turboCat.discover(projectDir);

    // Stage 2: Analysis
    const analyzed = await fabFormats.analyze(discovered);

    return {
      formats: this._sanitizeFormats(analyzed.formats),
      intelligence: this._sanitizeIntelligence(analyzed.intelligence),
      quality: analyzed.quality,
      performanceMs: Date.now() - startTime
    };
  }

  /**
   * Full compile - All stages with verification
   */
  async compile(projectDir: string): Promise<CompileResult> {
    const score = await this.score(projectDir);
    const analysis = await this.analyze(projectDir);

    return {
      score,
      analysis,
      verification: {
        valid: score.score > 0,
        checksum: score.checksum,
        engine: this._engine
      }
    };
  }

  /**
   * Sanitize formats for public consumption
   */
  private _sanitizeFormats(formats: any[]): any[] {
    // Hide internal structure
    return formats.map(f => ({
      type: f.type || 'unknown',
      count: f.count || 0,
      quality: f.quality || 'basic'
    }));
  }

  /**
   * Sanitize intelligence data
   */
  private _sanitizeIntelligence(intel: any): any {
    // Hide secret sauce
    return {
      extracted: !!intel,
      confidence: intel?.confidence || 0,
      stack: intel?.stack || []
    };
  }
}