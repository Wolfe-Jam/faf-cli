# Slot-Ignore Specification

## Overview

**Slot-ignore** is the mechanism for handling slots that don't apply to certain project types. Like `.gitignore` for files and `.fafignore` for scanning, **slot-ignore** tells the scoring system: "This slot exists, but it's not applicable to this project type."

## The Problem It Solves

**Without slot-ignore:**
- CLI tool with no db → "Database missing" → Low score ❌
- Static site with no backend → "Backend missing" → Low score ❌
- Library with no hosting → "Hosting missing" → Low score ❌

**With slot-ignore:**
- CLI tool with `db: None` → Database ignored → Not counted as missing ✅
- Static site with `backend: None` → Backend ignored → Not counted as missing ✅
- Library with `hosting: None` → Hosting ignored → Not counted as missing ✅

## The 21-Slot System

```
Total Slots: 21 (always constant)
├── Filled: X (has real values)
├── Ignored: Y (set to 'None' - not applicable)
└── Missing: Z (undefined/null - needs attention)

Score = (Filled + Ignored) / 21 * 100
```

## Slot-Ignore Value

**Standard value:** `'None'`

**Other accepted values:** `'Unknown'`, `'Not specified'`, `'N/A'`

**Example:**
```yaml
stack:
  db: None           # ✅ Ignored (CLI doesn't need db)
  css: None      # ✅ Ignored (CLI doesn't have CSS)
  backend: PostgreSQL      # ✅ Filled (has value)
  hosting: (undefined)     # ❌ Missing (not set)
```

## Slot-Ignore Rules by Project Type

### CLI Tools (Node.js, Rust, Go, Python CLI)

**Ignored slots:**
- `db` - CLI tools don't typically need databases
- `css` - No web UI
- `framework` - No web UI

**Example:**
```yaml
project:
  type: cli-ts
stack:
  db: None
  css: None
  framework: None
```

### Static Sites (HTML, Gatsby, Hugo)

**Ignored slots:**
- `backend` - No server-side code
- `db` - No data storage
- `api` - No API

**Example:**
```yaml
project:
  type: static-html
stack:
  backend: None
  db: None
  api: None
```

### Backend APIs (REST, GraphQL, gRPC)

**Ignored slots:**
- `css` - No framework UI
- `framework` - No client-side framework
- `ui_library` - No UI components

**Example:**
```yaml
project:
  type: api-server
stack:
  css: None
  framework: None
  ui_library: None
```

### Libraries/SDKs (npm, PyPI, crates.io)

**Ignored slots:**
- `hosting` - Libraries aren't deployed
- `cicd` - Often handled by consumers
- `db` - Libraries don't run databases

**Example:**
```yaml
project:
  type: library
stack:
  hosting: None
  cicd: None
  db: None
```

### Full-Stack Web Apps (React, Vue, Svelte + Backend)

**Ignored slots:**
- None - Full-stack apps use all slots

**Example:**
```yaml
project:
  type: web-app
stack:
  framework: React
  backend: Node.js
  db: PostgreSQL
  # All 21 slots typically filled
```

## Implementation

### Generator (Sets slot-ignore values)

```typescript
// For CLI projects
if (isNodeCLI || isRustCLI) {
  contextSlotsFilled['db'] = 'None';
  contextSlotsFilled['css'] = 'None';
  contextSlotsFilled['framework'] = 'None';
}
```

### YAML Generator (Excludes from missing_context)

```typescript
// Only mark as missing if NOT set to 'None'
if (!projectData.db && projectData.db !== 'None') {
  missingSlots.push('Database');
}
```

### Compiler (Optimization pass)

```typescript
// Removes 'None' values during compilation/optimization
const defaults = ['None', 'Unknown', 'Not specified', 'N/A'];
if (defaults.includes(value)) {
  delete obj[key];  // Optimization for cleaner output
}
```

## Scoring Examples

