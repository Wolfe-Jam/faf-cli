/**
 * Markdown to Context Extractor
 * Converts ANY markdown to structured YAML and extracts relevant context
 */

import { escapeForYaml } from './yaml-generator';

interface ExtractedContext {
  title?: string;
  description?: string;
  techStack?: string[];
  goals?: string[];
  features?: string[];
  commands?: Record<string, string>;
  dependencies?: string[];
  raw?: Record<string, any>;
}

/**
 * Parse markdown and extract structured context
 */
export function markdownToContext(markdown: string): ExtractedContext {
  const lines = markdown.split('\n');
  const context: ExtractedContext = {
    techStack: [],
    goals: [],
    features: [],
    commands: {},
    dependencies: [],
    raw: {}
  };

  let currentSection = '';
  let currentList: string[] = [];

  for (const line of lines) {
    // Extract title (first H1)
    if (line.startsWith('# ') && !context.title) {
      context.title = escapeForYaml(line.substring(2).trim()) || undefined;
      continue;
    }

    // Extract description (first paragraph after title)
    if (!context.description && line.trim() && !line.startsWith('#') && !line.startsWith('-')) {
      context.description = escapeForYaml(line.trim()) || undefined;
      continue;
    }

    // Track sections
    if (line.startsWith('## ')) {
      // Save previous list if any
      if (currentList.length > 0) {
        assignListToContext(context, currentSection, currentList);
        currentList = [];
      }
      currentSection = line.substring(3).trim().toLowerCase();
      continue;
    }

    // Extract lists
    if (line.match(/^[\s]*[-*]\s+/)) {
      const item = escapeForYaml(line.replace(/^[\s]*[-*]\s+/, ''));
      if (item) currentList.push(item);
      continue;
    }

    // Extract code blocks with commands
    if (line.includes('npm run') || line.includes('npm install')) {
      const match = line.match(/(npm\s+\w+[\s\w-]*)/);
      if (match) {
        const cmd = match[1].trim();
        if (context.commands) {
          context.commands[cmd] = escapeForYaml(line.trim()) || line.trim();
        }
      }
    }

    // Look for tech indicators
    if (line.match(/\b(React|Vue|Svelte|Angular|TypeScript|JavaScript|Python|Node|Express)\b/i)) {
      const tech = line.match(/\b(React|Vue|Svelte|Angular|TypeScript|JavaScript|Python|Node|Express)\b/gi);
      if (tech) {
        tech.forEach(t => {
          if (context.techStack && !context.techStack.includes(t)) {
            context.techStack.push(t);
          }
        });
      }
    }

    // Look for package.json dependencies
    if (line.includes('"dependencies"') || line.includes('"devDependencies"')) {
      // We're in a dependencies section
      continue;
    }
  }

  // Save final list
  if (currentList.length > 0) {
    assignListToContext(context, currentSection, currentList);
  }

  return context;
}

/**
 * Assign list items to appropriate context field based on section name
 */
function assignListToContext(context: ExtractedContext, section: string, items: string[]) {
  const sectionLower = section.toLowerCase();

  if (sectionLower.includes('feature') || sectionLower.includes('capability')) {
    context.features?.push(...items);
  } else if (sectionLower.includes('goal') || sectionLower.includes('objective')) {
    context.goals?.push(...items);
  } else if (sectionLower.includes('tech') || sectionLower.includes('stack')) {
    context.techStack?.push(...items);
  } else if (sectionLower.includes('depend')) {
    context.dependencies?.push(...items);
  } else {
    // Store in raw for other sections
    if (context.raw) {
      if (!context.raw[section]) {
        context.raw[section] = [];
      }
      context.raw[section].push(...items);
    }
  }
}

/**
 * Convert extracted context to FAF-compatible structure
 */
export function contextToFafData(context: ExtractedContext): Partial<any> {
  return {
    projectName: context.title || 'Extracted Project',
    projectGoal: context.description || context.goals?.join(', '),
    mainLanguage: detectMainLanguage(context.techStack || []),
    framework: detectFramework(context.techStack || []),
    additionalWhat: context.features || [],
    additionalWhy: context.goals || [],
    additionalHow: context.commands ? Object.keys(context.commands) : []
  };
}

function detectMainLanguage(techStack: string[]): string {
  const langs = techStack.map(t => t.toLowerCase());
  if (langs.includes('typescript')) return 'TypeScript';
  if (langs.includes('javascript')) return 'JavaScript';
  if (langs.includes('python')) return 'Python';
  if (langs.includes('node')) return 'JavaScript';
  return 'Unknown';
}

function detectFramework(techStack: string[]): string {
  const techs = techStack.map(t => t.toLowerCase());
  if (techs.includes('react')) return 'React';
  if (techs.includes('vue')) return 'Vue';
  if (techs.includes('svelte')) return 'Svelte';
  if (techs.includes('angular')) return 'Angular';
  if (techs.includes('express')) return 'Express';
  return 'None';
}

/**
 * Smart README ingestion - extract only valuable context
 */
export async function ingestReadme(readmePath: string): Promise<Partial<any>> {
  const fs = await import('fs');
  const markdown = fs.readFileSync(readmePath, 'utf-8');
  const context = markdownToContext(markdown);
  return contextToFafData(context);
}