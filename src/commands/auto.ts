/**
 * 🏎️ faf auto - The One Command Championship
 * Zero to Championship in one command - no faffing about!
 */

import chalk from "chalk";
import { promises as fs } from "fs";
import * as path from "path";
import { findFafFile } from "../utils/file-utils";
import { initFafFile } from "./init";
import { syncFafFile } from "./sync";
import { enhanceFafWithAI } from "./ai-enhance";
import { biSyncCommand } from "./bi-sync";
import { showFafScoreCard } from "./show";

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

  console.log(chalk.bold.blue("\n🏎️ FAF AUTO - CHAMPIONSHIP MODE ENGAGED!"));
  console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  try {
    // Step 1: Check if .faf exists
    let fafPath = await findFafFile(targetDir);

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