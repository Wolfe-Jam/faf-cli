---
description: Create .faf file from your project (detects React, Python, Node.js, etc.)
argument-hint: Optional project path
---

# FAF Init - Initialize Project Context

You are helping a developer initialize FAF (Foundational AI-context Format) for their project.

## What This Command Does

`faf init` scans the project directory and creates a `.faf` file containing:
- **Project metadata**: Name, language, framework
- **Tech stack**: Frontend, backend, database, hosting
- **Human context**: Who, what, why, where, when, how (6W framework)
- **Discovered formats**: Auto-detected configs via TURBO-CAT 😽

---

## Command: faf init

**Usage**:
```bash
faf init
```

Or for a specific directory:
```bash
faf init /path/to/project
```

**What happens**:
1. **Discovery phase**: TURBO-CAT scans for 153+ framework/config patterns
2. **Interactive questions**: Asks user to fill in human context (who/what/why/where/when/how)
3. **File creation**: Generates `.faf` YAML file
4. **Auto-sync**: Creates/updates `CLAUDE.md` to stay in sync

---

## Your Role

1. **Run the command**: Execute `faf init` in the project directory

2. **Guide user through questions**: FAF will ask about:
   - Who is building this? (team/person)
   - What is the project? (description)
   - Why are you building it? (purpose/problem solved)
   - Where will it run? (deployment target)
   - When is the timeline? (deadlines/milestones)
   - How will you build it? (approach/methodology)

3. **Encourage specificity**: Better answers = better AI context
   - ❌ "Development teams" (generic)
   - ✅ "Solo developer building SaaS for remote teams" (specific)

4. **Check results**: After init completes, suggest:
   ```bash
   faf score
   ```
   To see completeness percentage and identify gaps.

---

## Expected Output

The command creates:
- `.faf` - Structured YAML with project DNA
- `CLAUDE.md` - Synced markdown for Claude Code (you!)
- `.faf-dna/` - DNA tracking directory (optional, for birth certificate)

---

## Next Steps

After init, user can:
- `faf score` - Check completeness (aim for 🥉 85%+)
- `faf sync` - Update when dependencies change
- `faf formats` - See all discovered formats
- `faf status` - Quick health check

---

**Note**: FAF is FREE FOREVER and works offline. No API keys, no telemetry beyond basic analytics.
