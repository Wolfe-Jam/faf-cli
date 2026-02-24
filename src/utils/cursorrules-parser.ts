/**
 * .cursorrules Parser
 *
 * Parses Cursor IDE .cursorrules files for bidirectional
 * interoperability with FAF.
 *
 * .cursorrules Structure:
 * - Free-form markdown with sections
 * - H2: Section headers (optional)
 * - Bullets/paragraphs: Guidelines and rules
 *
 * Note: This generates legacy .cursorrules (single file).
 * The new .cursor/rules/ MDC directory format is a future enhancement.
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface CursorRulesSection {
  title: string;
  content: string[];
}

export interface CursorRulesFile {
  projectName: string;
  sections: CursorRulesSection[];
  rawLines: string[];
}

export interface FafFromCursor {
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

export interface CursorImportResult {
  success: boolean;
  faf: FafFromCursor;
  warnings: string[];
  sectionsFound: string[];
}

export interface CursorExportResult {
  success: boolean;
  filePath: string;
  warnings: string[];
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse .cursorrules file content
 */
export function parseCursorRules(content: string): CursorRulesFile {
  // Strip BOM and normalize line endings (Windows \r\n, old Mac \r)
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  let projectName = 'Unknown Project';
  const sections: CursorRulesSection[] = [];
  let currentSection: CursorRulesSection | null = null;
  const rawLines: string[] = [];

  for (const line of lines) {
    rawLines.push(line);

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
      continue;
    }

    // Non-empty line in a section (paragraph text)
    const trimmed = line.trim();
    if (trimmed && currentSection && !trimmed.startsWith('#')) {
      currentSection.content.push(trimmed);
    }
  }

  // Push last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return { projectName, sections, rawLines };
}

/**
 * Categorize .cursorrules sections into FAF structure
 */
function categorizeSections(sections: CursorRulesSection[]): {
  rules: string[];
  guidelines: string[];
  codingStyle: string[];
} {
  const rules: string[] = [];
  const guidelines: string[] = [];
  const codingStyle: string[] = [];

  for (const section of sections) {
    const titleLower = section.title.toLowerCase();

    if (titleLower.includes('coding') || titleLower.includes('style') || titleLower.includes('format') || titleLower.includes('convention')) {
      codingStyle.push(...section.content);
    } else if (titleLower.includes('rule') || titleLower.includes('constraint') || titleLower.includes('requirement') || titleLower.includes('preference')) {
      rules.push(...section.content);
    } else {
      // Default to guidelines
      guidelines.push(...section.content);
    }
  }

  return { rules, guidelines, codingStyle };
}

// ============================================================================
// Import: .cursorrules → FAF
// ============================================================================

