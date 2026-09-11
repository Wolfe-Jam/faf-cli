import { existsSync, lstatSync } from 'fs';
import { join, resolve } from 'path';
import { findFafFile, readFaf } from '../interop/faf.js';
import {
  findFafaFile,
  hasA2ACardMark,
  isFafJsonLayout,
  parseTargets,
  projectCards,
  readFafa,
  upsertCatalog,
  writeJson,
  type AiCatalog,
  type CardTarget,
} from '../interop/cards.js';
import { hasServerCardMark, patchServerJson } from '../interop/servercard.js';
import { readUtf8, resolveInside, safeWriteFile } from '../core/safe-write.js';
import { JsonEditError } from '../core/json-edit.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface CardsCommandOptions {
  target?: string;
  faf?: string;
  fafa?: string;
  check?: boolean;
  dir?: string;
  a2aUrl?: string;
  doorUrl?: string;
  fafPointer?: string;
  /** Replace a card file faf did not write (no faf mark). */
  force?: boolean;
}

/** True when something is at `path` — a file, or a link (even a dangling one). */
function present(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
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
      opts: {
        a2aCardUrl: options.a2aUrl,
        doorUrl: options.doorUrl,
        fafPointer: options.fafPointer,
        // One stamp for the whole run, so every door carries the same block.
        now: new Date().toISOString(),
      },
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
  const force = options.force === true;
  if (projected.a2a) {
    const out = join(dir, '.well-known', 'agent-card.json');
    writeJson(out, projected.a2a, dir, { owns: hasA2ACardMark, mark: 'FAF context extension (https://faf.one/context)', force });
    written.push(out);
  }
  if (projected.mcp) {
    const out = join(dir, 'server-card');
    writeJson(out, projected.mcp, dir, { owns: hasServerCardMark, mark: 'FAF context-block (`_meta["one.faf/context"]`)', force });
    written.push(out);
  }
  if (projected.catalog) {
    // The catalog is shared: faf upserts its own rows and keeps the rest. It is
    // rewritten only when its text is exactly faf's JSON layout, so the rewrite
    // loses nothing (no hand formatting, repeated key or 20-digit number).
    const out = join(dir, '.well-known', 'ai-catalog.json');
    let existing: AiCatalog | undefined;
    if (present(out)) {
      existing = JSON.parse(readUtf8(resolveInside(dir, out))) as AiCatalog;
    }
    writeJson(out, upsertCatalog(existing, projected.catalog), dir, {
      owns: isFafJsonLayout,
      mark: "layout faf writes (2-space JSON), so a rewrite would lose your formatting",
      force,
    });
    written.push(out);
  }
  if (projected.registry) {
    const inPath = join(dir, 'server.json');
    if (present(inPath)) {
      // Only faf's identity keys change, in place; every other byte stays.
      const real = resolveInside(dir, inPath);
      const text = readUtf8(real);
      let next: { text: string; changed: boolean };
      try {
        next = patchServerJson(text, {
          name: projected.registry.name,
          title: projected.registry.title,
          meta: projected.registry._meta,
        });
      } catch (e) {
        if (!(e instanceof JsonEditError)) {throw e;}
        console.error(`faf: ${inPath}: ${e.message} — faf cannot change only its identity keys, so it left the file unchanged.`);
        process.exit(1);
      }
      if (next.changed) {safeWriteFile(real, next.text, { root: dir, expect: text });}
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
