/**
 * 🔍 faf audit - Audit Command  
 * Check .faf file freshness and completeness gaps
 */

import chalk from 'chalk';
import { promises as fs } from 'fs';
import * as YAML from 'yaml';
import { findFafFile, getFileModTime, daysSinceModified } from '../utils/file-utils';
import { calculateFafScore } from '../scoring/score-calculator';

interface AuditOptions {
  warnDays?: string;
  errorDays?: string;
}

export async function auditFafFile(file?: string, options: AuditOptions = {}) {
  try {
    const fafPath = file || await findFafFile();
    
    if (!fafPath) {
      console.log(chalk.red('❌ No .faf file found'));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    console.log(chalk.blue(`🔍 Auditing: ${fafPath}`));
    
    // Read and parse .faf file
    const content = await fs.readFile(fafPath, 'utf-8');
    const fafData = YAML.parse(content);
    
    const warnDays = parseInt(options.warnDays || '7');
    const errorDays = parseInt(options.errorDays || '30');
    
    let auditScore = 100;
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // 1. File Age Audit
    const modTime = await getFileModTime(fafPath);
    if (modTime) {
      const daysSincemod = daysSinceModified(modTime);
      
      if (daysSincemod >= errorDays) {
        issues.push(`File is ${daysSincemod} days old (critical staleness)`);
        auditScore -= 30;
      } else if (daysSincemod >= warnDays) {
        warnings.push(`File is ${daysSincemod} days old (consider refresh)`);
        auditScore -= 10;
      }
    }
    
    // 2. Generated Timestamp Audit
    if (fafData.generated) {
      try {
        const generatedDate = new Date(fafData.generated);
        const daysSinceGenerated = daysSinceModified(generatedDate);
        
        if (daysSinceGenerated >= errorDays) {
          issues.push(`Generated timestamp is ${daysSinceGenerated} days old`);
          auditScore -= 20;
        } else if (daysSinceGenerated >= warnDays) {
          warnings.push(`Generated timestamp is ${daysSinceGenerated} days old`);
          auditScore -= 5;
        }
      } catch {
        issues.push('Invalid generated timestamp format');
        auditScore -= 15;
      }
    } else {
      issues.push('Missing generated timestamp');
      auditScore -= 20;
    }
    
    // 3. Completeness Audit
    const scoreResult = calculateFafScore(fafData);
    const completenessScore = scoreResult.totalScore;
    
    if (completenessScore < 50) {
      issues.push(`Low completeness score: ${Math.round(completenessScore)}%`);
      auditScore -= 25;
    } else if (completenessScore < 70) {
      warnings.push(`Moderate completeness score: ${Math.round(completenessScore)}%`);
      auditScore -= 10;
    }
    
    // 4. Critical Sections Audit  
    const criticalSections = ['project', 'ai_instructions', 'scores'];
    criticalSections.forEach(section => {
      if (!fafData[section] || Object.keys(fafData[section]).length === 0) {
        issues.push(`Missing critical section: ${section}`);
        auditScore -= 15;
      }
    });
    
    // 5. Quality Indicators Audit
    if (!scoreResult.qualityIndicators.hasAiInstructions) {
      warnings.push('Missing AI instructions for context handoff');
      auditScore -= 5;
    }
    
    if (!scoreResult.qualityIndicators.hasHumanContext) {
      warnings.push('Missing human context (6 Ws) for deeper understanding');
      auditScore -= 10;
    }
    
    // Display Results
    auditScore = Math.max(0, Math.min(100, auditScore));
    
    if (auditScore >= 90) {
      console.log(chalk.green(`✅ Audit Score: ${auditScore}% - Excellent`));
    } else if (auditScore >= 70) {
      console.log(chalk.yellow(`⚠️  Audit Score: ${auditScore}% - Good`));
    } else {
      console.log(chalk.red(`🚨 Audit Score: ${auditScore}% - Needs Attention`));
    }
    
    // Show Issues
    if (issues.length > 0) {
      console.log(chalk.red('\n🚨 Critical Issues:'));
      issues.forEach((issue, index) => {
        console.log(chalk.red(`   ${index + 1}. ${issue}`));
      });
    }
    
    // Show Warnings
    if (warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      warnings.forEach((warning, index) => {
        console.log(chalk.yellow(`   ${index + 1}. ${warning}`));
      });
    }
    
    // Recommendations
    if (auditScore < 100) {
      console.log(chalk.blue('\n💡 Recommendations:'));
      
      if (auditScore < 70) {
        console.log(chalk.blue('   • Run "faf sync" to update with latest project changes'));
        console.log(chalk.blue('   • Run "faf score --details" to identify missing context'));
      }
      
      if (issues.some(i => i.includes('days old'))) {
        console.log(chalk.blue('   • Consider regenerating .faf file with "faf init --force"'));
      }
      
      if (completenessScore < 70) {
        console.log(chalk.blue('   • Add missing context sections to improve AI understanding'));
      }
    }
    
    // Exit with appropriate code
    if (issues.length > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.log(chalk.red('💥 Audit failed:'));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}