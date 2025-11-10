## Description

<!-- Provide a clear and concise description of your changes -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New command (adds a new faf command)
- [ ] Command enhancement (improves existing command)
- [ ] Performance improvement
- [ ] Breaking change (fix or feature causing existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Test coverage improvement
- [ ] Code refactoring

## Related Issue

<!-- Link to the issue this PR addresses -->

Fixes #(issue number)

## Changes Made

<!-- List the specific changes in bullet points -->

- 
- 
- 

## Command Changes

<!-- If adding or modifying commands, document them -->

### New Commands

```bash
# Example usage
faf yourcommand [options]
```

### Modified Commands

- `faf existing` - Changes made

## Testing

<!-- Describe the tests you ran -->

### Test Environment

- faf-cli version:
- Node.js version:
- Operating System:
- Terminal:

### Test Steps

```bash
# Steps to test your changes
faf yourcommand
faf score
# etc.
```

### Test Results

- [ ] All existing tests pass (`npm test`)
- [ ] New tests added and passing
- [ ] Manually tested commands in terminal
- [ ] Performance verified (sub-50ms for core operations)
- [ ] Tested on multiple project types
- [ ] Terminal output looks correct

## Terminal Output

<!-- If changes affect terminal output, show examples -->

**Before**:
```
[paste old output if applicable]
```

**After**:
```
[paste new output]
```

## Performance Impact

<!-- Document performance implications -->

**Command execution time**:
```bash
time faf yourcommand
# Result: X ms
```

- [ ] No performance impact
- [ ] Performance improved (specify: %)
- [ ] Performance impact accepted (explain why):

## Breaking Changes

<!-- If this introduces breaking changes, describe them -->

- [ ] No breaking changes
- [ ] Breaking changes (describe migration path):

**Migration guide**:


## Checklist

<!-- Verify all items before submitting -->

- [ ] Code follows TypeScript strict mode
- [ ] Self-review completed
- [ ] Code commented where necessary
- [ ] Documentation updated (README, help text)
- [ ] No new warnings or errors
- [ ] Tests added for new functionality
- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] CHANGELOG.md updated
- [ ] Commit messages follow project format
- [ ] Terminal output tested and looks correct
- [ ] Command help text added/updated
- [ ] Examples provided for new commands

## Documentation Updates

<!-- Check all that apply -->

- [ ] README.md updated
- [ ] Command help text added
- [ ] Usage examples included
- [ ] CHANGELOG.md entry added
- [ ] JSDoc comments added

## Code Quality

<!-- Verify code quality standards -->

- [ ] TypeScript strict mode compliance
- [ ] No `any` types used
- [ ] Functions have explicit return types
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Path validation for file operations
- [ ] Security considerations addressed

## Terminal UI

<!-- If changes affect terminal output -->

- [ ] Uses appropriate colors (chalk)
- [ ] Box-drawing characters used correctly
- [ ] Progress indicators work
- [ ] Emojis used appropriately (🧡 preferred)
- [ ] Output is scannable and clear
- [ ] Handles terminal width gracefully

## Additional Context

<!-- Add any other relevant information -->

**Screenshots/Terminal Output**:


**Performance benchmarks**:


**Related changes needed in other repos**:
- [ ] .faf format specification
- [ ] claude-faf-mcp
- [ ] Chrome Extension
- [ ] None

---

**For Maintainers**

- [ ] Code review completed
- [ ] Tests verified
- [ ] Performance acceptable
- [ ] Documentation adequate
- [ ] Terminal output reviewed
- [ ] Ready to merge
