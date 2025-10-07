/**
 * Email opt-in system for FAF CLI
 * Respectful, one-time only, completely optional
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import { chalk } from '../fix-once/colors';

const FAF_DIR = path.join(os.homedir(), '.faf');
const EMAIL_FLAG_FILE = path.join(FAF_DIR, '.email-asked');
const EMAIL_STORE_FILE = path.join(FAF_DIR, '.email-subscribed');

/**
 * Ensure .faf directory exists
 */
function ensureFafDir(): void {
    if (!fs.existsSync(FAF_DIR)) {
        fs.mkdirSync(FAF_DIR, { recursive: true });
    }
}

/**
 * Check if we've already asked for email
 */
export function hasAskedForEmail(): boolean {
    return fs.existsSync(EMAIL_FLAG_FILE);
}

/**
 * Mark that we've asked for email (never ask again)
 */
function markEmailAsked(): void {
    ensureFafDir();
    fs.writeFileSync(EMAIL_FLAG_FILE, new Date().toISOString());
}

/**
 * Check if user is subscribed
 */
export function isSubscribed(): boolean {
    return fs.existsSync(EMAIL_STORE_FILE);
}

/**
 * Subscribe to updates
 */
async function subscribeEmail(email: string): Promise<boolean> {
    try {
        // Store locally first
        ensureFafDir();
        fs.writeFileSync(EMAIL_STORE_FILE, JSON.stringify({
            email,
            subscribedAt: new Date().toISOString(),
            source: 'cli',
            version: process.env.npm_package_version || 'unknown'
        }));

        // Try to send to server (don't block if it fails)
        fetch('https://formspree.io/f/xnngaegg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                source: 'cli',
                version: process.env.npm_package_version,
                type: 'FAF CLI Email Notifications',
                timestamp: new Date().toISOString()
            })
        }).catch(() => {
            // Silently fail - we have it stored locally
        });

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Prompt for email opt-in (one time only)
 */
export async function promptEmailOptIn(options: { quiet?: boolean } = {}): Promise<void> {
    // Skip if:
    // - Already asked
    // - In CI environment
    // - Quiet mode
    // - Non-interactive terminal
    if (
        hasAskedForEmail() ||
        process.env.CI ||
        options.quiet ||
        !process.stdin.isTTY
    ) {
        return;
    }

    // Mark as asked immediately (even if they skip)
    markEmailAsked();

    console.log();
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold('  📧 New Version Notifications'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log('  Get notified when we release:');
    console.log(chalk.gray('  • New versions with features'));
    console.log(chalk.gray('  • Breaking changes that affect you'));
    console.log(chalk.gray('  • Critical security updates'));
    console.log();
    console.log(chalk.gray('  (Only major releases, remove anytime)'));
    console.log();

    const { wantsUpdates } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'wantsUpdates',
            message: 'Add your email for version notifications?',
            default: false
        }
    ]);

    if (wantsUpdates) {
        const { email } = await inquirer.prompt([
            {
                type: 'input',
                name: 'email',
                message: 'Your email:',
                validate: (input: string) => {
                    if (!input) return 'Email is required';
                    if (!input.includes('@')) return 'Please enter a valid email';
                    return true;
                }
            }
        ]);

        const success = await subscribeEmail(email);

        if (success) {
            console.log();
            console.log(chalk.green('  ✅ Added! You\'ll get notified of new versions.'));
            console.log(chalk.gray('  (Remove anytime with: faf notifications --remove)'));
        }
    } else {
        console.log();
        console.log(chalk.gray('  No problem! You can add your email later with: faf notifications'));
    }

    console.log();
}

/**
 * Allow manual subscription via flag
 */
export async function subscribeViaFlag(email: string): Promise<void> {
    if (!email || !email.includes('@')) {
        console.log(chalk.red('Invalid email address'));
        return;
    }

    const success = await subscribeEmail(email);

    if (success) {
        console.log(chalk.green(`✅ Added ${email} for version notifications`));
    } else {
        console.log(chalk.red('Failed to add email. Please try again later.'));
    }
}

/**
 * Show notification status
 */
export function showSubscriptionStatus(): void {
    if (isSubscribed()) {
        try {
            const data = JSON.parse(fs.readFileSync(EMAIL_STORE_FILE, 'utf-8'));
            console.log(chalk.green(`📧 Email added: ${data.email}`));
            console.log(chalk.gray(`  Added on: ${new Date(data.subscribedAt).toLocaleDateString()}`));
            console.log(chalk.gray('  Remove with: faf notifications --remove'));
        } catch {
            console.log(chalk.green('📧 Your email is added for notifications'));
        }
    } else {
        console.log(chalk.gray('📧 No email added for notifications'));
        console.log(chalk.gray('  Add with: faf notifications'));
    }
}

/**
 * Remove email from notifications
 */
export function unsubscribe(): void {
    if (fs.existsSync(EMAIL_STORE_FILE)) {
        fs.unlinkSync(EMAIL_STORE_FILE);
        console.log(chalk.green('✅ Email removed from notifications'));
    } else {
        console.log(chalk.gray('No email was added'));
    }
}