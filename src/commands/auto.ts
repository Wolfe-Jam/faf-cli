/**
 * 🏎️ faf auto - The One Command Championship
 * Zero to Championship in one command - no faffing about!
 */

import { chalk } from "../fix-once/colors";
import * as fs from "fs/promises";
import * as path from "path";
import { findFafFile } from "../utils/file-utils";
import { initFafFile } from "./init";
import { syncFafFile } from "./sync";
import { enhanceFafWithAI } from "./ai-enhance";
import { biSyncCommand } from "./bi-sync";
import { showFafScoreCard } from "./show";
import yamlUtils from "../fix-once/yaml";
import { FafCompiler } from "../compiler/faf-compiler";

interface AutoOptions {
  force?: boolean;
  ai?: boolean;
  show?: boolean;
}

export async function autoCommand(directory?: string, options: AutoOptions = {}) {
  const targetDir = directory || process.cwd();
  const homeDir = require('os').homedir();

  // CRITICAL: Prevent running in home or root directory
  if (!directory && (targetDir === homeDir || targetDir === '/')) {
    console.log(chalk.red('\n⚠️  For speed and safety, we do not work on ROOT directories.'));
    console.log(chalk.yellow('Please provide or cd my-project\n'));
    return;
  }

  try {
    // Step 0: Check for platform workflows (funnel to TURBO)
    const { findN8nWorkflows, findMakeScenarios, findOpalMiniApps, findOpenAIAssistants } = await import('../utils/file-utils');

    // Check n8n workflows
    const n8nWorkflows = await findN8nWorkflows(targetDir);
    if (n8nWorkflows.length > 0) {
      console.log(chalk.yellow(`\n⚠️  n8n workflow detected: ${chalk.white(n8nWorkflows[0])}`));
      console.log(chalk.cyan(`\n💡 For n8n workflows, use the specialist tool:`));
      console.log(chalk.white(`   faf turbo analyze "${n8nWorkflows[0]}"`));
      console.log(chalk.gray(`\n🏎️ TURBO extracts 48% AI context from n8n JSON in 3 seconds!`));
      console.log(chalk.gray(`   vs. standard auto: 25% (generic detection)\n`));

      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer: string = await new Promise((resolve) => {
        rl.question(chalk.cyan('Continue with standard auto (not recommended)? [y/N]: '), resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        console.log(chalk.green(`\n✨ Run this instead:`));
        console.log(chalk.white(`   faf turbo analyze "${n8nWorkflows[0]}"`));
        console.log();
        process.exit(0);
      }

      console.log(chalk.gray('\n⚠️  Proceeding with standard auto (n8n intelligence will be missed)...\n'));
    }

    // Check Make.com scenarios
    const makeScenarios = await findMakeScenarios(targetDir);
    if (makeScenarios.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Make.com scenario detected: ${chalk.white(makeScenarios[0])}`));
      console.log(chalk.cyan(`\n💡 For Make.com scenarios, use the specialist tool:`));
      console.log(chalk.white(`   faf turbo analyze "${makeScenarios[0]}"`));
      console.log(chalk.gray(`\n🏎️ TURBO extracts 50% AI context from Make.com JSON in 3 seconds!`));
      console.log(chalk.gray(`   vs. standard auto: 25% (generic detection)\n`));

      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer: string = await new Promise((resolve) => {
        rl.question(chalk.cyan('Continue with standard auto (not recommended)? [y/N]: '), resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        console.log(chalk.green(`\n✨ Run this instead:`));
        console.log(chalk.white(`   faf turbo analyze "${makeScenarios[0]}"`));
        console.log();
        process.exit(0);
      }

      console.log(chalk.gray('\n⚠️  Proceeding with standard auto (Make.com intelligence will be missed)...\n'));
    }

    // Check Google Opal mini-apps
    const opalMiniApps = await findOpalMiniApps(targetDir);
    if (opalMiniApps.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Google Opal mini-app detected: ${chalk.white(opalMiniApps[0])}`));
      console.log(chalk.cyan(`\n💡 For Google Opal mini-apps, use the specialist tool:`));
      console.log(chalk.white(`   faf turbo analyze "${opalMiniApps[0]}"`));
      console.log(chalk.gray(`\n🏎️ TURBO extracts 45% AI context from Opal JSON in 3 seconds!`));
      console.log(chalk.gray(`   vs. standard auto: 25% (generic detection)\n`));

      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer: string = await new Promise((resolve) => {
        rl.question(chalk.cyan('Continue with standard auto (not recommended)? [y/N]: '), resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        console.log(chalk.green(`\n✨ Run this instead:`));
        console.log(chalk.white(`   faf turbo analyze "${opalMiniApps[0]}"`));
        console.log();
        process.exit(0);
      }

      console.log(chalk.gray('\n⚠️  Proceeding with standard auto (Google Opal intelligence will be missed)...\n'));
    }

    // Check OpenAI Assistants
    const openaiAssistants = await findOpenAIAssistants(targetDir);
    if (openaiAssistants.length > 0) {
      console.log(chalk.yellow(`\n⚠️  OpenAI Assistant detected: ${chalk.white(openaiAssistants[0])}`));
      console.log(chalk.cyan(`\n💡 For OpenAI Assistants, use the specialist tool:`));
      console.log(chalk.white(`   faf turbo analyze "${openaiAssistants[0]}"`));
      console.log(chalk.gray(`\n🏎️ TURBO extracts 55% AI context from OpenAPI schema in 3 seconds!`));
      console.log(chalk.gray(`   vs. standard auto: 25% (generic detection)\n`));

      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer: string = await new Promise((resolve) => {
        rl.question(chalk.cyan('Continue with standard auto (not recommended)? [y/N]: '), resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        console.log(chalk.green(`\n✨ Run this instead:`));
        console.log(chalk.white(`   faf turbo analyze "${openaiAssistants[0]}"`));
        console.log();
        process.exit(0);
      }

      console.log(chalk.gray('\n⚠️  Proceeding with standard auto (OpenAI intelligence will be missed)...\n'));
    }

    // Step 1: Check if .faf exists
    let fafPath = await findFafFile(targetDir);

    // Get scores for header display
    let birthScore = 0;
    let currentScore = 0;
    let addedScore = 0;

    if (fafPath) {
      try {
        const fafData = await fs.readFile(fafPath, 'utf-8');
        const parsed = yamlUtils.parse(fafData);
        if (parsed.faf_dna?.birth_dna !== undefined) {
          birthScore = Math.round(parsed.faf_dna.birth_dna);
        }
        const compiler = new FafCompiler();
        const scoreResult = await compiler.compile(fafPath);
        currentScore = Math.round(scoreResult.score || 0);
        addedScore = currentScore - birthScore;
      } catch (e) {
        // Ignore score errors, will show 0%
      }
    }

    console.log(chalk.bold.blue("\n🏎️⚡️ FAF AUTO - CHAMPIONSHIP MODE ENGAGED!"));
    if (fafPath) {
      console.log(chalk.white(`Birth: ${birthScore}% | ADDED: ${addedScore}% | .FAF score: ${currentScore}%`));
    }
    console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

    if (!fafPath) {
      console.log(chalk.yellow("📋 No .faf found - Creating championship context..."));

      // Initialize with auto-detection
      await initFafFile(targetDir, {
        force: options.force,
        template: 'auto'
      });

      fafPath = await findFafFile(targetDir);
      console.log(chalk.green("✅ .faf created!"));
    } else {
      console.log(chalk.green("✅ .faf found!"));
    }

    // Step 2: Sync dependencies and context
    console.log(chalk.yellow("\n🔄 Syncing context with latest changes..."));
    await syncFafFile(fafPath || undefined, { auto: true });
    console.log(chalk.green("✅ Context synchronized!"));

    // Step 3: Create/Update CLAUDE.md via bi-sync
    console.log(chalk.yellow("\n🔗 Creating CLAUDE.md bi-directional sync..."));
    await biSyncCommand({
      auto: true,
      force: options.force
    });
    console.log(chalk.green("✅ CLAUDE.md synced!"));

    // Step 4: AI Enhancement (if requested and API key available)
    if (options.ai) {
      const hasApiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
      if (hasApiKey) {
        console.log(chalk.yellow("\n🤖 Enhancing with AI intelligence..."));
        try {
          await enhanceFafWithAI(fafPath || undefined);
          console.log(chalk.green("✅ AI enhancement complete!"));
        } catch (error) {
          console.log(chalk.yellow("⚠️  AI enhancement skipped (API issue)"));
        }
      } else {
        console.log(chalk.gray("\n💡 Tip: Set OPENAI_API_KEY for AI enhancements"));
      }
    }

    // Step 5: Show the scorecard
    console.log(chalk.yellow("\n📊 Generating Championship Scorecard...\n"));
    console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));

    if (options.show !== false) {
      await showFafScoreCard(targetDir, { raw: false });
    }

    // Success message
    console.log(chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.bold.green("\n🏁 FAF AUTO COMPLETE - CHAMPIONSHIP READY!"));
    console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

    // Quick tips
    console.log(chalk.blue("Next steps:"));
    console.log(chalk.gray("  • Check your score: ") + chalk.white("faf show"));
    console.log(chalk.gray("  • See details: ") + chalk.white("faf score --details"));
    console.log(chalk.gray("  • Keep synced: ") + chalk.white("faf bi-sync --watch"));
    console.log(chalk.gray("  • Get AI help: ") + chalk.white("faf ai-enhance"));

    console.log(chalk.gray("\n🏎️ Stop faffing about - start building!\n"));

  } catch (error) {
    console.log(chalk.red("\n💥 FAF AUTO hit the wall:"));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    console.log(chalk.yellow("\n💡 Try: faf auto --force to override"));
    process.exit(1);
  }
}

/**
 * The Championship Promise:
 * One command to rule them all
 * Zero configuration required
 * Maximum context generated
 *
 * faf auto =
 *   faf init +
 *   faf sync +
 *   faf bi-sync +
 *   faf enhance +
 *   faf show
 *
 * From 0% to Championship in 30 seconds!
 */