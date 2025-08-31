/**
 * Framework Detection Engine
 */

import type { PlatformAdapter } from '../types';
import type { FabFormatsAnalysis } from '../formats/FabFormatsEngine';

export interface FrameworkResult {
  framework: string;
  confidence: number;
  version?: string;
  dependencies: string[];
}

export class FrameworkDetector {
  constructor(_adapter: PlatformAdapter) {
    // Adapter may be used in future implementations
  }
  
  async detect(_projectDir: string, formatAnalysis: FabFormatsAnalysis): Promise<FrameworkResult> {
    // Use fab-formats analysis for detection
    const topFramework = this.getTopFramework(formatAnalysis);
    
    return {
      framework: topFramework?.framework || 'Unknown',
      confidence: topFramework?.confidence || 0,
      dependencies: []
    };
  }
  
  private getTopFramework(analysis: FabFormatsAnalysis): { framework: string; confidence: number } | null {
    const frameworks = Object.entries(analysis.frameworkConfidence);
    if (frameworks.length === 0) return null;
    
    const [framework, confidence] = frameworks.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    return { framework, confidence };
  }
}