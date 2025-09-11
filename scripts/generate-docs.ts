#!/usr/bin/env ts-node

/**
 * 📚 Documentation Generator - F1-Inspired Championship Docs
 * Auto-generates command reference from FAF_INDEX
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { FAF_INDEX } from '../src/commands/index';
import { FAF_COLORS, FAF_ICONS } from '../src/utils/championship-style';

const DOCS_DIR = path.join(__dirname, '..', 'docs-site');

interface GenerationStats {
  commandPages: number;
  conceptPages: number;
  totalPages: number;
  errors: string[];
}

/**
 * Main documentation generation function
 */
async function generateDocs(): Promise<void> {
  console.log(`${FAF_COLORS.fafCyan('🏗️ Generating FAF CLI Documentation...')}`);
  
  const stats: GenerationStats = {
    commandPages: 0,
    conceptPages: 0,
    totalPages: 0,
    errors: []
  };

  try {
    // Ensure docs directory exists
    await ensureDocsDirectory();
    
    // Generate command reference pages
    await generateCommandPages(stats);
    
    // Generate concept pages
    await generateConceptPages(stats);
    
    // Generate index pages
    await generateIndexPages(stats);
    
    // Generate navigation config
    await generateNavigation();
    
    // Show results
    console.log();
    console.log(`${FAF_COLORS.fafGreen('✅ Documentation Generation Complete!')}`);
    console.log(`${FAF_COLORS.fafCyan('├─')} Command pages: ${stats.commandPages}`);
    console.log(`${FAF_COLORS.fafCyan('├─')} Concept pages: ${stats.conceptPages}`);
    console.log(`${FAF_COLORS.fafCyan('├─')} Total pages: ${stats.totalPages}`);
    
    if (stats.errors.length > 0) {
      console.log(`${FAF_COLORS.fafOrange('└─')} Errors: ${stats.errors.length}`);
      stats.errors.forEach(error => {
        console.log(`   ${FAF_COLORS.fafOrange('⚠️')} ${error}`);
      });
    } else {
      console.log(`${FAF_COLORS.fafGreen('└─')} No errors! 🏆`);
    }
    
  } catch (error) {
    console.error(`${FAF_COLORS.fafOrange('❌ Generation failed:')} ${error}`);
    process.exit(1);
  }
}

/**
 * Ensure docs directory structure exists
 */
