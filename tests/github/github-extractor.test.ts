/**
 * 🏆 Tests for github-extractor.ts
 *
 * WJTTC Prize Asset: GitHub API Integration & Metadata Extraction
 */

import {
  parseGitHubUrl,
  detectStackFromMetadata,
  calculateRepoQualityScore,
  type GitHubMetadata
} from '../../src/github/github-extractor';

describe('GitHub Extractor - URL Parsing', () => {
  describe('parseGitHubUrl', () => {
    it('should parse full GitHub URL', () => {
      const result = parseGitHubUrl('https://github.com/facebook/react');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should parse GitHub URL without https', () => {
      const result = parseGitHubUrl('github.com/facebook/react');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should parse owner/repo format', () => {
      const result = parseGitHubUrl('facebook/react');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should handle .git extension', () => {
      const result = parseGitHubUrl('https://github.com/facebook/react.git');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should handle trailing slash', () => {
      const result = parseGitHubUrl('https://github.com/facebook/react/');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should return null for invalid format', () => {
      const result = parseGitHubUrl('not-a-github-url');
      expect(result).toBeNull();
    });

    it('should return null for single word', () => {
      const result = parseGitHubUrl('react');
      expect(result).toBeNull();
    });

    it('should handle repos with hyphens', () => {
      const result = parseGitHubUrl('vercel/next.js');
      expect(result).toEqual({ owner: 'vercel', repo: 'next.js' });
    });

    it('should handle repos with dots', () => {
      const result = parseGitHubUrl('nodejs/node.js');
      expect(result).toEqual({ owner: 'nodejs', repo: 'node.js' });
    });

    it('should handle repos with underscores', () => {
      const result = parseGitHubUrl('wolfe-jam/faf_cli');
      expect(result).toEqual({ owner: 'wolfe-jam', repo: 'faf_cli' });
    });

    it('should handle repos with numbers', () => {
      const result = parseGitHubUrl('n8n-io/n8n');
      expect(result).toEqual({ owner: 'n8n-io', repo: 'n8n' });
    });
  });

  describe('Edge Cases - URL Parsing', () => {
    it('should handle URL with query parameters', () => {
      const result = parseGitHubUrl('https://github.com/facebook/react?tab=readme');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should handle URL with hash fragments', () => {
      const result = parseGitHubUrl('https://github.com/facebook/react#readme');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should handle www subdomain', () => {
      const result = parseGitHubUrl('https://www.github.com/facebook/react');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should handle URL with tree/branch paths', () => {
      const result = parseGitHubUrl('https://github.com/facebook/react/tree/main');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should handle URL with blob/file paths', () => {
      const result = parseGitHubUrl('https://github.com/facebook/react/blob/main/README.md');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should return null for empty string', () => {
      const result = parseGitHubUrl('');
      expect(result).toBeNull();
    });

    it('should return null for whitespace', () => {
      const result = parseGitHubUrl('   ');
      expect(result).toBeNull();
    });

    it('should return null for non-GitHub URLs', () => {
      const result = parseGitHubUrl('https://gitlab.com/owner/repo');
      expect(result).toBeNull();
    });
  });
});

