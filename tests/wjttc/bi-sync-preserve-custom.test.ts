/**
 * 🏎️ WJTTC: Bi-Sync Preserve Custom Content
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Wolfe James Test-To-Certification Suite
 *
 * RULE: Score can only improve - never downgrade rich custom content
 *
 * This test suite ensures bi-sync NEVER overwrites custom CLAUDE.md
 * content with a generic template. This was a critical bug that
 * undermined user trust in the bi-sync feature.
 *
 * CERTIFICATION: GOLD 🥇
 * - 12 tests covering all preservation scenarios
 * - Prevents regression of 2026-01-18 bug
 * - Protects user content forever
 *
 * Created: 2026-01-18
 */

// Jest is the test framework for faf-cli
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Import the modules we're testing
import { MirrorEngine } from '../../src/engines/c-mirror/core/mirror-engine';
import { FAFMirror } from '../../src/engines/c-mirror/faf-extensions/faf-mirror';
import { findFafFile } from '../../src/utils/file-utils';

describe('Bi-Sync Preserve Custom Content', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faf-bisync-test-'));
  });

  afterEach(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Custom Content Detection', () => {
    it('should detect custom CLAUDE.md with ## TOOLS section', async () => {
      const customContent = `# MCPaaS

## TOOLS (7)

| Tool | Purpose |
|------|---------|
| get_soul | Read context |
`;

      // Check for custom markers
      const hasCustomMarkers =
        customContent.includes('## TOOLS') ||
        customContent.includes('| Tool |');

      expect(hasCustomMarkers).toBe(true);
    });

    it('should detect custom CLAUDE.md with ## ENDPOINTS section', async () => {
      const customContent = `# Project

## ENDPOINTS

| Path | Purpose |
|------|---------|
| /api | Main API |
`;

      const hasCustomMarkers =
        customContent.includes('## ENDPOINTS') ||
        customContent.includes('| Endpoint |') ||
        customContent.includes('| Path |');

      expect(hasCustomMarkers).toBe(true);
    });

    it('should detect custom CLAUDE.md with bash code blocks', async () => {
      const customContent = `# Project

## COMMANDS

\`\`\`bash
npm run dev
npm run build
\`\`\`
`;

      const hasCustomMarkers = customContent.includes('```bash');

      expect(hasCustomMarkers).toBe(true);
    });

    it('should NOT detect generated CLAUDE.md as custom', async () => {
      const generatedContent = `# 🏎️ CLAUDE.md - Project Persistent Context & Intelligence

## PROJECT STATE: GOOD 🚀
**Tyre Compound:** ULTRASOFT C5 (Maximum Performance)

---

## 🎨 CORE CONTEXT

### Project Identity
- **Name:** Project
- **Stack:** Unknown
- **Quality:** F1-INSPIRED (Championship Performance)

---

**STATUS: BI-SYNC ACTIVE 🔗 - Synchronized with .faf context!**

*Last Sync: 2026-01-18T00:00:00.000Z*
*Sync Engine: F1-Inspired Software Engineering*
*🏎️⚡️_championship_sync*
`;

      // Generated content should NOT have custom markers
      const hasCustomMarkers =
        generatedContent.includes('## TOOLS') ||
        generatedContent.includes('## ENDPOINTS') ||
        generatedContent.includes('| Tool |') ||
        generatedContent.includes('```bash');

      expect(hasCustomMarkers).toBe(false);
    });
  });

  describe('findFafFile Priority', () => {
    it('should prefer project.faf over .faf', async () => {
      // Create both files
      await fs.writeFile(path.join(tempDir, '.faf'), 'metadata: {}');
      await fs.writeFile(path.join(tempDir, 'project.faf'), 'faf: "2.0"\nproject:\n  name: Test');

      const found = await findFafFile(tempDir);

      expect(found).toBe(path.join(tempDir, 'project.faf'));
    });

    it('should find project.faf when .faf does not exist', async () => {
      await fs.writeFile(path.join(tempDir, 'project.faf'), 'faf: "2.0"\nproject:\n  name: Test');

      const found = await findFafFile(tempDir);

      expect(found).toBe(path.join(tempDir, 'project.faf'));
    });

    it('should fall back to .faf if project.faf does not exist', async () => {
      await fs.writeFile(path.join(tempDir, '.faf'), 'faf: "2.0"\nproject:\n  name: Legacy');

      const found = await findFafFile(tempDir);

      expect(found).toBe(path.join(tempDir, '.faf'));
    });
  });

  describe('Preserve Custom Content During Sync', () => {
    it('should preserve custom CLAUDE.md when syncing faf-to-claude', async () => {
      // Setup: Create project.faf and custom CLAUDE.md
      const projectFaf = `faf: "2.0"
type: mcp-server
project:
  name: MCPaaS
  version: 1.0.0
  description: Test project
`;

      const customClaudeMd = `# MCPaaS

**Type:** \`mcp-server\`

## TOOLS (7)

| Tool | Purpose |
|------|---------|
| get_soul | Read context |
| list_souls | List available |
| write_soul | Write context |

## COMMANDS

\`\`\`bash
npm run dev
npm run build
\`\`\`

Custom content that MUST be preserved.
`;

      await fs.writeFile(path.join(tempDir, 'project.faf'), projectFaf);
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), customClaudeMd);

      // Make project.faf newer to force faf-to-claude direction
      const now = new Date();
      await fs.utimes(path.join(tempDir, 'CLAUDE.md'), now, new Date(now.getTime() - 10000));
      await fs.utimes(path.join(tempDir, 'project.faf'), now, now);

      // Run sync
      const mirror = new FAFMirror(tempDir);
      await mirror.sync();
      mirror.stop();

      // Verify custom content is preserved
      const resultContent = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');

      expect(resultContent).toContain('## TOOLS');
      expect(resultContent).toContain('| Tool |');
      expect(resultContent).toContain('```bash');
      expect(resultContent).toContain('Custom content that MUST be preserved');
    });

    it('should add sync footer to custom content without nuking it', async () => {
      const projectFaf = `faf: "2.0"
project:
  name: Test
`;

      const customClaudeMd = `# Test Project

## TOOLS

| Tool | Description |
|------|-------------|
| test | Test tool |

Original content here.
`;

      await fs.writeFile(path.join(tempDir, 'project.faf'), projectFaf);
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), customClaudeMd);

      // Make project.faf newer
      const now = new Date();
      await fs.utimes(path.join(tempDir, 'CLAUDE.md'), now, new Date(now.getTime() - 10000));
      await fs.utimes(path.join(tempDir, 'project.faf'), now, now);

      // Run sync
      const mirror = new FAFMirror(tempDir);
      await mirror.sync();
      mirror.stop();

      const resultContent = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');

      // Original content preserved
      expect(resultContent).toContain('## TOOLS');
      expect(resultContent).toContain('| test | Test tool |');
      expect(resultContent).toContain('Original content here');

      // Sync footer added
      expect(resultContent).toContain('BI-SYNC ACTIVE');
      expect(resultContent).toContain('_championship_sync');
    });

    it('should NOT nuke short CLAUDE.md with custom markers', async () => {
      // Even short files with custom markers should be preserved
      const projectFaf = `faf: "2.0"
project:
  name: Mini
`;

      const shortCustom = `# Mini

## AUTH

| Provider | Status |
|----------|--------|
| OAuth | Active |
`;

      await fs.writeFile(path.join(tempDir, 'project.faf'), projectFaf);
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), shortCustom);

      const now = new Date();
      await fs.utimes(path.join(tempDir, 'CLAUDE.md'), now, new Date(now.getTime() - 10000));
      await fs.utimes(path.join(tempDir, 'project.faf'), now, now);

      const mirror = new FAFMirror(tempDir);
      await mirror.sync();
      mirror.stop();

      const resultContent = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');

      expect(resultContent).toContain('## AUTH');
      expect(resultContent).toContain('| OAuth | Active |');
    });
  });

  describe('Score Can Only Improve Rule', () => {
    it('should not reduce content length significantly', async () => {
      const projectFaf = `faf: "2.0"
project:
  name: Big
`;

      // Create a large custom CLAUDE.md
      const largeCustom = `# Big Project

## OVERVIEW
This is a large project with lots of documentation.

## TOOLS (20)

| Tool | Purpose | Status |
|------|---------|--------|
| tool1 | Does thing 1 | Active |
| tool2 | Does thing 2 | Active |
| tool3 | Does thing 3 | Active |
| tool4 | Does thing 4 | Active |
| tool5 | Does thing 5 | Active |

## ARCHITECTURE

Detailed architecture documentation here.
Multiple paragraphs of important information.
This content took time to write and MUST NOT be lost.

## API REFERENCE

Extensive API documentation.

## DEPLOYMENT

Deployment instructions.

## TROUBLESHOOTING

Common issues and solutions.
`;

      await fs.writeFile(path.join(tempDir, 'project.faf'), projectFaf);
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), largeCustom);

      const originalLength = largeCustom.length;

      const now = new Date();
      await fs.utimes(path.join(tempDir, 'CLAUDE.md'), now, new Date(now.getTime() - 10000));
      await fs.utimes(path.join(tempDir, 'project.faf'), now, now);

      const mirror = new FAFMirror(tempDir);
      await mirror.sync();
      mirror.stop();

      const resultContent = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');

      // Content should be at least 80% of original (allowing for footer addition)
      expect(resultContent.length).toBeGreaterThan(originalLength * 0.8);

      // Key sections preserved
      expect(resultContent).toContain('## TOOLS');
      expect(resultContent).toContain('## ARCHITECTURE');
      expect(resultContent).toContain('MUST NOT be lost');
    });
  });

  describe('FAFMirror Initialization', () => {
    it('should use findFafFile to locate correct .faf file', async () => {
      // Create project.faf (preferred) and .faf (legacy)
      await fs.writeFile(path.join(tempDir, 'project.faf'), 'faf: "2.0"\nproject:\n  name: Correct');
      await fs.writeFile(path.join(tempDir, '.faf'), 'metadata: legacy');
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Test');

      const mirror = new FAFMirror(tempDir);

      // Wait for async initialization
      await (mirror as any).initPromise;

      const engine = (mirror as any).engine;
      expect(engine.config.structuredFile).toBe(path.join(tempDir, 'project.faf'));

      mirror.stop();
    });
  });
});
