# 🏁 FAF Help - Quick Command Reference

**Need help? You're in the right place!**

---

## 🚀 Getting Started

```bash
# Install
npm install -g faf-cli

# Quick setup
faf auto

# Check status
faf status
```

**That's all you need to start!** For detailed help, see `USER-GUIDE.md`

---

## 📋 All Commands

### Core Commands

#### `faf init`
Create a new .faf file for your project

**Usage:**
```bash
faf init                    # Interactive setup
faf init --force           # Overwrite existing .faf
faf init --template react  # Use specific template
```

**Templates:**
- `auto` - Auto-detect (default)
- `react` - React project
- `python-fastapi` - Python FastAPI
- `node-express` - Node.js Express
- `svelte` - SvelteKit project

---

#### `faf auto`
🏎️ **The Championship Command** - Does everything in one go!

**What it does:**
1. Creates .faf file (if missing)
2. Syncs dependencies
3. Creates CLAUDE.md
4. Shows scorecard

**Usage:**
```bash
faf auto              # Full auto-setup
faf auto --force      # Force recreate everything
faf auto --ai         # Include AI enhancement
```

**When to use:**
- New project setup
- First-time FAF installation
- Quick championship-ready context

---

#### `faf status`
Quick health check - use this daily!

**Usage:**
```bash
faf status
```

**Output:**
```
🏎️ FAF Status
━━━━━━━━━━━━
Score: 85% 🥉 Target 1 - Bronze
Next: 95% 🥈 Target 2 - Silver (10% to go!)

├─ 🤖 AI Readiness: ☑️ Optimized
├─ 📄 Files Tracked: 342 lines
├─ ⚡ Performance: 32ms 🟢
└─ 🧡 Last Sync: 2 hours ago
```

**Performance:** <38ms (faster than git status!)

---

#### `faf show`
Display full championship scorecard

**Usage:**
```bash
faf show           # Formatted output
faf show --raw     # Raw markdown
```

**Output:**
```
🏎️ FAF Championship Score Card
================================

🥉 Project Score: 85/100
Target 1 - Bronze

📊 Score Breakdown:
   project: 85% (13/15)
   human_context: 100% (6/6)
   ai_instructions: 60% (3/5)
```

---

#### `faf score`
Detailed score analysis

**Usage:**
```bash
faf score              # Basic score
faf score --details    # Deep breakdown
```

---

### Sync Commands

#### `faf sync`
Sync .faf with latest project changes

**Usage:**
```bash
faf sync              # Interactive sync
faf sync --auto       # Auto-apply changes
```

**What it syncs:**
- Dependencies (package.json, requirements.txt)
- Technology stack
- File structure
- Project metadata

**Speed:** <200ms

---

#### `faf bi-sync`
Bi-directional sync between .faf and CLAUDE.md

**Usage:**
```bash
faf bi-sync                # One-time sync
faf bi-sync --watch        # Auto-sync on changes
faf bi-sync --force        # Force recreate CLAUDE.md
```

**What it does:**
- Creates/updates CLAUDE.md from .faf
- Maintains perfect harmony
- Preserves custom content

**Watch mode:** Perfect for development

---

### Quality Commands

#### `faf trust`
Analyze context trust score

**Usage:**
```bash
faf trust              # Basic trust score
faf trust --detailed   # Full breakdown
```

**Output includes:**
- Overall trust percentage
- Completeness score
- AI confidence level
- Missing context items
- Improvement suggestions

---

#### `faf validate`
Validate .faf file structure

**Usage:**
```bash
faf validate
```

**Checks:**
- YAML syntax
- Required fields
- Data types
- Schema compliance

---

#### `faf doctor`
Diagnose and fix issues

**Usage:**
```bash
faf doctor
```

**Checks for:**
- Missing fields
- Corrupted data
- Sync issues
- Performance problems

---

### Enhancement Commands

#### `faf enhance`
AI-powered context improvements

**Requirements:**
```bash
export OPENAI_API_KEY=your-key
# or
export ANTHROPIC_API_KEY=your-key
```

