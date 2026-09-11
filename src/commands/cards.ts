import { existsSync, lstatSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { findFafFile, readFaf } from '../interop/faf.js';
import {
  findFafaFile,
  hasA2ACardMark,
  parseTargets,
  projectCards,
  readFafa,
  upsertCatalogText,
  writeJson,
  type CardTarget,
} from '../interop/cards.js';
import { hasServerCardMark, patchServerJson } from '../interop/servercard.js';
import { makeDirInside, readUtf8, resolveInside, safeWriteFile } from '../core/safe-write.js';
import { JsonEditError } from '../core/json-edit.js';
import { isOneLineError, oneLine } from '../core/refusal.js';
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
  /** Replace a card file faf cannot prove it wrote (edited since, or no faf mark). */
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

  // Each target is written on its own: a refusal for one (a card edited
  // since faf wrote it, say) is printed in one line, the others still run,
  // and the command exits 1 at the end.
  const written: string[] = [];
  const force = options.force === true;
  let refused = 0;
  // `own` names what faf changes in a file it shares with you (a JsonEditError
  // says why it cannot change only that).
  const run = (out: string, write: () => void, own = 'its own keys'): void => {
    try {
      write();
      written.push(out);
    } catch (e) {
      if (e instanceof JsonEditError) {
        console.error(`faf: ${out}: ${e.message} — faf cannot change only ${own}, so it left the file unchanged.`);
      } else if (isOneLineError(e)) {
        console.error(oneLine(e, true));
      } else {
        throw e;
      }
      refused++;
    }
  };
  if (projected.a2a) {
    const out = join(dir, '.well-known', 'agent-card.json');
    run(out, () => writeJson(out, projected.a2a, dir, { owns: hasA2ACardMark, mark: 'FAF context extension (https://faf.one/context)', force }));
  }
  if (projected.mcp) {
    const out = join(dir, 'server-card');
    run(out, () => writeJson(out, projected.mcp, dir, { owns: hasServerCardMark, mark: 'FAF context-block (`_meta["one.faf/context"]`)', force }));
  }
  if (projected.catalog) {
    // The catalog is shared: faf updates only its own rows (identifier
    // exactly faf's) and appends the rest, as a text edit — every other row
    // and every other byte stays.
    const out = join(dir, '.well-known', 'ai-catalog.json');
    const rows = projected.catalog;
    run(out, () => {
      makeDirInside(dir, dirname(out));
      const real = resolveInside(dir, out);
      const text = present(out) ? readUtf8(real) : null;
      const next = upsertCatalogText(text, rows);
      if (next.changed) {safeWriteFile(real, next.text, { root: dir, expect: text });}
    }, 'its own rows');
  }
  if (projected.registry) {
    const inPath = join(dir, 'server.json');
    if (present(inPath)) {
      // Only faf's identity keys change, in place; every other byte stays.
      const registry = projected.registry;
      run(inPath, () => {
        const real = resolveInside(dir, inPath);
        const text = readUtf8(real);
        const next = patchServerJson(text, { name: registry.name, title: registry.title, meta: registry._meta });
        if (next.changed) {safeWriteFile(real, next.text, { root: dir, expect: text });}
      }, 'its identity keys');
    } else if (targets?.includes('registry')) {
      console.error(
        `Error: ${inPath} not found.\n\n  Registry target patches an existing server.json. Seed one first.`,
      );
      process.exit(2);
    }
  }

  if (written.length === 0 && refused === 0) {
    console.error(
      `${fafCyan('faf cards')} ${dim('nothing to write — need .fafa for A2A/catalog; server.json for registry')}`,
    );
    return;
  }
  for (const w of written) {
    console.error(`${fafCyan('✓')} ${w}`);
  }
  if (refused > 0) {process.exit(1);}
}
