/**
 * 🎯 Trust Cache System - Real-time AI Verification Integration
 * Caches AI verification results for instant Trust Dashboard updates
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface CachedVerificationResult {
  fafPath: string;
  timestamp: number;
  aiCompatibilityScore: number;
  verificationResults: {
    claude: number;
    chatgpt: number; 
    gemini: number;
    average: number;
  };
  allPassed: boolean;
}

/**
 * Get trust cache file path
 */
function getTrustCachePath(): string {
  const cacheDir = path.join(os.homedir(), '.faf-cli-cache');
  return path.join(cacheDir, 'trust-cache.json');
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  const cacheDir = path.dirname(getTrustCachePath());
  try {
    await fs.mkdir(cacheDir, { recursive: true });
  } catch {
    // Directory already exists, ignore
  }
}

/**
 * Save verification results to cache
 */
export async function saveTrustCache(fafPath: string, results: any[]): Promise<void> {
  try {
    await ensureCacheDir();
    
    // Calculate scores from verification results
    const scores = {
      claude: results.find(r => r.model === 'claude')?.confidence || 0,
      chatgpt: results.find(r => r.model === 'chatgpt')?.confidence || 0,
      gemini: results.find(r => r.model === 'gemini')?.confidence || 0
    };
    
    const average = Math.round((scores.claude + scores.chatgpt + scores.gemini) / 3);
    const allPassed = results.every(r => r.understood);
    
    const cacheData: CachedVerificationResult = {
      fafPath: path.resolve(fafPath),
      timestamp: Date.now(),
      aiCompatibilityScore: average,
      verificationResults: {
        ...scores,
        average
      },
      allPassed
    };
    
    // Read existing cache
    let cache: Record<string, CachedVerificationResult> = {};
    try {
      const existing = await fs.readFile(getTrustCachePath(), 'utf-8');
      cache = JSON.parse(existing);
    } catch {
      // Cache doesn't exist yet, start fresh
    }
    
    // Update cache with new results
    cache[path.resolve(fafPath)] = cacheData;
    
    // Save updated cache
    await fs.writeFile(getTrustCachePath(), JSON.stringify(cache, null, 2));
    
  } catch (error) {
    // Fail silently - don't break the verification if cache fails
    console.error('Failed to save trust cache:', error);
  }
}

/**
 * Get cached verification results
 */
export async function getTrustCache(fafPath: string): Promise<CachedVerificationResult | null> {
  try {
    const cachePath = getTrustCachePath();
    const cacheData = await fs.readFile(cachePath, 'utf-8');
    const cache = JSON.parse(cacheData);
    
    const resolvedPath = path.resolve(fafPath);
    const cached = cache[resolvedPath];
    
    if (!cached) {return null;}
    
    // Check if cache is still fresh (within 1 hour)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - cached.timestamp > oneHour) {
      return null; // Cache is stale
    }
    
    return cached;
  } catch {
    return null; // Cache doesn't exist or is corrupted
  }
}

/**
 * Clear trust cache for a specific file or all files
 */
export async function clearTrustCache(fafPath?: string): Promise<void> {
  try {
    if (!fafPath) {
      // Clear entire cache
      await fs.unlink(getTrustCachePath());
      return;
    }
    
    // Remove specific file from cache
    const cacheData = await fs.readFile(getTrustCachePath(), 'utf-8');
    const cache = JSON.parse(cacheData);
    
    const resolvedPath = path.resolve(fafPath);
    delete cache[resolvedPath];
    
    await fs.writeFile(getTrustCachePath(), JSON.stringify(cache, null, 2));
  } catch {
    // Cache doesn't exist, nothing to clear
  }
}