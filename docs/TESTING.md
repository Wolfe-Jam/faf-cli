# Testing — Boris-Flow Integration Tests

**Boris-Flow** is a 12-test validation suite that ensures faf-cli is demo-ready and safe to publish.

Named after Boris (Claude Code creator at Anthropic), these tests validate:
- Version detection works correctly
- Type and language detection (CLI, TypeScript, etc.)
- Claude Code structure detection (agents, skills, commands)
- Score progression: init → auto → 100%
- Non-TTY safety (no crashes when stdin is piped)

## When to run

| Scenario | Command |
|----------|---------|
| **Before `faf init`** (on your project) | `./tests/boris-flow.test.sh` validates faf-cli works |
| **After major changes** to your `.faf` | Re-run to ensure structure is valid |
| **Before publishing** faf-cli updates | Required - ensures no regressions |
| **Before WJTTC certification** | Validates `.faf` file for Tier 8 |
| **Team onboarding** | Proves faf-cli installation works |

## Run Boris-Flow

```bash
# Clone faf-cli repository
git clone https://github.com/Wolfe-Jam/faf-cli
cd faf-cli

# Run integration tests
./tests/boris-flow.test.sh

# Expected output:
# 🏆 BORIS-FLOW: ALL 12 TESTS PASSED
# ✅ Demo ready
# ✅ Safe to publish
#    Final score: 100%
```

## What it tests

```bash
✅ faf --version
✅ Created Claude Code 2.1.0 structure
✅ faf init created project.faf
✅ Detected CLI type
✅ Language detected (TypeScript)
✅ claude_code section exists
✅ Claude Code detected: true
✅ Subagents detected (2+)
✅ Skills detected (1+)
✅ Commands detected (1+)
✅ faf auto maintained score
✅ human-set commands succeeded
✅ Final score is 100%
```

Boris-Flow validates the FAF file structure that WJTTC Tier 8 tests. Running it before certification helps ensure you'll pass Tier 8.
