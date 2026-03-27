/**
 * Tests for FafEngine
 */

import { FafEngine } from '../core/FafEngine';

describe('FafEngine', () => {
  let engine: FafEngine;
  
  beforeEach(() => {
    engine = new FafEngine({
      platform: 'cli',
      projectDir: '/test/project'
    });
  });
  
  describe('initialization', () => {
    it('should create engine with CLI adapter by default', () => {
      const engine = new FafEngine();
      expect(engine.getPlatform()).toBe('cli');
    });
    
    it('should create engine with specified platform', () => {
      const vercelEngine = new FafEngine({ platform: 'vercel' });
      expect(vercelEngine.getPlatform()).toBe('vercel');
    });
    
    it('should return correct version', () => {
      expect(engine.getVersion()).toBe('1.0.0');
    });
  });
  
  describe('validation', () => {
    it('should validate valid .faf data', () => {
      const validData = {
        project: {
          name: 'Test Project',
          goal: 'Testing',
          main_language: 'TypeScript',
          generated: new Date().toISOString()
        }
      };
      
      const result = engine.validate(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect missing required fields', () => {
      const invalidData = {};
      
      const result = engine.validate(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing project.name');
    });
  });
  
  describe('scoring', () => {
    it('should calculate score for .faf data', () => {
      const data = {
        project: {
          name: 'Test Project',
          goal: 'Testing',
          main_language: 'TypeScript',
          generated: new Date().toISOString()
        },
        stack: {
          frontend: 'React',
          backend: 'Node.js',
          database: 'PostgreSQL',
          hosting: 'Vercel'
        }
      };
      
      const score = engine.score(data);
      expect(score.totalScore).toBeGreaterThan(0);
      expect(score.filledSlots).toBeGreaterThan(0);
      expect(score.totalSlots).toBe(21);
    });
    
    it('should respect embedded scores with COUNT ONCE architecture', () => {
      const data = {
        ai_scoring_system: '2025-08-30',
        ai_score: '85%',
        ai_scoring_details: {
          filled_slots: 18,
          total_slots: 21
        }
      };
      
      const score = engine.score(data);
      expect(score.totalScore).toBe(85);
      expect(score.filledSlots).toBe(18);
      expect(score.totalSlots).toBe(21);
    });
  });
});