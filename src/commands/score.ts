/**
 * 🎯 faf score - Scoring Command
 * Calculates .faf completeness score with detailed breakdown
 */

import chalk from "chalk";
import { promises as fs } from "fs";
import * as YAML from "yaml";
import { calculateFafScore } from "../scoring/score-calculator";
import { findFafFile } from "../utils/file-utils";
import { colors, getScoreColor, getScoreEmoji } from "../utils/color-utils";

interface ScoreOptions {
  details?: boolean;
  minimum?: string;
}

export async function scoreFafFile(file?: string, options: ScoreOptions = {}) {
  try {
    let fafPath: string | null = null;
    
    if (file) {
      // Check if the provided path is a directory
      try {
        const stats = await fs.stat(file);
        if (stats.isDirectory()) {
          // Find .faf file in the specified directory
          fafPath = await findFafFile(file);
        } else {
          // Use the file path directly
          fafPath = file;
        }
      } catch {
        // If stat fails, try to use it as a file path
        fafPath = file;
      }
    } else {
      // Find .faf file in current directory
      fafPath = await findFafFile();
    }

    if (!fafPath) {
      console.log(chalk.red("❌ No .faf file found"));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    console.log(chalk.blue(`🎯 Scoring: ${fafPath}`));

    // Read and parse .faf file
    const content = await fs.readFile(fafPath, "utf-8");
    const fafData = YAML.parse(content);

    // Calculate score
    const scoreResult = calculateFafScore(fafData);
    const percentage = Math.round(scoreResult.totalScore);

    // Accessibility-friendly score display
    const scoreColor = getScoreColor(percentage);
    const scoreEmoji = getScoreEmoji(percentage);
    const scoreText = `${scoreEmoji} Score: ${percentage}%`;

    console.log(scoreColor(chalk.bold(scoreText)));
    console.log(
      chalk.gray(
        `   (${scoreResult.filledSlots}/${scoreResult.totalSlots} context slots filled)`,
      ),
    );

    // Always show key missing items for transparency
    const missingItems: string[] = [];
    Object.entries(scoreResult.sectionScores).forEach(([, score]) => {
      if (score.missing.length > 0 && score.percentage < 100) {
        missingItems.push(...score.missing.slice(0, 2)); // Top 2 from each section
      }
    });

    if (missingItems.length > 0 && !options.details) {
      console.log(chalk.gray("\n   Missing for higher score:"));
      missingItems.slice(0, 5).forEach((item) => {
        console.log(chalk.gray(`   • ${item}`));
      });
      console.log(
        chalk.cyan('\n   💡 Run "faf score --details" for complete breakdown'),
      );
    }

    // Detailed breakdown
    if (options.details) {
      console.log(chalk.blue("\n📊 Detailed Breakdown:"));

      Object.entries(scoreResult.sectionScores).forEach(([section, score]) => {
        const sectionPercentage = Math.round(score.percentage);
        const sectionColor =
          sectionPercentage >= 70
            ? chalk.green
            : sectionPercentage >= 40
              ? chalk.yellow
              : chalk.red;

        console.log(
          `   ${sectionColor(section)}: ${sectionPercentage}% (${score.filled}/${score.total})`,
        );

        if (score.missing.length > 0) {
          console.log(chalk.gray(`      Missing: ${score.missing.join(", ")}`));
        }
      });

      // Improvement suggestions
      if (percentage < 100) {
        console.log(chalk.blue("\n💡 Quick Wins:"));
        const suggestions = scoreResult.suggestions.slice(0, 3);
        suggestions.forEach((suggestion, index) => {
          console.log(chalk.yellow(`   ${index + 1}. ${suggestion}`));
        });
      }
    }

    // Check minimum threshold
    const minimumScore = parseInt(options.minimum || "50");
    if (percentage < minimumScore) {
      console.log(
        chalk.red(`\n🚨 Score below minimum threshold (${minimumScore}%)`),
      );
      process.exit(1);
    }

    // Success message
    if (percentage === 100) {
      console.log(
        chalk.green.bold("\n🎉 Perfect .faf file! Ready for AI collaboration!"),
      );
    } else if (percentage >= 80) {
      console.log(
        chalk.green("\n✨ Excellent .faf file! Minor improvements possible."),
      );
    } else if (percentage >= 60) {
      console.log(chalk.yellow("\n👍 Good .faf file! Some gaps to fill."));
    } else {
      console.log(
        chalk.red("\n⚠️  .faf file needs improvement for optimal AI context."),
      );
    }
  } catch (error) {
    console.log(chalk.red("💥 Scoring failed:"));
    console.log(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
