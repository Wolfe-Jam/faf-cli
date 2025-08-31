/**
 * 🎯 fab-formats System v1.0.0
 * Format-First Discovery Engine with Knowledge Base Intelligence
 * 
 * Revolutionary approach: Detect formats first, then intelligently map to frameworks
 * Based on the proven two-layered search technique from file-utils.ts
 */

import { promises as fs } from "fs";
import path from "path";
import { glob } from "glob";

// 🚀 Import THE MOTHER SHIP - 200+ Format Knowledge Base v1.0.0
import { KNOWLEDGE_BASE } from './fab-formats-knowledge-base.js';

export interface FormatDiscoveryResult {
  fileName: string;
  formatType: string;
  frameworks: string[];
  slotMappings: Record<string, string>;
  priority: number;
  intelligence: 'low' | 'medium' | 'high' | 'very-high' | 'ultra-high';
  confirmed: boolean;
  filePath: string;
}

export interface FabFormatsAnalysis {
  discoveredFormats: FormatDiscoveryResult[];
  totalIntelligenceScore: number;
  confirmedFormats: FormatDiscoveryResult[];
  frameworkConfidence: Record<string, number>;
  slotFillRecommendations: Record<string, string>;
}

/**
 * 🎯 TWO-LAYERED DISCOVERY ENGINE
 * Layer 1: Direct format scanning
 * Layer 2: Content confirmation & usage validation
 */
export class FabFormatsEngine {
  private knowledgeBase = KNOWLEDGE_BASE;

  /**
   * Discover formats using two-layered search technique
   */
  async discoverFormats(projectDir: string = process.cwd()): Promise<FabFormatsAnalysis> {
    const discoveredFormats: FormatDiscoveryResult[] = [];
    
    // LAYER 1: Format Discovery (based on proven two-layered file search)
    const foundFormats = await this.layerOneFormatScan(projectDir);
    
    // LAYER 2: Content Confirmation (validate actual usage)
    for (const formatResult of foundFormats) {
      const confirmed = await this.layerTwoContentConfirmation(formatResult);
      discoveredFormats.push({
        ...formatResult,
        confirmed
      });
    }

    // Analyze results
    return this.analyzeFormats(discoveredFormats);
  }

  /**
   * LAYER 1: Hybrid format scanning (fs.readdir + glob for optimal performance)
   */
  private async layerOneFormatScan(projectDir: string): Promise<FormatDiscoveryResult[]> {
    const results: FormatDiscoveryResult[] = [];
    
    // PHASE 1A: fs.readdir for known config files (fast, precise)
    await this.scanConfigFiles(projectDir, results);
    
    // PHASE 1B: glob for pattern-based discovery (broader, efficient)
    await this.scanPatternFiles(projectDir, results);

    return results;
  }

