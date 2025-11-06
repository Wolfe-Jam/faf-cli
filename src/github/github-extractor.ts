/**
 * 🏆 GitHub Repository Metadata Extractor
 *
 * Port of Chrome Extension GitHub extraction logic for CLI
 * Fetches rich metadata without cloning the repository
 */

export interface GitHubMetadata {
  owner: string;
  repo: string;
  url: string;
  description?: string;
  topics?: string[];
  stars?: string;
  forks?: string;
  license?: string;
  languages?: string[];
  lastUpdated?: string;
  defaultBranch?: string;
  openIssues?: number;
  watchers?: number;
  readme?: boolean;
  hasPackageJson?: boolean;
  hasTsConfig?: boolean;
  hasDockerfile?: boolean;
}

export interface GitHubFile {
  path: string;
  type: 'file' | 'dir';
  size?: number;
  url?: string;
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    // Handle different URL formats:
    // https://github.com/owner/repo
    // github.com/owner/repo
    // owner/repo

    // Strip query parameters and hash fragments first
    let cleanedUrl = url.split('?')[0].split('#')[0];

    // First, check if it's actually a GitHub URL (if it contains a domain)
    if (cleanedUrl.includes('://') || cleanedUrl.includes('.com')) {
      // Extract domain to validate it's GitHub
      const domainMatch = cleanedUrl.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
      if (domainMatch && domainMatch[1] !== 'github.com') {
        return null; // Not a GitHub URL
      }
    }

    // Clean the URL: remove protocol and GitHub domain (with or without www)
    const cleanUrl = cleanedUrl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/^github\.com\//, '');

    const parts = cleanUrl.split('/').filter(Boolean);

    if (parts.length >= 2) {
      const owner = parts[0];
      let repo = parts[1];

      // Strip .git extension if present
      repo = repo.replace(/\.git$/, '');

      // Strip /tree/, /blob/, /releases/, /issues/ etc
      const validParts = ['tree', 'blob', 'releases', 'issues', 'pull', 'wiki'];
      if (parts.length > 2 && validParts.includes(parts[2])) {
        // URL like owner/repo/blob/main/file.ts
        // We just want owner/repo
      }

      return { owner, repo };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch repository metadata from GitHub API
 * (No auth required for public repos, 60 requests/hour limit)
 */
export async function fetchGitHubMetadata(
  owner: string,
  repo: string,
  includeFiles: boolean = false
): Promise<GitHubMetadata> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'faf-cli'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found`);
      }
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Try again later or set GITHUB_TOKEN.');
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract metadata
    const metadata: GitHubMetadata = {
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}`,
      description: data.description || undefined,
      topics: data.topics || undefined,
      stars: formatNumber(data.stargazers_count),
      forks: formatNumber(data.forks_count),
      license: data.license?.spdx_id || data.license?.name || undefined,
      lastUpdated: data.updated_at || data.pushed_at || undefined,
      defaultBranch: data.default_branch || 'main',
      openIssues: data.open_issues_count || 0,
      watchers: data.watchers_count || 0,
    };

    // Fetch language breakdown
    if (data.languages_url) {
      const langResponse = await fetch(data.languages_url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'faf-cli'
        }
      });

      if (langResponse.ok) {
        const languages = await langResponse.json();
        const total = Object.values(languages).reduce((sum: number, bytes: any) => sum + bytes, 0);

        metadata.languages = Object.entries(languages)
          .map(([lang, bytes]) => {
            const percentage = ((bytes as number / total) * 100).toFixed(1);
            return `${lang} (${percentage}%)`;
          })
          .sort((a, b) => {
            const aPercent = parseFloat(a.match(/\((.+)%\)/)?.[1] || '0');
            const bPercent = parseFloat(b.match(/\((.+)%\)/)?.[1] || '0');
            return bPercent - aPercent;
          });
      }
    }

    // Check for common files (if requested)
    if (includeFiles) {
      const fileChecks = await Promise.allSettled([
        checkFileExists(owner, repo, 'README.md', metadata.defaultBranch),
        checkFileExists(owner, repo, 'package.json', metadata.defaultBranch),
        checkFileExists(owner, repo, 'tsconfig.json', metadata.defaultBranch),
        checkFileExists(owner, repo, 'Dockerfile', metadata.defaultBranch),
      ]);

      metadata.readme = fileChecks[0].status === 'fulfilled' && fileChecks[0].value;
      metadata.hasPackageJson = fileChecks[1].status === 'fulfilled' && fileChecks[1].value;
      metadata.hasTsConfig = fileChecks[2].status === 'fulfilled' && fileChecks[2].value;
      metadata.hasDockerfile = fileChecks[3].status === 'fulfilled' && fileChecks[3].value;
    }

    return metadata;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch GitHub metadata: ${String(error)}`);
  }
}

/**
 * Check if a file exists in the repository
 */
async function checkFileExists(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<boolean> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'faf-cli'
      }
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch repository file tree
 */
export async function fetchGitHubFileTree(
  owner: string,
  repo: string,
  branch: string = 'main',
  path: string = ''
): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'faf-cli'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file tree: ${response.status}`);
    }

    const data = await response.json();

    // API returns an array for directories, object for files
    const items = Array.isArray(data) ? data : [data];

    return items.map((item: any) => ({
      path: item.path,
      type: item.type === 'dir' ? 'dir' : 'file',
      size: item.size,
      url: item.html_url,
    }));
  } catch (error) {
    console.warn(`Failed to fetch file tree: ${error}`);
    return [];
  }
}

