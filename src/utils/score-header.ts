/**
 * 🏆 Score Header Display - Always visible at top
 * Shows current score + birth score in a clean box
 */

import chalk from 'chalk';
import { FAF_COLORS } from './championship-style';

export interface ScoreData {
  currentScore: number;
  birthScore?: number;
  aiPredictive?: number;
  dna?: {
    birthWeight?: number;
    currentWeight?: number;
  };
}

/**
 * Generate the score header box (always shown unless --quiet)
 */
export function generateScoreHeader(data: ScoreData): string {
  const { currentScore, birthScore, aiPredictive, dna } = data;

  // Determine score color based on percentage
  const getScoreColor = (score: number) => {
    if (score >= 99) {return FAF_COLORS.fafOrange;}  // Big Orange territory!
    if (score >= 85) {return FAF_COLORS.fafGreen;}
    if (score >= 70) {return FAF_COLORS.fafCyan;}
    return FAF_COLORS.fafWhite;
  };

  const scoreColor = getScoreColor(currentScore);

  // Build the score display
  let scoreDisplay = `${scoreColor(`${currentScore  }%`)}`;

  // Add birth score if available
  if (birthScore !== undefined && birthScore !== currentScore) {
    const improvement = currentScore - birthScore;
    if (improvement > 0) {
      scoreDisplay += chalk.gray(` (↑${improvement}% from birth: ${birthScore}%)`);
    } else if (improvement < 0) {
      scoreDisplay += chalk.gray(` (↓${Math.abs(improvement)}% from birth: ${birthScore}%)`);
    }
  }

  // Add DNA weight info if available
  let dnaDisplay = '';
  if (dna?.currentWeight) {
    dnaDisplay = chalk.gray(` | Weight: ${dna.currentWeight.toFixed(1)}KB`);
    if (dna.birthWeight && dna.birthWeight !== dna.currentWeight) {
      const growth = ((dna.currentWeight - dna.birthWeight) / dna.birthWeight * 100).toFixed(0);
      dnaDisplay += chalk.gray(` (+${growth}%)`);
    }
  }

  // AI Predictive (only show if higher than current)
  let aiDisplay = '';
  if (aiPredictive && aiPredictive > currentScore) {
    aiDisplay = chalk.gray(` > AI-Predictive: ${FAF_COLORS.fafCyan(`${aiPredictive  }%`)}`);
  }

  // Create the box
  return `╔════════════════════════════════════════════════════════════╗
║ 🏆 FAF Score: ${scoreDisplay}${dnaDisplay}
${aiDisplay ? `║ ${aiDisplay}\n` : ''}╚════════════════════════════════════════════════════════════╝`;
}

/**
 * Minimal score line (for when art is disabled)
 */
export function generateScoreLine(data: ScoreData): string {
  const { currentScore, birthScore } = data;

  const getScoreColor = (score: number) => {
    if (score >= 99) {return FAF_COLORS.fafOrange;}
    if (score >= 85) {return FAF_COLORS.fafGreen;}
    if (score >= 70) {return FAF_COLORS.fafCyan;}
    return FAF_COLORS.fafWhite;
  };

  const scoreColor = getScoreColor(currentScore);

  let line = `🏆 Score: ${scoreColor(`${currentScore  }%`)}`;

  if (birthScore !== undefined && birthScore !== currentScore) {
    const improvement = currentScore - birthScore;
    if (improvement > 0) {
      line += chalk.gray(` (Birth: ${birthScore}% ↑${improvement}%)`);
    }
  }

  return line;
}