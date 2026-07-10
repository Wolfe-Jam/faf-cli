# FAF-CLI for Grok Build, xAI, and Cursor Developers

**One command. Every agent in your session gets the same accurate, versioned context.**

FAF-CLI (v7.1, "The AGENTS.md Edition") is the canonical tool for the [`.faf` format](https://faf.one): persistent, versioned, AI-readable project context. It authors exactly the instruction files agentic tools are built to read — `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, `GEMINI.md`, `copilot-instructions.md` — from a single source of truth, and exposes live tools over MCP. Part of the FAF ecosystem — [100,000+ downloads](https://faf.one/blog/hundred-thousand).

---

## Quick start (zero-install)

```bash
bunx faf                     # auto-detect the stack, write project.faf, score it
bunx faf export --agents     # generate AGENTS.md (+ related files) agents actually read
bunx faf score               # AI-readiness score (target: Trophy 100%)
bunx faf git owner/repo      # instant, scored context for any remote repo — no clone
```

`npx faf` works too. Add `faf export --agents` to `package.json` scripts, a pre-commit hook, or your agent's bootstrap step, and every session starts from accurate context instead of a guess.

---

## Why this fits agentic tools

Grok Build, xAI agentic systems, and Cursor's multi-agent workflows all hit the same wall:

- agents start with weak or hallucinated project context
- instructions are scattered, stale, or inconsistently written
- every new session or parallel agent re-learns the stack, commands, and conventions

FAF-CLI gives you one source of truth (`project.faf`) that emits the files these tools consume, plus live MCP exposure for agents that can call tools. It's **git-native**, so context travels with the code — and **non-destructive**, so it preserves your hand-written content and only maintains a labeled FAF block.

## For Grok Build & xAI agent sessions

xAI ships strong agentic capabilities — native tool use, the Agent Tools API, Grok Build's parallel sub-agents, and MCP support. FAF slots in without any changes to those products:

1. **Context layer** — run `bunx faf export --agents` in CI, pre-commit, or agent bootstrap. Every Grok session or parallel agent gets accurate, stack-aware `AGENTS.md`.
2. **MCP integration, already wired** — FAF has explicit Grok interop (`src/interop/grok.ts`) that wires the FAF MCP server into `.grok/config.toml`. Agents can call live tools (`faf_score`, `faf_validate`, context ops) instead of only reading static files.
3. **Hygiene gates** — `faf score` before agents touch a codebase; `faf drift` + `faf log` let long-running agents detect when context has changed.
4. **Remote / research** — `faf git owner/repo` pulls structured, scored context for external repos instantly.

## For Cursor multi-agent workflows

Cursor's Composer and background agents rely on exactly the files FAF authors:

1. **Better context files** — `faf export --agents` produces higher-fidelity `AGENTS.md` / `.cursorrules` than hand-rolled versions, because it scans for real build commands, conventions, guardrails, and Definition of Done.
2. **Non-destructive + bi-sync** — keep editing the parts you care about; FAF keeps the structured block current.
3. **Live tools over MCP** — wire a FAF MCP server so Cursor agents can call `score`, `validate`, `search`, not just read Markdown.
4. **Team bootstrap** — new projects/teammates run `bunx faf` once and have the files Cursor expects.
5. **External work** — `faf git` gives agents instant context on any repo or dependency without a full clone.

## For general AI coding sessions

- **CI / bootstrap gate** — add `faf export --agents` so context files are always fresh when an agent starts.
- **Scoring as a readiness signal** — `faf score` answers "is this project ready for serious agent work?"
- **Static + live** — Markdown files for the baseline, MCP tools for dynamic queries.
- **One source → many surfaces** — change `project.faf`, every emitted file and agent stays consistent.

## Why it's a natural fit

FAF-CLI isn't another AI wrapper — it's the canonical, versioned, stack-aware context source that emits exactly the files Grok Build, xAI agents, and Cursor agents are built to consume. The v7.1 "AGENTS.md Edition" lines up with where agentic coding is going, and the existing Grok interop makes integration low-friction.

One command (`bunx faf`) turns any project into one an agent can actually understand — measurable, versioned, and consistent.

---

**Links:** [faf.one](https://faf.one) · [`.faf` format](https://github.com/Wolfe-Jam/faf) · [faf-cli on npm](https://www.npmjs.com/package/faf-cli) · [IANA `application/vnd.faf+yaml`](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)
