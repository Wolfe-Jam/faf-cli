# 🧪 C-Mirror Conversion Testing - WJTC

**Testing Focus**: YAML ↔ Markdown Conversion Resilience
**Objective**: Find every way this can break and fix it
**Date**: 2025-10-03
**Status**: ACTIVE THRASHING 🏎️

---

## 🎯 What We're Testing

### The Conversion Challenge

**YAML (.faf)** ↔ **Markdown (CLAUDE.md)**

These are fundamentally different formats. Let's understand the dangers:

#### YAML Characteristics
- **Structure**: Key-value pairs, nested objects, arrays
- **Whitespace**: CRITICAL - indentation defines structure
- **Special chars**: `:` `-` `#` `|` `>` `&` `*` `!` `%` `@`
- **Quoting rules**: Unquoted, single-quoted, double-quoted (different escaping!)
- **Multiline**: Literal (`|`) vs folded (`>`) block scalars
- **Comments**: `# comment` (can appear anywhere)
- **Boolean traps**: `yes/no`, `true/false`, `on/off` all valid
- **Number parsing**: `0123` = octal, `0x123` = hex
- **Null values**: `null`, `~`, empty value
- **Anchors/Aliases**: `&anchor` and `*reference`

#### Markdown Characteristics
- **Structure**: Headers, paragraphs, lists, code blocks
- **Special chars**: `#` `*` `-` `_` `[` `]` `(` `)` `` ` `` `\`
- **Line breaks**: Matter for paragraphs, don't for headers
- **Escaping**: Backslash escapes special chars
- **Lists**: Can be `*`, `-`, or `+` (all equivalent)
- **Code blocks**: `` ``` `` fenced or 4-space indented
- **HTML allowed**: Raw HTML can be embedded
- **No schema**: Freeform text with formatting

---

## 💣 Danger Zones - What Can Break

### 1. **Special Character Hell**
- `:` in YAML = key-value separator, in MD = just text
- `-` in YAML = list item OR key-value, in MD = list or separator
- `#` in YAML = comment, in MD = header
- `|` in YAML = literal block, in MD = table column separator
- `` ` `` in MD = code, in YAML = just a character
- `*` in MD = emphasis/list, in YAML = alias reference

### 2. **Whitespace Chaos**
- YAML indentation = structure (2 spaces vs 4 spaces = different!)
- Markdown indentation = cosmetic (mostly)
- Trailing spaces in MD = line break
- Leading spaces in YAML = nesting level
- Empty lines in YAML = ignored, in MD = paragraph break

### 3. **Multiline Content**
- YAML multiline: `|` (keep newlines) vs `>` (fold newlines)
- Markdown multiline: Just write it (unless in list/code)
- Converting between them = DANGER

### 4. **Escaping Nightmares**
- YAML quotes: `"text"` allows escapes, `'text'` doesn't
- Markdown backslash: `\*` escapes special chars
- Round-trip conversion must preserve intent

### 5. **Data Type Confusion**
- YAML parses types: `true`, `123`, `null`
- Markdown is all strings
- Converting `goal: yes` → MD → YAML might become `goal: "yes"` (string not bool!)

### 6. **List Structure Differences**
```yaml
# YAML nested list
key_files:
  - path: foo.js
    purpose: Does stuff
  - path: bar.js
    purpose: Does things
```

```markdown
# Markdown list
1. **foo.js** - Does stuff
2. **bar.js** - Does things
```

Converting back: How do we know to recreate the nested structure?

### 7. **Metadata Loss**
- `.faf` has technical fields: `faf_score`, `ai_score`, `human_score`, `technical_credit`
- `CLAUDE.md` is human-readable: might not show all fields
- Round-trip: Must preserve hidden fields!

---

## 🧪 Test Cases to Build

### Category A: Special Characters
1. ✅ Colons in text: `project: name: value`
2. ✅ Hashes in text: `description: Use #hashtags`
3. ✅ Pipes in text: `goal: A | B | C`
4. ✅ Backticks in text: `description: Use \`code\` here`
5. ✅ Asterisks in text: `note: Important * notice`
6. ✅ Brackets in text: `feature: [BREAKING] Change`
7. ✅ Quotes in text: `quote: She said "hello"`
8. ✅ Backslashes: `path: C:\Users\foo`
9. ✅ Emoji hell: `💩🔥🎉✅❌🚀⚡️🏎️`
10. ✅ Unicode: `日本語`, `العربية`, `Ελληνικά`

