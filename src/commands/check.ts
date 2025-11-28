/**
 * 🔍 Check Command - Quality inspection & protection system
 * Pre-flight inspection for human_context quality + field protection
 *
 * Features:
 * - Quality detection: empty/generic/good/excellent per field
 * - Protection system: lock good content from being overwritten
 * - Integration with faf auto to respect protected fields
 */

import { validateFafFile } from './validate';
import { auditFafFile } from './audit';
import {
  FAF_ICONS,
  FAF_COLORS
} from '../utils/championship-style';
import { findFafFile } from '../utils/file-utils';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface CheckCommandOptions {
  format?: boolean;    // Check format/validity (old validate)
  fresh?: boolean;     // Check freshness/completeness (old audit)
  fix?: boolean;       // Auto-fix issues
  detailed?: boolean;  // Show detailed results
  protect?: boolean;   // Lock good content
  unlock?: boolean;    // Remove protection
  quiet?: boolean;     // Minimal output
}

// Quality levels for human_context fields
type QualityLevel = 'empty' | 'generic' | 'good' | 'excellent';

interface FieldQuality {
  field: string;
  value: string | null;
  quality: QualityLevel;
  protected: boolean;
  suggestion?: string;
}

// Generic values that indicate low quality
const GENERIC_PATTERNS = [
  /^unknown$/i,
  /^none$/i,
  /^n\/a$/i,
  /^todo$/i,
  /^tbd$/i,
  /^placeholder$/i,
  /^fill this/i,
  /^add your/i,
  /^describe/i,
  /^your project/i,
  /^my project/i,
  /^\[.*\]$/,  // [bracketed placeholders]
  /^<.*>$/,   // <angle bracket placeholders>
];

// Quality scoring criteria per field
const QUALITY_CRITERIA: Record<string, { minLength: number; excellentPatterns?: RegExp[] }> = {
  who: {
    minLength: 10,
    excellentPatterns: [/team|company|developer|engineer|community/i]
  },
  what: {
    minLength: 20,
    excellentPatterns: [/that|which|for|enables|provides/i]
  },
  why: {
    minLength: 15,
    excellentPatterns: [/faster|better|easier|simpler|efficient|\d+x/i]
  },
  where: {
    minLength: 8,
    excellentPatterns: [/browser|server|edge|cloud|local|npm|cargo/i]
  },
  when: {
    minLength: 5,
    excellentPatterns: [/v\d|version|\d{4}|release|milestone/i]
  },
  how: {
    minLength: 5,
    excellentPatterns: [/npm|cargo|pip|run|install|clone|demo/i]
  },
};

/**
 * Assess quality of a single field value
 */
function assessFieldQuality(field: string, value: string | null | undefined): QualityLevel {
  // Empty check
  if (!value || value.trim() === '') {
    return 'empty';
  }

  const trimmed = value.trim();

  // Generic check
  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(trimmed)) {
      return 'generic';
    }
  }

  const criteria = QUALITY_CRITERIA[field] || { minLength: 10 };

  // Length check for good
  if (trimmed.length < criteria.minLength) {
    return 'generic';
  }

  // Excellent check
  if (criteria.excellentPatterns) {
    for (const pattern of criteria.excellentPatterns) {
      if (pattern.test(trimmed)) {
        return 'excellent';
      }
    }
  }

  return 'good';
}

/**
 * Get quality indicator emoji
 */
function getQualityIndicator(quality: QualityLevel): string {
  switch (quality) {
    case 'empty': return '⬜';      // Empty slot
    case 'generic': return '🟡';    // Needs improvement
    case 'good': return '🟢';       // Good quality
    case 'excellent': return '💎';  // Excellent
  }
}

/**
 * Get protection status indicator
 */
function getProtectionIndicator(isProtected: boolean): string {
  return isProtected ? '🔒' : '  ';
}

/**
 * Inspect human_context quality and optionally protect fields
 */
