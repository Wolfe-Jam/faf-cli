#!/usr/bin/env ts-node

/**
 * 🚀 Release Preparation Script - F1-Inspired Championship Releases
 * Automates version bumping, changelog generation, and release validation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { FAF_COLORS, FAF_ICONS } from '../src/utils/championship-style';

interface ReleaseOptions {
  type: 'patch' | 'minor' | 'major' | 'prerelease';
  dryRun: boolean;
  skipTests: boolean;
  prereleaseId?: string;
}

interface VersionInfo {
  current: string;
  next: string;
  tag: string;
}

interface ChangelogEntry {
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore';
  scope?: string;
  description: string;
  breaking?: boolean;
  hash: string;
}

/**
 * Main release preparation function
 */
async function prepareRelease(options: ReleaseOptions): Promise<void> {
  console.log(`${FAF_COLORS.fafCyan('🚀 FAF CLI Release Preparation')}`);
  console.log(`${FAF_COLORS.fafCyan('├─')} F1-inspired championship engineering`);
  console.log(`${FAF_COLORS.fafCyan('└─')} Release type: ${FAF_COLORS.fafGreen(options.type)}`);
  console.log();

  try {
    // Pre-flight checks
    await preflightChecks(options);
    
    // Calculate version info
    const versionInfo = await calculateVersions(options);
    console.log(`${FAF_COLORS.fafCyan('📊 Version Info:')}`);
    console.log(`${FAF_COLORS.fafCyan('├─')} Current: ${versionInfo.current}`);
    console.log(`${FAF_COLORS.fafCyan('├─')} Next: ${FAF_COLORS.fafGreen(versionInfo.next)}`);
    console.log(`${FAF_COLORS.fafCyan('└─')} Tag: ${versionInfo.tag}`);
    console.log();
    
    // Generate changelog
    const changelog = await generateChangelog(versionInfo);
    
    // Update package.json
    if (!options.dryRun) {
      await updatePackageVersion(versionInfo.next);
      console.log(`${FAF_COLORS.fafGreen('✅')} Updated package.json to ${versionInfo.next}`);
    }
    
    // Run tests if not skipped
    if (!options.skipTests) {
      await runTestSuite();
    }
    
    // Build project
    await buildProject();
    
    // Show release summary
    showReleaseSummary(versionInfo, changelog, options);
    
    // Create release commands
    generateReleaseCommands(versionInfo, options);
    
  } catch (error) {
    console.error(`${FAF_COLORS.fafOrange('❌ Release preparation failed:')} ${error}`);
    process.exit(1);
  }
}

/**
 * Pre-flight checks
 */
async function preflightChecks(options: ReleaseOptions): Promise<void> {
  console.log(`${FAF_COLORS.fafCyan('🔍 Pre-flight Checks:')}`);
  
  // Check git status
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim() && !options.dryRun) {
      throw new Error('Working directory not clean. Commit or stash changes first.');
    }
    console.log(`${FAF_COLORS.fafGreen('├─ ✅')} Git working directory clean`);
  } catch (error) {
    console.log(`${FAF_COLORS.fafOrange('├─ ⚠️')} Git status check failed`);
    if (!options.dryRun) throw error;
  }
  
  // Check we're on main branch
  try {
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'main' && !options.dryRun) {
      console.log(`${FAF_COLORS.fafOrange('├─ ⚠️')} Currently on branch: ${currentBranch} (expected: main)`);
    } else {
      console.log(`${FAF_COLORS.fafGreen('├─ ✅')} On main branch`);
    }
  } catch (error) {
    console.log(`${FAF_COLORS.fafOrange('├─ ⚠️')} Branch check failed`);
  }
  
  // Check package.json exists
  const packagePath = path.join(process.cwd(), 'package.json');
  try {
    await fs.access(packagePath);
    console.log(`${FAF_COLORS.fafGreen('├─ ✅')} package.json found`);
  } catch {
    throw new Error('package.json not found in current directory');
  }
  
  // Check npm credentials (for actual releases)
  if (!options.dryRun) {
    try {
      execSync('npm whoami', { stdio: 'pipe' });
      console.log(`${FAF_COLORS.fafGreen('└─ ✅')} NPM authentication ready`);
    } catch {
      console.log(`${FAF_COLORS.fafOrange('└─ ⚠️')} NPM authentication not configured`);
    }
  } else {
    console.log(`${FAF_COLORS.fafGreen('└─ ✅')} Dry run mode - skipping NPM check`);
  }
  
  console.log();
}