### Category B: Whitespace
11. ✅ Trailing spaces in values
12. ✅ Leading spaces in values
13. ✅ Multiple blank lines
14. ✅ Tabs vs spaces
15. ✅ CRLF vs LF line endings

### Category C: Multiline Content
16. ✅ Literal block scalar: `description: |\n  line1\n  line2`
17. ✅ Folded block scalar: `description: >\n  long text`
18. ✅ List items with multiline content
19. ✅ Nested multiline in objects
20. ✅ Empty multiline blocks

### Category D: YAML Edge Cases
21. ✅ Null values: `field: null`, `field: ~`, `field:`
22. ✅ Boolean variations: `active: yes`, `active: true`, `active: on`
23. ✅ Numbers: `version: 1.0`, `count: 0123`, `hex: 0xFF`
24. ✅ Anchors and aliases: `&ref` and `*ref`
25. ✅ Complex keys: `? [a, b]: value`
26. ✅ Flow style: `files: [a.js, b.js, c.js]`
27. ✅ Explicit types: `!!str 123`, `!!int "123"`
28. ✅ Comments everywhere: `key: value # comment`

### Category E: Markdown Edge Cases
29. ✅ Headers with special chars: `## Project: Name`
30. ✅ Lists with nested content
31. ✅ Code blocks with backticks inside
32. ✅ Raw HTML in markdown
33. ✅ Escaped characters: `\*not emphasized\*`
34. ✅ Table formatting
35. ✅ Horizontal rules: `---`, `***`, `___`

### Category F: Round-Trip Preservation
36. ✅ `.faf` → `CLAUDE.md` → `.faf` (exact match)
37. ✅ Technical fields preserved
38. ✅ Scoring data intact
39. ✅ DNA metadata untouched
40. ✅ Array order maintained
41. ✅ Nested object structure preserved

### Category G: Malformed Input
42. ✅ Invalid YAML (unclosed quotes)
43. ✅ Invalid YAML (bad indentation)
44. ✅ Invalid YAML (tabs instead of spaces)
45. ✅ Markdown with no structure
46. ✅ Completely empty files
47. ✅ Binary data / non-UTF8
48. ✅ Extremely large files (>1MB)
49. ✅ Deeply nested structures (>20 levels)
50. ✅ Circular references (if using aliases)

---

## 📋 Testing Procedure

### Setup
```bash
cd /Users/wolfejam/FAF/cli
mkdir -p tests/c-mirror/fixtures
mkdir -p tests/c-mirror/results
```

### Test Format (WJTC Standard)

Each test file:
```
tests/c-mirror/
├── fixtures/
│   ├── 001-colons-in-text.faf           # Input
│   ├── 001-colons-in-text.expected.md  # Expected output
│   ├── 002-hashes-in-text.faf
│   └── ...
├── results/
│   ├── 001-colons-in-text.actual.md    # Actual output
│   ├── 001-colons-in-text.diff         # Diff if failed
│   └── ...
└── run-conversion-tests.ts              # Test runner
```

### Test Execution
1. Load fixture `.faf` file
2. Run `fafToClaudeMd()`
3. Compare output to `.expected.md`
4. Run `claudeMdToFaf()` on output
5. Compare round-trip to original
6. Record results

### Success Criteria
- ✅ Conversion completes without error
- ✅ Output matches expected format
- ✅ Round-trip preserves original data
- ✅ No data loss in technical fields
- ✅ Human-readable output maintained

---

## 🚨 Known Risks (Pre-Testing)

### High Risk
1. **Colons in project names**: `project: name: value` will break YAML parser
2. **Multiline descriptions**: MD → YAML conversion might lose formatting
3. **Special chars in lists**: `- path: foo | bar` might confuse parser
4. **Technical field preservation**: CLAUDE.md might not show all .faf fields

### Medium Risk
1. **Emoji in text**: Might cause encoding issues
2. **Nested lists**: MD → YAML structure recreation
3. **Comments in YAML**: Lost in MD conversion
4. **Boolean parsing**: `yes` vs `"yes"` type confusion

### Low Risk (But Test Anyway)
1. **Line endings**: CRLF vs LF
2. **Trailing whitespace**: Usually trimmed
3. **Empty values**: `field:` vs `field: null`

---

## 📊 Test Results

### Test Execution Log
- **Date**: [To be filled]
- **Tests Run**: 0/50
- **Passed**: 0
- **Failed**: 0
- **Errors**: 0

### Findings
[To be documented as we test]

---

## 🛠️ Fixes Applied

### Fix Log
[Track all fixes here]

---

**Status**: Ready for testing
**Next**: Build test fixtures and runner
