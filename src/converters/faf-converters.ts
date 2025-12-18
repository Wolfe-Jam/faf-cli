/**
 * 🏆 GOLDEN RULE CONVERTERS
 * One Way Output: .faf = YAML ONLY
 * Converters: YAML → MD, YAML → TXT
 */

import * as fs from 'fs';
import { parse as parseYAML } from '../fix-once/yaml';

export interface FafData {
  ai_scoring_system?: string;
  ai_score?: string;
  ai_confidence?: string;
  project?: {
    name?: string;
    goal?: string;
    version?: string;
    main_language?: string;
  };
  stack?: any;
  state?: {
    phase?: string;
    version?: string;
    status?: string;
  };
  [key: string]: any;
}

/**
 * 🏁 Convert .faf YAML to Markdown
 */
export function fafToMarkdown(fafPath: string): string {
  const yamlContent = fs.readFileSync(fafPath, 'utf-8');
  const data: FafData = parseYAML(yamlContent);

  let md = `# 🏎️ FAF Context - ${data.project?.name || 'Project'}\n\n`;

  // Score section
  if (data.ai_score) {
    md += `## 📊 AI Readiness Score: ${data.ai_score}\n`;
    md += `**Confidence:** ${data.ai_confidence || 'N/A'}\n\n`;
  }

  // Project overview
  if (data.project) {
    md += `## 🎯 Project Overview\n`;
    md += `- **Name:** ${data.project.name}\n`;
    md += `- **Goal:** ${data.project.goal || 'Not specified'}\n`;
    md += `- **Version:** ${data.project.version || '1.0.0'}\n`;
    md += `- **Language:** ${data.project.main_language || 'Not specified'}\n\n`;
  }

  // Stack
  if (data.stack) {
    md += `## 🛠️ Technology Stack\n`;
    Object.entries(data.stack).forEach(([key, value]) => {
      if (value && value !== 'None') {
        md += `- **${key}:** ${value}\n`;
      }
    });
    md += '\n';
  }

  // State
  if (data.state) {
    md += `## 📍 Current State\n`;
    md += `- **Phase:** ${data.state.phase || 'development'}\n`;
    md += `- **Version:** ${data.state.version || '1.0.0'}\n`;
    md += `- **Status:** ${data.state.status || 'active'}\n\n`;
  }

  // PODIUM Status
  const score = parseInt(data.ai_score?.replace('%', '') || '0');
  let podium = '';
  if (score >= 105) {podium = '🏆 TROPHY (Big Orange!)';}
  else if (score >= 99) {podium = '🥇 GOLD';}
  else if (score >= 95) {podium = '🥈 SILVER';}
  else if (score >= 85) {podium = '🥉 BRONZE';}
  else {podium = '🏗️ BUILDING';}

  md += `## 🏁 PODIUM Status: ${podium}\n\n`;

  md += `---\n`;
  md += `*Generated from .faf YAML - The Golden Rule*\n`;

  return md;
}

/**
 * 🏁 Convert .faf YAML to Plain Text
 */
export function fafToText(fafPath: string): string {
  const yamlContent = fs.readFileSync(fafPath, 'utf-8');
  const data: FafData = parseYAML(yamlContent);

  let txt = `FAF CONTEXT REPORT\n`;
  txt += `==================\n\n`;

  // Basic info
  txt += `Project: ${data.project?.name || 'Unknown'}\n`;
  txt += `Score: ${data.ai_score || 'Not scored'}\n`;
  txt += `Confidence: ${data.ai_confidence || 'N/A'}\n\n`;

  // Project details
  if (data.project) {
    txt += `PROJECT DETAILS\n`;
    txt += `---------------\n`;
    txt += `Name: ${data.project.name}\n`;
    txt += `Goal: ${data.project.goal || 'Not specified'}\n`;
    txt += `Version: ${data.project.version || '1.0.0'}\n`;
    txt += `Language: ${data.project.main_language || 'Not specified'}\n\n`;
  }

  // Stack (simplified)
  if (data.stack) {
    txt += `TECHNOLOGY STACK\n`;
    txt += `----------------\n`;
    Object.entries(data.stack).forEach(([key, value]) => {
      if (value && value !== 'None') {
        txt += `${key}: ${value}\n`;
      }
    });
    txt += '\n';
  }

  // Score interpretation
  const score = parseInt(data.ai_score?.replace('%', '') || '0');
  txt += `PODIUM STATUS\n`;
  txt += `-------------\n`;
  if (score >= 105) {txt += 'TROPHY - Big Orange Achievement!\n';}
  else if (score >= 99) {txt += 'GOLD - Championship Ready!\n';}
  else if (score >= 95) {txt += 'SILVER - Excellent Foundation!\n';}
  else if (score >= 85) {txt += 'BRONZE - Good Progress!\n';}
  else {txt += 'BUILDING - Keep Going!\n';}

  txt += `\n---\n`;
  txt += `Generated from .faf YAML\n`;
  txt += `The Golden Rule: One Way Output\n`;

  return txt;
}

/**
 * 🏁 Save converted output
 */
export function saveConversion(fafPath: string, format: 'md' | 'txt'): string {
  const outputPath = fafPath.replace('.faf', `.faf.${format}`);

  try {
    const converted = format === 'md'
      ? fafToMarkdown(fafPath)
      : fafToText(fafPath);

    fs.writeFileSync(outputPath, converted);
    return outputPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Conversion failed: ${message}`);
  }
}

/**
 * 🏁 CLI-friendly converter
 */
export function convertFaf(fafPath: string, options: { format?: 'md' | 'txt', output?: string } = {}) {
  const format = options.format || 'md';

  if (!fs.existsSync(fafPath)) {
    throw new Error(`File not found: ${fafPath}`);
  }

  const converted = format === 'md'
    ? fafToMarkdown(fafPath)
    : fafToText(fafPath);

  if (options.output) {
    fs.writeFileSync(options.output, converted);
    return `Converted to ${options.output}`;
  }

  return converted;
}