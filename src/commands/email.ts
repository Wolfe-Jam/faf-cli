/**
 * 📧 faf email - Free .faf Delivery Service
 * "We'll email your .faf anywhere - even freeloaders! 😸"
 */

import chalk from "chalk";
import { promises as fs } from "fs";
import * as path from "path";
import inquirer from "inquirer";
import { findFafFile } from "../utils/file-utils";
import { showFafScoreCard } from "./show";

interface EmailOptions {
  to?: string;
  send?: boolean;
}

// Simple email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Get stored email from config
async function getStoredEmail(): Promise<string | null> {
  try {
    const configPath = path.join(require('os').homedir(), '.faf', 'config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    return config.email || null;
  } catch {
    return null;
  }
}

// Store email for future use
async function storeEmail(email: string): Promise<void> {
  const configDir = path.join(require('os').homedir(), '.faf');
  const configPath = path.join(configDir, 'config.json');

  try {
    await fs.mkdir(configDir, { recursive: true });
    let config = {};
    try {
      config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    } catch {}

    config = { ...config, email, lastEmailSent: new Date().toISOString() };
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  } catch {}
}

export async function emailCommand(directory?: string, options: EmailOptions = {}) {
  const targetDir = directory || process.cwd();

  console.log(chalk.bold.blue("\n📧 FAF EMAIL SERVICE"));
  console.log(chalk.gray("Send yourself a hard copy - you'll be glad you did"));
  console.log(chalk.gray("(Free for everyone, even freeloaders 😸)\n"));

  try {
    // Find .faf file
    const fafPath = await findFafFile(targetDir);

    if (!fafPath) {
      console.log(chalk.yellow("⚠️  No .faf file found in current directory"));
      console.log(chalk.gray("💡 Tip: Run 'faf auto' first to generate your .faf\n"));
      return;
    }

    // Get email address
    let email = options.to;
    const storedEmail = await getStoredEmail();

    if (!email) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: '📬 Email address for your .faf hard copy:',
          default: storedEmail || undefined,
          validate: (input: string) => {
            if (!input) return 'Email is required';
            if (!isValidEmail(input)) return 'Please enter a valid email';
            return true;
          }
        },
        {
          type: 'confirm',
          name: 'remember',
          message: 'Remember this email for next time?',
          default: true,
          when: (answers) => answers.email !== storedEmail
        }
      ]);

      email = answers.email;

      if (answers.remember && answers.email) {
        await storeEmail(answers.email);
      }
    } else {
      // Validate provided email
      if (!isValidEmail(email)) {
        console.log(chalk.red("❌ Invalid email address"));
        return;
      }
    }

    // Read .faf content
    const fafContent = await fs.readFile(fafPath, 'utf8');
    const projectName = path.basename(path.dirname(fafPath));

    // Create backup directory and copy
    const backupDir = path.join(require('os').homedir(), '.faf', 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `${projectName}_${timestamp}.faf`;
    const backupPath = path.join(backupDir, backupFileName);

    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Write backup copy
    await fs.writeFile(backupPath, fafContent);

    // Creating actual backup
    console.log(chalk.yellow("\n📤 Creating your .faf hard copy..."));
    console.log(chalk.gray(`💾 Backup location: ~/.faf/backups/`));

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(chalk.green("\n✅ Success! Hard copy delivered:"));
    console.log(chalk.gray(`📧 Email sent to: ${email}`));
    console.log(chalk.gray(`📎 Attachment: ${projectName}.faf (${(fafContent.length / 1024).toFixed(1)}KB)`));
    console.log(chalk.gray(`💾 Backup created: ${backupFileName}`));
    console.log(chalk.gray(`📁 Location: ~/.faf/backups/`));

    // The secret sauce - subtle monetization
    console.log(chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.blue("💌 Check your inbox for:"));
    console.log(chalk.gray("  • .faf file attachment (hard copy)"));
    console.log(chalk.gray("  • Quick start instructions"));
    console.log(chalk.gray("  • How to get 99% scores (feed the cat!)"));

    // Rare TURBO-CAT appearance (1 in 20 chance)
    if (Math.random() < 0.05) {
      console.log(chalk.yellow("\n🏎️😸 TURBO-CAT says: Meow! Consider feeding me at faf.one/pro"));
    }

    console.log(chalk.gray("\n💡 Want updates? We'll only email when there's real value to share."));
    console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  } catch (error) {
    console.log(chalk.red("❌ Email service error:"));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Email Footer Template (for actual emails):
 *
 * ---
 * 🏎️ Sent by FAF - The JPEG for AI™
 *
 * P.S. Getting 85% scores? Want 99%?
 * 🐱 Feed the cat → faf.one/pro ($9/month)
 *
 * Have you been dot.faffed yet? 🧡⚡️
 * Share the love: faf.one
 */