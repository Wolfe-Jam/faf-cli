/**
 * 🛂 FAF TSA - Dependency Intelligence
 * Context enrichment through dependency analysis
 *
 * "We're INSPECTORS, not trash collectors"
 * We ignore the trash and focus on the important stuff
 * Understanding your project's story through its dependencies
 * NEVER delete - just provide intelligence about what matters
 */

import * as fs from 'fs';
import * as path from 'path';
import { findSourceFiles } from '../utils/native-file-finder';
import { execSync } from 'child_process';

export interface DependencyInspection {
  package: string;
  version: string;
  status: 'CORE' | 'ACTIVE' | 'DORMANT' | 'LEGACY';
  usage: {
    importCount: number;
    fileCount: number;
    locations: string[];
  };
  intelligence: {
    category?: string; // What type of package
    purpose?: string; // What it's likely used for
    alternatives?: string[];
    bloatScore?: number; // Relative weight
    pattern?: string; // Migration, duplication, etc
  };
  insight: string; // Context insight, not removal advice
}

export interface TSAReport {
  totalPackages: number;
  core: number; // Heavily used
  active: number; // Moderately used
  dormant: number; // Barely used
  legacy: number; // Not used but might be needed
  patterns: Record<string, string[]>; // Detected patterns
  contextScore: number; // How well we understand the project
  insights: string[]; // Project insights from dependencies
  inspections: DependencyInspection[];
}

export class DependencyTSA {
  private projectRoot: string;
  private packageJson: any;
  private inspectionResults: DependencyInspection[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    const packageJsonPath = path.join(projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('No package.json found - nothing to inspect!');
    }

    this.packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  }

  /**
   * 🔍 Full TSA Inspection
   */
  async inspect(): Promise<TSAReport> {
    console.log('🛂 FAF TSA - Beginning dependency inspection...');

    const allDeps = {
      ...this.packageJson.dependencies || {},
      ...this.packageJson.devDependencies || {}
    };

    // Phase 1: Scan each dependency
    for (const [pkg, version] of Object.entries(allDeps)) {
      await this.inspectPackage(pkg, version as string);
    }

    // Phase 2: Detect duplicates and patterns
    const patterns = this.detectDuplicates();

    // Phase 3: Calculate scores
    const report = this.generateReport(patterns);

    return report;
  }

  /**
   * 🔎 Inspect individual package
   */
  private async inspectPackage(pkg: string, version: string): Promise<void> {
    console.log(`  Inspecting ${pkg}...`);

    const usage = await this.analyzeUsage(pkg);
    const intelligence = await this.gatherIntelligence(pkg);

    // Determine status based on inspection
    let status: 'CORE' | 'ACTIVE' | 'DORMANT' | 'LEGACY' = 'ACTIVE';

    // TSA Context Engine - Understanding, not judging
    let insight = '';

    if (usage.importCount === 0) {
      status = 'DORMANT';
      insight = `Not imported but configured - possibly for tooling/scripts`;
    } else if (usage.importCount > 10) {
      status = 'CORE';
      insight = `Core dependency - used ${usage.importCount} times in ${usage.fileCount} files`;
    } else if (usage.importCount === 1 && usage.fileCount === 1) {
      status = 'ACTIVE';
      insight = `Single-purpose - used in ${usage.locations[0] || 'one location'}`;
    } else if (this.isDuplicate(pkg)) {
      status = 'ACTIVE';
      const category = this.getPackageCategory(pkg);
      insight = `Part of ${category} pattern - multiple solutions present`;
    } else {
      status = 'ACTIVE';
      insight = `Active in ${usage.fileCount} files - ${this.getUsagePattern(usage)}`;
    }

    this.inspectionResults.push({
      package: pkg,
      version,
      status,
      usage,
      intelligence,
      insight
    });
  }

