# 🏎️ Build Verification System

## Overview
Prevents stale builds from reaching npm by checking all commands are built and up-to-date before publishing.

## Quick Start

### Manual Verification
```bash
npm run verify:build
```

### Build + Verify
```bash
npm run build:verify
```

### Automatic (runs before npm publish)
```bash
npm publish  # Automatically runs prepublishOnly hook
```

## What Gets Checked

1. ✅ **Dist exists** - Verifies `dist/` directory and `dist/cli.js` exist
2. ✅ **All commands built** - Checks every registered command in `src/cli.ts` has corresponding `dist/commands/*.js`
3. ✅ **Build freshness** - Ensures dist files are newer than source files
4. ✅ **Critical imports** - Verifies essential files like native-cli-parser, colors, commander wrapper
5. ✅ **Version sync** - Reminds you to check package.json version matches last publish

## Example Output

### ✅ Success
```
🏎️  FAF Build Verification - Championship Grade
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Check 1: Verifying dist/ directory exists...
✅ dist/ directory exists

ℹ️  Check 2: Extracting registered commands from src/cli.ts...
✅ Found 35 registered commands
  • analyze
  • auto
  • bi-sync
  • chat
  • check
  ...

ℹ️  Check 3: Verifying commands exist in dist/commands/...
✅ analyze.js exists in dist/commands/
✅ auto.js exists in dist/commands/
✅ bi-sync.js exists in dist/commands/
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Build verification PASSED! ✅
✅ Safe to publish to npm
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Next steps:
  1. npm version patch  # Bump to 2.4.15
  2. npm publish        # Push to npm
  3. npm install -g faf-cli@latest  # Update global
  4. faf index          # Test it works!
```

### ❌ Failure
```
❌ Built command missing: dist/commands/index.js
❌ Source exists at: src/commands/index.ts

❌ src/commands/index.ts is newer than built version!
❌ Source modified: 2025-10-01T14:30:00.000Z
❌ Build created: 2025-10-01T12:00:00.000Z
❌ Run: npm run build

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Build verification FAILED! ❌
❌ Fix the errors above before publishing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Troubleshooting

### "dist/commands/X.js missing"
```bash
npm run build  # Rebuild everything
```

### "Source is newer than built"
```bash
npm run build  # Your source changed after last build
```

### "Critical file missing"
```bash
npm run build  # Complete rebuild needed
```

## Integration Points

### Pre-Publish Hook
Automatically runs before `npm publish`:
```json
{
  "scripts": {
    "prepublishOnly": "npm run build:verify && npm run version:truth"
  }
}
```

### CI/CD Integration
```yaml
# .github/workflows/publish.yml
- name: Verify Build
  run: npm run verify:build
  
- name: Publish
  run: npm publish
```

### Pre-Commit Hook (Optional)
```bash
# .githooks/pre-commit
#!/bin/bash
npm run verify:build || exit 1
```

## Why This Exists

**The Problem:**
- You modify source code
- Forget to rebuild
- Publish stale dist/ to npm
- Global installations use old code
- Commands mysteriously "don't work"

**The Solution:**
- Verification script catches this before publish
- Prevents routing bugs (like the `faf index` issue)
- Ensures dist/ matches source before npm

## Command Reference

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run verify:build` | Run verification only | After manual changes |
| `npm run build:verify` | Build then verify | Before committing |
| `npm publish` | Auto-verifies via hook | Publishing to npm |

## Philosophy

> "Catch stale builds before they become production bugs" - F1 Championship Engineering

This verification system follows the FAF "No Faffing About" principle - it catches the problem **before** users experience it, not after.
