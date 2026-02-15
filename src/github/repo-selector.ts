/**
 * 🏆 Interactive Repository Selector
 *
 * Handles ambiguous queries with smart selection UI
 */

import inquirer from 'inquirer';
import { chalk } from '../fix-once/colors';
import { FAF_COLORS } from '../utils/championship-style';
import type { RepoMapping } from './popular-repos';
import type { GitHubMetadata } from './github-extractor';

export interface SelectionResult {
  selected: RepoMapping[];
  cancelled: boolean;
}

/**
 * Show interactive list when multiple repos match
 */
export async function selectFromMultiple(
  query: string,
  repos: RepoMapping[],
  metadata?: Map<string, GitHubMetadata>
): Promise<SelectionResult> {
  console.log();
  console.log(FAF_COLORS.fafOrange(`Multiple repositories found for '${query}':`));
  console.log();

  // Build choices with rich information
  const choices = repos.map((repo, index) => {
    const meta = metadata?.get(`${repo.owner}/${repo.repo}`);

    const displayName = `[${index + 1}] ${repo.owner}/${repo.repo}`;
    let description = '';

    if (meta) {
      // Add description
      if (meta.description) {
        description += chalk.gray(meta.description.substring(0, 60));
        if (meta.description.length > 60) {description += chalk.gray('...');}
      }

      // Add stats
      const stats: string[] = [];
      if (meta.stars) {stats.push(`⭐ ${meta.stars}`);}
      if (meta.license) {stats.push(`📄 ${meta.license}`);}
      if (meta.languages && meta.languages.length > 0) {
        const mainLang = meta.languages[0].split(' ')[0];
        stats.push(`🔧 ${mainLang}`);
      }

      if (stats.length > 0) {
        description += `\n       ${  chalk.gray(stats.join('  '))}`;
      }
    } else {
      // Fallback to registry data
      if (repo.category) {
        description += chalk.gray(`${repo.category}`);
      }
      if (repo.weeklyDownloads) {
        const downloads = formatDownloads(repo.weeklyDownloads);
        description += chalk.gray(` • ${downloads}`);
      }
    }

    return {
      name: description ? `${displayName}\n       ${description}` : displayName,
      value: repo,
      short: `${repo.owner}/${repo.repo}`
    };
  });

  // Add "All" option for comparison
  choices.push({
    name: chalk.cyan('[all] Generate .faf for all repositories (comparison mode)'),
    value: 'all' as any,
    short: 'all'
  });

  // Add separator
  choices.push(new inquirer.Separator() as any);

  try {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message: 'Select repository:',
        choices,
        pageSize: 15,
        loop: false,
      }
    ]);

    if (answer.selection === 'all') {
      return {
        selected: repos,
        cancelled: false
      };
    }

    return {
      selected: [answer.selection],
      cancelled: false
    };
  } catch {
    // User cancelled (Ctrl+C)
    return {
      selected: [],
      cancelled: true
    };
  }
}

/**
 * Show confirmation for typo correction
 */
export async function confirmTypoCorrection(
  query: string,
  suggestedRepo: RepoMapping
): Promise<boolean> {
  console.log();
  console.log(
    chalk.yellow(`⚠️  Did you mean '${suggestedRepo.shorthand}' (${suggestedRepo.owner}/${suggestedRepo.repo})?`)
  );

  try {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Use this repository?',
        default: true
      }
    ]);

    return answer.confirmed;
  } catch {
    // User cancelled
    return false;
  }
}

/**
 * Show error when no repos found
 */
export function showNoReposFound(query: string): void {
  console.log();
  console.log(chalk.red(`❌ No repositories found for '${query}'`));
  console.log();
  console.log(chalk.gray('Suggestions:'));
  console.log(chalk.gray('  • Check spelling'));
  console.log(chalk.gray(`  • Use full URL: faf git https://github.com/owner/repo`));
  console.log(chalk.gray(`  • Use owner/repo: faf git owner/repo`));
  console.log(chalk.gray(`  • Browse popular repos: faf git --list`));
  console.log();
}

/**
 * Show rate limit warning
 */
export function showRateLimitWarning(): void {
  console.log();
  console.log(chalk.yellow('⚠️  GitHub API rate limit exceeded'));
  console.log();
  console.log(chalk.gray('Options:'));
  console.log(chalk.gray('  1. Wait ~1 hour for rate limit reset'));
  console.log(chalk.gray('  2. Set GITHUB_TOKEN environment variable:'));
  console.log(chalk.gray('     export GITHUB_TOKEN=your_github_token'));
  console.log(chalk.gray('     (Increases limit from 60 to 5000 requests/hour)'));
  console.log();
}

/**
 * Show list of popular repositories
 */
