import { findFafFile, readFaf, readFafRaw } from '../interop/faf.js';
import { writeAgentsMd } from '../interop/agents.js';
import { writeCursorrules } from '../interop/cursorrules.js';
import { writeGeminiMd } from '../interop/gemini.js';
import { writeCopilotInstructions } from '../interop/copilot-instructions.js';
import { writeGrokConfig } from '../interop/grok.js';
import { writeProjectHtml } from '../interop/projecthtml.js';
import { writeServerCard } from '../interop/servercard.js';
import { scoreFafYaml } from '../core/scorer.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface ExportOptions {
  agents?: boolean;
  cursor?: boolean;
  gemini?: boolean;
  copilot?: boolean;
  grok?: boolean;
  conductor?: boolean;
  html?: boolean;
  card?: boolean;
  all?: boolean;
}

export function exportCommand(options: ExportOptions = {}): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const dir = process.cwd();
  const data = readFaf(fafPath);
  const exportAll =
    options.all ||
    (!options.agents &&
      !options.cursor &&
      !options.gemini &&
      !options.copilot &&
      !options.grok &&
      !options.conductor &&
      !options.html &&
      !options.card);

  if (exportAll || options.agents) {
    writeAgentsMd(dir, data);
    console.log(`  AGENTS.md`);
  }

  if (exportAll || options.cursor) {
    writeCursorrules(dir, data);
    console.log(`  .cursorrules`);
  }

  if (exportAll || options.gemini) {
    writeGeminiMd(dir, data);
    console.log(`  GEMINI.md`);
  }

  if (exportAll || options.copilot) {
    writeCopilotInstructions(dir, data);
    console.log(`  .github/copilot-instructions.md`);
  }

  // Opt-in only: wires an MCP server into the user's .grok/ config, so it
  // never fires on a bare `faf export` or `--all` — only on explicit --grok.
  if (options.grok) {
    const status = writeGrokConfig(dir, data);
    console.log(`  .grok/config.toml (${status})`);
  }

  if (exportAll || options.html) {
    // Render from the CURRENT project.faf — scored via the real scorer,
    // never a reimplementation. project.html is a view, not a format.
    const result = scoreFafYaml(readFafRaw(fafPath));
    writeProjectHtml(dir, data, result, fafPath);
    console.log(`  project.html`);
  }

  // MCP Server Card. Explicit via --card, OR by default for server-card projects
  // (app_type: server-card) on a plain export — the card carries the FAF
  // context-block in _meta, so FAF context ships by default.
  const isServerCard = data.app_type === 'server-card' || data.project?.type === 'server-card';
  if (options.card || (exportAll && isServerCard)) {
    const out = writeServerCard(dir, data);
    console.log(`  ${out.replace(`${dir}/`, '')}`);
  }

  console.log(`${fafCyan('exported')} ${dim(`from ${fafPath}`)}`);
}
