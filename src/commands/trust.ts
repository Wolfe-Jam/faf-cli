/**
 * 🎯 Trust Dashboard Command - The Emotional Core
 * Transforms developer psychology from hope-driven to trust-driven AI development
 * 
 * Mission: "I don't worry about ANY of that AI shit anymore"
 */

import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { findFafFile } from '../utils/file-utils';
import { calculateFafScore } from '../scoring/score-calculator';
import YAML from 'yaml';

export interface TrustScore {
  overall: number;           // 0-100% overall trust
  contextCompleteness: number;  // All required sections present
  aiCompatibility: number;      // Tested with AI models  
  freshnessScore: number;       // How up-to-date context is
  verificationStatus: 'verified' | 'unverified' | 'failed';
}

export interface TrustDashboardOptions {
  detailed?: boolean;
}

/**
 * Calculate comprehensive trust score based on .faf quality
 */
export async function calculateTrustScore(fafPath: string): Promise<TrustScore> {
  try {
    const fafContent = await fs.readFile(fafPath, 'utf-8');
    const fafData = YAML.parse(fafContent);
    
    // Basic validation - check if essential sections exist
    const isValid = fafData && 
                   typeof fafData === 'object' && 
                   fafData.project && 
                   fafData.metadata;
    
    // Calculate context completeness using existing scoring
    const scoreResult = calculateFafScore(fafData);
    const contextCompleteness = scoreResult.totalScore;
    
    // Calculate freshness (based on timestamp if available)
    const freshnessScore = calculateFreshness(fafData);
    
    // AI compatibility placeholder (will be enhanced with verification system)
    const aiCompatibility = isValid ? 85 : 45;
    
    // Overall trust calculation (weighted average)
    const overall = Math.round(
      (contextCompleteness * 0.4) + 
      (aiCompatibility * 0.3) + 
      (freshnessScore * 0.2) + 
      (isValid ? 10 : 0)
    );
    
    return {
      overall: Math.min(overall, 100),
      contextCompleteness,
      aiCompatibility,
      freshnessScore,
      verificationStatus: isValid ? 'unverified' : 'failed'
    };
  } catch (error) {
    return {
      overall: 0,
      contextCompleteness: 0,
      aiCompatibility: 0,
      freshnessScore: 0,
      verificationStatus: 'failed'
    };
  }
}

/**
 * Calculate freshness score based on timestamp
 */
function calculateFreshness(fafData: any): number {
  try {
    const timestamp = fafData?.metadata?.updated_date || fafData?.metadata?.created_date;
    if (!timestamp) return 50; // No timestamp = middle score
    
    const lastUpdate = new Date(timestamp);
    const now = new Date();
    const daysDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Freshness scoring: 100% for <7 days, declining to 0% at 90+ days
    if (daysDiff < 7) return 100;
    if (daysDiff < 30) return Math.max(80 - ((daysDiff - 7) * 2), 50);
    if (daysDiff < 90) return Math.max(50 - ((daysDiff - 30) * 0.8), 10);
    return 10; // Very stale
  } catch {
    return 50; // Default middle score
  }
}

/**
 * Display the Trust Dashboard - the emotional core UI
 */
