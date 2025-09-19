#!/usr/bin/env node

/**
 * WJTC Report Processor
 * Wolfejam Testing Center - Automated Report Ingestion System
 *
 * Processes test reports, updates dashboards, maintains history
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

interface WJTCReport {
  report_metadata: {
    report_id: string;
    report_version: string;
    test_date: string;
    tester: string;
    platform: string;
    test_type: string;
    duration_ms: number;
  };
  test_scope: {
    total_commands: number;
    commands_tested: number;
    success_count: number;
    failure_count: number;
    coverage_percentage: number;
  };
  display_quality?: {
    overall_score: number;
  };
  championship_score?: {
    total_score: number;
    championship_status: string;
  };
  certification?: {
    certified: boolean;
    certification_level: string;
  };
}

class WJTCReportProcessor {
  private reportsDir = './wjtc-reports';
  private dashboardFile = './WJTC-DASHBOARD.md';
  private databaseFile = './wjtc-database.json';

  constructor() {
    // Ensure directories exist
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Process a new test report
   */
  async processReport(reportPath: string): Promise<void> {
    console.log(chalk.cyan('🏎️ WJTC Report Processor v1.0.0'));
    console.log(chalk.gray('━'.repeat(50)));

    try {
      // Load and validate report
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      const report = yaml.load(reportContent) as WJTCReport;

      // Generate report ID if missing
      if (!report.report_metadata.report_id) {
        report.report_metadata.report_id = uuidv4();
      }

      // Add timestamp if missing
      if (!report.report_metadata.test_date) {
        report.report_metadata.test_date = new Date().toISOString();
      }

      // Archive report
      const archivePath = path.join(
        this.reportsDir,
        `${report.report_metadata.platform}-${report.report_metadata.report_id}.yaml`
      );
      fs.writeFileSync(archivePath, yaml.dump(report));
      console.log(chalk.green('✅ Report archived:'), archivePath);

      // Update database
      this.updateDatabase(report);

      // Update dashboard
      await this.updateDashboard(report);

      // Display summary
      this.displaySummary(report);

      // Check for certification
      this.checkCertification(report);

    } catch (error) {
      console.error(chalk.red('❌ Error processing report:'), error);
      process.exit(1);
    }
  }

  /**
   * Update the testing database with new results
   */
  private updateDatabase(report: WJTCReport): void {
    let database: any = { reports: [], statistics: {} };

    if (fs.existsSync(this.databaseFile)) {
      database = JSON.parse(fs.readFileSync(this.databaseFile, 'utf8'));
    }

    // Add report to history
    database.reports.push({
      id: report.report_metadata.report_id,
      date: report.report_metadata.test_date,
      platform: report.report_metadata.platform,
      score: report.test_scope.coverage_percentage,
      success_rate: (report.test_scope.success_count / report.test_scope.commands_tested) * 100
    });

    // Update platform statistics
    const platform = report.report_metadata.platform;
    if (!database.statistics[platform]) {
      database.statistics[platform] = {
        total_tests: 0,
        average_score: 0,
        best_score: 0,
        last_test: null
      };
    }

    const stats = database.statistics[platform];
    stats.total_tests++;
    stats.last_test = report.report_metadata.test_date;
    stats.best_score = Math.max(stats.best_score, report.test_scope.coverage_percentage);

    // Calculate running average
    const allPlatformReports = database.reports.filter((r: any) => r.platform === platform);
    const avgScore = allPlatformReports.reduce((sum: number, r: any) => sum + r.score, 0) / allPlatformReports.length;
    stats.average_score = Math.round(avgScore);

    fs.writeFileSync(this.databaseFile, JSON.stringify(database, null, 2));
    console.log(chalk.green('✅ Database updated'));
  }

  /**
   * Update the WJTC dashboard with latest results
   */
  private async updateDashboard(report: WJTCReport): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const platform = report.report_metadata.platform.toUpperCase();
    const score = report.test_scope.coverage_percentage;
    const displayScore = report.display_quality?.overall_score || 'N/A';

    let dashboard = `# 🏆 WJTC Dashboard - Live Testing Results

*Last Updated: ${new Date().toISOString()}*

## 📊 Latest Test Results

### Platform: ${platform}
- **Test Date:** ${date}
- **Coverage:** ${score}%
- **Success Rate:** ${Math.round((report.test_scope.success_count / report.test_scope.commands_tested) * 100)}%
- **Display Quality:** ${displayScore}/10
- **Commands Tested:** ${report.test_scope.commands_tested}/${report.test_scope.total_commands}
`;

    if (report.championship_score) {
      dashboard += `
### 🏁 Championship Score
- **Total:** ${report.championship_score.total_score}/100
- **Status:** ${report.championship_score.championship_status}
`;
    }

    // Load historical data
    if (fs.existsSync(this.databaseFile)) {
      const database = JSON.parse(fs.readFileSync(this.databaseFile, 'utf8'));

      dashboard += `
## 📈 Historical Performance

| Platform | Tests Run | Average Score | Best Score | Last Test |
|----------|-----------|---------------|------------|-----------|
`;

      for (const [plat, stats] of Object.entries(database.statistics as any)) {
        dashboard += `| ${plat} | ${stats.total_tests} | ${stats.average_score}% | ${stats.best_score}% | ${stats.last_test?.split('T')[0]} |\n`;
      }
    }

    // Add certification status
    if (report.certification?.certified) {
      dashboard += `
## 🏅 Certification Status

**${platform} is CERTIFIED ${report.certification.certification_level?.toUpperCase()}!** ✅
`;
    }

    dashboard += `
---
*Generated by WJTC Report Processor v1.0.0*
`;

    fs.writeFileSync(this.dashboardFile, dashboard);
    console.log(chalk.green('✅ Dashboard updated'));
  }

  /**
   * Display test summary
   */
  private displaySummary(report: WJTCReport): void {
    console.log(chalk.gray('━'.repeat(50)));
    console.log(chalk.cyan('📊 Test Summary'));
    console.log(chalk.gray('━'.repeat(50)));

    const successRate = (report.test_scope.success_count / report.test_scope.commands_tested) * 100;

    console.log(`Platform: ${chalk.yellow(report.report_metadata.platform)}`);
    console.log(`Commands: ${report.test_scope.commands_tested}/${report.test_scope.total_commands}`);
    console.log(`Success Rate: ${this.getColorForScore(successRate)}${successRate.toFixed(1)}%${chalk.reset()}`);

    if (report.display_quality) {
      console.log(`Display Quality: ${report.display_quality.overall_score}/10`);
    }

    if (report.championship_score) {
      console.log(`Championship: ${report.championship_score.total_score}/100 - ${report.championship_score.championship_status}`);
    }
  }

  /**
   * Check if results meet certification criteria
   */
  private checkCertification(report: WJTCReport): void {
    const coverage = report.test_scope.coverage_percentage;
    const successRate = (report.test_scope.success_count / report.test_scope.commands_tested) * 100;

    let certLevel = 'none';

    if (coverage >= 90 && successRate >= 95) {
      certLevel = 'platinum';
    } else if (coverage >= 80 && successRate >= 90) {
      certLevel = 'gold';
    } else if (coverage >= 70 && successRate >= 85) {
      certLevel = 'silver';
    } else if (coverage >= 60 && successRate >= 80) {
      certLevel = 'bronze';
    }

    if (certLevel !== 'none') {
      console.log(chalk.gray('━'.repeat(50)));
      console.log(chalk.green(`🏅 CERTIFICATION ACHIEVED: ${certLevel.toUpperCase()}`));
      console.log(chalk.gray('━'.repeat(50)));
    }
  }

  private getColorForScore(score: number): string {
    if (score >= 90) return chalk.green;
    if (score >= 70) return chalk.yellow;
    if (score >= 50) return chalk.rgb(255, 165, 0); // orange
    return chalk.red;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(chalk.red('Usage: npx ts-node WJTC-REPORT-PROCESSOR.ts <report-file>'));
    process.exit(1);
  }

  const processor = new WJTCReportProcessor();
  processor.processReport(args[0]);
}