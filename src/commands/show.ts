/**
 * 🏎️ faf show - Championship Score Card Display
 * Shows FAF project score card with clean markdown output
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import * as YAML from "yaml";
import { FafCompiler } from "../compiler/faf-compiler";
import { findFafFile } from "../utils/file-utils";
import { getScoreColor, getScoreEmoji } from "../utils/color-utils";

interface ShowOptions {
  raw?: boolean;
}

export async function showFafScoreCard(directory?: string, options: ShowOptions = {}) {
  try {
    const targetDir = directory || process.cwd();

    // Find .faf file in directory
    const fafPath = await findFafFile(targetDir);

    if (!fafPath) {
      console.log(chalk.red("❌ No .faf file found"));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    // Read and parse .faf file
    const content = await fs.readFile(fafPath, "utf-8");
    const fafData = YAML.parse(content);

    // Calculate score
    const compiler = new FafCompiler();
    const scoreResult = await compiler.compile(fafPath);
    const percentage = Math.round(scoreResult.score || 0);

    // 🍫🍊 CHOCOLATE ORANGE - NO WRAPPERS!
    // Clean markdown output for direct display

    if (options.raw) {
      // Raw markdown output (for piping, etc.)
      const output = `# 🏎️  FAF Stats

## **Project Score: ${percentage}/100**

${percentage >= 99 ? '🏁 **CHAMPIONSHIP STATUS ACHIEVED!**' :
  percentage >= 80 ? '✨ **Excellent AI Context!**' :
  percentage >= 60 ? '👍 **Good Foundation**' :
  '⚠️  **Needs Enhancement**'}

### Project Details
- **Name**: ${typeof fafData.project === 'object' && fafData.project?.name
  ? fafData.project.name
  : (typeof fafData.project === 'string' ? fafData.project : 'Unknown')}
- **Version**: ${fafData.version || '1.0.0'}
- **Stack**: ${typeof fafData.stack === 'object' && fafData.stack?.name
  ? fafData.stack.name
  : (typeof fafData.stack === 'string' ? fafData.stack :
    (fafData.instant_context?.tech_stack || 'Not specified'))}
${fafData.ai_models ? `- **AI Models**: ${fafData.ai_models.join(', ')}` : ''}

### Score Breakdown
Use \`faf score --details\` for complete breakdown

---
*🏎️ FAF Engine | Championship Grade Context*`;

      console.log(output);
    } else {
      // Formatted console output
      const scoreColor = getScoreColor(percentage);
      const scoreEmoji = getScoreEmoji(percentage);

      console.log(chalk.bold.blue("\n🏎️  FAF Stats"));
      console.log(chalk.bold.blue("=============\n"));

      // Score display
      console.log(scoreColor(chalk.bold(`${scoreEmoji} Project Score: ${percentage}/100`)));

      // Status message
      if (percentage >= 99) {
        console.log(chalk.green.bold("🏁 CHAMPIONSHIP STATUS ACHIEVED!"));
      } else if (percentage >= 80) {
        console.log(chalk.green("✨ Excellent AI Context!"));
      } else if (percentage >= 60) {
        console.log(chalk.yellow("👍 Good Foundation"));
      } else {
        console.log(chalk.red("⚠️  Needs Enhancement"));
      }

      // Project details
      console.log(chalk.blue("\n📋 Project Details:"));
      // Handle both string and object formats for project name
      const projectName = typeof fafData.project === 'object' && fafData.project?.name
        ? fafData.project.name
        : (typeof fafData.project === 'string' ? fafData.project : 'Unknown');
      console.log(`   Name: ${chalk.white(projectName)}`);
      console.log(`   Version: ${chalk.white(fafData.version || '1.0.0')}`);
      // Handle both string and object formats for stack
      const stackName = typeof fafData.stack === 'object' && fafData.stack?.name
        ? fafData.stack.name
        : (typeof fafData.stack === 'string' ? fafData.stack :
          (fafData.instant_context?.tech_stack || 'Not specified'));
      console.log(`   Stack: ${chalk.white(stackName)}`);
      if (fafData.ai_models) {
        console.log(`   AI Models: ${chalk.white(fafData.ai_models.join(', '))}`);
      }

      // TODO: Add score breakdown back when compiler supports sectionScores
      // console.log(chalk.blue("\n📊 Score Breakdown:"));
      // Object.entries(scoreResult.sectionScores).forEach(([section, score]) => {
      //   const sectionPercentage = Math.round(score.percentage);
      //   const sectionColor = sectionPercentage >= 70 ? chalk.green :
      //                      sectionPercentage >= 40 ? chalk.yellow :
      //                      chalk.red;

      //   console.log(`   ${sectionColor(section)}: ${sectionPercentage}% (${score.filled}/${score.total})`);
      // });

      // Next steps if not perfect
      // TODO: Add suggestions back when compiler supports them
      // if (percentage < 100) {
      //   console.log(chalk.blue("\n💡 Next Steps:"));
      //   scoreResult.suggestions.slice(0, 3).forEach((suggestion: string, index: number) => {
      //     console.log(chalk.yellow(`   ${index + 1}. ${suggestion}`));
      //   });
      // }

      console.log(chalk.gray("\n---"));
      console.log(chalk.gray("🏎️ FAF Engine | Championship Grade Context"));
    }

  } catch (error) {
    console.log(chalk.red("💥 Show command failed:"));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}