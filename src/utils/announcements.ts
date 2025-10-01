/**
 * 📢 Version announcements for existing users
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { chalk } from '../fix-once/colors';

const FAF_DIR = path.join(os.homedir(), '.faf');
const ANNOUNCEMENTS_FILE = path.join(FAF_DIR, '.announcements-seen');

interface AnnouncementRecord {
    [version: string]: {
        seen: boolean;
        seenAt?: string;
    };
}

/**
 * Load seen announcements
 */
function loadAnnouncementRecord(): AnnouncementRecord {
    try {
        if (fs.existsSync(ANNOUNCEMENTS_FILE)) {
            return JSON.parse(fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf-8'));
        }
    } catch {
        // Ignore errors
    }
    return {};
}

/**
 * Save announcement record
 */
function saveAnnouncementRecord(record: AnnouncementRecord): void {
    try {
        if (!fs.existsSync(FAF_DIR)) {
            fs.mkdirSync(FAF_DIR, { recursive: true });
        }
        fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(record, null, 2));
    } catch {
        // Ignore errors - not critical
    }
}

/**
 * Check if announcement has been seen
 */
function hasSeenAnnouncement(version: string): boolean {
    const record = loadAnnouncementRecord();
    return record[version]?.seen === true;
}

/**
 * Mark announcement as seen
 */
function markAnnouncementSeen(version: string): void {
    const record = loadAnnouncementRecord();
    record[version] = {
        seen: true,
        seenAt: new Date().toISOString()
    };
    saveAnnouncementRecord(record);
}

/**
 * Show v2.4.0 announcement to existing users
 */
export function showV240Announcement(): void {
    const VERSION = '2.4.0';

    // Skip if already seen or in quiet/CI mode
    if (
        hasSeenAnnouncement(VERSION) ||
        process.argv.includes('--quiet') ||
        process.argv.includes('-q') ||
        process.env.CI ||
        !process.stdin.isTTY
    ) {
        return;
    }

    // Mark as seen immediately (even if they Ctrl+C)
    markAnnouncementSeen(VERSION);

    console.log();
    console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold('  🎉 NEW: FAF v2.4.0 - Major Update Released!'));
    console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(chalk.white.bold('  What\'s New:'));
    console.log(chalk.green('  ✨ Email notifications for new versions'));
    console.log(chalk.green('  ⚡ Quick mode: faf quick "project, stack, tools"'));
    console.log(chalk.green('  🏥 Doctor command: faf doctor (fix issues)'));
    console.log(chalk.green('  🔄 Improved bi-sync performance'));
    console.log();
    console.log(chalk.yellow.bold('  Coming Next:'));
    console.log(chalk.gray('  🚀 Vercel integration - fix build failures with AI'));
    console.log(chalk.gray('  📊 Stack analysis - "Your stack actually sucks"'));
    console.log(chalk.gray('  🤖 More MCP tools for Claude Desktop'));
    console.log();
    console.log(chalk.white('  💡 Get notified of new features:'));
    console.log(chalk.cyan.bold('     faf notifications'));
    console.log();
    console.log(chalk.gray('  This message appears once. Thank you for using .faf!'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
}

/**
 * Show update available notice (brief)
 */
export function showUpdateAvailable(currentVersion: string, latestVersion: string): void {
    // Only show if it's a significant update
    const current = currentVersion.split('.').map(Number);
    const latest = latestVersion.split('.').map(Number);

    // Skip if patch version only
    if (current[0] === latest[0] && current[1] === latest[1]) {
        return;
    }

    console.log();
    console.log(chalk.yellow(`📦 New version available: v${latestVersion} (you have v${currentVersion})`));
    console.log(chalk.gray('  Update with: npm update -g faf-cli'));
    console.log(chalk.gray('  Get notified: faf notifications'));
    console.log();
}

/**
 * Critical update notice (security, breaking changes)
 */
export function showCriticalUpdate(message: string): void {
    console.log();
    console.log(chalk.red.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.red.bold('  ⚠️  CRITICAL UPDATE REQUIRED'));
    console.log(chalk.red.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(chalk.white(message));
    console.log();
    console.log(chalk.yellow.bold('  Update immediately:'));
    console.log(chalk.white('    npm update -g faf-cli'));
    console.log();
    console.log(chalk.red.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
}