/**
 * faf taf init - Initialize .taf file
 *
 * Creates a new .taf (Testing Activity Feed) file in the current directory
 * Detects .faf file for native reference integration
 */

import * as fs from 'fs';
import * as path from 'path';
import { createTAF, serializeTAF, formatTAF } from '../taf';
import * as yaml from 'yaml';

interface TAFInitOptions {
  project?: string;
  force?: boolean;
}

export async function tafInit(options: TAFInitOptions = {}): Promise<void> {
  const tafPath = path.join(process.cwd(), '.taf');

  // Check if .taf already exists
  if (fs.existsSync(tafPath) && !options.force) {
    console.error('❌ .taf file already exists');
    console.log('\nUse --force to overwrite');
    process.exit(1);
  }

  // Get project name
  let projectName = options.project;

  if (!projectName) {
    // Try to get from package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        projectName = pkg.name;
      } catch {
        // Ignore errors
      }
    }
  }

  if (!projectName) {
    // Use directory name as fallback
    projectName = path.basename(process.cwd());
  }

  // Check for .faf file (Native Reference)
  const fafPath = path.join(process.cwd(), '.faf');
  const hasFAF = fs.existsSync(fafPath);
  let fafScore: number | undefined;

  if (hasFAF) {
    try {
      const fafContent = fs.readFileSync(fafPath, 'utf-8');
      const faf = yaml.parse(fafContent);

      // Try to extract score from various possible fields
      if (faf.ai_score) {
        const scoreStr = String(faf.ai_score).replace('%', '');
        fafScore = parseInt(scoreStr);
      } else if (faf.score) {
        fafScore = parseInt(String(faf.score));
      } else if (faf.faf_dna?.current_score) {
        fafScore = parseInt(String(faf.faf_dna.current_score));
      }
    } catch {
      // Ignore parsing errors
    }
  }

  // Create .taf file
  const taf = createTAF(projectName, {
    faf_associated: hasFAF,
    faf_location: hasFAF ? '.faf' : undefined,
    faf_score: fafScore,
  });

  // Serialize and format
  const content = formatTAF(serializeTAF(taf));

  // Write file
  fs.writeFileSync(tafPath, content, 'utf-8');

  // Success message
  console.log('✅ Created .taf file');
  console.log(`\nProject: ${projectName}`);

  if (hasFAF) {
    console.log('🔗 Native Reference: .faf detected');
    if (fafScore) {
      console.log(`   FAF Score: ${fafScore}/100`);
    }
  } else {
    console.log('ℹ️  No .faf file found (optional)');
  }

  console.log('\nNext steps:');
  console.log('  faf taf log      # Log a test run');
  console.log('  faf taf stats    # View statistics');
  console.log('  faf taf validate # Validate format');
}

// CLI wrapper
export async function runTAFInit(args: string[]): Promise<void> {
  const options: TAFInitOptions = {
    force: args.includes('--force') || args.includes('-f'),
  };

  // Extract project name if provided
  const projectIndex = args.findIndex(arg => arg === '--project' || arg === '-p');
  if (projectIndex !== -1 && args[projectIndex + 1]) {
    options.project = args[projectIndex + 1];
  }

  await tafInit(options);
}
