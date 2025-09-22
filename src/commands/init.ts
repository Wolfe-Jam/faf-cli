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
import { generateFafFromProject } from "../generators/faf-generator-championship";
import { calculateFafScore } from "../scoring/score-calculator";
import { createDefaultFafIgnore } from "../utils/fafignore-parser";
import { BalanceVisualizer } from "../utils/balance-visualizer";
import { FafDNAManager, displayScoreWithBirthWeight } from "../engines/faf-dna";
import { fabFormatsProcessor } from "../engines/fab-formats-processor";
import { PlatformDetector } from "../utils/platform-detector";

interface InitOptions {
  force?: boolean;
  new?: boolean;
  choose?: boolean;
  template?: string;
  output?: string;
}

export async function initFafFile(
  projectPath?: string,
  options: InitOptions = {},
) {
  const startTime = Date.now();

  // Show the FAF banner
  const { generateFAFHeader } = require('../utils/championship-style');
  console.log(generateFAFHeader());

  try {
    const projectRoot = projectPath || process.cwd();
    const outputPath = options.output ? options.output : `${projectRoot}/.faf`;

    // Check if .faf file already exists
    if ((await fileExists(outputPath)) && !options.force && !options.new && !options.choose) {
      const username = require('os').userInfo().username;
      console.log();
      console.log(chalk.cyan.bold(`👋 Hi ${username}!`));
      console.log();
      console.log(chalk.green(`🤖 We found a .faf file at: `) + chalk.cyan(outputPath));
      console.log(FAF_COLORS.fafOrange(`💡 Do you want to use this one? Or run `) + chalk.cyan('faf init --new') + FAF_COLORS.fafOrange(' to create a fresh one?'));
      console.log();
      return; // Don't exit, just return gracefully
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
    console.log();
    console.log(FAF_COLORS.fafOrange('🤖 .faf = Foundational AI-context Format = THE JPEG for AI! 🧡⚡️'));
    console.log(FAF_COLORS.fafOrange('🧡 Trust: Context verified'));
    console.log(FAF_COLORS.fafCyan(`⚡️ Speed: Generated in ${elapsedTime}ms`));
    console.log(FAF_COLORS.fafGreen('SPEEDY AI you can TRUST!'));
    console.log();

    // Award technical credit for successful initialization
    await autoAwardCredit('init_success', outputPath);

    // REVOLUTIONARY: Score CLAUDE.md ONLY for birth weight!
    // This is the TRUE starting point - what AI sees initially
    console.log();
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Analyzing CLAUDE.md for birth weight...`));

    const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
    let birthWeight = 0;
    let fromClaudeMD = false;

    if (await fileExists(claudeMdPath)) {
      // Score ONLY CLAUDE.md for birth weight
      const claudeMdContent = await fs.readFile(claudeMdPath, 'utf-8');
      const claudeMdAnalysis = await fabFormatsProcessor.processFiles(projectRoot);

      // Calculate birth weight from CLAUDE.md context quality
      // Low scores are GOOD - they show the journey!
      if (claudeMdContent.length < 100) {
        birthWeight = 5;  // Almost empty CLAUDE.md
      } else if (claudeMdContent.includes('FAF')) {
        birthWeight = 22; // Has some FAF context
      } else {
        birthWeight = 12; // Generic CLAUDE.md
      }
      fromClaudeMD = true;

      console.log(FAF_COLORS.fafOrange(`   Birth weight from CLAUDE.md: ${birthWeight}%`));
      console.log(FAF_COLORS.fafWhite(`   (Low scores are normal - they show your growth journey!)`));
    } else {
      // No CLAUDE.md - use minimal birth weight
      birthWeight = 0;
      console.log(FAF_COLORS.fafOrange(`   No CLAUDE.md found - birth weight: ${birthWeight}%`));
    }

    // Initialize FAF DNA with birth certificate
    const dnaManager = new FafDNAManager(projectRoot);
    const dna = await dnaManager.birth(birthWeight, fromClaudeMD);

    console.log();
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.dna} FAF DNA created with birth certificate!`));
    console.log(FAF_COLORS.fafWhite(`   Certificate: ${dna.birthCertificate.certificate}`));

    // Now calculate ACTUAL score from full .faf
    const fafData = YAML.parse(fafContent);
    const scoreResult = await calculateFafScore(fafData, outputPath);
    const currentScore = fafData.faf_score ? parseInt(fafData.faf_score.replace('%', '')) : scoreResult.totalScore;

    // Record first growth if different from birth weight
    if (currentScore !== birthWeight) {
      await dnaManager.recordGrowth(currentScore, ['Initial .faf generation from project']);
    }

    // Display with birth weight
    console.log();
    displayScoreWithBirthWeight(
      currentScore,
      birthWeight,
      dna.birthCertificate.born,
      { showGrowth: true }
    );

    // Show AI|HUMAN Balance
    const balance = BalanceVisualizer.calculateBalance(fafData);
    console.log(FAF_COLORS.fafWhite(`${FAF_ICONS.balance} Balance: `) + BalanceVisualizer.generateCompactBalance(balance));

    // Detect platform and show VIBE message if applicable
    const platformDetector = new PlatformDetector();
    const platformInfo = await platformDetector.detectPlatform(projectRoot);

    if (platformInfo.detected && platformInfo.tier === 'vibe') {
      console.log();
      console.log(FAF_COLORS.fafOrange('⚡️ FAF VIBE DETECTED! 😽'));
      console.log(FAF_COLORS.fafCyan(`   Platform: ${platformInfo.platform}`));
      console.log(FAF_COLORS.fafGreen(`   Special pricing: $9/month FOREVER!`));
      console.log(FAF_COLORS.fafWhite(`   ${FAF_ICONS.turbo_cat} TURBO-CAT is ready to make your AI happy!`));
    }

    // Championship Next Steps with DNA lifecycle
    console.log();
    console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.magic_wand} Championship Recommendations:`));
    console.log(
      `${FAF_COLORS.fafCyan('   1. ')  }faf auth${  FAF_COLORS.fafCyan(' - Authenticate your FAF DNA')}`
    );
    console.log(
      `${FAF_COLORS.fafCyan('   2. ')  }faf auto${  FAF_COLORS.fafCyan(' - Grow your context automatically')}`
    );
    console.log(
      `${FAF_COLORS.fafCyan('   3. ')  }faf score --details${  FAF_COLORS.fafCyan(' - Track improvement opportunities')}`
    );
    console.log(`${FAF_COLORS.fafCyan('   4. ')  }faf trust --detailed${  FAF_COLORS.fafCyan(' - Boost AI happiness')}`);
    console.log(`${FAF_COLORS.fafCyan('   5. ')  }faf log${  FAF_COLORS.fafCyan(' - View your context evolution')}`);

    // Growth-focused messaging
    const growth = currentScore - birthWeight;
    if (growth > 0) {
      console.log();
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.rocket} Already improved +${growth}% from birth weight!`));
    }

    if (currentScore < 70) {
      console.log(FAF_COLORS.fafOrange(`   ${FAF_ICONS.precision} Target 70%+ for championship AI context`));
    } else if (currentScore >= 85) {
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.party} Championship performance achieved! ${FAF_ICONS.trophy}`));
    }

    console.log();
    console.log(FAF_COLORS.fafWhite(`Your FAF journey has begun: ${birthWeight}% → ${currentScore}%`));
  } catch (error) {
    console.log(chalk.red("💥 Initialization failed:"));
    console.log(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
