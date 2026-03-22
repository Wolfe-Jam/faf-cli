import { findFafFile, readFaf, readFafRaw } from '../interop/faf.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface ConvertOptions {
  json?: boolean;
}

/** Convert .faf to JSON or raw YAML */
export function convertCommand(options: ConvertOptions = {}): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  if (options.json) {
    const data = readFaf(fafPath);
    console.log(JSON.stringify(data, null, 2));
  } else {
    const raw = readFafRaw(fafPath);
    console.log(raw);
  }
}
