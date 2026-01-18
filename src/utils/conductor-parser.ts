/**
 * Conductor Format Parser
 *
 * Parses Google's Conductor extension format (conductor/ directory)
 * for bidirectional interoperability with FAF.
 *
 * @see /specs/FAF-CONDUCTOR-INTEROP.md
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface ConductorProduct {
  title: string;
  description: string;
  goals: string[];
  users: string[];
  features: string[];
}

export interface ConductorTechStack {
  languages: string[];
  frameworks: string[];
  databases: string[];
  infrastructure: string[];
}

export interface ConductorWorkflow {
  developmentProcess: string[];
  commitStrategy: string[];
  reviewProcess: string[];
}

export interface ConductorGuidelines {
  proseStyle: string[];
  brandingRules: string[];
  visualIdentity: string[];
}

export interface ConductorDirectory {
  product?: ConductorProduct;
  techStack?: ConductorTechStack;
  workflow?: ConductorWorkflow;
  guidelines?: ConductorGuidelines;
  styleguides?: Record<string, string[]>;
}

export interface FafFromConductor {
  project: {
    name: string;
    description: string;
    type: string;
    goals: string[];
    stack: {
      languages: string[];
      frameworks: string[];
      databases: string[];
      infrastructure: string[];
    };
    rules: string[];
    guidelines: string[];
  };
  metadata: {
    source: string;
    imported: string;
    conductor_version?: string;
  };
}

export interface ImportResult {
  success: boolean;
  faf: FafFromConductor;
  warnings: string[];
  filesProcessed: string[];
}

export interface ExportResult {
  success: boolean;
  filesGenerated: string[];
  warnings: string[];
}

// ============================================================================
// Markdown Parsing
// ============================================================================

/**
 * Parse markdown content and extract sections by heading
 */
