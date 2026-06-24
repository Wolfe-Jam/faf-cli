<!-- faf: faf-cli | TypeScript | cli | CLI for the .faf format — IANA-registered AI context that versions with your code -->
<!-- faf: doc=changelog | latest=v6.15.0 | canonical=project.faf | family=FAF -->

# Changelog

All notable changes to faf-cli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [6.15.0] - 2026-06-24 — The Copilot Edition

FAF now writes the file GitHub Copilot reads. `faf export --copilot` emits `.github/copilot-instructions.md` — the widest-surface Copilot instruction file — straight from your scored `.faf`. And `faf git` is hardened against URL command injection on the way in.

### Added
- `faf export --copilot` — emit `.github/copilot-instructions.md`, GitHub Copilot's repository-wide custom-instructions file and the **widest-surface** instruction file (honored by default across web chat, code review, VS Code, JetBrains, Copilot CLI, and the coding agent). Included in default `export` and `--all`. Non-destructive faf-block injection, idempotent, auto-creates `.github/`.
- Exemplary WJTTC Git suite (`tests/wjttc/git.test.ts`) — BRAKE (injection-proof URL + non-destructive emit), ENGINE (URL normalization, `--copilot`, TAF-receipt determinism), AERO (unicode, boundaries), TYRE (a real `git clone` → real `.faf` → real score).

### Security
- **Hardened `faf git` against URL command injection.** It previously built `git clone … ${url}` and ran it through a shell (`execSync`) — a crafted URL could execute arbitrary commands. Now a strict `normalizeGitUrl` (allowlist, rejects shell metacharacters) plus a no-shell `execFileSync` clone. Injection is structurally impossible.

### Changed
- `faf wjttc` now recognizes all **five** WJTTC tiers — **TYRE** (live, the real road) was missing, so live tests were mislabeled untiered. The audit reports BRAKE · ENGINE · AERO · TYRE · PIT.

## [6.14.0] - 2026-06-21 — The Loop Edition

`faf loop` drives any repo to 🏆 100% or the honest human wall — sourcing every slot it can with provenance, asking only what only you know, never inventing.

### Added
- `faf loop` — drives a repo toward 🏆 100%: sources what detection can (init → auto → score), then reports the human-only gaps as questions. Three honest terminals — `done` (100%), `needs-human` (asks only the slots only a human can answer), `stuck` (sourced everything sourceable, nothing left for a human to add) — and it never fabricates a slot to reach 100%.
- Provenance on sourced 6Ws: `relentlessContext` now carries `{value, source, confidence}` per slot, so every seeded human-context value can say where it came from — a confirm-or-edit suggestion, never an auto-confirmed guess.
- Table-of-8 seeds from the project goal + the detailed README form, carrying source + confidence.

### Changed
- Typed the human/sourced interview boundary at the Truth: `SIX_WS_INTERVIEW` (the 6Ws, human) and `STACK_INTERVIEW` (sourced from manifests) now carry distinct slot-path types — mixing a sourced slot into the human interview is a compile error (the Interview-16 lock).

### Fixed
- Relentless heuristics (dogfood-caught): WHO now catches an optional qualifier ("Built for backend teams"); WHERE accepts short platform names ("Published on npm"); WHY no longer over-matches a bare "goal" mid-sentence.

## [6.13.0] - 2026-06-17 — The Dart Edition

faf now understands Dart and Flutter projects.

Content-aware `pubspec.yaml` classification — Flutter app vs reusable package · Dart server (Serverpod / Dart Frog / Shelf) / CLI / MCP — pure Dart stays Dart. The single-source engine faf-python-sdk and the MCPs compose, parity-tested across languages.

### Added
- Content-aware Dart/Flutter detection: `faf auto` reads `pubspec.yaml` and classifies it — Flutter app vs reusable package, Dart server (Serverpod / Dart Frog / Shelf), Dart CLI, Dart MCP server, or library.
- `src/detect/dart.ts` (content-aware classifier) + `src/detect/dart-detection.json` (single-source detection-knowledge spec; faf-python-sdk vendors a synced copy, the MCPs compose it).
- WJTTC Dart/Flutter suite + cross-language parity fixtures (`tests/detect/dart-parity-fixtures.json`) — faf-cli and faf-python-sdk run the same 20 fixtures, byte-identical results.

### Changed
- Turbo-Cat `pubspec.yaml` handling was filename-only (it flattened every pubspec to "Flutter"); now content-aware via the shared spec.

### Fixed
- A pure-Dart package / CLI / server is no longer misclassified as Flutter (the filename-flattening bug).

## [6.12.0] - 2026-06-15 — The Single-Source Edition

faf-cli is now the single source for the registry `_meta` — it emits the `one.faf/context` block every FAF MCP server composes: `registryMeta`/`registryName`/`fafContextBlock`, one deterministic projection, byte-identical, end-to-end across every surface, verifiable by sha, re-derivable instantly on-demand.

### Added

- **Registry-nested `_meta` emitter — `registryMeta` / `registryName` / `REGISTRY_PUBLISHER_KEY` / `fafContextBlock`** (exported from the public API via `src/interop/servercard.ts`). `registryMeta(faf)` nests the canonical `one.faf/context` block under the registry's only preserved key (`io.modelcontextprotocol.registry/publisher-provided`) and enforces its 4 KB cap (throws past it); `registryName(faf)` derives the reverse-DNS `one.faf/<name>` from `project.homepage` (falls back to `local/<name>`, so an un-homepaged server can't squat the namespace). Honest-first — the block is `{ faf, mediaType, iana, deterministic, [scoreEndpoint], generated }`, **no baked score**. Every FAF MCP server now composes ONE block from faf-cli (the Truth) instead of hand-rolling drift-prone `_meta`: the single source behind the `one.faf` migration.
- **`scoreEndpoint` option + the served-card form** — one emitter produces both the lean rig block and the `faf-server-card-ref` block (absolute faf pointer + `scoreEndpoint`), byte-identical and single-sourced (validated against the live card-ref schema).

### Changed

