#!/usr/bin/env node
/**
 * BIG ORANGE 🍊 - CLI Command
 * Compare AI responses at different .faf scores
 */

import { Command } from 'commander';
import { compareContexts } from './compare';
import { pushToBigO } from './bigo-push';
import { calculateBirthScore } from './faf-generator';
import open from 'open';

const program = new Command();

program
  .name('big-orange')
  .description('🍊 Compare AI responses at different .faf context levels')
  .version('1.0.0');

program
  .command('compare')
  .description('Run side-by-side comparison')
  .argument('[project-path]', 'Path to project to analyze', process.cwd())
  .option('-l, --left <score>', 'Left window .faf score (0-100)', '0')
  .option('-r, --right <score>', 'Right window .faf score (0-100)', '99')
  .option('-p, --prompt <text>', 'Instruction to give both AI instances', 'Build me a color picker component')
  .option('--no-visualize', 'Skip opening browser to view results')
  .action(async (projectPath, options) => {
    
    console.log('\n🍊 BIG ORANGE - Context Matters\n');
    console.log('═'.repeat(60));
    
    try {
      // Parse scores
      const leftScore = parseInt(options.left);
      const rightScore = parseInt(options.right);
      
      // Validate
      if (isNaN(leftScore) || leftScore < 0 || leftScore > 100) {
        throw new Error('Left score must be 0-100');
      }
      if (isNaN(rightScore) || rightScore < 0 || rightScore > 100) {
        throw new Error('Right score must be 0-100');
      }
      
      // Analyze project (if path provided)
      if (projectPath && projectPath !== process.cwd()) {
        console.log(`\nAnalyzing project: ${projectPath}`);
        const birthScore = await calculateBirthScore(projectPath);
        console.log(`Birth score: ${birthScore}%`);
      }
      
      console.log('\n');
      
      // Run comparison
      const results = await compareContexts({
        projectPath,
        leftScore,
        rightScore,
        prompt: options.prompt
      });
      
      // Push to Big🍊
      console.log('Pushing to Big🍊...');
      const url = await pushToBigO(results);
      
      // Display results
      console.log('\n═'.repeat(60));
      console.log('\n✅ COMPARISON COMPLETE\n');
      console.log(`Session ID: ${results.sessionId}`);
      console.log(`\nResults:`);
      console.log(`  Left (${leftScore}%): ${results.leftWindow.emoji} ${results.leftWindow.timeToComplete.toFixed(1)}s`);
      console.log(`  Right (${rightScore}%): ${results.rightWindow.emoji} ${results.rightWindow.timeToComplete.toFixed(1)}s`);
      console.log(`\nDelta: ${results.delta.verdict}`);
      console.log(`\nView at: ${url}\n`);
      
      // Open browser
      if (options.visualize) {
        console.log('Opening Big🍊 in browser...\n');
        await open(url);
      }
      
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('demo')
  .description('Run demo comparison with default settings')
  .action(async () => {
    console.log('\n🍊 Running Big Orange Demo\n');
    
    const results = await compareContexts({
      leftScore: 0,
      rightScore: 99,
      prompt: 'Build me a color picker component'
    });
    
    const url = await pushToBigO(results);
    
    console.log(`\n✅ Demo complete!\n`);
    console.log(`View at: ${url}\n`);
    
    await open(url);
  });

program.parse();
