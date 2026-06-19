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
// Single-source Server Card + registry `_meta` emitter — consumers (the 5 MCP
// editions, CFM) MUST compose these, never hand-author the `one.faf/context`
// block. `registryMeta` nests under publisher-provided (registry-safe);
// `generateServerCard` is top-level (SEP-2127 card). One context, every door.
export {
  generateServerCard,
  writeServerCard,
  fafContextBlock,
  registryMeta,
  registryName,
  REGISTRY_PUBLISHER_KEY,
} from './interop/servercard.js';
export type { ServerCardOptions } from './interop/servercard.js';
// Single-source 6Ws Interview — consumers (claude-faf-mcp's faf_go etc.) MUST
// import this registry, never reimplement, never copy (kills question drift).
export type { InterviewQuestion, InterviewOption, GoalSeed, TableOf8, TableOf8Row, BoxStatus } from './core/interview.js';
export {
  INTERVIEW,
  SIX_WS_INTERVIEW,
  STACK_INTERVIEW,
  INTERVIEW_BY_PATH,
  INTERVIEW_PATHS,
  INTERVIEW_VERSION,
  questionForSlot,
  interviewForMissing,
  seedSixWsFromGoal,
  buildTableOf8,
} from './core/interview.js';
// The faf_loop decision core — classify gaps (human vs sourceable) + verdict
// (done / can-source / needs-human). The brain the CLI `faf loop` and the
// `/faf-loop` skill both decide from; orchestration lives on top.
export type { LoopStatus, LoopGaps, LoopVerdict, LoopRunStatus, LoopDeps, LoopRunOptions, LoopRunResult } from './core/loop.js';
export { classifyGaps, loopVerdict, isHumanSlot, isEmptyValue, runLoop } from './core/loop.js';
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
// Sourced 6W extractor (README + package, no-guess) + fresh .faf assembler —
// the single source MCPs compose instead of forking their own.
export { relentlessContext } from './detect/relentless.js';
export type { SeededContext } from './detect/relentless.js';
export { assembleFreshFaf } from './detect/assemble.js';
export * as kernel from './wasm/kernel.js';
