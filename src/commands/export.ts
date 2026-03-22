import { findFafFile, readFaf } from '../interop/faf.js';
import { writeAgentsMd } from '../interop/agents.js';
import { writeCursorrules } from '../interop/cursorrules.js';
import { writeGeminiMd } from '../interop/gemini.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface ExportOptions {
  agents?: boolean;
  cursor?: boolean;
  gemini?: boolean;
  conductor?: boolean;
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
  const exportAll = options.all || (!options.agents && !options.cursor && !options.gemini && !options.conductor);

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

  console.log(`${fafCyan('exported')} ${dim(`from ${fafPath}`)}`);
}
