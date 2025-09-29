# 🔧 FAF v2.4.4 Bug Fix Plan

## Critical Bugs to Fix (In Priority Order)

### ✅ 1. Double ASCII Art Rendering - FIXED
**Status**: ✅ COMPLETED
- Removed duplicate `generateFAFHeader()` calls from version.ts, formats.ts, init.ts
- Tested and confirmed single rendering

### 🔴 2. YAML Markdown Syntax Breaking
**Status**: IN PROGRESS
**Issue**: Markdown bold text (`**text**`) in human_context fields breaks YAML parsing
**Location**: Generated during init and enhance commands
**Fix Needed**:
- Ensure `escapeForYaml()` is called on ALL string values before writing to YAML
- The function already exists in `/src/utils/yaml-generator.ts` (line 27-46)
- Need to apply it consistently in:
  - init command generation
  - enhance command updates
  - Any place that writes human_context

### 🔴 3. Inconsistent Score Reporting
**Issue**: Different commands report different scores
**Locations**:
- `faf score` - Uses score-calculator.ts
- `faf status` - Uses different calculation
- `faf doctor` - Has its own scoring
- Footer score - Uses yet another method
**Fix Needed**:
- Create single source of truth: `/src/scoring/score-calculator.ts`
- All commands should call `calculateFafScore()` from this file
- Remove duplicate scoring logic

### 🔴 4. Enhance Command Breaks .faf File
**Issue**: Removes required `scores` section and `generated` field
**Location**: `/src/commands/enhance-real.ts`
**Fix Needed**:
- Preserve existing `scores` section
- Preserve `generated` timestamp
- Only update fields that are being enhanced

### 🔴 5. Init --force --new Re-introduces Bugs
**Issue**: Re-adds markdown syntax that breaks YAML
**Location**: `/src/commands/init.ts`
**Fix Needed**:
- Apply `escapeForYaml()` to all generated strings
- Clean up previous state properly

## Fix Implementation Order

1. **First**: Fix YAML generation to prevent markdown breaking
   - Update yaml-generator.ts to always escape strings
   - Test with init command

2. **Second**: Consolidate scoring to single source
   - Update all commands to use score-calculator.ts
   - Remove duplicate implementations

3. **Third**: Fix enhance command preservation
   - Ensure required fields are never deleted
   - Test thoroughly

4. **Fourth**: Fix init cleanup
   - Ensure --force --new properly resets
   - Apply escaping to all strings

## Testing After Fixes

```bash
# Test YAML generation
faf init --force
faf validate  # Should pass

# Test scoring consistency
faf score     # Note score
faf status    # Should match
faf doctor    # Should match

# Test enhance preservation
faf enhance
faf validate  # Should still pass

# Test double-render (already fixed)
faf version   # Single card only
```

## Release Checklist

- [ ] All YAML strings escaped properly
- [ ] Scoring consistent across commands
- [ ] Enhance preserves required fields
- [ ] Init --force works correctly
- [ ] No double ASCII rendering
- [ ] All commands tested
- [ ] Build completes cleanly
- [ ] Ready for manual npm publish

---

*Critical for 3K users - Must fix before release*