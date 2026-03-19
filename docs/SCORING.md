# Scoring & Tiers

## 🎖️ Tier System: From Blind to Optimized

| Tier | Score | Status |
|------|-------|--------|
| 🏆 **Trophy** | 100% | **AI Optimized** — Gold Code |
| 🥇 **Gold** | 99%+ | Near-perfect context |
| 🥈 **Silver** | 95%+ | Excellent |
| 🥉 **Bronze** | 85%+ | Production ready |
| 🟢 **Green** | 70%+ | Solid foundation |
| 🟡 **Yellow** | 55%+ | AI flipping coins |
| 🔴 **Red** | <55% | AI working blind |
| 🤍 **White** | 0% | No context at all |

**At 55%, AI is guessing half the time.** At 100%, AI is optimized.

---

## 🎯 Slot-Ignore: The Perfect Way to Handle App Types

**Like `.gitignore` for files, slot-ignore for context slots.**

FAF has 21 slots. Some don't apply to your project type. **Slot-ignore** handles this elegantly:

```yaml
# CLI Tool - 21 slots total
stack:
  database: None           # ✅ Ignored (CLI doesn't need database)
  css_framework: None      # ✅ Ignored (no web UI)
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
- **CLI Tools:** Ignore `database`, `css_framework`, `frontend`
- **Backend APIs:** Ignore `css_framework`, `frontend`, `ui_library`
- **Static Sites:** Ignore `backend`, `database`, `api_type`
- **Libraries:** Ignore `hosting`, `cicd`, `database`

**Full spec:** [SLOT-IGNORE.md](./SLOT-IGNORE.md)