**Usage:**
```bash
faf enhance              # Interactive enhancement
faf enhance --auto       # Auto-apply suggestions
```

**What it does:**
- Analyzes project structure
- Suggests context improvements
- Fills missing information
- Optimizes AI instructions

---

### Utility Commands

#### `faf clear`
Clear cache and temporary files

**Usage:**
```bash
faf clear
```

---

#### `faf version`
Show FAF version with championship banner

**Usage:**
```bash
faf version
faf --version
faf -v
```

---

#### `faf formats`
Show detected project formats

**Usage:**
```bash
faf formats              # List view
faf formats --pyramid    # Hierarchical view
```

---

## 🏆 Medal System Quick Reference

```
🏆 100%  Trophy - Championship (50|50 balance)
🥇 99%   Gold
🥈 95%+  Silver - Target 2
🥉 85%+  Bronze - Target 1
🟢 70%+  Green - GO! Ready for Target 1
🟡 55%+  Yellow - Caution
🔴 0-54% Red - Stop, needs work
```

---

## 💡 Common Use Cases

### "I just want to get started"
```bash
faf auto
```

### "I need to check my score"
```bash
faf status
```

### "I want to improve my score"
```bash
faf trust --detailed
faf sync
faf enhance
```

### "I need to sync with team"
```bash
faf bi-sync
git add .faf CLAUDE.md
git commit -m "Update FAF context"
```

### "Something's wrong"
```bash
faf doctor
faf validate
faf clear
```

### "I want continuous sync"
```bash
faf bi-sync --watch
```

---

## 🔧 Command Options

### Global Options
```bash
-h, --help       Show help
-v, --version    Show version
-q, --quiet      Quiet mode (less output)
--no-color       Disable colors
```

### Common Flags
```bash
--force          Force overwrite
--auto           Auto-apply changes
--details        Show detailed output
--watch          Watch for changes
--raw            Raw output format
```

---

## 📊 Performance Targets

All commands are F1-inspired for speed:

- `faf status`: <38ms
- `faf sync`: <200ms
- `faf validate`: <10ms
- `faf score`: <50ms

**If commands are slow:**
```bash
faf clear  # Clear cache
```

---

## 🆘 Getting Help

### In-CLI Help
```bash
faf --help           # General help
faf init --help      # Command-specific help
faf status --help    # Command-specific help
```

### Documentation
- **User Guide:** `USER-GUIDE.md`
- **Medal System:** `CHAMPIONSHIP-MEDAL-SYSTEM.md`
- **Website:** [faf.one](https://faf.one)
- **Docs:** [docs.faf.one](https://docs.faf.one)

### Community & Support
- **GitHub:** [github.com/Wolfe-Jam/faf](https://github.com/Wolfe-Jam/faf)
- **Discussions:** [GitHub Discussions](https://github.com/Wolfe-Jam/faf/discussions)
- **Issues:** [GitHub Issues](https://github.com/Wolfe-Jam/faf/issues)
- **Email:** support@faf.one

---

## 🎯 Quick Troubleshooting

### Command fails
```bash
faf doctor        # Diagnose
faf validate      # Check .faf
faf clear         # Clear cache
```

### Low score stuck
```bash
faf trust --detailed  # See what's missing
faf sync             # Update context
faf enhance          # AI suggestions
```

### Slow performance
```bash
faf clear            # Clear cache
faf status           # Check health
```

### CLAUDE.md out of sync
```bash
faf bi-sync --force  # Force recreate
```

---

## 🏁 Next Steps

1. **Read the User Guide:** `USER-GUIDE.md`
2. **Learn the Medal System:** `CHAMPIONSHIP-MEDAL-SYSTEM.md`
3. **Join the Community:** [GitHub Discussions](https://github.com/Wolfe-Jam/faf/discussions)
4. **Start Building:** `faf auto` 🚀

---

**Made with 🧡 by the FAF Team**

*Stop faffing about - start building with championship-grade context!* 🏎️⚡️
