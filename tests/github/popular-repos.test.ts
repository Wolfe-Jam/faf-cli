/**
 * 🏆 Tests for popular-repos.ts
 *
 * WJTTC Prize Asset: Shorthand Resolution & Fuzzy Matching
 */

import {
  resolveShorthand,
  searchRepos,
  findClosestMatch,
  levenshteinDistance,
  getCategories,
  getReposByCategory,
  type RepoMapping
} from '../../src/github/popular-repos';

describe('Popular Repos - Shorthand Resolution', () => {
  describe('resolveShorthand', () => {
    it('should resolve exact shorthand (react)', () => {
      const result = resolveShorthand('react');
      expect(result).toBeDefined();
      expect(result?.owner).toBe('facebook');
      expect(result?.repo).toBe('react');
    });

    it('should resolve exact shorthand (svelte)', () => {
      const result = resolveShorthand('svelte');
      expect(result).toBeDefined();
      expect(result?.owner).toBe('sveltejs');
      expect(result?.repo).toBe('svelte');
    });

    it('should resolve exact shorthand (typescript)', () => {
      const result = resolveShorthand('typescript');
      expect(result).toBeDefined();
      expect(result?.owner).toBe('microsoft');
      expect(result?.repo).toBe('TypeScript');
    });

    it('should return null for unknown shorthand', () => {
      const result = resolveShorthand('nonexistent-framework');
      expect(result).toBeNull();
    });

    it('should be case-insensitive', () => {
      const result = resolveShorthand('REACT');
      expect(result).toBeDefined();
      expect(result?.shorthand).toBe('react'); // Should match 'react'
    });
  });

  describe('searchRepos', () => {
    it('should find repos with partial match (rea)', () => {
      const results = searchRepos('rea', 10);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.shorthand === 'react')).toBe(true);
    });

    it('should limit results to specified count', () => {
      const results = searchRepos('e', 3); // Many repos have 'e'
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array for no matches', () => {
      const results = searchRepos('zzzzzzzzzzzzz', 10);
      expect(results).toEqual([]);
    });

    it('should search case-insensitively', () => {
      const results = searchRepos('REACT', 10);
      expect(results.some(r => r.shorthand === 'react')).toBe(true);
    });

    it('should match owner names', () => {
      const results = searchRepos('facebook', 10);
      expect(results.some(r => r.owner === 'facebook')).toBe(true);
    });

    it('should match repo names', () => {
      const results = searchRepos('svelte', 10);
      expect(results.some(r => r.repo === 'svelte')).toBe(true);
    });

    it('should search in all fields', () => {
      const results = searchRepos('facebook', 10);
      // Should find facebook/react and other facebook repos
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('findClosestMatch', () => {
    it('should find typo: svelt → svelte (distance 1)', () => {
      const result = findClosestMatch('svelt', 2);
      expect(result).toBeDefined();
      expect(result?.shorthand).toBe('svelte');
    });

    it('should find typo: recat → react (distance 2)', () => {
      const result = findClosestMatch('recat', 2);
      expect(result).toBeDefined();
      expect(result?.shorthand).toBe('react');
    });

    it('should not match if distance > maxDistance', () => {
      const result = findClosestMatch('xyz', 2);
      // Should not match anything within distance 2
      expect(result).toBeNull();
    });

    it('should handle case-insensitive matching', () => {
      const result = findClosestMatch('SVELT', 2);
      expect(result).toBeDefined();
      expect(result?.shorthand).toBe('svelte');
    });

    it('should return closest match when multiple candidates', () => {
      const result = findClosestMatch('veu', 2);
      // Should find 'vue' (distance 1)
      expect(result).toBeDefined();
      expect(result?.shorthand).toBe('vue');
    });
  });

  describe('levenshteinDistance', () => {
    it('should calculate distance for identical strings', () => {
      expect(levenshteinDistance('react', 'react')).toBe(0);
    });

    it('should calculate distance for one character difference', () => {
      expect(levenshteinDistance('react', 'reac')).toBe(1);
    });

    it('should calculate distance for substitution', () => {
      expect(levenshteinDistance('react', 'reakt')).toBe(1);
    });

    it('should calculate distance for insertion', () => {
      expect(levenshteinDistance('react', 'reactt')).toBe(1);
    });

    it('should calculate distance for complex difference', () => {
      expect(levenshteinDistance('svelte', 'svlt')).toBe(2);
    });

    it('should be symmetric', () => {
      const dist1 = levenshteinDistance('abc', 'def');
      const dist2 = levenshteinDistance('def', 'abc');
      expect(dist1).toBe(dist2);
    });

    it('should handle empty strings', () => {
      expect(levenshteinDistance('', 'react')).toBe(5);
      expect(levenshteinDistance('react', '')).toBe(5);
      expect(levenshteinDistance('', '')).toBe(0);
    });
  });

  describe('getCategories', () => {
    it('should return list of categories', () => {
      const categories = getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should include framework category', () => {
      const categories = getCategories();
      expect(categories).toContain('framework');
    });

    it('should include auth category', () => {
      const categories = getCategories();
      expect(categories).toContain('auth');
    });

    it('should include ui category', () => {
      const categories = getCategories();
      expect(categories).toContain('ui');
    });

    it('should not have duplicates', () => {
      const categories = getCategories();
      const unique = [...new Set(categories)];
      expect(categories.length).toBe(unique.length);
    });
  });

  describe('getReposByCategory', () => {
    it('should return framework repos', () => {
      const repos = getReposByCategory('framework');
      expect(repos.length).toBeGreaterThan(0);
      expect(repos.every(r => r.category === 'framework')).toBe(true);
    });

    it('should return auth repos', () => {
      const repos = getReposByCategory('auth');
      expect(repos.length).toBeGreaterThan(0);
      expect(repos.every(r => r.category === 'auth')).toBe(true);
    });

    it('should return empty array for unknown category', () => {
      const repos = getReposByCategory('nonexistent-category');
      expect(repos).toEqual([]);
    });

    it('should include React in framework category', () => {
      const repos = getReposByCategory('framework');
      expect(repos.some(r => r.shorthand === 'react')).toBe(true);
    });

    it('should include Svelte in framework category', () => {
      const repos = getReposByCategory('framework');
      expect(repos.some(r => r.shorthand === 'svelte')).toBe(true);
    });
  });

  describe('Integration: Full Resolution Flow', () => {
    it('should resolve exact → shorthand', () => {
      const result = resolveShorthand('react');
      expect(result?.owner).toBe('facebook');
    });

    it('should search when no exact match', () => {
      const exactMatch = resolveShorthand('rea');
      expect(exactMatch).toBeNull();

      const searchResults = searchRepos('rea', 10);
      expect(searchResults.length).toBeGreaterThan(0);
    });

    it('should suggest typo correction', () => {
      const exactMatch = resolveShorthand('svelt');
      expect(exactMatch).toBeNull();

      const searchResults = searchRepos('svelt', 10);
      if (searchResults.length === 0) {
        const typoMatch = findClosestMatch('svelt', 2);
        expect(typoMatch).toBeDefined();
        expect(typoMatch?.shorthand).toBe('svelte');
      }
    });
  });

  describe('Championship Edge Cases', () => {
    it('should handle special characters in query', () => {
      const results = searchRepos('@react', 10);
      // Special chars may not match, that's okay
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle numeric queries', () => {
      const results = searchRepos('n8n', 10);
      expect(results.some(r => r.shorthand === 'n8n')).toBe(true);
    });

    it('should handle hyphenated names', () => {
      const results = searchRepos('next-auth', 10);
      expect(results.some(r => r.shorthand === 'nextauth')).toBe(true);
    });

    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(100);
      const results = searchRepos(longQuery, 10);
      // Should not crash, may return empty
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle unicode queries', () => {
      const results = searchRepos('react🚀', 10);
      // Should handle gracefully
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
