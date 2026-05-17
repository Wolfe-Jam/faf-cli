import { findFafFile, readFaf, readFafRaw } from '../interop/faf.js';
import { writeAgentsMd } from '../interop/agents.js';
import { writeCursorrules } from '../interop/cursorrules.js';
import { writeGeminiMd } from '../interop/gemini.js';
import { writeProjectHtml } from '../interop/projecthtml.js';
import { scoreFafYaml } from '../core/scorer.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface ExportOptions {
  agents?: boolean;
  cursor?: boolean;
  gemini?: boolean;
  conductor?: boolean;
  html?: boolean;
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
      !options.conductor &&
      !options.html);

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

  if (exportAll || options.html) {
    // Render from the CURRENT project.faf — scored via the real scorer,
    // never a reimplementation. project.html is a view, not a format.
    const result = scoreFafYaml(readFafRaw(fafPath));
    writeProjectHtml(dir, data, result, fafPath);
    console.log(`  project.html`);
  }

  console.log(`${fafCyan('exported')} ${dim(`from ${fafPath}`)}`);
}
