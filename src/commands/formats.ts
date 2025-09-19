/**
 * 🏆 faf formats - TURBO-CAT Format Discovery Command
 * Lists all discovered formats in the project
 */

import chalk from "chalk";
import { FAF_COLORS, FAF_ICONS, generateFAFHeader } from "../utils/championship-style";
import { TurboCat } from "../utils/turbo-cat";

interface FormatOptions {
  export?: boolean;
  json?: boolean;
  category?: boolean;
}

export async function formatsCommand(projectPath?: string, options: FormatOptions = {}) {
  // Show the FAF banner
  console.log(generateFAFHeader());

  console.log();
  console.log(FAF_COLORS.fafCyan(`😽 TURBO-CAT™ Format Discovery v2.0.0`));
  console.log(FAF_COLORS.fafCyan(`════════════════════════════════════`));
  console.log();

  const turboCat = new TurboCat();
  const projectRoot = projectPath || process.cwd();

  console.log(chalk.gray(`${FAF_ICONS.lightning} Scanning project at ${projectRoot}...`));

  const startTime = Date.now();
  const analysis = await turboCat.discoverFormats(projectRoot);
  const elapsedTime = Date.now() - startTime;

  console.log();
  console.log(FAF_COLORS.fafGreen(`✅ Found ${analysis.discoveredFormats.length} formats in ${elapsedTime}ms!`));
  console.log();

  if (options.json || options.export) {
    // Export as JSON
    console.log(JSON.stringify(analysis, null, 2));
  } else if (options.category) {
    // Show by category (pyramid levels)
    console.log(FAF_COLORS.fafCyan(`📊 By Category:`));
    console.log();

    const categories: { [key: string]: string[] } = {
      'Config': [],
      'Code': [],
      'Documentation': [],
      'Testing': [],
      'CI/CD': [],
      'Container': [],
      'Database': [],
      'Other': []
    };

    // Categorize formats
    analysis.discoveredFormats.forEach(format => {
      const formatName = format.fileName;
      if (formatName.includes('json') || formatName.includes('yaml') || formatName.includes('toml')) {
        categories['Config'].push(formatName);
      } else if (formatName.includes('.ts') || formatName.includes('.js') || formatName.includes('.py')) {
        categories['Code'].push(formatName);
      } else if (formatName.includes('.md') || formatName.includes('README')) {
        categories['Documentation'].push(formatName);
      } else if (formatName.includes('test') || formatName.includes('spec')) {
        categories['Testing'].push(formatName);
      } else if (formatName.includes('workflow') || formatName.includes('jenkins')) {
        categories['CI/CD'].push(formatName);
      } else if (formatName.includes('docker') || formatName.includes('compose')) {
        categories['Container'].push(formatName);
      } else if (formatName.includes('.sql') || formatName.includes('migration')) {
        categories['Database'].push(formatName);
      } else {
        categories['Other'].push(formatName);
      }
    });

    // Display categories
    Object.entries(categories).forEach(([category, formats]) => {
      if (formats.length > 0) {
        console.log(FAF_COLORS.fafOrange(`  ${category}:`));
        formats.forEach(format => {
          console.log(chalk.gray(`    - ${format}`));
        });
        console.log();
      }
    });
  } else {
    // Default: alphabetical list
    console.log(FAF_COLORS.fafCyan(`📋 Discovered Formats (A-Z):`));
    console.log();

    const sorted = [...analysis.discoveredFormats].sort((a, b) => a.fileName.localeCompare(b.fileName));
    sorted.forEach(format => {
      const isConfirmed = format.confirmed;
      const icon = isConfirmed ? '✅' : '📄';
      const color = isConfirmed ? chalk.green : chalk.gray;
      console.log(color(`  ${icon} ${format.fileName}`));
    });
  }

  console.log();
  console.log(FAF_COLORS.fafCyan(`💡 Stack Signature: ${analysis.stackSignature}`));
  console.log(FAF_COLORS.fafOrange(`🏆 Intelligence Score: ${analysis.totalIntelligenceScore}`));
  console.log();

  // TURBO-CAT signature
  console.log(chalk.gray('─'.repeat(40)));
  console.log(FAF_COLORS.fafCyan(`😽 TURBO-CAT™: "I detected ${analysis.discoveredFormats.length} formats and made your stack PURRR!"`));
  console.log(chalk.gray('─'.repeat(40)));
  console.log();
}