export async function cursorImport(cursorPath: string): Promise<CursorImportResult> {
  const warnings: string[] = [];

  // Check if file exists
  try {
    await fs.access(cursorPath);
  } catch {
    return {
      success: false,
      faf: createEmptyFaf(),
      warnings: [`.cursorrules not found: ${cursorPath}`],
      sectionsFound: [],
    };
  }

  // Read and parse
  const content = await fs.readFile(cursorPath, 'utf-8');
  const parsed = parseCursorRules(content);

  if (parsed.sections.length === 0) {
    warnings.push('No sections found in .cursorrules — treating all content as guidelines');
    // If no sections, treat all non-empty lines as guidelines
    const allLines = parsed.rawLines
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));

    const faf: FafFromCursor = {
      project: {
        name: parsed.projectName,
        description: 'Imported from .cursorrules',
        type: 'cursor-import',
        rules: [],
        guidelines: allLines,
        codingStyle: [],
      },
      metadata: {
        source: 'cursor',
        imported: new Date().toISOString(),
      },
    };

    return {
      success: true,
      faf,
      warnings,
      sectionsFound: [],
    };
  }

  const { rules, guidelines, codingStyle } = categorizeSections(parsed.sections);

  const faf: FafFromCursor = {
    project: {
      name: parsed.projectName,
      description: 'Imported from .cursorrules',
      type: 'cursor-import',
      rules,
      guidelines,
      codingStyle,
    },
    metadata: {
      source: 'cursor',
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

function createEmptyFaf(): FafFromCursor {
  return {
    project: {
      name: 'Unknown',
      description: '',
      type: 'cursor-import',
      rules: [],
      guidelines: [],
      codingStyle: [],
    },
    metadata: {
      source: 'cursor',
      imported: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Export: FAF → .cursorrules
// ============================================================================

export async function cursorExport(
  fafContent: any,
  outputPath: string
): Promise<CursorExportResult> {
  const warnings: string[] = [];

  // Build .cursorrules content
  const lines: string[] = [];

  // Project header
  const projectName = fafContent.project?.name || fafContent.name || 'My Project';
  const projectGoal = fafContent.project?.goal || fafContent.project?.description || fafContent.ai_tldr?.project || '';
  lines.push(`# ${projectName}`);
  lines.push('');
  if (projectGoal) {
    lines.push(projectGoal);
    lines.push('');
  }

  // Tech Stack section
  const stack = fafContent.stack || fafContent.project?.stack || {};
  const hasStack = stack.frontend || stack.backend || stack.build || stack.runtime;
  if (hasStack) {
    lines.push('## Tech Stack');
    lines.push('');
    if (stack.frontend) lines.push(`- Frontend: ${stack.frontend}`);
    if (stack.backend) lines.push(`- Backend: ${stack.backend}`);
    if (stack.runtime) lines.push(`- Runtime: ${stack.runtime}`);
    if (stack.build) lines.push(`- Build: ${stack.build}`);
    if (stack.package_manager) lines.push(`- Package Manager: ${stack.package_manager}`);
    if (stack.languages?.length > 0) {
      lines.push(`- Languages: ${stack.languages.join(', ')}`);
    }
    if (stack.frameworks?.length > 0) {
      lines.push(`- Frameworks: ${stack.frameworks.join(', ')}`);
    }
    lines.push('');
  }

  // Coding Standards section
  const warnings_list = fafContent.ai_instructions?.warnings || [];
  const workingStyle = fafContent.ai_instructions?.working_style || {};
  const codingStyle = fafContent.project?.codingStyle || [];
  const styleItems = [...codingStyle, ...warnings_list];

  if (workingStyle.quality_bar) styleItems.push(`Quality bar: ${workingStyle.quality_bar}`);
  if (workingStyle.testing) styleItems.push(`Testing: ${workingStyle.testing}`);

  if (styleItems.length > 0) {
    lines.push('## Coding Standards');
    lines.push('');
    for (const item of styleItems) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Preferences section
  const preferences = fafContent.preferences || {};
  const prefItems: string[] = [];
  if (preferences.quality_bar) prefItems.push(`Quality bar: ${preferences.quality_bar}`);
  if (preferences.commit_style) prefItems.push(`Commit style: ${preferences.commit_style}`);
  if (preferences.response_style) prefItems.push(`Response style: ${preferences.response_style}`);
  if (preferences.testing) prefItems.push(`Testing: ${preferences.testing}`);
  if (preferences.documentation) prefItems.push(`Documentation: ${preferences.documentation}`);

  if (prefItems.length > 0) {
    lines.push('## Preferences');
    lines.push('');
    for (const item of prefItems) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Build Commands section
  const howContext = fafContent.human_context?.how || fafContent.context?.how;
  if (howContext) {
    lines.push('## Build Commands');
    lines.push('');
    lines.push(`- ${howContext}`);
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
  lines.push(`Generated from project.faf by faf-cli — ${new Date().toISOString().split('T')[0]}`);
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

export async function detectCursorRules(basePath: string): Promise<string | null> {
  const possiblePaths = [
    path.join(basePath, '.cursorrules'),
    path.join(basePath, '.cursor-rules'),
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