/**
 * Calculate version information
 */
async function calculateVersions(options: ReleaseOptions): Promise<VersionInfo> {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = await fs.readFile(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  const currentVersion = packageJson.version;
  
  // Calculate next version using npm version --dry-run
  let versionArgs = options.type;
  if (options.type === 'prerelease' && options.prereleaseId) {
    versionArgs += ` --preid=${options.prereleaseId}`;
  }
  
  const nextVersion = execSync(`npm version ${versionArgs} --dry-run --no-git-tag-version`, { 
    encoding: 'utf8' 
  }).trim().replace(/^v/, '');
  
  return {
    current: currentVersion,
    next: nextVersion,
    tag: `v${nextVersion}`
  };
}

/**
 * Generate changelog from git commits
 */
async function generateChangelog(versionInfo: VersionInfo): Promise<ChangelogEntry[]> {
  console.log(`${FAF_COLORS.fafCyan('📝 Generating Changelog:')}`);
  
  try {
    // Get commits since last tag
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { 
      encoding: 'utf8' 
    }).trim();
    
    const gitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    const commits = execSync(`git log --pretty=format:"%H|%s" ${gitRange}`, { 
      encoding: 'utf8' 
    }).trim().split('\n').filter(line => line);
    
    const changelog: ChangelogEntry[] = commits.map(commit => {
      const [hash, message] = commit.split('|');
      return parseCommitMessage(message, hash);
    });
    
    // Group by type
    const grouped = changelog.reduce((acc, entry) => {
      if (!acc[entry.type]) acc[entry.type] = [];
      acc[entry.type].push(entry);
      return acc;
    }, {} as Record<string, ChangelogEntry[]>);
    
    // Display changelog preview
    console.log(`${FAF_COLORS.fafCyan('├─')} Changes since ${lastTag || 'initial commit'}:`);
    
    const typeLabels = {
      feat: '🚀 Features',
      fix: '🐛 Bug Fixes', 
      docs: '📚 Documentation',
      style: '🎨 Style',
      refactor: '♻️ Refactoring',
      test: '🧪 Tests',
      chore: '🔧 Maintenance'
    };
    
    Object.entries(grouped).forEach(([type, entries]) => {
      if (entries.length > 0) {
        console.log(`${FAF_COLORS.fafCyan('│   ')}${typeLabels[type as keyof typeof typeLabels] || type}: ${entries.length} changes`);
      }
    });
    
    console.log(`${FAF_COLORS.fafGreen('└─')} Total commits: ${changelog.length}`);
    console.log();
    
    return changelog;
    
  } catch (error) {
    console.log(`${FAF_COLORS.fafOrange('└─ ⚠️')} Could not generate changelog: ${error}`);
    return [];
  }
}

/**
 * Parse conventional commit message
 */
function parseCommitMessage(message: string, hash: string): ChangelogEntry {
  // Parse conventional commit format: type(scope): description
  const conventionalMatch = message.match(/^(feat|fix|docs|style|refactor|test|chore)(?:\\(([^)]+)\\))?: (.+)/);
  
  if (conventionalMatch) {
    const [, type, scope, description] = conventionalMatch;
    return {
      type: type as ChangelogEntry['type'],
      scope,
      description,
      breaking: message.includes('BREAKING CHANGE'),
      hash: hash.substring(0, 7)
    };
  }
  
  // Fallback for non-conventional commits
  return {
    type: 'chore',
    description: message,
    hash: hash.substring(0, 7)
  };
}

/**
 * Update package.json version
 */
