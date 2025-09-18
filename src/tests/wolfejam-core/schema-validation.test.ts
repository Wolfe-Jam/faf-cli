/**
 * 🔒 Schema Validation Engine Tests - BRAKE SYSTEM CRITICAL
 * 
 * This is a Tier 1 critical system test. When this system fails, users get:
 * - Corrupted .faf files
 * - Data loss and corruption
 * - Invalid context that crashes AI systems
 * 
 * Like brakes on an F1 car - this MUST work flawlessly.
 */

import { describe, it, expect } from '@jest/globals';
import { validateSchema, ValidationResult, FafSchema } from '../../schema/faf-schema';

describe('🔒 Schema Validation Engine - BRAKE SYSTEM TESTS', () => {
  describe('🚨 CRITICAL: Required Field Validation', () => {
    it('should validate perfect .faf file without errors', () => {
      const perfectFaf: FafSchema = {
        faf_version: "2.4.0",
        generated: "2025-01-23T10:30:00Z",
        project: {
          name: "test-project",
          main_language: "TypeScript",
          faf_score: 85
        },
        stack: {
          frontend: "React",
          backend: "Node.js"
        },
        scores: {
          faf_score: 85,
          slot_based_percentage: 75,
          total_slots: 21
        },
        ai_instructions: {
          priority: "high",
          usage: "development",
          message: "Test project for validation"
        },
        preferences: {
          quality_bar: "championship",
          commit_style: "conventional"
        },
        state: {
          phase: "development",
          version: "1.0.0"
        }
      };

      const result = validateSchema(perfectFaf);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.requiredFieldsFound).toBe(6); // All required fields present
      expect(result.sectionsFound).toBeGreaterThan(4); // All core sections present
    });

    it('should detect missing required fields with surgical precision', () => {
      const invalidFaf = {
        faf_version: "2.4.0",
        // missing: generated, project.name, project.main_language, scores
        project: {
          goal: "test project without required fields"
        }
      };

      const result = validateSchema(invalidFaf);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3); // Missing multiple required fields
      
      // Should identify specific missing fields
      const errorMessages = result.errors.map(e => e.message);
      expect(errorMessages.some(msg => msg.includes("project.name"))).toBe(true);
      expect(errorMessages.some(msg => msg.includes("project.main_language"))).toBe(true);
      expect(errorMessages.some(msg => msg.includes("generated"))).toBe(true);
    });

    it('should validate required field types correctly', () => {
      const typeMismatchFaf = {
        faf_version: "2.4.0",
        generated: "2025-01-23T10:30:00Z",
        project: {
          name: "", // Empty string should fail
          main_language: null, // Null should fail
          faf_score: "not-a-number" // Wrong type
        },
        scores: {
          faf_score: -50, // Invalid range
          slot_based_percentage: 150, // Invalid range
          total_slots: 21
        }
      };

      const result = validateSchema(typeMismatchFaf);
      
      expect(result.valid).toBe(false);
      
      // Should catch range violations
      const rangeErrors = result.errors.filter(e => 
        e.message.includes("must be between 0-100")
      );
      expect(rangeErrors.length).toBe(2); // Both faf_score and slot_based_percentage
    });
  });

  describe('🚨 CRITICAL: Data Integrity Protection', () => {
    it('should prevent data corruption from malformed input', () => {
      const malformedInputs = [
        null,
        undefined,
        "",
        "not-json",
        123,
        [],
        { completely: "wrong structure" }
      ];

      malformedInputs.forEach(input => {
        const result = validateSchema(input);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should handle deeply nested corruption gracefully', () => {
      const corruptedFaf = {
        faf_version: "2.4.0",
        generated: "2025-01-23T10:30:00Z",
        project: {
          name: "test",
          main_language: "JavaScript",
          // Malicious nested object
          malicious: {
            deeply: {
              nested: {
                corruption: "payload"
              }
            }
          }
        },
        scores: {
          faf_score: 85,
          slot_based_percentage: 75,
          total_slots: 21
        }
      };

      const result = validateSchema(corruptedFaf);
      
      // Should validate successfully (schema allows additional fields)
      // But should maintain required field integrity
      expect(result.requiredFieldsFound).toBeGreaterThan(3);
    });

    it('should validate version format integrity', () => {
      const invalidVersions = [
        "not-a-version",
        "1.2",
        "1.2.3.4",
        "v1.2.3",
        "",
        null,
        123
      ];

      invalidVersions.forEach(version => {
        const faf = {
          faf_version: version,
          generated: "2025-01-23T10:30:00Z",
          project: { name: "test", main_language: "JavaScript" },
          scores: { faf_score: 85, slot_based_percentage: 75, total_slots: 21 }
        };

        const result = validateSchema(faf);
        
        if (version === null || version === "") {
          expect(result.valid).toBe(false); // Required field missing
        } else {
          // Should have version format warning
          const versionWarnings = result.warnings.filter(w => 
            w.path === "faf_version" || w.message.includes("version")
          );
          expect(versionWarnings.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('⚡️ PERFORMANCE: Championship Validation Speed', () => {
    it('should validate small files in <10ms', () => {
      const smallFaf = {
        faf_version: "2.4.0",
        generated: "2025-01-23T10:30:00Z",
        project: { name: "small-test", main_language: "JavaScript" },
        scores: { faf_score: 85, slot_based_percentage: 75, total_slots: 21 }
      };

      const startTime = Date.now();
      const result = validateSchema(smallFaf);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10); // Championship validation speed
      expect(result).toBeDefined();
    });

    it('should validate large complex files in <50ms', () => {
      // Create complex .faf with all possible sections
      const complexFaf = {
        faf_version: "2.4.0",
        generated: "2025-01-23T10:30:00Z",
        project: {
          name: "complex-project",
          goal: "Complex validation test",
          main_language: "TypeScript",
          faf_score: 95,
          importance: "critical"
        },
        stack: {
          frontend: "React",
          css_framework: "Tailwind",
          ui_library: "Chakra UI",
          state_management: "Zustand",
          backend: "FastAPI",
          runtime: "Node.js",
          build: "Vite",
          package_manager: "pnpm",
          api_type: "REST"
        },
        scores: {
          faf_score: 95,
          slot_based_percentage: 90,
          total_slots: 21,
          scoring_philosophy: "comprehensive"
        },
        ai_instructions: {
          priority: "ultra-high",
          usage: "production-ready",
          message: "Complex project with full context"
        },
        preferences: {
          quality_bar: "championship",
          commit_style: "conventional",
          communication: "concise",
          verbosity: "minimal"
        },
        state: {
          phase: "production",
          version: "2.0.0",
          focus: "optimization",
          status: "active"
        },
        tags: {
          auto_generated: ["typescript", "react", "fastapi"],
          smart_defaults: ["tailwind", "conventional-commits"],
          user_defined: ["performance", "scalability"]
        },
        human_context: {
          who: "Development team",
          what: "High-performance web application",
          why: "Business critical system",
          where: "Production environment",
          when: "Q1 2025",
          how: "Agile development",
          additional_context: {
            constraints: ["performance", "security"],
            goals: ["scalability", "maintainability"]
          },
          context_score: 95,
          total_prd_score: 90,
          success_rate: "99.9%"
        }
      };

      const startTime = Date.now();
      const result = validateSchema(complexFaf);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(50); // Championship speed even for complex files
      expect(result.valid).toBe(true);
      expect(result.sectionsFound).toBeGreaterThan(5);
    });
  });

  describe('⌚️ ACCURACY: Edge Case Handling', () => {
    it('should handle timestamp edge cases', () => {
      const timestampTests = [
        "2025-01-23T10:30:00Z", // Valid ISO
        "2025-01-23T10:30:00.123Z", // Valid with milliseconds
        "invalid-timestamp", // Invalid format
        "2025-13-45T25:99:99Z", // Invalid values
        "", // Empty
        null // Null
      ];

      timestampTests.forEach(timestamp => {
        const faf = {
          faf_version: "2.4.0",
          generated: timestamp,
          project: { name: "timestamp-test", main_language: "JavaScript" },
          scores: { faf_score: 85, slot_based_percentage: 75, total_slots: 21 }
        };

        const result = validateSchema(faf);
        
        if (timestamp === null || timestamp === "") {
          expect(result.valid).toBe(false); // Required field missing
        } else if (timestamp === "2025-01-23T10:30:00Z" || timestamp === "2025-01-23T10:30:00.123Z") {
          expect(result.valid).toBe(true); // Valid timestamps
        } else {
          // Invalid timestamps should generate warnings
          const timestampWarnings = result.warnings.filter(w => 
            w.path === "generated" || w.message.includes("timestamp")
          );
          expect(timestampWarnings.length).toBeGreaterThan(0);
        }
      });
    });

    it('should handle score boundary conditions', () => {
      const boundaryTests = [
        { faf_score: 0, slot_based_percentage: 0 }, // Minimum valid
        { faf_score: 100, slot_based_percentage: 100 }, // Maximum valid
        { faf_score: -1, slot_based_percentage: 50 }, // Below minimum
        { faf_score: 101, slot_based_percentage: 50 }, // Above maximum
        { faf_score: 50, slot_based_percentage: -1 }, // Percentage below minimum
        { faf_score: 50, slot_based_percentage: 101 }, // Percentage above maximum
        { faf_score: 50.5, slot_based_percentage: 75.7 }, // Decimal values (valid)
        { faf_score: "not-number", slot_based_percentage: "invalid" } // Wrong types
      ];

      boundaryTests.forEach((scores, index) => {
        const faf = {
          faf_version: "2.4.0",
          generated: "2025-01-23T10:30:00Z",
          project: { name: `boundary-test-${index}`, main_language: "JavaScript" },
          scores: { ...scores, total_slots: 21 }
        };

        const result = validateSchema(faf);
        
        if (index <= 1 || index === 6) { // Valid cases
          expect(result.errors.filter(e => e.message.includes("must be between")).length).toBe(0);
        } else if (index >= 2 && index <= 5) { // Invalid ranges
          expect(result.errors.filter(e => e.message.includes("must be between")).length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('🔒 SECURITY: Malicious Input Protection', () => {
    it('should handle malicious payload injection attempts', () => {
      const maliciousPayloads = [
        { project: { name: "<script>alert('xss')</script>", main_language: "JavaScript" }},
        { project: { name: "'; DROP TABLE users; --", main_language: "SQL" }},
        { project: { name: "{{constructor.constructor('return process')().exit()}}", main_language: "JavaScript" }},
        { project: { name: "\x00\x01\x02\x03", main_language: "Binary" }}
      ];

      maliciousPayloads.forEach(payload => {
        const maliciousFaf = {
          faf_version: "2.4.0",
          generated: "2025-01-23T10:30:00Z",
          ...payload,
          scores: { faf_score: 85, slot_based_percentage: 75, total_slots: 21 }
        };

        // Should not crash or throw errors
        expect(() => {
          const result = validateSchema(maliciousFaf);
          expect(result).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should handle circular reference attempts', () => {
      const circularFaf: any = {
        faf_version: "2.4.0",
        generated: "2025-01-23T10:30:00Z",
        project: { name: "circular-test", main_language: "JavaScript" },
        scores: { faf_score: 85, slot_based_percentage: 75, total_slots: 21 }
      };
      
      // Create circular reference
      circularFaf.circular = circularFaf;

      // Should not crash or cause infinite loops
      expect(() => {
        const result = validateSchema(circularFaf);
        expect(result).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('🔄 CONSISTENCY: Validation Reliability', () => {
    it('should produce identical results on multiple validations', () => {
      const testFaf = {
        faf_version: "2.4.0",
        generated: "2025-01-23T10:30:00Z",
        project: { name: "consistency-test", main_language: "JavaScript" },
        scores: { faf_score: 85, slot_based_percentage: 75, total_slots: 21 }
      };

      const result1 = validateSchema(testFaf);
      const result2 = validateSchema(testFaf);
      const result3 = validateSchema(testFaf);
      
      expect(result1.valid).toBe(result2.valid);
      expect(result2.valid).toBe(result3.valid);
      expect(result1.errors.length).toBe(result2.errors.length);
      expect(result2.errors.length).toBe(result3.errors.length);
      expect(result1.requiredFieldsFound).toBe(result2.requiredFieldsFound);
      expect(result2.requiredFieldsFound).toBe(result3.requiredFieldsFound);
    });
  });
});

/**
 * 🏆 WOLFEJAM TESTING CENTER SCHEMA VALIDATION CHECKLIST
 * *McLaren-Inspired Engineering Excellence 🍊*
 * 
 * ☑️ Critical field validation (prevents corrupted .faf files)
 * ☑️ Data integrity protection (prevents data loss)
 * ☑️ Championship performance (<10ms small, <50ms complex)
 * ☑️ Edge case handling (timestamps, boundaries, types)
 * ☑️ Security protection (XSS, injection, circular refs)
 * ☑️ Validation reliability (consistent results)
 * 
 * This test suite ensures our schema validation performs
 * at championship standards - when users create .faf files,
 * this system MUST prevent corruption and ensure integrity.
 */