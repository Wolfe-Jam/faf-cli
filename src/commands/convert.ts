/**
 * 🏆 FAF CONVERT Command
 * Golden Rule: .faf = YAML → Convert to MD or TXT
 */

import { chalk } from '../fix-once/colors';
import { convertFaf, saveConversion } from '../converters/faf-converters';
import * as path from 'path';
import * as fs from 'fs';

export interface ConvertOptions {
  format?: 'md' | 'txt';
  output?: string;
  save?: boolean;
}

export async function convertCommand(fafPath?: string, options: ConvertOptions = {}) {
  console.log(chalk.cyan('🔄 FAF Converter - Golden Rule Edition'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  try {
    // Find .faf file
    const targetPath = fafPath || '.faf';
    const resolvedPath = path.resolve(targetPath);

    if (!fs.existsSync(resolvedPath)) {
      console.error(chalk.red('❌ No .faf file found!'));
      console.log(chalk.yellow('💡 Run "faf init" first to create a .faf file'));
      return;
    }

    const format = options.format || 'md';
    console.log(chalk.blue(`📝 Converting to ${format.toUpperCase()}...`));

    if (options.save) {
      // Save to file
      const outputPath = saveConversion(resolvedPath, format);
      console.log(chalk.green(`✅ Saved to: ${outputPath}`));

      // Show preview
      const content = fs.readFileSync(outputPath, 'utf-8');
      console.log(chalk.gray('\n--- Preview ---'));
      console.log(`${content.substring(0, 500)  }...`);
    } else {
      // Output to console
      const converted = convertFaf(resolvedPath, options);
      console.log(chalk.gray('\n--- Output ---'));
      console.log(converted);
    }

    console.log(chalk.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan('🏁 Conversion Complete!'));

    if (!options.save) {
      console.log(chalk.gray('💡 Use --save to write to file'));
    }

  } catch (error) {
    console.error(chalk.red(`❌ Conversion failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Quick MD converter
 */
export async function toMarkdown(fafPath?: string) {
  return convertCommand(fafPath, { format: 'md' });
}

/**
 * Quick TXT converter
 */
export async function toText(fafPath?: string) {
  return convertCommand(fafPath, { format: 'txt' });
}