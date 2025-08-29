/**
 * 🚀 faf init - Initialization Command
 * Generate .faf file from project structure with auto-detection
 */

import chalk from 'chalk';
import { promises as fs } from 'fs';
import * as YAML from 'yaml';
import { detectProjectType, findPackageJson, fileExists } from '../utils/file-utils';
import { generateFafFromProject } from '../generators/faf-generator';

interface InitOptions {
  force?: boolean;
  template?: string;
  output?: string;
}

export async function initFafFile(projectPath?: string, options: InitOptions = {}) {
  try {
    const projectRoot = projectPath || process.cwd();
    const outputPath = options.output ? options.output : `${projectRoot}/.faf`;
    
    // Check if .faf file already exists
    if (await fileExists(outputPath) && !options.force) {
      console.log(chalk.yellow(`⚠️  .faf file already exists: ${outputPath}`));
      console.log(chalk.yellow('Use --force to overwrite'));
      process.exit(1);
    }
    
    console.log(chalk.blue('🚀 Initializing .faf file...'));
    
    // Detect project structure
    const projectType = options.template === 'auto' 
      ? await detectProjectType(projectRoot)
      : options.template || await detectProjectType(projectRoot);
      
    console.log(chalk.gray(`   Detected project type: ${projectType}`));
    
    // Generate .faf content
    const fafContent = await generateFafFromProject({
      projectType,
      outputPath,
      projectRoot: projectRoot
    });
    
    // Write .faf file
    await fs.writeFile(outputPath, fafContent, 'utf-8');
    
    console.log(chalk.green(`✅ Created ${outputPath}`));
    
    // Show initial score
    const fafData = YAML.parse(fafContent);
    const initialScore = fafData.scores?.faf_score || 0;
    
    console.log(chalk.blue(`📊 Initial score: ${initialScore}%`));
    
    // Next steps
    console.log(chalk.yellow('\n💡 Next steps:'));
    console.log(chalk.yellow('   1. Run "faf score --details" to see improvement opportunities'));
    console.log(chalk.yellow('   2. Edit .faf file to add missing context'));
    console.log(chalk.yellow('   3. Run "faf validate" to check format compliance'));
    
    if (initialScore < 70) {
      console.log(chalk.yellow('   4. Aim for 70%+ score for good AI context'));
    }
    
  } catch (error) {
    console.log(chalk.red('💥 Initialization failed:'));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}