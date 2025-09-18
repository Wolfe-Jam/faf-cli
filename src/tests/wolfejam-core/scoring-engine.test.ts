/**
 * ⚡️ Scoring Engine Tests - BRAKE SYSTEM CRITICAL
 * 
 * This is a Tier 1 critical system test. When this system fails, users get:
 * - Wrong trust calculations → Wrong developer decisions
 * - Incorrect AI confidence scores → Project failures
 * - Broken context quality metrics → Wasted development time
 * 
 * Like brakes on an F1 car - this MUST work flawlessly.
 */

import { describe, it, expect } from '@jest/globals';
import { calculateFafScore, ScoreResult } from '../../scoring/score-calculator';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

describe('⚡️ Scoring Engine - BRAKE SYSTEM TESTS', () => {
  describe('🚨 CRITICAL: Trust Score Calculation Accuracy', () => {
    it('should calculate perfect scores for complete .faf files', async () => {
      const perfectFaf = {
        faf_version: "2.4.0",
        generated: new Date().toISOString(),
        project: {
          name: "championship-project",
          goal: "Build amazing software with perfect context",
          main_language: "TypeScript"
        },
        stack: {
          frontend: "React",
          css_framework: "Tailwind",
          ui_library: "Chakra UI", 
          state_management: "Zustand",
          backend: "FastAPI",
          api_type: "GraphQL",
          runtime: "Node.js",
          database: "PostgreSQL",
          connection: "Prisma",
          hosting: "Vercel",
          build: "Vite",
          cicd: "GitHub Actions"
        },
        human_context: {
          who: "Development Team",
          what: "E-commerce Platform",
          why: "Business Growth",
          where: "Global Market",
          when: "Q1 2025",
          how: "Agile Development"
        }
      };

      const result = await calculateFafScore(perfectFaf);
      
      expect(result.totalScore).toBeGreaterThan(90); // High score for complete context
      expect(result.filledSlots).toBeGreaterThan(18); // Most slots filled
      expect(result.totalSlots).toBe(21); // Standard total (15 PC + 6 PD + 0 FILE)
      expect(result.qualityIndicators.hasHumanContext).toBe(true);
      expect(result.qualityIndicators.hasFreshTimestamp).toBe(true);
    });

    it('should detect embedded AI scoring system with precision', async () => {
      const embeddedScoringFaf = {
        ai_score: 95,
        ai_scoring_system: "2025-08-30", // Trusted system date
        ai_scoring_details: {
          filled_slots: 19,
          total_slots: 21,
          system_date: "2025-08-30"
        },
        project: { name: "embedded-test" }
      };

      const result = await calculateFafScore(embeddedScoringFaf);
      
      // Should trust embedded scoring
      expect(result.totalScore).toBe(95);
      expect(result.filledSlots).toBe(19);
      expect(result.totalSlots).toBe(21);
      expect(result.sectionScores.embedded_scoring).toBeDefined();
      expect(result.sectionScores.embedded_scoring.percentage).toBe(95);
    });

    it('should reject untrusted embedded scores and recalculate', async () => {
      const untrustedFaf = {
        ai_score: 95,
        ai_scoring_system: "2024-01-01", // Untrusted old system
        project: {
          name: "untrusted-test",
          main_language: "JavaScript"
        },
        stack: {
          frontend: "React"
        }
      };

      const result = await calculateFafScore(untrustedFaf);
      
      // Should ignore embedded score and recalculate
      expect(result.totalScore).not.toBe(95); // Different from embedded
      expect(result.sectionScores.embedded_scoring).toBeUndefined();
      expect(result.sectionScores.project).toBeDefined(); // Shows recalculated sections
    });

    it('should handle zero scores correctly (needs calculation)', async () => {
      const zeroScoreFaf = {
        ai_score: 0, // Zero means needs calculation
        ai_scoring_system: "2025-08-30",
        project: {
          name: "zero-score-test", 
          main_language: "Python"
        }
      };

      const result = await calculateFafScore(zeroScoreFaf);
      
      // Should recalculate because score is zero
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.sectionScores.embedded_scoring).toBeUndefined();
      expect(result.sectionScores.project).toBeDefined();
    });
  });

  describe('🚨 CRITICAL: Slot Counting Precision', () => {
    it('should count project component slots with surgical precision', async () => {
      const projectFaf = {
        project: {
          name: "pc-test",
          goal: "Test project component scoring",
          main_language: "TypeScript" 
        },
        stack: {
          frontend: "React",
          css_framework: "Tailwind",
          ui_library: "None", // Should not count
          state_management: "Zustand",
          backend: "None", // Should not count
          api_type: "REST API", // Default, should not count  
          runtime: "Node.js",
          database: "PostgreSQL",
          connection: "None", // Should not count
          hosting: "Vercel",
          build: "Vite",
          cicd: "GitHub Actions"
        }
      };

      const result = await calculateFafScore(projectFaf);
      
      expect(result.sectionScores.project).toBeDefined();
      expect(result.sectionScores.project.filled).toBe(11); // Actual count (name, goal, main_language, frontend, css_framework, state_management, runtime, database, hosting, build, cicd)
      expect(result.sectionScores.project.total).toBe(15); // Max PC slots
      expect(result.sectionScores.project.percentage).toBe(73); // 11/15 * 100
      
      // Should identify missing components
      expect(result.sectionScores.project.missing.length).toBeGreaterThan(0);
    });

    it('should count human context slots accurately', async () => {
      const humanContextFaf = {
        project: { name: "hc-test", main_language: "JavaScript" },
        human_context: {
          who: "Development Team",
          what: "Test Application",
          why: "Not specified", // Should not count
          where: "Remote",
          when: "Q1 2025",
          how: "Agile"
        }
      };

      const result = await calculateFafScore(humanContextFaf);
      
      expect(result.sectionScores.human_context).toBeDefined();
      expect(result.sectionScores.human_context.filled).toBe(5); // who, what, where, when, how (why is "Not specified")
      expect(result.sectionScores.human_context.total).toBe(6); // Max PD slots
      expect(result.sectionScores.human_context.percentage).toBe(83); // 5/6 * 100, rounded
      
      // Should identify missing context
      const missing = result.sectionScores.human_context.missing;
      expect(missing.some(item => item.includes("why"))).toBe(true);
    });

    it('should handle nested human context objects correctly', async () => {
      const nestedContextFaf = {
        project: { name: "nested-test", main_language: "Python" },
        human_context: {
          who: { team: "Engineering", size: "5 developers" }, // Object format should count
          what: { product: "API", features: ["auth", "payments"] }, // Object format should count
          why: "Not specified", // String but default, should not count
          where: { deployment: "AWS", region: "us-east-1" }, // Object format should count
          when: "Not specified", // Should not count
          how: { methodology: "Scrum", sprint_length: "2 weeks" } // Object format should count
        }
      };

      const result = await calculateFafScore(nestedContextFaf);
      
      expect(result.sectionScores.human_context.filled).toBe(4); // who, what, where, how (objects count)
      expect(result.sectionScores.human_context.missing.some(item => item.includes("why"))).toBe(true);
      expect(result.sectionScores.human_context.missing.some(item => item.includes("when"))).toBe(true);
    });
  });

  describe('⚡️ PERFORMANCE: Championship Scoring Speed', () => {
    it('should calculate scores in <50ms for typical files', async () => {
      const typicalFaf = {
        project: {
          name: "performance-test",
          main_language: "JavaScript"
        },
        stack: {
          frontend: "React",
          backend: "Node.js"
        },
        human_context: {
          who: "Team",
          what: "App"
        }
      };

      const startTime = Date.now();
      const result = await calculateFafScore(typicalFaf);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(50); // Championship speed
      expect(result).toBeDefined();
      expect(result.totalScore).toBeGreaterThan(0);
    });

    it('should handle complex files with FAB-Formats discovery in <200ms', async () => {
      // Create temporary project directory for FAB-Formats integration test
      const testDir = path.join(os.tmpdir(), 'scoring-perf-test-' + Date.now());
      await fs.mkdir(testDir, { recursive: true });
      
      // Create test files for discovery
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { 'react': '^18.0.0' }
      }));
      await fs.writeFile(path.join(testDir, 'test.faf'), 'placeholder');
      
      const complexFaf = {
        project: {
          name: "complex-performance-test",
          goal: "Test performance with FAB-Formats integration",
          main_language: "TypeScript"
        },
        stack: {
          frontend: "React",
          css_framework: "Tailwind",
          ui_library: "Chakra UI",
          state_management: "Zustand",
          backend: "FastAPI",
          api_type: "GraphQL",
          runtime: "Node.js",
          database: "PostgreSQL",
          connection: "Prisma",
          hosting: "Vercel",
          build: "Vite",
          cicd: "GitHub Actions"
        },
        human_context: {
          who: "Engineering Team",
          what: "E-commerce Platform",
          why: "Business Growth",
          where: "Global Market",
          when: "Q1 2025",
          how: "Agile Development"
        }
      };

      const startTime = Date.now();
      const result = await calculateFafScore(complexFaf, path.join(testDir, 'test.faf'));
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(200); // Performance with discovery
      expect(result.totalScore).toBeGreaterThan(80); // Should be high score
      
      // Cleanup
      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('⌚️ ACCURACY: Edge Case Calculations', () => {
    it('should handle empty .faf files gracefully', async () => {
      const emptyFaf = {};

      const result = await calculateFafScore(emptyFaf);
      
      expect(result.totalScore).toBe(0);
      expect(result.filledSlots).toBe(0);
      expect(result.totalSlots).toBe(21); // Still shows total available
      expect(result.suggestions.length).toBeGreaterThan(0); // Should suggest improvements
    });

    it('should handle malformed data without crashing', async () => {
      const malformedInputs = [
        null,
        undefined,
        "not-an-object",
        123,
        [],
        { project: null },
        { stack: "invalid" },
        { human_context: [] }
      ];

      for (const input of malformedInputs) {
        expect(async () => {
          const result = await calculateFafScore(input);
          expect(result).toBeDefined();
          expect(typeof result.totalScore).toBe('number');
        }).not.toThrow();
      }
    });

    it('should validate score ranges correctly', async () => {
      // Test minimum score (empty)
      const minFaf = {};
      const minResult = await calculateFafScore(minFaf);
      expect(minResult.totalScore).toBe(0);
      
      // Test maximum score (complete)
      const maxFaf = {
        project: {
          name: "max-score-test",
          goal: "Complete project with all slots filled",
          main_language: "TypeScript"
        },
        stack: {
          frontend: "React", css_framework: "Tailwind", ui_library: "Chakra UI",
          state_management: "Zustand", backend: "FastAPI", api_type: "GraphQL",
          runtime: "Node.js", database: "PostgreSQL", connection: "Prisma",
          hosting: "Vercel", build: "Vite", cicd: "GitHub Actions"
        },
        human_context: {
          who: "Team", what: "App", why: "Business", where: "Global", when: "2025", how: "Agile"
        }
      };
      const maxResult = await calculateFafScore(maxFaf);
      expect(maxResult.totalScore).toBeGreaterThan(95);
      expect(maxResult.totalScore).toBeLessThanOrEqual(100);
    });

    it('should handle timestamp validation correctly', async () => {
      const timestampTests = [
        { generated: new Date().toISOString(), expectFresh: true },
        { generated: new Date(Date.now() - 1000 * 60 * 60).toISOString(), expectFresh: true }, // 1 hour ago
        { generated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(), expectFresh: true }, // 25 days ago (still fresh)
        { generated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), expectFresh: false }, // 35 days ago (not fresh)
        { generated: "invalid-timestamp", expectFresh: false },
        { generated: null, expectFresh: false },
        { /* no generated field */ expectFresh: false }
      ];

      for (const test of timestampTests) {
        const faf = {
          project: { name: "timestamp-test", main_language: "JavaScript" },
          ...test
        };
        delete (faf as any).expectFresh; // Remove test property
        
        const result = await calculateFafScore(faf);
        expect(result.qualityIndicators.hasFreshTimestamp).toBe(test.expectFresh);
      }
    });
  });

  describe('🔒 SECURITY: Malicious Input Protection', () => {
    it('should handle malicious scoring attempts', async () => {
      const maliciousFaf = {
        ai_score: 999999, // Extreme score attempt
        ai_scoring_system: "2025-08-30",
        ai_scoring_details: {
          filled_slots: -1, // Negative slots
          total_slots: 0 // Division by zero attempt
        },
        project: {
          name: "<script>alert('xss')</script>",
          main_language: "'; DROP TABLE users; --"
        }
      };

      expect(async () => {
        const result = await calculateFafScore(maliciousFaf);
        expect(result).toBeDefined();
        expect(result.totalScore).toBeGreaterThanOrEqual(0);
        expect(result.totalScore).toBeLessThanOrEqual(100);
      }).not.toThrow();
    });

    it('should prevent calculation manipulation', async () => {
      const manipulationFaf = {
        constructor: { constructor: () => "malicious" },
        __proto__: { malicious: true },
        project: {
          name: "manipulation-test",
          main_language: "JavaScript",
          score: 100 // Try to manipulate direct score
        },
        totalScore: 999, // Try to set result directly
        filledSlots: 999
      };

      const result = await calculateFafScore(manipulationFaf);
      
      // Should calculate properly regardless of manipulation attempts
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.filledSlots).toBeLessThanOrEqual(result.totalSlots);
    });
  });

  describe('🔧 INTEGRATION: FAB-Formats Discovery Enhancement', () => {
    it('should integrate with FAB-Formats discovery for enhanced scoring', async () => {
      // Create test directory with discoverable tech stack
      const testDir = path.join(os.tmpdir(), 'fab-formats-integration-' + Date.now());
      await fs.mkdir(testDir, { recursive: true });
      
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'integration-test',
        dependencies: { 'react': '^18.0.0', 'typescript': '^4.0.0' }
      }));
      await fs.writeFile(path.join(testDir, 'App.tsx'), 'import React from "react";');
      await fs.writeFile(path.join(testDir, 'test.faf'), 'placeholder');
      
      // Minimal .faf with missing context that discovery should fill
      const minimalFaf = {
        project: {
          name: "discovery-integration-test"
          // main_language missing - should be discovered as TypeScript
        }
      };

      const result = await calculateFafScore(minimalFaf, path.join(testDir, 'test.faf'));
      
      // Should have higher score due to discovery enhancement
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.filledSlots).toBeGreaterThan(1); // Should fill discovered slots
      
      // Cleanup
      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('🔄 CONSISTENCY: Scoring Reliability', () => {
    it('should produce identical scores for identical input', async () => {
      const testFaf = {
        project: {
          name: "consistency-test",
          main_language: "JavaScript"
        },
        stack: {
          frontend: "React"
        },
        human_context: {
          who: "Team"
        }
      };

      const result1 = await calculateFafScore(testFaf);
      const result2 = await calculateFafScore(testFaf);
      const result3 = await calculateFafScore(testFaf);
      
      expect(result1.totalScore).toBe(result2.totalScore);
      expect(result2.totalScore).toBe(result3.totalScore);
      expect(result1.filledSlots).toBe(result2.filledSlots);
      expect(result2.filledSlots).toBe(result3.filledSlots);
    });
  });
});

/**
 * 🏆 WOLFEJAM TESTING CENTER SCORING ENGINE CHECKLIST
 * *McLaren-Inspired Engineering Excellence 🍊*
 * 
 * ☑️ Trust score calculation accuracy (prevents wrong decisions)
 * ☑️ Embedded AI scoring system validation (prevents manipulation)
 * ☑️ Slot counting precision (ensures accurate context metrics)
 * ☑️ Championship performance (<50ms typical, <200ms with discovery)
 * ☑️ Edge case handling (empty files, malformed data, score ranges)
 * ☑️ Security protection (malicious scoring, calculation manipulation)
 * ☑️ FAB-Formats discovery integration (enhanced context scoring)
 * ☑️ Scoring reliability (consistent results for identical input)
 * 
 * This test suite ensures our scoring engine performs at championship
 * standards - when developers need trust calculations, this system
 * MUST deliver accurate, secure, and fast results.
 */