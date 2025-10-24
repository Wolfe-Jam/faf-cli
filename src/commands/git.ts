/**
 * 🏆 faf git - GitHub Repository Context Extractor
 *
 * Generate AI-ready context for ANY GitHub repo without cloning
 *
 * Features:
 * - Shorthand resolution (react → facebook/react)
 * - Fuzzy matching for typos (svelte → sveltejs/svelte)
 * - Interactive selection for ambiguous queries
 * - Rich metadata extraction (stars, topics, languages)
 * - Quality scoring
 * - Batch processing (compare multiple repos)
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import path from 'path';
import { stringify as stringifyYAML } from '../fix-once/yaml';
import { FAF_COLORS } from '../utils/championship-style';

import {
  resolveShorthand,
  searchRepos,
  findClosestMatch,
  getCategories,
  getReposByCategory,
  type RepoMapping
} from '../github/popular-repos';

import {
  parseGitHubUrl,
  fetchGitHubMetadata,
  fetchGitHubFileTree,
  detectStackFromMetadata,
  calculateRepoQualityScore,
  type GitHubMetadata
} from '../github/github-extractor';

import {
  selectFromMultiple,
  confirmTypoCorrection,
  showNoReposFound,
  showRateLimitWarning,
  showPopularRepos,
  showExtractionProgress,
  showExtractionSuccess,
  showBatchSummary
} from '../github/repo-selector';

export interface GitOptions {
  output?: string;
  list?: boolean;
  category?: string;
  scan?: boolean; // metadata only, no file tree
  clone?: boolean; // clone repo after generating .faf
}

/**
 * Main faf git command
 */