/**
 * Format large numbers with K/M suffix
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Detect framework/stack from repository metadata
 */
export function detectStackFromMetadata(metadata: GitHubMetadata): string[] {
  const stacks: string[] = [];

  // From topics
  if (metadata.topics) {
    const topicMap: Record<string, string> = {
      'react': 'React',
      'nextjs': 'Next.js',
      'vue': 'Vue',
      'svelte': 'Svelte',
      'angular': 'Angular',
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'nodejs': 'Node.js',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
    };

    for (const topic of metadata.topics) {
      const normalized = topic.toLowerCase();
      if (topicMap[normalized]) {
        stacks.push(topicMap[normalized]);
      }
    }
  }

  // From languages
  if (metadata.languages) {
    for (const lang of metadata.languages) {
      const language = lang.split(' ')[0]; // Extract "TypeScript" from "TypeScript (85.3%)"
      if (!stacks.includes(language)) {
        stacks.push(language);
      }
    }
  }

  // From file presence
  if (metadata.hasPackageJson) {
    if (!stacks.includes('Node.js')) stacks.push('Node.js');
  }
  if (metadata.hasTsConfig) {
    if (!stacks.includes('TypeScript')) stacks.push('TypeScript');
  }
  if (metadata.hasDockerfile) {
    if (!stacks.includes('Docker')) stacks.push('Docker');
  }

  return stacks;
}

/**
 * Generate quality score based on metadata
 */
export function calculateRepoQualityScore(metadata: GitHubMetadata): number {
  let score = 0;

  // Stars (max 30 points)
  const stars = parseStars(metadata.stars);
  if (stars >= 10000) score += 30;
  else if (stars >= 5000) score += 25;
  else if (stars >= 1000) score += 20;
  else if (stars >= 500) score += 15;
  else if (stars >= 100) score += 10;
  else if (stars >= 10) score += 5;

  // Has description (10 points)
  if (metadata.description && metadata.description.length > 10) score += 10;

  // Has topics (10 points)
  if (metadata.topics && metadata.topics.length > 0) score += 10;

  // Has license (10 points)
  if (metadata.license) score += 10;

  // Has README (10 points)
  if (metadata.readme) score += 10;

  // Recent activity (10 points)
  if (metadata.lastUpdated) {
    const lastUpdate = new Date(metadata.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate < 30) score += 10;
    else if (daysSinceUpdate < 90) score += 7;
    else if (daysSinceUpdate < 180) score += 5;
    else if (daysSinceUpdate < 365) score += 3;
  }

  // Has package.json (5 points)
  if (metadata.hasPackageJson) score += 5;

  // Has TypeScript (5 points)
  if (metadata.hasTsConfig) score += 5;

  // Language diversity (10 points)
  if (metadata.languages) {
    if (metadata.languages.length >= 3) score += 10;
    else if (metadata.languages.length >= 2) score += 5;
  }

  return Math.min(100, score);
}

/**
 * Parse star count string to number
 */
function parseStars(stars?: string): number {
  if (!stars) return 0;

  const match = stars.match(/^([\d.]+)([KM]?)$/);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const suffix = match[2];

  if (suffix === 'K') return num * 1000;
  if (suffix === 'M') return num * 1_000_000;
  return num;
}
