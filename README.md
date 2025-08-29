# 🚀 @faf/cli

**Command-line interface for .faf (Foundational AI-Context Format)**

Transform any project into perfect AI context with validation, scoring, and sync capabilities.

## 🎯 Quick Start

```bash
# Install globally
npm install -g @faf/cli

# Generate .faf file for your project
faf init

# Validate and score your .faf
faf validate
faf score --details

# Keep it synchronized
faf sync --auto
```

## 📋 Commands

### `faf init`
Generate initial .faf file from project structure
```bash
faf init                           # Auto-detect project type
faf init --template svelte         # Use specific template
faf init --force                   # Overwrite existing .faf
faf init --output my-project.faf   # Custom output path
```

### `faf validate`
Validate .faf file against schema
```bash
faf validate                    # Validate .faf in current directory
faf validate project.faf        # Validate specific file
faf validate --verbose          # Show detailed validation
faf validate --schema 2.4.0     # Validate against specific version
```

### `faf score`
Calculate completeness score (0-100%)
```bash
faf score                       # Show basic score
faf score --details             # Detailed breakdown by section
faf score --minimum 70          # Fail if score below threshold
```

### `faf sync`
Sync .faf with project changes
```bash
faf sync                        # Show detected changes
faf sync --auto                 # Auto-apply changes
faf sync --dry-run              # Preview changes only
```

### `faf audit`
Check freshness and completeness
```bash
faf audit                       # Full audit report
faf audit --warn-days 7         # Warn if older than 7 days
faf audit --error-days 30       # Error if older than 30 days
```

### `faf lint`
Format compliance checking
```bash
faf lint                        # Check for issues
faf lint --fix                  # Auto-fix formatting
faf lint --schema-version 2.4.0 # Validate against specific schema
```

## 🎯 Scoring System

The CLI uses a sophisticated scoring algorithm based on:

- **21 Context Slots**: Core sections that AI needs
- **Weighted Sections**: Some sections more important than others
- **Quality Indicators**: AI instructions, human context, freshness
- **Smart Suggestions**: Actionable improvement recommendations

### Score Ranges
- 🟢 **90-100%**: Perfect - Ready for any AI
- 🟡 **70-89%**: Good - Minor improvements possible  
- 🔴 **Below 70%**: Needs improvement for optimal AI context

## 🏗️ Project Type Detection

Automatically detects and optimizes for:

- **Svelte/SvelteKit** projects
- **React/Next.js** applications  
- **Vue/Nuxt** applications
- **Node.js APIs** and servers
- **Generic** projects with smart defaults

## 📊 What Gets Analyzed

The CLI examines your project to populate:

### From `package.json`
- Project name, description, version
- Dependencies → Tech stack detection
- Scripts → Build tools identification

### From File Structure  
- Framework detection (`.svelte`, `.jsx`, `.vue` files)
- Configuration files
- Project organization patterns

### Smart Defaults
- Current year tags
- Project type categorization  
- Open source assumptions
- AI-ready optimizations

## 🔄 Sync Intelligence

`faf sync` monitors and updates:

- Package.json changes (name, version, dependencies)
- Major framework additions/removals
- Stale timestamps (30+ days old)
- Version bumps and releases

## ⚙️ Configuration

The CLI respects `.faf` format standards:

- **Schema Version**: 2.4.0 (latest)
- **Output Format**: Clean YAML with 100-char line width
- **Validation**: Strict schema compliance
- **Timestamps**: ISO 8601 format

## 🎪 Integration Examples

### In CI/CD Pipelines
```yaml
# .github/workflows/faf-check.yml
- name: Validate .faf file
  run: |
    npx @faf/cli validate --minimum 70
    npx @faf/cli audit --error-days 30
```

### Pre-commit Hooks
```bash
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: faf-lint
        name: Lint .faf file
        entry: faf lint --fix
        language: system
```

### Package.json Scripts
```json
{
  "scripts": {
    "faf:check": "faf validate && faf score --minimum 80",
    "faf:sync": "faf sync --auto",
    "faf:audit": "faf audit"
  }
}
```

## 🚀 Programmatic Usage

```typescript
import { validateFafFile, scoreFafFile, generateFafFromProject } from '@faf/cli';

// Validate a .faf file
const validation = await validateFafFile('./project.faf');

// Calculate score
const score = await scoreFafFile('./project.faf', { details: true });

// Generate new .faf
const fafContent = await generateFafFromProject({
  projectType: 'svelte',
  projectRoot: './my-project'
});
```

## 🏎️ Performance

- **Validation**: < 50ms for typical .faf files
- **Scoring**: < 100ms with full analysis  
- **Generation**: < 200ms including file system scans
- **Zero Dependencies**: Core functionality, minimal overhead

## 🤝 Contributing

Built with TypeScript, tested with Jest, and follows the .faf specification.

```bash
git clone https://github.com/Wolfe-Jam/faf-cli
cd faf-cli
npm install
npm run dev
```

## 📄 License

MIT © 🏎️⚡️_wolfejam.dev

---

**🎯 Perfect .faf files = Perfect AI collaboration**