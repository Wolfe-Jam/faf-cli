/**
 * 📧 faf notifications - Version update notifications management
 */

import chalk from 'chalk';
import {
    subscribeViaFlag,
    showSubscriptionStatus,
    unsubscribe,
    promptEmailOptIn
} from '../utils/email-opt-in';

interface NotificationOptions {
    email?: string;
    status?: boolean;
    remove?: boolean;
    quiet?: boolean;
}

export async function notificationsCommand(options: NotificationOptions = {}) {
    try {
        // Show status
        if (options.status) {
            showSubscriptionStatus();
            return;
        }

        // Remove email
        if (options.remove) {
            unsubscribe();
            return;
        }

        // Add email directly
        if (options.email) {
            await subscribeViaFlag(options.email);
            return;
        }

        // Interactive add email
        await promptEmailOptIn({ quiet: options.quiet });

    } catch (error) {
        console.log(chalk.red('Error managing notifications:'));
        console.log(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}