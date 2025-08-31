/**
 * 🚀 FafEngine Mk-1
 * The core Context-On-Demand intelligence engine
 */

import type { 
  FafData, 
  FafScore, 
  FafValidation, 
  EngineOptions,
  PlatformAdapter,
  ContextOnDemandResult 
} from '../types';

import { FabFormatsEngine } from '../formats/FabFormatsEngine';
import { ContextOnDemand } from '../context/ContextOnDemand';
import { ScoreCalculator } from '../scoring/ScoreCalculator';
import { YamlGenerator } from '../generators/YamlGenerator';
import { FileDiscovery } from '../discovery/FileDiscovery';
import { FrameworkDetector } from '../detection/FrameworkDetector';

// Platform Adapters
import { CLIAdapter } from '../adapters/CLIAdapter';
import { VercelAdapter } from '../adapters/VercelAdapter';
import { WebAdapter } from '../adapters/WebAdapter';

export class FafEngine {
  private adapter: PlatformAdapter;
  private fabFormats: FabFormatsEngine;
  private contextOnDemand: ContextOnDemand;
  private scoreCalculator: ScoreCalculator;
  private yamlGenerator: YamlGenerator;
  private fileDiscovery: FileDiscovery;
  private frameworkDetector: FrameworkDetector;
  
  constructor(options: EngineOptions = {}) {
    // Initialize platform adapter
    this.adapter = this.initializeAdapter(options);
    
    // Initialize sub-engines
    this.fabFormats = new FabFormatsEngine(this.adapter);
    this.contextOnDemand = new ContextOnDemand(this.adapter);
    this.scoreCalculator = new ScoreCalculator();
    this.yamlGenerator = new YamlGenerator();
    this.fileDiscovery = new FileDiscovery(this.adapter);
    this.frameworkDetector = new FrameworkDetector(this.adapter);
  }
  
  /**
   * Initialize platform-specific adapter
   */
  private initializeAdapter(options: EngineOptions): PlatformAdapter {
    if (options.adapter) {
      return options.adapter;
    }
    
    switch (options.platform) {
      case 'vercel':
        return new VercelAdapter(options);
      case 'web':
        return new WebAdapter(options);
      case 'cli':
      default:
        return new CLIAdapter(options);
    }
  }
  
  /**
   * 🎯 Main Entry Point: Generate Context-On-Demand
   */
  async generateContext(projectDir?: string): Promise<ContextOnDemandResult> {
    const dir = projectDir || this.adapter.getProjectRoot();
    
    // Phase 1: Format Discovery (fab-formats Mother Ship)
    const formatAnalysis = await this.fabFormats.discoverFormats(dir);
    
    // Phase 2: Framework Detection (evidence-based)
    const frameworkResult = await this.frameworkDetector.detect(dir, formatAnalysis);
    
    // Phase 3: File Discovery (intelligent file selection)
    const files = await this.fileDiscovery.discoverFiles(dir, frameworkResult);
    
    // Phase 4: Context Assembly
    const context = await this.contextOnDemand.assembleContext({
      formatAnalysis,
      frameworkResult,
      files,
      projectDir: dir
    });
    
    // Phase 5: Scoring
    const score = this.scoreCalculator.calculate(context);
    
    // Phase 6: Recommendations
    const recommendations = this.generateRecommendations(context, score);
    
    return {
      context,
      score,
      discovery: formatAnalysis.confirmedFormats,
      recommendations,
      confidence: this.calculateConfidence(score, formatAnalysis)
    };
  }
  
  /**
   * Load existing .faf file
   */
  async loadFaf(filePath: string): Promise<FafData> {
    const content = await this.adapter.readFile(filePath);
    return this.parseFafContent(content);
  }
  
  /**
   * Save .faf file
   */
  async saveFaf(data: FafData, filePath: string): Promise<void> {
    const content = this.yamlGenerator.generate(data);
    await this.adapter.writeFile(filePath, content);
  }
  
  /**
   * Validate .faf data
   */
  validate(data: FafData): FafValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Required fields
    if (!data.project?.name) {
      errors.push('Missing project.name');
    }
    
    // Score the data
    const score = this.scoreCalculator.calculate(data);
    
    // Generate suggestions based on score
    if (score.totalScore < 50) {
      suggestions.push('Add more context to improve AI understanding');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score
    };
  }
  
  /**
   * Calculate score for .faf data
   */
  score(data: FafData): FafScore {
    return this.scoreCalculator.calculate(data);
  }
  
  /**
   * Parse .faf content (YAML)
   */
  private parseFafContent(content: string): FafData {
    // Import yaml dynamically to keep bundle size down
    const yaml = require('yaml');
    return yaml.parse(content);
  }
  
  /**
   * Generate recommendations based on context and score
   */
  private generateRecommendations(_context: FafData, score: FafScore): string[] {
    const recommendations: string[] = [];
    
    // Check missing slots
    if (score.filledSlots < score.totalSlots) {
      const missingPercentage = Math.round(((score.totalSlots - score.filledSlots) / score.totalSlots) * 100);
      recommendations.push(`Fill ${missingPercentage}% more context slots for better AI assistance`);
    }
    
    // Check specific sections
    Object.entries(score.sectionScores).forEach(([section, sectionScore]) => {
      if (sectionScore.percentage < 50) {
        recommendations.push(`Improve ${section}: ${sectionScore.missing.slice(0, 2).join(', ')}`);
      }
    });
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  }
  
  /**
   * Calculate confidence level
   */
  private calculateConfidence(score: FafScore, formatAnalysis: any): number {
    const scoreConfidence = score.totalScore;
    const formatConfidence = Math.min(100, formatAnalysis.totalIntelligenceScore);
    return Math.round((scoreConfidence + formatConfidence) / 2);
  }
  
  /**
   * Get engine version
   */
  getVersion(): string {
    return '1.0.0';
  }
  
  /**
   * Get platform name
   */
  getPlatform(): string {
    return this.adapter.name;
  }
}