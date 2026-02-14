#!/usr/bin/env node
/**
 * Test Showcase Runner (5 repos)
 * Tests the showcase runner on a small sample before running full 70 repos
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';

interface ShowcaseData {
  title: string;
  description: string;
  updated: string;
  categories: Array<{
    name: string;
    repos: string[];
  }>;
}

interface RepoResult {
  repo: string;
  owner: string;
  name: string;
  category: string;
  currentScore: number;
  newScore: number;
  improvement: number;
  tier: string;
  stack: {
    frontend?: string;
    backend?: string;
    runtime?: string;
    build?: string;
    database?: string;
    hosting?: string;
  };
  projectType: string;
  mainLanguage: string;
  description: string;
  status: 'success' | 'failed' | 'rate-limited';
  error?: string;
}

interface ShowcaseResults {
  generated: string;
  totalRepos: number;
  successCount: number;
  failedCount: number;
  avgImprovement: number;
  categories: Array<{
    name: string;
    repos: RepoResult[];
  }>;
}

function parseFafGitOutput(output: string): { currentScore: number; newScore: number; improvement: number; tier: string } | null {
  // Strip ANSI color codes first
  // eslint-disable-next-line no-control-regex
  const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');

  // v4.3.0 format (after stripping colors):
  // Current:  No .faf file ⚠️
  // With FAF: 100% 🏆 Trophy

  const currentMatch = cleanOutput.match(/Current:\s+No \.faf file/);
  const withFafMatch = cleanOutput.match(/With FAF:\s+(\d+)%\s+([🏆🥇🥈🥉🟢🟡🔴🤍⚠️]+)\s*(\w+)?/);

  if (!withFafMatch) {
    return null;
  }

  const currentScore = currentMatch ? 0 : 0; // Always 0 for "No .faf file"
  const newScore = parseInt(withFafMatch[1]);
  const tier = withFafMatch[3] || 'Unknown';
  const improvement = newScore - currentScore;

  return {
    currentScore,
    newScore,
    improvement,
    tier
  };
}

function extractStackFromFaf(fafPath: string): any {
  try {
    const content = readFileSync(fafPath, 'utf-8');
    const parsed = yaml.parse(content);

    return {
      stack: {
        frontend: parsed.stack?.frontend !== 'slotignored' ? parsed.stack?.frontend : undefined,
        backend: parsed.stack?.backend !== 'slotignored' ? parsed.stack?.backend : undefined,
        runtime: parsed.stack?.runtime !== 'slotignored' ? parsed.stack?.runtime : undefined,
        build: parsed.stack?.build !== 'slotignored' ? parsed.stack?.build : undefined,
        database: parsed.stack?.database !== 'slotignored' ? parsed.stack?.database : undefined,
        hosting: parsed.stack?.hosting !== 'slotignored' ? parsed.stack?.hosting : undefined,
      },
      projectType: parsed.project?.type || 'unknown',
      mainLanguage: parsed.project?.main_language || 'unknown',
      description: parsed.project?.goal || parsed.metadata?.description || ''
    };
  } catch (e) {
    return {
      stack: {},
      projectType: 'unknown',
      mainLanguage: 'unknown',
      description: ''
    };
  }
}

async function runTestShowcase() {
  console.log('🏎️  FAF Test Showcase Runner (5 repos)\n');

  // Read test showcase data
  const showcaseData: ShowcaseData = JSON.parse(
    readFileSync(join(__dirname, 'test-showcase.json'), 'utf-8')
  );

  const results: ShowcaseResults = {
    generated: new Date().toISOString(),
    totalRepos: 0,
    successCount: 0,
    failedCount: 0,
    avgImprovement: 0,
    categories: []
  };

  let totalImprovement = 0;

  for (const category of showcaseData.categories) {
    console.log(`\n📁 Category: ${category.name}`);
    console.log(`   Testing ${category.repos.length} repos...\n`);

    const categoryResults: RepoResult[] = [];

    for (const repo of category.repos) {
      results.totalRepos++;
      const [owner, name] = repo.split('/');

      process.stdout.write(`   ⚡ ${repo}... `);

      try {
        // Run faf git (use local build to avoid bin name collision with bun-sticky)
        const output = execSync(
          `node ${join(__dirname, '../dist/cli.js')} git ${repo}`,
          {
            encoding: 'utf-8',
            timeout: 30000,
            stdio: 'pipe'
          }
        );

        // Parse output
        const scores = parseFafGitOutput(output);

        if (!scores) {
          // Debug: save output to file
          const debugPath = join(__dirname, `debug-${name}.txt`);
          writeFileSync(debugPath, output);
          throw new Error(`Failed to parse output (saved to ${debugPath})`);
        }

        // Extract stack from generated .faf file
        const fafPath = join(process.cwd(), `${name}.faf`);
        const fafData = extractStackFromFaf(fafPath);

        const result: RepoResult = {
          repo,
          owner,
          name,
          category: category.name,
          currentScore: scores.currentScore,
          newScore: scores.newScore,
          improvement: scores.improvement,
          tier: scores.tier,
          stack: fafData.stack,
          projectType: fafData.projectType,
          mainLanguage: fafData.mainLanguage,
          description: fafData.description,
          status: 'success'
        };

        categoryResults.push(result);
        results.successCount++;
        totalImprovement += scores.improvement;

        console.log(`✅ ${scores.currentScore}% → ${scores.newScore}% (+${scores.improvement})`);

      } catch (error: any) {
        results.failedCount++;

        const result: RepoResult = {
          repo,
          owner,
          name,
          category: category.name,
          currentScore: 0,
          newScore: 0,
          improvement: 0,
          tier: 'Failed',
          stack: {},
          projectType: 'unknown',
          mainLanguage: 'unknown',
          description: '',
          status: error.message?.includes('rate limit') ? 'rate-limited' : 'failed',
          error: error.message
        };

        categoryResults.push(result);
        console.log(`❌ ${error.message.split('\n')[0]}`);
      }

      // Rate limit protection (1 second between requests)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    results.categories.push({
      name: category.name,
      repos: categoryResults
    });
  }

  // Calculate average improvement
  results.avgImprovement = results.successCount > 0
    ? Math.round(totalImprovement / results.successCount)
    : 0;

  // Save results
  const outputPath = join(__dirname, 'test-showcase-results.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n\n🏆 Test Showcase Complete!\n`);
  console.log(`   Total Repos: ${results.totalRepos}`);
  console.log(`   ✅ Success: ${results.successCount}`);
  console.log(`   ❌ Failed: ${results.failedCount}`);
  console.log(`   📈 Avg Improvement: +${results.avgImprovement} points\n`);
  console.log(`📄 Results saved to: ${outputPath}\n`);
}

runTestShowcase().catch(console.error);
