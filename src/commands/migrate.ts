import { findFafFile, readFaf, writeFaf } from '../interop/faf.js';
import { SLOTS } from '../core/slots.js';
import { fafCyan, dim, bold } from '../ui/colors.js';

const CURRENT_VERSION = '2.5.0';

export interface MigrateOptions {
  dryRun?: boolean;
}

/** Migrate .faf to latest version */
export function migrateCommand(options: MigrateOptions = {}): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const data = readFaf(fafPath);
  const oldVersion = data.faf_version ?? 'unknown';

  if (oldVersion === CURRENT_VERSION) {
    console.log(`${fafCyan('◆')} migrate  already at v${CURRENT_VERSION}`);
    return;
  }

  // Update version
  data.faf_version = CURRENT_VERSION;

  // Ensure all section roots exist
  if (!data.project) {data.project = {};}
  if (!data.stack) {data.stack = {};}
  if (!data.human_context) {data.human_context = {};}
  if (!data.monorepo) {data.monorepo = {};}

  if (options.dryRun) {
    console.log(`${fafCyan('◆')} migrate  ${dim('(dry run)')} v${oldVersion} → v${CURRENT_VERSION}`);
    console.log(dim(`  would update ${fafPath}`));
    return;
  }

  writeFaf(fafPath, data);
  console.log(`${fafCyan('◆')} migrate  v${oldVersion} → v${CURRENT_VERSION}`);
  console.log(dim(`  updated ${fafPath}`));
}
