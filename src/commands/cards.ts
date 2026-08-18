import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { findFafFile, readFaf } from '../interop/faf.js';
import {
  findFafaFile,
  parseTargets,
  projectCards,
  readFafa,
  upsertCatalog,
  writeJson,
  type AiCatalog,
  type CardTarget,
} from '../interop/cards.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface CardsCommandOptions {
  target?: string;
  faf?: string;
  fafa?: string;
  check?: boolean;
  dir?: string;
  a2aUrl?: string;
}

/**
 * `faf cards` — one projector. .faf + optional .fafa → A2A · MCP · registry · catalog.
 * Same fafContextBlock on every door. Does not invent a door or an agent.
 */
export function cardsCommand(options: CardsCommandOptions = {}): void {
  const dir = options.dir ? resolve(options.dir) : process.cwd();
  let targets: CardTarget[] | undefined;
  try {
    targets = parseTargets(options.target);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(2);
  }

  const fafPath = options.faf ? resolve(options.faf) : findFafFile(dir);
  if (!fafPath || !existsSync(fafPath)) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }
  const faf = readFaf(fafPath);

  const fafaPath = options.fafa ? resolve(options.fafa) : findFafaFile(dir);
  const fafa = fafaPath && existsSync(fafaPath) ? readFafa(fafaPath) : undefined;

  let projected;
  try {
    projected = projectCards({
      faf,
      fafa,
      targets,
      opts: { a2aCardUrl: options.a2aUrl },
    });
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(2);
  }

  if (options.check) {
    process.stdout.write(`${JSON.stringify(projected, null, 2)}\n`);
    return;
  }

  const written: string[] = [];
  if (projected.a2a) {
    const out = join(dir, '.well-known', 'agent-card.json');
    writeJson(out, projected.a2a);
    written.push(out);
  }
  if (projected.mcp) {
    const out = join(dir, 'server-card');
    writeJson(out, projected.mcp);
    written.push(out);
  }
  if (projected.catalog) {
    const out = join(dir, '.well-known', 'ai-catalog.json');
    let existing: AiCatalog | undefined;
    if (existsSync(out)) {
      existing = JSON.parse(readFileSync(out, 'utf-8')) as AiCatalog;
    }
    writeJson(out, upsertCatalog(existing, projected.catalog));
    written.push(out);
  }
  if (projected.registry) {
    const inPath = join(dir, 'server.json');
    if (existsSync(inPath)) {
      const existing = JSON.parse(readFileSync(inPath, 'utf-8')) as Record<string, unknown>;
      const merged = {
        ...existing,
        name: projected.registry.name,
        _meta: { ...((existing._meta as object) ?? {}), ...projected.registry._meta },
      };
      if (projected.registry.title) {merged.title = projected.registry.title;}
      writeJson(inPath, merged);
      written.push(inPath);
    } else if (targets?.includes('registry')) {
      console.error(
        `Error: ${inPath} not found.\n\n  Registry target patches an existing server.json. Seed one first.`,
      );
      process.exit(2);
    }
  }

  if (written.length === 0) {
    console.error(
      `${fafCyan('faf cards')} ${dim('nothing to write — need .fafa for A2A/catalog; server.json for registry')}`,
    );
    return;
  }
  for (const w of written) {
    console.error(`${fafCyan('✓')} ${w}`);
  }
}
