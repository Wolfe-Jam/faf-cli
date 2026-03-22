// Public API exports for faf-cli v6
export type {
  SlotState,
  SlotCategory,
  SlotDef,
  KernelScoreResult,
  ScoreResult,
  TierInfo,
  FafData,
  FafbInfo,
  DetectedFramework,
  FrameworkSignature,
  Signal,
  SignalType,
} from './core/types.js';

export { SLOTS, BASE_SLOTS, ENTERPRISE_SLOTS, SLOT_BY_PATH, slotsByCategory, PLACEHOLDERS, isPlaceholder } from './core/slots.js';
export { TIERS, getTier, getNextTier } from './core/tiers.js';
export { enrichScore } from './core/scorer.js';
export { validateFaf } from './core/schema.js';
export * as kernel from './wasm/kernel.js';
