# FAF Examples

Real-world `project.faf` examples for common project types.

## Examples

| File | Type | Stack |
|------|------|-------|
| `react-dashboard.faf` | React app | React + Vite + Postgres + Vercel |
| `node-api.faf` | REST API | Fastify + Postgres + Redis + AWS |
| `python-ml.faf` | ML pipeline | FastAPI + PyTorch + Qdrant + Modal |
| `svelte-saas.faf` | SaaS app | SvelteKit + Postgres + Cloudflare |
| `cli-tool.faf` | CLI tool | Go + Homebrew |
| `monorepo.faf` | Monorepo | Turborepo + Next.js + Fastify |

## Using These Examples

Copy and customize for your project:

```bash
# Copy an example
cp examples/react-dashboard.faf project.faf

# Edit for your project
# (update name, goal, stack, human_context)

# Verify your score
faf score

# Sync with CLAUDE.md
faf bi-sync
```

## Structure

Every `project.faf` has three core sections:

```yaml
project:
  name: "your-project"
  goal: "What this project does"
  main_language: typescript

stack:
  # Your technology choices
  frontend: react
  backend: node
  database: postgres

human_context:
  # The information only you know
  who: "Who is building this"
  what: "What you're building"
  why: "Why it matters"
  where: "Where it runs"
  when: "Timeline and milestones"
  how: "How it works"
```

## Creating Your Own

```bash
# Auto-detect your stack
faf auto

# Or start from scratch
faf init
```

---

*.faf is the format. `project.faf` is the file. 100% AI Readiness is the result.*
