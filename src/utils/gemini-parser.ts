/**
 * GEMINI.md Parser
 *
 * Parses Google Gemini CLI GEMINI.md files for bidirectional
 * interoperability with FAF.
 *
 * GEMINI.md Structure:
 * - H1: Project name
 * - H2: Section headers (General Instructions, Coding Style, etc.)
 * - Bullets: Specific guidelines
 *
 * @see https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface GeminiMdSection {
  title: string;
  content: string[];
}

export interface GeminiMdFile {
  projectName: string;
  sections: GeminiMdSection[];
}

export interface FafFromGemini {
  project: {
    name: string;
    description: string;
    type: string;
    rules: string[];
    guidelines: string[];
    codingStyle: string[];
  };
  metadata: {
    source: string;
    imported: string;
  };
}

export interface GeminiImportResult {
  success: boolean;
  faf: FafFromGemini;
  warnings: string[];
  sectionsFound: string[];
}

export interface GeminiExportResult {
  success: boolean;
  filePath: string;
  warnings: string[];
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse GEMINI.md file content
 */
export function parseGeminiMd(content: string): GeminiMdFile {
  const lines = content.split('\n');
  let projectName = 'Unknown Project';
  const sections: GeminiMdSection[] = [];
  let currentSection: GeminiMdSection | null = null;

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
 * Convert GEMINI.md sections to FAF structure
 */
function categorizeSections(sections: GeminiMdSection[]): {
  rules: string[];
  guidelines: string[];
  codingStyle: string[];
} {
  const rules: string[] = [];
  const guidelines: string[] = [];
  const codingStyle: string[] = [];

  for (const section of sections) {
    const titleLower = section.title.toLowerCase();

    if (titleLower.includes('coding') || titleLower.includes('style') || titleLower.includes('format')) {
      codingStyle.push(...section.content);
    } else if (titleLower.includes('rule') || titleLower.includes('constraint') || titleLower.includes('requirement')) {
      rules.push(...section.content);
    } else {
      // Default to guidelines
      guidelines.push(...section.content);
    }
  }

  return { rules, guidelines, codingStyle };
}

// ============================================================================
// Import: GEMINI.md → FAF
// ============================================================================

export async function geminiImport(geminiPath: string): Promise<GeminiImportResult> {
  const warnings: string[] = [];

  // Check if file exists
  try {
    await fs.access(geminiPath);
  } catch {
    return {
      success: false,
      faf: createEmptyFaf(),
      warnings: [`GEMINI.md not found: ${geminiPath}`],
      sectionsFound: [],
    };
  }

  // Read and parse
  const content = await fs.readFile(geminiPath, 'utf-8');
  const parsed = parseGeminiMd(content);

  if (parsed.sections.length === 0) {
    warnings.push('No sections found in GEMINI.md');
  }

  const { rules, guidelines, codingStyle } = categorizeSections(parsed.sections);

  const faf: FafFromGemini = {
    project: {
      name: parsed.projectName,
      description: `Imported from GEMINI.md`,
      type: 'gemini-import',
      rules,
      guidelines,
      codingStyle,
    },
    metadata: {
      source: 'gemini',
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

function createEmptyFaf(): FafFromGemini {
  return {
    project: {
      name: 'Unknown',
      description: '',
      type: 'gemini-import',
      rules: [],
      guidelines: [],
      codingStyle: [],
    },
    metadata: {
      source: 'gemini',
      imported: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Export: FAF → GEMINI.md
// ============================================================================

export async function geminiExport(
  fafContent: any,
  outputPath: string
): Promise<GeminiExportResult> {
  const warnings: string[] = [];

  // Build GEMINI.md content
  const lines: string[] = [];

  // Project header
  const projectName = fafContent.project?.name || fafContent.name || 'My Project';
  lines.push(`# Project: ${projectName}`);
  lines.push('');

  // Description as intro paragraph if exists
  const description = fafContent.project?.description || fafContent.description;
  if (description) {
    lines.push(description);
    lines.push('');
  }

  // General Instructions section
  const guidelines = fafContent.project?.guidelines || fafContent.guidelines || [];
  const rules = fafContent.project?.rules || fafContent.rules || [];
  const generalInstructions = [...guidelines, ...rules];

  if (generalInstructions.length > 0) {
    lines.push('## General Instructions');
    lines.push('');
    for (const item of generalInstructions) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Coding Style section
  const codingStyle = fafContent.project?.codingStyle || fafContent.codingStyle || [];
  const stack = fafContent.project?.stack || {};

  // Add languages/frameworks to coding style context
  const styleItems = [...codingStyle];
  if (stack.languages?.length > 0) {
    styleItems.push(`Languages: ${stack.languages.join(', ')}`);
  }
  if (stack.frameworks?.length > 0) {
    styleItems.push(`Frameworks: ${stack.frameworks.join(', ')}`);
  }

  if (styleItems.length > 0) {
    lines.push('## Coding Style');
    lines.push('');
    for (const item of styleItems) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Tech Stack section (if detailed)
  if (stack.databases?.length > 0 || stack.infrastructure?.length > 0) {
    lines.push('## Tech Stack');
    lines.push('');
    if (stack.databases?.length > 0) {
      lines.push(`- Databases: ${stack.databases.join(', ')}`);
    }
    if (stack.infrastructure?.length > 0) {
      lines.push(`- Infrastructure: ${stack.infrastructure.join(', ')}`);
    }
    lines.push('');
  }

  // Goals section
  const goals = fafContent.project?.goals || [];
  if (goals.length > 0) {
    lines.push('## Project Goals');
    lines.push('');
    for (const goal of goals) {
      lines.push(`- ${goal}`);
    }
    lines.push('');
  }

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

export async function detectGeminiMd(basePath: string): Promise<string | null> {
  const possiblePaths = [
    path.join(basePath, 'GEMINI.md'),
    path.join(basePath, 'gemini.md'),
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
 * Check for global GEMINI.md
 */
export async function detectGlobalGeminiMd(): Promise<string | null> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const globalPath = path.join(home, '.gemini', 'GEMINI.md');

  try {
    await fs.access(globalPath);
    return globalPath;
  } catch {
    return null;
  }
}