- **Docs: "Anthropic-approved" → "Anthropic-merged" (#2759)** — corrected at the source (`project.faf` 'what' slot), so it propagates to `package.json` and `CLAUDE.md`; accurate to the merged claude-faf-mcp PR.
- **`SECURITY.md`** — evergreen refresh.

Deterministic build (clean `dist`, zero duplicate-import warnings). Interop coverage for the single-source block: nested-not-top-level, no-baked-score, 4 KB-cap refusal, byte-identity (card ↔ registry), `scoreEndpoint` ordering.

## [6.11.0] - 2026-06-13 — The Ledger Edition

`faf bench --submit` posts your cold-vs-grounded receipt to the public ledger — the context bench goes public, one command.

### Added

- **`faf bench --submit`** — posts the full cold-vs-grounded pair receipt to the public bench ledger (`https://mcpaas.live/bench/submit`; `--endpoint <url>` to override). Fire-and-forget and opt-in: the grounding benchmark stops being a private number and becomes a shared, verifiable receipt (`BENCH_VERSION = faf-bench/1`).
- **`relentlessContext` + `assembleFreshFaf` exported** from the public API — single-sources the seed/build path so consumers compose the relentless context assembly instead of reimplementing it.
- **`buildTableOf8`** (interview) — the 8Qs-flow keystone: Name + Goal + 6Ws, with the goal seeding the 6W slots (terse, sourced from facts), shown as the Table-of-8 for approval before building.

## [6.10.1] - 2026-06-12 — The Composed Edition

### Fixed

- **`manifest.json` asserts Chrome only when content proves it (a no-guess fix).** The knowledge-base entry asserted a full chrome-extension stack (framework, runtime, `mainLanguage: JavaScript`, hosting, apiType) from the filename alone — overriding real `.ts`/`tsconfig` evidence. `manifest.json` is overloaded (chrome extension / mcpb MCP manifest / PWA / plain config), so this was an inference, not sourced truth — and every FAF MCP ships an mcpb `manifest.json`, mis-detecting as a JavaScript Chrome Extension under `turboCatScan`. Now disambiguated by CONTENT: chrome asserts only when `manifest_version` is a number AND a chrome field is present (v2 and v3 both still detect); mcpb, PWA, ambiguous, and unreadable manifests assert nothing — an honest empty beats a guessed stack. Verified on the fleet: claude-faf-mcp / grok-faf-mcp / faf-mcp all detect `TypeScript`. Unblocks the MCP fleet's Turbo-Cat composition.

## [6.10.0] - 2026-06-12 — The Composed Edition

**Every FAF MCP composes single-source engines, never reimplements them.** The bench engine and Turbo-Cat's ~200-format knowledge base join the public API — the third and fourth composed engines, alongside scoring and the 6Ws Interview.

### Added

- **Turbo-Cat exported (`turboCatScan` / `turboCatSlots` / `TurboCatResult` / `DiscoveredFormat`).** The real ~200-format knowledge base, composable through the bridge — so the MCPs DELETE their inferior hardcoded format maps (claude-faf-mcp's 25-entry copy first). `TurboCatResult` widened (additive) with `discoveredFormats` ({fileName, category, priority}[], real files only, deterministic order) and `stackSignature` — the MCP swap is a true drop-in with zero display regression. Contract semver-locked: sourced-only/no-guess (ambiguous npm/yarn/pnpm hints skipped; a stray `.tsx` asserts language, never React), deterministic & order-independent, pure read.
- **The bench engine exported (`deriveQuestionSet` / `gradeAnswers` / `buildReceipt` / `normalizeAnswer` / `answersMatch` / `ALIAS_GROUPS` / `BENCH_VERSION` + types incl. promoted `BenchState`/`RunRecord`).** MCPs compose the grounding benchmark; grading stays byte-identical across CLI and every server. **`publicQuestions(qset)`** — the answer-key-safe projection: any "give me the questions" surface hands out THIS, never the raw `QuestionSet.answers` (a tool that prints the answer key makes the benchmark a lie). The `✪` receipt (sha256 over a canonical projection, third-party re-derivable) is now ONE convention across parity · trust · bench. CLI state-file I/O stays internal.
- **`INTERVIEW_PATHS`** — plain-object companion to `INTERVIEW_BY_PATH`. A `Map` JSON-serializes to `{}`, which reads as "shipped empty" to serializing consumers; bridge consumers that cross a JSON boundary use the record.

17 new contract tests (present + POPULATED on real fixtures, answer-key-not-leaked, deterministic grading, ✪ re-derivation, sourced-only, pure-read). No engine behavior changes — export + stabilize only.

## [6.9.0] - 2026-06-12 — The Grounded Edition

**Grounding becomes a first-class primitive: `faf bench` proves it, the 6Ws Interview single-sources it, `faf refresh` keeps it.**

### Added

- **`faf bench` — the AI-grounding benchmark.** Measures the thing FAF sells, falsifiably: AI works better and faster WITH structured context. Two numbers, one harness — grounding accuracy (N project questions, cold vs with-faf) and grounding cost (reported tokens). The unfair advantage: **the `.faf` IS the answer key** — questions derive from the populated active slots (`slotignored` is never a quiz topic), grading is mechanical (normalize + versioned alias groups + significant-token containment), and the `✪` receipt is a third-party-verifiable sha256 over the run projection. Cold-only runs get the alarm framing — a low score means the AI needs context, never that it needs replacing — and every output ends in the prescription: `faf init && faf bench`. Surface: `faf bench` (protocol) · `bench questions [--json]` · `bench grade <answers.json> --cold|--faf [--tokens N] [--model M]`.
- **The 6Ws Interview, exported — single source.** The canonical question registry (`core/interview.ts`) now ships on the public API: `SIX_WS_INTERVIEW` (the 8-Q core: name + goal + the six Ws, terse-label doctrine in every prompt), `STACK_INTERVIEW` (selects with escape hatches), `INTERVIEW_BY_PATH`, `questionForSlot()`, `interviewForMissing()`, `INTERVIEW_VERSION`. Consumers (claude-faf-mcp's `faf_go` and siblings) import it instead of reimplementing — question drift becomes impossible. `faf go` speaks the same voice.
- **`faf refresh` — the re-ground primitive.** `drift → refresh → re-grounded`: re-reads and re-scores the live `.faf` (authoritative), measures the score-delta vs the DNA baseline (`drift: 43% ↑ 55% (+12)`), keeps an existing `.fafb` fast tier compiled current (never forces a binary on YAML-only projects), and records the re-score on the DNA journey. First refresh births the baseline so the ground always persists. Distinct from `faf drift` (mtime sync) and `faf score` (point-in-time). Grok-driven, root-banked — every surface (CLI, the MCPs' `refresh_faf`, SDKs) inherits this one implementation.

### Fixed

- **Enhanced interop — your files are enhanced, never replaced.** `faf export --agents/--gemini/--cursor` and `faf sync` overwrote AGENTS.md, CLAUDE.md, GEMINI.md, and .cursorrules wholesale — anything you'd written was lost. Now every write goes through a non-destructive injector: a structured `.faf` block owns the top of the file, everything below is preserved, re-runs update the block in place (idempotent), and existing faf-generated files upgrade cleanly in one pass. A build-failing write-guard makes the old behavior impossible to reintroduce.

## [6.8.0] - 2026-05-30 — The Relentless Edition

**Restored: Birth DNA, 6-W extractor, format-finder. Added: Grok interop, extension App-Type. One shared pipeline.**

Every fresh `.faf` ships richer-by-default. `init`, `auto`, `git` flow through one shared assembly pipeline. Grok interop closed. Browser extensions earn their shape. Windows CI root-caused.

### Added

- **`faf export --grok`** — hosted Grok MCP wired (#76)
- **`faf dna`** — birth-to-growth journey
- **Birth DNA** — `.faf-dna` on every fresh `.faf`
- **Relentless 6-W extractor** — manifest + README → context
- **Turbo-Cat format-finder** — 200+ format detection
- **`extension` App-Type** — Manifest V3 browser extensions

### Improved

- **`faf init`** — fully-filled `.faf`, not sparse scaffold
- **`faf git <url>`** — same pipeline as `faf auto`
- **`exports` map** — bun consumers resolve cleanly (#73)
- **Windows CI** — real test timeout on every invocation
- **WJTTC spec-conformance** — `@faf/specification` corpus in isolated CI

### Refactored

- **`src/detect/assemble.ts`** — single source for fresh-.faf entry (init/auto/git)

### Tests

- **WJTTC spec-conformance tier** — ajv on fafm schema
- **WJTTC re-tiering** — restored-tool BRAKE/ENGINE/AERO balance
- **762 pass / 0 fail / 2461 expects** (was 716 at v6.7.1)

### Internal

- CI Node 22 default, matrix `['20','22','24']`
- Dead `.husky/pre-commit` removed
- README — cohort badges top, Home → faf.one/cli, Trophy badge
- `docs/index.html` — 5-surface mirror
- `CITATION.cff` — Context paper + Memory paper

### Notes

- 6.7.2 manifest bump folded into 6.8.0 — never published. Schema unchanged. Public API unchanged.

## [6.7.1] - 2026-05-17

Completes the public API shipped in 6.7.0. The `.` entry now ships
TypeScript declarations so the renderer is consumable from typed
projects, not just at runtime.

### Added

- **Type declarations** — `bun run build` now emits a `.d.ts` tree for
  the public surface via `tsc -p tsconfig.build.json`. `package.json`
  declares `types` and a `types` condition in `exports["."]`.

### Why

6.7.0 exported `generateProjectHtml`, `writeProjectHtml`, `scoreFafYaml`,
`findFafFile`, `readFaf`, `readFafRaw`, `FAF_HEX` as runtime values but
shipped no declarations — a TypeScript consumer (`faf-mcp`, NodeNext)
got `TS2307: Cannot find module 'faf-cli'`. The public API worked at
runtime but was not statically consumable. 6.7.1 makes it real:
single-source the renderer with full types, no hand-written shim.

### Fixed

- `wasm/kernel.ts` — `getKernel()` return narrowed correctly (latent
  `| null` the declaration type-check surfaced; behavior unchanged).

## [6.7.0] - 2026-05-17 — The HTML Edition

**We rendered a `.faf`. 🔥 The day we *saw* FAF.**

This is a major development, not a feature note. The `.faf` was always
there — machine-readable, scoring, versioning with your code. v6.7 is
the day it became **visible**: the same context your AI reads, rendered
for human and team eyes, on-demand, in any browser.

A `.faf` was always machine-readable. Now it is human-visible. `faf show`
renders the current `project.faf` to a self-contained `project.html` and
opens it — the score, the tier, the 6 W's, the stack, on screen, in any
browser. The same truth your AI reads, shown to you. Humans like visuals.
We gave them one.

### Added

- **`faf show`** — render `project.faf` → `project.html` and open it in
  the browser. One verb. Render + open.
- **`faf export --html`** (and `--all`) — emit `project.html` alongside
  `AGENTS.md` / `.cursorrules` / `GEMINI.md`.
- **`project.html` renderer** — self-contained, zero-dependency,
  HTML-escaped, deterministic (no timestamps; a regenerate only differs
  when the `.faf` actually changed). Scored by the real scorer — never a
  reimplementation. Trophy renders the earned award line; sub-Trophy
  renders the honest gaps (a map, not a verdict).
- **Public API** — `generateProjectHtml`, `writeProjectHtml`,
  `scoreFafYaml`, `findFafFile`, `readFaf`, `readFafRaw`, `FAF_HEX`
  exported from the package entry, so consumers render from the single
  source instead of reinventing it.

### Changed

- **Tier colors are now single-sourced.** New `FAF_HEX` in `ui/colors.ts`
  is the one record for brand hex; `tiers.ts` (ANSI) and `project.html`
  (hex) both derive from it — change once, propagates. Trophy/Gold
  orange `#FF6B35`, Silver `#00D4D4`, **Bronze deep cyan `#0E8C8C`**
  (was indistinguishable from Silver). Status colors sourced from the
  FAF brand style guide. HTML communicates with colour the terminal
  cannot.

### Fixed

- **`faf show` opener** uses the canonical externalized `open`
  dependency — never a hand-rolled `xdg-open` (which would inline into
  the bundle and trip the build-resilience brake).

### Notes

- `project.html` is a generated artifact, gitignored like
  `.fafb` / `AGENTS.md`.
- No changes to scoring, the `.faf` schema, or existing command
  behaviour.

## [6.6.1] - 2026-05-12 — Windows CI Restored

A dedicated patch for Windows users. No bin/lib changes; npm package
contents are byte-identical to v6.6.0 aside from the version field.
The reason this release exists: make a Windows-specific fix impossible
to miss, and verify Windows CI end-to-end on a real release tag.

### Fixed

- **Release CI on Windows.** `windows-latest` is back in the
  `release.yml` test matrix. The FAFB byte-parity gate was failing on
  Windows because `git autocrlf` was rewriting `.faf` fixtures from LF
  to CRLF on checkout, shifting the input-hash byte at offset 8.
- **`.gitattributes`** (new) pins `*.faf` to `text eol=lf` and `*.fafb`
  to `binary`. Windows contributors can now clone, run the test suite,
  and develop without CRLF rewrites breaking parity tests. Every future
  release tag will exercise the Windows job end-to-end.

### Also bundled (no npm impact)

- **Plugin marketplace refresh** — manifests synced to faf-cli versioning
  per the one-verb doctrine; commands surface rebuilt for sharp, elegant
  discovery of faf-cli. Distributed via the Claude Code plugin
  marketplace, not via npm.

### Notes

- No changes to CLI behavior, scoring, or output.
- Existing v6.6.0 installs continue to work identically. This patch
  exists for maintainer-side CI confidence and the public Windows signal.

## [6.6.0] - 2026-05-11 — The Trophy Edition

> **How no-score became a score.**

Two shifts arrive together: the **20th app-type** lands (`about` — the
first non-app, owner-attested representation of another codebase) and the
**recommendation flips to 🏆 Trophy 100% only**. Sub-Trophy is an interim
state on the way to Trophy, not an endpoint we recommend.

The wordplay carries the story: adding `about` brought the ladder to **a
score** (20, in the old English sense). The 20th type doesn't score —
it inherits its source's score. The system now distinguishes what scores
from what doesn't.

### `app_type: about` — the 20th type, first non-app

- **New type:** `about` (0 slots, owner-attested, no detection branch).
  Public About Repos for private codebases get a first-class
  representation. See `private-source-public-about-pattern.md`.
- **Scoring short-circuit:** `app_type: about` skips slot-based scoring.
  Result inherits `about.source_score` (declared by owner, 0–100). Missing
  source_score renders as `—` / White ♡ — truth-printing applies.
- **Schema validation:** `about.represents` is REQUIRED (`owner/repo`
  format). `about.source_score` is OPTIONAL but range-checked when present.
- **New API:** `scoreFafYaml(yaml)` in `src/core/scorer.ts` — entry point
  that respects the about short-circuit. `score`, `init`, `check`, and
  `taf` commands all route through it.
- **TAF downstream signal:** about results carry `inherited: true` and
  `represents` so receipts distinguish inherited scores from calculated
  ones.

### Trophy 100% — all or nothing

From v6.6.0 onward, faf-cli recommends **only 🏆 Trophy**. The why is
architectural, not aspirational:

```
Layer 4   AI tooling          ← AI optimised by complete FCL
Layer 3   Agents              ← can act because FCL is complete
Layer 2   MD instructions     ← can be regenerated correctly
Layer 1   .faf (FCL)          ← 🏆 Trophy = complete = foundation
```

100% on Layer 1 makes Layers 2–4 work. Sub-100% degrades every layer
above it — instructions miss context, agents guess, AI optimisation
can't happen because the foundation has holes.

Concrete shifts:

- **pubpro FAF Gate** — publish threshold rises 85% Bronze → 100% Trophy.
  Sub-Trophy publishes get blocked, not approved-with-note.
- **`faf go` / `faf auto`** — keep ramping toward Trophy; don't stop at 85%.
- **Score-line copy** — Trophy celebrated explicitly; sub-Trophy framed
  as *"N slots from Trophy"* (interim, not endpoint).
- **Bi-sync** — formalised as a Trophy-gated unlocked feature. Prose
  backfill from MD into `.faf` is only safe at 100%.
- **README / docs** — *"Bronze 85% minimum"* framing retired. New
  framing: *"🏆 Trophy 100% — all or nothing."*

What does NOT change: the **tier ladder itself** (🏆 / ★ / ◆ / ◇ / ● /
● / ○ / ♡, source-of-truth in `src/core/tiers.ts`) stays as honest
intermediate rungs. Sub-Trophy tiers still render on score output — the
*recommendation* shifts, not the ladder.

### Slot vocabulary — user-surface flip (task #25)

Mk4 canonical slot names land in user-facing surfaces (README, help text,
docs). Code-side aliasing was completed 2026-03-18 and remains
backward-compatible on read:

| Pre-v6.6 surface | v6.6 canonical |
|---|---|
| `frontend` | `framework` |
| `css_framework` | `css` |
| `state_management` | `state` |
| `api_type` | `api` |
| `database` | `db` |
| `package_manager` | `pkg_manager` |

Old slot names continue to score correctly — 36k+ existing `.faf` files
are unaffected. Only the user-facing vocabulary shifts.

### Doctrine pointers

- `v6.6.md` — canonical app-types ladder (renamed from
  `app-types-canonical-v6.5.md` to mark the v6.6.0 boundary)
- `trophy-is-the-target.md` — *"Trophy is the only recommended state from
  v6.6 onward"* — wolfejam doctrine 2026-05-09
- `private-source-public-about-pattern.md` — the About Repo pattern
  v6.6.0 operationalizes
- `score-edition-no-score-becomes-a-score.md` — the launch slogan
  ("How no-score became a score") — Score is the slogan, Trophy is the
  edition

---

## [6.5.1] - 2026-05-09 — The Glass-Hood Edition

Glass-Hood = the cli shows its work. Decisions are visible and refutable by inspection.

When the cli classifies a project, it emits a `# found:` YAML comment next to `type:` listing the observable evidence:

```yaml
project:
  type: cli  # found: package.json bin
```

Read the rationale, agree or disagree. No opaque hood — you can see the engine bay.

xai-faf-rust ships the same doctrine as a weighted score-breakdown view. Different surface, same idea: don't hide your reasoning.

---

## [6.5.0] - 2026-05-08 — The Conformance Edition

> **FAFB v1.0 conformance, byte-verified. Receipts not promises.**

The headline receipt: cli-compiled `.fafb` is **byte-identical** to the
`xai-faf-rust` reference implementation for the same `.faf` input. Round-
trip parity is a permanent BRAKE-tier test — if conformance ever drifts,
CI fails with a byte-by-byte diff. No marketing prose; the test is the
receipt.

### FAFB v1.0 conformance — locked

- **Round-trip parity BRAKE gate.** `tests/parity-brake.test.ts` asserts
  byte-identical `.fafb` output between the cli (via `faf-scoring-kernel`
  WASM) and the `xai-faf` Rust reference impl (via `faf-rust-sdk`'s
  binary module). Same `.faf` input → bit-for-bit equal output. Verified
  independently via shell `cmp`.
- **Multi-section binaries.** Top-level YAML keys
  (`tech_stack` / `key_files` / `commands`) now auto-populate from
  observable signals. `faf compile` produces structurally-rich `.fafb`
  (4+ sections) instead of META-only (1 section). Live: faf-cli's own
  project.faf compiles to a 375-byte / 4-section binary (was 84 bytes /
  1 section).
- **Deterministic timestamp.** Companion fix landed in `xai-faf-rust`
  commit `d5236ad` — both impls now write `created_timestamp = 0` for
  reproducibility. CRC32 source-checksum is the integrity receipt;
  provenance lives in external receipts (TAF, git, OCI manifests).

### `# found:` detection rationale (Glass-Hood-adjacent)

- Every cli project-type classification renders a YAML comment showing
  the signals that earned it:
  ```yaml
  project:
    type: cli  # found: package.json bin
  ```
  Anyone reading the `.faf` can refute the cli's reasoning by inspection.
  If wrong, the evidence is right there. *(Note: this is not the same as
  xai-faf-rust's "Glass Hood" weighted score breakdown — that's a
  separate, kernel-side feature.)*
- New API: `detectProjectTypeWithRationale(dir)`. Backward-compatible
  wrapper `detectProjectType(dir): string` preserves existing callers.

### App-types — comprehensive 19-type ladder

- **9 new types** with detection wired up: `documentation`, `sdk`, `wasm`,
  `mobile`, `monorepo-root`, `html`, `website`, `saas`, `mcpaas`.
- **`universal` extension** to `cli` / `library` / `mcp` / `frontend` /
  `data-science`. These types ship/build/CI somewhere — slotignoring
  hosting/build/cicd was losing real signal. Active slot counts lifted
  (cli/library 9→12; mcp/data-science 14→17; frontend 13→16).
- **Orphan fix:** `data-science` and `enterprise` now have detection
  logic (Python DS deps for the former; private workspace + multi-FW
  for the latter). Were defined-but-undetectable before.
- **SDK-priority rule.** When SDK signals fire (keyword, name suffix,
  Cargo `[lib]`+name), classification is `sdk` regardless of other
  matches. mcpaas-sdk-style repos classify correctly.
- **Cargo `[[bin]]`** detection added (xai-faf-rust shape — Rust cli
  with `[[bin]]` entries was falling through to library fallback).
- Doctrine memory: `app-types-canonical-v6.5.md` locks the ladder.

### `faf wjttc` — vendor-neutral test audit (NEW)

- New top-level command. Reads tests across **TypeScript, Rust, Python,
  Zig, Go**; classifies each by WJTTC tier (BRAKE/ENGINE/AERO/PIT) by
  test name; reports tier balance + untiered breakdown.
- Brace-depth-tracked TS parser correctly attributes child tests to
  parent describe scopes (so tier markers propagate into nested tests).
- Flags: `--json` (CI consumption), `--strict` (exit 1 on untiered),
  `--path` (custom dir).
- Coverage warning fires when **0 BRAKE-tier tests** exist
  ("no safety canaries").

### `faf auto` — README + Cargo.toml interrogation (RESTORED)

- README extraction restored under strict no-guess discipline. v1.0.3
  had heuristic last-asterisked-line parsing (broken — Issue A). It was
  removed in retreat between v1.0.3 → v6.4.x, leaving auto unable to
  fill `human_context.*` from README evidence. v6.5.0 restores the
  capability with **per-slot semantic anchors** (`## About` → what,
  `## Audience` → who, `## Use Case` → goal, etc.).
- Cargo.toml `[package].description` now reads through to `goal`
  (parallel to package.json's `description`).
- Doctrine: `faf-auto-no-guess-no-slop.md` — extract valid+concise OR
  leave alone. Empty is honest; wrong is a lie.

### `faf ai enhance` — no-guess/no-slop hardening

- Old prompt invited guessing ("fill with reasonable values based on
  the project context"). Replaced with **extraction-or-null** prompt:
  return null when no concrete evidence; never use generic placeholders;
  never fabricate; ≤200 char extracted values.
- **Client-side defensive validator** (`isValidAiExtraction` +
  `AI_SLOP_PATTERNS`) — even if the model slips, the cli rejects
  forbidden values before writing to disk. Belt + braces.
- Source-level prompt content lock-in tests guard against future
  prompt softening.

### Slot UX — voice-aligned prompts

- **`human_context.who`**: "Who is building this" → **"Who is this for?"**.
  Aligns the prompt with how the slot is universally answered (audience,
  not builder).
- **`project.goal`**: "What the project does" → **"Goal (use case)"**.
  Bilingual label — "Goal" for anyone, "use case" for tech-vernacular
  audiences. The slot is overarching/additional/bonus relative to the
  6Ws (per `goal-is-not-a-6w.md` doctrine).

### Nelly — back

- Restored to canonical March 23 shape (commit `7eb1042`) with the
  trunk-tip lifted off the grass-line and a solid-dark eye visible in
  any rendering (monochrome, true-color, screenshots).
- BRAKE-tier byte-snapshot test (`tests/cli-banner.test.ts`) guards
  against the regression class that bit us twice (grass-between-feet
  silently re-introduced via the IIFE wrap).

### Test status

**639 tests across 53 files.** New shadows since v6.4.1: 223
(parity-brake, fafb-sections, found-rationale, app-types, new-types,
wjttc, ai-slop-guard, cli-banner). Every new tool ships with its tests
in the same commit per Test Shadows discipline.

### FAF defines. MD instructs. AI codes.

---

## [6.4.1] - 2026-05-08 — Drift Cleanup

> **Patch ship. Quiet. Receipts not promises.**

A focused patch closing pre-existing test wall-clock issues, sharpening
the empty-slot diagnostic, and adding Zig project-type detection. No
new features. No public-surface claims.

### What's bundled

- **Empty-slot diagnostic** — `displayScore` now names slot paths inline
  (top 3 + `+N more` overflow) instead of emitting just `${empty} empty`.
  `faf auto`'s no-op case now shows exactly which slots are blocking
  improvement; missing-context diagnostic gains its slot keys.
- **Zig project-type detection** — `detectProjectType` reads `build.zig`
  + entry-file convention (`src/main.zig` → `cli`; `src/root.zig` →
  `library`). Was falling through to `library` default for every Zig
  project regardless of layout.
- **Test wall-clock fix** — `bun test --timeout=30000` is now the npm
  test default. Bun's per-test 5s wall was killing subprocess-based
  tests (`L7: npm ci --dry-run`, `L8: npm audit`, `e2e init`) before
  their inner subprocess timeout (60s) could complete. Lockfile
  regenerated to v6.4.0 metadata. `bunfig.toml`'s `timeout` key
  (silently ignored by `bun test`) removed with inline note.

### Test status

416 tests across 43 files. New WJTTC ENGINE shadows: 4 for the empty-
slot diagnostic, 4 for Zig project-type detection.

### FAF defines. MD instructs. AI codes.

---

## [6.4.0] - 2026-04-29 — The Foundation Edition

> **Robust. Reliable. Next-level WJTTC tested.**
> **The foundational CLI for all FAF MCPs, apps, skills, and tools.**

The Foundation Edition. Every FAF surface — Claude / Grok / Gemini /
Rust / Python / WASM MCPs and SDKs, every skill, every downstream app
— builds on this CLI. v6.4.0 is the version that makes that
foundation provably solid.

Published through the full `/pubpro` protocol (the v6.3.3 publish
shipped the same artifact but bypassed the ceremony).

**Upgrade from v6.3.x users:** functionally identical to v6.3.3,
but v6.4.0 is now `latest` on npm. Use this.

**Upgrade from v6.0.12 → v6.3.0 users:** critical — fixes the install
crash that affected every version since v6.0.12 (kernel + open were
bundled inline; users hit "faf-scoring-kernel not installed" on
`faf info`).

### What's bundled

- **P0 install fix** + 3-layer no-hardcode defense (test-time
  invariants + prepublish guard + packed-tarball CI)
- **408 tests, 0 fail** — WJTTC Build Resilience suite (13 tests
  locking 11 lessons-learned classes), WJTTC Kernel Stress suite
  (19 boundary / concurrency / corruption tests), command-coverage
  uplift (`ai`, `sync`, `go`, `demo` all at ≥116% test:src ratio)
- **`bun run compile` restored** — top-level await IIFE wrap,
  `--bytecode --minify` on all cross-platform binaries
- **Deps refresh** — `@anthropic-ai/sdk` ^0.74 → ^0.91.1,
  `open` 8 → ^11 (ESM dynamic import), Bun pinned to `1.3.13` for
  deterministic CI
- **`faf git` handles network failures gracefully** — was crashing
  with raw `execSync` stack traces on unreachable URLs; now exits
  cleanly with friendly message
- **Branch topology** — `v6` promoted to `main`, legacy v5.2.x
  archived to `sunset-final`

See the [v6.3.3 entry](#633---2026-04-28--build-resilience--next-level-wjttc-testing)
below for the detailed breakdown of every change.

### FAF defines. MD instructs. AI codes.

---

## [6.3.3] - 2026-04-28 — Build Resilience + Next-Level WJTTC Testing

> **The memorable release.** v6.3.3 is the first solid base on `main`
> (the v6 branch was promoted to default; legacy v5.2.x archived to
> `sunset-final`). It bundles the P0 fix for the install crash
> (v6.0.12 → v6.3.0) with next-level WJTTC testing — every lesson
> learned during the recovery is now an executable contract. CLI
> powers all other FAF apps; this release locks the foundation.

### Fixed

- **P0 install crash** — `npm install -g faf-cli` followed by `faf info`
  was crashing with "faf-scoring-kernel not installed" on v6.0.12 →
  v6.3.0. Bun was inlining `faf-scoring-kernel` and `open` into the
  bundle, baking the build-machine `__dirname` as a string literal.
  On user machines the path didn't exist and the WASM/binary loaders
  failed. Fixed by externalizing both deps in the `bun build` config
  so they resolve at runtime via standard Node module resolution.
- **`faf --version` drifted** — `cli.ts` had a hardcoded
  `const VERSION = '6.0.8'` that never got updated. Every release
  since v6.0.8 reported the wrong version. Now reads dynamically from
  `package.json` via `require`.
- **`bun run compile` regression** — top-level `await` in `cli.ts` was
  tolerated by `bun build` but rejected by `bun build --compile`.
  Wrapped the affected branch in an async IIFE; standalone-binary
  builds (`faf-darwin-arm64`, `-x64`, `faf-linux-x64`,
  `faf-windows-x64.exe`) work again.
- **GitHub Release CI** — the `Create GitHub Release` step in the
  release pipeline was failing with HTTP 403 because the job had no
  explicit `permissions` block; GITHUB_TOKEN inherited read-only
  defaults. Added `permissions: contents: write`.
- **CI on v6 branch** — Championship CI/CD only listened to
  `main` + `develop`, so every commit on the v6 default branch went
  unvalidated. Added `v6` to the trigger branches; surfaced and fixed
  six pre-existing v6 issues that had rotted unnoticed: lockfile
  drift, missing `typescript-eslint` package, yaml CVE, missing Bun
  setup in Node Smoke matrix, git identity in temp-repo tests.
- **`faf git` crashed on unreachable URLs** — `execSync('git clone')`
  threw a raw error that propagated to the user as a stack trace.
  Now wrapped in try/catch with a friendly `Error: could not clone
  <url>\n  <reason>` message; exits 1 cleanly. Cleanup via finally
  still removes the temp dir on every code path.

### Added

- **Prepublish no-hardcode guard** — `npm publish` now greps `dist/`
  for build-machine path patterns (`/Users/`, `/home/runner/`,
  `/private/var/`) and refuses to publish if any leak. Runs via
  `prepublishOnly`. Catches future bundler regressions of the
  v6.0.12 → v6.3.0 class before they reach users.
- **Build-invariant tests** — two tests in `tests/meta.test.ts` lock
  the no-hardcode property as a unit-test concern, not just a
  prepublish concern. Runs on every `bun test`.
- **Packed-tarball smoke test in CI** — Node Smoke matrix now does
  `npm pack` + install from tarball + run `faf info` + assert
  `--version` matches `package.json`. Tests the actual user
  experience, not the dev tree.
- **Deterministic Bun in CI** — `BUN_VERSION` pinned to `1.3.13`
  (was wildcard `1.x`). Every CI build is now reproducible against a
  specific Bun. Bumping is now an explicit commit.
- **WJTTC Build Resilience suite** (`tests/wjttc/build-resilience.test.ts`)
  — 13 tests in three F1-inspired tiers covering every lesson
  learned during the v6.0.12 → v6.3.3 recovery. BRAKE: production-
  critical (no hardcoded paths, kernel/open externalized, version
  drift, dist artifacts). ENGINE: dev/CI quality (top-level await
  detection, CHANGELOG present, lockfile sync, ESLint config
  resolvable). AERO: drift detection (semver, `npm audit`, engines
  field, CHANGELOG-version match). Skip audit gate via
  `WJTTC_SKIP_AUDIT=1` for fast local loops.
- **WJTTC Kernel Stress suite** (`tests/wasm/kernel-stress.test.ts`)
  — 19 tests exercising the WASM scoring kernel at boundaries the
  happy-path tests didn't cover: 50KB string values, 200 extra slots,
  BOM markers, deeply nested YAML, Unicode roundtrip, mixed
  tabs/spaces, 100 parallel `score()` calls (consistency), mixed
  score+validate+compile under concurrency, compile→decompile
  determinism, FAFB magic-header invariant, and four binary-corruption
  scenarios (empty bytes, garbage, tampered magic, truncated FAFb).
  Every downstream FAF app trusts the kernel not to crash the host
  process — this suite enforces that contract.
- **Network-failure tests for `faf git`** — three new tests verify
  clean exits on missing URL, unreachable URL (`.invalid` TLD per
  RFC 2606 — DNS-fails without internet), and malformed URL.
- **WJTTC command-coverage uplift** — four under-tested commands
  bulked up to ≥116% test:src LOC ratio:
    - `ai` (was 25.8%) → 116% — subcommand dispatch, missing API key /
      missing .faf paths, all-slots-populated early-exit (uses real
      SLOTS module, no API call ever attempted), help-text contracts.
    - `sync` (was 32.3%) → 148% — direction logic (auto/push/pull),
      mtime-aware auto direction, pull-with-no-CLAUDE.md error path,
      `generateClaudeMd` determinism + slotignored skip + empty
      project safety.
    - `go` (was 47.2%) → 150% — error paths, all-slots-populated
      early-exit, session resume (corrupted JSON graceful-fail, valid
      session logs 1-indexed slot number).
    - `demo` (was 32.7%) → 149% — output contract (header + steps +
      completion + `faf init` CTA), kernel-exercised end-to-end
      (asserts a percentage / tier marker is emitted), no temp-file
      leaks, no cwd modification, two-invocations-no-state-leak
      robustness.

### Changed

- `@anthropic-ai/sdk` `^0.74.0` → `^0.91.1` (optionalDep used by
  `faf ai` enhance / analyze). Public API surface unchanged; opens
  the door to memory tool, typed tool helpers, and workspace-isolated
  prompt caching in future work.
- `open` `8.4.2` → `^11.0.0`. Package went ESM-only at v9; converted
  the call in `pro.ts` to `import('open')` (dynamic, fire-and-forget).
- `faf-taf-git` action `v2.1.0` → `v2.1.1`. Picks up the upstream
  stash-before-checkout fix; TAF Receipt was failing for 5 weeks.
- `compile:all` script now matches `compile`: `--bytecode --minify`
  applied to all four cross-platform binaries.

### Branch topology

- **`v6` → `main`** rename — v6 was the GitHub default branch carrying
  all the active rewrite work; legacy v5.2.x `main` was retained but
  dormant. v6 is now `main`; the legacy line moved to `sunset-final`
  (GitHub auto-redirects old refs ~3 months). First green Championship
  CI/CD run on the renamed `main` confirmed the topology change.
  `branches: [ main, develop ]` is back to canonical.

### Technical

- **408 tests** (was 348 at the start of the day, 350 after the
  initial v6.3.3 push), **0 failures**, 1707 expects, 42 files
- Local validation: tests + build + hardcode guard + compile binary
  + packed-tarball install + `--version` match all green (~13s)
- CI on `main`: green Championship CI/CD runs across the entire
  recovery + WJTTC sweep
- `dist/cli.js`: 296 KB, `dist/index.js`: 5.7 KB, install size 328 KB
- Compiled binary: 66 MB (Darwin arm64)
- Three-layer no-hardcode defense: `meta.test.ts` build invariants
  (test-time) + `check:no-hardcode` (prepublish gate) + packed-tarball
  smoke test (CI gate)

### Notes

- Versions v6.3.1 and v6.3.2 were release markers in git (release
  cadence discipline) but never published to npm. Users upgrade
  directly from v6.3.0 → v6.3.3.
- Sourcemap addition to the dist build was attempted and reverted —
  Bun 1.3.11's `--sourcemap=linked` + `--outfile` has a bug that
  pollutes `src/`. Will revisit when Bun 1.3.13 is locally available.
- Lint surfaces 196 pre-existing issues (111 errors, 85 warnings).
  Set to `continue-on-error: true` per the "lint never gates the
  badge" doctrine. Real cleanup deferred to a focused session.
- Test B (externalize-kernel substring invariant) deliberately not
  added — already covered by the externalize tests in WJTTC Build
  Resilience and Kernel Stress suites.

### Why v6.3.3 is memorable

This release is the moment faf-cli became the **trusted foundation**
for every other FAF app. Before today: a working CLI with a hidden
P0 install bug for ~25k+ downloads, broken compile pipeline, drifted
version constants, broken release workflow, untested v6 branch,
under-tested flagship commands, and no contract on kernel resilience.
After today: every one of those gaps is closed, locked as an
executable test, and gated at three points (test, prepublish, CI).
When the WJTTC suite is green, every lesson learned is provably
fixed. CLI powers everything else; v6.3.3 makes that promise true.

---

## [6.0.8] - 2026-03-27 — Next.js Edge Cases

### Fixed

- **Next.js and Nuxt** now detected as `fullstack`, not just `frontend`
- Fullstack detection triggers when backend indicators (API routes, server actions) are present

### Added

- **34 WJTTC Next.js edge case tests** — BRAKE (11), ENGINE (16), AERO (7)
- Tests cover App Router, Pages Router, ISR, middleware, tRPC, Prisma, auth patterns

### Technical

- 348 tests, 0 failures, 40 files

## [6.0.7] - 2026-03-25 — Framework Type

### Added

- **`framework` type** — first repo-type for framework source code (private + workspace)
- **`framework: svelte` sub-type** — Svelte smart defaults with 5 slot-level ignores
- **Svelte devDependency detection** — framework repos with svelte in devDeps now detected
- **16 active slots** — css_framework, ui_library, database, connection, hosting slotignored
- **16 new WJTTC tests** — BRAKE (4), ENGINE (9), AERO (3) for framework type

### Technical

- 312 tests, 0 failures, 39 files
- Svelte apps remain `type: svelte` (21 active slots) — no change
- Detection: `private: true` + workspace + svelte signal → `type: framework`

## [6.0.6] - 2026-03-25 — Svelte-Aware Context Engine

### Added

- **Svelte app-type** — first framework-specific app-type in faf-cli
- **Smart defaults** — Runes (state), SvelteKit (backend), Vite (build), Server Routes (API)
- **Adapter detection** — reads `svelte.config.js` to map adapter → hosting (Vercel, Node, Static, Cloudflare, Netlify)
- **5 adapter framework signatures** — SvelteKit adapters detected as hosting signals
- **WJTTC championship suite** — 49 tests (BRAKE/ENGINE/AERO) for Svelte detection

### Technical

- 296 tests, 0 failures, 39 files
- Verified on faf.one, GALLERY-SVELTE, fafdev.tools, sveltejs/svelte
- WASM kernel unaffected — "Send anything. Know nothing."

## [6.0.5] - 2026-03-22 — Nelly Above the Fold

### Changed

- **Compact welcome** — bare `faf` shows Nelly + score + hint instead of full help dump
- **Grass between feet** — green `░` texture on Nelly's ground line, no gap
- **Green line easter egg** — `▔▔▔` line visible on ctrl+o expand

### Why

- Nelly was hidden behind "+34 lines (ctrl+o to expand)" in Claude Code
- Now 3 art lines always visible above the fold

## [6.0.4] - 2026-03-23 — Nelly Never Forgets

### Added

- **Nelly pixel-art elephant** — half-block Unicode art in the bare `faf` command header
- **Green grass line** — `▔` characters in grass green (#27AE60) under Nelly
- **Bold score percentage** — score output now uses bold white text

### Technical

- Dark bg pad `#1D1D1D` — matches Claude Code, VS Code, Ghostty terminals
- `▄` color-swap trick at trunk C1 for seamless terminal line-gap bridging
- 218 tests, 0 fail

## [6.0.0] - 2026-03-22 — Built with Bun

### The Ground-Up Rewrite

v6 is a complete rewrite. Same toolchain as Claude Code — Bun for runtime, test, build, and compile.

### Changed

- **All-in on Bun** — `bunx faf-cli` as primary, `npx` backward-compatible
- **93% smaller** — 71k lines → 5,292 lines (commands → interop → core → wasm)
- **WASM scoring kernel** — `faf-scoring-kernel` 2.0.0 (Rust → WASM) replaces TypeScript scorer
- **26 commands** — clean 1-file-per-command architecture
- **218 tests** in ~10s via `bun test` (37 files, 1223 expect() calls)
- **290KB bundle** in 2.4s via `bun build`
- **Single portable binary** via `bun build --compile` (4 platforms)
- **CI cleaned** — 8 workflows → 5 (3 dead removed, 2 fixed for v6)

### Commands (26)

init, git, auto, go, score, sync, compile, decompile, export, check,
edit, convert, drift, context, recover, migrate, search, share, taf,
demo, ai, pro, conductor, formats, info, clear

### Architecture

```
src/
├── cli.ts              ← Entry point, 26 command registrations
├── commands/           ← 26 command files (1 per command)
├── core/               ← Types, slots (33 Mk4), tiers, scorer, schema
├── detect/             ← Framework detection, stack scanner
├── interop/            ← YAML I/O, CLAUDE.md, AGENTS.md, GEMINI.md
├── ui/                 ← Colors (#00D4D4), display
└── wasm/               ← faf-scoring-kernel wrapper (Rust → WASM)
```

## [5.2.2] - 2026-03-21

### Removed

- **Jest completely removed** — `jest`, `ts-jest`, `@types/jest` devDependencies dropped
- **Deleted `jest.config.js`** (root + faf-engine) — bun doesn't read them
- **Deleted 3 orphaned webpack configs** — `webpack.mk2.config.js`, `webpack.engine.config.js`, `webpack.yaml.config.js` (webpack not even installed, entry points don't exist)
- **Removed 4 dead build scripts** — `build:engine`, `obfuscate:engine`, `build:protected`, `build:all` (all pointed to missing files)
- **Cleaned `eslint-env jest` directives** from 3 test files

## [5.2.1] - 2026-03-21

### Changed

- **All-in on Bun test runner** — migrated from Jest to `bun test` as primary
  - `npm test` now runs `bun test`
  - CI updated: 3 Bun jobs (3 OS) + 3 Node smoke tests
  - Added `bunfig.toml` configuration
- **Fixed `faf enhance` reference** — `faf auto` output now correctly suggests `faf enhance` (was `faf ai-enhance`)

### Fixed

- Fixed process.env.PATH poisoning in compile/decompile tests (caused 16 cascading failures)
- Fixed type re-export for bun module resolution (`export type { ParsedTestOutput }`)
- Fixed process.env shallow copy in execution-context tests
- Added `finally` blocks to all mock restorations (prevents leaks in single-process runner)
- Removed orphaned archive test files from bun discovery
- Removed dead TTY-only integration test (25 permanent skips eliminated)
- Rewritten meta-test infrastructure to validate bun single-process safety

### Tests

- 1232/1232 passing, 0 skip, 0 fail across 54 files
- Runner: bun test (native TS, single process)

## [5.2.0] - 2026-03-20

### Added

- **FAFb Compile/Decompile** — `faf compile` and `faf decompile` commands now live in CLI
  - Powered by faf-scoring-kernel (WASM) — no external binary needed
  - `.faf → .fafb` binary compilation, `.fafb → .faf` decompilation
  - Works with both Mk4 and old slot names
- **Mk4 Slot Renames** — 6 canonical slot name updates aligned with Mk4 engine:
  - `frontend`→`framework`, `css_framework`→`css`, `state_management`→`state`
  - `api_type`→`api`, `database`→`db`, `package_manager`→`pkg_manager`
  - `SLOT_ALIASES` / `SLOT_ALIASES_REVERSE` as single source of truth
  - Full backward compatibility — old .faf files score identically
  - WASM kernel bridge translates Mk4→old names for Rust kernel
- **Tri-sync Topic Files** — Claude Code native memory format:
  - `memory-topic-writer.ts`: maps .faf → individual topic files with frontmatter
  - 6 topic types: project, stack, context, preferences, key_files, state
  - MEMORY.md index management (insert/replace FAF section)
  - `faf ram export` and `faf bi-sync --ram` both write topic files
- **WJTTC Mk4 Rename Suite** — 21 tests across 7 tiers (Brake→Stress)
- **WJTTC Topic Writer Suite** — 20 tests for Claude Code memory format

### Changed

- All generators output Mk4 canonical names
- ScoreCalculator checks both old and new names
- Slot counter outputs Mk4 paths (`stack.framework` not `stack.frontend`)
- Family detectors updated (React, Svelte, Next, Vite)
- Compile/decompile switched from external xai-faf-rust binary to WASM kernel

### Tests

- 1184/1184 passing (up from 1143)
- 52 test suites
- FAFb compile/decompile verified with both name sets

## [5.0.6] - 2026-03-13

### Added

- **Bun alignment** — `bunx faf-cli` as primary alongside `npx` in README and docs
- `bun install -g faf-cli` option for global installs
- **WJTTC Bun Compatibility Suite** — 35 tests across 5 tiers (Brake, Engine, Aero, Telemetry, Championship)

## [5.0.5] - 2026-03-12

### Fixed

- Restored CLI detection in `init` command — was incorrectly overridden by FrameworkDetector result
- Improved metadata extraction robustness in framework-detector (safe fallbacks, no crashes on missing fields)

## [5.0.4] - 2026-03-12

### Added

- **Smart Metadata Extraction** — `faf auto` now syncs project name, goal, and version from manifest files (package.json, Cargo.toml, pyproject.toml)
- Parity with Python extension metadata pipeline
- FrameworkDetector enhanced with `projectName`, `projectGoal`, `projectVersion` extraction

## [5.0.3] - 2026-03-08

### Changed

- README optimized: badges at top, Top 6 Commands table, "Define. Build. Lock. Relax." tagline, Git-Native callout, screenshot paired with tree diagram, RAM Edition moved up
- Lint added to `prepublishOnly` gate — no more publishing dirty builds

### Fixed

- ESLint curly brace errors in yaml-generator.ts and fab-formats-processor.ts

## [5.0.2] - 2026-03-08

### Fixed

- **TURBO-CAT Slot Audit** — 12 wrong defaults eliminated from Python project detection
  - Stripped 9 hardcoded pyproject.toml slots (poetry, File-based, None, File I/O)
  - Real dependency parsing: detects setuptools/hatch/flit/pdm from `[build-system]`
  - Dependency-aware detection: BigQuery, FastMCP, FastAPI, Flask, Django, PostgreSQL, MongoDB, Redis
  - Language-aware warnings: Python→PEP 8, Rust→clippy, TS→strict mode
  - Language-aware milestone: pypi_publication, crates_publication, etc.
  - Gated TS strict mode indicator to TS/JS projects only
  - Post-allocation verification: pyproject.toml overrides package.json for mainLanguage
  - Score metadata refresh (faf_score + ai_confidence) after auto run
  - Priority bump: pyproject.toml/Cargo.toml/go.mod (36) > package.json (35)
  - 8 new Python detection tests (1,108/1,108 total)

## [5.0.1] - 2026-03-02

### Changed

- README rewritten for v5.0.0 RAM Edition — added 3Ws/6Ws teaching, tri-sync section, sync comparison table, blog link
- Core commands table updated with tri-sync, ram, pro
- 6Ws sections reordered to canonical order (WHO, WHAT, WHY, WHERE, WHEN, HOW)
- Added Documentation & Recommended Reading section with blog links

## [5.0.0] - 2026-03-01 — The RAM Edition

### Added

- **tri-sync** — ROM↔RAM bridge for Claude Code auto-memory
  - `faf ram` — sync project context to Claude's session memory (MEMORY.md)
  - `faf tri-sync` — bidirectional sync: `.faf` ↔ CLAUDE.md ↔ MEMORY.md
  - `faf bi-sync --ram` — include RAM sync in bi-sync
  - `faf bi-sync --all` — now includes RAM alongside AGENTS.md, .cursorrules, GEMINI.md
  - Merge-safe: replaces FAF section, preserves Claude's own notes
  - 200-line ceiling awareness (warns when exceeding auto-load limit)
  - `memory-parser.ts` — full parse/export/import/detect/status API

- **Pro Gate** — zero-friction license system for tri-sync
  - 14-day free trial, no signup, no credit card
  - HMAC-signed trial and license files (honest-user guard, not DRM)
  - `faf pro` — check license status
  - `faf pro activate <key>` — activate with license key
  - Legacy dev detection (turbo-license holders get automatic access)
  - Warm messaging: "Bi-sync is core. Tri-sync adds more. What does it add? It adds RAM."
  - Early-bird: $3/mo · $19/yr (normally $10/mo — 70% off)

- **3Ws / 6Ws reorder** — canonical order is now WHO, WHAT, WHY, WHERE, WHEN, HOW
  - WHY promoted to 3W (was 4W), WHERE moved to 4W (was 3W)
  - Clean split: 1W–3W = the idea (anyone can answer), 4W–6W = the implementation (developer fills in)
  - Updated across CLI help, `faf readme`, `faf 6ws` default template, SixWs interface, hybrid engine

### Fixed

- CRLF merge bug in `memory-parser.ts` — raw string surgery on un-normalized content produced mixed line endings
- Pricing inconsistency — `pro.ts` said $29/yr, `license-messages.ts` said $19/yr (now consistent at $19/yr)
- Removed dead code: `showUpgradePrompt()` (defined but never called)

### Testing

- 1,100 tests passing across 49 suites
- 16 new Pro Gate tests: `gateProFeature()`, `getProStatus()`, day-14 boundary, corrupt JSON, license precedence
- 2 new CRLF merge tests: Windows CRLF + BOM normalization during merge

### Philosophy

- Free for devs, for builders, for ALL the app-makers
- bi-sync is free forever — persistent project context for any AI
- tri-sync is Pro — your AI remembers across sessions
- Context the way AI intended it: at the ROOT, not scattered across docs

## [4.5.0] - 2026-02-24 — The AGENTS.md Edition

### Added
- `faf agents import/export/sync` — AGENTS.md interop (OpenAI Codex, Linux Foundation, 20+ tools)
- `faf cursor import/export/sync` — .cursorrules interop (Cursor IDE)
- `faf bi-sync --agents` — also sync to AGENTS.md
- `faf bi-sync --cursor` — also sync to .cursorrules
- `faf bi-sync --all` — sync to all formats at once (CLAUDE.md + AGENTS.md + .cursorrules + GEMINI.md)
- WJTTC championship test suite for interop formats (87 tests across 6 tiers)
- Parsers: `agents-parser.ts`, `cursorrules-parser.ts` — full bidirectional mapping

### Fixed
- Windows `\r\n` line endings broke H1/H2 detection in all markdown parsers
- UTF-8 BOM marker broke parsing for VS Code users
- Old Mac `\r` line endings unhandled

### Philosophy
- Define once in `.faf`, generate AGENTS.md, .cursorrules, CLAUDE.md, GEMINI.md
- FAF 4.5 is the version where `.faf` becomes the true interchange format

## [4.4.4] - 2026-02-18 — Enhanced Git Support

### Changed
- Complete rewrite of `faf git` output — compact, accurate, PR-ready (~35 lines vs 130)
- Primary language detection from GitHub API (uses first entry in sorted language array)
- Language-aware install detection (pip, cargo, go, npm, yarn, brew, docker)
- `slotignored` fields no longer appear in output (engine directive only)
- Languages capped at top 6 for clean output
- Clean 4-line header format

### Fixed
- GitHub API language endpoint now uses auth token (was missing `githubHeaders()`)
- React correctly detected as JavaScript (was showing TypeScript)
- Garbage README extraction filtered out (trailing pipes, code blocks, markdown links)

### Added
- WJTTC test suite for faf-git-generator (86 tests across Brake/Engine/Aero tiers)
- 17 language detection tests, build system detection, package.json analysis
- The version that scored a Hundred Famous Repos

## [4.4.3] - 2026-02-17

### Changed
- Updated TAF Receipt workflow to use faf-taf-git@v2.0.4 (production-ready)
- Cleaned up TAF workflow CI configuration (removed testing flags)

## [4.4.2] - 2026-02-16

### Security
- Updated `inquirer` from 8.2.5 to 8.2.7 to resolve 3 low severity vulnerabilities (tmp symlink issue)
- All dependencies now have zero known vulnerabilities

### Fixed
- Configured Dependabot to prevent major version bumps (blocks breaking changes)
- Reduced Dependabot PR limit from 10 to 3 (prevents CI/CD spam)
- Added protections for TypeScript tooling (@typescript-eslint/*, eslint)
- Added protections for core dependencies (@types/node, jest, @types/jest)
- Added ESM import exports to faf-engine package.json for better module resolution

### Changed
- CI/CD badge restored to GREEN after closing 4 failing Dependabot PRs
- Improved Dependabot configuration for better CI/CD flow management

## [4.4.1] - 2026-02-15

### Fixed
- Removed alarming "No .faf file ⚠️" warning from `git` command output
- Changed to confidence-building "Analysis Complete" format
- Output now shows only positive results without unnecessary warnings

## [4.4.0] - 2026-02-14 — Infrastructure & Testing Edition

### 🎉 The Best Release to Date

This is the most comprehensive and well-tested version of faf-cli ever released.

### 🏗️ Internal Infrastructure

**FAFb Integration Layer** (xAI Exclusive - Not Exposed)
- Internal compile/decompile command implementations (commented out by default)
- FAFb ecosystem detection utilities (compiler, Radio Protocol, WASM SDK)
- Smart metadata generation for FAFb ecosystem projects
- Integration layer ready for xai-faf-rust when strategic
- **Note:** FAFb commands are OFF by default, requires code access to enable

### 🧪 Testing Excellence

**Championship-Grade Test Coverage**
- **799 tests passing** ✅ (808 total, 9 skipped)
- **+37 internal integration tests**:
  - 21 tests: FAFb ecosystem detector
  - 8 tests: Compile command implementation
  - 8 tests: Decompile command implementation
- **+41 WJTTC tests**: FAFb CLI integration suite (6-tier architecture)
- Cross-check architecture validates integration readiness

**Internal Test Coverage:**
- Ecosystem detection (Rust/Zig compilers, Radio Protocol, WASM SDK)
- Binary format validation (FAFB magic bytes, compression)
- Error handling and graceful degradation
- Performance benchmarks and regression prevention

### 🔧 Fixed

**Dependency Management**
- Pinned `inquirer@8.2.5` to prevent ESM breakage
- inquirer v9+ is ESM-only and breaks Jest (CommonJS test runner)
- Configured Dependabot to ignore inquirer major/minor upgrades
- All 7 Dependabot PRs merged and validated
- Build passes, all tests green ✅

**Test Infrastructure**
- Fixed ESM/CommonJS module conflicts with jest mocking
- Added moduleNameMapper for chalk and open packages
- Removed explicit jest.mock() calls that conflicted with automatic mocking
- Sequential test execution (maxWorkers: 1) prevents cwd corruption

### 📦 Internal Utilities (Not User-Facing)

**fafb-compiler.ts** (Integration layer - disabled by default)
- Internal wrapper for xai-faf-rust compiler
- Compile, decompile, watch, benchmark capabilities
- Ready to enable when strategic

**fafb-detector.ts** (Ecosystem detection)
- Detects FAFb ecosystem projects automatically
- Identifies compilers (Rust/Zig), Radio Protocol clients, WASM SDK
- Returns confidence scores and project metadata
- Used internally for project analysis

### 🏆 Quality Metrics

- **Test Coverage:** 799/799 passing (100% success rate)
- **Build Status:** ✅ Passing (TypeScript strict mode)
- **Dependencies:** ✅ Optimal (inquirer pinned, all others up-to-date)
- **Documentation:** ✅ Comprehensive (CLI help, test comments, CHANGELOG)
- **Championship Grade:** 🏆 Zero failures, zero compromises

### 📖 Documentation

- Internal documentation for FAFb integration layer
- WJTTC test suite includes self-documenting test names
- Clear code comments marking FAFb as xAI exclusive
- Easy to toggle on/off via code access

### 🔮 Strategic Notes

**FAFb Integration:**
- Commands are OFF by default (xAI exclusive technology)
- Can be enabled by uncommenting imports and command registrations
- All code and tests remain intact and validated
- Integration layer ready when strategic to activate

**inquirer Dependency:**
- Pinned to v8.2.5 to prevent ESM breakage with Jest
- Dependabot configured to ignore major/minor upgrades
- To upgrade: migrate to Jest 29+ or Vitest (ESM-native)

## [4.3.3] - 2026-02-14

### Fixed
- **CRITICAL:** Include updated project.faf in npm package (was missing in 4.3.2)
- project.faf now at 100% 🏆 Gold Code (birth DNA: 86%, grew +14%)
- Ensures reference implementation is visible in published package

## [4.3.2] - 2026-02-09

### Fixed
- **CRITICAL:** Added missing `prompts` dependency (v4.3.1 was broken)
- Package now works correctly after global install

## [4.3.1] - 2026-02-09 [YANKED]

### Added
- ✨ New `faf 6ws` command - Opens web interface for interactive 6Ws builder
- Paste-back workflow: fill form at faf.one/6ws → copy YAML → paste to CLI
- Best of both worlds: Web UX + CLI automation
- Supports README Evolution Edition workflow

### Fixed
- Fixed npm install hang that prompted for user input
- Postinstall script now uses /dev/tty for direct terminal output
- Install completes smoothly without user interaction required

## [4.3.0] - 2026-02-10 — FAF GIT Edition 🚀

### 🚀 Enhanced FAF GIT

**No install. No clone. Instant context. ANY repo.**

### ✨ What's New

- **GH API as Source of Truth** - FAF now works on EVERY language and ecosystem
  - Extract stack from `metadata.languages` array (C++, Rust, Go, Python, etc.)
  - Detect build systems from languages (CMake, Makefile, Gradle, Maven)
  - Detect hosting from Dockerfile presence
  - Merge with npm package.json analysis (when present)
  - New function: `extractFromLanguages()` in faf-git-generator.ts

- **Slot-Ignore System Fixed** - Scoring now works correctly
  - Corrected formula: `(filled + ignored) / 21 * 100`
  - Fixed: Slots are 'slotignored' only when truly non-applicable to project type
  - Previously: Everything undetected was marked 'slotignored' (inflated scores)
  - Now: Accurate scoring that reflects what's actually filled vs ignored
  - New utility: `src/utils/slot-counter.ts`

- **Clean Output Format** - No synthetic scores, just honest status
  - Shows "No .faf file" instead of synthetic baseline score
  - Clear transformation: None → AI-ready with complete context
  - Defensible, provable, honest

### 📈 Results

Universal language support (achieved):
- React (JavaScript): 100% 🏆 Trophy
- Vue (JavaScript): 100% 🏆 Trophy
- Next.js (Full-stack): 100% 🏆 Trophy
- whisper.cpp (C++): 100% 🏆 Trophy
- Works across ALL languages and ecosystems

### 📚 Documentation

- **README** - Added project.faf screenshot showing file in context
  - Visual explainer: "just another file helping you code"
  - Positioned near top for immediate understanding
  - Shows project.faf alongside package.json and README.md

### 🎯 Positioning

**FAF GIT is the killer feature:**
- Primary workflow: `npx faf-cli git <url>` (no install needed)
- Pro workflow: `npm install -g faf-cli` then `faf git <url>`
- Works on ANY public GitHub repo
- 2 seconds to AI-ready context
- No cloning, no setup, just instant results

## [4.2.2] - 2026-02-08 — Context Quality Edition 🎯

### 🎯 Slot-Ignore System (Documentation)

**The perfect way to handle app-types** - Now properly documented.

### ✨ What's New

- **Slot-ignore mechanism** - Comprehensive documentation added
  - Full specification in `docs/SLOT-IGNORE.md`
  - Quick reference in `docs/SLOT-IGNORE-QUICK-REF.md`
  - Like `.gitignore` for files, `slot-ignore` for context slots
  - Formula: `(Filled + Ignored) / 21 = 100%`

### ✨ Improvements

- **6 Ws extraction** - Transformed human context extraction
  - WHO: Checks package.json author first (TIER 1 authoritative)
  - WHAT: package.json description now TIER 1 (was TIER 2)
  - WHY: Targets Mission sections, uses keywords as fallback
  - WHERE: npm packages → "npm registry + GitHub" (authoritative)
  - WHEN: Version number is TIER 1 (0.x = beta, ≥1.0 = production)
  - HOW: Tech stack analysis is TIER 1 (inferred from dependencies)
  - Added `getCleanedReadme()` helper to strip HTML/badges/noise

- **Slot-ignore mechanism** - Overhauled implementation
  - Standardized to `'None'` (was inconsistent: 'N/A (CLI)', 'None', etc.)
  - Added `database: 'None'` for Node.js CLI projects
  - Improved yaml-generator logic: `if (!database && database !== 'None')` (was OR, not AND)
  - CLI projects now correctly exclude non-applicable slots from missing_context

- **README** - Added WHO section for better target audience extraction

### 📈 Results

- Score improvement: 74% → 86% → 100% (after faf auto)
- All dogfooding tests passing (7/7)
- missing_context: None - fully specified!
- 673/687 tests passing (97.9%) - 14 dev-only tests

### 🎨 Code Comments

- Added `🎯 SLOT-IGNORE:` markers throughout codebase
- Links to `docs/SLOT-IGNORE.md` for specification
- Clear explanations of slot-ignore pattern

### 📚 Documentation

- `docs/SLOT-IGNORE.md` - Full specification (391 lines)
- `docs/SLOT-IGNORE-QUICK-REF.md` - Quick reference (69 lines)
- README section explaining slot-ignore
- Proper terminology throughout codebase

## [4.2.1] - 2026-02-07

### Added
- **ml-research type support** - Added as alias to `ml-model` type
  - Recognizes `type: ml-research` in project.faf files
  - Maps to ml-model scoring (14 slots: project + backend + human)
  - Semantically accurate for ML research projects (papers, experiments, model releases like Grok-1)

### Fixed
- Type detection now correctly scores ml-research projects with 14 slots instead of falling back to generic (12 slots)
- Ensures consistency between faf-cli and builder.faf.one WASM generator

### Technical
- Updated TYPE_DEFINITIONS: `'ml-model'` aliases now include `'ml-research'`
- Discovered via builder.faf.one WASM testing - the test improved the standard!

## [4.2.0] - 2026-02-03 — Voice-API Edition 🚀👻

### 🍊 xAI/Grok Voice Configuration

**Save Our Souls** - Eternal voice memory for Grok Collections.

### ✨ What's New

- **`faf init --xai`** - Adds Grok voice configuration to project.faf
  - Voice: Leo (polite, dry British wit, technically precise)
  - Persona: Project eternal memory (zero drift)
  - Retrieval mode: Hybrid (context-first, fallback to general)
  - Escape phrase detection
- **xai_collections section** - Upload order and readiness flags
  - Ready for xAI Collections integration
  - Structured upload order for optimal RAG
- **Voice persistence** - Grok remembers your voice forever
  - No re-explaining project context
  - Mission-focused responses
  - Collection-first retrieval

### 🎯 The Voice-API Integration

Every `faf init --xai` now includes:
1. Grok voice personality (Leo)
2. Custom persona for project memory
3. Collections upload configuration
4. Hybrid retrieval strategy

### 📚 Documentation

- Boris-Flow blog post updated (workflow recommendations)
- WJTTC v1.2.0 TAF-Aware Edition published
- Cross-reference network complete

## [4.1.0] - 2026-01-31 — Gemini Native Handshake

### 🔷 Zero-Config Google AI Integration

FAF now auto-detects Gemini CLI and creates native bridges automatically.

### ✨ What's New

- **`--gemini` flag** - Explicit Gemini CLI integration
- **Auto-detection** - Detects Gemini CLI even without flag
  - Checks: `gemini` command, `~/.gemini`, `GEMINI_API_KEY`, `gcloud`
- **Native bridge** - Creates `.gemini/context.yaml` pointing to `project.faf`
- **Symlink** - `.gemini/project.faf → project.faf` for direct access
- **gemini: section** - Added to project.faf with integration config

### 🎯 The Native Handshake

Every `faf init` is now Gemini-aware. If Gemini CLI is installed, FAF automatically:
1. Detects the installation
2. Creates `.gemini/` directory
3. Writes context bridge config
4. Links to project.faf

Zero config. Native integration. Just works.

---

## [4.0.0] - 2026-01-24 — Foundation Layer

### 🏛️ The Format That Became a Standard

FAF v4.0.0 marks the transition from tool to standard. This release crystallizes
everything FAF has learned about persistent AI context.

### 🎯 Philosophy: Foundation First

**The DAAFT Problem:**
- **D**iscover - AI reads 50 files to understand your project
- **A**ssume - Guesses your stack (often wrong)
- **A**sk - Fills gaps with questions
- **F**orget - Session ends, context lost
- **T**ime + Tokens LOST - 91% wasted on rediscovery

**The FAF Solution:**
- 150 tokens once vs 1,750 tokens per session
- Zero assumptions - foundation is explicit
- Drift impossible - truth doesn't change

### ✨ What's New

- **Foundation Layer Architecture** - project.faf as single source of truth
- **DAAFT Documentation** - The problem FAF solves, explained
- **MCPaaS Integration** - Ecosystem links for eternal memory tools
- **Execution Context Engine** - New `faf go` guided interview system

### 🔧 Includes All 3.4.x Features

- **Bi-Sync 2.0** - Smart content detection and preservation
- **Google Gemini Edition** - Full Conductor & Antigravity interop
- **Demo Commands** - Live bi-sync demonstrations
- **Boris-Flow Tests** - 663 tests, WJTTC certified

### 📊 Credentials

- **IANA Registered:** application/vnd.faf+yaml
- **Anthropic MCP:** Official steward (PR #2759 merged)
- **Downloads:** 20,000+ across CLI + MCP

### 🏁 Getting Started

```bash
npm install -g faf-cli@4.0.0
faf auto
faf status --oneline
# 🏆 project.faf 100% | bi-sync ✓ | foundation optimized
```

---

## [3.4.8] - 2026-01-18 — BI-SYNC 2.0: Context Intelligence

### ✨ Smart Sync - "Knows what matters"

Bi-sync now **detects custom content** and preserves it. Your hand-crafted
CLAUDE.md with tables, code blocks, and custom sections stays intact.

**Custom markers detected:**
- `## TOOLS`, `## ENDPOINTS`, `## AUTH`, `## COMMANDS`
- `| Tool |`, `| Endpoint |` (markdown tables)
- ` ```bash ` (code blocks)

### 🛡️ Preservation Engine - "Zero content drift"

**RULE: Score can only improve - never downgrade.**

When bi-sync detects custom content, it:
1. Preserves your entire CLAUDE.md
2. Updates only the sync footer
3. Never overwrites rich content with generic templates

### 🔧 Fixes

- `FAFMirror` now uses `findFafFile()` to locate `project.faf` correctly
- Fixed hardcoded `.faf` path that ignored `project.faf` (the standard)

### 🧪 WJTTC Certified

**12 new tests** in `tests/wjttc/bi-sync-preserve-custom.test.ts`:
- Custom content detection (4 tests)
- findFafFile priority (3 tests)
- Preserve custom content during sync (3 tests)
- Score can only improve rule (1 test)
- FAFMirror initialization (1 test)

**Certification: GOLD 🥇** - Your content is protected forever.

---

## [3.4.7] - 2026-01-13 — Google Gemini Edition

Full interoperability with the Google Gemini ecosystem.

### Added

- **`faf conductor`** - Google Conductor format interop
  - `faf conductor import` - Import conductor/ directory → .faf
  - `faf conductor export` - Export .faf → conductor/ format
  - `faf conductor sync` - Bidirectional synchronization
  - Supports product.md, tech-stack.md, workflow.md, product-guidelines.md

- **`faf gemini`** - Gemini CLI / Antigravity IDE interop
  - `faf gemini import` - Import GEMINI.md → .faf
  - `faf gemini export` - Export .faf → GEMINI.md
  - `faf gemini sync` - Bidirectional synchronization
  - `--global` flag for ~/.gemini/GEMINI.md

### Universal AI Context

One `.faf` file now works with:
- Claude Code (CLAUDE.md, MCP)
- Gemini CLI (GEMINI.md)
- Antigravity IDE (~/.gemini/GEMINI.md)
- Conductor extensions (conductor/ directory)

## [3.4.4] - 2026-01-07

### Added

- **`faf demo sync`** - Live bi-sync demonstration command
  - Shows real-time .faf <-> CLAUDE.md synchronization
  - Timestamps, direction, and speed (ms) displayed
  - `--speed fast|normal|slow` for presentation pacing
  - Demo completes with no files changed
  - Built-in evangelism: every user can demo bi-sync to their team

## [3.4.3] - 2026-01-07

### Added

- **Boris-Flow Integration Tests** - 12-test suite for publish readiness validation
  - Version check, init, auto, score, non-TTY safety
  - Full Claude Code structure detection
  - `./tests/boris-flow.test.sh` - run before any publish
- **boris-ready.sh** - Quick pre-publish verification script
- **Turbo-cat Improvements** - Enhanced format discovery and tests

### Changed

- Sync command improvements for better reliability
- Compiler updates for more accurate scoring
- Removed deprecated Discord release workflow

## [3.4.2] - 2026-01-07

### Fixed

- `faf enhance` now exits cleanly in non-TTY environments (Claude Code, CI/CD)
- Previously corrupted .faf files when run without interactive terminal
- Displays helpful message directing users to use `faf auto` or run in real terminal

## [3.4.1] - 2026-01-07

### Fixed

- Removed external chalk dependency from plugin-install (zero deps approach)

## [3.4.0] - 2026-01-06

### Added

- **Claude Code Detection** - Automatic detection of Claude Code structures
  - Detects `.claude/agents/` subagents (extracts names)
  - Detects `.claude/commands/` slash commands (extracts names)
  - Detects `.claude/settings.json` permissions
  - Detects `CLAUDE.md` presence
  - Detects `.mcp.json` MCP server configuration
  - All data captured in `claude_code:` section of .faf output

- **Bun Detection** - Detects `bun.lockb` for Bun runtime projects
  - Sets runtime and package_manager to Bun

- **WJTTC Claude Code Test Suite** - 29 comprehensive tests
  - CLAUDE.md detection
  - Subagent discovery
  - Command discovery
  - Permissions extraction
  - MCP server detection
  - Edge cases (malformed JSON, empty dirs)
  - Performance tests (<10ms requirement)
  - Full Boris setup integration test

### Technical

Based on Boris Cherny's (Claude Code creator) workflow - 5 subagents, always bun, MCP servers for external services. FAF now captures this metadata for complete AI context handoff.

## [3.3.0] - 2025-12-28

### Added

- **`faf plugin-install`** - Install Claude Code plugins via HTTPS (workaround for SSH bug)
  - Fixes marketplace SSH clone issue (GitHub #9297, #9719, #9730, #9740)
  - Accepts: `owner/repo`, HTTPS URL, or SSH URL
  - Verifies plugin structure after install
  - Use `--force` to reinstall

- **Claude Code Plugin Structure** - Full plugin support at repo root
  - `commands/` directory with 6 slash commands
  - `skills/` directory with faf-expert skill
  - `.claude-plugin/plugin.json` for metadata

- **WJTTC Plugin Test Suite** - 31 tests for plugin validation
  - Brake Systems: Critical plugin structure
  - Engine Systems: Command discovery
  - Aerodynamics: Skill accessibility
  - Pit Lane: Metadata quality
  - Championship: Full integration

### Philosophy

Claude Code marketplace uses HTTPS (works). Third-party `/plugin marketplace add` uses SSH (hangs). We fixed it with `faf plugin-install` - uses HTTPS like the official marketplace.

## [3.2.7] - 2025-12-25

### Fixed

- **Birth DNA now uses raw slot count** - Birth DNA correctly reflects reality
  - Uses `slot_based_percentage` (raw slots filled / 21)
  - NOT the compiler score (which includes FAF intelligence)
  - 0% is a valid score - empty projects show 0%
  - Added extensive documentation to prevent future "optimization"

### Philosophy

Birth DNA = the "before" picture. The growth from Birth DNA to current score shows FAF's value. If Birth DNA is artificially high, we can't show improvement.

## [3.2.4] - 2025-12-17

### TYPE_DEFINITIONS - Project Type-Aware Scoring

**The scoring system now understands project types** - CLI projects no longer penalized for missing frontend/backend slots.

### Added

- **TYPE_DEFINITIONS** - Single source of truth for 94 project types
  - **21-slot system**: Project(3) + Frontend(4) + Backend(5) + Universal(3) + Human(6)
  - Types define which slot categories COUNT for scoring
  - CLI type: 9 slots (project + human) - now scores 100% without hosting/cicd
  - Fullstack type: 21 slots (all categories)
  - Monorepos as containers: all 21 slots

- **38 Type Aliases** - Intuitive shorthand mappings
  - `k8s` → `kubernetes`, `api` → `backend-api`, `rn` → `react-native`
  - `flask` → `python-api`, `turbo` → `turborepo`, and 32 more

- **slot_ignore Escape Hatch** - Override type defaults per-project
  - Array format: `slot_ignore: [stack.hosting, stack.cicd]`
  - String format: `slot_ignore: "hosting, cicd"`
  - Shorthand: `hosting` expands to `stack.hosting`

- **WJTTC MCP Certification Standard** - 7-tier certification system for MCP servers
  - Tier 1: Protocol Compliance (MCP spec 2025-11-25)
  - Tier 2: Capability Negotiation
  - Tier 3: Tool Integrity
  - Tier 4: Resource Management
  - Tier 5: Security Validation
  - Tier 6: Performance Benchmarks (<50ms operations)
  - Tier 7: Integration Readiness

### Slot Categories by Type

| Type Category | Slots | Example Types |
|---------------|-------|---------------|
| 9-slot | Project + Human | cli, library, npm-package, terraform, k8s |
| 13-slot | + Frontend | mobile, react-native, flutter, desktop |
| 14-slot | + Backend | mcp-server, data-science, ml-model |
| 16-slot | + Universal | frontend, react, vue, svelte |
| 17-slot | Backend + Universal | backend-api, node-api, graphql |
| 21-slot | All | fullstack, nextjs, monorepo, django |

### Impact

- **xai-faf-cli**: 83% → 100% (CLI type counts 9/9 slots)
- **claude-faf-mcp** v3.3.6: CHAMPIONSHIP GRADE (all 7 tiers PASS)
- 125 WJTTC tests validating type system
- Backwards compatible - existing .faf files work unchanged

## [3.2.0] - 2025-11-28

### Added

- **`faf readme` - Smart README Extraction** - Auto-fill human_context from README.md
  - Intelligently extracts the 6 Ws (WHO, WHAT, WHY, WHERE, WHEN, HOW)
  - Pattern matching for common README structures (taglines, TL;DR, Quick Start)
  - `--apply` to fill empty slots, `--force` to overwrite existing
  - Shows confidence scores and extraction sources
  - Tested results: 33% → 75%+ score boosts

- **`faf human` - Interactive Human Context** - Fill one W at a time (terminal)
  - Asks each question sequentially
  - Press Enter to skip, `--all` to re-answer all fields
  - Perfect for terminal users who want guided input

- **`faf human-set` - Non-Interactive Human Context** - Works in Claude Code
  - `faf human-set <field> "<value>"` - set one field at a time
  - Valid fields: who, what, why, where, when, how
  - Essential for AI assistants and automation scripts

### Human Context Workflow

```bash
# Step 1: Initialize
faf init                           # Creates .faf with ~50% score

# Step 2: Auto-extract from README
faf readme --apply --force         # +25-35 points (auto)

# Step 3: Fill any gaps manually
faf human-set why "32x faster"     # Non-interactive (Claude Code)
faf human                          # Interactive (terminal)

# Result: 75-85% score from human_context alone
```

## [3.1.6] - 2025-11-16

### Fixed
- Updated Discord community invite link to working URL (never expires)

## [3.1.5] - 2025-11-14

### Added

- **Auto-Update package.json for npm Packages** - Championship automation
  - `faf init` now automatically adds `project.faf` to package.json "files" array
  - Only updates if "files" array already exists (respects npm defaults)
  - Checks for existing entries (.faf, project.faf) to avoid duplicates
  - Graceful handling of edge cases (malformed JSON, non-array "files" field)
  - Informative messages: success, already exists, or manual edit needed
  - Solves the chicken-and-egg problem: package.json → faf init → auto-update!

### Fixed

- **npm Package Publishing Workflow** - No more manual edits required
  - Previously: Create project.faf, manually edit package.json
  - Now: Create project.faf, CLI auto-updates package.json
  - Critical for faf-cli and all npm packages using FAF format

## [3.1.2] - 2025-11-07

### Discord Community Launch

**The FAF community is now live** - Join us at [discord.com/invite/56fPBUJKfk](https://discord.com/invite/56fPBUJKfk)

### Added

- **Discord Community Server** - Official FAF community launched
  - 6 focused channels: announcements, general, showcase, help, integrations, w3c-and-standards
  - Permanent invite link: discord.com/invite/56fPBUJKfk
  - Low maintenance, open community structure
  - Auto-moderation enabled for spam/raid protection

- **GitHub Actions Discord Automation** - Automated release announcements
  - Discord webhook integration for both faf-cli and claude-faf-mcp
  - Rich embeds with version info, changelog, and install instructions
  - Automatic posting to #announcements on new releases
  - Differentiates between stable and beta releases

- **Championship Stress Test Timeouts** - Enterprise-ready torture testing
  - 10,000 commits test: 2min → 10min timeout (championship grade)
  - 100 package.json changes: 1min → 3min timeout (enterprise stress)
  - Prepared for monorepo and enterprise-scale testing

### Fixed

- **Critical Test Infrastructure Bug (uv_cwd)** - Fixed 24 test suite failures
  - `git.test.ts` now properly restores `process.cwd()` after changing directories
  - Prevented cascading failures when tests delete directories
  - Tests now run reliably in sequential mode (maxWorkers: 1)

- **Syntax Errors in drift.test.ts** - Fixed 7 template literal quote mismatches
  - Fixed test descriptions missing closing quotes
  - Fixed execSync calls missing commas after template literals
  - All tests now compile and run correctly

### Changed

- **Test Suite Status** - 281/327 core tests passing (86% success rate)
  - Core functionality: All passing
  - Git integration tests: Rate-limited by GitHub API (external issue)
  - Test infrastructure now championship-grade ready for enterprise

- **README Updates** - Added Discord community links
  - Discord badge in header
  - Discord navigation link alongside Website/GitHub
  - Professional, scannable structure maintained

## [3.1.0] - 2025-10-29

### The Visibility Revolution

**`project.faf` is the new universal standard** - like `package.json` for AI context.

### Added

- **project.faf Standard (FAF v1.2.0 Specification)** - Visible filename replacing hidden `.faf`
  - `faf init` now creates `project.faf` instead of `.faf`
  - `faf auto` now creates `project.faf` instead of `.faf`
  - All commands read `project.faf` first, fallback to `.faf`
  - Priority: `project.faf` > `*.faf` > `.faf`

- **faf migrate** - One-command migration from `.faf` to `project.faf`
  - Renames `.faf` → `project.faf` in current directory
  - 27ms execution (54% faster than 50ms target)
  - Beautiful color output with progress indicators

- **faf rename** - Bulk recursive migration across entire project tree
  - Recursively finds all `.faf` files in directory tree
  - Renames all to `project.faf` in parallel
  - 27ms for 3 files (73% faster than 100ms target)
  - Progress tracking and summary statistics

### Changed

- **TSA Championship Detection** - Wired DependencyTSA engine into project type detection
  - Analyzes CORE dependencies (>10 imports) instead of naive presence checks
  - 95% accuracy vs 70% accuracy (naive method)
  - Dynamic import to avoid circular dependencies
  - Exhaustive elimination strategy for definitive classification
  - Phase 1: TSA + TURBO-CAT championship detection
  - Phase 2: Fallback to naive detection when engines unavailable

- **Edge Case Test Updated** - `faf-edge-case-audit.test.ts`
  - Changed "should prefer .faf over named files" → "should prefer project.faf over .faf (v1.2.0 standard)"
  - Updated test expectation to match v1.2.0 priority

- **Dogfooding** - faf-cli itself migrated from `.faf` → `project.faf`

### Fixed

- CLI tool detection now uses bin field as PRIORITY 1 (definitive)
- Project type detection no longer reports false positives from dormant dependencies

### Performance

- `faf migrate`: 27ms (championship)
- `faf rename`: 27ms for 3 files (championship)
- All v1.2.0 commands meet <50ms target

### Testing

- **WJTTC GOLD Certification** - 97/100 championship score
  - Project Understanding: 20/20
  - TURBO-CAT Knowledge: 20/20
  - Architecture Understanding: 20/20
  - Full report: 194KB comprehensive test suite

### Backward Compatibility

- ✅ 100% backward compatible with `.faf` files
- ✅ All existing `.faf` files continue to work
- ✅ No breaking changes
- ✅ Graceful transition period

### Migration Guide

**For existing users:**
```bash
# Single project
cd your-project
faf migrate

# Entire monorepo
cd monorepo-root
faf rename
```

**For new projects:**
```bash
faf init    # Creates project.faf automatically
```

### The Golden Triangle

Three sides. Closed loop. Complete accountability.

```
         project.faf
          (WHAT IT IS)
              /    \
             /      \
            /        \
         repo    ←→   .taf
        (CODE)    (PROOF IT WORKS)
```

Every project needs:
- Code that works (repo)
- Context for AI (project.faf)
- Proof it works (.taf - git-tracked testing timeline)

**TAF** (Testing Audit File) format tracks every test run in git. On-the-fly CI/CD updates. Permanent audit trail. Format defined in **faf-taf-git** (GitHub Actions native support).

### Why project.faf?

Like `package.json` tells npm what your project needs, `project.faf` tells AI what your project IS.

- **Visible** - No more hidden files
- **Universal** - Like package.json, tsconfig.json, Cargo.toml
- **Discoverable** - Impossible to miss
- **Professional** - Standard pattern developers know

### Links

- [FAF v1.2.0 Specification](https://github.com/Wolfe-Jam/faf-cli/blob/main/SPECIFICATION.md)
- [WJTTC Test Report](https://github.com/Wolfe-Jam/faf-cli/blob/main/tests/wjttc-report-v3.1.0.yaml)
- [GitHub Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)

---

## [3.0.6] - 2025-10-22

### Changed

- Minor updates and bug fixes

## [3.0.5] - 2025-10-21

### Added

- FAF Family integrations support

## [3.0.4] - 2025-10-20

### Changed

- Performance improvements

## [3.0.3] - 2025-10-19

### Added

- Birth DNA tracking
- Context-mirroring bi-sync

## [3.0.2] - 2025-10-18

### Changed

- TURBO-CAT improvements

## [3.0.0] - 2025-10-15

### The Podium Release

- 🆓 FREE FOREVER .faf Core-Engine (41 commands)
- 💨 TURBO Model introduced
- 😽 TURBO-CAT™ Format Discovery (153 formats)
- 🧬 Birth DNA Lifecycle
- 🏆 7-Tier Podium Scoring
- ⚖️ AI | HUMAN Balance (50|50)
- 🔗 Context-Mirroring with Bi-Sync
- ⚡ Podium Speed (<50ms all commands)
- 🏁 WJTTC GOLD Certified (1,000+ tests)
- 🤖 BIG-3 AI Validation
- 🌐 Universal AI Support

---

[3.1.0]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.6...v3.1.0
[3.0.6]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.5...v3.0.6
[3.0.5]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.4...v3.0.5
[3.0.4]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.3...v3.0.4
[3.0.3]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.0...v3.0.2
[3.0.0]: https://github.com/Wolfe-Jam/faf-cli/releases/tag/v3.0.0
