/**
 * faf taf validate - Validate .taf file format
 *
 * Validates .taf file structure and reports errors/warnings
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseTAF, validateTAF } from '../taf';

export async function tafValidate(): Promise<void> {
  const tafPath = path.join(process.cwd(), '.taf');

  // Check if .taf exists
  if (!fs.existsSync(tafPath)) {
    console.error('❌ No .taf file found');
    console.log('\nRun: faf taf init');
    process.exit(1);
  }

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

  // Validate
  const result = validateTAF(taf);

  // Display results
  if (result.valid) {
    console.log('✅ .taf file is valid');
    console.log(`\nFormat version: ${taf.format_version}`);
    console.log(`Project: ${taf.project}`);
    console.log(`Test runs: ${taf.test_history.length}`);

    if (taf.faf_associated) {
      console.log(`\n🔗 Native Reference:`);
      console.log(`   .faf location: ${taf.faf_location || '.faf'}`);
      if (taf.faf_score !== undefined) {
        console.log(`   .faf score: ${taf.faf_score}/100`);
      }
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.forEach(warning => {
        console.log(`   ${warning}`);
      });
    }
  } else {
    console.error('❌ .taf file has errors');
    console.error(`\nErrors (${result.errors.length}):`);
    result.errors.forEach(error => {
      console.error(`   ${error}`);
    });

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.forEach(warning => {
        console.log(`   ${warning}`);
      });
    }

    process.exit(1);
  }
}

// CLI wrapper
export async function runTAFValidate(): Promise<void> {
  await tafValidate();
}
