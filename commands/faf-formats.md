---
description: 😽 TURBO-CAT discovers all formats in your project (153 validated framework types)
argument-hint: Optional project path
---

# FAF Formats - TURBO-CAT Discovery Engine

You are helping a developer discover and understand all the frameworks, configs, and tools in their project.

## What This Command Does

`faf formats` runs **TURBO-CAT** 😽 - FAF's rapid catalytic converter that scans projects and detects 153+ validated framework/config types organized in a pyramid structure.

**Discovery speed**: <50ms for most projects
**Accuracy**: Validates actual file existence + content patterns
**Coverage**: 153 formats across 17 categories

---

## The Format Pyramid 🔺

TURBO-CAT organizes formats in a pyramid (like F1 tire compounds):

**Level 1** (Most critical):
- `.faf` - The foundational format

**Level 2** (Package managers):
- `package.json`, `requirements.txt`

**Level 3** (Language foundations):
- `Cargo.toml`, `go.mod`, `pom.xml`

**Levels 4-17** (Frameworks, tools, infrastructure):
- Next.js, React, Django, Docker, Kubernetes, Tailwind, etc.

**Total**: 153 formats + 😽 TURBO-CAT = 154!

---

## Command: faf formats

**Basic usage**:
```bash
faf formats
```

**Detailed output with counts**:
```bash
faf formats --details
```

**Export discovered formats**:
```bash
faf formats --json > discovered.json
```

---

## Your Role

1. **Run the command**: Execute `faf formats` in project directory

2. **Review discoveries**: TURBO-CAT will report:
   - **Detected formats**: What frameworks/tools are present
   - **Pyramid level**: Importance/criticality of each format
   - **File locations**: Where configs were found
   - **Confidence**: How certain the detection is

3. **Interpret results**:
   - **High-level formats** (Levels 1-7): Critical project infrastructure
   - **Mid-level formats** (Levels 8-12): Build tools, testing, APIs
   - **Lower-level formats** (Levels 13-17): Styling, monorepo, linting

4. **Use discoveries**: TURBO-CAT findings auto-populate `.faf` file:
   ```bash
   # After running faf formats, init/sync will use discoveries:
   faf init
   # Or update existing .faf:
   faf sync
   ```

---

## Example Output

```
😽 TURBO-CAT Format Discovery

🔺 Level 1 (Foundation):
   ✅ .faf

🔺 Level 2 (Package Managers):
   ✅ package.json

🔺 Level 5 (Frameworks):
   ✅ next.config.js (Next.js)

🔺 Level 6 (Build Tools):
   ✅ vite.config.js (Vite)
   ✅ tsconfig.json (TypeScript)

🔺 Level 13 (Styling):
   ✅ tailwind.config.js (Tailwind CSS)

Total: 6 formats discovered
Pyramid coverage: 6/153 (4%)
Championship score: Specialized (frontend focus)
```

---

## Categories Detected

**Frontend**:
- Frameworks: React, Vue, Svelte, Angular, Next.js, Nuxt, etc.
- Build: Vite, Webpack, Rollup, ESBuild
- Styling: Tailwind, PostCSS, Sass, Styled Components

**Backend**:
- Node: Express, NestJS, Fastify
- Python: Django, FastAPI, Flask
- Go: Gin, Echo
- Rust: Actix, Rocket

**Database & ORM**:
- Prisma, Drizzle, TypeORM, Sequelize, Mongoose

**Cloud & Deployment**:
- Docker, Kubernetes, Vercel, Netlify, AWS, GCP

**Mobile & Desktop**:
- React Native, Electron, Tauri, Capacitor

**Infrastructure**:
- Terraform, Ansible, Kubernetes, Helm

---

## Why TURBO-CAT Matters

**For AI context**:
- Eliminates "What frameworks do you use?" questions
- AI immediately knows tech stack
- Reduces hallucinations about available tools
- Speeds up code generation with correct imports

**For developers**:
- Instant project audit
- Discover forgotten/legacy tools
- Validate complete stack coverage
- Share stack knowledge with team

---

## Pro Tips

1. **Run after major updates**: New framework? Run `faf formats && faf sync`
2. **Share discoveries**: Include in onboarding docs
3. **CI/CD validation**: Detect unexpected framework additions
4. **Migration tracking**: See old vs new tool overlap

---

## TURBO-CAT Philosophy

"If it's configured, TURBO-CAT finds it. If TURBO-CAT finds it, FAF knows it. If FAF knows it, AI uses it."

**Championship speed**: <50ms discovery means zero developer friction. Run it liberally. 😽🏎️⚡️
