---
description: Publish protocol faf-cli (FULL - no shortcuts)
---

# /pubpro - FAF-CLI Publish Protocol

**ZERO MISTAKES. NO SHORTCUTS.**

## Pre-Publish Checklist

### 1. Clean Build
```bash
npm run clean && npm run build
```

### 2. Full Test Suite
```bash
npm test
```
Must pass ALL tests (not just Boris-Flow).

### 3. Boris-Flow Integration
```bash
./tests/boris-flow.test.sh
```
Must show: `BORIS-FLOW: ALL 12 TESTS PASSED`

### 4. FAF Score
```bash
node dist/cli.js score
```
Must be 99%+ (Gold Code).

### 5. Version Check
```bash
npm run version:truth
```
Show current vs published version.

### 6. Dry Run
```bash
npm publish --dry-run
```
Review package contents before real publish.

### 7. Documentation Updates (REQUIRED)

**CHANGELOG.md:**
- Add new version section at top
- Document all changes (Added, Fixed, Changed)

**README.md:**
- Add "What's New in vX.X.X" section
- User-facing benefits (NOT technical details)

**faf-expert SKILL.md** (if CLI version changed):
- Update version in `~/.claude/skills/faf-expert/SKILL.md` line 253

### 8. Git Commit
```bash
git add CHANGELOG.md README.md package.json
git commit -m "docs: Update for vX.X.X release"
```

### 9. Version Bump
Ask user: patch, minor, or major?
```bash
npm version <type>
```

### 10. Final Build
```bash
npm run build
```

### 11. Summary & Approval
Show checklist results:
```
✅ Tests: XXX/XXX passing
✅ Boris-Flow: 12/12
✅ Score: XX%
✅ Build: Clean
✅ README: Updated
✅ CHANGELOG: Updated
✅ Git: Clean
```

**Wait for "GO!" or "GREEN LIGHT" from wolfejam**

### 12. Publish
```bash
npm publish
```

### 13. Post-Publish (REQUIRED)

**Verify npm:**
```bash
npm view faf-cli version
```

**GitHub Release:**
```bash
VERSION=$(node -p "require('./package.json').version")
gh release create v$VERSION --title "v$VERSION" --notes "See CHANGELOG.md"
```

**Homebrew Update:**
```bash
curl -sL https://registry.npmjs.org/faf-cli/-/faf-cli-$VERSION.tgz | shasum -a 256
# Update /usr/local/Homebrew/Library/Taps/wolfe-jam/homebrew-faf/Formula/faf-cli.rb
```

**GitHub Discussions:** Draft announcement (optional for patch releases)

## Safety Gates

- STOP if ANY test fails
- STOP if score < 99%
- STOP if README/CHANGELOG not updated
- STOP without "GO!" or "GREEN LIGHT"
- NEVER force push or skip hooks

---
*Professional. Boring. Trusted.*
*ZERO MISTAKES protocol - matches PUBLISH-PROTOCOL.md*
