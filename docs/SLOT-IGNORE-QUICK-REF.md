# Slot-Ignore Quick Reference

## TL;DR

**Slot-ignore** = Like `.gitignore` for context slots

Set slots to `'None'` when they don't apply to your project type.

## The Formula

```
Score = (Filled + Ignored) / 21 * 100

Example:
  15 filled + 6 ignored = 21/21 = 100% ✅
```

## Common Patterns

### CLI Tools
```yaml
stack:
  db: None           # No data storage
  css: None      # No web UI
  framework: None           # No client-side framework
```

### Backend APIs
```yaml
stack:
  css: None      # No framework
  framework: None           # No UI framework
  ui_library: None         # No UI components
```

### Static Sites
```yaml
stack:
  backend: None            # No server code
  db: None           # No data storage
  api: None           # No API
```

### Libraries/SDKs
```yaml
stack:
  hosting: None            # Not deployed
  db: None           # No runtime storage
  cicd: None               # Consumer handles CI
```

## Quick Check

| Value | Status | Score Impact |
|-------|--------|--------------|
| `PostgreSQL` | ✅ Filled | Counts toward score |
| `None` | ✅ Ignored | Counts toward score |
| `(undefined)` | ❌ Missing | Doesn't count |

## Implementation

```typescript
// Set slot-ignore
contextSlotsFilled['db'] = 'None';

// Check slot-ignore
if (!db && db !== 'None') {
  missingSlots.push('Database');  // Only if NOT ignored
}
```

## Full Documentation

See [SLOT-IGNORE.md](./SLOT-IGNORE.md) for complete specification.

---

**Remember:** Ignored ≠ Missing. Ignored = "Doesn't apply, and that's correct." 🏎️
