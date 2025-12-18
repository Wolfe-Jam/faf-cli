/**
 * 🔍 faf validate - Validation Command
 * Validates .faf files against schema with detailed feedback
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import { parse as parseYAML } from '../fix-once/yaml';
import { validateSchema } from "../schema/faf-schema";
import { findFafFile } from "../utils/file-utils";
import { autoAwardCredit } from "../utils/technical-credit";

interface ValidateOptions {
  schema?: string;
  verbose?: boolean;
}

export async function validateFafFile(
  file?: string,
  options: ValidateOptions = {},
) {
  try {
    const fafPath = file || (await findFafFile());

    if (!fafPath) {
      console.log(chalk.red("❌ No .faf file found"));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    console.log(chalk.blue(`🔍 Validating: ${fafPath}`));

    // Read and parse .faf file
    const content = await fs.readFile(fafPath, "utf-8");
    const fafData = parseYAML(content);

    // Validate against schema
    const validation = validateSchema(fafData, options.schema || "latest");

    if (validation.valid) {
      console.log(chalk.green("☑️ Valid .faf file"));

      // Award technical credit for successful validation
      await autoAwardCredit('validation_passed', fafPath);

      if (options.verbose) {
        console.log(chalk.gray("📊 Validation Details:"));
        console.log(
          chalk.gray(`   Schema Version: ${validation.schemaVersion}`),
        );
        console.log(
          chalk.gray(`   Format Version: ${fafData.faf_version || "unknown"}`),
        );
        console.log(
          chalk.gray(`   Total Sections: ${validation.sectionsFound}`),
        );
        console.log(
          chalk.gray(
            `   Required Fields: ${validation.requiredFieldsFound}/${validation.requiredFieldsTotal}`,
          ),
        );
      }
    } else {
      console.log(chalk.red("❌ Invalid .faf file"));
      console.log(chalk.red("🚨 Errors found:"));

      validation.errors.forEach((error, index) => {
        console.log(chalk.red(`   ${index + 1}. ${error.message}`));
        if (error.path) {
          console.log(chalk.gray(`      Path: ${error.path}`));
        }
      });

      if (validation.warnings.length > 0) {
        console.log(chalk.yellow("⚠️  Warnings:"));
        validation.warnings.forEach((warning, index) => {
          console.log(chalk.yellow(`   ${index + 1}. ${warning.message}`));
        });
      }

      process.exit(1);
    }
  } catch (error) {
    console.log(chalk.red("💥 Validation failed:"));
    console.log(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
