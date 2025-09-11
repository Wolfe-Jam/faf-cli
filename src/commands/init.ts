/**
 * 🚀 faf init - Initialization Command
 * Generate .faf file from project structure with auto-detection
 */

import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";
import * as YAML from "yaml";
import { 
  FAF_ICONS, 
  FAF_COLORS, 
  BRAND_MESSAGES,
  formatPerformance 
} from "../utils/championship-style";
import { autoAwardCredit } from "../utils/technical-credit";
import {
  detectProjectType,
  fileExists,
} from "../utils/file-utils";
import { generateFafFromProject } from "../generators/faf-generator";
import { calculateFafScore } from "../scoring/score-calculator";
import { createDefaultFafIgnore } from "../utils/fafignore-parser";

interface InitOptions {
  force?: boolean;
  template?: string;
  output?: string;
}

export async function initFafFile(
  projectPath?: string,
  options: InitOptions = {},
) {
  const startTime = Date.now();
  try {
    const projectRoot = projectPath || process.cwd();
    const outputPath = options.output ? options.output : `${projectRoot}/.faf`;

    // Check if .faf file already exists
    if ((await fileExists(outputPath)) && !options.force) {
      console.log();
      console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} .faf file already exists: `) + FAF_COLORS.fafCyan(outputPath));
      console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.magic_wand} Use `) + FAF_COLORS.fafCyan('--force') + FAF_COLORS.fafOrange(' to overwrite'));
      console.log();
      process.exit(1);
    }

    console.log();
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Initializing .faf file...`));

    // Check for .fafignore
    const fafIgnorePath = path.join(projectRoot, ".fafignore");
    if (!(await fileExists(fafIgnorePath))) {
      console.log(
        chalk.gray("   Creating .fafignore with default patterns..."),
      );
      await createDefaultFafIgnore(projectRoot);
      console.log(
        chalk.green("   ☑️ Created .fafignore (customize to exclude files)"),
      );
    } else {
      console.log(chalk.gray("   Using existing .fafignore file"));
    }

    // Detect project structure
    const projectType =
      options.template === "auto"
        ? await detectProjectType(projectRoot)
        : options.template || (await detectProjectType(projectRoot));

    console.log(chalk.gray(`   Detected project type: ${projectType}`));

    // Generate .faf content
    const fafContent = await generateFafFromProject({
      projectType,
      outputPath,
      projectRoot: projectRoot,
    });

    // Write .faf file
    await fs.writeFile(outputPath, fafContent, "utf-8");

    const elapsedTime = Date.now() - startTime;
    console.log(chalk.green(`☑️ Created ${outputPath}`));
    console.log(FAF_COLORS.fafCyan(`   ${formatPerformance(elapsedTime)} - ${BRAND_MESSAGES.speed_result}`));

    // Award technical credit for successful initialization
    await autoAwardCredit('init_success', outputPath);

    // Show actual score matching what's embedded in the file
    const fafData = YAML.parse(fafContent);
    const scoreResult = await calculateFafScore(fafData, outputPath);
    // Use the embedded score from the file header to match what user sees
    const embeddedScore = fafData.faf_score ? parseInt(fafData.faf_score.replace('%', '')) : scoreResult.totalScore;

    console.log();
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.chart_up} Initial score: ${embeddedScore}% (${scoreResult.filledSlots}/${scoreResult.totalSlots} slots)`));

    // Championship Next Steps
    console.log();
    console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.magic_wand} Championship Recommendations:`));
    console.log(
      `${FAF_COLORS.fafCyan('   1. ')  }faf score --details${  FAF_COLORS.fafCyan(' - Discover improvement opportunities')}`
    );
    console.log(`${FAF_COLORS.fafCyan('   2. ')  }faf trust --detailed${  FAF_COLORS.fafCyan(' - Boost AI happiness')}`);
    console.log(`${FAF_COLORS.fafCyan('   3. ')  }faf status${  FAF_COLORS.fafCyan(' - Monitor your championship performance')}`);

    if (embeddedScore < 70) {
      console.log(FAF_COLORS.fafOrange(`   4. ${FAF_ICONS.precision} Target 70%+ score for championship AI context`));
    } else if (embeddedScore >= 85) {
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.party} Excellent start! Championship performance! ${FAF_ICONS.trophy}`));
    }
  } catch (error) {
    console.log(chalk.red("💥 Initialization failed:"));
    console.log(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