export function showPopularRepos(repos: RepoMapping[], category?: string): void {
  console.log();
  if (category) {
    console.log(FAF_COLORS.fafCyan(`🏆 Popular ${category} Repositories`));
  } else {
    console.log(FAF_COLORS.fafCyan('🏆 Popular Repositories'));
  }
  console.log(FAF_COLORS.fafCyan('═'.repeat(50)));
  console.log();

  // Group by category
  const grouped = new Map<string, RepoMapping[]>();
  for (const repo of repos) {
    if (!grouped.has(repo.category)) {
      grouped.set(repo.category, []);
    }
    grouped.get(repo.category)!.push(repo);
  }

  // Sort categories
  const sortedCategories = Array.from(grouped.keys()).sort();

  for (const cat of sortedCategories) {
    const catRepos = grouped.get(cat)!;

    console.log(FAF_COLORS.fafOrange(`${cat.toUpperCase()}:`));

    for (const repo of catRepos.slice(0, 10)) { // Limit to top 10 per category
      const shorthand = chalk.cyan(repo.shorthand.padEnd(15));
      const fullName = chalk.gray(`${repo.owner}/${repo.repo}`);
      const downloads = repo.weeklyDownloads
        ? chalk.gray(`(${formatDownloads(repo.weeklyDownloads)})`)
        : '';

      console.log(`  ${shorthand} ${fullName} ${downloads}`);
    }

    console.log();
  }

  console.log(chalk.gray('Usage: faf git <shorthand>'));
  console.log(chalk.gray('Example: faf git react'));
  console.log();
}

/**
 * Format downloads for display
 */
function formatDownloads(downloads: number): string {
  if (downloads >= 1_000_000) {
    return `${(downloads / 1_000_000).toFixed(1)}M/week`;
  }
  if (downloads >= 1_000) {
    return `${(downloads / 1_000).toFixed(0)}K/week`;
  }
  return `${downloads}/week`;
}

/**
 * Show extraction progress
 */
export function showExtractionProgress(owner: string, repo: string): void {
  console.log();
  console.log(FAF_COLORS.fafCyan(`⚡ Extracting context for ${owner}/${repo}...`));
}

/**
 * Get tier emoji and name for score
 */
function getScoreTier(score: number): { emoji: string; name: string } {
  if (score >= 100) return { emoji: '🏆', name: 'Trophy' };
  if (score >= 99) return { emoji: '🥇', name: 'Gold' };
  if (score >= 95) return { emoji: '🥈', name: 'Silver' };
  if (score >= 85) return { emoji: '🥉', name: 'Bronze' };
  if (score >= 70) return { emoji: '🟢', name: 'Green' };
  if (score >= 55) return { emoji: '🟡', name: 'Yellow' };
  return { emoji: '🔴', name: 'Red' };
}

/**
 * Show extraction success with before/after scoring
 */
export function showExtractionSuccess(
  owner: string,
  repo: string,
  outputPath: string,
  currentScore: number,
  newScore: number
): void {
  console.log();
  console.log(FAF_COLORS.fafCyan('📊 Analysis Complete'));
  console.log();

  // AI-Readiness score
  const newTier = getScoreTier(newScore);
  console.log(
    `   AI-Readiness: ${chalk.bold(newScore + '%')} ${newTier.emoji} ${chalk.gray(newTier.name)}`
  );

  console.log();
  console.log(FAF_COLORS.fafOrange('   ✨ Full project context extracted'));

  console.log();
  console.log(FAF_COLORS.fafGreen(`☑️  Generated ${outputPath}`));
  console.log(chalk.gray(`   📁 Saved to: ${process.cwd()}/${outputPath}`));
  console.log();
  console.log(chalk.gray('Next steps:'));
  console.log(chalk.gray(`  • View it: cat ${outputPath}`));
  console.log(chalk.gray(`  • Attach to Claude/ChatGPT/Gemini (copy/paste or attach file)`));
  console.log(chalk.gray(`  • Or try: faf show ${outputPath}`));
  console.log();
}

/**
 * Show batch extraction summary
 */
export function showBatchSummary(results: Array<{ repo: string; success: boolean; outputPath?: string }>): void {
  console.log();
  console.log(FAF_COLORS.fafCyan('🏁 Batch Extraction Complete'));
  console.log(FAF_COLORS.fafCyan('═'.repeat(50)));
  console.log();

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(FAF_COLORS.fafGreen(`☑️  Successful: ${successful.length}`));
  if (failed.length > 0) {
    console.log(chalk.red(`❌ Failed: ${failed.length}`));
  }
  console.log();

  if (successful.length > 0) {
    console.log(chalk.gray('Generated files:'));
    for (const result of successful) {
      console.log(chalk.gray(`  • ${result.outputPath}`));
    }
    console.log();
  }

  if (failed.length > 0) {
    console.log(chalk.red('Failed repositories:'));
    for (const result of failed) {
      console.log(chalk.red(`  • ${result.repo}`));
    }
    console.log();
  }
}
