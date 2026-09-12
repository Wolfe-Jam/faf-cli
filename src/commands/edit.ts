import { aliasKeptNote, findFafFile, readFaf, writeFaf } from '../interop/faf.js';
import { blockingStep, blockedMessage, setNestedValue } from '../core/dot-path.js';
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

  // A section that holds a scalar or a list is never replaced with {} to make
  // room for the field — refuse and leave project.faf as it is.
  const block = blockingStep(data as Record<string, unknown>, path);
  if (block) {
    console.error(`Error: ${blockedMessage(path, block)}`);
    process.exit(1);
  }

  setNestedValue(data as Record<string, unknown>, path, value);
  // faf never replaces an alias (`summary: *g`): that edit is not written.
  const kept: string[] = [];
  writeFaf(fafPath, data, { onAliasKept: k => kept.push(aliasKeptNote(k)) });
  if (kept.length > 0) {
    for (const line of kept) {console.error(`Error: ${line}. Change the value its anchor holds, or replace the alias by hand.`);}
    process.exit(1);
  }

  console.log(`${fafCyan('updated')} ${path} ${dim('→')} ${value}`);
}
