/**
 * 🏆 Popular GitHub Repositories Registry
 *
 * Top 100 most-used repositories for instant shorthand resolution
 * Organized by category for maintainability
 */

export interface RepoMapping {
  shorthand: string;
  owner: string;
  repo: string;
  category: string;
  weeklyDownloads?: number;
}

/**
 * Popular repository mappings
 * Format: shorthand → { owner, repo, category }
 */
export const POPULAR_REPOS: Record<string, RepoMapping> = {
  // ===== FRAMEWORKS (TROPHY TIER 🏆) =====
  'react': { shorthand: 'react', owner: 'facebook', repo: 'react', category: 'framework', weeklyDownloads: 20_000_000 },
  'next': { shorthand: 'next', owner: 'vercel', repo: 'next.js', category: 'framework', weeklyDownloads: 5_000_000 },
  'nextjs': { shorthand: 'nextjs', owner: 'vercel', repo: 'next.js', category: 'framework', weeklyDownloads: 5_000_000 },
  'vue': { shorthand: 'vue', owner: 'vuejs', repo: 'core', category: 'framework', weeklyDownloads: 4_500_000 },
  'svelte': { shorthand: 'svelte', owner: 'sveltejs', repo: 'svelte', category: 'framework', weeklyDownloads: 400_000 },
  'angular': { shorthand: 'angular', owner: 'angular', repo: 'angular', category: 'framework', weeklyDownloads: 2_500_000 },

  // ===== LANGUAGES & RUNTIMES =====
  'typescript': { shorthand: 'typescript', owner: 'microsoft', repo: 'TypeScript', category: 'language', weeklyDownloads: 40_000_000 },
  'node': { shorthand: 'node', owner: 'nodejs', repo: 'node', category: 'runtime', weeklyDownloads: 50_000_000 },
  'deno': { shorthand: 'deno', owner: 'denoland', repo: 'deno', category: 'runtime', weeklyDownloads: 100_000 },
  'bun': { shorthand: 'bun', owner: 'oven-sh', repo: 'bun', category: 'runtime', weeklyDownloads: 500_000 },

  // ===== BUILD TOOLS (GOLD TIER 🥇) =====
  'vite': { shorthand: 'vite', owner: 'vitejs', repo: 'vite', category: 'build-tool', weeklyDownloads: 9_000_000 },
  'webpack': { shorthand: 'webpack', owner: 'webpack', repo: 'webpack', category: 'build-tool', weeklyDownloads: 20_000_000 },
  'rollup': { shorthand: 'rollup', owner: 'rollup', repo: 'rollup', category: 'build-tool', weeklyDownloads: 8_000_000 },
  'esbuild': { shorthand: 'esbuild', owner: 'evanw', repo: 'esbuild', category: 'build-tool', weeklyDownloads: 15_000_000 },
  'turbo': { shorthand: 'turbo', owner: 'vercel', repo: 'turbo', category: 'build-tool', weeklyDownloads: 1_000_000 },
  'turborepo': { shorthand: 'turborepo', owner: 'vercel', repo: 'turbo', category: 'build-tool', weeklyDownloads: 1_000_000 },

  // ===== STYLING =====
  'tailwind': { shorthand: 'tailwind', owner: 'tailwindlabs', repo: 'tailwindcss', category: 'styling', weeklyDownloads: 7_000_000 },
  'tailwindcss': { shorthand: 'tailwindcss', owner: 'tailwindlabs', repo: 'tailwindcss', category: 'styling', weeklyDownloads: 7_000_000 },
  'sass': { shorthand: 'sass', owner: 'sass', repo: 'sass', category: 'styling', weeklyDownloads: 10_000_000 },
  'postcss': { shorthand: 'postcss', owner: 'postcss', repo: 'postcss', category: 'styling', weeklyDownloads: 20_000_000 },

  // ===== STATE MANAGEMENT =====
  'redux': { shorthand: 'redux', owner: 'reduxjs', repo: 'redux', category: 'state', weeklyDownloads: 6_000_000 },
  'zustand': { shorthand: 'zustand', owner: 'pmndrs', repo: 'zustand', category: 'state', weeklyDownloads: 1_500_000 },
  'mobx': { shorthand: 'mobx', owner: 'mobxjs', repo: 'mobx', category: 'state', weeklyDownloads: 1_000_000 },
  'jotai': { shorthand: 'jotai', owner: 'pmndrs', repo: 'jotai', category: 'state', weeklyDownloads: 500_000 },

  // ===== VALIDATION =====
  'zod': { shorthand: 'zod', owner: 'colinhacks', repo: 'zod', category: 'validation', weeklyDownloads: 5_000_000 },
  'yup': { shorthand: 'yup', owner: 'jquense', repo: 'yup', category: 'validation', weeklyDownloads: 3_000_000 },

  // ===== TESTING =====
  'jest': { shorthand: 'jest', owner: 'jestjs', repo: 'jest', category: 'testing', weeklyDownloads: 20_000_000 },
  'vitest': { shorthand: 'vitest', owner: 'vitest-dev', repo: 'vitest', category: 'testing', weeklyDownloads: 3_000_000 },
  'playwright': { shorthand: 'playwright', owner: 'microsoft', repo: 'playwright', category: 'testing', weeklyDownloads: 3_000_000 },
  'cypress': { shorthand: 'cypress', owner: 'cypress-io', repo: 'cypress', category: 'testing', weeklyDownloads: 4_000_000 },

  // ===== DATABASES & ORM =====
  'prisma': { shorthand: 'prisma', owner: 'prisma', repo: 'prisma', category: 'database', weeklyDownloads: 2_000_000 },
  'drizzle': { shorthand: 'drizzle', owner: 'drizzle-team', repo: 'drizzle-orm', category: 'database', weeklyDownloads: 500_000 },
  'mongoose': { shorthand: 'mongoose', owner: 'Automattic', repo: 'mongoose', category: 'database', weeklyDownloads: 3_000_000 },
  'typeorm': { shorthand: 'typeorm', owner: 'typeorm', repo: 'typeorm', category: 'database', weeklyDownloads: 2_000_000 },

  // ===== AUTHENTICATION =====
  'nextauth': { shorthand: 'nextauth', owner: 'nextauthjs', repo: 'next-auth', category: 'auth', weeklyDownloads: 1_000_000 },
  'lucia': { shorthand: 'lucia', owner: 'lucia-auth', repo: 'lucia', category: 'auth', weeklyDownloads: 100_000 },
  'passport': { shorthand: 'passport', owner: 'jaredhanson', repo: 'passport', category: 'auth', weeklyDownloads: 2_000_000 },

  // ===== API & HTTP =====
  'axios': { shorthand: 'axios', owner: 'axios', repo: 'axios', category: 'http', weeklyDownloads: 30_000_000 },
  'fetch': { shorthand: 'fetch', owner: 'node-fetch', repo: 'node-fetch', category: 'http', weeklyDownloads: 25_000_000 },
  'graphql': { shorthand: 'graphql', owner: 'graphql', repo: 'graphql-js', category: 'api', weeklyDownloads: 8_000_000 },
  'apollo': { shorthand: 'apollo', owner: 'apollographql', repo: 'apollo-client', category: 'api', weeklyDownloads: 1_500_000 },
  'trpc': { shorthand: 'trpc', owner: 'trpc', repo: 'trpc', category: 'api', weeklyDownloads: 800_000 },

  // ===== UI LIBRARIES =====
  'shadcn': { shorthand: 'shadcn', owner: 'shadcn-ui', repo: 'ui', category: 'ui', weeklyDownloads: 500_000 },
  'radix': { shorthand: 'radix', owner: 'radix-ui', repo: 'primitives', category: 'ui', weeklyDownloads: 2_000_000 },
  'mui': { shorthand: 'mui', owner: 'mui', repo: 'material-ui', category: 'ui', weeklyDownloads: 3_000_000 },
  'chakra': { shorthand: 'chakra', owner: 'chakra-ui', repo: 'chakra-ui', category: 'ui', weeklyDownloads: 1_000_000 },

  // ===== UTILITIES =====
  'lodash': { shorthand: 'lodash', owner: 'lodash', repo: 'lodash', category: 'utility', weeklyDownloads: 40_000_000 },
  'dayjs': { shorthand: 'dayjs', owner: 'iamkun', repo: 'dayjs', category: 'utility', weeklyDownloads: 10_000_000 },
  'date-fns': { shorthand: 'date-fns', owner: 'date-fns', repo: 'date-fns', category: 'utility', weeklyDownloads: 12_000_000 },

  // ===== LINTING & FORMATTING =====
  'eslint': { shorthand: 'eslint', owner: 'eslint', repo: 'eslint', category: 'linting', weeklyDownloads: 25_000_000 },
  'prettier': { shorthand: 'prettier', owner: 'prettier', repo: 'prettier', category: 'formatting', weeklyDownloads: 20_000_000 },
  'biome': { shorthand: 'biome', owner: 'biomejs', repo: 'biome', category: 'linting', weeklyDownloads: 200_000 },

  // ===== DEPLOYMENT & INFRASTRUCTURE =====
  'docker': { shorthand: 'docker', owner: 'docker', repo: 'docker', category: 'infrastructure', weeklyDownloads: 10_000_000 },
  'kubernetes': { shorthand: 'kubernetes', owner: 'kubernetes', repo: 'kubernetes', category: 'infrastructure', weeklyDownloads: 5_000_000 },
  'k8s': { shorthand: 'k8s', owner: 'kubernetes', repo: 'kubernetes', category: 'infrastructure', weeklyDownloads: 5_000_000 },

  // ===== FAF ECOSYSTEM =====
  'faf': { shorthand: 'faf', owner: 'Wolfe-Jam', repo: 'faf-cli', category: 'faf', weeklyDownloads: 5_000 },
  'faf-cli': { shorthand: 'faf-cli', owner: 'Wolfe-Jam', repo: 'faf-cli', category: 'faf', weeklyDownloads: 5_000 },
  'faf-mcp': { shorthand: 'faf-mcp', owner: 'Wolfe-Jam', repo: 'claude-faf-mcp', category: 'faf', weeklyDownloads: 3_600 },
  'claude-faf-mcp': { shorthand: 'claude-faf-mcp', owner: 'Wolfe-Jam', repo: 'claude-faf-mcp', category: 'faf', weeklyDownloads: 3_600 },

  // ===== WORKFLOW AUTOMATION (TURBO) =====
  'n8n': { shorthand: 'n8n', owner: 'n8n-io', repo: 'n8n', category: 'automation', weeklyDownloads: 401_000 },
};

