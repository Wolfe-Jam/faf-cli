# TAF Core Library - MCP-Portable Functions

**100% Pure, Zero Dependencies (except yaml)**

This directory contains the core .taf functionality built with MCP extraction in mind.

## Architecture Philosophy

### MCP-First Design
Every function in this directory is:
- ✅ **Pure**: No side effects, testable, predictable
- ✅ **Portable**: No CLI-specific dependencies
- ✅ **Typed**: Strict TypeScript types
- ✅ **Documented**: Clear JSDoc comments
- ✅ **Ready**: Can copy/paste directly to MCP server

### Extraction Path

```
/src/taf/                    →  claude-faf-mcp/src/taf/
├── types.ts                 →  (copy as-is)
├── parser.ts                →  (copy as-is)
├── validator.ts             →  (copy as-is)
├── stats.ts                 →  (copy as-is)
└── logger.ts                →  (copy as-is)
```

Or:

```
/src/taf/  →  claude-taf-mcp/src/core/
```

## Modules

### `types.ts`
Core type definitions for .taf format

**Exports:**
- `TAFFile` - Complete .taf file structure
- `TestRun` - Single test run entry
- `TAFStats` - Statistics calculation result
- `TAFValidationResult` - Validation output
- `TAFScoreContribution` - Scoring for .faf integration

### `parser.ts`
YAML parsing and serialization

**Functions:**
- `parseTAF(content: string): TAFFile` - Parse YAML to object
- `serializeTAF(taf: TAFFile): string` - Object to YAML
- `createTAF(project, options): TAFFile` - New .taf file
- `formatTAF(content): string` - Add comments/structure

**MCP Usage:**
```typescript
// Read .taf file via stdio
const content = await fs.readFile('.taf', 'utf-8');
const taf = parseTAF(content);
```

### `validator.ts`
Format validation and checking

**Functions:**
- `validateTAF(taf): TAFValidationResult` - Full validation
- `isTAFValid(taf): boolean` - Quick check

**MCP Usage:**
```typescript
// Validate before processing
if (!isTAFValid(taf)) {
  return { error: 'Invalid .taf file' };
}
```

### `stats.ts`
Statistics and scoring calculations

**Functions:**
- `calculateStats(taf): TAFStats` - Pass rate, streaks, health
- `calculateScoreContribution(taf): TAFScoreContribution` - +15 points logic
- `getPassRateTrend(taf): string` - improving/declining/stable
- `getFailurePatterns(taf)` - WJTTC analysis data

**MCP Usage:**
```typescript
// Get stats for AI response
const stats = calculateStats(taf);
return {
  passRate: stats.pass_rate,
  healthScore: stats.health_score,
  currentStreak: stats.current_streak
};
```

### `logger.ts`
Test run appending and management

**Functions:**
- `appendTestRun(taf, run): TAFFile` - Add entry (immutable)
- `createMinimalRun(options): TestRun` - 5-10 line entry
- `createDetailedRun(options): TestRun` - 50-60 line entry
- `detectResult(current, previous): TestResult` - PASSED/FAILED/IMPROVED
- `calculateRecovery(current, previous): TestRun` - Time to fix
- `getRecentRuns(taf, count): TestRun[]` - Last N runs
- `updateFAFIntegration(taf, options): TAFFile` - Update .faf references

**MCP Usage:**
```typescript
// Append test run via MCP tool
const run = createMinimalRun({
  result: 'PASSED',
  total: 173,
  passed: 173,
  failed: 0
});
const updatedTAF = appendTestRun(taf, run);
await fs.writeFile('.taf', serializeTAF(updatedTAF));
```

## CLI Commands (Current)

These commands use the TAF core:

```bash
faf taf init       # createTAF() + serializeTAF()
faf taf log        # appendTestRun() + file write
faf taf validate   # validateTAF() + display results
faf taf stats      # calculateStats() + display
```

## MCP Tools (Future)

### claude-faf-mcp additions:
```typescript
{
  name: "taf_get_stats",
  description: "Get testing statistics from .taf file",
  inputSchema: { type: "object", properties: {} }
}

{
  name: "taf_validate",
  description: "Validate .taf file format",
  inputSchema: { type: "object", properties: {} }
}

{
  name: "taf_calculate_score",
  description: "Calculate .taf contribution to .faf score",
  inputSchema: { type: "object", properties: {} }
}
```

### claude-taf-mcp (standalone):
```typescript
{
  name: "taf_init",
  name: "taf_log_test_run",
  name: "taf_get_recent_runs",
  name: "taf_get_failure_patterns",
  name: "taf_calculate_recovery_time"
}
```

## Zero Dependencies

The only external dependency is `yaml` for parsing. Everything else is pure TypeScript.

**Why this matters for MCP:**
- Smaller bundle size
- Faster startup
- Fewer security concerns
- Easier to audit
- Can be extracted anywhere

## Testing

All functions are pure and easily testable:

```typescript
import { calculateStats, createTAF } from './taf';

test('calculateStats returns correct pass rate', () => {
  const taf = createTAF('test-project');
  taf.test_history = [
    createMinimalRun({ result: 'PASSED', total: 10, passed: 10, failed: 0 }),
    createMinimalRun({ result: 'FAILED', total: 10, passed: 5, failed: 5 }),
  ];

  const stats = calculateStats(taf);
  expect(stats.pass_rate).toBe('50%');
});
```

## Git-Friendly

All functions support Git-friendly .taf format:
- Append-only history (no rewriting)
- Chronological timestamps
- Human-readable YAML
- Minimal diffs per change

## Next Steps

1. ✅ TAF core library created (MCP-portable)
2. ⏳ CLI commands using TAF core
3. ⏳ Add to claude-faf-mcp
4. ⏳ Extract to claude-taf-mcp

---

**Built: 2025-10-27 (.taf Monday)**
**Purpose: Own Testing like we own Context**
**Strategy: CLI → MCP Pipeline**
