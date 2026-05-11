# Getting Support

Thanks for using **faf-cli** — the CLI for the `.faf` format (IANA-registered `application/vnd.faf+yaml`).

This doc covers what to read first, how to get unstuck, and where to ask when you can't.

---

## Documentation — read first

| Source | What it covers |
|--------|----------------|
| [README.md](README.md) | Install, commands, scoring, sync, the current edition |
| [CHANGELOG.md](CHANGELOG.md) | What shipped in each version, in order |
| [docs/SCORING.md](docs/SCORING.md) | Tier system and the 🏆 Trophy 100% recommendation |
| [docs/SYNC.md](docs/SYNC.md) | bi-sync (free) and tri-sync (Pro) |
| [docs/SLOT-IGNORE.md](docs/SLOT-IGNORE.md) | How to mark slots as not-applicable |
| [docs/GUIDE.md](docs/GUIDE.md) | The 6Ws deep dive |
| [faf.one](https://faf.one) | Official site |

In-terminal help:

```bash
faf --help              # global help
faf <command> --help    # per-command help
faf info                # version + system info
```

---

## Common issues

### Installation

**`command not found: faf`**

Global install didn't complete or PATH is wrong:

```bash
bunx faf                       # Run without installing (Bun)
npx faf                        # Run without installing (npm)
npm install -g faf-cli         # Install globally
which faf                      # Should resolve to a real path
```

If `npm install -g` hits permission errors, prefer a userland npm prefix:

```bash
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g faf-cli
```

**Old version installed**

```bash
npm update -g faf-cli
faf info                       # confirm version
```

### Scoring

**Sub-Trophy score (anything below 100%)**

From v6.6.0 onward, faf-cli recommends only 🏆 Trophy. Sub-Trophy is an interim state — a slot count from Trophy — not an endpoint.

```bash
faf score                      # see exactly which slots are empty
faf auto                       # auto-fill from observable signals
faf go                         # guided interview for the rest
faf score                      # verify 🏆 Trophy
```

If a slot genuinely doesn't apply to your project type (e.g. `stack.db` for a CLI tool), mark it `slotignored` — see [docs/SLOT-IGNORE.md](docs/SLOT-IGNORE.md).

**`faf auto` not detecting project type**

The `# found:` YAML comment under `type:` tells you what signals fired. If detection is wrong, override it:

```bash
faf score                      # check the # found: rationale
faf edit project.type cli      # override with the right type
```

Supported types are listed in [docs/SCORING.md](docs/SCORING.md) and the canonical doctrine memory `v6.6.md`.

### Sync

**`faf sync` not working**

```bash
faf check                      # validate .faf file
ls CLAUDE.md                   # confirm target exists in cwd
faf sync                       # one-way push: .faf → CLAUDE.md
faf sync --watch               # continuous push on file change
```

Default sync is one-way (`.faf → CLAUDE.md`). The `.faf` is the canonical Foundational Context Layer; MD files never write back automatically.

**MD → .faf direction (`faf sync --pull`) blocked**

v6.6.0+ requires 🏆 Trophy before allowing MD-to-`.faf` backfill. Below 100%, the gate refuses the operation:

```
× sync --pull blocked: requires 🏆 Trophy (currently 81%)
  MD → .faf backfill only runs at 100%. Reach Trophy with 'faf go', then retry.
```

Reach Trophy first (`faf go`), then `--pull` unlocks. See [docs/SYNC.md](docs/SYNC.md).

### Terminal output

**Colors look wrong or are missing**

```bash
echo $TERM                     # check terminal type
faf score --no-color           # disable colors if your terminal can't render them
```

Windows users: use Windows Terminal or WSL — legacy `cmd.exe` doesn't render ANSI correctly.

---

## Reporting bugs

Issues live at [github.com/Wolfe-Jam/faf-cli/issues](https://github.com/Wolfe-Jam/faf-cli/issues).

**Include in a bug report:**

- `faf info` output (version + system)
- Node / Bun version
- The exact command you ran
- The full error message
- What you expected vs what happened

**Example:**

```markdown
**faf info**:
  faf-cli 6.6.0 · Node v20.10.0 · darwin-arm64

**Command**: faf auto
**Error**: "Cannot read property 'score' of undefined"

**Expected**: .faf created and scored
**Actual**: Command crashed

**Steps to reproduce**:
1. cd into empty dir
2. faf auto
3. error
```

For feature requests, describe the use case and the gap — what does the current flow miss?

---

## Questions and discussion

For "how do I..." or "what's the right way to..." questions:

- [github.com/Wolfe-Jam/faf/discussions](https://github.com/Wolfe-Jam/faf/discussions) — community Q&A
- Tag suggestions / workflows / best practices land here

---

## Security issues

Do not file security issues publicly. See [SECURITY.md](SECURITY.md) for the private disclosure path.

---

## Debug mode

Enable verbose output when filing a bug:

```bash
DEBUG=faf:* faf score
```

The trace tells maintainers exactly what fired and where.

---

## Command reference (v6)

The full list lives in [README.md](README.md). Most-used:

```bash
faf init               # Create .faf from your project
faf auto               # Zero to 100% in one command
faf go                 # Guided interview to Trophy
faf score              # Check AI-readiness (0–100%)
faf sync               # .faf → CLAUDE.md
faf compile            # .faf → .fafb binary
faf check              # Validate .faf
faf info               # Version + system info
```

Workflow: **`init` → `auto` → `go` → 100%**.

Run `faf --help` for the full 26-command list.

---

## Performance expectations

| Command | Target time |
|---------|-------------|
| `faf init` | < 50 ms |
| `faf score` | < 50 ms |
| `faf auto` | < 200 ms (varies with project size) |
| `faf sync` | < 10 ms |

If commands are significantly slower, check disk I/O and project size first; large monorepos legitimately take longer to scan.

---

## Version support

| Version line | Support |
|--------------|---------|
| **v6.x (current)** | Full support — patches, fixes, new features |
| **v5.x** | Critical fixes only |
| **v4.x and older** | No longer supported — upgrade to v6 |

Always update to the latest:

```bash
npm update -g faf-cli
faf info                       # confirm 6.x
```

---

## Community guidelines

When seeking help:

- Provide clear, detailed information
- Include version numbers and system info
- Share full error messages, not summaries
- Follow up if you solve the issue (helps the next person)

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Contributing

Want to help improve faf-cli? See [CONTRIBUTING.md](CONTRIBUTING.md).

Common contributions:
- Bug fixes
- Documentation improvements
- Test coverage
- New app-type detections (with real-world repo evidence — see `v6.6.md` doctrine memory)

---

## Related projects

- **`.faf` format spec** — [github.com/Wolfe-Jam/faf](https://github.com/Wolfe-Jam/faf)
- **claude-faf-mcp** — Claude Desktop MCP integration; listed by Anthropic as "Persistent Project Context Server" ([PR #2759](https://github.com/modelcontextprotocol/servers/pull/2759), merged 2025-10-17)
- **IANA registration** — `application/vnd.faf+yaml` at [iana.org/assignments/media-types](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml) (2025-10-30)

---

## Stay updated

- Watch the repository for release notifications
- Star the project to show support
- Subscribe to releases on GitHub
- Check [CHANGELOG.md](CHANGELOG.md) for what shipped

---

## Response times

| Channel | Typical response |
|---------|------------------|
| Critical bugs | 24–48 hours |
| Bug reports | 2–5 business days |
| Feature requests | Reviewed in planning cycles |
| Discussion questions | 24–48 hours (community-driven) |
| Security disclosure | See [SECURITY.md](SECURITY.md) |

---

## License

faf-cli is MIT licensed. See [LICENSE](LICENSE).

---

**Built by Wolfe James**
ORCID: [0009-0007-0801-3841](https://orcid.org/0009-0007-0801-3841)

🧡 Made with care for developers worldwide