  /**
   * 📊 Analyze actual usage in codebase
   */
  private async analyzeUsage(pkg: string): Promise<DependencyInspection['usage']> {
    // Use native file finder instead of glob - DC VICTORY!
    const files = await findSourceFiles(this.projectRoot, {
      types: 'all', // Gets js, jsx, ts, tsx, and more
      ignore: ['node_modules', 'dist', 'build'],
      maxFiles: 1000 // Reasonable limit for performance
    });

    const locations: string[] = [];
    let importCount = 0;

    for (const file of files) {
      const filePath = path.join(this.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for various import patterns
      const importPatterns = [
        `require\\(['"\`]${pkg}['"\`]\\)`,
        `require\\(['"\`]${pkg}/`,
        `from ['"\`]${pkg}['"\`]`,
        `from ['"\`]${pkg}/`,
        `import\\(['"\`]${pkg}['"\`]\\)`,
        `import\\(['"\`]${pkg}/`
      ];

      for (const pattern of importPatterns) {
        const regex = new RegExp(pattern, 'g');
        const matches = content.match(regex);
        if (matches) {
          importCount += matches.length;
          if (!locations.includes(file)) {
            locations.push(file);
          }
        }
      }
    }

    return {
      importCount,
      fileCount: locations.length,
      locations
    };
  }

  /**
   * 🕵️ Gather intelligence about package
   */
  private async gatherIntelligence(pkg: string): Promise<DependencyInspection['intelligence']> {
    const intelligence: DependencyInspection['intelligence'] = {};

    // Skip npm view for now - it's too slow
    // In production, this would be cached/batched

    // Check for known alternatives
    intelligence.alternatives = this.findAlternatives(pkg);

    // Simple bloat score based on known heavy packages
    const heavyPackages: Record<string, number> = {
      'moment': 50,
      'lodash': 30,
      'inquirer': 40,
      'webpack': 60,
      'react': 35
    };
    intelligence.bloatScore = heavyPackages[pkg] || 10;

    return intelligence;
  }

  /**
   * 🔍 Detect duplicate functionality
   */
  private detectDuplicates(): Record<string, string[]> {
    const duplicates: Record<string, string[]> = {};

    // Known duplicate patterns
    const duplicatePatterns = {
      'http_clients': ['axios', 'request', 'node-fetch', 'got', 'superagent'],
      'date_libraries': ['moment', 'dayjs', 'date-fns', 'luxon'],
      'promise_libraries': ['bluebird', 'q', 'when', 'async'],
      'test_frameworks': ['mocha', 'jest', 'jasmine', 'ava', 'tape'],
      'bundlers': ['webpack', 'parcel', 'rollup', 'esbuild', 'vite'],
      'utility_libraries': ['lodash', 'underscore', 'ramda']
    };

    const deps = Object.keys({
      ...this.packageJson.dependencies || {},
      ...this.packageJson.devDependencies || {}
    });

    for (const [category, packages] of Object.entries(duplicatePatterns)) {
      const found = packages.filter(pkg => deps.includes(pkg));
      if (found.length > 1) {
        duplicates[category] = found;
      }
    }

    return duplicates;
  }

  /**
   * 💡 Find known alternatives
   */
  private findAlternatives(pkg: string): string[] {
    const alternatives: Record<string, string[]> = {
      'request': ['axios', 'node-fetch', 'native fetch'],
      'moment': ['dayjs', 'date-fns', 'Intl.DateTimeFormat'],
      'lodash': ['native methods', 'ramda'],
      'underscore': ['lodash', 'native methods'],
      'body-parser': ['express built-in'],
      'async': ['native promises', 'async/await']
    };

    return alternatives[pkg] || [];
  }

  /**
   * 🔍 Check if package is duplicate
   */
  private isDuplicate(pkg: string): boolean {
    const duplicateGroups = [
      ['axios', 'request', 'node-fetch', 'got'],
      ['moment', 'dayjs', 'date-fns'],
      ['lodash', 'underscore', 'ramda']
    ];

    for (const group of duplicateGroups) {
      if (group.includes(pkg)) {
        const deps = Object.keys(this.packageJson.dependencies || {});
        const count = group.filter(p => deps.includes(p)).length;
        if (count > 1) return true;
      }
    }

    return false;
  }

  /**
   * 📊 Get usage pattern description
   */
  private getUsagePattern(usage: DependencyInspection['usage']): string {
    if (usage.fileCount > 10) return 'widely distributed';
    if (usage.fileCount > 5) return 'moderately distributed';
    if (usage.fileCount > 1) return 'limited distribution';
    return 'single location';
  }

  /**
   * 🏷️ Get package category
   */
  private getPackageCategory(pkg: string): string {
    const categories: Record<string, string[]> = {
      'HTTP libraries': ['axios', 'request', 'node-fetch', 'got'],
      'date handling': ['moment', 'dayjs', 'date-fns'],
      'utility libraries': ['lodash', 'underscore', 'ramda'],
      'testing': ['jest', 'mocha', 'jasmine'],
      'build tools': ['webpack', 'vite', 'rollup'],
      'type checking': ['@types/*', 'typescript'],
      'linting': ['eslint', 'prettier', 'tslint']
    };

    for (const [category, packages] of Object.entries(categories)) {
      if (packages.some(p => pkg.includes(p.replace('*', '')))) {
        return category;
      }
    }
    return 'general';
  }

  /**
   * 📋 Generate final TSA report
   */
  private generateReport(patterns: Record<string, string[]>): TSAReport {
    const core = this.inspectionResults.filter(r => r.status === 'CORE').length;
    const active = this.inspectionResults.filter(r => r.status === 'ACTIVE').length;
    const dormant = this.inspectionResults.filter(r => r.status === 'DORMANT').length;
    const legacy = this.inspectionResults.filter(r => r.status === 'LEGACY').length;

    const totalPackages = this.inspectionResults.length;
    const contextScore = Math.round((core + active) / totalPackages * 100);

    const insights: string[] = [];

    // Generate insights about the project
    if (core > 0) {
      const corePackages = this.inspectionResults.filter(r => r.status === 'CORE').map(r => r.package);
      insights.push(`Core stack: ${corePackages.slice(0, 3).join(', ')}`);
    }

    if (dormant > 0) {
      insights.push(`${dormant} configured packages not actively used - possibly for tooling/CI`);
    }

    if (Object.keys(patterns).length > 0) {
      for (const [category, packages] of Object.entries(patterns)) {
        insights.push(`Multiple ${category}: ${packages.join(' + ')} - possible migration or experimentation`);
      }
    }

    // Detect interesting patterns
    const hasStripe = this.inspectionResults.some(r => r.package.includes('stripe'));
    const hasAuth = this.inspectionResults.some(r =>
      r.package.includes('auth') || r.package.includes('passport') || r.package.includes('jwt')
    );
    if (hasStripe && !hasAuth) {
      insights.push('Has Stripe but no auth packages - interesting payment architecture');
    }

    const hasLint = this.inspectionResults.some(r => r.package.includes('eslint'));
    const lintUsage = this.inspectionResults.find(r => r.package.includes('eslint'));
    if (hasLint && lintUsage?.status === 'DORMANT') {
      insights.push('ESLint configured but not imported - aspirational code quality?');
    }

    return {
      totalPackages,
      core,
      active,
      dormant,
      legacy,
      patterns,
      contextScore,
      insights,
      inspections: this.inspectionResults
    };
  }

  /**
   * 📊 Display TSA Report
   */
  static displayReport(report: TSAReport): void {
    console.log('\n🛂 ═══════════════════════════════════════════════');
    console.log('   FAF TSA - DEPENDENCY INTELLIGENCE REPORT');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`📦 Total Packages Analyzed: ${report.totalPackages}`);
    console.log(`⭐ CORE: ${report.core} (heavily used)`);
    console.log(`✅ ACTIVE: ${report.active} (in use)`);
    console.log(`💤 DORMANT: ${report.dormant} (configured but not imported)`);
    console.log(`🏛️  LEGACY: ${report.legacy} (historical)`);
    console.log();

    console.log(`📊 Context Score: ${report.contextScore}% (understanding of project)`);
    console.log();

    if (Object.keys(report.patterns).length > 0) {
      console.log('🔍 Patterns Detected:');
      for (const [category, packages] of Object.entries(report.patterns)) {
        console.log(`   ${category}: ${packages.join(' + ')}`);
      }
      console.log();
    }

    if (report.insights.length > 0) {
      console.log('💡 Project Insights:');
      report.insights.forEach(insight => {
        console.log(`   • ${insight}`);
      });
      console.log();
    }

    // Show dormant details for context
    const dormantPackages = report.inspections.filter(i => i.status === 'DORMANT');
    if (dormantPackages.length > 0) {
      console.log('💤 Dormant Packages (configured but not imported):');
      dormantPackages.forEach(pkg => {
        console.log(`   • ${pkg.package}: ${pkg.insight}`);
      });
    }

    console.log('\n📝 Use --detailed flag for complete dependency breakdown');
  }
}