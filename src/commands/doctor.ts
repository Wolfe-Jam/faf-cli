/**
 * 🏥 FAF Doctor - Diagnose and fix common issues
 * Health check for your .faf setup
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import * as path from 'path';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import { findFafFile, fileExists } from '../utils/file-utils';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';
import { FafCompiler } from '../compiler/faf-compiler';

interface DiagnosticResult {
  status: 'ok' | 'warning' | 'error';
  message: string;
  fix?: string;
}

export async function doctorCommand(): Promise<void> {
  console.log();
  console.log(FAF_COLORS.fafCyan(`🏥 FAF Doctor - Health Check`));
  console.log(FAF_COLORS.fafWhite('━'.repeat(50)));
  console.log();

  const results: DiagnosticResult[] = [];

  // Check 1: FAF CLI Version
  console.log(chalk.gray('Checking FAF CLI version...'));
  const packageJson = require('../../package.json');
  const version = packageJson.version;
  results.push({
    status: 'ok',
    message: `FAF CLI version: ${version}`
  });

  // Check 2: .faf file exists
  console.log(chalk.gray('Checking for .faf file...'));
  const fafPath = await findFafFile();

  if (!fafPath) {
    results.push({
      status: 'error',
      message: 'No .faf file found',
      fix: 'Run: faf init, faf quick, or faf chat to create one'
    });
  } else {
    results.push({
      status: 'ok',
      message: `Found .faf at: ${fafPath}`
    });

    // Check 3: .faf file validity
    console.log(chalk.gray('Validating .faf structure...'));
    try {
      const content = await fs.readFile(fafPath, 'utf-8');
      const fafData = parseYAML(content);

      if (!fafData) {
        results.push({
          status: 'error',
          message: '.faf file is empty',
          fix: 'Run: faf init --force to regenerate'
        });
      } else {
        // Check for required fields
        const missingFields = [];
        if (!fafData.project?.name) missingFields.push('project.name');
        if (!fafData.project?.goal) missingFields.push('project.goal');

        if (missingFields.length > 0) {
          results.push({
            status: 'warning',
            message: `Missing important fields: ${missingFields.join(', ')}`,
            fix: 'Run: faf enhance or faf chat to add missing info'
          });
        } else {
          results.push({
            status: 'ok',
            message: '.faf structure is valid'
          });
        }

        // Check 4: Score
        console.log(chalk.gray('Checking AI-readiness score...'));
        const compiler = new FafCompiler();
        const scoreResult = await compiler.compile(fafPath);

        if (scoreResult.score < 30) {
          results.push({
            status: 'error',
            message: `Score too low: ${scoreResult.score}%`,
            fix: 'Run: faf enhance to improve, or faf chat to add context'
          });
        } else if (scoreResult.score < 70) {
          results.push({
            status: 'warning',
            message: `Score could be better: ${scoreResult.score}%`,
            fix: 'Target 70%+ for championship AI context'
          });
        } else {
          results.push({
            status: 'ok',
            message: `Great score: ${scoreResult.score}%`
          });
        }
      }
    } catch (error) {
      results.push({
        status: 'error',
        message: '.faf file is corrupted or invalid YAML',
        fix: 'Run: faf recover or faf init --force'
      });
    }
  }

  // Check 5: .fafignore exists
  console.log(chalk.gray('Checking .fafignore...'));
  const fafIgnorePath = path.join(process.cwd(), '.fafignore');
  if (!await fileExists(fafIgnorePath)) {
    results.push({
      status: 'warning',
      message: 'No .fafignore file',
      fix: '.fafignore helps exclude unnecessary files'
    });
  } else {
    results.push({
      status: 'ok',
      message: '.fafignore found'
    });
  }

  // Check 6: Project detection
  console.log(chalk.gray('Checking project detection...'));
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const requirementsPath = path.join(process.cwd(), 'requirements.txt');
  const goModPath = path.join(process.cwd(), 'go.mod');

  if (await fileExists(packageJsonPath)) {
    results.push({
      status: 'ok',
      message: 'Node.js/JavaScript project detected'
    });
  } else if (await fileExists(requirementsPath)) {
    results.push({
      status: 'ok',
      message: 'Python project detected'
    });
  } else if (await fileExists(goModPath)) {
    results.push({
      status: 'ok',
      message: 'Go project detected'
    });
  } else {
    results.push({
      status: 'warning',
      message: 'No standard project files detected',
      fix: 'FAF works best with package.json, requirements.txt, or go.mod'
    });
  }

  // Display Results
  console.log();
  console.log(FAF_COLORS.fafWhite('━'.repeat(50)));
  console.log();
  console.log(FAF_COLORS.fafCyan('📊 Diagnosis Results:'));
  console.log();

  let hasErrors = false;
  let hasWarnings = false;

  for (const result of results) {
    const icon = result.status === 'ok' ? '✅' :
                 result.status === 'warning' ? '⚠️ ' : '❌';

    const color = result.status === 'ok' ? chalk.green :
                  result.status === 'warning' ? chalk.yellow : chalk.red;

    console.log(color(`${icon} ${result.message}`));

    if (result.fix) {
      console.log(chalk.gray(`   💡 ${result.fix}`));
    }

    if (result.status === 'error') hasErrors = true;
    if (result.status === 'warning') hasWarnings = true;
  }

  // Summary
  console.log();
  console.log(FAF_COLORS.fafWhite('━'.repeat(50)));
  console.log();

  if (!hasErrors && !hasWarnings) {
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.trophy} Perfect health! Your FAF setup is championship-ready!`));
  } else if (!hasErrors) {
    console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.precision} Good health with minor improvements suggested.`));
  } else {
    console.log(chalk.red(`⚠️  Issues detected. Follow the fixes above.`));
  }

  console.log();
}