describe('GitHub Extractor - Stack Detection', () => {
  describe('detectStackFromMetadata', () => {
    it('should detect React from topics', () => {
      const metadata: GitHubMetadata = {
        owner: 'facebook',
        repo: 'react',
        url: 'https://github.com/facebook/react',
        topics: ['react', 'javascript', 'ui'],
        defaultBranch: 'main'
      };

      const stacks = detectStackFromMetadata(metadata);
      expect(stacks).toContain('React');
    });

    it('should detect TypeScript from languages', () => {
      const metadata: GitHubMetadata = {
        owner: 'microsoft',
        repo: 'TypeScript',
        url: 'https://github.com/microsoft/TypeScript',
        languages: ['TypeScript (90.5%)', 'JavaScript (9.5%)'],
        defaultBranch: 'main'
      };

      const stacks = detectStackFromMetadata(metadata);
      expect(stacks).toContain('TypeScript');
    });

    it('should detect Node.js from package.json flag', () => {
      const metadata: GitHubMetadata = {
        owner: 'nodejs',
        repo: 'node',
        url: 'https://github.com/nodejs/node',
        hasPackageJson: true,
        defaultBranch: 'main'
      };

      const stacks = detectStackFromMetadata(metadata);
      expect(stacks).toContain('Node.js');
    });

    it('should detect Docker from dockerfile flag', () => {
      const metadata: GitHubMetadata = {
        owner: 'docker',
        repo: 'example',
        url: 'https://github.com/docker/example',
        hasDockerfile: true,
        defaultBranch: 'main'
      };

      const stacks = detectStackFromMetadata(metadata);
      expect(stacks).toContain('Docker');
    });

    it('should detect multiple stacks', () => {
      const metadata: GitHubMetadata = {
        owner: 'vercel',
        repo: 'next.js',
        url: 'https://github.com/vercel/next.js',
        topics: ['react', 'nextjs', 'typescript'],
        languages: ['TypeScript (85.3%)', 'JavaScript (14.7%)'],
        hasPackageJson: true,
        hasTsConfig: true,
        defaultBranch: 'canary'
      };

      const stacks = detectStackFromMetadata(metadata);
      expect(stacks.length).toBeGreaterThan(1);
      expect(stacks).toContain('React');
      expect(stacks).toContain('TypeScript');
      expect(stacks).toContain('Node.js');
    });

    it('should return empty array for no detected stacks', () => {
      const metadata: GitHubMetadata = {
        owner: 'unknown',
        repo: 'unknown',
        url: 'https://github.com/unknown/unknown',
        defaultBranch: 'main'
      };

      const stacks = detectStackFromMetadata(metadata);
      expect(Array.isArray(stacks)).toBe(true);
    });

    it('should not duplicate stacks', () => {
      const metadata: GitHubMetadata = {
        owner: 'facebook',
        repo: 'react',
        url: 'https://github.com/facebook/react',
        topics: ['react', 'react-dom'],
        description: 'A react library for building user interfaces',
        defaultBranch: 'main'
      };

      const stacks = detectStackFromMetadata(metadata);
      const reactCount = stacks.filter(s => s === 'React').length;
      expect(reactCount).toBe(1);
    });
  });
});

