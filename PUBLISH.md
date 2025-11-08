# faf-cli Publish Workflow

## Complete Sequence (NO SHORTCUTS)

### 1. Pre-Publish Checklist

```bash
# Clean build
npm run build

# Fast test suite (core functionality)
npm test -- --testPathIgnorePatterns="drift|meta-test|git.test"
# Expected: 251/272 passing (92%) in ~37s

# Dry run
npm publish --dry-run
```

### 2. Update Documentation

**CHANGELOG.md:**
- Add new version section at top
- Document all changes (Added, Fixed, Changed sections)
- Use developer-focused technical details

**README.md:**
- Add "What's New in vX.X.X" section at top
- Use user-facing benefits (NOT technical details)
- README accumulates - each version adds a new layer

**package.json:**
- Bump version number

### 3. Commit Changes

```bash
git add CHANGELOG.md README.md package.json
git commit -m "chore: bump version to X.X.X

- Update CHANGELOG
- Update README What's New section"
```

### 4. Publish to npm

```bash
npm publish
```

**This publishes to npm only.** It does NOT trigger GitHub or Discord.

### 5. Create GitHub Release (TRIGGERS DISCORD)

**Option A: GitHub CLI (recommended)**
```bash
# Extract version from package.json
VERSION=$(node -p "require('./package.json').version")

# Create release with CHANGELOG notes
gh release create v$VERSION \
  --title "v$VERSION - Discord Community Launch" \
  --notes "$(sed -n '/## \['$VERSION'\]/,/## \[/p' CHANGELOG.md | head -n -2)"
```

**Option B: GitHub Web UI**
1. Go to https://github.com/Wolfe-Jam/faf-cli/releases/new
2. Tag: `v3.1.2`
3. Title: `v3.1.2 - Discord Community Launch`
4. Description: Copy from CHANGELOG.md
5. Click "Publish release"

**Creating the GitHub Release:**
- ✅ Triggers `.github/workflows/discord-release-announcement.yml`
- ✅ Posts to Discord #announcements channel
- ✅ Creates git tag
- ✅ Archives source code

### 6. Update Homebrew (if needed)

```bash
# Get SHA256 of new npm package
VERSION=$(node -p "require('./package.json').version")
curl -sL https://registry.npmjs.org/faf-cli/-/faf-cli-$VERSION.tgz | shasum -a 256

# Update SHA256 in Homebrew formula
# /usr/local/Homebrew/Library/Taps/wolfe-jam/homebrew-faf/Formula/faf-cli.rb
```

### 7. Verify

```bash
# Check npm
npm view faf-cli version

# Check GitHub release
gh release view v$VERSION

# Check Discord #announcements
# Visit: https://discord.com/channels/YOUR_SERVER_ID/YOUR_CHANNEL_ID

# Check Homebrew (after formula update)
brew info faf-cli
```

## Quick Reference

**Full automation command:**
```bash
# After npm publish succeeds
VERSION=$(node -p "require('./package.json').version") && \
gh release create v$VERSION \
  --title "v$VERSION - $(git log -1 --pretty=%B | head -1)" \
  --notes "$(sed -n '/## \['$VERSION'\]/,/## \[/p' CHANGELOG.md | head -n -2)"
```

## What Triggers What

- `npm publish` → npm package updated only
- `gh release create` → GitHub release + Discord announcement
- Homebrew formula → Manual update required

## Night Shift Testing

After Friday release, run comprehensive tests overnight:

```bash
# Full test suite with stress tests (15-20 min)
npm test
```

Expected: 327/327 tests passing after fixes.
