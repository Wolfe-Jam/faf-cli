/**
 * 🏎️ faf score v3 - Compiler-based scoring
 * Deterministic, traceable, reproducible scores
 */

import chalk from "chalk";
import { FafCompiler } from "../compiler/faf-compiler";
import { findFafFile } from "../utils/file-utils";
import { FafDNAManager, displayScoreWithBirthWeight } from "../engines/faf-dna";
import * as path from "path";

interface ScoreOptions {
  trace?: boolean;
  verify?: string;
  ir?: boolean;
  breakdown?: boolean;
  checksum?: boolean;
  verbose?: boolean;
}

export async function scoreCommandV3(
  file?: string,
  options: ScoreOptions = {}
) {
  // Only show header if not in quiet mode
  const isQuiet = process.argv.includes('--quiet');
  if (!isQuiet) {
    console.log(chalk.blue("\n🏎️ FAF Score Compiler v3.0\n"));
  }

  try {
    // Find .faf file
    let fafPath: string | null;
    if (file) {
      // Check if file is a direct path to a .faf file
      if (file.endsWith('.faf') || file.endsWith('.faf.fixed')) {
        fafPath = file;
      } else {
        fafPath = await findFafFile(file);
      }
    } else {
      fafPath = await findFafFile();
    }

    if (!fafPath) {
      if (file) {
        console.error(chalk.red(`❌ No .faf file found at: ${file}`));
        console.log(chalk.yellow(`💡 Check the path or run "faf init" in that directory`));
      } else {
        console.error(chalk.red("❌ No .faf file found in current directory"));
        console.log(chalk.yellow('💡 Run "faf init" to create one'));
      }
      process.exit(1);
    }

    // Verify mode
    if (options.verify) {
      const compiler = new FafCompiler();
      const isValid = await compiler.verify(fafPath, options.verify);

      if (isValid) {
        console.log(chalk.green(`✅ Checksum ${options.verify} verified`));
      } else {
        console.log(chalk.red(`❌ Checksum mismatch`));
        process.exit(1);
      }
      return;
    }

    // Create compiler
    const compiler = new FafCompiler();

    // Compile with or without trace
    const result = options.trace
      ? await compiler.compileWithTrace(fafPath)
      : await compiler.compile(fafPath);

    // Show IR if requested
    if (options.ir) {
      console.log(chalk.cyan("\n📋 Intermediate Representation:"));
      console.log(JSON.stringify(result.ir, null, 2));
      return;
    }

    // Show breakdown if requested
    if (options.breakdown) {
      console.log(chalk.cyan("\n📊 Score Breakdown:"));
      console.log(chalk.gray("─".repeat(40)));

      const sections = result.breakdown;
      console.log(`Project:   ${sections.project.filled}/${sections.project.total} slots (${sections.project.percentage}%)`);
      console.log(`Stack:     ${sections.stack.filled}/${sections.stack.total} slots (${sections.stack.percentage}%)`);
      console.log(`Human:     ${sections.human.filled}/${sections.human.total} slots (${sections.human.percentage}%)`);
      if (sections.discovery.total > 0) {
        console.log(`Discovery: ${sections.discovery.filled}/${sections.discovery.total} slots (${sections.discovery.percentage}%)`);
      }
      console.log(chalk.gray("─".repeat(40)));
    }

    // Show verbose details
    if (options.verbose) {
      console.log(chalk.cyan("\n🔍 Compilation Details:"));
      console.log(`Version:    ${result.trace.version}`);
      console.log(`Input Hash: ${result.trace.inputHash}`);
      console.log(`Passes:     ${result.trace.passes.length}`);
      console.log(`Duration:   ${result.trace.passes.reduce((sum, p) => sum + p.duration, 0)}ms`);

      if (result.diagnostics.length > 0) {
        console.log(chalk.yellow(`\n⚠️ ${result.diagnostics.length} Diagnostics:`));
        result.diagnostics.forEach(d => {
          const icon = d.severity === 'error' ? '❌' : d.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`  ${icon} ${d.message}`);
          if (d.suggestion) {
            console.log(chalk.gray(`     → ${d.suggestion}`));
          }
        });
      }
    }

    // Main score display
    console.log(chalk.blue(`📈 Scoring: ${fafPath}`));

    // Try to show with DNA (birth weight)
    const projectPath = path.dirname(fafPath);
    const dnaManager = new FafDNAManager(projectPath);
    const dna = await dnaManager.load();

    if (dna) {
      displayScoreWithBirthWeight(
        result.score,
        dna.birthCertificate.birthWeight,
        dna.birthCertificate.born,
        { showGrowth: true, showJourney: true }
      );
    } else {
      // Simple display
      const scoreColor = getScoreColor(result.score);
      const scoreEmoji = getScoreEmoji(result.score);
      console.log();
      console.log(scoreColor(chalk.bold(`${scoreEmoji} Score: ${result.score}%`)));
      console.log(chalk.gray(`Filled: ${result.filled}/${result.total} slots`));
    }

    // Show checksum if requested
    if (options.checksum) {
      console.log();
      console.log(chalk.gray(`Checksum: ${result.checksum}`));
      console.log(chalk.gray(`Verify with: faf score --verify=${result.checksum}`));
    }

    // Show errors
    const errors = result.diagnostics.filter(d => d.severity === 'error');
    if (errors.length > 0) {
      console.log();
      console.log(chalk.red(`❌ ${errors.length} errors found:`));
      errors.forEach(err => {
        console.log(chalk.red(`  • ${err.message}`));
        if (err.suggestion) {
          console.log(chalk.yellow(`    → ${err.suggestion}`));
        }
      });
      process.exit(1);
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`\n❌ Compilation failed: ${message}`));
    if (options.verbose && error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Utility functions
function getScoreColor(percentage: number) {
  if (percentage >= 85) return chalk.green;
  if (percentage >= 70) return chalk.yellow;
  if (percentage >= 50) return chalk.blue;
  return chalk.red;
}

function getScoreEmoji(percentage: number): string {
  if (percentage >= 90) return "🏆";
  if (percentage >= 80) return "🎯";
  if (percentage >= 70) return "✨";
  if (percentage >= 60) return "📈";
  if (percentage >= 50) return "🎯";
  if (percentage >= 40) return "🌱";
  if (percentage >= 30) return "🔧";
  if (percentage >= 20) return "⚠️";
  return "🚨";
}