export async function gitCommand(query?: string, options: GitOptions = {}) {
  try {
    // Handle --list flag
    if (options.list) {
      return await handleListCommand(options.category);
    }

    // Require query
    if (!query) {
      console.log();
      console.log(chalk.red('❌ No repository specified'));
      console.log();
      console.log(chalk.gray('Usage:'));
      console.log(chalk.gray('  faf git <repo>           # Shorthand: faf git react'));
      console.log(chalk.gray('  faf git owner/repo       # GitHub path: faf git facebook/react'));
      console.log(chalk.gray('  faf git <url>            # Full URL: faf git https://github.com/...'));
      console.log(chalk.gray('  faf git --list           # Show popular repos'));
      console.log();
      return;
    }

    // Resolve repository
    const repos = await resolveQuery(query);

    if (repos.length === 0) {
      showNoReposFound(query);
      return;
    }

    // Handle multiple matches
    let selectedRepos: RepoMapping[] = repos;
    if (repos.length > 1) {
      const selection = await selectFromMultiple(query, repos);

      if (selection.cancelled) {
        console.log();
        console.log(chalk.gray('Cancelled.'));
        return;
      }

      selectedRepos = selection.selected;
    }

    // Extract context for selected repositories
    const results: Array<{ repo: string; success: boolean; outputPath?: string }> = [];

    for (const repo of selectedRepos) {
      try {
        showExtractionProgress(repo.owner, repo.repo);

        // Fetch metadata
        const metadata = await fetchGitHubMetadata(repo.owner, repo.repo, !options.scan);

        // Fetch file tree (unless --scan only)
        let files: any[] = [];
        if (!options.scan) {
          files = await fetchGitHubFileTree(repo.owner, repo.repo, metadata.defaultBranch);
        }

        // Detect stack
        const stacks = detectStackFromMetadata(metadata);

        // Calculate quality score
        const score = calculateRepoQualityScore(metadata);

        // Generate .faf content
        const fafContent = generateFafFromGitHub(metadata, stacks, files, score);

        // Determine output path
        const outputPath = options.output || `${repo.repo}.faf`;

        // Write .faf file
        await fs.writeFile(outputPath, fafContent, 'utf-8');

        showExtractionSuccess(repo.owner, repo.repo, outputPath, score);

        results.push({
          repo: `${repo.owner}/${repo.repo}`,
          success: true,
          outputPath
        });

        // Clone if requested
        if (options.clone) {
          await cloneRepository(repo.owner, repo.repo);
        }
      } catch (error) {
        console.log();
        if (error instanceof Error && error.message.includes('rate limit')) {
          showRateLimitWarning();
        } else {
          console.log(chalk.red(`❌ Failed to extract ${repo.owner}/${repo.repo}: ${error}`));
        }
        console.log();

        results.push({
          repo: `${repo.owner}/${repo.repo}`,
          success: false
        });
      }
    }

    // Show batch summary if multiple repos
    if (selectedRepos.length > 1) {
      showBatchSummary(results);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
    process.exit(1);
  }
}

/**
 * Resolve query to repository mapping(s)
 */
async function resolveQuery(query: string): Promise<RepoMapping[]> {
  // Try parsing as GitHub URL first
  const parsed = parseGitHubUrl(query);
  if (parsed && parsed.owner && parsed.repo) {
    // Validate it exists (will throw if not found)
    try {
      await fetchGitHubMetadata(parsed.owner, parsed.repo, false);
      return [{
        shorthand: parsed.repo,
        owner: parsed.owner,
        repo: parsed.repo,
        category: 'unknown'
      }];
    } catch (error) {
      // Not found, fall through to other resolution methods
    }
  }

  // Try exact shorthand match
  const exactMatch = resolveShorthand(query);
  if (exactMatch) {
    return [exactMatch];
  }

  // Try fuzzy search
  const searchResults = searchRepos(query, 10);
  if (searchResults.length > 0) {
    return searchResults;
  }

  // Try typo correction
  const closestMatch = findClosestMatch(query, 2);
  if (closestMatch) {
    const confirmed = await confirmTypoCorrection(query, closestMatch);
    if (confirmed) {
      return [closestMatch];
    }
  }

  return [];
}

/**
 * Handle --list command
 */
async function handleListCommand(category?: string): Promise<void> {
  if (category) {
    const repos = getReposByCategory(category);
    if (repos.length === 0) {
      console.log();
      console.log(chalk.red(`❌ No repos found in category '${category}'`));
      console.log();
      console.log(chalk.gray('Available categories:'));
      const categories = getCategories();
      for (const cat of categories) {
        console.log(chalk.gray(`  • ${cat}`));
      }
      console.log();
      return;
    }
    showPopularRepos(repos, category);
  } else {
    // Show all categories
    const categories = getCategories();
    const allRepos: RepoMapping[] = [];
    for (const cat of categories) {
      allRepos.push(...getReposByCategory(cat));
    }
    showPopularRepos(allRepos);
  }
}

/**
 * Generate .faf content from GitHub metadata
 */
function generateFafFromGitHub(
  metadata: GitHubMetadata,
  stacks: string[],
  files: any[],
  score: number
): string {
  const timestamp = new Date().toISOString();

  // Build .faf structure
  const fafData: any = {
    version: '3.0',
    name: metadata.repo,
    source: 'github',
    generated_at: timestamp,

    metadata: {
      url: metadata.url,
      owner: metadata.owner,
      repository: metadata.repo,
      description: metadata.description || 'No description provided',
      stars: metadata.stars || '0',
      forks: metadata.forks || '0',
      license: metadata.license || 'Not specified',
      topics: metadata.topics || [],
      languages: metadata.languages || [],
      last_updated: metadata.lastUpdated,
      default_branch: metadata.defaultBranch || 'main',
    },

    stack: {
      detected: stacks,
      primary_language: metadata.languages?.[0]?.split(' ')[0] || 'Unknown',
      has_package_json: metadata.hasPackageJson || false,
      has_typescript: metadata.hasTsConfig || false,
      has_docker: metadata.hasDockerfile || false,
    },

    structure: {
      total_files: files.length,
      files: files.slice(0, 50).map(f => ({ // Limit to 50 files
        path: f.path,
        type: f.type,
        size: f.size
      })),
    },

    quality: {
      score: score,
      tier: getScoreTier(score),
      factors: {
        has_stars: !!metadata.stars,
        has_description: !!metadata.description,
        has_topics: !!(metadata.topics && metadata.topics.length > 0),
        has_license: !!metadata.license,
        has_readme: !!metadata.readme,
        recently_updated: isRecentlyUpdated(metadata.lastUpdated),
      }
    },

    generated_by: {
      tool: 'faf-cli',
      command: 'faf git',
      version: '3.0.6',
    }
  };

  // Convert to YAML
  const yamlContent = stringifyYAML(fafData);

  // Add human-readable header
  const header = `# ========================================
# GITHUB REPOSITORY SUMMARY
# ========================================
#
# Repository: ${metadata.owner}/${metadata.repo}
# URL: ${metadata.url}
# Description: ${metadata.description || 'No description'}
# Stars: ${metadata.stars || '0'} | Forks: ${metadata.forks || '0'}
# License: ${metadata.license || 'Not specified'}
# Stack: ${stacks.join(', ') || 'Unknown'}
#
# Quality Score: ${score}% ${getScoreTier(score)}
#
# Generated: ${timestamp}
# Command: faf git ${metadata.owner}/${metadata.repo}
#
# ========================================
# FULL EXTRACTION DATA (AI-Ready)
# ========================================

`;

  return header + yamlContent;
}

/**
 * Get score tier emoji
 */
function getScoreTier(score: number): string {
  if (score >= 85) return '🏆 Trophy';
  if (score >= 70) return '🥇 Gold';
  if (score >= 55) return '🥈 Silver';
  if (score >= 40) return '🥉 Bronze';
  if (score >= 35) return '🟢 Green';
  if (score >= 20) return '🟡 Yellow';
  if (score >= 10) return '🔴 Red';
  return '🤍 White';
}

/**
 * Check if repository was updated recently (within 90 days)
 */
function isRecentlyUpdated(lastUpdated?: string): boolean {
  if (!lastUpdated) return false;

  const lastUpdate = new Date(lastUpdated);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceUpdate < 90;
}

/**
 * Clone repository (optional)
 */
async function cloneRepository(owner: string, repo: string): Promise<void> {
  const { spawn } = require('child_process');

  return new Promise((resolve, reject) => {
    console.log();
    console.log(FAF_COLORS.fafCyan(`🔄 Cloning ${owner}/${repo}...`));

    const git = spawn('git', ['clone', `https://github.com/${owner}/${repo}.git`]);

    git.on('close', (code: number) => {
      if (code === 0) {
        console.log(FAF_COLORS.fafGreen(`☑️  Cloned to ./${repo}`));
        resolve();
      } else {
        reject(new Error(`Git clone failed with code ${code}`));
      }
    });

    git.on('error', (err: Error) => {
      reject(err);
    });
  });
}
