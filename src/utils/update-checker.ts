/**
 * 🆕 FAF Update Checker - Keep users informed about new versions
 * Checks once per day, non-intrusive, respects quiet mode
 */

import chalk from 'chalk';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import https from 'https';
import { FAF_COLORS } from './championship-style';

const CACHE_FILE = path.join(os.homedir(), '.faf-cli-cache', 'update-check.json');
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const REGISTRY_URL = 'https://registry.npmjs.org/faf-cli/latest';

interface UpdateCache {
  lastCheck: number;
  latestVersion?: string;
  currentVersion?: string;
}

/**
 * Fetch latest version from npm registry
 */
async function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    https.get(REGISTRY_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.version);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

/**
 * Read update cache
 */
async function readCache(): Promise<UpdateCache | null> {
  try {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    const content = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Write update cache
 */
async function writeCache(cache: UpdateCache): Promise<void> {
  try {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {
    // Silent fail - not critical
  }
}

/**
 * Compare semantic versions
 */
function isNewerVersion(latest: string, current: string): boolean {
  const parseVersion = (v: string) => {
    const parts = v.replace(/^v/, '').split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  };

  const latestVer = parseVersion(latest);
  const currentVer = parseVersion(current);

  if (latestVer.major > currentVer.major) return true;
  if (latestVer.major < currentVer.major) return false;

  if (latestVer.minor > currentVer.minor) return true;
  if (latestVer.minor < currentVer.minor) return false;

  return latestVer.patch > currentVer.patch;
}

/**
 * Check for updates (respects quiet mode)
 */
export async function checkForUpdates(options?: { quiet?: boolean }): Promise<void> {
  // Don't check in quiet mode
  if (options?.quiet) return;

  // Don't check in CI/CD environments
  if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) return;

  try {
    const packageJson = require('../../package.json');
    const currentVersion = packageJson.version;

    // Check cache
    const cache = await readCache();
    const now = Date.now();

    // Skip if checked recently
    if (cache && (now - cache.lastCheck) < CHECK_INTERVAL) {
      // But still show if update available and not shown yet
      if (cache.latestVersion &&
          cache.currentVersion === currentVersion &&
          isNewerVersion(cache.latestVersion, currentVersion)) {
        showUpdateMessage(cache.latestVersion, currentVersion);
      }
      return;
    }

    // Fetch latest version
    const latestVersion = await fetchLatestVersion();
    if (!latestVersion) return;

    // Update cache
    await writeCache({
      lastCheck: now,
      latestVersion,
      currentVersion
    });

    // Show update if available
    if (isNewerVersion(latestVersion, currentVersion)) {
      showUpdateMessage(latestVersion, currentVersion);
    }
  } catch {
    // Silent fail - update check is not critical
  }
}

/**
 * Show update message
 */
function showUpdateMessage(latest: string, current: string): void {
  console.log();
  console.log(FAF_COLORS.fafOrange('━'.repeat(50)));
  console.log(FAF_COLORS.fafCyan(`  🆕 FAF Update Available!`));
  console.log(chalk.gray(`     Current: v${current}`));
  console.log(FAF_COLORS.fafGreen(`     Latest:  v${latest}`));
  console.log();
  console.log(chalk.white(`  Update with:`));
  console.log(FAF_COLORS.fafCyan(`     npm update -g faf-cli`));
  console.log();
  console.log(chalk.gray(`  What's new: https://github.com/faf-cli/releases`));
  console.log(FAF_COLORS.fafOrange('━'.repeat(50)));
  console.log();
}

/**
 * Force check (for testing or manual trigger)
 */
export async function forceUpdateCheck(): Promise<void> {
  const packageJson = require('../../package.json');
  const currentVersion = packageJson.version;

  const latestVersion = await fetchLatestVersion();
  if (!latestVersion) {
    console.log(chalk.red('Failed to check for updates'));
    return;
  }

  if (isNewerVersion(latestVersion, currentVersion)) {
    showUpdateMessage(latestVersion, currentVersion);
  } else {
    console.log(FAF_COLORS.fafGreen(`✅ You're on the latest version (v${currentVersion})`));
  }
}