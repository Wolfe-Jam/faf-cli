/**
 * 🏎️ faf auto - The One Command Championship
 * Zero to Championship in one command - no faffing about!
 */

import { chalk } from "../fix-once/colors";
import * as fs from "fs/promises";
import { findFafFile } from "../utils/file-utils";
import { initFafFile } from "./init";
import { syncFafFile } from "./sync";
import { enhanceFafWithAI } from "./ai-enhance";
import { biSyncCommand } from "./bi-sync";
import { showFafScoreCard } from "./show";
import yamlUtils from "../fix-once/yaml";
import { FafCompiler } from "../compiler/faf-compiler";
import { TurboCat } from "../utils/turbo-cat";
import { RelentlessContextExtractor } from "../engines/relentless-context-extractor";

interface AutoOptions {
  force?: boolean;
  ai?: boolean;
  show?: boolean;
}

export async function autoCommand(directory?: string, options: AutoOptions = {}) {
  const startTime = Date.now(); // ⚡ Start timer for personal record tracking
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
      console.log(chalk.cyan(`\n💡 Fancy an 85% or even a 99%? 🏎️💨`));
      console.log(chalk.white(`   faf turbo analyze "${n8nWorkflows[0]}"`));
      console.log(chalk.gray(`\n🏆 TURBO: 48% → 85%+ (with bi-sync) <3 seconds!`));
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
      console.log(chalk.cyan(`\n💡 Fancy an 85% or even a 99%? 🏎️💨`));
      console.log(chalk.white(`   faf turbo analyze "${makeScenarios[0]}"`));
      console.log(chalk.gray(`\n🏆 TURBO: 50% → 85%+ (with bi-sync) <3 seconds!`));
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
      console.log(chalk.cyan(`\n💡 Fancy an 85% or even a 99%? 🏎️💨`));
      console.log(chalk.white(`   faf turbo analyze "${opalMiniApps[0]}"`));
      console.log(chalk.gray(`\n🏆 TURBO: 45% → 85%+ (with bi-sync) <3 seconds!`));
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
      console.log(chalk.cyan(`\n💡 Fancy an 85% or even a 99%? 🏎️💨`));
      console.log(chalk.white(`   faf turbo analyze "${openaiAssistants[0]}"`));
      console.log(chalk.gray(`\n🏆 TURBO: 55% → 85%+ (with bi-sync) <3 seconds!`));
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

    // Get CURRENT score (before auto runs)
    let currentScore = 0;

    if (fafPath) {
      try {
        const compiler = new FafCompiler();
        const scoreResult = await compiler.compile(fafPath);
        currentScore = Math.round(scoreResult.score || 0);
      } catch {
        // Ignore score errors, will show 0%
      }
    }

    console.log(chalk.bold.blue("\n🏎️⚡️ FAF AUTO - CHAMPIONSHIP MODE ENGAGED!"));
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

    // Step 2.1: Smart Metadata Sync (Parity with Python Extension)
    try {
      const { FrameworkDetector } = await import("../framework-detector");
      const detector = new FrameworkDetector(targetDir);
      const detection = await detector.detect();

      if (detection.projectName || detection.projectGoal || detection.projectVersion) {
        const fafData = await fs.readFile(fafPath!, 'utf-8');
        let updated = fafData;

        // Update name if currently placeholder
        if (detection.projectName && (updated.includes('name: my-project') || updated.includes('name: null'))) {
          updated = updated.replace(/name:\s*(my-project|null)/, `name: ${detection.projectName}`);
        }

        // Update goal if currently placeholder
        if (detection.projectGoal && (updated.includes('goal: Describe your project goal') || updated.includes('goal: null'))) {
          updated = updated.replace(/goal:\s*(Describe your project goal|null)/, `goal: ${detection.projectGoal}`);
        }

        // Update version if currently placeholder
        if (detection.projectVersion && (updated.includes('version: 0.1.0') || updated.includes('version: null'))) {
          updated = updated.replace(/version:\s*(0.1.0|null)/, `version: ${detection.projectVersion}`);
        }

        if (updated !== fafData) {
          await fs.writeFile(fafPath!, updated, 'utf-8');
          console.log(chalk.green("   ☑️ Synced project metadata from manifest files"));
        }
      }
    } catch {}

    console.log(chalk.green("✅ Context synchronized!"));

    // Step 2.5: TURBO-CAT Format Discovery (Championship Intelligence)
    console.log(chalk.yellow("\n😽 Running TURBO-CAT format discovery..."));
    try {
      const turboCat = new TurboCat();
      const analysis = await turboCat.discoverFormats(targetDir);

      if (analysis.discoveredFormats.length > 0) {
        // Apply TURBO-CAT discoveries to .faf file
        const fafData = await fs.readFile(fafPath!, 'utf-8');
        const parsed = yamlUtils.parse(fafData);

        // Ensure stack section exists
        if (!parsed.stack) {
          parsed.stack = {};
        }

        // Apply TURBO-CAT slot fill recommendations to existing stack fields
        if (analysis.slotFillRecommendations && Object.keys(analysis.slotFillRecommendations).length > 0) {
          Object.entries(analysis.slotFillRecommendations).forEach(([key, value]) => {
            const currentValue = parsed.stack[key];

            // Replace if:
            // 1. Empty/None/Unknown/null/undefined
            // 2. Generic placeholder values (Node.js when language is Python, etc.)
            const shouldReplace = !currentValue
              || currentValue === 'None'
              || currentValue === 'Unknown'
              || currentValue === null
              || currentValue === 'TBD';

            if (shouldReplace) {
              parsed.stack[key] = value;
            }
          });
        }

        // VERIFICATION: Cross-check allocations against actual discoveries
        const pyprojectFound = analysis.confirmedFormats.some((f: any) => f.fileName === 'pyproject.toml');

        if (pyprojectFound && parsed.stack) {
          // If pyproject.toml exists, main_language must be Python (not JS from package.json)
          if (parsed.stack.main_language && parsed.stack.main_language !== 'Python') {
            parsed.stack.main_language = 'Python';
          }
          if (parsed.stack.mainLanguage && parsed.stack.mainLanguage !== 'Python') {
            parsed.stack.mainLanguage = 'Python';
          }
        }

        // Merge stack signature and intelligence (metadata fields)
        if (analysis.stackSignature && analysis.stackSignature !== 'unknown-stack') {
          parsed.stack_signature = analysis.stackSignature;
        }

        // Add discovered frameworks (metadata)
        if (Object.keys(analysis.frameworkConfidence).length > 0) {
          parsed.detected_frameworks = Object.keys(analysis.frameworkConfidence);
        }

        // Add TURBO-CAT intelligence score (metadata)
        parsed.turbo_cat_intelligence = analysis.totalIntelligenceScore;

        // Write updated .faf
        await fs.writeFile(fafPath!, yamlUtils.stringify(parsed), 'utf-8');

        const filledSlots = Object.keys(analysis.slotFillRecommendations).length;
        console.log(chalk.green(`✅ TURBO-CAT discovered ${analysis.discoveredFormats.length} formats, filled ${filledSlots} stack slots (Intelligence: ${analysis.totalIntelligenceScore})`));
      } else {
        console.log(chalk.gray("   No additional formats detected"));
      }
    } catch (error) {
      console.log(chalk.yellow("⚠️  TURBO-CAT analysis skipped (non-critical)"));
      console.log(chalk.gray(`   ${error instanceof Error ? error.message : String(error)}`));
    }

    // Step 2.6: RELENTLESS CONTEXT EXTRACTION (Human W's from README/CLAUDE.md)
    console.log(chalk.yellow("\n📖 Extracting human context from README/CLAUDE.md..."));
    try {
      const extractor = new RelentlessContextExtractor();
      const humanContext = await extractor.extractFromProject(targetDir);

      // Apply extracted human context to .faf file
      const fafData = await fs.readFile(fafPath!, 'utf-8');
      const parsed = yamlUtils.parse(fafData);

      // Ensure human_context section exists
      if (!parsed.human_context) {
        parsed.human_context = {};
      }

      // Fill in W's only if they're missing/null and we have confident extractions
      let filledCount = 0;
      const wFields = ['who', 'what', 'why', 'where', 'when', 'how'] as const;

      for (const field of wFields) {
        const extraction = humanContext[field];
        const currentValue = parsed.human_context[field];
        const confidenceStr = typeof extraction.confidence === 'string' ? extraction.confidence : '';

        // Only fill if: current is empty AND extraction is confident
        if ((!currentValue || currentValue === 'null' || currentValue === null) &&
            extraction.value &&
            !extraction.needsUserInput &&
            (confidenceStr === 'CERTAIN' || confidenceStr === 'PROBABLE')) {
          parsed.human_context[field] = extraction.value;
          filledCount++;
        }
      }

      if (filledCount > 0) {
        await fs.writeFile(fafPath!, yamlUtils.stringify(parsed), 'utf-8');
        console.log(chalk.green(`✅ Extracted ${filledCount} human context fields from README/CLAUDE.md`));
      } else {
        console.log(chalk.gray("   No additional human context found (add README.md for better results)"));
      }

      // Show TODOs for missing context
      if (humanContext.todos && humanContext.todos.length > 0) {
        const highPriorityTodos = humanContext.todos.filter(t => t.priority === 'CRITICAL' || t.priority === 'IMPORTANT');
        if (highPriorityTodos.length > 0) {
          console.log(chalk.cyan(`   💡 ${highPriorityTodos.length} human context fields can boost your score`));
        }
      }
    } catch {
      console.log(chalk.gray("   Human context extraction skipped (non-critical)"));
    }

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
        } catch {
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

    // Calculate NEW score (after auto ran)
    let newScore = 0;
    if (fafPath) {
      try {
        const compiler = new FafCompiler();
        const scoreResult = await compiler.compile(fafPath);
        newScore = Math.round(scoreResult.score || 0);
      } catch {
        newScore = currentScore; // fallback to current if error
      }
    }

    // ⚡ Calculate lap time
    const lapTime = ((Date.now() - startTime) / 1000).toFixed(1);

    // ⚡ Read/update personal record from .faf file
    let personalRecord: number | null = null;
    let isNewRecord = false;

    if (fafPath) {
      try {
        const fafData = await fs.readFile(fafPath, 'utf-8');
        const parsed = yamlUtils.parse(fafData);

        // Read previous record (if exists)
        personalRecord = parsed.stats?.best_auto_time || null;

        // For 99% achievements, track record
        if (newScore >= 99) {
          if (!personalRecord || parseFloat(lapTime) < personalRecord) {
            isNewRecord = true;

            // Update .faf with new record
            if (!parsed.stats) {
              parsed.stats = {};
            }
            parsed.stats.best_auto_time = parseFloat(lapTime);
            parsed.stats.last_auto_time = parseFloat(lapTime);
            parsed.stats.times_run = (parsed.stats.times_run || 0) + 1;

            // Refresh score metadata
            parsed.scores = parsed.scores || {};
            parsed.scores.faf_score = newScore;
            parsed.scores.ai_confidence = newScore >= 85 ? 'high' : newScore >= 70 ? 'medium' : 'low';

            await fs.writeFile(fafPath, yamlUtils.stringify(parsed), 'utf-8');
          }
        } else {
          // For sub-99%, just track the attempt time
          if (!parsed.stats) {
            parsed.stats = {};
          }
          parsed.stats.last_auto_time = parseFloat(lapTime);
          parsed.stats.times_run = (parsed.stats.times_run || 0) + 1;

          // Refresh score metadata
          parsed.scores = parsed.scores || {};
          parsed.scores.faf_score = newScore;
          parsed.scores.ai_confidence = newScore >= 85 ? 'high' : newScore >= 70 ? 'medium' : 'low';

          await fs.writeFile(fafPath, yamlUtils.stringify(parsed), 'utf-8');
        }
      } catch {
        // Ignore errors, record tracking is non-critical
      }
    }

    // Show before/after scores
    const scoreDelta = newScore - currentScore;
    const deltaDisplay = scoreDelta === 0
      ? chalk.gray('(no change)')
      : scoreDelta > 0
        ? chalk.green(`(+${scoreDelta}%)`)
        : chalk.red(`(${scoreDelta}%)`);

    // Success message with lap time
    console.log(chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));

    // ⚡ Show lap time ALWAYS
    if (newScore >= 99) {
      // Championship achieved!
      console.log(chalk.bold.cyan(`\n⚡ 99% in ${lapTime}s ⚡`));
      console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));

      if (personalRecord !== null) {
        console.log(chalk.white(`\nYour Record: ${personalRecord}s`));
        console.log(chalk.white(`This Run:    ${lapTime}s ${isNewRecord ? chalk.red('🔥 NEW RECORD!') : ''}`));
      } else {
        console.log(chalk.white(`\nThis Run: ${lapTime}s 🏁 First time!`));
      }

      console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    } else {
      // Not 99% yet - show time with motivational message
      console.log(chalk.bold.yellow(`\n⏱️  Scored ${newScore}% in ${lapTime}s`));
      console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));

      const pointsNeeded = 99 - newScore;
      console.log(chalk.white(`\nLet's get you to 99% - the clock is ticking! ⏰`));
      console.log(chalk.gray(`Need ${pointsNeeded} more points for championship status`));

      if (personalRecord !== null) {
        console.log(chalk.gray(`Your 99% record: ${personalRecord}s - can you beat it?`));
      }

      console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    }

    console.log(chalk.bold.green("\n🏁 FAF AUTO COMPLETE"));
    if (fafPath) {
      console.log(chalk.white(`   Before: ${currentScore}% | After: ${newScore}% ${deltaDisplay}`));
    }
    console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

    // Quick tips
    console.log(chalk.blue("Next steps:"));
    console.log(chalk.gray("  • Check your score: ") + chalk.white("faf show"));
    console.log(chalk.gray("  • See details: ") + chalk.white("faf score --details"));
    console.log(chalk.gray("  • Keep synced: ") + chalk.white("faf bi-sync --watch"));
    console.log(chalk.gray("  • Get AI help: ") + chalk.white("faf enhance"));

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