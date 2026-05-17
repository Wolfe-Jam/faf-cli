import { join } from 'path';
import open from 'open';
import { findFafFile, readFaf, readFafRaw } from '../interop/faf.js';
import { writeProjectHtml } from '../interop/projecthtml.js';
import { scoreFafYaml } from '../core/scorer.js';
import { dim, fafCyan } from '../ui/colors.js';

/**
 * `faf show` — render the current project.faf → project.html and open it.
 *
 * Register-1 "instant local view": one verb = render + open. Reuses the
 * EXACT export --html pipeline (single source — no new render logic).
 * Headless/CI never crashes: writes the file, prints the path, exits 0.
 */

/** Open a file in the OS default browser via the canonical `open` package
 *  (externalized by the build — never reinvent platform opener logic).
 *  Returns false (no throw) when skipped or it fails — graceful by design. */
function openInBrowser(file: string): boolean {
  if (process.env.CI) return false; // headless/CI — don't launch a browser
  try {
    void open(file).catch(() => undefined); // best-effort, never throws
    return true;
  } catch {
    return false;
  }
}

export function showCommand(): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const dir = process.cwd();
  const data = readFaf(fafPath);
  // Real scorer — never a reimplementation. Same pipeline as export --html.
  const result = scoreFafYaml(readFafRaw(fafPath));
  writeProjectHtml(dir, data, result, fafPath);

  const htmlPath = join(dir, 'project.html');
  const opened = openInBrowser(htmlPath);
  console.log(`  project.html`);
  console.log(
    opened
      ? `${fafCyan('opened')} ${dim('in your browser')}`
      : `${fafCyan('rendered')} ${dim(`file://${htmlPath}`)}`,
  );
}