describe('GitHub Extractor - Quality Scoring', () => {
  describe('calculateRepoQualityScore', () => {
    it('should give high score for popular active repo', () => {
      const metadata: GitHubMetadata = {
        owner: 'facebook',
        repo: 'react',
        url: 'https://github.com/facebook/react',
        description: 'A JavaScript library for building user interfaces',
        stars: '240000',
        forks: '49000',
        license: 'MIT',
        topics: ['react', 'javascript', 'ui', 'library'],
        languages: ['JavaScript (41.6%)', 'TypeScript (16.7%)'],
        readme: true,
        lastUpdated: new Date().toISOString(), // Recent
        defaultBranch: 'main'
      };

      const score = calculateRepoQualityScore(metadata);
      expect(score).toBeGreaterThanOrEqual(70); // Gold tier
    });

    it('should give medium score for decent repo', () => {
      const metadata: GitHubMetadata = {
        owner: 'wolfejam',
        repo: 'faf-cli',
        url: 'https://github.com/wolfejam/faf-cli',
        description: 'FAF CLI tool',
        stars: '5',
        license: 'MIT',
        topics: ['cli', 'faf'],
        readme: true,
        lastUpdated: new Date().toISOString(),
        defaultBranch: 'main'
      };

      const score = calculateRepoQualityScore(metadata);
      expect(score).toBeGreaterThanOrEqual(40); // Bronze tier
      expect(score).toBeLessThan(70);
    });

    it('should give low score for minimal repo', () => {
      const metadata: GitHubMetadata = {
        owner: 'user',
        repo: 'test',
        url: 'https://github.com/user/test',
        defaultBranch: 'main'
      };

      const score = calculateRepoQualityScore(metadata);
      expect(score).toBeLessThan(40);
    });

    it('should reward stars (>10k gets max points)', () => {
      const withStars: GitHubMetadata = {
        owner: 'popular',
        repo: 'repo',
        url: 'https://github.com/popular/repo',
        stars: '15000',
        defaultBranch: 'main'
      };

      const withoutStars: GitHubMetadata = {
        owner: 'popular',
        repo: 'repo',
        url: 'https://github.com/popular/repo',
        defaultBranch: 'main'
      };

      const scoreWith = calculateRepoQualityScore(withStars);
      const scoreWithout = calculateRepoQualityScore(withoutStars);
      expect(scoreWith).toBeGreaterThan(scoreWithout);
    });

    it('should reward description', () => {
      const withDesc: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        description: 'A comprehensive description of the project',
        defaultBranch: 'main'
      };

      const withoutDesc: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        defaultBranch: 'main'
      };

      const scoreWith = calculateRepoQualityScore(withDesc);
      const scoreWithout = calculateRepoQualityScore(withoutDesc);
      expect(scoreWith).toBeGreaterThan(scoreWithout);
    });

    it('should reward license', () => {
      const withLicense: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        license: 'MIT',
        defaultBranch: 'main'
      };

      const withoutLicense: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        defaultBranch: 'main'
      };

      const scoreWith = calculateRepoQualityScore(withLicense);
      const scoreWithout = calculateRepoQualityScore(withoutLicense);
      expect(scoreWith).toBeGreaterThan(scoreWithout);
    });

    it('should reward topics', () => {
      const withTopics: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        topics: ['react', 'typescript', 'cli'],
        defaultBranch: 'main'
      };

      const withoutTopics: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        defaultBranch: 'main'
      };

      const scoreWith = calculateRepoQualityScore(withTopics);
      const scoreWithout = calculateRepoQualityScore(withoutTopics);
      expect(scoreWith).toBeGreaterThan(scoreWithout);
    });

    it('should reward README', () => {
      const withReadme: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        readme: true,
        defaultBranch: 'main'
      };

      const withoutReadme: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        readme: false,
        defaultBranch: 'main'
      };

      const scoreWith = calculateRepoQualityScore(withReadme);
      const scoreWithout = calculateRepoQualityScore(withoutReadme);
      expect(scoreWith).toBeGreaterThan(scoreWithout);
    });

    it('should cap score at 100', () => {
      const maxMetadata: GitHubMetadata = {
        owner: 'perfect',
        repo: 'repo',
        url: 'https://github.com/perfect/repo',
        description: 'Perfect repository with all features',
        stars: '500000',
        forks: '100000',
        license: 'MIT',
        topics: ['a', 'b', 'c', 'd', 'e'],
        languages: ['TypeScript (100%)'],
        readme: true,
        lastUpdated: new Date().toISOString(),
        defaultBranch: 'main'
      };

      const score = calculateRepoQualityScore(maxMetadata);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should not give negative scores', () => {
      const emptyMetadata: GitHubMetadata = {
        owner: '',
        repo: '',
        url: '',
        defaultBranch: 'main'
      };

      const score = calculateRepoQualityScore(emptyMetadata);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Championship Edge Cases - Quality Scoring', () => {
    it('should handle very large star counts', () => {
      const metadata: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        stars: '999999999',
        defaultBranch: 'main'
      };

      const score = calculateRepoQualityScore(metadata);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle malformed star counts gracefully', () => {
      const metadata: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        stars: 'invalid',
        defaultBranch: 'main'
      };

      const score = calculateRepoQualityScore(metadata);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle old lastUpdated dates', () => {
      const metadata: GitHubMetadata = {
        owner: 'test',
        repo: 'repo',
        url: 'https://github.com/test/repo',
        lastUpdated: '2010-01-01T00:00:00Z', // Very old
        defaultBranch: 'main'
      };

      const score = calculateRepoQualityScore(metadata);
      // Should still score, but lose recency points
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });
});
