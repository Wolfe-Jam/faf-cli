# 🏁 @faf/core Extraction Plan
**.faf Format Core Package**

## 🎯 Goal
Extract pure .faf logic into a clean package. YAML is the native language of .faf - like HTML to web pages.

## 📦 Architecture

```
@faf/core (YAML is the format, not a dependency)
    ├── /parsers
    │   ├── faf-parser.ts         # YAML → FafData
    │   ├── faf-validator.ts      # Schema validation
    │   └── fafignore-parser.ts   # .fafignore handling
    ├── /generators
    │   ├── faf-generator.ts      # FafData → YAML
    │   └── context-builder.ts    # Project → Context
    ├── /scoring
    │   ├── score-calculator.ts   # Calculate scores
    │   └── score-rules.ts        # Scoring criteria
    ├── /converters
    │   ├── to-markdown.ts        # .faf → .md
    │   ├── to-claude.ts          # .faf → CLAUDE.md
    │   └── to-json.ts            # .faf → JSON
    └── /types
        └── faf-types.ts          # Core type definitions

faf-cli (current package)
    ├── Uses: @faf/core
    ├── Adds: commander, inquirer, chalk
    └── Provides: CLI interface

@faf/mcp-server
    ├── Uses: @faf/core
    ├── No CLI dependencies
    └── Provides: MCP interface
```

## 📋 Extraction Steps

### Phase 1: Core Identification (1 hour)
1. **Identify pure functions** (no file I/O, no console.log)
   - [ ] Score calculation logic
   - [ ] YAML parsing/generation
   - [ ] Format validation
   - [ ] Type definitions

2. **Mark CLI-specific code**
   - [ ] Console output (chalk, console.log)
   - [ ] File system operations (fs, glob)
   - [ ] User interaction (inquirer)
   - [ ] Command parsing (commander)

### Phase 2: Package Setup (30 min)
```bash
mkdir packages/core
cd packages/core
npm init -y
```

```json
{
  "name": "@faf/core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "yaml": "^2.4.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### Phase 3: Core Extraction (2-3 hours)

#### Move These Files (pure logic):
```typescript
// packages/core/src/types/index.ts
export interface FafData {
  version: string;
  project: ProjectInfo;
  instant_context?: InstantContext;
  key_files?: KeyFile[];
  faf_score?: number;
}

// packages/core/src/parser/index.ts
export function parseFaf(content: string): FafData {
  // Pure YAML parsing, no file I/O
}

// packages/core/src/generator/index.ts
export function generateFaf(data: FafData): string {
  // Pure YAML generation
}

// packages/core/src/scoring/index.ts
export function calculateScore(data: FafData): number {
  // Pure calculation, no console output
}
```

#### Adapt These Files (remove dependencies):
- `score-calculator.ts` → Remove chalk, console.log
- `faf-schema.ts` → Extract pure validation
- `yaml-generator.ts` → Remove file operations
- `faf-converters.ts` → Keep pure conversion logic

### Phase 4: Interface Layer (1 hour)

Create adapters in CLI to use core:

```typescript
// cli/src/adapters/core-adapter.ts
import { parseFaf, generateFaf, calculateScore } from '@faf/core';
import chalk from 'chalk';
import * as fs from 'fs/promises';

export async function readAndParseFaf(path: string) {
  const content = await fs.readFile(path, 'utf-8');
  return parseFaf(content);
}

export function displayScore(score: number) {
  console.log(chalk.green(`Score: ${score}%`));
}
```

### Phase 5: Testing Strategy (1-2 hours)

## 🧪 Test Areas

### 1. **Unit Tests - Core Package**
```typescript
// packages/core/tests/parser.test.ts
describe('@faf/core parser', () => {
  it('parses valid .faf content', () => {
    const yaml = `version: 2.0.0\nproject:\n  name: test`;
    const result = parseFaf(yaml);
    expect(result.project.name).toBe('test');
  });

  it('handles malformed YAML', () => {
    expect(() => parseFaf('invalid::yaml')).toThrow();
  });
});

// packages/core/tests/scoring.test.ts
describe('@faf/core scoring', () => {
  it('calculates score correctly', () => {
    const data = { version: '2.0.0', project: { name: 'test' }};
    expect(calculateScore(data)).toBeLessThan(100);
  });
});
```

### 2. **Integration Tests - CLI**
```bash
# Test that CLI still works with new core
npm test

# Specific areas to test:
- faf init (uses generator)
- faf score (uses calculator)
- faf validate (uses parser)
- faf convert (uses converters)
```

### 3. **Regression Tests - Critical Paths**
```typescript
// High-risk areas needing careful testing:
- [ ] Edge case file finding (must stay in CLI, not core)
- [ ] Score calculation accuracy
- [ ] YAML generation format
- [ ] Error handling and messages
- [ ] Performance (should be faster without deps)
```

### 4. **MCP Integration Test**
```typescript
// Test MCP can use core without CLI
import { parseFaf, generateFaf } from '@faf/core';

// Should work without any CLI dependencies
const fafData = parseFaf(content);
const score = calculateScore(fafData);
```

## 🚨 Risk Areas

### High Risk (needs extensive testing):
1. **Score calculation** - Business critical
2. **YAML parsing** - Format compatibility
3. **Type exports** - Breaking changes

### Medium Risk:
1. **File operations** - Must stay in CLI
2. **Error messages** - User experience
3. **Path resolution** - Platform differences

### Low Risk:
1. **Pure converters** - Simple transformations
2. **Type definitions** - Just interfaces

## 📊 Success Metrics

- [ ] @faf/core uses only YAML (the .faf language)
- [ ] All existing CLI tests pass
- [ ] MCP can import and use core
- [ ] Bundle size reduced by 30%+
- [ ] No breaking changes to CLI API
- [ ] TypeScript strict mode compliance

## 🏁 Rollback Plan

If extraction fails:
1. Keep current monolithic structure
2. Create thin MCP adapter that imports needed functions
3. Accept duplicate code temporarily
4. Revisit after v3.0.0

## 📅 Timeline

- **Hour 1**: Identify and categorize code
- **Hour 2-3**: Set up @faf/core package
- **Hour 4-5**: Extract pure functions
- **Hour 6**: Create adapters
- **Hour 7-8**: Test everything
- **Hour 9**: Documentation
- **Hour 10**: Publish @faf/core v1.0.0

## 🎯 Definition of Done

- [ ] @faf/core published to npm
- [ ] CLI updated to use @faf/core
- [ ] All tests passing
- [ ] MCP server can import @faf/core
- [ ] Clean extraction achieved (YAML only)
- [ ] Performance baseline maintained

---

**Expected package.json after extraction:**

```json
// @faf/core
{
  "name": "@faf/core",
  "version": "1.0.0",
  "dependencies": {
    "yaml": "^2.4.1"  // The .faf language
  }
}

// faf-cli
{
  "name": "faf-cli",
  "version": "2.2.0",
  "dependencies": {
    "@faf/core": "^1.0.0",
    "chalk": "^4.1.2",
    "commander": "^9.5.0",
    "glob": "^11.0.3",
    "inquirer": "^12.9.4"
  }
}

// @faf/mcp-server
{
  "name": "@faf/mcp-server",
  "version": "1.0.0",
  "dependencies": {
    "@faf/core": "^1.0.0"
  }
}
```

This achieves our goal: MCP gets .faf logic without CLI baggage! 🏁