import { findFafFile, readFaf, writeFaf } from '../interop/faf.js';
import { fafCyan, dim } from '../ui/colors.js';

/** Edit a .faf field by dot-path */
export function editCommand(path: string, value: string): void {
  if (!path || value === undefined) {
    console.error('Usage: faf edit <path> <value>\n\n  Example: faf edit project.name "My Project"');
    process.exit(1);
  }

  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const data = readFaf(fafPath);
  const parts = path.split('.');

  if (parts.length !== 2) {
    console.error('Error: path must be section.field (e.g. project.name)');
    process.exit(1);
  }

  const [section, field] = parts;

  if (!data[section] || typeof data[section] !== 'object') {
    (data as Record<string, unknown>)[section] = {};
  }

  (data[section] as Record<string, unknown>)[field] = value;
  writeFaf(fafPath, data);

  console.log(`${fafCyan('updated')} ${path} ${dim('→')} ${value}`);
}
