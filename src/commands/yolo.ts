/**
 * 🏎️ faf yolo - Claude Power User Mode
 * Maximum context extraction, no hand-holding, speed run!
 *
 * faf yolo = faf init --new --force + aggressive extraction + minimal output
 */

import { chalk } from "../fix-once/colors";
import * as fs from "fs/promises";
import * as path from "path";
import { detectProjectType, fileExists } from "../utils/file-utils";
import { generateFafFromProject } from "../generators/faf-generator-championship";
import yamlUtils from "../fix-once/yaml";
import { FafCompiler } from "../compiler/faf-compiler";
import { TurboCat } from "../utils/turbo-cat";
import { RelentlessContextExtractor } from "../engines/relentless-context-extractor";
import { biSyncCommand } from "./bi-sync";
import { createDefaultFafIgnore } from "../utils/fafignore-parser";

interface YoloOptions {
  verbose?: boolean;
}

export async function yoloCommand(directory?: string, options: YoloOptions = {}) {
  const startTime = Date.now();
  const targetDir = directory || process.cwd();
  const homeDir = require('os').homedir();

  // CRITICAL: Prevent running in home or root directory
  if (!directory && (targetDir === homeDir || targetDir === '/')) {
    console.log(chalk.red('\n⚠️  YOLO doesn\'t mean reckless - not running on ROOT'));
    return;
  }

  console.log(chalk.bold.magenta("\n🚀 FAF YOLO - Power User Mode"));
  console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  try {
    const outputPath = path.join(targetDir, 'project.faf');

    // Step 1: Force create .fafignore if missing
    const fafIgnorePath = path.join(targetDir, ".fafignore");
    if (!(await fileExists(fafIgnorePath))) {
      await createDefaultFafIgnore(targetDir);
    }

    // Step 2: Detect project and generate fresh .faf (always overwrite)
    const projectType = await detectProjectType(targetDir);
    const fafContent = await generateFafFromProject({
      projectType,
      outputPath,
      projectRoot: targetDir,
    });
    await fs.writeFile(outputPath, fafContent, "utf-8");

    if (options.verbose) {
      console.log(chalk.green("✅ Fresh .faf created"));
    }

    // Step 3: TURBO-CAT format discovery
    try {
      const turboCat = new TurboCat();
      const analysis = await turboCat.discoverFormats(targetDir);

      if (analysis.discoveredFormats.length > 0) {
        const fafData = await fs.readFile(outputPath, 'utf-8');
        const parsed = yamlUtils.parse(fafData);

        if (!parsed.stack) {parsed.stack = {};}

        // Apply all TURBO-CAT discoveries
        if (analysis.slotFillRecommendations) {
          Object.entries(analysis.slotFillRecommendations).forEach(([key, value]) => {
            if (!parsed.stack[key] || parsed.stack[key] === 'None' || parsed.stack[key] === null) {
              parsed.stack[key] = value;
            }
          });
        }

        if (analysis.stackSignature && analysis.stackSignature !== 'unknown-stack') {
          parsed.stack_signature = analysis.stackSignature;
        }

        if (Object.keys(analysis.frameworkConfidence).length > 0) {
          parsed.detected_frameworks = Object.keys(analysis.frameworkConfidence);
        }

        parsed.turbo_cat_intelligence = analysis.totalIntelligenceScore;
        await fs.writeFile(outputPath, yamlUtils.stringify(parsed), 'utf-8');

        if (options.verbose) {
          console.log(chalk.green(`✅ TURBO-CAT: ${analysis.discoveredFormats.length} formats, ${Object.keys(analysis.slotFillRecommendations).length} slots`));
        }
      }
    } catch {
      // Silent fail - non-critical
    }

    // Step 4: AGGRESSIVE human context extraction (YOLO = accept INFERRED too!)
    try {
      const extractor = new RelentlessContextExtractor();
      const humanContext = await extractor.extractFromProject(targetDir);

      const fafData = await fs.readFile(outputPath, 'utf-8');
      const parsed = yamlUtils.parse(fafData);

      if (!parsed.human_context) {parsed.human_context = {};}

      let filledCount = 0;
      const wFields = ['who', 'what', 'why', 'where', 'when', 'how'] as const;

      for (const field of wFields) {
        const extraction = humanContext[field];
        const currentValue = parsed.human_context[field];

        // HONEST SCORING: Only write REAL values, never empty or MISSING
        // YOLO MODE: Accept CERTAIN, PROBABLE, and INFERRED confidence!
        if ((!currentValue || currentValue === 'null' || currentValue === null) &&
            extraction.value &&
            extraction.value.trim() !== '' &&  // Skip empty values
            extraction.confidence !== 'MISSING' &&  // Skip MISSING confidence
            (extraction.confidence === 'CERTAIN' ||
             extraction.confidence === 'PROBABLE' ||
             extraction.confidence === 'INFERRED')) {
          parsed.human_context[field] = extraction.value;
          filledCount++;
        }
      }

      if (filledCount > 0) {
        await fs.writeFile(outputPath, yamlUtils.stringify(parsed), 'utf-8');
        if (options.verbose) {
          console.log(chalk.green(`✅ Extracted ${filledCount} human context fields (YOLO mode)`));
        }
      }
    } catch {
      // Silent fail
    }

    // Step 5: Bi-sync CLAUDE.md (silent)
    try {
      await biSyncCommand({ auto: true, force: true });
    } catch {
      // Silent fail
    }

    // Calculate final score
    let finalScore = 0;
    try {
      const compiler = new FafCompiler();
      const scoreResult = await compiler.compile(outputPath);
      finalScore = Math.round(scoreResult.score || 0);
    } catch {
      // Fallback
    }

    // Speed run time
    const lapTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Compact output - just what matters
    console.log(chalk.bold.cyan(`⚡ ${finalScore}% in ${lapTime}s`));

    // Medal display - correct tier system
    let medal = '🤍';                           // White 0%
    if (finalScore >= 100) {medal = '🏆';}      // Trophy 100%
    else if (finalScore >= 99) {medal = '🥇';}  // Gold 99%+
    else if (finalScore >= 95) {medal = '🥈';}  // Silver 95%+
    else if (finalScore >= 85) {medal = '🥉';}  // Bronze 85%+
    else if (finalScore >= 70) {medal = '🟢';}  // Green 70%+
    else if (finalScore >= 55) {medal = '🟡';} // Yellow 55%+
    else if (finalScore > 0) {medal = '🔴';}   // Red <55%

    console.log(chalk.white(`${medal} ${targetDir.split('/').pop()}`));

    if (finalScore < 70) {
      console.log(chalk.gray(`\n💡 Add README.md with who/what/why for higher scores`));
    }

    console.log(chalk.gray("\n🏎️ YOLO complete - now go build something!\n"));

  } catch (error) {
    console.log(chalk.red(`\n💥 YOLO failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