async function ensureDocsDirectory(): Promise<void> {
  const dirs = [
    path.join(DOCS_DIR, 'pages'),
    path.join(DOCS_DIR, 'pages', 'commands'),
    path.join(DOCS_DIR, 'pages', 'concepts'),
    path.join(DOCS_DIR, 'pages', 'examples'),
    path.join(DOCS_DIR, 'components'),
    path.join(DOCS_DIR, 'public', 'screenshots'),
    path.join(DOCS_DIR, 'public', 'examples')
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Generate command reference pages
 */
async function generateCommandPages(stats: GenerationStats): Promise<void> {
  const commands = Object.entries(FAF_INDEX).filter(([_, entry]) => entry.type === 'command');
  
  for (const [key, entry] of commands) {
    try {
      const content = generateCommandPageContent(key, entry);
      const filePath = path.join(DOCS_DIR, 'pages', 'commands', `${key}.mdx`);
      await fs.writeFile(filePath, content);
      stats.commandPages++;
      stats.totalPages++;
    } catch (error) {
      stats.errors.push(`Command ${key}: ${error}`);
    }
  }
}

/**
 * Generate concept pages
 */
async function generateConceptPages(stats: GenerationStats): Promise<void> {
  const concepts = Object.entries(FAF_INDEX).filter(([_, entry]) => entry.type === 'concept');
  
  for (const [key, entry] of concepts) {
    try {
      const content = generateConceptPageContent(key, entry);
      const filePath = path.join(DOCS_DIR, 'pages', 'concepts', `${key}.mdx`);
      await fs.writeFile(filePath, content);
      stats.conceptPages++;
      stats.totalPages++;
    } catch (error) {
      stats.errors.push(`Concept ${key}: ${error}`);
    }
  }
}

/**
 * Generate index pages
 */
async function generateIndexPages(stats: GenerationStats): Promise<void> {
  // Commands index
  const commandsIndex = generateCommandsIndexContent();
  await fs.writeFile(
    path.join(DOCS_DIR, 'pages', 'commands', 'index.mdx'), 
    commandsIndex
  );
  
  // Concepts index
  const conceptsIndex = generateConceptsIndexContent();
  await fs.writeFile(
    path.join(DOCS_DIR, 'pages', 'concepts', 'index.mdx'), 
    conceptsIndex
  );
  
  // Main index
  const mainIndex = generateMainIndexContent();
  await fs.writeFile(
    path.join(DOCS_DIR, 'pages', 'index.mdx'), 
    mainIndex
  );
  
  stats.totalPages += 3;
}

/**
 * Generate command page content
 */
function generateCommandPageContent(key: string, entry: any): string {
  return `# ${key}

${entry.description}

## Usage

\`\`\`bash
${entry.usage || `faf ${key}`}
\`\`\`

${entry.examples ? `
## Examples

${entry.examples.map((example: string) => `\`\`\`bash
${example}
\`\`\`\n`).join('')}
` : ''}

${entry.related ? `
## Related Commands

${entry.related.map((rel: string) => `- [${rel}](./${rel})`).join('\n')}
` : ''}

## Category

**${entry.category}** - ${getCategoryDescription(entry.category)}
`;
}

/**
 * Generate concept page content
 */
function generateConceptPageContent(key: string, entry: any): string {
  return `# ${key}

${entry.description}

${entry.related ? `
## Related

${entry.related.map((rel: string) => `- [${rel}](../${getRelatedType(rel)}/${rel})`).join('\n')}
` : ''}

## Category

**${entry.category}** - ${getCategoryDescription(entry.category)}
`;
}

/**
 * Generate commands index content
 */
function generateCommandsIndexContent(): string {
  const commands = Object.entries(FAF_INDEX).filter(([_, entry]) => entry.type === 'command');
  
  return `# Commands Reference

Complete reference for all FAF CLI commands.

## Core Commands

${commands.filter(([_, entry]) => entry.category === 'core').map(([key, entry]) => 
  `### [${key}](./${key})
${entry.description}
\`\`\`bash
${entry.usage || `faf ${key}`}
\`\`\`
`).join('\n')}

## All Commands

${commands.map(([key, entry]) => `- **[${key}](./${key})** - ${entry.description}`).join('\n')}
`;
}

/**
 * Generate concepts index content
 */
function generateConceptsIndexContent(): string {
  const concepts = Object.entries(FAF_INDEX).filter(([_, entry]) => entry.type === 'concept');
  
  return `# Core Concepts

Understanding the fundamentals of FAF CLI and AI context management.

${concepts.map(([key, entry]) => `## [${key}](./${key})

${entry.description}
`).join('\n')}
`;
}

/**
 * Generate main index content
 */
function generateMainIndexContent(): string {
  return `---
title: FAF CLI Documentation
---

# 🏎️ FAF CLI Documentation

Welcome to the **Championship-grade AI context management** documentation!

## Quick Start

\`\`\`bash
# Install FAF CLI
npm install -g @faf/cli

# Initialize your project
faf init

# Check your AI context score
faf score

# Build trust with AI
faf trust
\`\`\`

## What is FAF?

FAF (Foundational AI-Context Format) transforms developer psychology from **hope-driven** to **trust-driven** AI development. In 30 seconds, FAF replaces 20 minutes of questions.

## Core Features

- 🚀 **Universal AI Context** - Works with Claude, ChatGPT, Gemini
- ⚡ **F1-Inspired Performance** - Championship speed (<40ms status)
- 🎯 **Trust-Driven Development** - Eliminate AI anxiety
- 💎 **Technical Credit System** - Psychology revolution vs debt

## Documentation Sections

- **[Commands](/commands)** - Complete CLI reference
- **[Concepts](/concepts)** - Core concepts and principles
- **[Examples](/examples)** - Real-world usage patterns

---

**🏁 Making AI development better for everyone!**
`;
}

/**
 * Generate navigation configuration
 */
async function generateNavigation(): Promise<void> {
  const navConfig = `export default {
  logo: <span>🏎️ FAF CLI</span>,
  project: {
    link: 'https://github.com/faf-org/cli'
  },
  docsRepositoryBase: 'https://github.com/faf-org/cli/tree/main/docs',
  sidebar: {
    defaultMenuCollapseLevel: 1
  },
  footer: {
    text: '🏁 Making AI development better for everyone!'
  }
}`;
  
  await fs.writeFile(
    path.join(DOCS_DIR, 'theme.config.tsx'), 
    navConfig
  );
}

/**
 * Helper functions
 */
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    core: 'Essential FAF functionality',
    ai: 'AI integration and compatibility',
    trust: 'Trust and confidence management',
    utilities: 'Helper tools and utilities',
    improvement: 'Context improvement tools',
    psychology: 'Developer psychology enhancement',
    concepts: 'Fundamental concepts',
    discovery: 'Technology discovery and analysis'
  };
  return descriptions[category] || 'FAF functionality';
}

function getRelatedType(key: string): string {
  const entry = FAF_INDEX[key as keyof typeof FAF_INDEX];
  if (!entry) return 'commands';
  return entry.type === 'command' ? 'commands' : 'concepts';
}

// Run the generator
if (require.main === module) {
  generateDocs().catch(console.error);
}

export { generateDocs };