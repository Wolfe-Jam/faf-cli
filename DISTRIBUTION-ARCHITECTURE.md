# .faf Distribution Architecture - Best Practices

## Component Distribution

### 1. npm Package (@faf/cli)
**Status:** Can be PUBLIC or PRIVATE
**Current:** PUBLIC is fine - it's just a binary
**Contains:** Compiled CLI only (no source)
**Best Practice:** PUBLIC - drives adoption
```bash
npm install -g @faf/cli  # This is fine to be public
```

### 2. GitHub Repos

#### PUBLIC: github.com/Wolfe-Jam/faf
**Purpose:** The FORMAT specification
**Contains:**
- README.md (format focused)
- SPECIFICATION.md
- PRESS-RELEASE.md
- examples/
- .faf (meta!)
- LICENSE (MIT)

#### PRIVATE: faf-cli (source code)
**Purpose:** Your implementation
**Contains:**
- Source code
- Business docs
- MCP integration
- Pricing strategy

### 3. MCP (Model Context Protocol)
**Status:** Part of PRIVATE implementation
**Future:** Could release as separate PUBLIC package
```
@faf/mcp-server  # Future public package
```

### 4. Website (faf.one)
**Purpose:** Landing page & documentation
**Should contain:**
- FORMAT specification ✅
- Installation instructions ✅
- Press releases ✅
- Link to GitHub (PUBLIC repo) ✅
- npm install command ✅

## Best Practice Distribution

### Single Source of Truth Approach:

```
   faf.one (Website)
        |
        ├── Specification → GitHub/Wolfe-Jam/faf
        ├── Install → npm (@faf/cli)
        └── Docs → GitHub/Wolfe-Jam/faf/docs
```

### Download/Install Links:

**BEST PRACTICE: Multiple Clear Paths**

1. **Website (faf.one)**:
```markdown
## Install

### npm (Recommended)
```bash
npm install -g @faf/cli
```

### View Specification
[GitHub: Wolfe-Jam/faf](https://github.com/Wolfe-Jam/faf)
```

2. **GitHub README**:
```markdown
## Quick Start

1. Install CLI: `npm install -g @faf/cli`
2. Initialize: `faf init`
3. View docs: https://faf.one
```

3. **npm Page**:
```markdown
Format specification: https://github.com/Wolfe-Jam/faf
Documentation: https://faf.one
```

## What Goes Where

### faf.one Website:
✅ Format specification
✅ Press releases (both)
✅ Installation guide
✅ Quick start
✅ Link to GitHub
❌ Source code
❌ Pricing (unless ready)

### GitHub PUBLIC (Wolfe-Jam/faf):
✅ SPECIFICATION.md
✅ Academic press release
✅ Examples
✅ LICENSE
❌ CLI source
❌ Business docs

### npm Package:
✅ Compiled CLI
✅ README with links
✅ Basic usage
❌ Source code
❌ Internal docs

## The Flow:

```
User discovers .faf
        ↓
   Visit faf.one
        ↓
   Three options:
   1. npm install (quick start)
   2. GitHub (specification)
   3. Read docs (on site)
        ↓
   Install & use
```

## MCP Strategy:

**Current:** Part of CLI (hidden)
**Future Option 1:** Separate PUBLIC package
**Future Option 2:** Premium feature
**Best:** Keep in CLI for now, separate later

## Critical Points:

1. **npm PUBLIC is OK** - It's just the binary
2. **GitHub faf = PUBLIC** - The format spec
3. **GitHub faf-cli = PRIVATE** - Your secret sauce
4. **faf.one** - Central hub linking everything
5. **MCP** - Include in CLI now, separate later

## Action Items:

1. ✅ Keep npm package PUBLIC
2. ✅ Push spec to GitHub/Wolfe-Jam/faf
3. ✅ Update faf.one with everything
4. ✅ Keep source PRIVATE
5. ✅ Include MCP in CLI for now