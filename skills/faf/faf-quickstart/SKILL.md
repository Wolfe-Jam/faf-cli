---
name: faf-quickstart
description: Initialize FAF context for your project in seconds
disable-model-invocation: false
user-invocable: true
argument-hint: "[--yolo]"
allowed-tools: Bash, Read, Write, Glob, Grep
---

# FAF Quickstart - Zero to Context in Seconds

Get your project AI-ready with minimal setup using FAF's quickstart workflow.

## Usage

```
/faf-quickstart         # Interactive setup
/faf-quickstart --yolo  # Express setup with smart defaults
```

## What This Does

1. **Detects** your project stack automatically
2. **Creates** a project.faf file with sensible defaults
3. **Syncs** with CLAUDE.md if it exists
4. **Scores** your initial AI-readiness

## Express Mode (--yolo)

With the `--yolo` flag, FAF makes intelligent decisions:
- Auto-detects framework and language
- Uses directory name as project name
- Infers purpose from package.json/Cargo.toml
- Sets sensible defaults for all optional fields

## Interactive Mode

Without flags, you'll be asked key questions:
- Project name and purpose
- Main technologies used
- Architecture overview
- Key features

## Example Workflow

```bash
# Check current directory
pwd

# Quick init with defaults
faf init --yolo

# Check the score
faf score

# View the generated context
cat project.faf
```

## Next Steps

After quickstart:
1. Run `/faf-champion` to achieve 100% score
2. Use `faf sync` to keep CLAUDE.md in sync
3. Run `faf go` for guided improvements
4. Check `faf info --faq` for common questions

## Pro Tip

The quickstart creates a solid foundation (usually 70-85% score). For championship-grade context (100%), use the full guided interview with `faf go`.