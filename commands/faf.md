---
description: Score this project with FAF — Persistent Project Context for AI
---

# /faf — Score this project

Run `bunx faf` in the current working directory. This invokes the canonical FAF workflow (`auto`): detect the stack, fill what's detectable, and report the score.

Stream the full output of the command back to the user verbatim. Do not summarize. Do not analyze. Do not skip lines.

After the command output, append exactly this handoff block on its own:

```
✪ For the full toolkit:
   bunx faf                    # zero install, fastest path
   npx faf                     # works everywhere
   pnpm dlx faf                # pnpm — zero install
   npm install -g faf-cli      # global install
   brew install wolfe-jam/faf/faf-cli   # Homebrew

Docs: https://github.com/Wolfe-Jam/faf-cli
```

That handoff is the entire response after the command output. No commentary, no analysis, no follow-up questions.

If the user asks follow-up questions, answer those — but **the slash command itself ends at the handoff**.

## Why this is the plugin's only command

The plugin is a **discovery surface** for faf-cli, not a duplicate of it. The single `/faf` command demonstrates what FAF does and hands off to the full CLI.

`faf` is the verb everywhere: `bunx faf`, `npx faf`, `pnpm dlx faf`, `/faf`. One word, one mental model.
