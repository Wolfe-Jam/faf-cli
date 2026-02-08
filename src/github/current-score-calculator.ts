/**
 * 🏆 Current Score Calculator
 *
 * Calculates AI-readiness score for repos AS THEY ARE (before FAF enhancement)
 *
 * Strategy:
 * - Check if .faf exists → score it
 * - No .faf → calculate baseline from README + package.json
 */

import type { GitHubMetadata } from './github-extractor';
import { fetchGitHubFileContent } from './github-extractor';

/**
 * Calculate current score (repo as-is, before FAF generation)
 */
export async function calculateCurrentScore(
  metadata: GitHubMetadata,
  files: any[]
): Promise<number> {
  // Check if repo has existing .faf file
  const hasFaf = files.some(f =>
    f.path === 'project.faf' ||
    f.path === '.faf' ||
    f.path.endsWith('.faf')
  );

  if (hasFaf) {
    // Repo has .faf - score it
    try {
      const fafFile = files.find(f => f.path === 'project.faf' || f.path === '.faf');
      if (fafFile) {
        const fafContent = await fetchGitHubFileContent(
          metadata.owner,
          metadata.repo,
          fafFile.path,
          metadata.defaultBranch || 'main'
        );
        if (fafContent) {
          return scoreFafContent(fafContent);
        }
      }
    } catch (error) {
      // Fallback to baseline if can't fetch .faf
      console.error('Failed to fetch existing .faf:', error);
    }
  }

  // No .faf file - calculate baseline score from available data
  return calculateBaselineScore(metadata, files);
}

/**
 * Score existing .faf content (simplified version)
 */
function scoreFafContent(fafContent: string): number {
  let score = 0;

  // Basic presence checks (10 points each, max 60)
  const checks = [
    { pattern: /project:/i, points: 10 },
    { pattern: /stack:/i, points: 10 },
    { pattern: /human_context:/i, points: 10 },
    { pattern: /ai_instructions:/i, points: 10 },
    { pattern: /what:/i, points: 10 },
    { pattern: /why:/i, points: 10 },
  ];

  for (const check of checks) {
    if (check.pattern.test(fafContent)) {
      score += check.points;
    }
  }

  // Quality indicators (5 points each, max 40)
  const qualityChecks = [
    { pattern: /name:\s*\S+/, points: 5 },
    { pattern: /goal:\s*\S+/, points: 5 },
    { pattern: /main_language:\s*\S+/, points: 5 },
    { pattern: /type:\s*\S+/, points: 5 },
    { pattern: /who:\s*\S+/, points: 5 },
    { pattern: /where:\s*\S+/, points: 5 },
    { pattern: /when:\s*\S+/, points: 5 },
    { pattern: /how:\s*\S+/, points: 5 },
  ];

  for (const check of qualityChecks) {
    if (check.pattern.test(fafContent)) {
      score += check.points;
    }
  }

  return Math.min(score, 100);
}

/**
 * Calculate baseline score from README + package.json (no .faf)
 */
function calculateBaselineScore(metadata: GitHubMetadata, files: any[]): number {
  let score = 0;

  // Has README (+10)
  if (metadata.readme || files.some(f => f.path.toLowerCase().includes('readme'))) {
    score += 10;
  }

  // Has package.json (+10)
  if (metadata.hasPackageJson) {
    score += 10;
  }

  // Has description (+5)
  if (metadata.description && metadata.description.length > 20) {
    score += 5;
  }

  // Has topics/tags (+5)
  if (metadata.topics && metadata.topics.length > 0) {
    score += 5;
  }

  // Popular repo (+5 for 1K+ stars)
  const stars = parseInt(metadata.stars || '0');
  if (stars >= 1000) {
    score += 5;
  }

  // Has license (+5)
  if (metadata.license) {
    score += 5;
  }

  // Recently updated (+5 for < 90 days)
  if (metadata.lastUpdated) {
    const lastUpdate = new Date(metadata.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 90) {
      score += 5;
    }
  }

  // Has multiple languages (+5)
  if (metadata.languages && metadata.languages.length > 1) {
    score += 5;
  }

  // Baseline repos typically score 20-50%
  // This is intentionally low to show FAF's value
  return Math.min(score, 50);
}
