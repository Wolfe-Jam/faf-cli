# Scoring & Tiers

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

## 🎯 Slot-Ignore: The Perfect Way to Handle App Types

**Like `.gitignore` for files, slot-ignore for context slots.**

FAF has 21 base slots. Some don't apply to your app-type. faf writes `slotignored` (shown as N/A) into those, and they are left out of the count:

```yaml
# CLI Tool — the frontend and backend slots don't apply
project:
  type: cli
stack:
  frontend: slotignored    # N/A — left out (faf wrote this)
  database: slotignored    # N/A — left out (faf wrote this)
  hosting: npm registry    # ✅ Filled
  cicd: GitHub Actions     # ✅ Filled
  # ... other slots
```

**How the slots count:**
```
Filled   — has a real value            → counts for the score
Ignored  — slotignored (N/A)            → not counted
Empty    — missing, "", None, N/A,      → counts against the score
           not applicable, unknown
```

`faf score` shows filled slots out of the slots that count, e.g. `12/12 slots` = 100% ✪.

**A typed `None` / `N/A` / `not applicable` / `unknown` is an empty slot**, not slot-ignore: it scores 0 until filled. The app-type decides which slots count. `faf auto` fills a tech slot when the repo has the fact; with no fact your words stay as typed in a slot the app-type uses, and become `slotignored` in a slot it leaves out. The 6Ws stay yours: `faf go` asks.

**Common patterns:**
- **CLI tools, libraries:** the frontend and backend slots are left out
- **Frontend apps, websites:** the backend slots are left out
- **Backend APIs, MCP servers:** the frontend slots are left out
- **Full-stack apps:** all 21 base slots count

**Full spec:** [SLOT-IGNORE.md](./SLOT-IGNORE.md)
