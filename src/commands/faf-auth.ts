#!/usr/bin/env node
/**
 * FAF AUTH - Birth Certificate Authentication
 * 
 * Creates immutable record of project origin
 * Every authenticated .faf can be verified
 * Like a blockchain of context evolution
 */

import { Command } from '../fix-once/commander';
import * as path from 'path';
import { FafDNAManager } from '../engines/faf-dna';
import { colors } from '../fix-once/colors';

const program = new Command();

program
  .name('faf auth')
  .description('Authenticate your FAF project with a birth certificate')
  .option('--verify <certificate>', 'Verify an existing certificate')
  .option('--show', 'Show current authentication status')
  .action(async (options) => {
    try {
      const projectPath = process.cwd();
      const dnaManager = new FafDNAManager(projectPath);

      // Load existing DNA or error
      const dna = await dnaManager.load();

      if (options.verify) {
        // Verify mode
        if (!dna) {
          console.log(colors.error('❌ No FAF DNA found to verify'));
          process.exit(1);
        }

        const isValid = dna.birthCertificate.certificate === options.verify;
        if (isValid) {
          console.log(colors.success('✅ Certificate VALID'));
          console.log(colors.info(`Project: ${path.basename(projectPath)}`));
          console.log(colors.info(`Born: ${dna.birthCertificate.born.toISOString().split('T')[0]}`));
          console.log(colors.info(`Birth DNA: ${dna.birthCertificate.birthDNA}%`));
          console.log(colors.info(`Authenticated: ${dna.birthCertificate.authenticated ? 'Yes' : 'No'}`));
        } else {
          console.log(colors.error('❌ Certificate INVALID'));
        }
        process.exit(isValid ? 0 : 1);
      }

      if (options.show) {
        // Show status mode
        if (!dna) {
          console.log(colors.warning('🔓 No authentication found'));
          console.log(colors.secondary('Run "faf init" first, then "faf auth" to authenticate'));
          process.exit(0);
        }

        console.log();
        console.log(colors.primary('🎫 FAF BIRTH CERTIFICATE'));
        console.log(colors.secondary('═'.repeat(40)));
        console.log();
        console.log(colors.info(`Certificate: ${dna.birthCertificate.certificate}`));
        console.log(colors.info(`Born: ${dna.birthCertificate.born.toISOString()}`));
        console.log(colors.info(`Birth DNA: ${dna.birthCertificate.birthDNA}%`));
        console.log(colors.info(`Source: ${dna.birthCertificate.birthDNASource}`));
        console.log();
        
        if (dna.birthCertificate.authenticated) {
          console.log(colors.success(`✅ AUTHENTICATED`));
          if (dna.birthCertificate.authDate) {
            console.log(colors.secondary(`   Auth Date: ${dna.birthCertificate.authDate.toISOString()}`));
          }
        } else {
          console.log(colors.warning(`⚠️  NOT AUTHENTICATED`));
          console.log(colors.secondary(`   Run "faf auth" to authenticate`));
        }
        
        console.log();
        console.log(colors.secondary('═'.repeat(40)));
        console.log();
        
        // Show journey
        const journey = dnaManager.getJourney('compact') as string;
        if (journey) {
          console.log(colors.info(`Journey: ${journey}`));
        }
        
        process.exit(0);
      }

      // Authenticate mode
      if (!dna) {
        console.log(colors.error('❌ No FAF DNA found to authenticate'));
        console.log(colors.secondary('Run "faf init" first to create your project DNA'));
        process.exit(1);
      }

      if (dna.birthCertificate.authenticated) {
        console.log(colors.warning('⚠️  Already authenticated'));
        console.log(colors.info(`Certificate: ${dna.birthCertificate.certificate}`));
        console.log(colors.secondary(`Auth Date: ${dna.birthCertificate.authDate?.toISOString()}`));
        process.exit(0);
      }

      // Perform authentication
      console.log();
      console.log(colors.primary('🔏 Authenticating FAF DNA...'));
      console.log();

      const certificate = await dnaManager.authenticate();

      // Display authentication success
      console.log(colors.success('✅ AUTHENTICATION COMPLETE'));
      console.log();
      console.log(colors.primary('🎫 BIRTH CERTIFICATE ISSUED'));
      console.log(colors.secondary('═'.repeat(50)));
      console.log();
      console.log(colors.highlight(`Certificate: ${certificate}`));
      console.log();
      console.log(colors.info('Project DNA:'));
      console.log(colors.secondary(`  Born: ${dna.birthCertificate.born.toISOString()}`));
      console.log(colors.secondary(`  Birth DNA: ${dna.birthCertificate.birthDNA}%`));
      console.log(colors.secondary(`  Project Hash: ${dna.birthCertificate.projectDNA}`));
      console.log();
      console.log(colors.secondary('═'.repeat(50)));
      console.log();
      console.log(colors.success('🔒 Your FAF context is now authenticated'));
      console.log(colors.secondary('This certificate proves the origin and evolution of your AI context'));
      console.log();
      console.log(colors.info('Next steps:'));
      console.log(colors.secondary('  • faf auto    - Grow your context'));
      console.log(colors.secondary('  • faf approve - Mark a version as approved'));
      console.log(colors.secondary('  • faf log     - View your context evolution'));
      console.log();

    } catch (error: any) {
      console.error(colors.error(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);