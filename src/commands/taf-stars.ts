/**
 * faf taf stars - Star rating display and badge generation
 *
 * Reads .taf and shows universal star rating.
 * Optionally generates SVG badge.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseTAF, calculateStarRatingFromTAF } from '../taf';
import { generateStarBadge } from '../taf/star-badge';

export async function runTAFStars(args: string[]): Promise<void> {
  const tafPath = path.join(process.cwd(), '.taf');

  // Check if .taf exists
  if (!fs.existsSync(tafPath)) {
    console.error('❌ No .taf file found');
    console.log('\nRun: faf taf init');
    process.exit(1);
  }

  // Parse flags
  const outputIndex = args.findIndex(arg => arg === '--output' || arg === '-o');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;
  const jsonMode = args.includes('--json');

  // Read and parse
  let taf;
  try {
    const content = fs.readFileSync(tafPath, 'utf-8');
    taf = parseTAF(content);
  } catch (error) {
    console.error('❌ Failed to parse .taf file');
    if (error instanceof Error) {
      console.error(`\n${error.message}`);
    }
    process.exit(1);
  }

  const rating = calculateStarRatingFromTAF(taf);

  if (!rating) {
    console.log('☆☆☆☆☆ No test data');
    return;
  }

  const latest = taf.test_history[taf.test_history.length - 1];
  const passed = latest.tests.passed;
  const total = latest.tests.total;
  const passRate = Math.round((passed / total) * 100);

  if (jsonMode) {
    console.log(JSON.stringify({
      stars: rating.stars,
      display: rating.display,
      label: rating.label,
      passed,
      total,
      passRate: `${passRate}%`,
    }, null, 2));
    return;
  }

  // Display
  console.log(`${rating.display} ${passed}/${total} passed (${passRate}%)`);

  // Generate SVG if requested
  if (outputPath) {
    const result = generateStarBadge({ tafPath });

    if (!result.success || !result.svg) {
      console.error(`\n❌ Failed to generate badge: ${result.error}`);
      process.exit(1);
    }

    fs.writeFileSync(outputPath, result.svg, 'utf-8');
    console.log(`\n📄 Badge saved: ${outputPath}`);
  }
}
