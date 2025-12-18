/**
 * BIG ORANGE 🍊 - REAL .faf Instance Generator
 * Generates .faf files at different completeness levels using ACTUAL .faf format
 * Based on faf-cli.faf structure
 */

import type { FafInstance } from './types';

/**
 * Generate a .faf instance at a specific completeness score
 * Uses real .faf YAML format with slot-based scoring
 * 
 * @param score - Completeness level (0-100)
 * @param projectPath - Optional project path for analysis
 * @returns FafInstance with generated YAML content
 */
export async function generateFafInstance(
  score: number,
  _projectPath?: string
): Promise<FafInstance> {
  
  if (score === 0) {
    return {
      score: 0,
      content: '',
      metadata: {}
    };
  }

  // Calculate slots based on score
  // Real .faf has 21 total slots
  const totalSlots = 21;
  const filledSlots = Math.round((score / 100) * totalSlots);
  const slotPercentage = Math.round((filledSlots / totalSlots) * 100);

  // Build .faf content as YAML
  const sections: string[] = [];

  // ALWAYS include (even at low scores)
  sections.push(`faf_version: "2.5.0"`);
  sections.push(`ai_scoring_system: "2025-09-20"`);
  sections.push(`ai_score: "${score}%"`);
  
  // Score 10%+: Add confidence and value
  if (score >= 10) {
    const confidence = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    sections.push(`ai_confidence: ${confidence}`);
    sections.push(`ai_value: "${score >= 80 ? '30_seconds_replaces_20_minutes' : 'reduced_questions'}"`);
  }

  // Score 20%+: Add ai_tldr
  if (score >= 20) {
    sections.push(`ai_tldr:`);
    sections.push(`  project: "Demo Project - Color Picker Component"`);
    sections.push(`  stack: ${score >= 50 ? 'React/TypeScript/Vite/Vercel' : 'React'}`);
    sections.push(`  quality_bar: ${score >= 80 ? 'ZERO_ERRORS_F1_STANDARDS' : 'STANDARD'}`);
    sections.push(`  current_focus: Component development`);
    sections.push(`  your_role: Build features with ${score >= 60 ? 'perfect' : 'available'} context`);
  }

  // Score 30%+: Add instant_context
  if (score >= 30) {
    sections.push(`instant_context:`);
    sections.push(`  what_building: "Color picker component"`);
    sections.push(`  tech_stack: React${score >= 50 ? '/TypeScript/Vite' : ''}`);
    sections.push(`  main_language: ${score >= 40 ? 'TypeScript' : 'JavaScript'}`);
    if (score >= 50) {
      sections.push(`  deployment: Vercel`);
      sections.push(`  key_files:`);
      sections.push(`    - package.json`);
      sections.push(`    - tsconfig.json`);
    }
  }

  // Score 40%+: Add context_quality
  if (score >= 40) {
    sections.push(`context_quality:`);
    sections.push(`  slots_filled: "${filledSlots}/${totalSlots} (${slotPercentage}%)"`);
    sections.push(`  ai_confidence: ${score >= 70 ? 'HIGH' : 'MEDIUM'}`);
    sections.push(`  handoff_ready: ${score >= 70 ? 'true' : 'false'}`);
    if (score < 90) {
      sections.push(`  missing_context:`);
      sections.push(`    - ${score < 60 ? 'Project structure' : 'Performance metrics'}`);
    }
  }

  // Score 50%+: Add project section
  if (score >= 50) {
    sections.push(`project:`);
    sections.push(`  name: Demo Color Picker`);
    sections.push(`  goal: "Build reusable color picker component"`);
    sections.push(`  main_language: TypeScript`);
    sections.push(`  generated: "${new Date().toISOString()}"`);
    if (score >= 80) {
      sections.push(`  mission: "🚀 Make Your AI Happy! 🧡 Trust-Driven 🤖"`);
      sections.push(`  revolution: "30 seconds replaces 20 minutes of questions"`);
      sections.push(`  brand: "F1-Inspired Software Engineering - Championship AI Context"`);
    }
  }

  // Score 60%+: Add ai_instructions
  if (score >= 60) {
    sections.push(`ai_instructions:`);
    sections.push(`  priority_order:`);
    sections.push(`    - "1. Read THIS .faf file first"`);
    if (score >= 70) {
      sections.push(`    - "2. Check CLAUDE.md for session context"`);
      sections.push(`    - "3. Review package.json for dependencies"`);
    }
    sections.push(`  working_style:`);
    sections.push(`    code_first: true`);
    sections.push(`    explanations: minimal`);
    sections.push(`    quality_bar: ${score >= 80 ? 'zero_errors' : 'standard'}`);
    sections.push(`    testing: ${score >= 70 ? 'required' : 'recommended'}`);
    if (score >= 80) {
      sections.push(`  warnings:`);
      sections.push(`    - All TypeScript must pass strict mode`);
      sections.push(`    - Test coverage required for new features`);
    }
  }

  // Score 70%+: Add stack
  if (score >= 70) {
    sections.push(`stack:`);
    sections.push(`  frontend: React`);
    sections.push(`  css_framework: Tailwind CSS`);
    sections.push(`  ui_library: Headless UI`);
    sections.push(`  state_management: React Hooks`);
    sections.push(`  backend: None`);
    sections.push(`  runtime: "Node.js >=18.0.0"`);
    sections.push(`  database: None`);
    sections.push(`  build: Vite`);
    sections.push(`  package_manager: npm`);
    sections.push(`  api_type: Component Library`);
    sections.push(`  hosting: Vercel`);
    if (score >= 85) {
      sections.push(`  cicd: GitHub Actions`);
    }
  }

  // Score 80%+: Add preferences
  if (score >= 80) {
    sections.push(`preferences:`);
    sections.push(`  quality_bar: zero_errors`);
    sections.push(`  commit_style: conventional_emoji`);
    sections.push(`  response_style: concise_code_first`);
    sections.push(`  explanation_level: minimal`);
    sections.push(`  communication: direct`);
    sections.push(`  testing: required`);
    sections.push(`  documentation: as_needed`);
  }

  // Score 85%+: Add state
  if (score >= 85) {
    sections.push(`state:`);
    sections.push(`  phase: development`);
    sections.push(`  version: "1.0.0"`);
    sections.push(`  focus: component_implementation`);
    sections.push(`  status: green_flag`);
    sections.push(`  next_milestone: production_ready`);
    sections.push(`  blockers:`);
  }

  // Score 90%+: Add tags
  if (score >= 90) {
    sections.push(`tags:`);
    sections.push(`  auto_generated:`);
    sections.push(`    - react`);
    sections.push(`    - typescript`);
    sections.push(`    - component`);
    sections.push(`    - color-picker`);
    sections.push(`  smart_defaults:`);
    sections.push(`    - .faf`);
    sections.push(`    - ai-ready`);
    sections.push(`    - "2025"`);
    sections.push(`  user_defined:`);
  }

  // Score 95%+: Add human_context
  if (score >= 95) {
    sections.push(`human_context:`);
    sections.push(`  who: Development team`);
    sections.push(`  what: "Reusable color picker component for design system"`);
    sections.push(`  why: Standardize color selection across applications`);
    sections.push(`  where: Component library`);
    sections.push(`  when: "Active development"`);
    sections.push(`  how: "TypeScript React component with accessibility"`);
    sections.push(`  context_score: ${slotPercentage}`);
    sections.push(`  total_prd_score: ${score}`);
    sections.push(`  success_rate: "95%"`);
  }

  // Score 99%+: Add ai_scoring_details (championship level)
  if (score >= 99) {
    sections.push(`ai_scoring_details:`);
    sections.push(`  system_date: "2025-09-20"`);
    sections.push(`  slot_based_percentage: ${slotPercentage}`);
    sections.push(`  ai_score: ${score}`);
    sections.push(`  total_slots: ${totalSlots}`);
    sections.push(`  filled_slots: ${filledSlots}`);
    sections.push(`  scoring_method: "Honest percentage - no fake minimums"`);
    sections.push(`  trust_embedded: "COUNT ONCE architecture - trust MY embedded scores"`);
  }

  const content = sections.join('\n');

  return {
    score,
    content,
    metadata: {
      framework: 'React',
      language: 'TypeScript',
      styling: 'Tailwind CSS',
      quality_bar: score >= 80 ? 'ZERO_ERRORS_F1_STANDARDS' : 'STANDARD',
      slots_filled: filledSlots,
      total_slots: totalSlots
    }
  };
}

/**
 * Calculate a project's current .faf birth score
 * @param projectPath - Path to project
 * @returns Birth score (0-100)
 */
export async function calculateBirthScore(_projectPath: string): Promise<number> {
  // TODO: Implement actual .faf file analysis
  // This would:
  // 1. Check if .faf exists
  // 2. Parse the YAML
  // 3. Count filled slots
  // 4. Calculate score based on slot completeness
  
  // For now, return placeholder
  return 42;
}