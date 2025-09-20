# 📚 FAF Command Reference

Complete guide to all FAF CLI commands and options.

## Table of Contents
- [Core Commands](#core-commands)
- [DNA Lifecycle Commands](#dna-lifecycle-commands)
- [Enhancement Commands](#enhancement-commands)
- [Utility Commands](#utility-commands)
- [Advanced Commands](#advanced-commands)
- [Global Options](#global-options)

---

## Core Commands

### `faf init`
Initialize a new .faf file for your project.

```bash
faf init [options] [directory]
```

**Options:**
- `--force, -f` - Overwrite existing .faf file
- `--template <type>` - Use specific template (auto|react|python|node)
- `--project-type <type>` - Override detected project type
- `--output <path>` - Custom output path

**Examples:**
```bash
faf init                    # Auto-detect and create
faf init --force           # Overwrite existing
faf init --template react  # Use React template
```

**Birth Weight Scoring:**
- Analyzes CLAUDE.md if present (5-22% typical)
- Creates DNA tracking with birth certificate
- Shows journey starting point

---

### `faf score`
Check your context quality score (0-100%).

```bash
faf score [options] [file]
```

**Options:**
- `--details, -d` - Show detailed breakdown
- `--min <score>` - Set minimum threshold (exits 1 if below)
- `--json` - Output as JSON
- `--quiet` - Suppress visual output

**Examples:**
```bash
faf score                  # Current score with visual
faf score --details       # Full breakdown
faf score --min 70       # CI/CD gate
```

**Score Ranges:**
- 🔴 0-39%: Poor - AI will struggle
- 🟡 40-69%: Fair - Basic understanding
- 🟢 70-84%: Championship - Good AI context
- 🔵 85-94%: Elite - Professional grade
- 🏆 95-100%: Perfect - Maximum AI happiness

---

## DNA Lifecycle Commands

### `faf dna`
Display your FAF DNA journey with visual progress.

```bash
faf dna [options]
```

**Output Example:**
```
🧬 YOUR FAF DNA

   22% → 48% → 85% ← 82%

   ☑️ Born (22%)
   ☑️ First Save (48%)
   ☑️ Doubled (44%)
   ☑️ Championship (70%)
   ☑️ Elite (85%)
   ☑️ Peak (85%)
   ░░ Perfect (100%) - Available!
```

**Features:**
- Shows complete journey from birth
- Visual milestone tracking
- Peak score with back arrow when below
- Encouragement for next milestone

---

### `faf auth`
Authenticate your FAF project with a birth certificate.

```bash
faf auth [options]
```

**Options:**
- `--force` - Re-authenticate even if already done
- `--verify` - Verify existing certificate

**Output:**
```
✅ Authenticated
Certificate: FAF-2025-MYAPP-X7B9
Birth Weight: 22%
Current Score: 85%
```

---

### `faf log`
View complete evolution history of your context.

```bash
faf log [options]
```

**Options:**
- `--milestones` - Show only milestone events
- `--analytics` - Include growth metrics
- `--json` - Output as JSON
- `--limit <n>` - Limit entries shown

**Examples:**
```bash
faf log                    # Full history
faf log --milestones      # Key achievements only
faf log --analytics       # With growth metrics
```

---

### `faf update`
Save a checkpoint of your current context state.

```bash
faf update [options]
```

**Features:**
- Creates version checkpoint
- Marks as user-approved
- Enables rollback point
- Non-scary (was "approve")

**Output:**
```
✅ VERSION SAVED
Version: v1.2.0
Score: 85%
Growth from birth: +63%
```

---

### `faf recover`
Disaster recovery for corrupted or missing FAF files.

```bash
faf recover [options]
```

**Options:**
- `--auto` - Attempt automatic recovery
- `--backup` - List available backups
- `--check` - Health check only
- `--force` - Force recovery even if risky

**Examples:**
```bash
faf recover --check       # Diagnose issues
faf recover --auto       # Auto-fix problems
faf recover --backup     # Show backups
```

**Handles:**
- Corrupted .faf files
- Missing DNA history
- Massive score drops
- Complete deletion

---

## Enhancement Commands

### `faf enhance`
AI-powered context improvements.

```bash
faf enhance [options] [file]
```

**Options:**
- `--aggressive` - Maximum improvements
- `--focus <area>` - Target specific area
- `--dry-run` - Preview changes
- `--model <ai>` - Choose AI model (claude|gpt|gemini)

**Focus Areas:**
- `completeness` - Fill missing fields
- `quality` - Improve descriptions
- `ai-readiness` - Optimize for AI
- `human-context` - Enhance 6 W's

---

### `faf sync`
Synchronize .faf with project changes.

```bash
faf sync [options] [file]
```

**Options:**
- `--claude` - Sync with CLAUDE.md
- `--force` - Overwrite conflicts
- `--dry-run` - Preview changes

**Syncs:**
- Package.json dependencies
- README content
- Git configuration
- File structure changes

---

### `faf bi-sync`
Bidirectional sync between .faf and CLAUDE.md.

```bash
faf bi-sync [options]
```

**Features:**
- Two-way synchronization
- Conflict resolution
- Keeps both files aligned
- Preserves unique content

---

## Utility Commands

### `faf validate`
Validate .faf file structure and content.

```bash
faf validate [options] [file]
```

**Options:**
- `--schema <version>` - Schema version to validate against
- `--verbose` - Detailed validation output

---

### `faf lint`
Fix formatting and style issues in .faf file.

```bash
faf lint [options] [file]
```

**Options:**
- `--fix` - Auto-fix issues
- `--strict` - Strict mode

---

### `faf formats`
Discover all file formats in your project.

```bash
faf formats [options] [directory]
```

**Options:**
- `--pyramid` - Show visual pyramid
- `--category` - Group by category
- `--export` - Export as JSON

**Output:**
```
😽 TURBO-CAT™ Format Discovery
Found 47 formats across 312 files

PYRAMID OF POWER:
       TS
     JS  JSON
   MD  YAML  CSS
 HTML  PY  SH  SQL
```

---

### `faf share`
Generate sanitized context for sharing.

```bash
faf share [options] [file]
```

**Options:**
- `--format <type>` - Output format (md|json|yaml)
- `--sanitize` - Remove sensitive data
- `--include-journey` - Add DNA journey

**Security:**
- Removes API keys
- Sanitizes paths
- Excludes private data
- Safe for public sharing

---

### `faf status`
Quick health check of your FAF context.

```bash
faf status [options]
```

**Output:**
```
✅ FAF Status: HEALTHY
Score: 85% (Elite)
Journey: 22% → 85%
Last Update: 2 hours ago
Next Milestone: Peak (90%)
```

---

### `faf trust`
Unified trust dashboard showing confidence metrics.

```bash
faf trust [options]
```

**Options:**
- `--detailed` - Full metrics breakdown
- `--confidence` - AI confidence analysis
- `--garage` - Safe experimentation mode
- `--panic` - Emergency repair mode
- `--guarantee` - Quality assurance (85%+)

---

## Advanced Commands

### `faf credit`
Technical credit dashboard for contributions.

```bash
faf credit [options]
```

**Tracks:**
- Context improvements
- Milestone achievements
- Team contributions
- Quality metrics

---

### `faf todo`
Claude-inspired todo system for context improvements.

```bash
faf todo [options]
```

**Options:**
- `--add <task>` - Add improvement task
- `--complete <id>` - Mark task done
- `--list` - Show all tasks
- `--gamify` - Show as game achievements

---

### `faf chat`
Natural language .faf generation.

```bash
faf chat
```

**Interactive session:**
- Conversational context building
- Q&A format
- AI-assisted generation
- Natural language input

---

### `faf verify`
Test .faf with multiple AI models.

```bash
faf verify [options]
```

**Options:**
- `--model <ai>` - Specific model to test
- `--all` - Test with all models
- `--report` - Generate compatibility report

---

### `faf index`
Complete A-Z reference guide.

```bash
faf index [term]
```

**Examples:**
```bash
faf index           # Full index
faf index score    # Score-related items
faf index dna      # DNA lifecycle info
```

---

## Global Options

Available for all commands:

### `--version, -V`
Show FAF CLI version.

### `--help, -h`
Display help for command.

### `--no-color`
Disable colored output.

### `--color-scheme <scheme>`
Accessibility color schemes:
- `normal` (default)
- `deuteranopia` (red-green blindness)
- `protanopia` (red blindness)
- `tritanopia` (blue-yellow blindness)

### `--quiet, -q`
Suppress non-essential output.

### `--verbose, -v`
Show detailed output.

### `--json`
Output in JSON format (where applicable).

---

## Environment Variables

### `FAF_HOME`
Override default FAF directory.
```bash
export FAF_HOME=/custom/path
```

### `FAF_NO_COLOR`
Disable colors globally.
```bash
export FAF_NO_COLOR=1
```

### `FAF_DEBUG`
Enable debug output.
```bash
export FAF_DEBUG=1
```

### `FAF_API_KEY`
Future: API key for cloud features.
```bash
export FAF_API_KEY=faf_live_xxxxx
```

---

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Misuse of command
- `3` - .faf file not found
- `4` - Score below threshold
- `5` - Validation failure
- `6` - Network error
- `7` - Authentication failure

---

## Configuration Files

### `.fafignore`
Exclude patterns from context:
```gitignore
node_modules/
*.log
.env
secrets/
```

### `.fafrc`
Local configuration:
```json
{
  "autoSync": true,
  "minScore": 70,
  "colorScheme": "normal",
  "backupEnabled": true
}
```

---

## Examples

### Complete Workflow
```bash
# Setup
faf init
faf score --details

# Improve
faf enhance --aggressive
faf sync

# Track
faf dna
faf update
faf log --milestones

# Share
faf share > context.md
git add .faf context.md
git commit -m "Context update: 85%"

# Maintain
faf status
faf trust --detailed
faf recover --check
```

### CI/CD Integration
```yaml
# .github/workflows/faf.yml
- run: |
    npm install -g @faf/cli
    faf score --min 70
    faf validate
    faf trust --guarantee
```

### Team Collaboration
```bash
# Morning sync
git pull
faf sync
faf score

# Before PR
faf update
faf score --min 70
git push

# Review
faf log --analytics
faf trust --detailed
```

---

**Need more help?**
- Run: `faf help <command>`
- Visit: https://faf.dev/docs
- Join: https://discord.gg/faf