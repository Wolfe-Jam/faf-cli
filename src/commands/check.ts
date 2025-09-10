/**
 * 🔍 Check Command - Merged audit + validate functionality
 * Comprehensive .faf file validation and freshness checking
 */

import { validateFafFile } from './validate';
import { auditFafFile } from './audit';
import { 
  FAF_ICONS, 
  FAF_COLORS 
} from '../utils/championship-style';

export interface CheckCommandOptions {
  format?: boolean;    // Check format/validity (old validate)
  fresh?: boolean;     // Check freshness/completeness (old audit)
  fix?: boolean;       // Auto-fix issues
  detailed?: boolean;  // Show detailed results
}

/**
 * Comprehensive check command - combines validation and audit
 */
export async function checkCommand(options: CheckCommandOptions = {}): Promise<void> {
  try {
    const startTime = Date.now();
    
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.magnifying_glass} Comprehensive .faf Check`));
    
    // If no specific options, do both format and freshness checks
    const checkFormat = options.format || (!options.fresh && !options.format);
    const checkFreshness = options.fresh || (!options.fresh && !options.format);
    
    let hasErrors = false;
    
    if (checkFormat) {
      console.log(`${FAF_COLORS.fafCyan('├─ ')}Checking format and validity...`);
      try {
        // Call validate with proper parameters
        await validateFafFile(undefined, { 
          verbose: options.detailed 
        });
      } catch {
        hasErrors = true;
      }
    }
    
    if (checkFreshness) {
      console.log(`${FAF_COLORS.fafCyan('├─ ')}Checking freshness and completeness...`);
      try {
        // Call audit with proper parameters
        await auditFafFile(undefined, {
          // AuditOptions doesn't have detailed, use defaults
        });
      } catch {
        hasErrors = true;
      }
    }
    
    const duration = Date.now() - startTime;
    
    if (!hasErrors) {
      console.log();
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.trophy} All checks passed in ${duration}ms!`));
      console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Try: `)}faf score${FAF_COLORS.fafCyan(' - See your completeness score')}`);
    }
    
  } catch (error) {
    console.error(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} Check failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}