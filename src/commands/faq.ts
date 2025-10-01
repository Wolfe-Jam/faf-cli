/**
 * 🩵 faf faq - FAQ Command
 * Display FAQ and search functionality
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import path from 'path';
import { FAF_COLORS } from '../utils/championship-style';

export interface FaqOptions {
  search?: string;
}

/**
 * Display FAQ content
 */
export async function faqCommand(options: FaqOptions = {}): Promise<void> {
  try {
    const faqPath = path.join(__dirname, '../../FAQ.md');
    
    // Check if FAQ file exists
    let faqContent: string;
    try {
      faqContent = await fs.readFile(faqPath, 'utf-8');
    } catch {
      // Fallback if FAQ.md not found in expected location
      console.log(FAF_COLORS.fafOrange('📄 FAQ file not found at expected location.'));
      console.log(chalk.dim('💡 FAQ content is available in the repository at FAQ.md'));
      return;
    }

    console.log();
    
    if (options.search) {
      // Search functionality
      const searchTerm = options.search.toLowerCase();
      const lines = faqContent.split('\n');
      const matchingLines: string[] = [];
      let context: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes(searchTerm)) {
          // Add context (previous and next few lines)
          const start = Math.max(0, i - 2);
          const end = Math.min(lines.length, i + 3);
          context = lines.slice(start, end);
          matchingLines.push(...context, '---', '');
        }
      }

      if (matchingLines.length > 0) {
        console.log(chalk.cyan.bold(`🔍 FAQ Search Results for "${options.search}":`));
        console.log();
        console.log(matchingLines.join('\n'));
      } else {
        console.log(FAF_COLORS.fafOrange(`🔍 No results found for "${options.search}"`));
        console.log(chalk.dim('💡 Try searching for: spacebar, commands, menu, mode, toggle'));
      }
    } else {
      // Show full FAQ
      console.log(chalk.cyan.bold('🩵 FAF CLI - Frequently Asked Questions'));
      console.log();
      
      // Process and display FAQ content with syntax highlighting
      const processedContent = faqContent
        .replace(/^# /gm, chalk.cyan.bold('# '))
        .replace(/^## /gm, chalk.cyan('## '))
        .replace(/^### /gm, FAF_COLORS.fafOrange('### '))
        .replace(/\*\*([^*]+)\*\*/g, chalk.bold('$1'))
        .replace(/`([^`]+)`/g, chalk.gray('`') + chalk.cyan('$1') + chalk.gray('`'))
        .replace(/```bash\n([\s\S]*?)```/g, (match, code) => {
          return chalk.gray('```bash\n') + chalk.green(code) + chalk.gray('```');
        });
      
      console.log(processedContent);
    }
    
    console.log();
    console.log(chalk.dim('💡 Use `faf faq --search <term>` to search for specific topics'));
    console.log();
    
  } catch (error) {
    console.error(chalk.red('❌ Error displaying FAQ:'), error);
    process.exit(1);
  }
}