export async function checkCommand(options: CheckCommandOptions = {}): Promise<void> {
  try {
    const startTime = Date.now();

    // Find and load the .faf file
    const fafPath = await findFafFile(process.cwd());
    if (!fafPath) {
      console.error(FAF_COLORS.fafOrange('❌ No .faf file found. Run: faf init'));
      process.exit(1);
    }

    const fafContent = await fs.readFile(fafPath, 'utf-8');
    const fafData = parseYAML(fafContent) || {};
    const humanContext = fafData.human_context || {};
    const protectedFields: string[] = fafData._protected_fields || [];

    // The 6 Ws to check
    const fields = ['who', 'what', 'why', 'where', 'when', 'how'];

    // Assess quality of each field
    const fieldQualities: FieldQuality[] = fields.map(field => ({
      field,
      value: humanContext[field] || null,
      quality: assessFieldQuality(field, humanContext[field]),
      protected: protectedFields.includes(field),
    }));

    // Handle --unlock: remove all protections
    if (options.unlock) {
      fafData._protected_fields = [];
      await fs.writeFile(fafPath, stringifyYAML(fafData), 'utf-8');
      console.log(FAF_COLORS.fafCyan(`🔓 All fields unlocked`));
      console.log(`   Protected fields cleared from ${path.basename(fafPath)}`);
      return;
    }

    // Handle --protect: auto-protect good/excellent fields
    if (options.protect) {
      const toProtect = fieldQualities
        .filter(f => f.quality === 'good' || f.quality === 'excellent')
        .map(f => f.field);

      if (toProtect.length === 0) {
        console.log(FAF_COLORS.fafOrange('⚠️ No fields qualify for protection (need good or excellent quality)'));
        return;
      }

      // Merge with existing protected fields
      const newProtected = [...new Set([...protectedFields, ...toProtect])];
      fafData._protected_fields = newProtected;
      await fs.writeFile(fafPath, stringifyYAML(fafData), 'utf-8');

      console.log(FAF_COLORS.fafGreen(`🔒 Protected ${toProtect.length} field(s):`));
      for (const field of toProtect) {
        const q = fieldQualities.find(f => f.field === field);
        console.log(`   ${getQualityIndicator(q?.quality || 'good')} ${field}`);
      }
      console.log();
      console.log(FAF_COLORS.fafCyan(`💡 Protected fields won't be overwritten by faf auto or faf readme`));
      return;
    }

    // Default behavior: show quality inspection
    if (!options.quiet) {
      console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.magnifying_glass} Human Context Quality Check`));
      console.log(FAF_COLORS.fafCyan(`   ${path.basename(fafPath)}`));
      console.log();
    }

    // Count by quality level
    const counts = {
      empty: 0,
      generic: 0,
      good: 0,
      excellent: 0,
    };

    // Display each field
    for (const fq of fieldQualities) {
      counts[fq.quality]++;
      const indicator = getQualityIndicator(fq.quality);
      const lockIcon = getProtectionIndicator(fq.protected);
      const displayValue = fq.value
        ? (fq.value.length > 50 ? fq.value.substring(0, 47) + '...' : fq.value)
        : '(empty)';

      if (!options.quiet) {
        console.log(`   ${indicator} ${lockIcon} ${fq.field.toUpperCase().padEnd(6)} ${FAF_COLORS.fafCyan(displayValue)}`);
      }
    }

    if (!options.quiet) {
      console.log();

      // Summary
      const total = fields.length;
      const qualityScore = Math.round(((counts.excellent * 1.0 + counts.good * 0.75 + counts.generic * 0.25) / total) * 100);

      console.log(`   📊 Quality: ${qualityScore}%`);
      console.log(`   💎 Excellent: ${counts.excellent}  🟢 Good: ${counts.good}  🟡 Generic: ${counts.generic}  ⬜ Empty: ${counts.empty}`);

      if (protectedFields.length > 0) {
        console.log(`   🔒 Protected: ${protectedFields.join(', ')}`);
      }

      console.log();

      // Suggestions
      if (counts.empty > 0 || counts.generic > 0) {
        console.log(FAF_COLORS.fafOrange('   💡 Improve with:'));
        if (counts.empty > 0) {
          console.log(`      faf readme --apply   (auto-extract from README)`);
          console.log(`      faf human-set <field> "<value>"   (manual)`);
        }
        if (counts.generic > 0) {
          console.log(`      faf readme --apply --force   (overwrite generic)`);
        }
      }

      if (counts.good > 0 || counts.excellent > 0) {
        const unprotectedGood = fieldQualities.filter(
          f => (f.quality === 'good' || f.quality === 'excellent') && !f.protected
        ).length;

        if (unprotectedGood > 0) {
          console.log(FAF_COLORS.fafGreen(`   🔒 Lock good content:`));
          console.log(`      faf check --protect   (auto-protect good/excellent)`);
        }
      }

      const duration = Date.now() - startTime;
      console.log();
      console.log(FAF_COLORS.fafCyan(`   ⚡ ${duration}ms`));
    }

    // Also run original format/freshness checks if requested
    if (options.format || options.fresh) {
      console.log();

      if (options.format) {
        console.log(`${FAF_COLORS.fafCyan('├─ ')}Checking format and validity...`);
        try {
          await validateFafFile(undefined, {
            verbose: options.detailed
          });
        } catch {
          // Continue
        }
      }

      if (options.fresh) {
        console.log(`${FAF_COLORS.fafCyan('├─ ')}Checking freshness and completeness...`);
        try {
          await auditFafFile(undefined, {});
        } catch {
          // Continue
        }
      }
    }

  } catch (error) {
    console.error(FAF_COLORS.fafOrange(`❌ Check failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Check if a field is protected
 */
export function isFieldProtected(fafData: Record<string, unknown>, field: string): boolean {
  const protectedFields = (fafData._protected_fields as string[]) || [];
  return protectedFields.includes(field);
}

/**
 * Get all protected fields
 */
export function getProtectedFields(fafData: Record<string, unknown>): string[] {
  return (fafData._protected_fields as string[]) || [];
}