async function updatePackageVersion(newVersion: string): Promise<void> {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = await fs.readFile(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  packageJson.version = newVersion;
  
  await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
}

/**
 * Run test suite
 */
async function runTestSuite(): Promise<void> {
  console.log(`${FAF_COLORS.fafCyan('🧪 Running Test Suite:')}`);
  
  try {
    // Run main tests
    execSync('npm test', { stdio: 'inherit' });
    console.log(`${FAF_COLORS.fafGreen('├─ ✅')} Unit tests passed`);
    
    // Run audit tests
    execSync('npm run test:audit', { stdio: 'inherit' });
    console.log(`${FAF_COLORS.fafGreen('├─ ✅')} Audit tests passed`);
    
    // Run linting
    execSync('npm run lint', { stdio: 'inherit' });
    console.log(`${FAF_COLORS.fafGreen('└─ ✅')} Linting passed`);
    
  } catch (error) {
    throw new Error(`Test suite failed: ${error}`);
  }
  
  console.log();
}

/**
 * Build project
 */
async function buildProject(): Promise<void> {
  console.log(`${FAF_COLORS.fafCyan('🏗️ Building Project:')}`);
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`${FAF_COLORS.fafGreen('└─ ✅')} Build completed successfully`);
  } catch (error) {
    throw new Error(`Build failed: ${error}`);
  }
  
  console.log();
}

/**
 * Show release summary
 */
function showReleaseSummary(
  versionInfo: VersionInfo, 
  changelog: ChangelogEntry[], 
  options: ReleaseOptions
): void {
  console.log(`${FAF_COLORS.fafCyan('📋 Release Summary:')}`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Version: ${versionInfo.current} → ${FAF_COLORS.fafGreen(versionInfo.next)}`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Type: ${options.type}`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Changes: ${changelog.length} commits`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE RELEASE'}`);
  console.log(`${FAF_COLORS.fafCyan('└─')} Ready for championship deployment! 🏎️`);
  console.log();
}

/**
 * Generate release commands
 */
function generateReleaseCommands(versionInfo: VersionInfo, options: ReleaseOptions): void {
  console.log(`${FAF_COLORS.fafCyan('🚀 Release Commands:')}`);
  console.log();
  
  if (options.dryRun) {
    console.log(`${FAF_COLORS.fafOrange('📝 To complete the release, run:')}`);
    console.log();
    console.log(`${FAF_COLORS.fafCyan('# 1. Commit version change')}`);
    console.log(`git add package.json`);
    console.log(`git commit -m "chore: bump version to ${versionInfo.next}"`);
    console.log();
    console.log(`${FAF_COLORS.fafCyan('# 2. Create and push tag')}`);
    console.log(`git tag ${versionInfo.tag}`);
    console.log(`git push origin main --tags`);
    console.log();
    console.log(`${FAF_COLORS.fafCyan('# 3. GitHub Actions will handle the rest! 🏁')}`);
  } else {
    console.log(`${FAF_COLORS.fafGreen('✅ Release prepared! Push to trigger automation:')}`);
    console.log();
    console.log(`git push origin main --tags`);
  }
  
  console.log();
  console.log(`${FAF_COLORS.fafGreen('🏆 Championship release engineering complete!')}`);
}

/**
 * CLI argument parsing
 */
function parseArgs(): ReleaseOptions {
  const args = process.argv.slice(2);
  
  const options: ReleaseOptions = {
    type: 'patch',
    dryRun: false,
    skipTests: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--type':
        options.type = args[++i] as ReleaseOptions['type'];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--skip-tests':
        options.skipTests = true;
        break;
      case '--preid':
        options.prereleaseId = args[++i];
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
🚀 FAF CLI Release Preparation Script

Usage: npm run release [options]

Options:
  --type <type>       Release type: patch|minor|major|prerelease (default: patch)
  --dry-run          Show what would be done without making changes
  --skip-tests       Skip running test suite
  --preid <id>       Pre-release identifier (alpha, beta, rc)
  --help             Show this help

Examples:
  npm run release                    # Patch release (1.0.0 → 1.0.1)
  npm run release -- --type minor   # Minor release (1.0.0 → 1.1.0)  
  npm run release -- --type major   # Major release (1.0.0 → 2.0.0)
  npm run release -- --dry-run      # Preview changes only
  npm run release -- --type prerelease --preid beta  # Beta release

🏎️ F1-inspired engineering - Championship releases every time!
`);
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();
  prepareRelease(options).catch(console.error);
}

export { prepareRelease };