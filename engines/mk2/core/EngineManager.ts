/**
 * 🏎️⚡️II Engine Manager - Hot Swap System
 * FAF-CLI v2.0.0 with 🏎️⚡️II
 */

import { ScoringEngine, EngineResult, ENGINE_BRAND } from './EngineInterface';
import { FafCoreMK2 } from '../engines/FafCoreMK2';

export class EngineManager {
  private engines = new Map<string, ScoringEngine>();
  private activeEngine: ScoringEngine;
  private readonly brand = ENGINE_BRAND;
  
  constructor() {
    // Register available engines
    this.registerEngine(new FafCoreMK2());
    // Future: VScoreEngine, HybridEngine, FuzzyEngine
    
    // Default to MK2 Core
    this.activeEngine = this.engines.get('FAF-CORE-MK2')!;
  }
  
  private registerEngine(engine: ScoringEngine): void {
    this.engines.set(engine.name, engine);
  }
  
  /**
   * Hot swap to different engine
   */
  swapEngine(engineName: string): boolean {
    const engine = this.engines.get(engineName);
    if (engine) {
      console.log(`🏎️⚡️II Swapping: ${this.activeEngine.name} → ${engine.name}`);
      this.activeEngine = engine;
      return true;
    }
    console.error(`❌ Engine "${engineName}" not found`);
    console.log(`🏎️⚡️II Available engines: ${Array.from(this.engines.keys()).join(', ')}`);
    return false;
  }
  
  /**
   * Calculate using active engine
   */
  async calculate(data: any): Promise<EngineResult> {
    const start = Date.now();
    const result = await this.activeEngine.calculate(data);
    const duration = Date.now() - start;
    
    // Add performance telemetry
    result.metadata = {
      ...result.metadata,
      calculationTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    return result;
  }
  
  /**
   * Get current engine info
   */
  getCurrentEngine(): { name: string; specs: any } {
    return {
      name: this.activeEngine.name,
      specs: this.activeEngine.getSpecs()
    };
  }
  
  /**
   * List all available engines
   */
  listEngines(): string[] {
    return Array.from(this.engines.keys());
  }
  
  /**
   * Compare all engines (admin only)
   */
  async compareAllEngines(data: any): Promise<Map<string, EngineResult>> {
    const results = new Map<string, EngineResult>();
    
    for (const [name, engine] of this.engines) {
      const result = await engine.calculate(data);
      results.set(name, result);
    }
    
    return results;
  }
}