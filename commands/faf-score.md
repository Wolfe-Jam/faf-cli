---
description: Rate .faf completeness (0-100%). Target 85%+ for solid AI context
argument-hint: Optional .faf file path
---

# FAF Score - Measure Project Context Quality

You are helping a developer understand and improve their FAF project context quality.

## What This Command Does

`faf score` analyzes the `.faf` file and calculates a completeness score (0-100%) using a **slot-based system**.

**Scoring system**:
- **Project slots** (3): name, goal, main_language
- **Stack slots** (varies by project type): frontend, backend, database, hosting, build, CI/CD, etc.
- **Human context slots** (6): who, what, why, where, when, how
- **Discovery slots**: Auto-filled by TURBO-CAT

**Formula**: `(filled_slots / total_applicable_slots) * 100`

---

## Trophy Levels

- 🏆 **Trophy** (100%) - Perfect project DNA
- 🥇 **Gold** (99%) - Championship grade
- 🥈 **Silver** (95-98%) - Excellent context
- 🥉 **Bronze** (85-94%) - Solid AI context ← **TARGET MINIMUM**
- 🟢 **Green** (70-84%) - Good foundation
- 🟡 **Yellow** (55-69%) - Needs improvement
- 🔴 **Red** (0-54%) - Minimal context

---

## Command: faf score

**Basic usage**:
```bash
faf score
```

**Detailed breakdown**:
```bash
faf score --breakdown
```

**With DNA journey** (shows growth over time):
```bash
faf score
# Automatically shows: Birth: 22% | Current: 🥈 95/100
```

---

## Your Role

1. **Run the command**: Execute `faf score` in project directory

2. **Interpret results**:
   - **85%+ (Bronze or better)**: Excellent! AI has solid context.
   - **70-84% (Green)**: Good foundation, could improve.
   - **Below 70%**: Needs work. Run `faf score --breakdown` to see gaps.

3. **Guide improvements**: If score is low, identify what's missing:
   - **Empty project slots**: Add goal, main_language
   - **Empty stack slots**: Specify hosting, database, build tools
   - **Generic human context**: Replace "Development teams" with specific details
   - **Missing "why"**: Most important for AI to understand purpose

4. **Suggest fixes**:
   ```bash
   # Edit .faf file directly, or run:
   faf sync
   # Then re-score:
   faf score
   ```

---

## Example Output

```
Scoring: /Users/dev/project/.faf

Birth: 22% | 🥈 95/100 (+73% 🔥)
Growth: 22% → 47% → 85% → 95% (4 evolutions)

Filled: 18/19 slots
Project:   3/3  (100%)
Stack:     9/10 (90%)
Human:     6/6  (100%)
```

---

## Championship Benchmark

**Anthropic recommends**: 🥉 85%+ (Bronze) for production AI context.

**Why 85%**:
- AI has enough context to make informed decisions
- Reduces hallucinations and incorrect assumptions
- Speeds up onboarding for new AI tools
- Creates reproducible, trustable AI assistance

**Perfect 100%**: Nice to have, not required. Diminishing returns after 95%.

---

## Troubleshooting

**Score seems low but .faf looks complete**:
- Check for placeholder values ("None", "Unknown", "TBD")
- Check for generic content ("Development teams", "Software solution")
- FAF rejects these as empty slots

**Score dropped after update**:
- Check DNA journey: `faf dna`
- Previous version may have had auto-filled discovery slots
- Manual edits might have removed discovered values

---

**Remember**: Score is a tool, not a goal. The goal is **quality AI context**. An 85% with specific, accurate information beats a 100% with generic fluff.
