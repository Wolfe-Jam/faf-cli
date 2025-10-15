#!/usr/bin/env ts-node
/**
 * Test Integration Detection System
 *
 * Tests FAF Family detectors on real projects
 */

import { integrationRegistry } from '../src/family/registry';
import { resolve } from 'path';

async function testProject(projectPath: string, projectName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Testing: ${projectName}`);
  console.log(`📁 Path: ${projectPath}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Detect all integrations
    const detected = await integrationRegistry.detectAll(projectPath);

    if (detected.length === 0) {
      console.log('❌ No integrations detected\n');
      return;
    }

    console.log(`✅ Detected ${detected.length} integration(s):\n`);

    // Show each detected integration
    detected.forEach((integration, index) => {
      const emoji = {
        trophy: '🏆',
        gold: '🥇',
        silver: '🥈',
        bronze: '🥉',
      }[integration.tier] || '⚪';

      console.log(`${index + 1}. ${emoji} ${integration.displayName}`);
      console.log(`   Tier: ${integration.tier} (${integration.qualityScore} quality score)`);
      console.log(`   Weekly adoption: ${integration.weeklyAdoption.toLocaleString()} developers`);
      console.log(`   MCP servers: ${integration.mcpServers.join(', ')}`);
      console.log(`   Context slots: ${integration.contextContribution.join(', ')}`);
      console.log('');
    });

    // Generate combined context
    console.log('📊 Generating combined .faf context...\n');
    const context = await integrationRegistry.generateContext(projectPath);

    console.log('Generated Context:');
    console.log(JSON.stringify(context, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Error testing project:', error);
  }
}

async function main() {
  console.log('🏆 FAF Integration Detection System - Test Suite\n');
  console.log('Championship Standard: Auto-detect stacks and generate optimized .faf context\n');

  const testProjects = [
    {
      name: 'faf-cli (this project)',
      path: resolve(__dirname, '..'),
    },
    {
      name: 'claude-faf-mcp',
      path: resolve(__dirname, '../../claude-faf-mcp'),
    },
  ];

  for (const project of testProjects) {
    await testProject(project.path, project.name);
  }

  // Show registry stats
  console.log(`\n${'='.repeat(60)}`);
  console.log('📈 Integration Registry Statistics');
  console.log(`${'='.repeat(60)}\n`);

  const stats = integrationRegistry.getStats();
  console.log(`Total integrations: ${stats.total}`);
  console.log(`Total weekly adoption: ${stats.totalWeeklyAdoption.toLocaleString()} developers`);
  console.log('\nBy tier:');
  Object.entries(stats.byTier).forEach(([tier, count]) => {
    console.log(`  ${tier}: ${count}`);
  });

  console.log('\n🏁 Test suite complete!');
}

main().catch(console.error);
