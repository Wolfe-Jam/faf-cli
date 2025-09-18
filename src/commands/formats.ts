/**
 * 😽 TURBO-CAT™ Format Discovery Command
 * List all discovered formats with intelligence scores
 */

import { TurboCat } from '../utils/turbo-cat';
import chalk from 'chalk';

export async function formatsCommand(options: any = {}) {
  const startTime = Date.now();

  console.log(chalk.cyan('😽 TURBO-CAT™ Format Discovery'));
  console.log(chalk.dim('================================\n'));

  const turboCat = new TurboCat();
  const analysis = await turboCat.discoverFormats(process.cwd());

  // Group formats by intelligence level
  const ultraHigh = analysis.discoveredFormats.filter(f => f.intelligence === 'ultra-high');
  const high = analysis.discoveredFormats.filter(f => f.intelligence === 'high');
  const medium = analysis.discoveredFormats.filter(f => f.intelligence === 'medium');
  const low = analysis.discoveredFormats.filter(f => f.intelligence === 'low');

  // Display discovered formats
  if (analysis.confirmedFormats.length === 0) {
    console.log(chalk.yellow('⚠️  No formats discovered in current directory'));
    return;
  }

  console.log(chalk.green(`✅ Discovered ${analysis.discoveredFormats.length} formats\n`));

  // Helper to format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  // Helper to format date
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  // Show formats by intelligence level
  if (ultraHigh.length > 0) {
    console.log(chalk.magenta('🏆 ULTRA-HIGH Intelligence (35 points):'));
    ultraHigh.forEach(f => {
      const status = f.confirmed ? '✅' : '❓';
      const size = formatSize(f.fileSize);
      const date = formatDate(f.lastModified);
      console.log(`  ${status} ${f.fileName} → ${f.frameworks.join(', ')}`);
      if (size || date) {
        console.log(chalk.dim(`     ${size ? `[${size}]` : ''} ${date ? `modified: ${date}` : ''}`));
      }
    });
    console.log();
  }

  if (high.length > 0) {
    console.log(chalk.cyan('⚡ HIGH Intelligence (30 points):'));
    high.forEach(f => {
      const status = f.confirmed ? '✅' : '❓';
      const size = formatSize(f.fileSize);
      const date = formatDate(f.lastModified);
      console.log(`  ${status} ${f.fileName} → ${f.frameworks.join(', ')}`);
      if (size || date) {
        console.log(chalk.dim(`     ${size ? `[${size}]` : ''} ${date ? `modified: ${date}` : ''}`));
      }
    });
    console.log();
  }

  if (medium.length > 0) {
    console.log(chalk.blue('📊 MEDIUM Intelligence (20-25 points):'));
    medium.forEach(f => {
      const status = f.confirmed ? '✅' : '❓';
      console.log(`  ${status} ${f.fileName} → ${f.frameworks.join(', ')}`);
    });
    console.log();
  }

  if (low.length > 0) {
    console.log(chalk.dim('📁 LOW Intelligence (15 points):'));
    low.forEach(f => {
      const status = f.confirmed ? '✅' : '❓';
      console.log(chalk.dim(`  ${status} ${f.fileName}`));
    });
    console.log();
  }

  // Show framework confidence
  console.log(chalk.cyan('\n🎯 Framework Confidence:'));
  const sortedFrameworks = Object.entries(analysis.frameworkConfidence)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  sortedFrameworks.forEach(([framework, confidence]) => {
    const bar = '█'.repeat(Math.min(20, Math.floor(confidence / 5)));
    console.log(`  ${framework}: ${chalk.green(bar)} ${confidence}%`);
  });

  // Calculate total file size
  const totalSize = analysis.confirmedFormats.reduce((sum, f) => sum + (f.fileSize || 0), 0);
  const oldestFile = analysis.confirmedFormats.reduce((oldest, f) => {
    if (!f.lastModified) return oldest;
    const date = new Date(f.lastModified);
    return !oldest || date < oldest ? date : oldest;
  }, null as Date | null);

  // Show statistics
  const duration = Date.now() - startTime;
  const emoji = duration < 50 ? '🏎️' : duration < 200 ? '⚡' : '🐢';

  console.log(chalk.dim('\n────────────────────────'));
  console.log(`⚡ Total Intelligence: ${chalk.green(analysis.totalIntelligenceScore + ' points')}`);
  console.log(`🏎️ Stack Signature: ${chalk.cyan(analysis.stackSignature || 'unknown')}`);
  console.log(`📁 Total Size: ${chalk.blue(formatSize(totalSize))}`);
  if (oldestFile) {
    console.log(`📅 Oldest File: ${chalk.dim(formatDate(oldestFile))}`);
  }
  console.log(`⏱️  Analysis Time: ${duration}ms ${emoji}`);

  // Export option hint
  if (options.export) {
    const exportData = {
      timestamp: new Date().toISOString(),
      project: process.cwd(),
      formats: analysis.discoveredFormats.map(f => ({
        file: f.fileName,
        type: f.formatType,
        frameworks: f.frameworks,
        intelligence: f.intelligence,
        confirmed: f.confirmed
      })),
      stackSignature: analysis.stackSignature,
      totalIntelligence: analysis.totalIntelligenceScore
    };

    console.log('\n' + chalk.dim('JSON Export:'));
    console.log(JSON.stringify(exportData, null, 2));
  } else {
    console.log('\n' + chalk.dim('💡 Tip: Use --export to get JSON output'));
  }

  console.log('\n😽 TURBO-CAT™ - We are the Format Freaks!');
}

// Standalone runner
if (require.main === module) {
  formatsCommand(process.argv.includes('--export') ? { export: true } : {})
    .catch(console.error);
}