# faf-cli command reference

Every `faf` command, one section each, with a real example. Output below was captured from faf-cli 8.10.0 in a small Express + TypeScript API (`demo-api`); long paths are shortened to `~/demo-api`.

`faf --help` lists every command; `faf <command> --help` shows its options.

- [Start](#start): `init` · `auto` · `go` · `loop` · `git`
- [Check](#check): `score` · `check` · `drift` · `refresh` · `dna` · `context` · `search` · `formats` · `info`
- [Change](#change): `edit` · `migrate` · `conductor`
- [Write out](#write-out): `sync` · `export` · `show` · `convert` · `share`
- [History in git](#history-in-git): `diff` · `log` · `hooks`
- [Binary](#binary): `compile` · `decompile`
- [Cards](#cards): `card` · `cards` · `server-card`
- [Memory](#memory): `memory`
- [Tests](#tests): `taf` · `wjttc` · `bench`
- [Other](#other): `ai` · `pro` · `demo` · `clear`

## Install

Run without installing, or install globally. faf-cli needs Node.js 22 or newer, or Bun.

```bash
npx faf-cli init          # run once without installing
npm install -g faf-cli    # or: bun install -g faf-cli
faf --version
```

---

## Start

### Create project.faf: `faf init`

Detects the stack from the repo and writes `project.faf`, plus `.faf-dna`, the birth certificate that records the first score.

```bash
$ faf init
created ~/demo-api/project.faf
○ RED 29% 5/17 slots — ~/demo-api/project.faf
  12 slots from Trophy: project.goal, human_context.who, human_context.what, +9 more
  🧬 Birth DNA 29% — your journey starts here (faf dna)
  The birth certificate is not committed yet. Commit it to make it permanent: git add .faf-dna && git commit -m "faf: birth certificate"

  1 suggestion for the goal and the six W's (README.md) — confirm it in 'faf go'
  run 'faf go' to fill empty slots
```

The file it writes (excerpt):

```yaml
project:
  name: demo-api
  goal: ""
  main_language: TypeScript
  type: backend  # found: backend framework
stack:
  frontend: slotignored
  backend: Express
  runtime: Node.js
  build: TypeScript (tsc)
commands:
  build: npm run build
  test: npm run test
  dev: npm run dev
```

`slotignored` means the slot does not apply to this app type and does not count. `faf init --new` replaces `project.faf` with a fresh one and keeps `.faf-dna` as it is.

### Fill the tech slots: `faf auto`

Fills empty tech slots from what the repo shows, then scores. With no `project.faf` it creates one and, when there is no `.faf-dna`, writes the birth certificate at that first score, as `faf init` does. A `.faf-dna` that is there is never replaced. It says `unchanged` when there was nothing new to write.

```bash
$ faf auto
unchanged ~/demo-api/project.faf
○ RED 29% 5/17 slots — ~/demo-api/project.faf
  12 slots from Trophy: project.goal, human_context.who, human_context.what, +9 more
```

### Fill the human slots: `faf go`

Interactive. Asks for the goal and the six W's (who, what, why, where, when, how) one at a time, shows a suggestion from the repo in gray, and writes only what you confirm. Tab takes the suggestion.

```bash
faf go            # start
faf go --resume   # continue a session you left
faf go --github   # also suggest the goal from the repo's GitHub description
```

`--github` makes one GitHub API call for the description of the clone's `origin` and offers it as the goal suggestion (source: GitHub description) when the README has none. It is never written unless you confirm it. Set `GITHUB_TOKEN` or `GH_TOKEN` for a private repo.

### Drive to 100%: `faf loop`

Runs `auto` rounds, sources what it can, then asks you only for what the repo cannot tell it.

```bash
faf loop              # default: up to 5 auto rounds
faf loop --rounds 3
```

### Context for any GitHub repo: `faf git`

Shallow-clones a public repo to a temp folder and writes a scored `project.faf` for it. `--ref` picks a branch or tag.

```bash
$ faf git Wolfe-Jam/faf --stdout
cloning Wolfe-Jam/faf...
faf_version: "3.0"
project:
  name: "@faf/specification"
  goal: ""
  main_language: JavaScript
  type: documentation  # found: package name "@faf/specification" → documentation
…
```

Without `--stdout` it writes `./project.faf` (`--output <path>` to change it, `--force` to overwrite).

---

## Check

### Score project.faf: `faf score`

Scores the file from 0 to 100% and names the empty slots. Only slots that apply to the app type count.

```bash
$ faf score
○ RED 29% 5/17 slots — ~/demo-api/project.faf
  12 slots from Trophy: project.goal, human_context.who, human_context.what, +9 more

$ faf score --status
○ RED 29%

$ faf score --verbose
  ● project.name
  ○ project.goal
  ● project.main_language
  ○ human_context.who
  — stack.frontend: slotignored
  ● stack.backend
  ○ stack.api_type
  …
```

`●` filled, `○` empty, `—` does not apply. `--json` prints the result as JSON. Tiers: 100% Trophy ✪, 99% Gold ★, 95% Silver ◆, 85% Bronze ◇, 70% Green ●, 55% Yellow ●, below that Red ○. See [SCORING.md](SCORING.md).

### Validate the file: `faf check`

Checks that `project.faf` is valid, then scores it. `--strict` exits non-zero below 100%, for CI.

```bash
$ faf check
valid ~/demo-api/project.faf
○ RED 29% 5/17 slots — ~/demo-api/project.faf

$ faf check --strict   # fails the build below 100%
```

### Are the context files in sync? `faf drift`

Compares `project.faf` with the files written from it.

```bash
$ faf drift
drift — context file sync status

  .faf 8s ago
  ● CLAUDE.md in sync
  ! AGENTS.md newer 1s ago
  ○ .cursorrules missing
  ○ GEMINI.md missing
```

`--json` prints the report as JSON.

### Re-ground on the current file: `faf refresh`

Re-scores, measures drift against the birth score, and recompiles `project.fafb` if there is one.

```bash
$ faf refresh
refresh — re-grounding on the live .faf

  no drift — steady at 41%
  .fafb re-compiled (1232 bytes — fast tier current)
  re-grounded: ○ RED 41%
```

### Score history: `faf dna`

Shows the birth score, the current score, and each change in between.

```bash
$ faf dna
🧬 YOUR FAF DNA

   29% → 41%

   Birth DNA 29% (born 2026-11-16)  ·  current 41%  ·  growth +12%

   history:
   v1.0.0 — 29% 📊 (2026-11-16) Birth — initial context
   v1.0.1 — 35% 📊 (2026-11-16) faf edit project.goal
   v1.0.2 — 41% 📊 (2026-11-16) faf edit human_context.who
```

`faf dna --verify` checks the birth certificate against the commit that first added `.faf-dna` (exit 0 same, 1 changed, 2 cannot check).

### Print the filled facts: `faf context`

Prints every filled slot, one per line.

```bash
$ faf context
project.name: demo-api
project.goal: Track customer orders through a REST API
project.main_language: TypeScript
human_context.who: Backend developers on the orders team
stack.backend: Express
stack.runtime: Node.js
stack.build: TypeScript (tsc)
```

### Find a slot: `faf search`

Searches slot names and supported formats. `--slots` or `--formats` narrows it.

```bash
$ faf search goal
slots — 1 match

  #2 project.goal — Goal (use case) [project]
```

### Supported file types: `faf formats`

Lists the file types faf detects, by group.

```bash
$ faf formats
formats — supported file types

  web
    HTML .html, .htm
    …
    TypeScript .ts, .tsx, .mts, .cts
  data
    JSON .json
    YAML .yml, .yaml
  …
```

### Version: `faf info`

Prints the faf-cli and scoring kernel versions.

```bash
$ faf info
faf v8.10.0
kernel 3.1.0  IANA application/vnd.faf+yaml
```

---

## Change

### Set one slot: `faf edit`

Writes one value by its dotted path.

```bash
$ faf edit project.goal "Track customer orders through a REST API"
updated project.goal → Track customer orders through a REST API

$ faf edit project.type cli   # override a detected app type
```

### Upgrade the file format: `faf migrate`

Moves `project.faf` to the current format version. `--dry-run` previews.

```bash
$ faf migrate --dry-run
◆ migrate  already at v3.0
```

### Conductor config: `faf conductor`

`import <path>` merges a conductor config into `project.faf`; `export` prints one from it.

```bash
$ faf conductor export
{
  "name": "demo-api",
  "description": "Track customer orders through a REST API",
  "language": "TypeScript",
  "stack": {
    …
    "backend": "Express",
    "runtime": "Node.js",
    …
  },
  …
}
```

---

## Write out

### project.faf → CLAUDE.md: `faf sync`

Writes faf's block in `CLAUDE.md` from `project.faf` and keeps your own text around it. One way only: nothing flows back from CLAUDE.md. `--watch` repeats on every change.

When an `AGENTS.md` sits beside it, the block ends with `## Build, test and repo rules` and one line, `@AGENTS.md`. By default, Claude Code reads AGENTS.md only when there is no CLAUDE.md; the import makes it read both.

```bash
$ faf sync
◆ sync  .faf → CLAUDE.md
○ RED 41% 7/17 slots — ~/demo-api/project.faf
```

The block it writes (excerpt):

```markdown
<!-- faf:start -->
# CLAUDE.md — demo-api

## What This Is

Track customer orders through a REST API

## Stack

- **Language:** TypeScript
- **Backend:** Express
```

See [SYNC.md](SYNC.md).

### AGENTS.md and other agent files: `faf export`

Writes agent files from `project.faf`. Bare `faf export` writes AGENTS.md, .cursorrules, GEMINI.md, Copilot instructions and project.html.

AGENTS.md points to the facts file for the six W's (who, what, why, where, when, how), under `## Project facts`. .cursorrules, GEMINI.md and the Copilot instructions carry them, as CLAUDE.md does: one line per fact, and slots the score counts as empty are left out.

```bash
$ faf export --agents
  AGENTS.md
exported from ~/demo-api/project.faf

faf export --cursor     # .cursorrules
faf export --gemini     # GEMINI.md
faf export --copilot    # .github/copilot-instructions.md
faf export --llms       # llms.txt (opt-in)
faf export --all
```

### A web page of project.faf: `faf show`

Renders `project.faf` to `project.html` and opens it in the browser.

```bash
faf show
```

### YAML or JSON: `faf convert`

Prints `project.faf` as YAML, or as JSON with `--json`. Writes nothing.

```bash
$ faf convert --json
{
  "faf_version": "3.0",
  "project": {
    "name": "demo-api",
    "goal": "Track customer orders through a REST API",
    "main_language": "TypeScript",
    "type": "backend"
  },
  …
}
```

### A share link: `faf share`

Builds a faf.one link with `project.faf` encoded in it, locally; nothing is sent. `--copy` copies it, `--raw` prints only the encoded string.

```bash
$ faf share
◆ share  ~/demo-api/project.faf

  https://faf.one/share?d=H4sIAAAAAAAAE22TPY_bMAyGd_8Kwl1a4JIW6Obtimbo0KK4u11g…
```

---

## History in git

### What changed between versions: `faf diff`

A slot-level diff of `project.faf` with the score change. Takes git ranges: `<ref>`, `A..B`, `A...B`.

```bash
$ faf diff
project.faf  HEAD → (working tree)
Score: 41% ○ RED → 47% ○ RED  (+6)

  human
    + What             REST API for orders: create, list, update status   (added)

Slots filled: 7 → 8  (+1)
```

`faf diff --install-driver` makes plain `git diff` show the same view for `.faf` files.

### Score over time: `faf log`

The score at every commit that touched `project.faf`.

```bash
$ faf log
project.faf — score timeline (1 commit)

   41%   new   2026-11-16  4d06ba8  ○ RED  faf: goal + who
```

`-n <n>` limits, `--all` shows every commit, `--reverse` is oldest first, `--json` prints JSON.

### Pre-commit guard: `faf hooks`

Installs a git pre-commit hook that scores the staged `project.faf` against HEAD and warns on a drop, or blocks the commit with `--strict`.

```bash
$ faf hooks
faf pre-commit context guard
  installed:  no
  → `faf hooks --install` (add --strict to block on regression)

faf hooks --install --strict
faf hooks --uninstall   # removes only faf's block
```

---

## Binary

### project.faf → project.fafb: `faf compile`

Compiles the YAML to the `.fafb` binary.

```bash
$ faf compile
compiled ~/demo-api/project.fafb (1232 bytes)
```

### Read a .fafb: `faf decompile`

Prints a `.fafb` as JSON; `--output` writes it to a file.

```bash
$ faf decompile project.fafb
{
  "version": "2.0",
  "flags": 64,
  "section_count": 9,
  "total_size": 1232,
  "source_checksum": "0xa6f14179",
  "sections": [ … ]
}
```

---

## Cards

### Write an agent.fafa: `faf card init`

Interactive. Writes `agent.fafa`, the business card for an agent or server, from seven answers: name, short name, domain, what it does, version, where it runs, what it can do.

```bash
faf card init
```

### Write the cards your files allow: `faf cards`

From `agent.fafa` (and `project.faf`), writes the A2A card, MCP Server Card, registry `server.json`, AI Catalog and ARD, as far as the inputs allow. `--check` prints without writing; `--target` picks cards.

```bash
$ faf cards --check
skipped MCP Server Card and registry server.json: project.faf type is not an MCP server
  for its business card: faf card init · an MCP server after all: faf cards --target mcp

faf cards --target a2a,mcp
```

### Registry server.json identity: `faf server-card`

Patches the name, title and `_meta` from `project.faf` into an existing MCP registry `server.json`. It does not create the file.

```bash
$ faf server-card --check
Error: ~/demo-api/server.json not found.

  'faf server-card' patches the identity into an existing registry server.json;
  it does not create packages/icons. Seed a server.json first, then run this.

faf server-card --set-version 1.2.0
```

---

## Memory

### Project memory in soul.fafm: `faf memory`

Writes and reads facts in `soul.fafm`: `etch` writes one, `ls` lists them, `recall` searches, `show` summarizes, `convert <dir>` turns a Claude Code memory folder into a `soul.fafm`.

```bash
$ faf memory etch "Orders API returns JSON only" --type decision
memory etch — (no-id) → ~/demo-api/soul.fafm

$ faf memory ls
memory ls — @local (1 facts)

  (no-id)  Orders API returns JSON only
         decision · standard

faf memory recall "json" --limit 5
```

---

## Tests

### Test receipts in CI: `faf taf`

`faf taf setup` prints a GitHub Actions workflow that writes a test receipt (`.taf`) for every run on main, red runs included; `--write` creates `.github/workflows/taf.yml`. It has two jobs: a test job with a read-only token that uploads its output, and taf-git's receipt job, the only one that can write. `faf taf receipts` lists them.

```bash
$ faf taf setup
TAF setup — Test Receipt Printer: proof over time

Run `faf taf setup --write` to create this, or paste it into a workflow:

name: TAF Receipts
…
on:
  push:
    branches: [main]
…

faf taf receipts --limit 5
```

### Test tier audit: `faf wjttc`

Sorts tests into tiers (Brake, Engine, Aero, Tyre, Pit) and lists untiered ones. `--strict` exits non-zero if any are untiered; `--json` for CI.

```bash
$ faf wjttc
faf wjttc — vendor-neutral test audit

  Files scanned: 1
  Tests found:   1

  Tiers:
    ● BRAKE      0  (0%)
    …
    ○ untiered    1  (100%)
```

### Does the context help an agent? `faf bench`

Runs the same questions twice, without and with `project.faf`, and grades both against `project.faf` as the answer key.

```bash
$ faf bench
faf bench — agent-native protocol  qset d19d1ca96505 · 8 questions

COLD phase (fresh AI session, repo access)
  1. Instruct: "Answer these questions from the repository.
     Do NOT read project.faf, CLAUDE.md, AGENTS.md, or any *.faf file."
  2. faf bench questions — hand them over; answers terse, saved as cold.json
  3. faf bench grade cold.json --cold --tokens <used> --model <name>

FAF phase (same questions, context first)
  4. Instruct: "Read project.faf, then answer the same questions." → faf.json
  5. faf bench grade faf.json --faf --tokens <used> --model <name>
```

---

## Other

### Suggestions from Claude: `faf ai`

`faf ai analyze` sends `project.faf` to the Anthropic API and prints suggestions. It writes nothing. Needs `ANTHROPIC_API_KEY`.

```bash
ANTHROPIC_API_KEY=... faf ai analyze
```

### Pro status: `faf pro`

Shows the licence status; `faf pro activate` opens faf.one/pro.

```bash
$ faf pro
pro — FAF Pro status

  Status: Free

  Upgrade: faf pro activate
```

### Walkthrough: `faf demo`

Creates a sample `project.faf` in a temp folder and scores it.

```bash
$ faf demo
demo — FAF in action

  1. Created sample project.faf
     …
  2. Scoring...

✪ TROPHY 100% 21/21 slots — project.faf
  Trophy. AI never has to guess.
  …
```

### Remove cached clones: `faf clear`

Deletes the temp folders `faf git` cloned into.

```bash
$ faf clear
nothing to clear
```

---

## Troubleshooting

No colors, or wrong colors:

```bash
NO_COLOR=1 faf score
```

`command not found: faf`:

```bash
npx faf-cli score          # works without a global install
npm install -g faf-cli
```

More in [SUPPORT.md](../SUPPORT.md).
