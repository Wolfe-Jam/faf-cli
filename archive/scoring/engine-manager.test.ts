/**
 * 🏎️⚡️II Engine Manager Test Suite
 * Testing hot-swap capability and multi-engine support
 */

import { EngineManager } from '../../engines/mk2/core/EngineManager';
import { ENGINE_BRAND } from '../../engines/mk2/core/EngineInterface';

describe('🏎️⚡️II Engine Manager', () => {
  let manager: EngineManager;
  
  beforeEach(() => {
    manager = new EngineManager();
  });
  
  describe('Basic Operations', () => {
    it('should initialize with FAF-CORE-MK2 as default', () => {
      const current = manager.getCurrentEngine();
      expect(current.name).toBe('FAF-CORE-MK2');
      expect(current.specs.slots).toBe(21);
    });
    
    it('should list available engines', () => {
      const engines = manager.listEngines();
      expect(engines).toContain('FAF-CORE-MK2');
      expect(engines.length).toBeGreaterThanOrEqual(1);
    });
    
    it('should calculate scores with default engine', async () => {
      const result = await manager.calculate({
        project: { name: 'test' },
        stack: { frontend: 'React' }
      });
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.engine).toBe('FAF-CORE-MK2');
      expect(result.brand).toBe('🏎️⚡️II');
    });
  });
  
  describe('Hot Swap Capability', () => {
    it('should swap to valid engine', () => {
      const swapped = manager.swapEngine('FAF-CORE-MK2');
      expect(swapped).toBe(true);
    });
    
    it('should reject invalid engine swap', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      
      const swapped = manager.swapEngine('NON-EXISTENT');
      expect(swapped).toBe(false);
      expect(consoleError).toHaveBeenCalledWith('❌ Engine "NON-EXISTENT" not found');
      
      consoleError.mockRestore();
      consoleLog.mockRestore();
    });
  });
  
  describe('Performance Telemetry', () => {
    it('should add timing metadata', async () => {
      const result = await manager.calculate({
        project: { name: 'perf-test' }
      });
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.calculationTime).toMatch(/\d+ms/);
      expect(result.metadata.timestamp).toBeDefined();
    });
    
    it('should maintain championship performance', async () => {
      const testData = {
        project: { name: 'speed-test' },
        stack: { frontend: 'React', backend: 'Node' }
      };
      
      const result = await manager.calculate(testData);
      const time = parseInt(result.metadata.calculationTime);
      
      expect(time).toBeLessThan(50); // Championship standard
    });
  });
  
  describe('Multi-Engine Comparison', () => {
    it('should compare all engines', async () => {
      const testData = {
        project: { name: 'comparison' },
        stack: { frontend: 'Vue' }
      };
      
      const results = await manager.compareAllEngines(testData);
      
      expect(results.size).toBeGreaterThanOrEqual(1);
      expect(results.has('FAF-CORE-MK2')).toBe(true);
      
      const mk2Result = results.get('FAF-CORE-MK2');
      expect(mk2Result?.brand).toBe('🏎️⚡️II');
    });
  });
  
  describe('Branding Enforcement', () => {
    it('should always include 🏎️⚡️II brand in results', async () => {
      const testCases = [
        null,
        {},
        { project: { name: 'test' } },
        { stack: { frontend: 'React', backend: 'Node' } }
      ];
      
      for (const testData of testCases) {
        const result = await manager.calculate(testData);
        expect(result.brand).toBe('🏎️⚡️II');
      }
    });
  });
});