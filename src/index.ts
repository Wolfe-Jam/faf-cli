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
// Context-drift engine — the mtime comparison behind `faf drift` / `faf drift
// --json`. Pure; programmatic consumers (the VS Code extension) call
// `computeDrift(fafPath, workspaceRoot)` directly instead of shelling out.
export { computeDrift } from './core/drift.js';
export type { DriftReport, DriftTarget, DriftStatus } from './core/drift.js';
// Single-source project.html renderer — consumers (faf-mcp etc.) MUST use
// this, never reimplement, never copy (kills the divergent old display).
// `generateProjectHtml` is a deprecated alias — use `renderProjectHtml`.
export { renderProjectHtml, generateProjectHtml, writeProjectHtml } from './interop/projecthtml.js';
// Single-source Server Card + registry `_meta` emitter — consumers (the 5 MCP
// editions, CFM) MUST compose these, never hand-author the `one.faf/context`
// block. `registryMeta` nests under publisher-provided (registry-safe);
// `buildServerCard` is top-level (SEP-2127 card). One context, every door.
// `generateServerCard` is a deprecated alias — use `buildServerCard`.
export {
  buildServerCard,
  generateServerCard,
  writeServerCard,
  fafContextBlock,
  registryMeta,
  registryName,
  REGISTRY_PUBLISHER_KEY,
} from './interop/servercard.js';
export type { ServerCardOptions } from './interop/servercard.js';
// `generateA2ACard` is a deprecated alias — use `buildA2ACard`.
export {
  projectCards,
  readFafa,
  findFafaFile,
  buildA2ACard,
  generateA2ACard,
  upsertCatalog,
  A2A_CONTEXT_URI,
} from './interop/cards.js';
export type { FafaDoc, CardTarget, ProjectedCards } from './interop/cards.js';
// .fafm knowledge-profile library (TS) — INTEROP with claude-fafm-sdk 1.0
export {
  Soul as FafmSoul,
  fromClaudeDir,
  canonicalPriority,
  utcNow,
  PRIORITY_ORDER,
  PRIORITY_RANK,
  KNOWLEDGE_TYPES,
} from './fafm/index.js';
export type { Fact as FafmFact, SoulDoc, Profile as FafmProfile } from './fafm/index.js';
// Single-source 6Ws Interview — consumers (claude-faf-mcp's faf_go etc.) MUST
// import this registry, never reimplement, never copy (kills question drift).
export type { InterviewQuestion, InterviewOption, HumanSlotPath, SourcedSlotPath, GoalSeed, TableOf8, TableOf8Row, BoxStatus } from './core/interview.js';
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
export { relentlessContext, relentlessContextDetailed } from './detect/relentless.js';
export type { SeededContext, SeededContextDetailed, SourcedValue } from './detect/relentless.js';
export { assembleFreshFaf, updateExistingFaf, fillEmpties } from './detect/assemble.js';
// 7.12.0 — the interop renderers, the block injector, repo enrichment and the
// .faf writer become public. Consumers (faf-mcp's faf_agents / faf_cursor /
// faf_gemini / faf_bi_sync / faf_auto) compose these and DELETE their hand-
// ported copies: same bytes `faf export --agents/--gemini/--cursor`, `faf sync`
// and `faf auto` write, and one injector with one marker rule.
export { renderAgentsMd, writeAgentsMd } from './interop/agents.js';
export { renderGeminiMd, writeGeminiMd } from './interop/gemini.js';
export { renderCursorrules, writeCursorrules } from './interop/cursorrules.js';
export { renderCopilotInstructions, writeCopilotInstructions } from './interop/copilot-instructions.js';
export { renderClaudeMd, writeClaudeMd, readClaudeMd, parseClaudeMd, fafMetaTag } from './interop/claude.js';
export type { FafMetaOpts } from './interop/claude.js';
export { injectFafBlock, findFafBlock, FAF_START, FAF_END } from './interop/inject.js';
export { enrichFromRepo } from './detect/enrich.js';
export { serializeFaf, writeFaf } from './interop/faf.js';
export * as kernel from './wasm/kernel.js';
