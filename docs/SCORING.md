# Scoring & Tiers

## Tier System — Trophy is the target

**🏆 Trophy 100% — all or nothing.** From v6.6.0 onward, faf-cli recommends only Trophy. 100% on the FCL is what makes the layers above (MD instructions, Agents, AI tooling) work properly. Sub-Trophy tiers below are honest interim states on the way to Trophy, not endpoints we recommend.

| Tier | Score | Status |
|------|-------|--------|
| 🏆 **Trophy** | 100% | AI never has to guess — Gold Code |
| ★ **Gold** | 99%+ | 1 slot from Trophy |
| ◆ **Silver** | 95%+ | Close — keep going |
| ◇ **Bronze** | 85%+ | Interim — keep going |
| ● **Green** | 70%+ | Interim — keep going |
| ● **Yellow** | 55%+ | AI flipping coins |
| ○ **Red** | <55% | AI working blind |
| ♡ **White** | 0% | No context at all |

**At 55%, AI is guessing half the time.** At 100%, AI never guesses.

🏆 is the only emoji. Sub-Trophy tiers use geometric Unicode symbols (★ ◆ ◇ ● ○ ♡) — the source-of-truth lives in [`src/core/tiers.ts`](../src/core/tiers.ts).

---

## 🎯 Slot-Ignore: The Perfect Way to Handle App Types

**Like `.gitignore` for files, slot-ignore for context slots.**

FAF has 21 slots. Some don't apply to your project type. **Slot-ignore** handles this elegantly:

```yaml
# CLI Tool - 21 slots total
stack:
  db: None           # ✅ Ignored (CLI doesn't need db)
  css: None      # ✅ Ignored (no web UI)
  backend: Node.js         # ✅ Filled (has value)
  # ... other slots

Score: (Filled + Ignored) / 21 = 100% 🏆
```

**The formula:**
```
Total Slots: 21 (constant)
├── Filled: 15 (has values)
├── Ignored: 6 (set to 'None' - not applicable)
└── Missing: 0 (undefined - needs attention)

Score: (15 + 6) / 21 = 100%
```

**Common patterns:**
- **CLI Tools:** Ignore `db`, `css`, `framework`
- **Backend APIs:** Ignore `css`, `framework`, `ui_library`
- **Static Sites:** Ignore `backend`, `db`, `api`
- **Libraries:** Ignore `hosting`, `cicd`, `db`

**Full spec:** [SLOT-IGNORE.md](./SLOT-IGNORE.md)
