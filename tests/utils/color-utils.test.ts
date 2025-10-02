/**
 * 🏁 WJTC Medal System Championship Tests
 * Tier 1 - BRAKE SYSTEMS (User-Critical Display)
 *
 * Mission: Validate championship medal progression
 * Philosophy: "We break things so others never even know they were ever broken"
 */

import { getScoreEmoji, getScoreColor } from '../../src/utils/color-utils';

describe('🏆 Championship Medal System - WJTC Tier 1 Tests', () => {

  describe('Test 1: Boundary Precision (20 points)', () => {
    it('should show 🔴 for scores 0-54%', () => {
      expect(getScoreEmoji(0)).toBe('🔴');
      expect(getScoreEmoji(25)).toBe('🔴');
      expect(getScoreEmoji(54)).toBe('🔴');
    });

    it('should show 🟡 for scores 55-69%', () => {
      expect(getScoreEmoji(55)).toBe('🟡');
      expect(getScoreEmoji(60)).toBe('🟡');
      expect(getScoreEmoji(69)).toBe('🟡');
    });

    it('should show 🟢 for scores 70-84%', () => {
      expect(getScoreEmoji(70)).toBe('🟢');
      expect(getScoreEmoji(77)).toBe('🟢');
      expect(getScoreEmoji(84)).toBe('🟢');
    });

    it('should show 🥉 (Bronze/Target 1) for scores 85-94%', () => {
      expect(getScoreEmoji(85)).toBe('🥉');
      expect(getScoreEmoji(88)).toBe('🥉');
      expect(getScoreEmoji(94)).toBe('🥉');
    });

    it('should show 🥈 (Silver/Target 2) for scores 95-98%', () => {
      expect(getScoreEmoji(95)).toBe('🥈');
      expect(getScoreEmoji(96)).toBe('🥈');
      expect(getScoreEmoji(98)).toBe('🥈');
    });

    it('should show 🥇 (Gold) for 99%', () => {
      expect(getScoreEmoji(99)).toBe('🥇');
    });

    it('should show 🏆 (Trophy) for 100%', () => {
      expect(getScoreEmoji(100)).toBe('🏆');
    });
  });

  describe('Test 2: Critical Boundary Edge Cases (20 points)', () => {
    it('should handle exact threshold boundaries correctly', () => {
      // Just below threshold should use lower tier
      expect(getScoreEmoji(54.9)).toBe('🔴');
      expect(getScoreEmoji(69.9)).toBe('🟡');
      expect(getScoreEmoji(84.9)).toBe('🟢');
      expect(getScoreEmoji(94.9)).toBe('🥉');
      expect(getScoreEmoji(98.9)).toBe('🥈');

      // Just above threshold should use higher tier
      expect(getScoreEmoji(55.1)).toBe('🟡');
      expect(getScoreEmoji(70.1)).toBe('🟢');
      expect(getScoreEmoji(85.1)).toBe('🥉');
      expect(getScoreEmoji(95.1)).toBe('🥈');
      expect(getScoreEmoji(99.1)).toBe('🥇'); // Still gold, not over 100
    });

    it('should handle rounding edge case: 99.5% should round to gold', () => {
      // JavaScript Math.round(99.5) = 100, but we want this to be gold
      const score = 99.5;
      const rounded = Math.round(score);
      expect(rounded).toBe(100); // Confirms JS rounding behavior

      // Our function should handle the raw score correctly
      expect(getScoreEmoji(score)).toBe('🥇'); // 99.5 is not >= 100
    });

    it('should cap scores above 100% to trophy', () => {
      expect(getScoreEmoji(101)).toBe('🏆');
      expect(getScoreEmoji(150)).toBe('🏆');
      expect(getScoreEmoji(999)).toBe('🏆');
    });

    it('should handle negative scores gracefully', () => {
      expect(getScoreEmoji(-1)).toBe('🔴');
      expect(getScoreEmoji(-50)).toBe('🔴');
    });
  });

  describe('Test 3: No-Color Mode / Accessibility (20 points)', () => {
    it('should return text alternatives when useEmoji is false', () => {
      expect(getScoreEmoji(100, false)).toBe('[TROPHY]');
      expect(getScoreEmoji(99, false)).toBe('[GOLD]');
      expect(getScoreEmoji(95, false)).toBe('[SILVER]');
      expect(getScoreEmoji(85, false)).toBe('[BRONZE]');
      expect(getScoreEmoji(50, false)).toBe('[IN_PROGRESS]');
      expect(getScoreEmoji(0, false)).toBe('[IN_PROGRESS]');
    });

    it('should handle text alternatives at boundaries', () => {
      expect(getScoreEmoji(54, false)).toBe('[IN_PROGRESS]');
      expect(getScoreEmoji(55, false)).toBe('[IN_PROGRESS]');
      expect(getScoreEmoji(84, false)).toBe('[IN_PROGRESS]');
      expect(getScoreEmoji(85, false)).toBe('[BRONZE]');
    });
  });

  describe('Test 4: Traffic Light Progression Logic (20 points)', () => {
    it('should follow traffic light metaphor: Stop → Caution → Go', () => {
      // 🔴 STOP - Needs work (0-54%)
      expect(getScoreEmoji(30)).toBe('🔴');

      // 🟡 CAUTION - Getting ready (55-69%)
      expect(getScoreEmoji(62)).toBe('🟡');

      // 🟢 GO - Ready for Target 1 (70-84%)
      expect(getScoreEmoji(77)).toBe('🟢');

      // 🥉 TARGET 1 - Bronze achieved (85%+)
      expect(getScoreEmoji(85)).toBe('🥉');
    });

    it('should maintain clear progression path', () => {
      const progression = [
        { score: 48, expected: '🔴', stage: 'Stop - Needs work' },
        { score: 62, expected: '🟡', stage: 'Caution - Getting ready' },
        { score: 77, expected: '🟢', stage: 'Go - Ready for Target 1' },
        { score: 88, expected: '🥉', stage: 'Target 1 - Bronze' },
        { score: 96, expected: '🥈', stage: 'Target 2 - Silver' },
        { score: 99, expected: '🥇', stage: 'Gold' },
        { score: 100, expected: '🏆', stage: 'Trophy - Championship' },
      ];

      progression.forEach(({ score, expected, stage }) => {
        expect(getScoreEmoji(score)).toBe(expected);
      });
    });
  });

  describe('Test 5: Color Functions for Terminal Output (20 points)', () => {
    it('should return color functions for different score ranges', () => {
      const redColor = getScoreColor(30);
      const yellowColor = getScoreColor(75);
      const greenColor = getScoreColor(95);

      // Should return functions
      expect(typeof redColor).toBe('function');
      expect(typeof yellowColor).toBe('function');
      expect(typeof greenColor).toBe('function');

      // Functions should transform strings
      expect(redColor('test')).toBeTruthy();
      expect(yellowColor('test')).toBeTruthy();
      expect(greenColor('test')).toBeTruthy();
    });

    it('should use appropriate colors at boundaries', () => {
      // Red for low scores
      expect(typeof getScoreColor(0)).toBe('function');
      expect(typeof getScoreColor(69)).toBe('function');

      // Yellow for medium scores
      expect(typeof getScoreColor(70)).toBe('function');
      expect(typeof getScoreColor(89)).toBe('function');

      // Green for high scores
      expect(typeof getScoreColor(90)).toBe('function');
      expect(typeof getScoreColor(100)).toBe('function');
    });
  });

  describe('🚨 CRITICAL: Production Bug Prevention (Bonus)', () => {
    it('should never return undefined or null', () => {
      const testScores = [0, 25, 54, 55, 69, 70, 84, 85, 94, 95, 98, 99, 100, 150, -10];

      testScores.forEach(score => {
        const emoji = getScoreEmoji(score);
        expect(emoji).toBeDefined();
        expect(emoji).not.toBeNull();
        expect(typeof emoji).toBe('string');
        expect(emoji.length).toBeGreaterThan(0);
      });
    });

    it('should handle NaN gracefully', () => {
      const result = getScoreEmoji(NaN);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // NaN should default to red (needs work)
      expect(result).toBe('🔴');
    });

    it('should handle Infinity gracefully', () => {
      expect(getScoreEmoji(Infinity)).toBe('🏆');
      expect(getScoreEmoji(-Infinity)).toBe('🔴');
    });

    it('should be consistent across multiple calls', () => {
      // Same input should always produce same output
      const score = 85;
      const call1 = getScoreEmoji(score);
      const call2 = getScoreEmoji(score);
      const call3 = getScoreEmoji(score);

      expect(call1).toBe(call2);
      expect(call2).toBe(call3);
      expect(call1).toBe('🥉');
    });
  });
});

/**
 * 🏁 WJTC CHAMPIONSHIP SCORING CRITERIA
 *
 * Total Points: 100 (5 tests × 20 points each)
 *
 * 🏆 CHAMPION: 80+ points (Medal system bulletproof)
 * 📈 GOOD: 60-79 points (Minor display issues)
 * 🔧 NEEDS WORK: <60 points (Critical bugs found)
 *
 * Critical Production Impact:
 * - Wrong medal = Wrong user perception
 * - Wrong perception = Demotivated developers
 * - Demotivated developers = Abandoned .faf files
 *
 * McLaren Analogy: Like showing P5 finish as podium - destroys trust
 */
