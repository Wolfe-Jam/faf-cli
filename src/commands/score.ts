/**
 * 📈 faf score - Scoring Command
 * Calculates .faf completeness score with detailed breakdown
 */

import chalk from "chalk";
import { promises as fs } from "fs";
import * as YAML from "yaml";
import { calculateFafScore } from "../scoring/score-calculator";
import { findFafFile } from "../utils/file-utils";
import { getScoreColor, getScoreEmoji } from "../utils/color-utils";
import { BalanceVisualizer } from "../utils/balance-visualizer";
import { FafDNAManager, displayScoreWithBirthWeight } from "../engines/faf-dna";
import * as path from "path";
import { PlatformDetector } from "../utils/platform-detector";
import { VibeSync } from "../utils/vibe-sync";
import { scoreCommandV3 } from "./score-v3";

interface ScoreOptions {
  details?: boolean;
  minimum?: string;
  compiler?: boolean;
  trace?: boolean;
  verify?: string;
  checksum?: boolean;
  breakdown?: boolean;
}

export async function scoreFafFile(file?: string, options: ScoreOptions = {}) {
  // Use compiler-based scoring if requested
  if (options.compiler || options.trace || options.verify || options.checksum || options.breakdown) {
    return scoreCommandV3(file, {
      trace: options.trace,
      verify: options.verify,
      breakdown: options.breakdown,
      checksum: options.checksum,
      verbose: options.details
    });
  }

  // Legacy scoring
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
      console.error(chalk.red("❌ No .faf file found"));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    console.log(chalk.blue(`📈 Scoring: ${fafPath}`));

    // Read and parse .faf file
    const content = await fs.readFile(fafPath, "utf-8");
    const fafData = YAML.parse(content);

    // Calculate score with fab-formats discovery for enhanced context!
    const scoreResult = await calculateFafScore(fafData, fafPath);
    const percentage = Math.round(scoreResult.totalScore);

    // Load DNA to get birth weight - THE VALUE STORY!
    const projectPath = path.dirname(fafPath);
    const dnaManager = new FafDNAManager(projectPath);
    const dna = await dnaManager.load();

    if (dna) {
      // ALWAYS show birth weight - this is the value visualization!
      displayScoreWithBirthWeight(
        percentage,
        dna.birthCertificate.birthWeight,
        dna.birthCertificate.born,
        { showGrowth: true, showJourney: true }
      );
    } else {
      // Fallback to old display if no DNA yet
      const scoreColor = getScoreColor(percentage);
      const scoreEmoji = getScoreEmoji(percentage);
      const scoreText = `${scoreEmoji} Score: ${percentage}%`;
      console.log(scoreColor(chalk.bold(scoreText)));
      console.log(chalk.gray('   Run "faf init" to create DNA tracking'));
    }

    // Show AI|HUMAN Balance visualization
    console.log('\n' + '─'.repeat(50));
    const balance = BalanceVisualizer.calculateBalance(fafData);
    console.log(BalanceVisualizer.generateBalanceBar(balance));
    console.log('─'.repeat(50));

    // Show achievement message if applicable
    const achievement = BalanceVisualizer.getAchievementMessage(balance);
    if (achievement) {
      console.log('\n' + achievement);
    }

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

    // VIBE Progression Path (for low-scoring prototypes)
    const detector = new PlatformDetector();
    const platform = await detector.detectPlatform();

    if (platform.tier === 'vibe' && percentage < 70) {
      console.log();
      console.log(chalk.bold.cyan('⚡️ FAF VIBE PROGRESSION PATH:'));
      console.log(VibeSync.getProgressionMessage(percentage));
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

    // Check minimum threshold (only if explicitly provided)
    if (options.minimum) {
      const minimumScore = parseInt(options.minimum);
      if (percentage < minimumScore) {
        console.error(
          chalk.red(`\n🚨 Score below minimum threshold (${minimumScore}%)`),
        );
        process.exit(1);
      }
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
    console.error(chalk.red("💥 Scoring failed:"));
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
