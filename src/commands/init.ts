/**
 * 🚀 faf init - Initialization Command
 * Generate .faf file from project structure with auto-detection
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import path from "path";
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import {
  FAF_ICONS,
  FAF_COLORS,
  generateFAFHeader
} from "../utils/championship-style";
import { autoAwardCredit } from "../utils/technical-credit";
import {
  detectProjectType,
  fileExists,
} from "../utils/file-utils";
import { generateFafFromProject } from "../generators/faf-generator-championship";
import { FafCompiler } from "../compiler/faf-compiler";
import { createDefaultFafIgnore } from "../utils/fafignore-parser";
import { BalanceVisualizer } from "../utils/balance-visualizer";
import { FafDNAManager, displayScoreWithBirthDNA } from "../engines/faf-dna";
import { PlatformDetector } from "../utils/platform-detector";
import { promptEmailOptIn } from "../utils/email-opt-in";

interface InitOptions {
  force?: boolean;
  new?: boolean;
  choose?: boolean;
  template?: string;
  output?: string;
  quiet?: boolean;
  subscribe?: string;
}

export async function initFafFile(
  projectPath?: string,
  options: InitOptions = {},
) {
  const startTime = Date.now();

  // FAF banner is now shown by cli.ts - removed duplicate
  // (The main cli.ts handles showing the banner for 'init' command)

  try {
    const projectRoot = projectPath || process.cwd();
    const homeDir = require('os').homedir();

    // CRITICAL: Prevent running in home or root directory
    if (!projectPath && (projectRoot === homeDir || projectRoot === '/')) {
      console.log();
      console.log(FAF_COLORS.fafOrange('⚠️  For speed and safety, we do not work on ROOT directories.'));
      console.log(chalk.yellow('Please provide or cd my-project\n'));
      return;
    }
    // v1.2.0: Use project.faf (standard) instead of .faf (legacy)
    const outputPath = options.output ? options.output : `${projectRoot}/project.faf`;

    // Check if project.faf file already exists
    if ((await fileExists(outputPath)) && !options.force && !options.new && !options.choose) {
      const username = require('os').userInfo().username;
      console.log();
      console.log(chalk.cyan.bold(`👋 Hi ${username}!`));
      console.log();
      console.log(chalk.green(`🤖 We found a project.faf file at: `) + chalk.cyan(outputPath));
      console.log(FAF_COLORS.fafOrange(`💡 Do you want to use this one? Or run `) + chalk.cyan('faf init --new') + FAF_COLORS.fafOrange(' to create a fresh one?'));
      console.log();
      return; // Don't exit, just return gracefully
    }

    console.log();
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Initializing project.faf file...`));

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

    // 🏎️ AUTO-UPDATE package.json "files" array for npm packages
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (await fileExists(packageJsonPath)) {
      try {
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);

        // Only update if there's a "files" array (explicit npm publishing config)
        // If no "files" array exists, npm uses default behavior - don't interfere
        if (packageJson.files && Array.isArray(packageJson.files)) {
          const fafFileName = path.basename(outputPath); // Either 'project.faf' or '.faf'
          const hasProjectFaf = packageJson.files.includes('project.faf');
          const hasDotFaf = packageJson.files.includes('.faf');
          const hasCurrentFile = packageJson.files.includes(fafFileName);

          // Add the file we just created if it's not already there (in any form)
          if (!hasProjectFaf && !hasDotFaf && !hasCurrentFile) {
            packageJson.files.push(fafFileName);
            await fs.writeFile(
              packageJsonPath,
              `${JSON.stringify(packageJson, null, 2)  }\n`,
              'utf-8'
            );
            console.log(chalk.green(`   ☑️ Updated package.json to include ${fafFileName} in published files`));
          } else if (hasProjectFaf || hasDotFaf || hasCurrentFile) {
            console.log(chalk.gray(`   ℹ️  package.json already includes FAF file in published files`));
          }
        } else if (packageJson.files !== undefined) {
          // "files" exists but is not an array - warn user
          console.log(chalk.yellow(`   ⚠️  package.json "files" field is not an array - please add "${path.basename(outputPath)}" manually`));
        }
      } catch {
        // Silent fail - not critical if package.json update fails
        // Could be malformed JSON, permission issue, etc.
        console.log(chalk.gray('   ℹ️  Could not auto-update package.json (manual edit may be needed)'));
      }
    }

    const elapsedTime = Date.now() - startTime;
    console.log(chalk.green(`☑️ Created ${outputPath}`));
    console.log();
    console.log(FAF_COLORS.fafOrange('🤖 .faf = Foundational AI-context Format = Project DNA for AI✨ 🧡⚡️'));
    console.log(FAF_COLORS.fafOrange('🧡 Trust: Context verified'));
    console.log(FAF_COLORS.fafCyan(`⚡️ Speed: Generated in ${elapsedTime}ms`));
    console.log(FAF_COLORS.fafGreen('SPEEDY AI you can TRUST!'));
    console.log();

    // Award technical credit for successful initialization
    await autoAwardCredit('init_success', outputPath);

    // BIRTH DNA: The actual first score - honest starting point
    // faf init = birth certificate with first score (even 0%)
    // faf auto = machine fills slots to ~80%
    // Human W's = final push to 100%
    console.log();
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Calculating Birth DNA (first score)...`));

    // =========================================================================
    // BIRTH DNA - THE RAW TRUTH (DO NOT "OPTIMIZE" THIS TO BE HIGHER!)
    // =========================================================================
    // Birth DNA = raw slot count ONLY. Not the compiler score. Not enhanced.
    //
    // WHY THIS MUST STAY LOW:
    // - Birth DNA is the "before" picture - what exists BEFORE FAF works
    // - It's intentionally the raw slot_based_percentage (slots filled / 21)
    // - The compiler score is FAF at work (project-type-aware, bonuses, etc.)
    // - Birth DNA just COUNTS SLOTS - no intelligence, no bonuses
    //
    // ZERO IS ZERO. 0% is a valid score. Show it. It is what it is.
    // An empty project has 0 slots filled. That's the truth. Display 0%.
    //
    // DO NOT:
    // - Use compiler.score (that's FAF-enhanced, not raw)
    // - Use ai_score (that includes quality bonuses)
    // - Add any "minimum" or "base" points
    // - Try to make it higher to "look better"
    //
    // The growth from Birth DNA to current score shows FAF's VALUE.
    // If Birth DNA is artificially high, we can't show improvement.
    // =========================================================================
    const fafData = parseYAML(fafContent);
    const compiler = new FafCompiler();
    const scoreResult = await compiler.compile(outputPath);

    // Birth DNA = raw slot percentage ONLY (not compiler score!)
    const slotBasedScore = fafData.ai_scoring_details?.slot_based_percentage
      || fafData.context_quality?.slots_filled?.match(/\((\d+)%\)/)?.[1]
      || null;
    const birthDNA = slotBasedScore
      ? parseInt(String(slotBasedScore))
      : Math.round(scoreResult.score || 0); // Fallback only if slot data missing
    const currentScore = birthDNA; // At init, current = birth

    // Check if CLAUDE.md exists for tracking purposes
    const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
    const fromClaudeMD = await fileExists(claudeMdPath);

    console.log(FAF_COLORS.fafOrange(`   Birth DNA: ${birthDNA}%`));
    console.log(FAF_COLORS.fafWhite(`   (This is your starting point - run 'faf auto' to grow!)`));

    // Initialize FAF DNA with birth certificate
    const dnaManager = new FafDNAManager(projectRoot);
    const dna = await dnaManager.birth(birthDNA, fromClaudeMD);

    console.log();
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.dna} FAF DNA created with birth certificate!`));
    console.log(FAF_COLORS.fafWhite(`   Certificate: ${dna.birthCertificate.certificate}`));

    // Add faf_dna section to .faf file for faf auto to read
    const updatedFafData = {
      ...fafData,
      faf_dna: {
        birth_dna: birthDNA,
        birth_certificate: dna.birthCertificate.certificate,
        birth_date: dna.birthCertificate.born.toISOString(),
        current_score: currentScore
      }
    };
    await fs.writeFile(outputPath, stringifyYAML(updatedFafData), 'utf-8');

    // Show ASCII header with scoreboard
    if (!options.quiet) {
      const { getScoreMedal } = require('../utils/championship-core');
      const { medal } = getScoreMedal(currentScore);
      const scoreboardTitle = chalk.bold(`Birth: ${birthDNA}% | ${medal} ${currentScore}/100`);
      console.log();
      console.log(generateFAFHeader(scoreboardTitle));
    }

    // Display with Birth DNA
    console.log();
    displayScoreWithBirthDNA(
      currentScore,
      birthDNA,
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
      console.log(FAF_COLORS.fafGreen(`   FREE CLI for all platforms!`));
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
    const growth = currentScore - birthDNA;
    if (growth > 0) {
      console.log();
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.rocket} Already improved +${growth}% from Birth DNA!`));
    }

    if (currentScore < 70) {
      console.log(FAF_COLORS.fafOrange(`   ${FAF_ICONS.precision} Target 70%+ for championship AI context`));
    } else if (currentScore >= 85) {
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.party} Championship performance achieved! ${FAF_ICONS.trophy}`));
    }

    console.log();
    console.log(FAF_COLORS.fafWhite(`Your FAF journey has begun: ${birthDNA}% → ${currentScore}%`));

    // Prompt for email opt-in (first time users only, respects quiet mode)
    await promptEmailOptIn({ quiet: options.quiet });
  } catch (error) {
    console.log(chalk.red("💥 Initialization failed:"));
    console.log(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