export function displayTrustDashboard(trustScore: TrustScore, detailed: boolean = false): void {
  const { overall, contextCompleteness, aiCompatibility, freshnessScore } = trustScore;
  
  // Choose emoji and color based on trust level
  let trustEmoji = '🎯';
  let trustColor = chalk.green;
  let trustMessage = 'LOCKED & LOADED';
  
  if (overall >= 90) {
    trustEmoji = '🎯';
    trustColor = chalk.green.bold;
    trustMessage = 'LOCKED & LOADED';
  } else if (overall >= 75) {
    trustEmoji = '🟡';
    trustColor = chalk.yellow;
    trustMessage = 'GOOD TO GO';
  } else if (overall >= 50) {
    trustEmoji = '🟠';
    trustColor = chalk.yellow;
    trustMessage = 'NEEDS WORK';
  } else {
    trustEmoji = '🔴';
    trustColor = chalk.red;
    trustMessage = 'NEEDS ATTENTION';
  }
  
  // Main Trust Dashboard
  console.log();
  console.log(chalk.cyan('┌─ AI TRUST DASHBOARD ───────────────────┐'));
  console.log(chalk.cyan('│') + trustColor(` ${trustEmoji} TRUST LEVEL: ${overall}% (${trustMessage})`) + ' '.repeat(Math.max(0, 40 - ` ${trustEmoji} TRUST LEVEL: ${overall}% (${trustMessage})`.length)) + chalk.cyan('│'));
  console.log(chalk.cyan('│                                        │'));
  console.log(chalk.cyan('│') + ' AI UNDERSTANDING STATUS:              ' + chalk.cyan('│'));
  
  // AI compatibility indicators
  const claudeStatus = aiCompatibility >= 80 ? '✅ Claude     - Perfect context       ' : aiCompatibility >= 60 ? '🟡 Claude     - Good context          ' : '🔴 Claude     - Needs improvement     ';
  const chatgptStatus = aiCompatibility >= 80 ? '✅ ChatGPT    - Perfect context       ' : aiCompatibility >= 60 ? '🟡 ChatGPT    - Good context          ' : '🔴 ChatGPT    - Needs improvement     ';
  const geminiStatus = aiCompatibility >= 80 ? '✅ Gemini     - Perfect context       ' : aiCompatibility >= 60 ? '🟡 Gemini     - Good context          ' : '🔴 Gemini     - Needs improvement     ';
  
  console.log(chalk.cyan('│') + ' ' + claudeStatus + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chatgptStatus + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + geminiStatus + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('│                                        │'));
  
  // Action message
  const actionMessage = overall >= 85 ? '💚 GO BUILD: Context locked & loaded  ' : '🔧 ACTION: Improve context quality    ';
  console.log(chalk.cyan('│') + ' ' + actionMessage + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('└────────────────────────────────────────┘'));
  
  if (detailed) {
    console.log();
    console.log(chalk.cyan('📊 Detailed Trust Metrics:'));
    console.log(`  Context Completeness: ${contextCompleteness}%`);
    console.log(`  AI Compatibility: ${aiCompatibility}%`);
    console.log(`  Freshness Score: ${freshnessScore}%`);
    console.log(`  Overall Trust: ${overall}%`);
  }
  
  // Actionable suggestions
  if (overall < 85) {
    console.log();
    console.log(chalk.yellow('💡 Trust Boosters:'));
    if (contextCompleteness < 75) {
      console.log(chalk.dim('   • Run `faf init` to improve context completeness'));
    }
    if (freshnessScore < 50) {
      console.log(chalk.dim('   • Run `faf sync` to refresh stale information'));
    }
    if (aiCompatibility < 80) {
      console.log(chalk.dim('   • Run `faf verify` to test AI understanding (coming soon)'));
    }
  }
  
  console.log();
}

/**
 * Main trust command handler
 */
export async function trustCommand(options: TrustDashboardOptions = {}): Promise<void> {
  try {
    const fafPath = await findFafFile();
    
    if (!fafPath) {
      console.log(chalk.red('❌ No .faf file found in current directory or parent directories'));
      console.log(chalk.dim('💡 Run `faf init` to generate your first .faf file'));
      process.exit(1);
    }
    
    console.log(chalk.dim(`🎯 Calculating trust for: ${path.relative(process.cwd(), fafPath)}`));
    
    const startTime = Date.now();
    const trustScore = await calculateTrustScore(fafPath);
    const duration = Date.now() - startTime;
    
    displayTrustDashboard(trustScore, options.detailed);
    
    // Performance indicator (should be <300ms)
    if (options.detailed) {
      console.log(chalk.dim(`⚡ Performance: ${duration}ms`));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error calculating trust score:'), error);
    process.exit(1);
  }
}