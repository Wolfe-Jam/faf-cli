# Claude Code plugin: `/faf` and the faf-expert skill

faf-cli is also a Claude Code plugin. It ships one slash command and one skill; everything else is the CLI.

| In the plugin | What it does |
|---------------|--------------|
| `/faf` | Runs `bunx faf` in the current folder and shows the output, then lists the ways to install the CLI |
| `faf-expert` skill | Lets Claude answer questions about the `.faf` format, scoring, app-types and sync |

## Install

In Claude Code:

```text
/plugin marketplace add Wolfe-Jam/faf-cli
/plugin install faf@faf-marketplace
```

## Use

```text
/faf
```

For everything else, use the CLI from the terminal, or ask Claude to run it:

```bash
faf init     # create project.faf
faf go       # fill the goal and six W's
faf sync     # write CLAUDE.md from project.faf
```

Every command, with an example: [COMMANDS.md](COMMANDS.md).
