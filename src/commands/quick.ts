/**
 * ⚡ FAF Quick - Lightning-fast .faf creation
 * One-liner format for instant context generation
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import * as path from 'path';
import { generateFafFromProject } from '../generators/faf-generator-championship';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';
import { fileExists } from '../utils/file-utils';
import { UniversalFuzzyDetector } from '../utils/universal-fuzzy-detector';

interface QuickOptions {
  force?: boolean;
}

/**
 * Quick format parser - accepts simple comma-separated values
 * Format: "project name, what it does, main language, framework, where deployed"
 * Example: "my-app, e-commerce platform, typescript, react, vercel"
 */
function parseQuickInput(input: string): any {
  const parts = input.split(',').map(s => s.trim());

  // Minimum 2 parts required (name and description)
  if (parts.length < 2) {
    throw new Error('Need at least: project-name, description');
  }

  // Use fuzzy detection on each part
  const projectGoal = parts[1] || 'Build amazing software';
  const languageInput = parts[2] || 'TypeScript';
  const frameworkInput = parts[3] || 'none';

  // Detect project type from goal with fuzzy matching
  const projectTypeDetection = UniversalFuzzyDetector.detectProjectType(projectGoal);
  const languageDetection = UniversalFuzzyDetector.detectLanguage(languageInput);

  // Log if fuzzy matching helped
  if (projectTypeDetection.corrected) {
    console.log(chalk.yellow(`   📝 Auto-corrected: "${parts[1]}" → "${projectTypeDetection.corrected}"`));
  }
  if (languageDetection.corrected) {
    console.log(chalk.yellow(`   📝 Auto-corrected: "${languageInput}" → "${languageDetection.type}"`));
  }

  return {
    projectName: parts[0] || 'my-project',
    projectGoal: projectGoal,  // Keep original goal text
    projectType: projectTypeDetection.type || 'general',
    mainLanguage: languageDetection.type || languageInput,
    framework: frameworkInput,
    hosting: parts[4] || 'cloud',
    // Auto-detect additional context
    slotBasedPercentage: 60,
    fafScore: 60,
    // Include detection info for logging
    _detections: {
      projectType: projectTypeDetection,
      language: languageDetection
    }
  };
}

export async function quickCommand(input?: string, options: QuickOptions = {}) {
  const startTime = Date.now();

  try {
    console.log();
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.lightning} FAF Quick Mode`));

    // If no input provided, show usage
    if (!input) {
      console.log();
      console.log(FAF_COLORS.fafWhite('Usage:'));
      console.log(FAF_COLORS.fafCyan('  faf quick "project-name, description, language, framework, hosting"'));
      console.log();
      console.log(FAF_COLORS.fafWhite('Examples:'));
      console.log(chalk.gray('  faf quick "my-app, e-commerce platform, typescript, react, vercel"'));
      console.log(chalk.gray('  faf quick "api-service, REST API for mobile app, python, fastapi, aws"'));
      console.log(chalk.gray('  faf quick "cli-tool, developer productivity tool, go"'));
      console.log();
      console.log(FAF_COLORS.fafOrange('💡 Minimum: name and description. Rest is auto-detected!'));
      return;
    }

    const projectRoot = process.cwd();
    const outputPath = path.join(projectRoot, '.faf');

    // Check if .faf exists
    if (await fileExists(outputPath) && !options.force) {
      console.log(FAF_COLORS.fafOrange(`⚠️  .faf file already exists`));
      console.log(chalk.yellow('   Use --force to overwrite or "faf edit" to modify'));
      return;
    }

    // Parse the quick input
    const projectData = parseQuickInput(input);

    console.log(chalk.gray(`   Creating .faf for: ${projectData.projectName}`));

    // Generate .faf content
    const detectedType = detectProjectTypeFromQuick(projectData);
    console.log(chalk.gray(`   Detected project type: ${detectedType}`));

    const fafContent = await generateFafFromProject({
      projectType: detectedType,
      outputPath,
      projectRoot,
      ...projectData
    });

    // Write the file
    await fs.writeFile(outputPath, fafContent, 'utf-8');

    const elapsedTime = Date.now() - startTime;

    console.log();
    console.log(FAF_COLORS.fafGreen(`☑️ Created .faf in ${elapsedTime}ms!`));
    console.log();
    console.log(FAF_COLORS.fafWhite('Quick Summary:'));
    console.log(chalk.gray(`   📦 Project: ${projectData.projectName}`));
    console.log(chalk.gray(`   🎯 Purpose: ${projectData.projectGoal}`));
    console.log(chalk.gray(`   💻 Stack: ${projectData.mainLanguage}${projectData.framework !== 'none' ? ' + ' + projectData.framework : ''}`));

    console.log();
    console.log(FAF_COLORS.fafCyan('Next steps:'));
    console.log(chalk.gray('   • Run "faf score" to check AI-readiness'));
    console.log(chalk.gray('   • Run "faf enhance" to improve context'));
    console.log(chalk.gray('   • Run "faf chat" for interactive improvements'));

  } catch (error) {
    console.log(chalk.red('💥 Quick creation failed:'));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    console.log();
    console.log(chalk.yellow('💡 Try "faf chat" for interactive mode'));
    process.exit(1);
  }
}

function detectProjectTypeFromQuick(data: any): string {
  const framework = data.framework?.toLowerCase() || '';
  const language = data.mainLanguage?.toLowerCase() || '';
  const goal = data.projectGoal?.toLowerCase() || '';

  // Framework-based detection
  if (framework.includes('react') || framework.includes('next')) return 'react';
  if (framework.includes('vue') || framework.includes('nuxt')) return 'vue';
  if (framework.includes('svelte') || framework.includes('kit')) return 'svelte';
  if (framework.includes('angular')) return 'angular';
  if (framework.includes('fastapi')) return 'python-fastapi';
  if (framework.includes('django')) return 'python-django';
  if (framework.includes('flask')) return 'python-flask';
  if (framework.includes('express')) return 'node-api';

  // Goal-based detection
  if (goal.includes('chrome extension') || goal.includes('browser extension')) return 'chrome-extension';
  if (goal.includes('api') || goal.includes('backend')) return 'node-api';
  if (goal.includes('cli') || goal.includes('command')) return 'cli-tool';
  if (goal.includes('library') || goal.includes('package')) return 'library';

  // Language-based fallback
  if (language.includes('python')) return 'python';
  if (language.includes('go')) return 'golang';
  if (language.includes('rust')) return 'rust';

  return 'latest-idea';
}