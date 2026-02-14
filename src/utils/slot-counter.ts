/**
 * 🏆 Slot-Based Scoring - THE CORRECT WAY
 *
 * Implements the advertised formula: (Filled + Ignored) / 21 * 100
 *
 * NOT the backwards way: score / 100 * 21 (fake slots)
 */

export interface SlotCount {
  filled: number;
  ignored: number;
  missing: number;
  score: number;
  filledSlots: string[];
  ignoredSlots: string[];
  missingSlots: string[];
}

/**
 * Check if a slot value should be counted as "ignored"
 */
export function isIgnored(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const normalized = String(value).toLowerCase().trim();
  return normalized === 'slotignored' ||
         normalized === 'none' ||
         normalized === 'unknown' ||
         normalized === 'not specified' ||
         normalized === 'n/a';
}

/**
 * Check if a slot value should be counted as "filled"
 */
export function isFilled(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  // Not ignored and has a value = filled
  return !isIgnored(value);
}

/**
 * Count actual slots and calculate REAL score
 *
 * Pass in the actual values being used in the FAF file
 *
 * @param slots - Object with all 21 slot values
 * @returns Slot count and score
 */
export function countSlots(slots: {
  // Project (4)
  projectName?: any;
  projectGoal?: any;
  mainLanguage?: any;
  projectType?: any;
  // Human context (6)
  who?: any;
  what?: any;
  why?: any;
  where?: any;
  when?: any;
  how?: any;
  // Stack (11)
  frontend?: any;
  uiLibrary?: any;
  backend?: any;
  runtime?: any;
  database?: any;
  build?: any;
  packageManager?: any;
  apiType?: any;
  hosting?: any;
  cicd?: any;
  cssFramework?: any;
}): SlotCount {
  const filled: string[] = [];
  const ignored: string[] = [];
  const missing: string[] = [];

  // Map to slot names
  const slotMap: [string, any][] = [
    // Project (4)
    ['project.name', slots.projectName],
    ['project.goal', slots.projectGoal],
    ['project.main_language', slots.mainLanguage],
    ['project.type', slots.projectType],
    // Human context (6)
    ['human_context.who', slots.who],
    ['human_context.what', slots.what],
    ['human_context.why', slots.why],
    ['human_context.where', slots.where],
    ['human_context.when', slots.when],
    ['human_context.how', slots.how],
    // Stack (11)
    ['stack.frontend', slots.frontend],
    ['stack.ui_library', slots.uiLibrary],
    ['stack.backend', slots.backend],
    ['stack.runtime', slots.runtime],
    ['stack.database', slots.database],
    ['stack.build', slots.build],
    ['stack.package_manager', slots.packageManager],
    ['stack.api_type', slots.apiType],
    ['stack.hosting', slots.hosting],
    ['stack.cicd', slots.cicd],
    ['stack.css_framework', slots.cssFramework],
  ];

  // Count each slot
  for (const [slotName, value] of slotMap) {
    if (isIgnored(value)) {
      ignored.push(slotName);
    } else if (isFilled(value)) {
      filled.push(slotName);
    } else {
      missing.push(slotName);
    }
  }

  // Calculate REAL score: (Filled + Ignored) / 21 * 100
  const score = Math.round(((filled.length + ignored.length) / 21) * 100);

  return {
    filled: filled.length,
    ignored: ignored.length,
    missing: missing.length,
    score,
    filledSlots: filled,
    ignoredSlots: ignored,
    missingSlots: missing
  };
}