/**
 * Get repo info from shorthand
 */
export function resolveShorthand(query: string): RepoMapping | null {
  const normalized = query.toLowerCase().trim();
  return POPULAR_REPOS[normalized] || null;
}

/**
 * Search for repos matching query (fuzzy)
 */
export function searchRepos(query: string, limit: number = 10): RepoMapping[] {
  const normalized = query.toLowerCase().trim();
  const results: Array<{ repo: RepoMapping; score: number }> = [];

  for (const [key, repo] of Object.entries(POPULAR_REPOS)) {
    let score = 0;

    // Exact match (highest priority)
    if (key === normalized) {
      score = 1000;
    }
    // Starts with query
    else if (key.startsWith(normalized)) {
      score = 500;
    }
    // Contains query
    else if (key.includes(normalized)) {
      score = 250;
    }
    // Repo name matches
    else if (repo.repo.toLowerCase().includes(normalized)) {
      score = 100;
    }
    // Owner matches
    else if (repo.owner.toLowerCase().includes(normalized)) {
      score = 50;
    }

    if (score > 0) {
      // Boost by popularity (weekly downloads)
      if (repo.weeklyDownloads) {
        score += Math.log10(repo.weeklyDownloads);
      }

      results.push({ repo, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit).map(r => r.repo);
}

/**
 * Get all repos in a category
 */
export function getReposByCategory(category: string): RepoMapping[] {
  return Object.values(POPULAR_REPOS)
    .filter(repo => repo.category === category)
    .sort((a, b) => (b.weeklyDownloads || 0) - (a.weeklyDownloads || 0));
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const categories = new Set<string>();
  for (const repo of Object.values(POPULAR_REPOS)) {
    categories.add(repo.category);
  }
  return Array.from(categories).sort();
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find closest match for typo correction
 */
export function findClosestMatch(query: string, maxDistance: number = 2): RepoMapping | null {
  const normalized = query.toLowerCase().trim();
  let closestRepo: RepoMapping | null = null;
  let closestDistance = Infinity;

  for (const [key, repo] of Object.entries(POPULAR_REPOS)) {
    const distance = levenshteinDistance(normalized, key);

    if (distance <= maxDistance && distance < closestDistance) {
      closestDistance = distance;
      closestRepo = repo;
    }
  }

  return closestRepo;
}
