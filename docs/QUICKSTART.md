# 🚀 FAF Quick Start Guide

**Time to perfect AI context: 30 seconds**

## Installation (10 seconds)

```bash
npm install -g @faf/cli
```

Or use without installing:
```bash
npx @faf/cli init
```

## Your First FAF (20 seconds)

### Step 1: Initialize
```bash
cd your-project
faf init
```

**What happens:**
- Creates `.faf` file with your context
- Detects your tech stack automatically
- Generates birth certificate (FAF-2025-PROJECT-XXXX)
- Shows birth weight score (typically 5-22%)

### Step 2: Check Your Score
```bash
faf score
```

**Output:**
```
🟢 Score: 22%
   Birth Weight: 5%
   Journey: 5% → 22%

💡 Run "faf enhance" to reach 70%+
```

### Step 3: See Your Journey
```bash
faf dna
```

**Output:**
```
🧬 YOUR FAF DNA

   5% → 22%

   ☑️ Born (5%)
   ☑️ First Save (22%)
   ░░ Doubled (10%) - Available!
   ░░ Championship (70%) - Available!
   ░░ Elite (85%) - Available!
```

## 🎯 Reach Championship Level (70%+)

### Quick Wins

#### 1. Add Human Context (instant +30%)
Edit your `.faf` file:
```yaml
human_context:
  who: "Development team building SaaS platform"
  what: "Multi-tenant project management tool"
  why: "Replace expensive enterprise solutions"
  where: "Cloud-native, AWS deployment"
  when: "Q1 2025 launch"
  how: "Agile sprints, CI/CD pipeline"
```

#### 2. Enhance with AI (+20-40%)
```bash
faf enhance --aggressive
```
AI analyzes and improves your context automatically.

#### 3. Add AI Instructions (+10%)
```yaml
ai_instructions:
  priority: "Code quality over speed"
  style: "Functional programming preferred"
  testing: "TDD with 90% coverage"
```

## 🏆 Championship Commands

### Save Your Progress
```bash
faf update
```
Creates a checkpoint you can return to.

### Track Evolution
```bash
faf log --milestones
```
Shows your complete journey with achievements.

### Disaster Recovery
```bash
# Something went wrong?
faf recover --auto

# Check health
faf recover --check
```

## 🔄 Daily Workflow

### Morning
```bash
faf status        # Quick health check
faf score         # Current score
```

### After Major Changes
```bash
faf sync          # Update context
faf update        # Save checkpoint
git commit -m "Context update"
```

### Before AI Sessions
```bash
faf trust         # Check confidence
cat .faf          # Copy context for AI
```

## 💡 Pro Tips

### 1. High Birth Weight
Create `CLAUDE.md` before `faf init`:
```bash
echo "# My Project\nBuilding X with Y" > CLAUDE.md
faf init  # Birth weight: 22% instead of 5%
```

### 2. Quick Context Sharing
```bash
faf share > context.md  # Sanitized for sharing
```

### 3. CI/CD Integration
```yaml
# .github/workflows/faf.yml
- name: Check FAF Score
  run: |
    npm install -g @faf/cli
    faf score --min 70
```

### 4. Team Collaboration
```bash
# Everyone stays in sync
git pull
faf sync
faf score
```

## 🚨 Common Issues

### Low Score?
```bash
faf score --details    # See what's missing
faf enhance           # AI improvements
faf trust --detailed  # Confidence metrics
```

### Corrupted File?
```bash
faf recover --auto    # Automatic fix
# or
git checkout HEAD -- .faf
```

### Need Help?
```bash
faf help              # Command list
faf faq              # Common questions
faf index            # A-Z reference
```

## 🎉 Success Metrics

You've succeeded when:
- ✅ Score is 70%+ (Championship level)
- ✅ Journey shows growth (22% → 70%+)
- ✅ AI understands without explanation
- ✅ Context persists across sessions
- ✅ Team has shared understanding

## 📊 What's Next?

1. **Explore advanced commands:**
   - `faf formats --pyramid` - Visualize your stack
   - `faf bi-sync` - Two-way CLAUDE.md sync
   - `faf credit` - Track contributions

2. **Join the community:**
   - [Discord](https://discord.gg/faf)
   - [GitHub](https://github.com/faf/cli)
   - [Twitter](https://twitter.com/faf_dev)

3. **Read the guides:**
   - [DNA Lifecycle](./FAF-DNA-LIFECYCLE.md)
   - [Disaster Recovery](./ENTERPRISE-DISASTER-RECOVERY.md)
   - [API Architecture](./FAF-API-ARCHITECTURE.md)

---

**Remember: Stop FAFfing About. 30 seconds to perfect AI context.**

🏎️ **FAST AF** - It's not just a name, it's a promise.