  /**
   * PHASE 1A: Use fs.readdir for known config files (optimal for specific files)
   */
  private async scanConfigFiles(projectDir: string, results: FormatDiscoveryResult[]): Promise<void> {
    let currentDir = path.resolve(projectDir);

    // Check up to 10 parent directories (same as .faf search)
    for (let i = 0; i < 10; i++) {
      try {
        // Fast directory scan using fs.readdir (optimal for specific files)
        const files = await fs.readdir(currentDir);
        
        // Check each file against known config files
        for (const file of files) {
          const formatInfo = this.knowledgeBase[file];
          if (formatInfo) {
            results.push({
              fileName: file,
              formatType: file,
              frameworks: formatInfo.frameworks,
              slotMappings: formatInfo.slots || {},
              priority: formatInfo.priority,
              intelligence: formatInfo.intelligence as 'low' | 'medium' | 'high' | 'very-high' | 'ultra-high',
              confirmed: false, // Will be confirmed in Layer 2
              filePath: path.join(currentDir, file)
            });
          }
        }

        // Move to parent directory (proven .faf technique)
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
          break; // Reached filesystem root
        }
        currentDir = parentDir;
      } catch {
        // Skip this directory if we can't read it (robust error handling)
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
          break;
        }
        currentDir = parentDir;
      }
    }
  }

  /**
   * PHASE 1B: Use glob for extension-based patterns (optimal for file patterns)
   */
  private async scanPatternFiles(projectDir: string, results: FormatDiscoveryResult[]): Promise<void> {
    try {
      // Use glob for pattern-based discovery (better than fs.readdir for patterns)
      const extensionPatterns = ['**/*.py', '**/*.ts', '**/*.js', '**/*.svelte', '**/*.vue'];
      
      for (const pattern of extensionPatterns) {
        const files = await glob(pattern, {
          cwd: projectDir,
          ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
          absolute: true
        });

        // Limit to first few files per pattern (for performance)
        const limitedFiles = files.slice(0, 5);
        
        for (const filePath of limitedFiles) {
          const ext = path.extname(filePath);
          const formatInfo = this.knowledgeBase[`*${ext}`]; // Pattern matching for extensions
          
          if (formatInfo && !results.some(r => r.filePath === filePath)) {
            results.push({
              fileName: path.basename(filePath),
              formatType: ext,
              frameworks: formatInfo.frameworks,
              slotMappings: formatInfo.slots || {},
              priority: formatInfo.priority,
              intelligence: formatInfo.intelligence as 'low' | 'medium' | 'high' | 'very-high' | 'ultra-high',
              confirmed: false,
              filePath
            });
          }
        }
      }
    } catch {
      // Graceful fallback if glob fails
    }
  }

  /**
   * LAYER 2: Content confirmation (validate actual usage)
   */
  private async layerTwoContentConfirmation(format: FormatDiscoveryResult): Promise<boolean> {
    try {
      const content = await fs.readFile(format.filePath, 'utf-8');
      
      // Confirm usage patterns based on format type
      switch (format.formatType) {
        case 'package.json':
          return this.confirmPackageJsonUsage(content);
        case 'requirements.txt':
          return this.confirmRequirementsUsage(content);
        case 'svelte.config.js':
          return content.includes('svelte') || content.includes('@sveltejs');
        case 'tsconfig.json':
          return content.includes('compilerOptions') || content.includes('typescript');
        case 'Dockerfile':
          return content.includes('FROM') || content.includes('RUN');
        case '.py':
          return content.trim().length > 0; // Has Python code
        case '.ts':
          return content.includes('interface') || content.includes('type') || content.includes('import');
        case '.svelte':
          return content.includes('<script') || content.includes('<style');
        default:
          return content.trim().length > 0;
      }
    } catch {
      return false;
    }
  }

  /**
   * Confirm package.json contains actual dependencies
   */
  private confirmPackageJsonUsage(content: string): boolean {
    try {
      const pkg = JSON.parse(content);
      return !!(pkg.dependencies || pkg.devDependencies || pkg.scripts);
    } catch {
      return false;
    }
  }

  /**
   * Confirm requirements.txt has actual Python packages
   */
  private confirmRequirementsUsage(content: string): boolean {
    const lines = content.split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    );
    return lines.length > 0;
  }

  /**
   * Analyze discovered formats and generate intelligence
   */
  private analyzeFormats(formats: FormatDiscoveryResult[]): FabFormatsAnalysis {
    const confirmedFormats = formats.filter(f => f.confirmed);
    const totalIntelligenceScore = confirmedFormats.reduce((sum, f) => sum + f.priority, 0);
    
    // Calculate framework confidence
    const frameworkConfidence: Record<string, number> = {};
    confirmedFormats.forEach(format => {
      format.frameworks.forEach(framework => {
        frameworkConfidence[framework] = (frameworkConfidence[framework] || 0) + format.priority;
      });
    });

    // Generate slot fill recommendations
    const slotFillRecommendations: Record<string, string> = {};
    confirmedFormats.forEach(format => {
      Object.entries(format.slotMappings).forEach(([slot, value]) => {
        if (!slotFillRecommendations[slot] || format.priority > 20) {
          slotFillRecommendations[slot] = value;
        }
      });
    });

    return {
      discoveredFormats: formats,
      totalIntelligenceScore,
      confirmedFormats,
      frameworkConfidence,
      slotFillRecommendations
    };
  }

  /**
   * Get top framework recommendation
   */
  getTopFramework(analysis: FabFormatsAnalysis): { framework: string; confidence: number } | null {
    const frameworks = Object.entries(analysis.frameworkConfidence);
    if (frameworks.length === 0) {return null;}

    const [framework, confidence] = frameworks.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );

    return { framework, confidence };
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(analysis: FabFormatsAnalysis): string {
    const topFramework = this.getTopFramework(analysis);
    const confirmedCount = analysis.confirmedFormats.length;
    const totalScore = analysis.totalIntelligenceScore;

    return `🎯 fab-formats Analysis: ${confirmedCount} confirmed formats, ${totalScore} intelligence points. ` +
           `Top framework: ${topFramework?.framework || 'Unknown'} (${topFramework?.confidence || 0}% confidence)`;
  }
}