# Security Policy

## Reporting a vulnerability

Report security issues **privately** — please do not open a public issue.

→ **[GitHub Security Advisories](https://github.com/Wolfe-Jam/faf-cli/security/advisories/new)** (preferred)
→ or email **team@faf.one**

Where possible, include: affected version (`faf --version`), reproduction steps, and impact.

## Supported versions

faf-cli follows [Semantic Versioning](https://semver.org). The **latest published `6.x`** on npm receives security fixes; older majors are not maintained.

## What to expect

faf-cli is free, open-source software maintained in the open — no guarantees, but reports are taken seriously and triaged as promptly as is reasonable. Confirmed issues are fixed in a patched release and disclosed via a published GitHub Security Advisory (GHSA), crediting the reporter where they wish.

## Security posture

faf-cli is local-first and conservative by design:

- **No remote code execution** — it never runs shell commands or evaluates code from `.faf` files or user input.
- **Safe YAML** — parsing uses the core schema only (no custom tags, no arbitrary object instantiation).
- **Path-scoped** — file operations validate paths and stay within the project; read-only by default, writes require explicit commands.
- **Network** — none, except the opt-in `bench --submit` flag, which posts a benchmark receipt to a public endpoint.

Dependencies are kept minimal (see `package.json`) and monitored via `npm audit` + Dependabot.

## Scope

Issues in the `.faf` / `.fafm` / `.fafa` **formats** themselves, or in the FAF MCP servers, belong in their respective repositories.

---
*Maintainer: James Wolfe ([ORCID 0009-0007-0801-3841](https://orcid.org/0009-0007-0801-3841)) · [faf.one](https://faf.one)*
