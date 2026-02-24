/**
 * AGENTS.md Parser
 *
 * Parses OpenAI Codex / Linux Foundation AGENTS.md files for bidirectional
 * interoperability with FAF.
 *
 * AGENTS.md Structure:
 * - H1: Project name
 * - H2: Section headers (Project Overview, Tech Stack, etc.)
 * - Bullets: Specific guidelines
 *
 * @see https://github.com/anthropics/claude-code/issues/27050
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface AgentsMdSection {
  title: string;
  content: string[];
}

export interface AgentsMdFile {
  projectName: string;
  sections: AgentsMdSection[];
}

export interface FafFromAgents {
  project: {
    name: string;
    description: string;
    type: string;
    rules: string[];
    guidelines: string[];
    codingStyle: string[];
    buildCommands: string[];
    architecture: string[];
  };
  metadata: {
    source: string;
    imported: string;
  };
}

export interface AgentsImportResult {
  success: boolean;
  faf: FafFromAgents;
  warnings: string[];
  sectionsFound: string[];
}

export interface AgentsExportResult {
  success: boolean;
  filePath: string;
  warnings: string[];
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse AGENTS.md file content
 */
export function parseAgentsMd(content: string): AgentsMdFile {
  // Strip BOM and normalize line endings (Windows \r\n, old Mac \r)
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  let projectName = 'Unknown Project';
  const sections: AgentsMdSection[] = [];
  let currentSection: AgentsMdSection | null = null;

  for (const line of lines) {
    // H1 = Project name
    const h1Match = line.match(/^#\s+(?:Project:\s*)?(.+)$/);
    if (h1Match) {
      projectName = h1Match[1].trim();
      continue;
    }

    // H2 = Section header
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: h2Match[1].trim(),
        content: [],
      };
      continue;
    }

    // Bullet point
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch && currentSection) {
      currentSection.content.push(bulletMatch[1].trim());
    }
  }

  // Push last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return { projectName, sections };
}

/**
 * Categorize AGENTS.md sections into FAF structure
 */
function categorizeSections(sections: AgentsMdSection[]): {
  rules: string[];
  guidelines: string[];
  codingStyle: string[];
  buildCommands: string[];
  architecture: string[];
} {
  const rules: string[] = [];
  const guidelines: string[] = [];
  const codingStyle: string[] = [];
  const buildCommands: string[] = [];
  const architecture: string[] = [];

  for (const section of sections) {
    const titleLower = section.title.toLowerCase();

    if (titleLower.includes('build') || titleLower.includes('test') || titleLower.includes('command')) {
      buildCommands.push(...section.content);
    } else if (titleLower.includes('architect') || titleLower.includes('structure') || titleLower.includes('design')) {
      architecture.push(...section.content);
    } else if (titleLower.includes('coding') || titleLower.includes('style') || titleLower.includes('format') || titleLower.includes('guideline')) {
      codingStyle.push(...section.content);
    } else if (titleLower.includes('rule') || titleLower.includes('constraint') || titleLower.includes('requirement') || titleLower.includes('warning')) {
      rules.push(...section.content);
    } else {
      // Default to guidelines (includes "Project Overview", "Tech Stack", etc.)
      guidelines.push(...section.content);
    }
  }

  return { rules, guidelines, codingStyle, buildCommands, architecture };
}

// ============================================================================
// Import: AGENTS.md → FAF
// ============================================================================

export async function agentsImport(agentsPath: string): Promise<AgentsImportResult> {
  const warnings: string[] = [];

  // Check if file exists
  try {
    await fs.access(agentsPath);
  } catch {
    return {
      success: false,
      faf: createEmptyFaf(),
      warnings: [`AGENTS.md not found: ${agentsPath}`],
      sectionsFound: [],
    };
  }

  // Read and parse
  const content = await fs.readFile(agentsPath, 'utf-8');
  const parsed = parseAgentsMd(content);

  if (parsed.sections.length === 0) {
    warnings.push('No sections found in AGENTS.md');
  }

  const { rules, guidelines, codingStyle, buildCommands, architecture } = categorizeSections(parsed.sections);

  const faf: FafFromAgents = {
    project: {
      name: parsed.projectName,
      description: `Imported from AGENTS.md`,
      type: 'agents-import',
      rules,
      guidelines,
      codingStyle,
      buildCommands,
      architecture,
    },
    metadata: {
      source: 'agents',
      imported: new Date().toISOString(),
    },
  };

  return {
    success: true,
    faf,
    warnings,
    sectionsFound: parsed.sections.map(s => s.title),
  };
}

