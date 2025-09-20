# 🚨 FAF Enterprise Disaster Recovery Playbook

## Quick Reference Card

### 🔴 CRITICAL: Everything is broken
```bash
# IMMEDIATE ACTION
faf recover --auto          # Try automatic recovery
git checkout HEAD -- .faf   # Restore from git
faf init --force            # Nuclear option - start fresh
```

### 🟡 WARNING: Something's wrong
```bash
faf recover --check         # Diagnose issues
faf score                   # Check current state
faf dna                     # Verify journey intact
```

### 🟢 PREVENTIVE: Before problems
```bash
faf update                  # Save checkpoint
git commit -m "FAF checkpoint"
faf recover --backup        # List backups
```

---

## Common Disasters & Solutions

### 1. 💥 Corrupted .faf File

**Symptoms:**
- Commands fail with YAML errors
- Score shows as 0% or N/A
- "Invalid .faf format" errors

**Detection:**
```bash
$ faf score
❌ Error: Failed to parse .faf file
```

**Recovery Steps:**
```bash
# Step 1: Check for backup
ls -la .faf.backup*

# Step 2: If backup exists, restore
cp .faf.backup .faf

# Step 3: If no backup, check git
git status .faf
git checkout HEAD -- .faf

# Step 4: Last resort - rebuild
faf init --force --recover
```

**What FAF Shows:**
```
🚨 CORRUPT FAF DETECTED
━━━━━━━━━━━━━━━━━━━━
Your .faf file is damaged!

Found: .faf.backup (2 hours old)
Run: faf recover --auto

Or manually: cp .faf.backup .faf
```

---

### 2. 📉 Massive Score Drop (Accidental)

**Symptoms:**
- Score drops by >50% suddenly
- From 85% → 12% after edit
- Team CI/CD starts failing

**Detection:**
```bash
$ faf score
⚠️ HUGE DROP DETECTED!
Previous: 85%
Current: 12%
Drop: -73% 🚨
```

**Recovery Steps:**
```bash
# Step 1: DON'T PANIC - FAF protects you
# Step 2: Undo last change
faf undo

# Step 3: Or restore last good version
faf restore --last-approved

# Step 4: Check what changed
git diff .faf
```

**What FAF Shows:**
```
⚠️ PROTECTION TRIGGERED
━━━━━━━━━━━━━━━━━━━━
Score dropped 73% - This looks wrong!

BLOCKED: Auto-refusing this change

Options:
1. faf undo           - Revert change
2. faf restore        - Use backup
3. faf update --force - Override (if intentional)
```

---

### 3. 🗑️ Deleted All FAF Files

**Symptoms:**
- `rm -rf .faf*` executed
- "No .faf found" errors
- Complete context loss

**Detection:**
```bash
$ faf score
❌ No .faf file found in project
```

**Recovery Steps:**
```bash
# Step 1: Check git first
git status
git checkout HEAD -- .faf .faf-dna.json

# Step 2: Check trash/recycle bin
# Mac: Check ~/.Trash
# Linux: Check ~/.local/share/Trash

# Step 3: Time Machine / Backups
# Mac: Enter Time Machine
# Linux: Check backup system

# Step 4: Rebuild from code
faf auto --aggressive
```

**What FAF Shows:**
```
🚨 DISASTER RECOVERY MODE
━━━━━━━━━━━━━━━━━━━━━
No FAF context found!

Checking for recovery options...
✅ Git history available
   Run: git checkout HEAD -- .faf

❌ No git history
   Run: faf init --force
   Then: faf auto --aggressive
```

---

### 4. 🔄 Merge Conflicts in .faf

**Symptoms:**
- Git merge adds conflict markers
- `<<<<<<< HEAD` in .faf file
- Team blocked on PR

**Detection:**
```bash
$ git status
both modified: .faf
```

**Recovery Steps:**
```bash
# Step 1: View the conflict
cat .faf

# Step 2: Smart merge (take highest score)
faf merge --smart

# Step 3: Or manual resolution
vim .faf  # Remove conflict markers

# Step 4: Validate and commit
faf validate
git add .faf
git commit -m "Resolved .faf conflict"
```

**What FAF Shows:**
```
🔀 MERGE CONFLICT DETECTED
━━━━━━━━━━━━━━━━━━━━━━
Git conflict markers in .faf!

Smart merge available:
  Theirs: 78% (feature branch)
  Ours: 82% (main)

Run: faf merge --smart
(Will keep highest score: 82%)
```

---

## Team/Company Scenarios

### 5. 👥 New Developer Onboarding

**Scenario:** New team member clones repo

**What Happens:**
```bash
$ git clone company/project
$ cd project
$ faf status

✨ INHERITED CONTEXT!
━━━━━━━━━━━━━━━━━━━
Score: 85% (Excellent!)
Journey: 22% → 64% → 85%
Last Update: 2 days ago

You've inherited a well-maintained context!
Ready to code in 30 seconds vs 3 days.

Run: faf show  # See full context
```

---

### 6. 🏢 Company-Wide Outage

