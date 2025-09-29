# 85% LICENSE SYSTEM - Quick Implementation Guide

## What This Is
A simple score capping system that limits free users to 85% while showing them what they're missing. Takes 5 minutes to implement.

## The Code (32 lines total)

### 1. Add Score Capping (in `src/commands/score.ts`)

Find where the score is calculated (around line 90), and add this BEFORE displaying the score:

```typescript
// SUPER SIMPLE LICENSE CAPPING - Just works!
const scoreCap = process.env.FAF_SCORE_CAP || process.env.FAF_FREE_LIMIT || '100';
const capValue = parseInt(scoreCap);
let originalScore = percentage;

if (percentage > capValue) {
  percentage = capValue;
  console.log(chalk.yellow(`\n⚠️  Score capped at ${capValue}% (license limit)`));
  console.log(chalk.gray(`   Actual score: ${originalScore}%`));
  console.log(chalk.cyan(`   💡 Upgrade to unlock full scoring: FAF_SCORE_CAP=100 faf score\n`));
}
```

### 2. Add License Info Command (in `src/cli.ts`)

Add this before `program.parse()`:

```typescript
program
  .command('license')
  .description('🔑 Show license information')
  .action(() => {
    const cap = process.env.FAF_SCORE_CAP || process.env.FAF_FREE_LIMIT || '100';
    const tier = cap === '100' ? 'UNLIMITED' :
                  cap >= '95' ? 'PROFESSIONAL' :
                  cap >= '90' ? 'DEVELOPER' :
                  cap >= '85' ? 'FREE' : 'RESTRICTED';

    console.log(chalk.cyan('\n🔑 FAF License Information\n'));
    console.log(`Tier: ${chalk.bold(tier)}`);
    console.log(`Score Cap: ${chalk.yellow(cap + '%')}`);

    if (cap !== '100') {
      console.log(chalk.gray(`\n💡 To change limit:`));
      console.log(chalk.gray(`   FAF_SCORE_CAP=100 faf score    # Full scoring`));
      console.log(chalk.gray(`   FAF_SCORE_CAP=85 faf score     # Free tier`));
      console.log(chalk.gray(`   FAF_FREE_LIMIT=90 faf score    # Custom limit`));
    }

    console.log(chalk.gray(`\n📊 Current settings via environment variable`));
  });
```

## How to Use It

### Default Behavior (No Change for Existing Users)
```bash
faf score  # Works normally, can score 100%
```

### Enable 85% Cap (Free Tier)
```bash
FAF_SCORE_CAP=85 faf score
```

User sees:
```
⚠️  Score capped at 85% (license limit)
   Actual score: 92%
   💡 Upgrade to unlock full scoring: FAF_SCORE_CAP=100 faf score

🏆 Score: 85%
```

### Other Tiers
```bash
FAF_SCORE_CAP=90 faf score   # Developer tier
FAF_SCORE_CAP=95 faf score   # Professional tier
FAF_SCORE_CAP=100 faf score  # Unlimited (same as default)
```

### Check License Status
```bash
faf license

🔑 FAF License Information

Tier: FREE
Score Cap: 85%

💡 To change limit:
   FAF_SCORE_CAP=100 faf score    # Full scoring
   FAF_SCORE_CAP=85 faf score     # Free tier
   FAF_FREE_LIMIT=90 faf score    # Custom limit
```

## Testing Different Caps

### A/B Testing
```bash
# Group A - More restrictive
FAF_SCORE_CAP=75 faf score

# Group B - Standard free
FAF_SCORE_CAP=85 faf score

# Group C - Generous
FAF_SCORE_CAP=90 faf score
```

### Per-User Testing
```bash
# For Kay (your success story)
FAF_SCORE_CAP=85 faf score

# For enterprise trials
FAF_SCORE_CAP=95 faf score

# For paying customers
faf score  # No cap
```

## Making It Permanent

### Option 1: User's Shell Config
```bash
# In ~/.bashrc or ~/.zshrc
export FAF_SCORE_CAP=85
```

### Option 2: Project Level
```bash
# In project .env
FAF_SCORE_CAP=85
```

### Option 3: System Wide
```bash
# In /etc/environment
FAF_SCORE_CAP=85
```

## Why 85%?

- **High enough** to be genuinely useful
- **Low enough** to create desire for 100%
- **The hook point** - users are invested
- **The tease** - "You're so close to perfect!"

## Rollout Strategy

### Phase 1: Soft Launch
- Don't set any default caps
- Only use for specific testing
- Existing users unaffected

### Phase 2: New Users Only
- New installs get `FAF_SCORE_CAP=85` by default
- Existing users stay at 100%

### Phase 3: Gradual Migration
- Add gentle prompts about "pro features"
- Show what 100% would give them

### Phase 4: Full Implementation
- Everyone on tier system
- Proper license keys
- Persistent licenses

## The Psychology

When users see:
```
⚠️  Score capped at 85% (license limit)
   Actual score: 92%
```

They think:
- "I'm so close!"
- "What am I missing?"
- "How do I get 100%?"

That's the moment they consider upgrading.

## Files Modified

Just 2 files:
1. `src/commands/score.ts` - Add capping logic (10 lines)
2. `src/cli.ts` - Add license command (22 lines)

Total: **32 lines of code**

## Benefits

✅ **Non-breaking** - Default is no cap
✅ **Testable** - Just set env var
✅ **Reversible** - Just remove env var
✅ **Simple** - No complex systems
✅ **Effective** - Creates upgrade desire

## Quick Test

```bash
# 1. See current score
faf score

# 2. Test with cap
FAF_SCORE_CAP=85 faf score

# 3. Check license
faf license

# 4. Remove cap
unset FAF_SCORE_CAP
faf score
```

---

**That's it!** 32 lines of code to create a complete license tier system. Ship it, test it, learn from it. If it works, evolve it. If not, remove it.

**The best features are simple features.** 🎯