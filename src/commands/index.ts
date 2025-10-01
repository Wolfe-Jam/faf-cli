/**
 * 📚 Index Command - Universal A-Z Reference
 * Commands, concepts, features, everything FAF can do!
 */

import { chalk } from '../fix-once/colors';
import { 
  FAF_ICONS, 
  FAF_COLORS
} from '../utils/championship-style';

// Claude Code industry standard width
const MAX_WIDTH = 80;
const DESCRIPTION_WIDTH = 60; // Leave room for prefixes and formatting

/**
 * Truncate text to fit within width limit
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export interface IndexCommandOptions {
  category?: string;    // Filter by category (commands, concepts, features)
  search?: string;      // Search within index
  examples?: boolean;   // Show examples
}

/**
 * Universal A-Z index of everything FAF
 */
export async function indexCommand(query?: string, options: IndexCommandOptions = {}): Promise<void> {
  try {
    const startTime = Date.now();
    
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.magnifying_glass} FAF Universal Index`));
    console.log(`${FAF_COLORS.fafCyan('├─ ')}The everything catalog - commands, concepts, features A-Z`);
    
    if (query) {
      await showSpecificEntry(query);
    } else {
      await showFullIndex(options);
    }
    
    const duration = Date.now() - startTime;
    console.log();
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.trophy} Index ready in ${duration}ms!`));
    console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Try: `)}faf index <term>${FAF_COLORS.fafCyan(' - Get detailed info on anything')}`);
    
  } catch (error) {
    console.error(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} Index failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

interface IndexEntry {
  type: string;
  description: string;
  usage?: string;
  category: string;
  examples?: string[];
  related?: string[];
}

/**
 * The Universal FAF Index - Everything A-Z
 */
const FAF_INDEX: Record<string, IndexEntry> = {
  // === A ===
  'analyze': {
    type: 'command',
    description: 'Claude-first AI analysis with Big-3 compatibility',
    usage: 'faf analyze [file] [--model claude|chatgpt|gemini]',
    category: 'ai',
    examples: ['faf analyze', 'faf analyze --model claude']
  },
  'auto-mode': {
    type: 'feature',
    description: 'Automatic gearbox - menu-driven interface for learning and exploration',
    usage: 'faf --auto [command]',
    category: 'navigation',
    examples: ['faf --auto', 'faf --auto trust', 'faf --auto init'],
    related: ['manual-mode', 'gearbox', 'inquirer']
  },
  'analytics': {
    type: 'command',
    description: 'View usage analytics and manage telemetry settings',
    usage: 'faf analytics [--summary] [--disable] [--enable] [--reset]',
    category: 'utilities',
    examples: ['faf analytics --summary', 'faf analytics --disable', 'faf analytics --enable']
  },
  'enhance': {
    type: 'command', 
    description: 'Claude-first AI enhancement system',
    usage: 'faf enhance [file] [--model claude|chatgpt|gemini]',
    category: 'ai',
    examples: ['faf enhance', 'faf enhance --model all']
  },
  'ai-compatibility': {
    type: 'concept',
    description: 'Support for Claude, ChatGPT, and Gemini (Big-3)',
    related: ['verify', 'trust', 'analyze'],
    category: 'concepts'
  },

  // === B ===
  'big-3': {
    type: 'concept',
    description: 'Claude, ChatGPT, and Gemini - the three major AI models',
    related: ['ai-compatibility', 'verify'],
    category: 'concepts'
  },

  // === C ===
  'chat': {
    type: 'command',
    description: 'Natural language .faf generation - conversation-driven context building',
    usage: 'faf chat',
    category: 'core',
    examples: ['faf chat'],
    related: ['init', 'status', 'score']
  },
  'check': {
    type: 'command',
    description: 'Comprehensive .faf validation and freshness check',
    usage: 'faf check [--format] [--fresh] [--fix] [--detailed]',
    category: 'core',
    examples: ['faf check', 'faf check --fix', 'faf check --format']
  },
  'clear': {
    type: 'command',
    description: 'Clear caches, temporary files, and reset state',
    usage: 'faf clear [--cache] [--todos] [--backups] [--all]',
    category: 'utilities',
    examples: ['faf clear', 'faf clear --cache', 'faf clear --todos']
  },
  'claude-md': {
    type: 'concept',
    description: 'Bi-directional sync partner to .faf file for Claude Code integration',
    related: ['bi-sync', 'sync'],
    category: 'concepts'
  },
  'credit': {
    type: 'command',
    description: 'Technical Credit Dashboard - revolutionary psychology system',
    usage: 'faf credit [--detailed] [--history] [--clear]',
    category: 'psychology',
    examples: ['faf credit', 'faf credit --detailed', 'faf credit --history']
  },

  // === D ===
  'dot-faf': {
    type: 'concept',
    description: 'The .faf file format - your project\'s AI-readable DNA',
    related: ['init', 'score', 'validate'],
    category: 'concepts'
  },

  // === E ===
  'edit': {
    type: 'command',
    description: 'Interactive .faf editor with validation and backup',
    usage: 'faf edit [--editor vim|code|nano] [--section project|stack] [--no-validate]',
    category: 'utilities',
    examples: ['faf edit', 'faf edit --section project', 'faf edit --editor vim']
  },
  'esc-key': {
    type: 'concept',
    description: 'Escape key behavior varies by terminal - use Ctrl+C for reliable exit',
    usage: 'Press Esc (behavior varies) or Ctrl+C (always works)',
    category: 'navigation',
    examples: ['Ctrl+C: Force exit', 'Arrow keys: Navigate', 'Enter: Select'],
    related: ['terminal', 'navigation', 'inquirer']
  },

  // === F ===
  'fab-formats': {
    type: 'concept',
    description: 'Velocity-driven component detection engine (not needle-in-haystack)',
    related: ['stacks', 'score'],
    category: 'concepts'
  },

  // === G ===
  'garage': {
    type: 'feature',
    description: 'Safe experimentation mode with automatic backup',
    usage: 'faf trust --garage',
    related: ['trust', 'panic'],
    category: 'trust'
  },
  'gearbox': {
    type: 'concept',
    description: 'F1-inspired Auto/Manual transmission system for FAF CLI',
    usage: 'faf --auto (menus) or faf --manual (commands)',
    category: 'navigation',
    examples: ['faf --auto', 'faf --manual', 'faf (hybrid mode)'],
    related: ['auto-mode', 'manual-mode', 'inquirer']
  },
  'quality': {
    type: 'feature', 
    description: 'Quality checks and validation mode',
    usage: 'faf trust --quality',
    related: ['trust'],
    category: 'trust'
  },

  // === I ===
  'init': {
    type: 'command',
    description: 'Create .faf file from your project (detects React, Python, Node.js, etc.)',
    usage: 'faf init [directory] [--force] [--template react|python|node]',
    category: 'core',
    examples: ['faf init', 'faf init --force', 'faf init --template react']
  },

  // === L ===
  'lint': {
    type: 'command',
    description: 'Fix .faf formatting and style issues',
    usage: 'faf lint [file] [--fix]',
    category: 'utilities',
    examples: ['faf lint', 'faf lint --fix']
  },

  // === M ===
  'manual-mode': {
    type: 'feature',
    description: 'Manual gearbox - direct command-line interface for power users',
    usage: 'faf --manual [command]',
    category: 'navigation',
    examples: ['faf --manual', 'faf --manual score', 'faf --manual trust'],
    related: ['auto-mode', 'gearbox', 'inquirer']
  },

  // === P ===
  'panic': {
    type: 'feature',
    description: 'Emergency context repair mode',
    usage: 'faf trust --panic',
    related: ['trust', 'garage'],
    category: 'trust'
  },

  // === S ===
  'score': {
    type: 'command',
    description: 'Rate your .faf completeness (0-100%). Aim for 70%+ for good AI context',
    usage: 'faf score [file] [--details] [--minimum 80]',
    category: 'core',
    examples: ['faf score', 'faf score --details', 'faf score --minimum 80']
  },
  'search': {
    type: 'command',
    description: 'Search within .faf file content with intelligent highlighting',
    usage: 'faf search <query> [--section project] [--case] [--keys] [--values] [--count]',
    category: 'utilities',
    examples: ['faf search "react"', 'faf search "api" --section project', 'faf search "test" --keys']
  },
  'share': {
    type: 'command',
    description: 'Secure .faf distribution with auto-sanitization and multiple formats',
    usage: 'faf share [file] [--private] [--format yaml|json|url] [--expires 7d] [--anonymous]',
    category: 'utilities',
    examples: ['faf share', 'faf share --anonymous', 'faf share --format json --expires 24h']
  },
  'bi-sync': {
    type: 'concept',
    description: 'Real-time bidirectional .faf ↔ claude.md sync (<40ms)',
    related: ['sync', 'claude-md'],
    category: 'concepts'
  },
  'stacks': {
    type: 'command',
    description: 'Discover and collect technology stack signatures',
    usage: 'faf stacks [--scan] [--export] [--gallery]',
    category: 'discovery',
    examples: ['faf stacks', 'faf stacks --scan', 'faf stacks --export']
  },
  'status': {
    type: 'command',
    description: 'Quick .faf context health status (<200ms)',
    usage: 'faf status',
    category: 'core',
    examples: ['faf status']
  },
  'sync': {
    type: 'command',
    description: 'Update .faf when dependencies change OR sync with claude.md',
    usage: 'faf sync [file] [--bi-sync] [--auto]',
    category: 'core',
    examples: ['faf sync', 'faf sync --bi-sync', 'faf sync --auto']
  },

  // === T ===
  'todo': {
    type: 'command',
    description: 'Claude-inspired todo system - gamify your context improvements',
    usage: 'faf todo [--show] [--complete <task>] [--reset]',
    category: 'improvement',
    examples: ['faf todo', 'faf todo --show', 'faf todo --complete 1', 'faf todo --complete readme']
  },
  'trust': {
    type: 'command',
    description: 'Unified trust dashboard with confidence, garage, panic, quality modes',
    usage: 'faf trust [--detailed] [--confidence] [--garage] [--panic] [--quality]',
    category: 'trust',
    examples: ['faf trust', 'faf trust --confidence', 'faf trust --garage', 'faf trust --panic']
  },
  'technical-credit': {
    type: 'concept',
    description: 'Revolutionary psychology system: earn credit for improvements (vs. debt)',
    related: ['credit'],
    category: 'concepts'
  },

  // === V ===
  'verify': {
    type: 'command',
    description: 'Test .faf context with Claude, ChatGPT & Gemini - prove AI understanding',
    usage: 'faf verify [--detailed] [--models claude,chatgpt,gemini] [--timeout 30000]',
    category: 'ai',
    examples: ['faf verify', 'faf verify --detailed', 'faf verify --models claude,chatgpt']
  },
  'vscode-extension': {
    type: 'feature',
    description: 'Native VS Code integration with Command Palette (Ctrl+Shift+P) and status bar',
    usage: 'Install "FAF - AI Context Manager" from VS Code marketplace',
    category: 'integrations',
    examples: ['Ctrl+Shift+P → "FAF: Init Project"', 'Status bar: "🧡 FAF 85% | 🩵 AI 92%"'],
    related: ['faq', 'command-palette', 'status-bar']
  },

  // === W ===
  'wolfejam-testing-center': {
    type: 'concept',
    description: 'F1-inspired championship testing methodology with 66 critical tests',
    related: ['check', 'verify'],
    category: 'concepts'
  }
};

/**
 * Show full A-Z index
 */
async function showFullIndex(options: IndexCommandOptions): Promise<void> {
  const entries = Object.entries(FAF_INDEX);
  
  // Filter by category if specified
  const filteredEntries = options.category 
    ? entries.filter(([_, entry]) => entry.category === options.category)
    : entries;
  
  // Filter by search if specified  
  const searchFilteredEntries = options.search
    ? filteredEntries.filter(([key, entry]) => 
        key.toLowerCase().includes(options.search!.toLowerCase()) ||
        entry.description.toLowerCase().includes(options.search!.toLowerCase())
      )
    : filteredEntries;

  if (searchFilteredEntries.length === 0) {
    console.log(`${FAF_COLORS.fafOrange('└─ ')}No entries found`);
    return;
  }

  console.log();
  console.log(`┌─────────────────────────────────────────┐`);
  console.log(`│ ${FAF_COLORS.fafCyan('📚 FAF Universal Index - A to Z')}        │`);
  if (options.category) {
    const categoryText = `Category: ${options.category}`;
    const padding = ' '.repeat(Math.max(0, 41 - categoryText.length));
    console.log(`│ ${FAF_COLORS.fafOrange(categoryText)}${padding}│`);
  }
  if (options.search) {
    const searchText = `Search: "${options.search}"`;
    const padding = ' '.repeat(Math.max(0, 41 - searchText.length));
    console.log(`│ ${FAF_COLORS.fafOrange(searchText)}${padding}│`);
  }
  console.log(`└─────────────────────────────────────────┘`);
  console.log();

  let currentLetter = '';
  
  searchFilteredEntries.forEach(([key, entry]) => {
    const firstLetter = key[0].toUpperCase();
    
    // Show letter header
    if (firstLetter !== currentLetter) {
      currentLetter = firstLetter;
      console.log();
      console.log(chalk.bold(FAF_COLORS.fafCyan(`=== ${firstLetter} ===`)));
      console.log();
    }
    
    // No emojis, no cyan sidelines - just clean text
    const truncatedDesc = truncateText(entry.description, DESCRIPTION_WIDTH);
    console.log(`  ${chalk.bold(FAF_COLORS.fafGreen(key))} - ${truncatedDesc}`);
    
    if (options.examples && entry.examples) {
      entry.examples.forEach((example: string) => {
        console.log(`    Example: ${chalk.dim(example)}`);
      });
    }
    
    if (entry.usage) {
      console.log(`    Usage: ${chalk.dim(entry.usage)}`);
    }
    
    if (entry.related && entry.related.length > 0) {
      console.log(chalk.dim(`    See also: ${entry.related.join(', ')}`));
    }
    
    console.log(); // Spacing
  });

  // Show categories
  const categories = [...new Set(entries.map(([, entry]) => entry.category))];
  console.log(FAF_COLORS.fafCyan('📋 Categories:'));
  categories.forEach(category => {
    const count = entries.filter(([, entry]) => entry.category === category).length;
    console.log(`${FAF_COLORS.fafCyan('   ')}${getCategoryColor(category)(category)} (${count})`);
  });
  
  // Clear line break at the end for better readability
  console.log();
}

/**
 * Show specific index entry
 */
async function showSpecificEntry(query: string): Promise<void> {
  const entry = FAF_INDEX[query.toLowerCase() as keyof typeof FAF_INDEX];
  
  if (!entry) {
    // Try fuzzy search
    const matches = Object.entries(FAF_INDEX).filter(([key, entry]) =>
      key.includes(query.toLowerCase()) ||
      entry.description.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matches.length === 0) {
      console.log(`${FAF_COLORS.fafOrange('└─ ')}No matches found for "${query}"`);
      console.log(`${FAF_COLORS.fafCyan('💡 Try: ')}faf index${FAF_COLORS.fafCyan(' - See full A-Z list')}`);
      return;
    }
    
    console.log(`Found ${matches.length} matches for "${query}":`);
    console.log();
    
    matches.forEach(([key, entry]) => {
      const truncatedDesc = truncateText(entry.description, DESCRIPTION_WIDTH);
      console.log(`  ${chalk.bold(FAF_COLORS.fafGreen(key))} - ${truncatedDesc}`);
    });
    
    return;
  }

  // Show detailed entry - clean and readable
  console.log();
  console.log(chalk.bold(FAF_COLORS.fafGreen(query)) + ` (${entry.type})`);
  console.log('-'.repeat(40));
  
  console.log(`Description: ${entry.description}`);
  
  if (entry.usage) {
    console.log(`Usage: ${chalk.dim(entry.usage)}`);
  }
  
  if (entry.examples && entry.examples.length > 0) {
    console.log('Examples:');
    entry.examples.forEach((example: string) => {
      console.log(`  ${chalk.dim(example)}`);
    });
  }
  
  if (entry.related && entry.related.length > 0) {
    console.log(chalk.dim(`See also: ${entry.related.join(', ')}`));
  }
  
  console.log();
  console.log(`${FAF_COLORS.fafCyan('📂 Category:')} ${getCategoryColor(entry.category)(entry.category)}`);
}

/**
 * Get emoji for entry type
 */
// Removed emoji function - clean text only for readability

/**
 * Get color for category
 */
function getCategoryColor(category: string): (text: string) => string {
  const colors: Record<string, (text: string) => string> = {
    core: FAF_COLORS.fafGreen,
    ai: FAF_COLORS.fafCyan,
    trust: FAF_COLORS.fafOrange,
    utilities: FAF_COLORS.fafCyan,
    improvement: FAF_COLORS.fafGreen,
    psychology: FAF_COLORS.fafOrange,
    concepts: FAF_COLORS.fafCyan,
    discovery: FAF_COLORS.fafGreen,
    integrations: FAF_COLORS.fafOrange,
  };
  return colors[category] || FAF_COLORS.fafCyan;
}