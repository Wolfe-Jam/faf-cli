---
name: faf-champion
description: Achieve 100% AI-readiness score for your project
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash, Read, Write, Glob, Grep, Task, TodoWrite
---

# FAF Champion - Achieve 100% AI-Readiness 🏆

This skill helps you achieve a perfect 100% AI-readiness score for your project using the FAF (Foundational AI-Context Format) system.

## Usage

```
/faf-champion
```

## What This Does

1. **Analyzes your project** to understand its structure and stack
2. **Creates or updates** your project.faf file with complete information
3. **Guides you** through filling any missing context slots
4. **Validates** the result to ensure 100% score
5. **Awards** the championship trophy 🏆 when you reach perfection

## Process

### 1. Initial Assessment
First, I'll check if you have a project.faf file and score it:

```bash
faf score --verbose
```

### 2. Auto-Generation
If no .faf exists or score is low, I'll run the auto-generator:

```bash
faf auto
```

### 3. Guided Interview
For any remaining gaps, I'll use the guided interview:

```bash
faf go
```

### 4. Validation
Finally, I'll validate your achievement:

```bash
faf check --strict
```

## Tips for Success

- **Be specific** about your project's purpose and goals
- **Include examples** of key functionality
- **Document integrations** with other systems
- **List all frameworks** and dependencies
- **Describe your deployment** target

## Championship Benefits

Achieving 100% AI-readiness means:
- Zero context drift in AI sessions
- Perfect project understanding
- Instant onboarding for any AI tool
- Complete documentation that versions with code
- Championship-grade engineering practices

## FAF Philosophy

FAF is infrastructure, not just a format. It's the foundational layer that enables AI to understand your project completely, eliminating the "drift tax" of re-explaining context.

Ready to become a champion? Let's begin!