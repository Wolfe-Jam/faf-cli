# Scoring & Tiers

> **Source of truth:** [`src/core/slots.ts`](../src/core/slots.ts) (the 33 slots and the app-type table) · [`src/core/tiers.ts`](../src/core/tiers.ts) (the tiers). The score is computed by the scoring kernel and is deterministic: the same file always gets the same score.
>
> **Updated 2026-09-12.** The February 2026 version of this page (v4.2.1) said a typed `None` ignores a slot and gave the formula `(Filled + Ignored) / 21`. Both are superseded — see [What changed](#what-changed).

## Tier System — Trophy is the target

**✪ Trophy 100% — all or nothing.** From v6.6.0 onward, faf-cli recommends only Trophy. On **work** surfaces (CLI · docs · receipts) the glyph is **✪** (Proof Seal). Social still uses 🏆; brand pixels use the Trophy Mark. Same meaning: 100%. Sub-Trophy tiers below are honest interim states on the way to Trophy, not endpoints we recommend.

| Tier | Score | Status |
|------|-------|--------|
| ✪ **Trophy** | 100% | AI never has to guess — Gold Code (work glyph; social 🏆) |
| ★ **Gold** | 99%+ | 1 slot from Trophy |
| ◆ **Silver** | 95%+ | Close — keep going |
| ◇ **Bronze** | 85%+ | Interim — keep going |
| ● **Green** | 70%+ | Interim — keep going |
| ● **Yellow** | 55%+ | AI flipping coins |
| ○ **Red** | <55% | AI working blind |
| ♡ **White** | 0% | No context at all |

**At 55%, AI is guessing half the time.** At 100%, AI never guesses.

Work surfaces use ✪ for Trophy (not the social emoji 🏆). Sub-Trophy tiers use geometric Unicode (★ ◆ ◇ ● ○ ♡) — source of truth: [`src/core/tiers.ts`](../src/core/tiers.ts).

---

## How the score works

1. **33 slots.** Every `.faf` uses the same Mk4 slot set: project (3), human context (6), frontend (4), backend (5), universal (3), and enterprise infra, app and ops (12). faf-cli scores the base tier, slots 1–21. The enterprise tier scores all 33.
2. **Your app-type decides which slots count.** `project.type` is your app-type. `faf init`, `faf auto` and `faf git` detect it and write `slotignored` into every slot your app-type doesn't use. These slots are not required and not scored.
3. **Every other slot is active.** An active slot is either filled or empty. Typing `None`, `N/A`, `null`, `unknown` or `not applicable` doesn't take a slot out of the score — it counts as empty. From faf-cli 7.13, `faf auto` fills such a tech slot when the repo has the fact, and writes `slotignored` over typed words in a slot your app-type leaves out; the 6Ws stay yours (`faf go` asks). See [SLOT-IGNORE.md](./SLOT-IGNORE.md#typed-words).
4. **Score = filled ÷ active**, as a whole percentage.

| App-type | Categories that count | Active slots |
|---|---|---|
| `documentation` · `intent` · `encyclopedia` | project, human | 9 |
| `cli` · `library` · `sdk` · `wasm` · `html` · `server-card` | project, human, universal | 12 |
| `frontend` · `website` · `mobile` · `app` · `extension` | project, frontend, human, universal | 16 |
| `mcp` · `backend` · `data-science` | project, backend, human, universal | 17 |
| `fullstack` · `svelte` · `framework` | project, frontend, backend, universal, human | 21 |
| `monorepo-root` | project, human, enterprise infra, app, ops | 21 |
| `mcpaas` | project, backend, universal, human, enterprise app, ops | 24 |
| `saas` | project, frontend, backend, universal, human, enterprise app | 25 |
| `enterprise` | all categories | 33 |

An app-type that isn't in this table falls back to `library`. App-types that use enterprise categories are scored in full by the enterprise tier.

**Example.** A `cli` project has 12 active slots: name, goal, language, the 6 Ws, hosting, build and CI/CD. All 12 filled is 100% ✪. With 10 filled and 2 empty, it's 10 ÷ 12 = 83% ●.

## Slot keys

Write the keys faf writes. Six slots also have a shorter Mk4 name. faf-cli can read either, but the scoring kernel scores the key faf writes. From faf-cli 7.13, when your file uses the short name, `faf auto` keeps the scored key in step with it (the fact, or `slotignored`), so the score counts what your file says.

| Key faf writes (scored) | Mk4 short name |
|---|---|
| `stack.frontend` | `stack.framework` |
| `stack.css_framework` | `stack.css` |
| `stack.state_management` | `stack.state` |
| `stack.api_type` | `stack.api` |
| `stack.database` | `stack.db` |
| `stack.package_manager` | `stack.pkg_manager` |

## What changed

| February 2026 (v4.2.1) | Now |
|---|---|
| A typed `None` marks a slot as ignored | A typed `None` / `N/A` counts as **empty**; only the app-type decides `slotignored` |
| `Score = (Filled + Ignored) / 21` | `Score = filled ÷ active` |
| 21 slots, always constant | 33 slots; the app-type selects 9–33 of them |

More on `slotignored`: [SLOT-IGNORE.md](./SLOT-IGNORE.md). The February text is in git history.
