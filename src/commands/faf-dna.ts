#!/usr/bin/env node
/**
 * FAF DNA - Quick Journey Display
 * 
 * Shows: "22% → 85% → 99% ← 92%" 
 * The complete story in one line
 */

import { Command } from 'commander';
import { FafDNAManager } from '../engines/faf-dna';
import { colors } from '../fix-once/colors';
import * as path from 'path';

const program = new Command();

program
  .name('faf dna')
  .description('🧬 Show your FAF DNA journey at a glance')
  .action(async () => {
    try {
      const projectPath = process.cwd();
      const dnaManager = new FafDNAManager(projectPath);

      // Load DNA
      const dna = await dnaManager.load();
      
      if (!dna) {
        console.log(colors.error('❌ No FAF DNA found'));
        console.log(colors.secondary('Run "faf init" to start your journey'));
        process.exit(1);
      }

      // Get the journey
      const journey = dnaManager.getJourney('compact') as string;
      
      console.log();
      // BIG DISPLAY - This is the hero moment
      console.log(colors.highlight('🧬 YOUR FAF DNA'));
      console.log();
      console.log(colors.championship(`   ${journey}`));
      console.log();
      
      // Quick summary
      const birthWeight = dna.birthCertificate.birthWeight;
      const current = dna.current.score;
      const growth = current - birthWeight;
      const daysActive = Math.floor((Date.now() - dna.birthCertificate.born.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(colors.secondary('═'.repeat(50)));
      console.log();
      
      // Stats
      console.log(colors.info('📊 QUICK STATS'));
      console.log(colors.secondary(`   Born: ${dna.birthCertificate.born.toISOString().split('T')[0]}`));
      console.log(colors.secondary(`   Days Active: ${daysActive}`));
      console.log(colors.secondary(`   Total Growth: +${growth}%`));
      
      // Authentication status
      if (dna.birthCertificate.authenticated) {
        console.log(colors.success(`   ✅ Authenticated: ${dna.birthCertificate.certificate}`));
      } else {
        console.log(colors.warning(`   ⚠️  Not authenticated (run 'faf auth')`));
      }
      
      console.log();
      
      // Milestones
      const milestones = dna.growth.milestones;
      const achievements = [];
      
      if (milestones.find(m => m.type === 'first_save')) {
        achievements.push('💾 First Save');
      }
      if (milestones.find(m => m.type === 'doubled')) {
        achievements.push('2️⃣ Doubled');
      }
      if (milestones.find(m => m.type === 'championship')) {
        achievements.push('🏆 Championship');
      }
      if (milestones.find(m => m.type === 'elite')) {
        achievements.push('⭐ Elite');
      }
      if (milestones.find(m => m.type === 'perfect')) {
        achievements.push('💎 Perfect');
      }
      
      if (achievements.length > 0) {
        console.log(colors.info('🏅 ACHIEVEMENTS'));
        console.log(colors.secondary(`   ${achievements.join(' · ')}`));
        console.log();
      }
      
      // Peak vs Current
      const peak = milestones.find(m => m.type === 'peak');
      if (peak && peak.score > current) {
        console.log(colors.warning(`   ⚠️  ${peak.score - current}% below your peak`));
        console.log(colors.secondary(`   (Peak: ${peak.score}% on ${peak.date.toISOString().split('T')[0]})`));
        console.log();
      } else if (current === 100) {
        console.log(colors.success(`   💎 PERFECT SCORE ACHIEVED!`));
        console.log();
      } else if (current >= 85) {
        console.log(colors.success(`   ⭐ Elite performance level`));
        console.log();
      }
      
      console.log(colors.secondary('═'.repeat(50)));
      console.log();
      
      // Links to more info
      console.log(colors.info('📚 LEARN MORE'));
      console.log(colors.secondary('   • faf log           - Complete history'));
      console.log(colors.secondary('   • faf log --milestones - Key moments'));
      console.log(colors.secondary('   • faf log --analytics  - Growth metrics'));
      console.log(colors.secondary('   • faf score         - Current details'));
      console.log(colors.secondary('   • faf auth          - Authenticate DNA'));
      console.log();
      
      // Motivational message based on journey
      if (growth > 70) {
        console.log(colors.success('🚀 Incredible journey! You\'ve transformed your AI context!'));
      } else if (growth > 50) {
        console.log(colors.success('📈 Great progress! Your context is evolving beautifully.'));
      } else if (growth > 30) {
        console.log(colors.info('🌱 Good growth! Keep improving with "faf auto".'));
      } else if (growth > 0) {
        console.log(colors.info('🌱 Your journey has begun. Every step counts!'));
      } else {
        console.log(colors.info('🐣 Just born! Your growth story starts now.'));
      }
      console.log();

    } catch (error: any) {
      console.error(colors.error(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);