**Scenario:** Shared tooling breaks, affects all teams

**Detection Dashboard:**
```
FAF ENTERPRISE STATUS
━━━━━━━━━━━━━━━━━━━
Teams Affected: 12/15
Average Score: 45% ⚠️
Critical Teams: Backend, DevOps

ISSUES DETECTED:
- Package registry down
- CI/CD pipeline failures
- Score degradation: -31%

RECOMMENDED ACTION:
1. Freeze deployments
2. Run: faf recover --company-wide
3. Restore from yesterday's snapshot
```

**Recovery Command (Future):**
```bash
# Company admin runs
faf enterprise recover --all-teams
```

---

## Prevention & Best Practices

### Daily Habits
```bash
# Morning: Check health
faf status

# Before big changes: Checkpoint
faf update

# After features: Commit
git add .faf && git commit -m "Context update"

# Friday: Backup check
faf recover --backup
```

### CI/CD Integration
```yaml
# .github/workflows/faf-protection.yml
name: FAF Protection
on: [push, pull_request]

jobs:
  protect-context:
    steps:
      - name: Check FAF Health
        run: |
          faf recover --check
          faf score --min 60

      - name: Backup Before Deploy
        if: github.ref == 'refs/heads/main'
        run: |
          cp .faf .faf.backup-${{ github.sha }}
          faf update
```

### Team Rules
```markdown
## Team FAF Rules

1. **NEVER force push without backup**
   - Run: `faf update` first

2. **Score below 60% blocks merge**
   - Fix with: `faf auto`

3. **Weekly context review**
   - Fridays: Team FAF score review

4. **New features need context update**
   - Update .faf with new components
```

---

## Error Messages Explained

### What You See → What It Means → What To Do

| Error | Meaning | Action |
|-------|---------|--------|
| `YAML parse error` | Corrupted .faf | `faf recover --auto` |
| `No .faf found` | File deleted/missing | `git checkout HEAD -- .faf` |
| `Score below threshold` | Quality gate failed | `faf enhance` |
| `DNA mismatch` | Wrong project | Check directory |
| `Backup corrupted` | Backup also bad | `faf init --force` |
| `Permission denied` | File locked | `chmod 644 .faf` |
| `Huge score drop` | Accidental damage | `faf undo` |

---

## Recovery Tools

### Built-in Commands
```bash
faf recover          # Interactive recovery
faf recover --auto   # Automatic fix
faf recover --check  # Health check only
faf recover --backup # List backups
faf undo            # Revert last change
faf restore         # Restore from backup
faf merge --smart   # Resolve conflicts
```

### Emergency Scripts
```bash
# Full reset (nuclear option)
rm -f .faf .faf-dna.json .faf.backup*
faf init --force
faf auto --aggressive

# Time-based recovery
git log --since="1 week ago" -- .faf
git checkout <commit-hash> -- .faf

# Backup everything
tar -czf faf-backup-$(date +%s).tar.gz .faf*
```

---

## Support Escalation

### Level 1: Self-Service (0-5 min)
```bash
faf recover --auto
faf help disaster
```

### Level 2: Documentation (5-30 min)
- This guide
- https://faf.dev/disaster-recovery
- Video tutorials

### Level 3: Community (30 min - 2 hrs)
- Discord: https://discord.gg/faf
- Stack Overflow: [faf-cli] tag
- GitHub Issues

### Level 4: Direct Support (2-24 hrs)
- Email: urgent@faf.dev
- Enterprise: Phone support
- SLA: 2-hour response for critical

---

## Monitoring & Alerts

### What to Monitor
```yaml
metrics:
  - faf_score
  - days_since_update
  - backup_count
  - team_average_score

alerts:
  - score < 60: WARNING
  - score < 40: CRITICAL
  - no_update > 30 days: INFO
  - backup_missing: WARNING
```

### Prometheus Metrics
```prometheus
# FAF health metrics
faf_score{project="backend"} 75
faf_last_update_days{project="backend"} 2
faf_backup_exists{project="backend"} 1
faf_corruption_detected{project="backend"} 0
```

### Grafana Dashboard
```
┌────────────────────────────────┐
│   FAF Enterprise Dashboard      │
├────────────────────────────────┤
│ Overall Health: 🟢 GOOD        │
│ Average Score: 78%             │
│ At Risk: 2 projects            │
│ Last Incident: 5 days ago      │
└────────────────────────────────┘
```

---

## The Recovery Promise

> "When disaster strikes, FAF has your back."

- **Auto-detection** of problems
- **Clear guidance** on recovery
- **Multiple fallbacks** for safety
- **Git integration** for history
- **Team support** when needed

Remember: **Your journey is sacred. We protect it.**

---

## Quick Contact Card

```
🚨 EMERGENCY CONTACTS
━━━━━━━━━━━━━━━━━━━
Docs:     faf.dev/help
Discord:  discord.gg/faf
Email:    urgent@faf.dev
Status:   status.faf.dev
```

**Save this guide. Print it. Share it. When disaster strikes, you'll be ready.**