### Example 1: CLI Tool (11 filled, 10 ignored)

```yaml
# Technical Slots (15)
project.name: faf-cli               # ✅ Filled
project.goal: AI context standard   # ✅ Filled
main_language: TypeScript           # ✅ Filled
framework: CLI                      # ✅ Filled
css: None                 # ✅ Ignored
ui_library: inquirer                # ✅ Filled
backend: Node.js                    # ✅ Filled
runtime: Node.js                    # ✅ Filled
db: None                      # ✅ Ignored
api: CLI                       # ✅ Filled
hosting: npm registry               # ✅ Filled
cicd: GitHub Actions                # ✅ Filled
build_tool: TypeScript (tsc)        # ✅ Filled
pkg_manager: npm                # ✅ Filled
version: 4.2.1                      # ✅ Filled

# Human Context (6)
who: wolfejam.dev team              # ✅ Filled
what: AI context standard           # ✅ Filled
why: Enable persistent context      # ✅ Filled
where: npm registry + GitHub        # ✅ Filled
when: Production/Stable             # ✅ Filled
how: Test-driven development        # ✅ Filled

# Score Calculation
Filled: 19/21
Ignored: 2/21 (css, db)
Missing: 0/21

Score: (19 + 2) / 21 = 100%
```

### Example 2: Web App (21 filled, 0 ignored)

```yaml
# All 21 slots have real values
db: PostgreSQL                # ✅ Filled
css: Tailwind             # ✅ Filled
framework: React                     # ✅ Filled
# ... all other slots filled

Score: 21/21 = 100%
```

### Example 3: Incomplete Project (10 filled, 2 ignored, 9 missing)

```yaml
# Some slots filled
project.name: my-app                # ✅ Filled
main_language: JavaScript           # ✅ Filled
# ... 8 more filled

# Some slots ignored
db: None                      # ✅ Ignored
css: None                 # ✅ Ignored

# Some slots missing
backend: (undefined)                # ❌ Missing
hosting: (undefined)                # ❌ Missing
# ... 7 more missing

Score: (10 + 2) / 21 = 57%
```

## Best Practices

### DO:
✅ Set slots to `'None'` when they don't apply to your project type
✅ Use slot-ignore to achieve 100% on appropriate projects
✅ Document WHY a slot is ignored (e.g., "CLI tool doesn't need CSS")

### DON'T:
❌ Use `'None'` to hide missing information
❌ Ignore slots that DO apply (e.g., don't ignore `db` if you use one)
❌ Mix `null`, `undefined`, and `'None'` - use `'None'` consistently

## Slot-Ignore vs. Missing

| State | Value | Meaning | Counts Toward Score |
|-------|-------|---------|---------------------|
| **Filled** | `PostgreSQL` | Has a real value | ✅ Yes |
| **Ignored** | `None` | Doesn't apply to this project | ✅ Yes |
| **Missing** | `undefined` | Unknown/not set | ❌ No |

## Future Enhancements

### Explicit `.slotignore` File (Optional)

```yaml
# .slotignore - Explicitly declare ignored slots
- db       # CLI tool doesn't need db
- css  # No framework styling
- framework       # No web UI

# Auto-applied based on project.type
auto_detect: true
```

### Smart Detection (Current Approach)

The generator automatically detects project type and applies slot-ignore rules:

```typescript
// Auto-detect CLI → ignore db/css/framework
if (isNodeCLI) {
  applySlotIgnore(['db', 'css', 'framework']);
}
```

## Reference

- **Design Philosophy:** Like `.gitignore` for files, slot-ignore for context slots
- **Standard Value:** `'None'`
- **Total Slots:** 21 (always constant)
- **Score Formula:** `(Filled + Ignored) / 21 * 100`

---

**Slot-ignore: The perfect way to handle app-types.** 🏎️

*Last Updated: 2026-02-08*
*FAF Version: 4.2.1+*
