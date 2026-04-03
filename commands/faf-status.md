---
description: Quick .faf context health check
argument-hint: None
---

# FAF Status - Instant Context Health Check

You are helping a developer quickly check their FAF project context health.

## What This Command Does

`faf status` provides an instant health check of the `.faf` file and AI context quality.

**Speed**: <200ms (designed for frequent checks)
**Output**: Traffic light system (🟢/🟡/🔴)
**Purpose**: Quick confidence check before AI work

---

## Command: faf status

**Usage**:
```bash
faf status
```

**What it checks**:
1. ✅ Does `.faf` file exist?
2. ✅ Is `.faf` valid YAML?
3. ✅ Is `CLAUDE.md` in sync?
4. ✅ What's the completeness score?
5. ✅ Any stale content (>30 days old)?

---

## Output Indicators

**🟢 GREEN (Healthy)**:
- `.faf` exists and valid
- Score ≥ 85% (Bronze or better)
- Synced with `CLAUDE.md`
- Updated recently

**🟡 YELLOW (Needs attention)**:
- `.faf` exists but score 55-84%
- Out of sync with `CLAUDE.md`
- Stale (>30 days since update)

**🔴 RED (Critical)**:
- No `.faf` file
- Invalid YAML
- Score < 55%
- Corrupted file

---

## Your Role

1. **Run the command**: Execute `faf status`

2. **Interpret results**:

   **GREEN example**:
   ```
   🟢 FAF Status: Healthy
   Score: 🥈 95% (Silver)
   Synced: ✅ .faf ↔ CLAUDE.md
   Updated: 2 days ago
   ```
   → **Action**: None needed. AI context is solid.

   **YELLOW example**:
   ```
   🟡 FAF Status: Needs Attention
   Score: 🟡 67% (Yellow)
   Synced: ⚠️ Out of sync (run: faf sync)
   Updated: 45 days ago
   ```
   → **Action**: Run `faf sync` then `faf score --details` to improve.

   **RED example**:
   ```
   🔴 FAF Status: Critical
   Error: .faf file not found
   Suggestion: Run 'faf init' to create
   ```
   → **Action**: Run `faf init` or `faf auto`

3. **Guide next steps** based on status color

---

## When to Check Status

**Good times**:
- Before starting AI-assisted work session
- After major project changes (new dependencies, refactoring)
- Weekly as part of maintenance routine
- Before sharing project with team
- In CI/CD pipelines (automated checks)

**Quick workflow**:
```bash
# Monday morning routine:
faf status          # Check health
faf sync            # Update if needed
faf score           # Verify quality
# → Ready for championship AI assistance 🏁
```

---

## Related Commands

**If status is YELLOW/RED**:
```bash
faf status          # Identify issue
faf sync            # Fix sync issues
faf score --details # See what's missing
faf init            # If .faf missing
faf auto            # Complete reset/setup
```

---

## Championship Benchmark

**Healthy status = Confident AI work**
- 🟢 GREEN status = "AI has what it needs"
- 🟡 YELLOW status = "AI might guess/hallucinate"
- 🔴 RED status = "AI is flying blind"

**Target**: Keep status 🟢 GREEN 95%+ of the time.

**How**:
- Run `faf sync` after dependency changes
- Run `faf update` weekly to checkpoint progress
- Fix issues immediately when status drops to 🟡/🔴

---

## Pro Tips

1. **Alias for speed**: `alias fs='faf status'`
2. **Shell prompt integration**: Show status in terminal prompt
3. **Git hook**: Auto-check on `git commit`
4. **CI/CD gate**: Block deploys if status is 🔴

---

**Philosophy**: Status check should be as fast and automatic as `git status`. Championship developers check FAF status habitually. 🏎️⚡️
