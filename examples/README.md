# FAF examples

Worked `project.faf` files for common project shapes. Each one is current-schema
(`faf_version: "3.0"`) and scores **Trophy (100%)** — copy one, swap in your own
values, and `faf score` tells you what's still missing.

| File | Type | Stack |
|------|------|-------|
| `react-dashboard.faf` | Web app | React · Vite · Tailwind · Postgres · Vercel |
| `node-api.faf` | REST API | Fastify · Postgres · Redis · S3 · AWS Lambda |
| `python-ml.faf` | ML pipeline | FastAPI · PyTorch · Qdrant · Modal |
| `svelte-saas.faf` | SaaS app | SvelteKit · Tailwind · Drizzle · Postgres · Cloudflare |
| `cli-tool.faf` | CLI tool | Go · Homebrew (frontend/backend slots `slotignored`) |
| `monorepo.faf` | Monorepo | Turborepo · pnpm · Next.js · Fastify · Postgres |

## Using an example

```bash
cp examples/react-dashboard.faf project.faf   # pick the closest shape
# edit name / version / goal / stack / human_context for your project
faf score                                     # see how complete it is
faf sync                                      # keep it in step with CLAUDE.md
```

## Shape

Current `project.faf` (`3.0`) — the examples show all of it:

```yaml
faf_version: "3.0"
project:            # name, version, goal, main_language, type
commands:           # install / build / dev / test / lint
key_files:          # the paths an agent should read first
instant_context:    # a one-glance summary — what / stack / key files
stack:              # the 21 slots — a real value, or `slotignored` when it genuinely doesn't apply
human_context:      # the six Ws — who / what / why / where / when / how (only you know these)
```

A `slotignored` slot counts as answered — a CLI with no frontend still scores Trophy.

## Starting from your own repo instead

```bash
faf auto     # detect the stack, fill what's observable
faf init     # or start from a blank interview
```

---

*`.faf` is the format. `project.faf` is the file. 100% AI readiness is the result.*
