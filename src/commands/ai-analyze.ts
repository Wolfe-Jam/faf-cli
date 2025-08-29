/**
 * 🔍 faf ai-analyze - OpenAI-powered .faf analysis
 * Uses OpenAI Codex CLI to analyze and provide insights on .faf files
 */

import chalk from "chalk";
import { promises as fs } from "fs";
import { execSync } from "child_process";
import * as YAML from "yaml";
import { findFafFile } from "../utils/file-utils";
import { calculateFafScore } from "../scoring/score-calculator";

interface AnalyzeOptions {
  model?: string;
  focus?: "completeness" | "quality" | "ai-readiness" | "human-context";
  verbose?: boolean;
  suggestions?: boolean;
}

export async function analyzeFafWithAI(
  file?: string,
  options: AnalyzeOptions = {},
) {
  try {
    const fafPath = file || (await findFafFile());

    if (!fafPath) {
      console.log(chalk.red("❌ No .faf file found"));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    console.log(chalk.blue(`🔍 AI-analyzing: ${fafPath}`));

    // Check if OpenAI Codex CLI is available
    if (!isCodexAvailable()) {
      console.log(chalk.red("❌ OpenAI Codex CLI not found"));
      console.log(chalk.yellow("💡 Install with: npm install -g @openai/codex"));
      process.exit(1);
    }

    // Read and score current .faf file
    const content = await fs.readFile(fafPath, "utf-8");
    const fafData = YAML.parse(content);
    const scoreResult = calculateFafScore(fafData);

    // Show current state
    console.log(chalk.cyan("\n📊 Current Analysis:"));
    console.log(chalk.cyan("  Score:"), chalk.bold(`${Math.round(scoreResult.totalScore)}%`));
    console.log(chalk.cyan("  Filled Slots:"), `${scoreResult.filledSlots}/${scoreResult.totalSlots}`);
    
    if (options.verbose) {
      console.log(chalk.cyan("\n📋 Section Breakdown:"));
      Object.entries(scoreResult.sectionScores).forEach(([section, score]) => {
        const icon = score.percentage > 80 ? "✅" : score.percentage > 50 ? "🟡" : "❌";
        console.log(chalk.cyan(`  ${icon} ${section}:`), `${Math.round(score.percentage)}% (${score.filled}/${score.total})`);
      });
    }

    // Generate AI analysis prompt
    const analysisPrompt = generateAnalysisPrompt(fafData, scoreResult, options);
    
    console.log(chalk.yellow("\n🤖 Requesting AI analysis..."));
    
    // Execute AI analysis
    const insights = await executeAIAnalysis(analysisPrompt, options);

    if (insights) {
      console.log(chalk.green("\n✨ AI Analysis Complete"));
      console.log(insights);
      
      if (options.suggestions && scoreResult.suggestions.length > 0) {
        console.log(chalk.yellow("\n💡 Automated Suggestions:"));
        scoreResult.suggestions.slice(0, 5).forEach((suggestion, i) => {
          console.log(chalk.yellow(`  ${i + 1}. ${suggestion}`));
        });
      }
    }

  } catch (error) {
    console.log(chalk.red("💥 AI analysis failed:"));
    console.log(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}

function isCodexAvailable(): boolean {
  try {
    execSync("codex --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function generateAnalysisPrompt(fafData: any, scoreResult: any, options: AnalyzeOptions): string {
  const focus = options.focus || "completeness";
  
  const prompt = `Analyze this .faf (Foundational AI-Context Format) file and provide expert insights.

Current .faf file:
\`\`\`yaml
${YAML.stringify(fafData, null, 2)}
\`\`\`

Current Metrics:
- Overall Score: ${Math.round(scoreResult.totalScore)}%
- Filled Slots: ${scoreResult.filledSlots}/${scoreResult.totalSlots}
- Quality Indicators: ${JSON.stringify(scoreResult.qualityIndicators, null, 2)}

Analysis Focus: ${focus}

Please provide a comprehensive analysis covering:

1. **Strengths**: What this .faf file does well
2. **Weaknesses**: Critical gaps and missing elements  
3. **AI Readiness**: How well this would help AI understand the project
4. **Human Context**: Quality of WHO/WHAT/WHY/WHERE/WHEN/HOW information
5. **Actionable Recommendations**: Top 3-5 specific improvements
6. **Score Prediction**: Expected score after implementing recommendations

${focus === "completeness" ? "Focus extra attention on missing required fields and incomplete sections." : ""}
${focus === "quality" ? "Focus on the quality and depth of existing information." : ""}
${focus === "ai-readiness" ? "Focus on how effectively this .faf would onboard an AI assistant." : ""}
${focus === "human-context" ? "Focus on the human aspects: team context, project goals, and business context." : ""}

Be specific, actionable, and constructive. Use a professional but friendly tone.`;

  return prompt;
}

async function executeAIAnalysis(
  prompt: string,
  options: AnalyzeOptions,
): Promise<string | null> {
  try {
    const model = options.model || "gpt-4o-mini";
    
    // Create temporary prompt file
    const promptFile = `/tmp/faf-analyze-prompt-${Date.now()}.txt`;
    await fs.writeFile(promptFile, prompt);
    
    console.log(chalk.dim("🔄 Processing with OpenAI..."));
    
    const command = `codex exec "$(cat ${promptFile})" --model ${model}`;
    
    const result = execSync(command, { 
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 5, // 5MB buffer
      timeout: 30000, // 30 second timeout
    });
    
    // Clean up
    await fs.unlink(promptFile).catch(() => {});
    
    if (result && result.trim()) {
      return result.trim();
    }
    
    return null;
    
  } catch (error) {
    console.log(chalk.red("❌ Codex CLI execution failed:"));
    if (error instanceof Error && error.message.includes("timeout")) {
      console.log(chalk.yellow("⏱️ Analysis timed out - try a smaller focus area"));
    } else {
      console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    }
    return null;
  }
}