export function parseMarkdownSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let currentSection = '_intro';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = headingMatch[1].toLowerCase().replace(/\s+/g, '_');
      currentContent = [];
    } else if (line.match(/^#\s+(.+)$/)) {
      const titleMatch = line.match(/^#\s+(.+)$/);
      if (titleMatch) {
        sections['_title'] = titleMatch[1];
      }
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}

/**
 * Extract bullet points from markdown content
 */
export function extractBulletPoints(content: string): string[] {
  const lines = content.split('\n');
  const bullets: string[] = [];

  for (const line of lines) {
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      bullets.push(bulletMatch[1].trim());
    }
  }

  return bullets;
}

// ============================================================================
// File Parsers
// ============================================================================

export function parseProductMd(content: string): ConductorProduct {
  const sections = parseMarkdownSections(content);

  return {
    title: sections['_title'] || 'Unknown Project',
    description: sections['overview'] || '',
    goals: extractBulletPoints(sections['goals'] || ''),
    users: extractBulletPoints(sections['target_users'] || ''),
    features: extractBulletPoints(sections['key_features'] || ''),
  };
}

export function parseTechStackMd(content: string): ConductorTechStack {
  const sections = parseMarkdownSections(content);

  return {
    languages: extractBulletPoints(sections['languages'] || ''),
    frameworks: extractBulletPoints(sections['frameworks'] || ''),
    databases: extractBulletPoints(sections['databases'] || ''),
    infrastructure: extractBulletPoints(sections['infrastructure'] || ''),
  };
}

export function parseWorkflowMd(content: string): ConductorWorkflow {
  const sections = parseMarkdownSections(content);

  return {
    developmentProcess: extractBulletPoints(sections['development_process'] || ''),
    commitStrategy: extractBulletPoints(sections['commit_strategy'] || ''),
    reviewProcess: extractBulletPoints(sections['review_process'] || ''),
  };
}

export function parseGuidelinesMd(content: string): ConductorGuidelines {
  const sections = parseMarkdownSections(content);

  return {
    proseStyle: extractBulletPoints(sections['prose_style'] || ''),
    brandingRules: extractBulletPoints(sections['branding_rules'] || ''),
    visualIdentity: extractBulletPoints(sections['visual_identity'] || ''),
  };
}

// ============================================================================
// Import: Conductor → FAF
// ============================================================================

export async function conductorImport(conductorPath: string): Promise<ImportResult> {
  const warnings: string[] = [];
  const filesProcessed: string[] = [];

  const faf: FafFromConductor = {
    project: {
      name: 'Unknown',
      description: '',
      type: 'conductor-import',
      goals: [],
      stack: {
        languages: [],
        frameworks: [],
        databases: [],
        infrastructure: [],
      },
      rules: [],
      guidelines: [],
    },
    metadata: {
      source: 'conductor',
      imported: new Date().toISOString(),
    },
  };

  // Parse product.md
  const productPath = path.join(conductorPath, 'product.md');
  try {
    const content = await fs.readFile(productPath, 'utf-8');
    const product = parseProductMd(content);
    faf.project.name = product.title;
    faf.project.description = product.description;
    faf.project.goals = product.goals;
    filesProcessed.push('product.md');
  } catch {
    warnings.push('product.md not found - using defaults');
  }

  // Parse tech-stack.md
  const techStackPath = path.join(conductorPath, 'tech-stack.md');
  try {
    const content = await fs.readFile(techStackPath, 'utf-8');
    const techStack = parseTechStackMd(content);
    faf.project.stack = techStack;
    filesProcessed.push('tech-stack.md');
  } catch {
    warnings.push('tech-stack.md not found - stack will be empty');
  }

  // Parse workflow.md
  const workflowPath = path.join(conductorPath, 'workflow.md');
  try {
    const content = await fs.readFile(workflowPath, 'utf-8');
    const workflow = parseWorkflowMd(content);
    faf.project.rules = [
      ...workflow.developmentProcess,
      ...workflow.commitStrategy,
      ...workflow.reviewProcess,
    ];
    filesProcessed.push('workflow.md');
  } catch {
    warnings.push('workflow.md not found - rules will be empty');
  }

  // Parse product-guidelines.md
  const guidelinesPath = path.join(conductorPath, 'product-guidelines.md');
  try {
    const content = await fs.readFile(guidelinesPath, 'utf-8');
    const guidelines = parseGuidelinesMd(content);
    faf.project.guidelines = [
      ...guidelines.proseStyle,
      ...guidelines.brandingRules,
      ...guidelines.visualIdentity,
    ];
    filesProcessed.push('product-guidelines.md');
  } catch {
    warnings.push('product-guidelines.md not found - guidelines will be empty');
  }

  return {
    success: filesProcessed.length > 0,
    faf,
    warnings,
    filesProcessed,
  };
}

// ============================================================================
// Export: FAF → Conductor
// ============================================================================

export async function conductorExport(
  faf: FafFromConductor,
  outputPath: string
): Promise<ExportResult> {
  const filesGenerated: string[] = [];
  const warnings: string[] = [];

  // Ensure output directory exists
  try {
    await fs.mkdir(outputPath, { recursive: true });
  } catch (err) {
    return {
      success: false,
      filesGenerated: [],
      warnings: [`Failed to create output directory: ${err}`],
    };
  }

  // Generate product.md
  const productContent = `# ${faf.project.name}

## Overview
${faf.project.description}

## Goals
${faf.project.goals.map(g => `- ${g}`).join('\n')}
`;
  await fs.writeFile(path.join(outputPath, 'product.md'), productContent);
  filesGenerated.push('product.md');

  // Generate tech-stack.md
  const techStackContent = `# Tech Stack

## Languages
${faf.project.stack.languages.map(l => `- ${l}`).join('\n')}

## Frameworks
${faf.project.stack.frameworks.map(f => `- ${f}`).join('\n')}

## Databases
${faf.project.stack.databases.map(d => `- ${d}`).join('\n')}

## Infrastructure
${faf.project.stack.infrastructure.map(i => `- ${i}`).join('\n')}
`;
  await fs.writeFile(path.join(outputPath, 'tech-stack.md'), techStackContent);
  filesGenerated.push('tech-stack.md');

  // Generate workflow.md
  const workflowContent = `# Workflow

## Rules
${faf.project.rules.map(r => `- ${r}`).join('\n')}
`;
  await fs.writeFile(path.join(outputPath, 'workflow.md'), workflowContent);
  filesGenerated.push('workflow.md');

  // Generate product-guidelines.md
  const guidelinesContent = `# Product Guidelines

## Guidelines
${faf.project.guidelines.map(g => `- ${g}`).join('\n')}
`;
  await fs.writeFile(path.join(outputPath, 'product-guidelines.md'), guidelinesContent);
  filesGenerated.push('product-guidelines.md');

  return {
    success: true,
    filesGenerated,
    warnings,
  };
}

// ============================================================================
// Detection
// ============================================================================

export async function detectConductor(basePath: string): Promise<boolean> {
  const conductorPath = path.join(basePath, 'conductor');

  try {
    const stat = await fs.stat(conductorPath);
    if (!stat.isDirectory()) {return false;}
  } catch {
    return false;
  }

  // Check for at least one required file
  const requiredFiles = ['product.md', 'tech-stack.md', 'workflow.md'];
  for (const file of requiredFiles) {
    try {
      await fs.access(path.join(conductorPath, file));
      return true;
    } catch {
      continue;
    }
  }

  return false;
}
