/**
 * 🛂 faf tsa - Dependency Intelligence
 * Understanding your project through its dependencies
 */

import { DependencyTSA } from '../engines/dependency-tsa';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';

export async function tsaCommand(options: { detailed?: boolean }): Promise<void> {
  try {
    console.log();
    console.log(FAF_COLORS.fafCyan('🛂 FAF TSA - Dependency Intelligence'));
    console.log(FAF_COLORS.fafWhite('Analyzing your dependencies for context insights...'));
    console.log();

    const inspector = new DependencyTSA();
    const report = await inspector.inspect();

    // Display report
    DependencyTSA.displayReport(report);

    // Add to .faf context
    if (report.contextScore < 70) {
      console.log(FAF_COLORS.fafOrange('🔍 Your dependency story is complex'));
      console.log(FAF_COLORS.fafWhite('Run: faf tsa --detailed for full analysis'));
    } else {
      console.log(FAF_COLORS.fafGreen('✨ Clear dependency architecture detected!'));
    }

    // Show the secret sauce hint
    if (options.detailed) {
      console.log();
      console.log(FAF_COLORS.fafCyan('🔍 How FAF TSA Works:'));
      console.log(FAF_COLORS.fafWhite('  1. Scans actual usage patterns'));
      console.log(FAF_COLORS.fafWhite('  2. Ranks dependencies by importance'));
      console.log(FAF_COLORS.fafWhite('  3. Detects architectural patterns'));
      console.log(FAF_COLORS.fafWhite('  4. Identifies migration/experimentation'));
      console.log(FAF_COLORS.fafWhite('  5. Provides context insights for AI'));
      console.log();
      console.log(FAF_COLORS.fafOrange('Context intelligence nobody else provides!'));
    }

  } catch (error) {
    console.error('TSA Inspection failed:', error);
    process.exit(1);
  }
}

export async function tsaQuickCheck(): Promise<number> {
  /**
   * Quick TSA score for inclusion in .faf
   */
  try {
    const inspector = new DependencyTSA();
    const report = await inspector.inspect();
    return report.contextScore;
  } catch {
    return 0;
  }
}