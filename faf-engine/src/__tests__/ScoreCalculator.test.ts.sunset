/**
 * Tests for ScoreCalculator
 */

import { ScoreCalculator } from '../scoring/ScoreCalculator';

describe('ScoreCalculator', () => {
  let calculator: ScoreCalculator;
  
  beforeEach(() => {
    calculator = new ScoreCalculator();
  });
  
  describe('calculate', () => {
    it('should calculate score from slots', () => {
      const data = {
        project: {
          name: 'Test',
          goal: 'Testing',
          main_language: 'TypeScript',
          generated: new Date().toISOString()
        }
      };
      
      const score = calculator.calculate(data);
      expect(score.totalScore).toBeGreaterThanOrEqual(0);
      expect(score.totalScore).toBeLessThanOrEqual(100);
      expect(score.filledSlots).toBe(3); // name, goal, main_language
      expect(score.totalSlots).toBe(21);
    });
    
    it('should use embedded score when available', () => {
      const data = {
        ai_scoring_system: '2025-08-30',
        ai_score: '75%',
        ai_scoring_details: {
          filled_slots: 16,
          total_slots: 21
        }
      };
      
      const score = calculator.calculate(data);
      expect(score.totalScore).toBe(75);
      expect(score.filledSlots).toBe(16);
    });
    
    it('should calculate confidence levels correctly', () => {
      const testCases = [
        { score: 95, expected: 'VERY_HIGH' },
        { score: 85, expected: 'HIGH' },
        { score: 75, expected: 'GOOD' },
        { score: 65, expected: 'MODERATE' },
        { score: 50, expected: 'LOW' }
      ];
      
      testCases.forEach(({ score, expected }) => {
        const data = {
          ai_scoring_system: '2025-08-30',
          ai_score: `${score}%`
        };
        
        const result = calculator.calculate(data);
        expect(result.confidence).toBe(expected);
      });
    });
    
    it('should count stack slots correctly', () => {
      const data = {
        stack: {
          frontend: 'React',
          css_framework: 'Tailwind',
          backend: 'Express',
          database: 'PostgreSQL',
          hosting: 'Vercel',
          cicd: 'GitHub Actions'
        }
      };
      
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(6);
    });
    
    it('should count human context slots correctly', () => {
      const data = {
        human_context: {
          who: 'Developers',
          what: 'Web application',
          why: 'Productivity',
          where: 'Global',
          when: '2025',
          how: 'Agile'
        }
      };
      
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(6);
    });
    
    it('should ignore default/empty values', () => {
      const data = {
        stack: {
          frontend: 'None',
          backend: 'None',
          database: 'None'
        },
        human_context: {
          who: 'Not specified',
          what: 'Not specified'
        }
      };
      
      const score = calculator.calculate(data);
      expect(score.filledSlots).toBe(0);
    });
  });
});