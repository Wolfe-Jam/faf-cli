/**
 * 🤖 faf ai-enhance - OpenAI-powered .faf enhancement
 * Integrates with OpenAI Codex CLI to improve .faf files
 */

import chalk from "chalk";
import { promises as fs } from "fs";
import { execSync } from "child_process";
import * as YAML from "yaml";
import { findFafFile } from "../utils/file-utils";

interface EnhanceOptions {
  model?: string;
  focus?: string;
  interactive?: boolean;
  dryRun?: boolean;
}

export async function enhanceFafWithAI(
  file?: string,
  options: EnhanceOptions = {},
) {
  try {
    const fafPath = file || (await findFafFile());

    if (!fafPath) {
      console.log(chalk.red("❌ No .faf file found"));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    console.log(chalk.blue(`🤖 AI-enhancing: ${fafPath}`));

    // Check if OpenAI Codex CLI is available
    if (!isCodexAvailable()) {
      console.log(chalk.red("❌ OpenAI Codex CLI not found"));
      console.log(chalk.yellow("💡 Install with: npm install -g @openai/codex"));
      console.log(chalk.yellow("📖 More info: https://developers.openai.com/codex/cli"));
      process.exit(1);
    }

    // Read current .faf file
    const content = await fs.readFile(fafPath, "utf-8");
    const fafData = YAML.parse(content);

    console.log(chalk.cyan("📊 Current .faf score:"), chalk.bold(fafData.scores?.faf_score || "N/A"));

    // Determine enhancement focus
    const focus = options.focus || detectEnhancementFocus(fafData);
    console.log(chalk.blue(`🎯 Enhancement focus: ${focus}`));

    // Generate AI enhancement prompt
    const enhancementPrompt = generateEnhancementPrompt(fafData, focus);
    
    if (options.dryRun) {
      console.log(chalk.yellow("\n🔍 Dry run - Enhancement prompt:"));
      console.log(chalk.dim(enhancementPrompt));
      return;
    }

    // Execute AI enhancement
    const enhanced = await executeAIEnhancement(enhancementPrompt, fafPath, options);

    if (enhanced) {
      console.log(chalk.green("✅ .faf file enhanced with AI suggestions"));
      console.log(chalk.cyan("📈 Run 'faf score' to see improvement"));
    }

  } catch (error) {
    console.log(chalk.red("💥 AI enhancement failed:"));
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

function detectEnhancementFocus(fafData: any): string {
  const score = fafData.scores?.faf_score || 0;
  
  // Analyze what's missing most critically
  if (!fafData.human_context?.who) return "human-context";
  if (!fafData.ai_instructions?.message) return "ai-instructions";
  if (score < 70) return "completeness";
  if (!fafData.project?.goal) return "project-clarity";
  
  return "optimization";
}

function generateEnhancementPrompt(fafData: any, focus: string): string {
  const basePrompt = `Analyze and enhance this .faf (Foundational AI-Context Format) file.

Current .faf content:
\`\`\`yaml
${YAML.stringify(fafData, null, 2)}
\`\`\`

Enhancement focus: ${focus}

Please:
1. Analyze the current .faf completeness and quality
2. Suggest specific improvements for the "${focus}" area
3. Provide enhanced YAML content
4. Ensure all suggestions follow .faf v2.4.0 schema
5. Maintain existing working elements

Focus areas:
- human-context: Improve WHO/WHAT/WHY/WHERE/WHEN/HOW sections
- ai-instructions: Enhance AI onboarding and context handoff
- completeness: Fill missing required fields
- project-clarity: Improve project goals and description
- optimization: Performance and quality improvements

Output the enhanced .faf file as valid YAML.`;

  return basePrompt;
}

async function executeAIEnhancement(
  prompt: string,
  fafPath: string,
  options: EnhanceOptions,
): Promise<boolean> {
  try {
    console.log(chalk.yellow("🤖 Calling OpenAI Codex CLI..."));
    
    const model = options.model || "gpt-4o-mini";
    const mode = options.interactive ? "" : "exec";
    
    // Create temporary prompt file
    const promptFile = `/tmp/faf-enhance-prompt-${Date.now()}.txt`;
    await fs.writeFile(promptFile, prompt);
    
    const command = options.interactive
      ? `codex --model ${model}`
      : `codex ${mode} "$(cat ${promptFile})"`;
    
    console.log(chalk.dim(`Executing: ${command}`));
    
    if (options.interactive) {
      console.log(chalk.cyan("\n🎮 Interactive mode - Codex CLI will open"));
      console.log(chalk.dim(`Prompt saved to: ${promptFile}`));
      console.log(chalk.yellow("Copy the prompt and paste it into Codex CLI"));
      return true;
    }
    
    // Non-interactive execution
    const result = execSync(command, { 
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });
    
    // Clean up
    await fs.unlink(promptFile).catch(() => {});
    
    if (result && result.trim()) {
      // Try to extract YAML from the result
      const yamlMatch = result.match(/```yaml\n([\s\S]*?)\n```/);
      if (yamlMatch) {
        const enhancedYaml = yamlMatch[1];
        
        // Validate the enhanced YAML
        try {
          const parsed = YAML.parse(enhancedYaml);
          
          // Basic validation
          if (parsed.faf_version && parsed.project) {
            // Backup original
            await fs.copyFile(fafPath, `${fafPath}.backup`);
            
            // Write enhanced version
            await fs.writeFile(fafPath, enhancedYaml);
            
            console.log(chalk.green("✅ Enhanced .faf file saved"));
            console.log(chalk.dim(`📁 Backup: ${fafPath}.backup`));
            return true;
          }
        } catch (parseError) {
          console.log(chalk.red("❌ AI returned invalid YAML"));
          console.log(chalk.yellow("🤖 AI Response:"));
          console.log(result);
          return false;
        }
      }
    }
    
    console.log(chalk.yellow("⚠️ No valid enhancement received"));
    return false;
    
  } catch (error) {
    console.log(chalk.red("❌ Codex CLI execution failed:"));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    return false;
  }
}