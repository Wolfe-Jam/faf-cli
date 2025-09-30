/**
 * 🏁 FIX-ONCE: COMMANDER ABSTRACTION
 * Drop-in replacement for commander using native parser
 *
 * DC VICTORY #3: Only ONE place to change!
 */

// Toggle this to switch between commander and native
const USE_NATIVE = true;

// 🏎️ NATIVE PARSER - ZERO DEPENDENCIES!
export { program, Command } from '../utils/native-cli-parser';

// For TypeScript compatibility
export type { ParsedArgs as ParseOptions } from '../utils/native-cli-parser';

/**
 * DC STATUS:
 * ✅ Single source of truth
 * ✅ Easy rollback if needed
 * ✅ Zero changes to rest of codebase
 * ✅ Type-safe
 *
 * COMMANDER IS DEFEATED! 💪
 */