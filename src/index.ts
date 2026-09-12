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
// A typed none — `None` / `N/A` / `not applicable` — counts as an empty slot:
// it scores 0 until filled, and a repo fact fills it. `slotignored` comes only
// from the app-type.
export { EXPLICIT_NONE, SLOTIGNORED, isExplicitNone } from './core/slots.js';
export { TIERS, getTier, getNextTier } from './core/tiers.js';
export { FAF_HEX } from './ui/colors.js';
export { enrichScore, scoreFafYaml } from './core/scorer.js';
// `scoreText(result)` — `85%`, or `unknown (—)` when `result.unknown` (an About
// Repo with no source_score: score -1 is a placeholder, never a number to show).
export { scoreText } from './core/scorer.js';
export { validateFaf } from './core/schema.js';
export { findFafFile, readFaf, readFafRaw } from './interop/faf.js';
// Home / filesystem-root guard — the check `faf init` / `faf auto` / `faf go`
// refuse on, by identity (device + inode), not spelling. Consumers (faf-mcp,
// claude-faf-mcp) compose it instead of re-deriving it. The CLI's
// assertProjectCwd is deliberately NOT exported: it exits the process.
export { isNonProjectRoot } from './core/cwd-guard.js';
// Context-drift engine — the mtime comparison behind `faf drift` / `faf drift
// --json`. Pure; programmatic consumers (the VS Code extension) call
// `computeDrift(fafPath, workspaceRoot)` directly instead of shelling out.
export { computeDrift } from './core/drift.js';
export type { DriftReport, DriftTarget, DriftStatus } from './core/drift.js';
// Single-source project.html renderer — consumers (faf-mcp etc.) MUST use
// this, never reimplement, never copy (kills the divergent old display).
// `generateProjectHtml` is a deprecated alias — use `renderProjectHtml`.
export { renderProjectHtml, generateProjectHtml, writeProjectHtml } from './interop/projecthtml.js';
// The `{ force }` options writeProjectHtml and writeServerCard take.
export type { ProjectHtmlWriteOptions } from './interop/projecthtml.js';
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
  registryTitle,
  REGISTRY_PUBLISHER_KEY,
} from './interop/servercard.js';
export type { ServerCardOptions, CardWriteOptions } from './interop/servercard.js';
// Text-preserving identity edit of a registry server.json — the same edit
// `faf server-card` makes: only name / title / version and faf's `_meta`
// context-block keys change; every other byte (key order, a 20-digit number,
// an array on one line) stays. JS build scripts compose it instead of
// re-emitting the manifest.
export { patchServerJson } from './interop/servercard.js';
export type { ServerJsonIdentity } from './interop/servercard.js';
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
export type { Fact as FafmFact, SoulDoc, Profile as FafmProfile, RecallOptions as FafmRecallOptions } from './fafm/index.js';
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
// The pure parts of `faf git` — no git, no network, no child process. Fetch the
// repo your own way, then `authorFafFromRepo(dir, { repoUrl })` returns the
// same FafData `faf git` writes (write it with writeFaf, score it with
// scoreFafYaml). The clone itself stays in the CLI and is not exported.
export { normalizeGitUrl, repoNameFromUrl, authorFafFromRepo } from './detect/git-repo.js';
export type { AuthorFafFromRepoOptions } from './detect/git-repo.js';
// FAF DNA — the `.faf-dna` lineage `faf init` births, `faf auto` / `faf refresh`
// grow and `faf dna` reads. Reads never throw on another tool's shape; growth
// is added only to a file in faf's own shape (another shape is never rewritten).
export { FafDNAManager } from './core/faf-dna.js';
export type { FafDNA, BirthCertificate, VersionEntry, Milestone } from './core/faf-dna.js';
// 7.12.0 — the interop renderers, the block injector, repo enrichment and the
// .faf writer become public. Consumers (faf-mcp's faf_agents / faf_cursor /
// faf_gemini / faf_claude / faf_auto) compose these and DELETE their hand-
// ported copies: same bytes `faf export --agents/--gemini/--cursor`, `faf sync`
// and `faf auto` write, and one injector with one marker rule.
export { renderAgentsMd, writeAgentsMd } from './interop/agents.js';
export { renderGeminiMd, writeGeminiMd } from './interop/gemini.js';
export { renderCursorrules, writeCursorrules } from './interop/cursorrules.js';
export { renderCopilotInstructions, writeCopilotInstructions } from './interop/copilot-instructions.js';
export { renderClaudeMd, writeClaudeMd, readClaudeMd, parseClaudeMd, fafMetaTag } from './interop/claude.js';
export type { FafMetaOpts } from './interop/claude.js';
export { injectFafBlock, findFafBlock, FAF_START, FAF_END } from './interop/inject.js';
export type { InjectOptions } from './interop/inject.js';
// The one line `faf sync` / `faf export` print when faf's block goes on top of
// a file holding older faf text (faf's old stamp, or an older block inside a
// code fence or comment) — so MCP servers built on faf-cli print the same line.
export { legacyStampNote, legacyStampNoteAt } from './interop/inject.js';
// Claude Code auto-memory — the MEMORY.md Claude Code loads for a project
// (<config>/projects/<id>/memory/MEMORY.md). The path follows Claude Code's own
// rule (canonical git root, [^a-zA-Z0-9] → '-', 200-char cut + hash,
// CLAUDE_CONFIG_DIR); the writer keeps one faf block and every line Claude
// wrote. Pro `faf sync` (tri-sync) writes through it; MCP servers compose it.
export {
  claudeProjectId,
  claudeProjectRoot,
  resolveClaudeMemoryDir,
  resolveClaudeMemoryPath,
  renderClaudeMemory,
  writeClaudeMemory,
  claudeMemoryStatus,
} from './interop/claude-memory.js';
export type { ClaudeMemoryOptions, ClaudeMemoryResult, ClaudeMemoryAction, ClaudeMemoryStatus } from './interop/claude-memory.js';
// Safe file access — the primitive every faf writer (and every read of project
// context) goes through: resolve inside the project (a link that leaves it, or
// a dangling link, is refused; in-project links are kept), then write
// atomically (temp file, fsync, rename; the original's mode kept). Consumers
// (claude-faf-mcp, faf-mcp) route their own local reads and writes through
// these instead of writeFileSync on a joined path.
export { resolveInside, safeWriteFile, SafePathError } from './core/safe-write.js';
// Strict UTF-8 read for text faf may write back: a UTF-16 file or bytes that
// are not UTF-8 are refused (SafePathError 'not-utf8'), never turned into
// U+FFFD and written back.
export { readUtf8 } from './core/safe-write.js';
export type { ResolveInsideOptions, SafeWriteOptions, SafePathReason } from './core/safe-write.js';
// The rest of the safe-write family every faf writer uses: replace a whole
// file only when it carries faf's own mark (SafePathError 'not-owned'
// otherwise), make a folder inside the project (never through a link out),
// and remove a file only when it still holds the bytes faf wrote.
export { safeReplaceOwned, makeDirInside, safeUnlink } from './core/safe-write.js';
export type { ReplaceOwnedOptions } from './core/safe-write.js';
export { enrichFromRepo } from './detect/enrich.js';
export { serializeFaf, writeFaf } from './interop/faf.js';
// Document-preserving .faf updates: parse → change the YAML Document → write
// only what changed (comments, source text, anchors, unknown keys and key
// order kept; a no-op writes nothing). writeFaf uses it for existing files.
export { updateFafFile } from './interop/faf.js';
export type { UpdateFafResult, WriteFafOptions, KeptAlias } from './interop/faf.js';
export * as kernel from './wasm/kernel.js';
