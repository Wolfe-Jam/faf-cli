#!/usr/bin/env ts-node
/**
 * FAF Integration Quality Evaluation
 *
 * Evaluates tools for FAF integration based on:
 * - Developer adoption (weekly downloads)
 * - Security & reliability
 * - Active maintenance
 * - MCP server availability
 * - .faf context contribution (slots filled)
 *
 * Championship Standard: 85% minimum quality score required
 */

import https from 'https';
import { promisify } from 'util';

const get = promisify(https.get);

interface IntegrationQuality {
  integration: string;
  weeklyDownloads: number;
  lastPublish: string;
  hasVulnerabilities: boolean;
  qualityScore: number;
  mcpServers: string[];
  contextSlotsFilled: number;
  totalScore: number;
  tier: 'trophy' | 'gold' | 'silver' | 'bronze' | 'yellow' | 'red';
  approved: boolean;
  reasoning: string;
}

// Minimum quality thresholds for FAF integration approval
const INTEGRATION_REQUIREMENTS = {
  weeklyDownloads: 100_000,      // 100k+ shows real developer adoption
  qualityScore: 85,              // Bronze tier minimum (Championship standard)
  maxDaysSincePublish: 90,       // Active maintenance within 3 months
  minContextSlots: 2,            // Must contribute to 2+ .faf context fields
};

async function fetchJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getWeeklyDownloads(pkg: string): Promise<number> {
  try {
    const url = `https://api.npmjs.org/downloads/point/last-week/${pkg}`;
    const data = await fetchJSON(url);
    return data.downloads || 0;
  } catch {
    return 0;
  }
}

async function getPackageInfo(pkg: string): Promise<any> {
  const url = `https://registry.npmjs.com/${pkg}`;
  return await fetchJSON(url);
}

