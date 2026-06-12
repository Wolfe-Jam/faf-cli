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
export { FAF_HEX } from './ui/colors.js';
export { enrichScore, scoreFafYaml } from './core/scorer.js';
export { validateFaf } from './core/schema.js';
export { findFafFile, readFaf, readFafRaw } from './interop/faf.js';
// Single-source project.html renderer — consumers (faf-mcp etc.) MUST use
// this, never reimplement, never copy (kills the divergent old display).
export { generateProjectHtml, writeProjectHtml } from './interop/projecthtml.js';
// Single-source 6Ws Interview — consumers (claude-faf-mcp's faf_go etc.) MUST
// import this registry, never reimplement, never copy (kills question drift).
export type { InterviewQuestion, InterviewOption } from './core/interview.js';
export {
  INTERVIEW,
  SIX_WS_INTERVIEW,
  STACK_INTERVIEW,
  INTERVIEW_BY_PATH,
  INTERVIEW_PATHS,
  INTERVIEW_VERSION,
  questionForSlot,
  interviewForMissing,
} from './core/interview.js';
// Single-source bench engine (the grounding benchmark) — consumers compose
// deriveQuestionSet/gradeAnswers/buildReceipt through the bridge (a future
// faf_bench tool etc.); grading stays byte-identical across CLI and servers.
// INTEGRITY: hand out publicQuestions(qset) — NEVER the raw QuestionSet's
// `answers` (the answer key). The ✪ receipt (sha256 over a canonical
// projection) is the same convention as parity (P3) and trust (P4).
// CLI state-file I/O (.faf-bench.json) is deliberately NOT exported.
export {
  BENCH_VERSION,
  deriveQuestionSet,
  publicQuestions,
  gradeAnswers,
  buildReceipt,
  normalizeAnswer,
  answersMatch,
  ALIAS_GROUPS,
} from './commands/bench.js';
export type { BenchQuestion, QuestionSet, GradeResult, BenchState, RunRecord } from './commands/bench.js';
// Single-source Turbo-Cat (Format-finder) — ~200-format knowledge base.
// Consumers (claude-faf-mcp/grok/faf-mcp faf_formats) compose these through
// the bridge and DELETE their local hardcoded format maps. Contract: sourced-
// only/no-guess, deterministic & order-independent, pure read.
export { turboCatScan, turboCatSlots } from './detect/turbo-cat.js';
export type { TurboCatResult, DiscoveredFormat } from './detect/turbo-cat.js';
export * as kernel from './wasm/kernel.js';
