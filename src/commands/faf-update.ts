#!/usr/bin/env node
/**
 * FAF UPDATE - Save your current version
 *
 * Simple command: "faf update"
 * Just saves your current version as a checkpoint
 */

import { Command } from 'commander';
import { FafDNAManager } from '../engines/faf-dna';
import { colors } from '../fix-once/colors';

const program = new Command();

program
  .name('faf update')
  .description('Save your current FAF version (checkpoint your progress)')
  .action(async () => {
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

      // Approve current version
      await dnaManager.approve();

      console.log();
      console.log(colors.success('✅ VERSION SAVED'));
      console.log();

      // Show update details
      console.log(colors.info(`Version: ${dna.current.version}`));
      console.log(colors.info(`Score: ${dna.current.score}%`));
      console.log(colors.info(`Growth from birth: +${dna.current.score - dna.birthCertificate.birthWeight}%`));
      console.log();

      // Show journey
      const journey = dnaManager.getJourney('compact') as string;
      console.log(colors.highlight(`Journey: ${journey}`));
      console.log();

      // Check for milestones
      const milestones = dna.growth.milestones;
      const firstSave = milestones.find(m => m.type === 'first_save');
      if (firstSave && firstSave.version === dna.current.version) {
        console.log(colors.success(`🎆 MILESTONE: First Save achieved!`));
        console.log();
      }

      if (dna.current.score >= 85 && !milestones.find(m => m.type === 'elite')) {
        console.log(colors.success(`⭐ ACHIEVEMENT: Elite status unlocked!`));
        console.log();
      }

      console.log(colors.info('Your progress has been saved! 💾'));
      console.log(colors.secondary('You can always return to this version if needed'));
      console.log();
      console.log(colors.info('Keep improving:'));
      console.log(colors.secondary('  • faf auto - Continue growing your context'));
      console.log(colors.secondary('  • faf log  - See your complete journey'));
      console.log(colors.secondary('  • faf score - Check current status'));
      console.log();

    } catch (error: any) {
      console.error(colors.error(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);