function getDaysSincePublish(publishDate: string): number {
  const now = new Date();
  const published = new Date(publishDate);
  const diffTime = Math.abs(now.getTime() - published.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function calculateMaintenanceScore(info: any): number {
  const latestVersion = info['dist-tags']?.latest;
  if (!latestVersion) return 0;

  const publishDate = info.time?.[latestVersion];
  if (!publishDate) return 0;

  const daysSince = getDaysSincePublish(publishDate);

  // Scoring:
  // < 30 days = 100
  // 30-60 days = 90
  // 60-90 days = 85
  // > 90 days = declining score
  if (daysSince < 30) return 100;
  if (daysSince < 60) return 90;
  if (daysSince < 90) return 85;
  return Math.max(0, 85 - (daysSince - 90));
}

// MCP servers available for each integration
const INTEGRATION_MCP_SERVERS: Record<string, string[]> = {
  'react': ['@react-mcp/server', 'react-mcp-tools'],
  'next': ['@vercel/mcp-server', '@nextjs/mcp-tools'],
  'svelte': ['@sveltejs/mcp', 'svelte-kit-mcp'],
  'vue': ['@vue/mcp-server', 'vue-mcp-tools'],
  'vite': ['vite-mcp-server'],
  'typescript': ['typescript-language-server', '@typescript/mcp-tools'],
  'n8n': ['n8n-mcp', 'n8n-nodes-mcp'],
  '@supabase/supabase-js': ['@supabase/mcp-server-supabase'],
  'prisma': ['@prisma/mcp-server'],
  '@vercel/node': ['@vercel/mcp-server'],
  'astro': ['@astro/mcp-server'],
  'zod': ['zod-mcp-validator'],
  'axios': ['http-mcp-tools'],
};

// .faf context slots populated by each integration
const CONTEXT_CONTRIBUTION: Record<string, string[]> = {
  'react': ['frontend', 'ui_library', 'state_management'],
  'next': ['frontend', 'backend', 'runtime', 'hosting', 'api_type'],
  'svelte': ['frontend', 'ui_library', 'state_management'],
  'vue': ['frontend', 'ui_library', 'state_management'],
  'vite': ['build', 'package_manager'],
  'typescript': ['main_language', 'type_system'],
  'n8n': ['automation_platform', 'workflow_engine', 'integration_layer', 'api_orchestration'],
  '@supabase/supabase-js': ['database', 'backend', 'api_type'],
  'prisma': ['database', 'orm'],
  '@vercel/node': ['runtime', 'hosting'],
  'astro': ['frontend', 'build', 'hosting'],
  'zod': ['validation', 'type_system'],
  'axios': ['http_client', 'api_communication'],
  'dotenv': ['configuration', 'environment'],
  'chalk': ['terminal_ui', 'output_formatting'],
  'yargs': ['cli_framework', 'argument_parsing'],
};

function getTier(score: number): IntegrationQuality['tier'] {
  if (score >= 99) return 'trophy';
  if (score >= 95) return 'gold';
  if (score >= 90) return 'silver';
  if (score >= 85) return 'bronze';
  if (score >= 70) return 'yellow';
  return 'red';
}

function getEmoji(tier: IntegrationQuality['tier']): string {
  const emojis = {
    trophy: '🏆',
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
    yellow: '🟡',
    red: '🔴'
  };
  return emojis[tier];
}

async function evaluateIntegration(pkg: string): Promise<IntegrationQuality> {
  console.log(`\n🔗 Evaluating Integration: ${pkg}...`);

  const weeklyDownloads = await getWeeklyDownloads(pkg);
  const info = await getPackageInfo(pkg);
  const maintainedScore = calculateMaintenanceScore(info);
  const mcpServers = INTEGRATION_MCP_SERVERS[pkg] || [];
  const contextSlotsFilled = CONTEXT_CONTRIBUTION[pkg]?.length || 0;

  // Calculate total score
  let totalScore = 0;
  const scores = {
    downloads: 0,
    maintenance: 0,
    mcp: 0,
    slots: 0
  };

  // Downloads (30 points max)
  if (weeklyDownloads >= 50_000_000) scores.downloads = 30; // 50M+
  else if (weeklyDownloads >= 10_000_000) scores.downloads = 28; // 10M+
  else if (weeklyDownloads >= 1_000_000) scores.downloads = 25; // 1M+
  else if (weeklyDownloads >= 100_000) scores.downloads = 20; // 100k+
  else scores.downloads = Math.floor((weeklyDownloads / 100_000) * 20);

  // Maintenance (30 points max)
  scores.maintenance = Math.floor(maintainedScore * 0.3);

  // MCP availability (20 points max)
  scores.mcp = mcpServers.length > 0 ? 20 : 0;

  // Context contribution (20 points max)
  scores.slots = Math.min(20, contextSlotsFilled * 5);

  totalScore = scores.downloads + scores.maintenance + scores.mcp + scores.slots;

  const tier = getTier(totalScore);
  const approved = totalScore >= INTEGRATION_REQUIREMENTS.qualityScore;

  const latestVersion = info['dist-tags']?.latest;
  const publishDate = info.time?.[latestVersion] || 'unknown';

  const reasoning = [
    `Adoption: ${weeklyDownloads.toLocaleString()} developers/week (${scores.downloads}/30 pts)`,
    `Quality: ${maintainedScore}% maintenance score (${scores.maintenance}/30 pts)`,
    `MCP Integration: ${mcpServers.length} server(s) available (${scores.mcp}/20 pts)`,
    `Context: Fills ${contextSlotsFilled} .faf slots (${scores.slots}/20 pts)`,
    `Updated: ${publishDate.split('T')[0]}`
  ].join('\n  ');

  console.log(`  ${getEmoji(tier)} Quality Score: ${totalScore}/100 (${tier})`);
  console.log(`  ${approved ? '✅ APPROVED' : '❌ NOT APPROVED'}`);

  return {
    integration: pkg,
    weeklyDownloads,
    lastPublish: publishDate,
    hasVulnerabilities: false, // TODO: Check npm audit
    qualityScore: maintainedScore,
    mcpServers,
    contextSlotsFilled,
    totalScore,
    tier,
    approved,
    reasoning
  };
}

async function main() {
  console.log('🔗 FAF Integration Quality Assessment\n');
  console.log('Championship Standard: 85+ quality score required\n');
  console.log('='.repeat(60));

  const candidates = [
    // Phase 1: Core tooling
    'zod',
    'axios',
    'dotenv',
    'chalk',
    'yargs',

    // Phase 2: Top frameworks
    'react',
    'next',
    'svelte',
    'vue',
    'vite',

    // Phase 3: Full coverage
    'typescript',
    '@supabase/supabase-js',
    'prisma',
    '@vercel/node',
    'astro'
  ];

  const evaluations: IntegrationQuality[] = [];

  for (const pkg of candidates) {
    try {
      const evaluation = await evaluateIntegration(pkg);
      evaluations.push(evaluation);
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
    } catch (error) {
      console.error(`❌ Failed to evaluate ${pkg}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 INTEGRATION APPROVAL SUMMARY\n');

  const approved = evaluations.filter(e => e.approved);
  const needsWork = evaluations.filter(e => !e.approved);

  console.log(`✅ APPROVED INTEGRATIONS: ${approved.length}/${evaluations.length}`);
  approved.forEach(e => {
    console.log(`   ${getEmoji(e.tier)} ${e.integration} - ${e.totalScore}/100 quality score`);
  });

  console.log(`\n⚠️  NEEDS IMPROVEMENT: ${needsWork.length}/${evaluations.length}`);
  needsWork.forEach(e => {
    console.log(`   ${getEmoji(e.tier)} ${e.integration} - ${e.totalScore}/100 (below 85% threshold)`);
  });

  console.log('\n🔗 RECOMMENDED INTEGRATIONS:\n');
  console.log('Add these to package.json to enable smart detection:\n');
  console.log('"dependencies": {');
  approved.forEach((e, i) => {
    const comma = i < approved.length - 1 ? ',' : '';
    console.log(`  "${e.integration}": "latest"${comma}  // ${e.contextSlotsFilled} context slots`);
  });
  console.log('}');

  console.log('\n🏁 Integration assessment complete!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { evaluateIntegration, type IntegrationQuality };
