/**
 * 🔧 faf lint - Lint Command
 * Format compliance and style checking for .faf files
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import * as YAML from "yaml";
import { findFafFile } from "../utils/file-utils";
import { validateSchema } from "../schema/faf-schema";

interface LintOptions {
  fix?: boolean;
  schemaVersion?: string;
}

interface LintIssue {
  type: "error" | "warning" | "info";
  message: string;
  line?: number;
  fixable: boolean;
  fix?: () => void;
}

export async function lintFafFile(file?: string, options: LintOptions = {}) {
  try {
    const fafPath = file || (await findFafFile());

    if (!fafPath) {
      console.log(chalk.red("❌ No .faf file found"));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    console.log(chalk.blue(`🔧 Linting: ${fafPath}`));

    // Read .faf file
    const content = await fs.readFile(fafPath, "utf-8");

    // Parse and analyze
    let fafData: any;
    const issues: LintIssue[] = [];

    try {
      fafData = YAML.parse(content);
    } catch (parseError) {
      issues.push({
        type: "error",
        message: `YAML parsing error: ${parseError}`,
        fixable: false,
      });

      console.log(chalk.red("❌ Failed to parse .faf file"));
      console.log(
        chalk.red(
          parseError instanceof Error ? parseError.message : String(parseError),
        ),
      );
      process.exit(1);
    }

    // Run schema validation first
    const validation = validateSchema(fafData, options.schemaVersion);

    // Convert validation results to lint issues
    validation.errors.forEach((error) => {
      issues.push({
        type: "error",
        message: error.message,
        fixable: false,
      });
    });

    validation.warnings.forEach((warning) => {
      issues.push({
        type: "warning",
        message: warning.message,
        fixable: false,
      });
    });

    // Additional lint checks
    performFormatLinting(fafData, content, issues);
    performStyleLinting(fafData, issues);
    performBestPracticeLinting(fafData, issues);

    // Display results
    const errors = issues.filter((i) => i.type === "error");
    const warnings = issues.filter((i) => i.type === "warning");
    const info = issues.filter((i) => i.type === "info");
    const fixableIssues = issues.filter((i) => i.fixable);

    if (errors.length === 0 && warnings.length === 0 && info.length === 0) {
      console.log(chalk.green("☑️ No linting issues found"));
      return;
    }

    // Show issues by type
    if (errors.length > 0) {
      console.log(chalk.red(`\n❌ ${errors.length} Error(s):`));
      errors.forEach((error, index) => {
        console.log(chalk.red(`   ${index + 1}. ${error.message}`));
      });
    }

    if (warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠️  ${warnings.length} Warning(s):`));
      warnings.forEach((warning, index) => {
        console.log(chalk.yellow(`   ${index + 1}. ${warning.message}`));
      });
    }

    if (info.length > 0) {
      console.log(chalk.blue(`\n💡 ${info.length} Suggestion(s):`));
      info.forEach((suggestion, index) => {
        console.log(chalk.blue(`   ${index + 1}. ${suggestion.message}`));
      });
    }

    // Auto-fix if requested
    if (options.fix && fixableIssues.length > 0) {
      console.log(
        chalk.blue(`\n🔧 Auto-fixing ${fixableIssues.length} issue(s)...`),
      );

      fixableIssues.forEach((issue) => {
        if (issue.fix) {
          issue.fix();
        }
      });

      // Write fixed content
      const fixedContent = YAML.stringify(fafData, { lineWidth: 100 });
      await fs.writeFile(fafPath, fixedContent, "utf-8");

      console.log(chalk.green("☑️ Auto-fixes applied"));
    } else if (fixableIssues.length > 0) {
      console.log(
        chalk.yellow(
          `\n💡 ${fixableIssues.length} issue(s) can be auto-fixed with --fix`,
        ),
      );
    }

    // Exit with error code if there are errors
    if (errors.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.log(chalk.red("💥 Linting failed:"));
    console.log(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}

function performFormatLinting(
  fafData: any,
  content: string,
  issues: LintIssue[],
): void {
  // Check YAML formatting
  try {
    const normalizedYaml = YAML.stringify(fafData, { lineWidth: 100 });
    const currentLines = content.split("\n").map((line) => line.trimEnd());
    const normalizedLines = normalizedYaml
      .split("\n")
      .map((line) => line.trimEnd());

    if (currentLines.length !== normalizedLines.length) {
      issues.push({
        type: "info",
        message: "YAML formatting could be improved",
        fixable: true,
        fix: () => {
          // Fix will be applied in the main function
        },
      });
    }
  } catch {
    // Skip formatting check if there are parsing issues
  }

  // Check for trailing whitespace
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (line.length > 0 && line !== line.trimEnd()) {
      issues.push({
        type: "warning",
        message: `Trailing whitespace on line ${index + 1}`,
        line: index + 1,
        fixable: true,
      });
    }
  });
}

function performStyleLinting(fafData: any, issues: LintIssue[]): void {
  // Check for consistent naming
  if (fafData.project?.name && fafData.project.name.includes("_")) {
    issues.push({
      type: "info",
      message: "Project name contains underscores - consider kebab-case",
      fixable: false,
    });
  }

  // Check score consistency
  if (fafData.scores) {
    const fafScore = fafData.scores.faf_score;
    const slotPercentage = fafData.scores.slot_based_percentage;

    if (typeof fafScore === "number" && typeof slotPercentage === "number") {
      const expectedSlots = Math.round((fafScore / 100) * 21);
      if (Math.abs(slotPercentage - expectedSlots) > 2) {
        issues.push({
          type: "warning",
          message: "Slot-based percentage may be inconsistent with faf_score",
          fixable: false,
        });
      }
    }
  }
}

function performBestPracticeLinting(fafData: any, issues: LintIssue[]): void {
  // Check for AI instructions
  if (!fafData.ai_instructions || !fafData.ai_instructions.message) {
    issues.push({
      type: "info",
      message: "Consider adding ai_instructions section for better AI context",
      fixable: false,
    });
  }

  // Check for human context
  if (!fafData.human_context) {
    issues.push({
      type: "info",
      message:
        "Consider adding human_context section (who/what/why/where/when/how)",
      fixable: false,
    });
  }

  // Check timestamp freshness
  if (fafData.generated) {
    try {
      const generated = new Date(fafData.generated);
      const daysSince =
        (Date.now() - generated.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince > 30) {
        issues.push({
          type: "warning",
          message: `Generated timestamp is ${Math.round(daysSince)} days old - consider updating`,
          fixable: true,
          fix: () => {
            fafData.generated = new Date().toISOString();
          },
        });
      }
    } catch {
      issues.push({
        type: "warning",
        message: "Invalid generated timestamp format",
        fixable: true,
        fix: () => {
          fafData.generated = new Date().toISOString();
        },
      });
    }
  }

  // Check for empty sections
  Object.entries(fafData).forEach(([key, value]) => {
    if (
      typeof value === "object" &&
      value !== null &&
      Object.keys(value).length === 0
    ) {
      issues.push({
        type: "warning",
        message: `Empty section detected: ${key}`,
        fixable: false,
      });
    }
  });
}
