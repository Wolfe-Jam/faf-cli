/**
 * Compiler Wrapper for MK3 Engine
 * The pure mathematical scoring that gets FED clean data
 */

import type { AnalysisResult } from './fab-formats';
import type { ScoreResult } from '../types/public';

// Import the actual compiler
import { compileScore } from '@compiler/faf-compiler';
import * as crypto from 'crypto';

class Compiler {
  /**
   * Calculation Stage - Pure mathematical scoring
   * The compiler just gets FED clean data and calculates
   */
  calculate(analysis: AnalysisResult): ScoreResult {
    try {
      // Feed the compiler clean data
      const score = this.computeScore(analysis);
      const checksum = this.generateChecksum(score, analysis);
      const grade = this.determineGrade(score);

      return {
        score,
        checksum,
        timestamp: Date.now(),
        performance: 0,  // Will be set by engine
        grade
      };
    } catch (error) {
      return {
        score: 0,
        checksum: 'error',
        timestamp: Date.now(),
        performance: 0
      };
    }
  }

  /**
   * Compute the actual score
   */
  private computeScore(analysis: AnalysisResult): number {
    // Use the real compiler if available
    try {
      const result = compileScore({
        formats: analysis.formats,
        intelligence: analysis.intelligence,
        quality: analysis.quality
      });
      return Math.min(result.score || 0, 105);
    } catch {
      // Fallback scoring
      return this.fallbackScore(analysis);
    }
  }

  /**
   * Fallback scoring algorithm
   */
  private fallbackScore(analysis: AnalysisResult): number {
    let score = 0;

    // Base score from formats
    score += Math.min(analysis.formats.length * 5, 40);

    // Intelligence bonus
    if (analysis.intelligence?.extracted) {
      score += 30;
    }

    // Quality multiplier
    const qualityMultiplier = {
      'EXCEPTIONAL': 1.5,
      'PROFESSIONAL': 1.3,
      'GOOD': 1.1,
      'BASIC': 1.0,
      'MINIMAL': 0.8
    };

    const quality = analysis.quality?.level || 'BASIC';
    score *= qualityMultiplier[quality] || 1.0;

    return Math.round(Math.min(score, 105));
  }

  /**
   * Generate deterministic checksum
   */
  private generateChecksum(score: number, analysis: AnalysisResult): string {
    const data = JSON.stringify({
      score,
      formats: analysis.formats.length,
      quality: analysis.quality?.level
    });

    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Determine grade based on score
   */
  private determineGrade(score: number): string {
    if (score >= 105) return 'TROPHY';
    if (score >= 99) return 'GOLD';
    if (score >= 95) return 'SILVER';
    if (score >= 85) return 'BRONZE';
    return 'STANDARD';
  }
}

export const compiler = new Compiler();