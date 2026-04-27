/**
 * @faf/core - Pure TypeScript Core for Claude Code Integration
 * Zero dependencies except YAML - designed for seamless integration
 */

import YAML from 'yaml';

// Core FAF interfaces - minimal and focused
export interface FAFProject {
  project: {
    name: string;
    goal: string;
    main_language?: string;
  };
  human_context?: {
    who?: string;
    what?: string;
    why?: string;
    where?: string;
    when?: string;
    how?: string;
  };
  stack?: {
    frontend?: string;
    backend?: string;
    database?: string;
    runtime?: string;
    hosting?: string;
    [key: string]: string | undefined;
  };
  metadata?: {
    version: string;
    score?: number;
    tier?: string;
    lastUpdated?: string;
  };
}

export interface FAFScore {
  score: number;
  tier: 'RED' | 'YELLOW' | 'GREEN' | 'SILVER' | 'GOLD' | 'TROPHY';
  populated: number;
  total: number;
  empty: string[];
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface BiSyncResult {
  direction: 'push' | 'pull' | 'none';
  synced: boolean;
  changes: string[];
  conflicts: string[];
}

// Core FAF engine - pure functions, no side effects
export class FAFCore {
  /**
   * Parse .faf YAML content into structured data
   */
  static parse(content: string): FAFProject {
    try {
      const parsed = YAML.parse(content);
      return this.validateAndNormalize(parsed);
    } catch (error) {
      throw new Error(`Failed to parse FAF content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Serialize FAF project to YAML string
   */
  static serialize(project: FAFProject): string {
    try {
      // Clean undefined values for cleaner output
      const cleaned = this.cleanUndefined(project);
      return YAML.stringify(cleaned, {
        indent: 2,
        lineWidth: 80,
        minContentWidth: 0
      });
    } catch (error) {
      throw new Error(`Failed to serialize FAF project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Score FAF project completeness (0-100%)
   */
  static score(project: FAFProject): FAFScore {
    const slots = this.getSlots();
    const populated = slots.filter(slot => this.isSlotPopulated(project, slot));
    const empty = slots.filter(slot => !this.isSlotPopulated(project, slot));
    
    const score = Math.round((populated.length / slots.length) * 100);
    const tier = this.getTier(score);
    
    const validation = this.validate(project);
    
    return {
      score,
      tier,
      populated: populated.length,
      total: slots.length,
      empty: empty.map(slot => slot.path),
      validation
    };
  }

  /**
   * Initialize empty FAF project with sensible defaults
   */
  static init(options: {
    name?: string;
    goal?: string;
    language?: string;
    framework?: string;
  } = {}): FAFProject {
    return {
      project: {
        name: options.name || 'My Project',
        goal: options.goal || 'Build something awesome',
        main_language: options.language
      },
      human_context: {
        what: `Building ${  options.name || 'a project'}`,
        why: options.goal || 'To solve problems and create value'
      },
      stack: options.framework ? {
        frontend: options.framework
      } : undefined,
      metadata: {
        version: '3.0',
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Bi-directional sync between FAF and CLAUDE.md
   */
  static biSync(
    fafContent: string,
    claudeContent: string,
    fafModTime: Date,
    claudeModTime: Date
  ): { direction: 'push' | 'pull' | 'none'; result: string } {
    // Determine direction based on modification times
    let direction: 'push' | 'pull' | 'none' = 'none';
    
    if (fafModTime > claudeModTime) {
      direction = 'push'; // .faf is newer, update CLAUDE.md
    } else if (claudeModTime > fafModTime) {
      direction = 'pull'; // CLAUDE.md is newer, update .faf
    }
    
    if (direction === 'none') {
      return { direction, result: fafContent };
    }
    
    try {
      if (direction === 'push') {
        // Convert .faf to CLAUDE.md format
        const project = this.parse(fafContent);
        const claudeMd = this.toClaude(project);
        return { direction, result: claudeMd };
      } else {
        // Convert CLAUDE.md to .faf format
        const project = this.fromClaude(claudeContent);
        const fafYaml = this.serialize(project);
        return { direction, result: fafYaml };
      }
    } catch (error) {
      throw new Error(`Bi-sync failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert FAF project to CLAUDE.md format
   */
  static toClaude(project: FAFProject): string {
    const lines: string[] = [];
    
    lines.push(`# CLAUDE.md — ${project.project.name}`);
    lines.push('');
    lines.push('## What This Is');
    lines.push('');
    lines.push(project.project.goal);
    lines.push('');
    
    if (project.human_context?.what) {
      lines.push('## What We\'re Building');
      lines.push('');
      lines.push(project.human_context.what);
      lines.push('');
    }
    
    if (project.stack && Object.keys(project.stack).length > 0) {
      lines.push('## Tech Stack');
      lines.push('');
      for (const [key, value] of Object.entries(project.stack)) {
        if (value) {
          lines.push(`- **${this.formatStackKey(key)}**: ${value}`);
        }
      }
      lines.push('');
    }
    
    if (project.human_context?.why) {
      lines.push('## Why This Matters');
      lines.push('');
      lines.push(project.human_context.why);
      lines.push('');
    }
    
    // Add sync marker
    lines.push('---');
    lines.push('');
    lines.push('**STATUS: BI-SYNC ACTIVE 🔗** - Synchronized with .faf context');
    lines.push('');
    lines.push(`*Last Sync: ${new Date().toISOString()}*`);
    lines.push('*Sync Engine: Claude Code Integration*');
    
    return lines.join('\n');
  }

  /**
   * Extract FAF project from CLAUDE.md content
   */
  static fromClaude(content: string): FAFProject {
    const lines = content.split('\n');
    
    let name = 'Project';
    let goal = 'Build something awesome';
    let what = '';
    let why = '';
    const stack: Record<string, string> = {};
    
    // Simple parsing - can be enhanced
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# ') && line.includes('CLAUDE.md')) {
        const match = line.match(/# CLAUDE\.md — (.+)/);
        if (match) {name = match[1];}
      }
      
      if (line === '## What This Is' && i + 2 < lines.length) {
        goal = lines[i + 2].trim() || goal;
      }
      
      if (line === '## What We\'re Building' && i + 2 < lines.length) {
        what = lines[i + 2].trim() || what;
      }
      
      if (line === '## Why This Matters' && i + 2 < lines.length) {
        why = lines[i + 2].trim() || why;
      }
      
      if (line.startsWith('- **') && line.includes('**:')) {
        const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
        if (match) {
          const key = this.unformatStackKey(match[1]);
          stack[key] = match[2];
        }
      }
    }
    
    return {
      project: { name, goal },
      human_context: { what, why },
      stack: Object.keys(stack).length > 0 ? stack : undefined,
      metadata: {
        version: '3.0',
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Validate FAF project structure
   */
  private static validate(project: FAFProject): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields
    if (!project.project?.name) {
      errors.push('project.name is required');
    }
    if (!project.project?.goal) {
      errors.push('project.goal is required');
    }
    
    // Warnings for missing recommended fields
    if (!project.human_context?.what) {
      warnings.push('human_context.what recommended for better AI understanding');
    }
    if (!project.human_context?.why) {
      warnings.push('human_context.why recommended for context');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get scoring tier based on percentage
   */
  private static getTier(score: number): FAFScore['tier'] {
    if (score >= 100) {return 'TROPHY';}
    if (score >= 95) {return 'GOLD';}
    if (score >= 85) {return 'SILVER';}
    if (score >= 70) {return 'GREEN';}
    if (score >= 55) {return 'YELLOW';}
    return 'RED';
  }

  /**
   * Get all scorable slots
   */
  private static getSlots() {
    return [
      { path: 'project.name', required: true },
      { path: 'project.goal', required: true },
      { path: 'project.main_language', required: false },
      { path: 'human_context.who', required: false },
      { path: 'human_context.what', required: false },
      { path: 'human_context.why', required: false },
      { path: 'human_context.where', required: false },
      { path: 'human_context.when', required: false },
      { path: 'human_context.how', required: false }
    ];
  }

  /**
   * Check if a slot is populated
   */
  private static isSlotPopulated(project: FAFProject, slot: { path: string; required: boolean }): boolean {
    const value = this.getNestedValue(project, slot.path);
    return value !== undefined && value !== null && value !== '' && !this.isPlaceholder(value);
  }

  /**
   * Check if value is a placeholder
   */
  private static isPlaceholder(value: any): boolean {
    if (typeof value !== 'string') {return false;}
    
    const placeholders = [
      'TODO', 'FIXME', 'TBD', 'PLACEHOLDER',
      'Your project', 'My project', 'Example',
      '...', 'etc', 'and more'
    ];
    
    return placeholders.some(placeholder => 
      value.toLowerCase().includes(placeholder.toLowerCase())
    );
  }

  /**
   * Get nested object value by path
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  /**
   * Validate and normalize parsed FAF data
   */
  private static validateAndNormalize(data: any): FAFProject {
    if (!data || typeof data !== 'object') {
      throw new Error('FAF content must be a valid object');
    }
    
    // Ensure required structure
    const normalized: FAFProject = {
      project: {
        name: data.project?.name || 'Unnamed Project',
        goal: data.project?.goal || 'No goal specified'
      },
      metadata: {
        version: data.metadata?.version || '3.0',
        lastUpdated: new Date().toISOString(),
        ...data.metadata
      }
    };
    
    // Copy optional sections if they exist
    if (data.project?.main_language) {
      normalized.project.main_language = data.project.main_language;
    }
    
    if (data.human_context) {
      normalized.human_context = data.human_context;
    }
    
    if (data.stack) {
      normalized.stack = data.stack;
    }
    
    return normalized;
  }

  /**
   * Remove undefined values from object
   */
  private static cleanUndefined(obj: any): any {
    if (obj === null || obj === undefined) {return obj;}
    if (typeof obj !== 'object') {return obj;}
    if (Array.isArray(obj)) {return obj.map(item => this.cleanUndefined(item));}
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = this.cleanUndefined(value);
      }
    }
    return cleaned;
  }

  /**
   * Format stack key for display
   */
  private static formatStackKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Unformat stack key from display
   */
  private static unformatStackKey(formatted: string): string {
    return formatted.toLowerCase().replace(/\s+/g, '_');
  }
}

// Export for Claude Code integration
export { FAFCore as default };
export type { FAFProject, FAFScore, BiSyncResult };