---
name: faf-sync-master
description: Keep .faf and CLAUDE.md perfectly synchronized
disable-model-invocation: false
user-invocable: true
argument-hint: "[--watch]"
allowed-tools: Bash, Read, Write, Task
---

# FAF Sync Master - Bi-directional Context Synchronization

Maintain perfect synchronization between your project.faf and CLAUDE.md files, ensuring AI context stays consistent across formats.

## Usage

```
/faf-sync-master         # One-time sync
/faf-sync-master --watch # Continuous sync mode
```

## What This Does

1. **Detects** which file is newer (mtime-based)
2. **Syncs** content in the correct direction automatically
3. **Preserves** format-specific features in each file
4. **Validates** the sync succeeded

## Sync Modes

### Auto Mode (Default)
- Compares modification times
- Newer file wins
- Safe and predictable

### Watch Mode
- Monitors both files for changes
- Syncs immediately on save
- Perfect for active development

### Manual Direction
```bash
faf sync --direction push  # .faf → CLAUDE.md
faf sync --direction pull  # CLAUDE.md → .faf
```

## How It Works

The sync engine:
1. Reads both files
2. Compares timestamps
3. Transforms content between formats
4. Preserves bidirectional markers
5. Updates the target file

## Sync Indicators

Look for these in your files:
- `**STATUS: BI-SYNC ACTIVE 🔗**` - Sync is working
- `*Last Sync: [timestamp]*` - When last synced
- `*Sync Engine: F1-Inspired*` - Using latest engine

## Best Practices

1. **Edit either file** - The sync handles both directions
2. **Use watch mode** during active development
3. **Check sync status** with `faf check --trust`
4. **Let mtime decide** - Avoid forcing direction

## Pro Features

With `FAF_PRO=1`:
- Tri-sync with MEMORY.md
- Advanced merge strategies
- Conflict resolution UI
- Team sync coordination

## Troubleshooting

If sync seems stuck:
1. Check both files exist
2. Verify write permissions
3. Look for sync markers
4. Run `faf check --doctor`

The sync engine is battle-tested across thousands of projects. Trust the process!