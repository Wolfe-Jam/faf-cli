import { join, resolve } from 'path';
import { findFafFile, readFaf, readFafRaw, withKernel } from '../interop/faf.js';
import { writeAgentsMd } from '../interop/agents.js';
import { enrichFromRepo } from '../detect/enrich.js';
import { writeCursorrules } from '../interop/cursorrules.js';
import { writeGeminiMd } from '../interop/gemini.js';
import { writeCopilotInstructions } from '../interop/copilot-instructions.js';
import { writeGrokConfig } from '../interop/grok.js';
import { writeLlmsTxt } from '../interop/llms.js';
import { legacyStampNoteAt } from '../interop/inject.js';
import { writeProjectHtml } from '../interop/projecthtml.js';
import { writeServerCard } from '../interop/servercard.js';
import { scoreFafYaml } from '../core/scorer.js';
import { makeDirInside } from '../core/safe-write.js';
import { isOneLineError, oneLine } from '../core/refusal.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface ExportOptions {
  agents?: boolean;
  cursor?: boolean;
  gemini?: boolean;
  copilot?: boolean;
  grok?: boolean;
  llms?: boolean;
  conductor?: boolean;
  html?: boolean;
  card?: boolean;
  all?: boolean;
  /** Write exported files here instead of the current directory. project.faf is still read from cwd. */
  output?: string;
  /** Replace a project.html or Server Card faf cannot prove it wrote (edited since, or no faf mark). */
  force?: boolean;
}

/** Run an injector write and list the file, with the one-line note when
 *  faf's block went on top of a file led by faf's old stamp (read before the
 *  write; the old faf text below the block is the user's to delete). */
function injected(dir: string, rel: string, write: () => void, markers?: [string, string]): void {
  const note = legacyStampNoteAt(join(dir, rel), rel, markers?.[0], markers?.[1], { root: dir });
  write();
  console.log(`  ${rel}`);
  if (note) {console.log(dim(`  ${note}`));}
}

/** Run one target's write. A refusal (a file faf cannot prove it wrote, a
 *  link out, …) or a write that failed with the file kept is printed as its
 *  one line and the other targets still run; returns false then. */
function target(write: () => void): boolean {
  try {
    write();
    return true;
  } catch (e) {
    if (!isOneLineError(e)) {throw e;}
    console.error(oneLine(e, true));
    return false;
  }
}

export function exportCommand(options: ExportOptions = {}): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const dir = options.output ? resolve(process.cwd(), options.output) : process.cwd();
  if (options.output) {makeDirInside(dir);}
  const data = readFaf(fafPath);
  const exportAll =
    options.all ||
    (!options.agents &&
      !options.cursor &&
      !options.gemini &&
      !options.copilot &&
      !options.grok &&
      !options.llms &&
      !options.conductor &&
      !options.html &&
      !options.card);

  // Each target is written on its own: a refusal for one (a project.html
  // edited since faf wrote it, say) is printed in one line, the others still
  // run, and the command exits 1 at the end.
  let refused = 0;
  const run = (write: () => void): void => {
    if (!target(write)) {refused++;}
  };

  if (exportAll || options.agents) {
    // Enrich with facts detected from the repo (commands/key-files/secrets) so a
    // lean or stale .faf still yields a complete AGENTS.md. Hand-authored wins.
    run(() => injected(dir, 'AGENTS.md', () => writeAgentsMd(dir, enrichFromRepo(dir, data))));
  }

  if (exportAll || options.cursor) {
    run(() => injected(dir, '.cursorrules', () => writeCursorrules(dir, data), ['# faf:start', '# faf:end']));
  }

  if (exportAll || options.gemini) {
    // Same repo-enrichment AGENTS.md gets — a lean/stale .faf still yields a
    // complete GEMINI.md (commands/key-files detected from the repo).
    run(() => injected(dir, 'GEMINI.md', () => writeGeminiMd(dir, enrichFromRepo(dir, data))));
  }

  if (exportAll || options.copilot) {
    run(() => injected(dir, '.github/copilot-instructions.md', () => writeCopilotInstructions(dir, data)));
  }

  // Opt-in only: wires an MCP server into the user's .grok/ config, so it
  // never fires on a bare `faf export` or `--all` — only on explicit --grok.
  if (options.grok) {
    run(() => {
      const status = writeGrokConfig(dir, data);
      console.log(`  .grok/config.toml (${status})`);
    });
  }

  // Opt-in only: project llms.txt (llmstxt.org view of authored 6Ws).
  // Origin crawlers vs repo agents are different rooms — never a side effect
  // of bare `faf export` / `--all`.
  if (options.llms) {
    run(() => injected(dir, 'llms.txt', () => writeLlmsTxt(dir, data)));
  }

  if (exportAll || options.html) {
    // Render from the CURRENT project.faf — scored via the real scorer,
    // never a reimplementation. project.html is a view, not a format.
    run(() => {
      const result = withKernel(fafPath, () => scoreFafYaml(readFafRaw(fafPath)));
      writeProjectHtml(dir, data, result, fafPath, { force: options.force });
      console.log(`  project.html`);
    });
  }

  // MCP Server Card. Explicit via --card, OR by default for server-card projects
  // (app_type: server-card) on a plain export — the card carries the FAF
  // context-block in _meta, so FAF context ships by default.
  const isServerCard = data.app_type === 'server-card' || data.project?.type === 'server-card';
  if (options.card || (exportAll && isServerCard)) {
    run(() => {
      const out = writeServerCard(dir, data, {}, { force: options.force });
      console.log(`  ${out.replace(`${dir}/`, '')}`);
    });
  }

  console.log(`${fafCyan('exported')} ${dim(`from ${fafPath}`)}`);
  if (refused > 0) {process.exit(1);}
}
