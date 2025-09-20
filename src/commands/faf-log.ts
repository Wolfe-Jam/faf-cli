#!/usr/bin/env node
/**
 * FAF LOG - Complete Context Evolution History
 * 
 * Shows every version, growth milestone, and achievement
 * The complete DNA record of your project's AI context
 */

import { Command } from 'commander';
import { FafDNAManager, displayScoreWithBirthWeight } from '../engines/faf-dna';
import { colors } from '../fix-once/colors';
import * as path from 'path';

const program = new Command();

program
  .name('faf log')
  .description('View the complete evolution history of your FAF context')
  .option('--milestones', 'Show milestones only')
  .option('--analytics', 'Show growth analytics')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const projectPath = process.cwd();
      const dnaManager = new FafDNAManager(projectPath);

      // Load DNA
      const dna = await dnaManager.load();
      
      if (!dna) {
        console.log(colors.error('❌ No FAF DNA found'));
        console.log(colors.secondary('Run "faf init" to create your project DNA'));
        process.exit(1);
      }

      if (options.json) {
        // JSON output for tooling
        console.log(JSON.stringify(dna, null, 2));
        process.exit(0);
      }

      if (options.milestones) {
        // Milestones view
        console.log();
        console.log(colors.primary('🏆 FAF MILESTONES'));
        console.log(colors.secondary('═'.repeat(50)));
        console.log();

        for (const milestone of dna.growth.milestones) {
          const growth = milestone.score - dna.birthCertificate.birthWeight;
          const growthStr = growth > 0 ? `+${growth}%` : `${growth}%`;
          
          console.log(
            `${milestone.emoji || '📍'} ${colors.highlight(milestone.label || milestone.type)}: ` +
            `${colors.success(`${milestone.score}%`)} ` +
            `${colors.secondary(`(${growthStr} from birth)`)}`
          );
          console.log(
            colors.secondary(`   ${milestone.date.toISOString().split('T')[0]} - ${milestone.version}`)
          );
          console.log();
        }

        // Show journey
        console.log(colors.secondary('═'.repeat(50)));
        const journey = dnaManager.getJourney('compact') as string;
        console.log(colors.info(`Journey: ${journey}`));
        console.log();
        
        process.exit(0);
      }

      if (options.analytics) {
        // Analytics view
        console.log();
        console.log(colors.primary('📊 FAF GROWTH ANALYTICS'));
        console.log(colors.secondary('═'.repeat(50)));
        console.log();

        const analytics = dna.growth;
        const birthWeight = dna.birthCertificate.birthWeight;
        
        console.log(colors.info('Growth Metrics:'));
        console.log(colors.secondary(`  • Birth Weight: ${birthWeight}%`));
        console.log(colors.secondary(`  • Current Score: ${dna.current.score}%`));
        console.log(colors.highlight(`  • Total Growth: +${analytics.totalGrowth}%`));
        console.log();
        
        console.log(colors.info('Time Metrics:'));
        console.log(colors.secondary(`  • Days Active: ${analytics.daysActive} days`));
        console.log(colors.secondary(`  • Daily Growth Rate: ${analytics.averageDailyGrowth.toFixed(1)}% per day`));
        console.log();
        
        console.log(colors.info('Records:'));
        console.log(colors.secondary(`  • Best Day: +${analytics.bestDay.growth}% (${analytics.bestDay.date.toISOString().split('T')[0]})`));
        console.log(colors.secondary(`  • Best Week: +${analytics.bestWeek.growth}% (starting ${analytics.bestWeek.start.toISOString().split('T')[0]})`));
        console.log();
        
        console.log(colors.info('Achievements:'));
        const achievements = [
          { name: 'First Save', unlocked: !!dna.growth.milestones.find(m => m.type === 'first_save') },
          { name: 'Doubled', unlocked: !!dna.growth.milestones.find(m => m.type === 'doubled') },
          { name: 'Championship (70%)', unlocked: dna.current.score >= 70 },
          { name: 'Elite (85%)', unlocked: dna.current.score >= 85 },
          { name: 'Perfect (100%)', unlocked: dna.current.score >= 100 }
        ];
        
        achievements.forEach(a => {
          const status = a.unlocked ? colors.success('✅') : colors.secondary('🔒');
          console.log(`  ${status} ${a.name}`);
        });
        
        console.log();
        process.exit(0);
      }

      // Default: Full log view
      console.log();
      console.log(colors.primary('📜 FAF EVOLUTION LOG'));
      console.log(colors.secondary('═'.repeat(60)));
      console.log();
      
      // Birth certificate header
      console.log(colors.highlight('BIRTH CERTIFICATE'));
      console.log(colors.secondary(`Certificate: ${dna.birthCertificate.certificate}`));
      console.log(colors.secondary(`Born: ${dna.birthCertificate.born.toISOString()}`));
      console.log(colors.secondary(`Birth Weight: ${dna.birthCertificate.birthWeight}% (from ${dna.birthCertificate.birthWeightSource})`));
      console.log(colors.secondary(`Authenticated: ${dna.birthCertificate.authenticated ? 'Yes' : 'No'}`));
      console.log();
      console.log(colors.secondary('─'.repeat(60)));
      console.log();
      
      // Version history
      console.log(colors.highlight('VERSION HISTORY'));
      console.log();
      
      const log = dnaManager.getLog();
      log.forEach(entry => {
        console.log(entry);
      });
      
      console.log();
      console.log(colors.secondary('─'.repeat(60)));
      console.log();
      
      // Current status
      console.log(colors.highlight('CURRENT STATUS'));
      const birthWeightInfo = dnaManager.getBirthWeightDisplay();
      displayScoreWithBirthWeight(
        birthWeightInfo.current,
        birthWeightInfo.birthWeight,
        birthWeightInfo.birthDate,
        { showGrowth: true, showJourney: true }
      );
      
      console.log();
      console.log(colors.info('Tips:'));
      console.log(colors.secondary('  • faf log --milestones  - Show milestones only'));
      console.log(colors.secondary('  • faf log --analytics  - Show growth analytics'));
      console.log(colors.secondary('  • faf log --json       - Export as JSON'));
      console.log();

    } catch (error: any) {
      console.error(colors.error(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);