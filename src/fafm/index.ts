/** .fafm knowledge-profile library (TS) — INTEROP with claude-fafm-sdk 1.0 */

export {
  PRIORITY_ORDER,
  PRIORITY_RANK,
  KNOWLEDGE_TYPES,
  type Fact,
  type Priority,
  type Profile,
  type SoulDoc,
} from './types.js';

export {
  Soul,
  utcNow,
  canonicalPriority,
  factFromObj,
  factToObj,
} from './soul.js';

export { fromClaudeDir, DEFAULT_SKIP } from './from-claude-dir.js';