function createEmptyFaf(): FafFromAgents {
  return {
    project: {
      name: 'Unknown',
      description: '',
      type: 'agents-import',
      rules: [],
      guidelines: [],
      codingStyle: [],
      buildCommands: [],
      architecture: [],
    },
    metadata: {
      source: 'agents',
      imported: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Export: FAF → AGENTS.md
// ============================================================================

export async function agentsExport(
  fafContent: any,
  outputPath: string
): Promise<AgentsExportResult> {
  const warnings: string[] = [];

  // Build AGENTS.md content
  const lines: string[] = [];

  // Project header
  const projectName = fafContent.project?.name || fafContent.name || 'My Project';
  const projectGoal = fafContent.project?.goal || fafContent.project?.description || fafContent.ai_tldr?.project || '';
  lines.push(`# ${projectName}`);
  lines.push('');

  // Project Overview section
  lines.push('## Project Overview');
  lines.push('');
  if (projectGoal) {
    lines.push(`- ${projectGoal}`);
  }
  if (fafContent.instant_context?.what_building) {
    lines.push(`- ${fafContent.instant_context.what_building}`);
  }
  lines.push('');

  // Tech Stack section
  const stack = fafContent.stack || fafContent.project?.stack || {};
  const hasStack = stack.frontend || stack.backend || stack.build || stack.runtime || stack.database;
  if (hasStack) {
    lines.push('## Tech Stack');
    lines.push('');
    if (stack.frontend) lines.push(`- Frontend: ${stack.frontend}`);
    if (stack.backend) lines.push(`- Backend: ${stack.backend}`);
    if (stack.runtime) lines.push(`- Runtime: ${stack.runtime}`);
    if (stack.build) lines.push(`- Build: ${stack.build}`);
    if (stack.database && stack.database !== 'None') lines.push(`- Database: ${stack.database}`);
    if (stack.package_manager) lines.push(`- Package Manager: ${stack.package_manager}`);
    if (stack.hosting) lines.push(`- Hosting: ${stack.hosting}`);
    if (stack.cicd) lines.push(`- CI/CD: ${stack.cicd}`);
    // Also include languages/frameworks arrays if present
    if (stack.languages?.length > 0) {
      lines.push(`- Languages: ${stack.languages.join(', ')}`);
    }
    if (stack.frameworks?.length > 0) {
      lines.push(`- Frameworks: ${stack.frameworks.join(', ')}`);
    }
    lines.push('');
  }

  // Code Style Guidelines section
  const warnings_list = fafContent.ai_instructions?.warnings || [];
  const codingStyle = fafContent.project?.codingStyle || [];
  const preferences = fafContent.preferences || {};
  const styleItems = [...codingStyle, ...warnings_list];

  if (preferences.quality_bar) styleItems.push(`Quality bar: ${preferences.quality_bar}`);
  if (preferences.commit_style) styleItems.push(`Commit style: ${preferences.commit_style}`);
  if (preferences.testing) styleItems.push(`Testing: ${preferences.testing}`);

  if (styleItems.length > 0) {
    lines.push('## Code Style Guidelines');
    lines.push('');
    for (const item of styleItems) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Build and Test Commands section
  const howContext = fafContent.human_context?.how || fafContent.context?.how;
  const buildCommands = fafContent.project?.buildCommands || [];
  if (howContext || buildCommands.length > 0) {
    lines.push('## Build and Test Commands');
    lines.push('');
    if (howContext) lines.push(`- ${howContext}`);
    for (const cmd of buildCommands) {
      lines.push(`- ${cmd}`);
    }
    lines.push('');
  }

  // Architecture section
  const humanContext = fafContent.human_context || {};
  const architecture = fafContent.project?.architecture || [];
  const archItems = [...architecture];
  if (humanContext.what) archItems.push(humanContext.what);
  if (humanContext.where) archItems.push(`Deployed: ${humanContext.where}`);

  if (archItems.length > 0) {
    lines.push('## Architecture');
    lines.push('');
    for (const item of archItems) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // General Instructions (rules + guidelines)
  const rules = fafContent.project?.rules || [];
  const guidelines = fafContent.project?.guidelines || [];
  const generalInstructions = [...rules, ...guidelines];

  if (generalInstructions.length > 0) {
    lines.push('## General Instructions');
    lines.push('');
    for (const item of generalInstructions) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`*Generated from project.faf by faf-cli — ${new Date().toISOString().split('T')[0]}*`);
  lines.push('');

  // Write file
  const content = lines.join('\n');
  await fs.writeFile(outputPath, content);

  return {
    success: true,
    filePath: outputPath,
    warnings,
  };
}

// ============================================================================
// Detection
// ============================================================================

export async function detectAgentsMd(basePath: string): Promise<string | null> {
  const possiblePaths = [
    path.join(basePath, 'AGENTS.md'),
    path.join(basePath, 'agents.md'),
    path.join(basePath, 'Agents.md'),
  ];

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Check for global AGENTS.md (~/.codex/AGENTS.md)
 */
export async function detectGlobalAgentsMd(): Promise<string | null> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const globalPath = path.join(home, '.codex', 'AGENTS.md');

  try {
    await fs.access(globalPath);
    return globalPath;
  } catch {
    return null;
  }
}
