import { existsSync, lstatSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { findFafFile, readFaf } from '../interop/faf.js';
import {
  A2A_CONTEXT_URI,
  findFafaFile,
  hasA2ACardMark,
  parseTargets,
  projectCards,
  readFafa,
  upsertCatalogText,
  writeJson,
  type CardTarget,
} from '../interop/cards.js';
import { REGISTRY_PUBLISHER_KEY, hasServerCardMark, patchServerJson } from '../interop/servercard.js';
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

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | undefined => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Json) : undefined);

/** Where each card file keeps the `generated` stamp of faf's context block. */
const STAMPS: Array<{ target: CardTarget; file: string[]; stamp: (j: Json) => unknown }> = [
  // The registry server.json first: `faf server-card --generated` sets its stamp at release time.
  { target: 'registry', file: ['server.json'], stamp: j => obj(obj(obj(j._meta)?.[REGISTRY_PUBLISHER_KEY])?.['one.faf/context'])?.generated },
  { target: 'mcp', file: ['server-card'], stamp: j => obj(obj(j._meta)?.['one.faf/context'])?.generated },
  {
    target: 'a2a',
    file: ['.well-known', 'agent-card.json'],
    stamp: j => {
      const exts = obj(j.capabilities)?.extensions;
      const ext = Array.isArray(exts) ? exts.map(obj).find(e => e?.uri === A2A_CONTEXT_URI) : undefined;
      return obj(ext?.params)?.generated;
    },
  },
];

/** The `generated` stamp faf's context block already has in a card file this
 *  run edits — server.json, then the Server Card, then the A2A card — kept for
 *  the whole run, as `faf server-card` keeps it, so a run that changes nothing
 *  writes nothing. undefined when none has one. A file faf may not read here
 *  (a link out of the project, not UTF-8, not JSON) is skipped; its own write
 *  says why. */
function keptStamp(dir: string, targets: CardTarget[] | undefined): string | undefined {
  for (const { target, file, stamp } of STAMPS) {
    const path = join(dir, ...file);
    // Only the files this run projects (no --target: every door, as projectCards reads it).
    if ((targets?.length && !targets.includes(target)) || !present(path)) {continue;}
    try {
      const j = obj(JSON.parse(readUtf8(resolveInside(dir, path)).replace(/^\uFEFF/, '')));
      const g = j ? stamp(j) : undefined;
      if (typeof g === 'string') {return g;}
    } catch {
      // not read here: the write of this file refuses it in one line
    }
  }
  return undefined;
}

/**
 * `faf cards` — one projector. .faf + optional .fafa → A2A · MCP · registry · catalog.
 * Same fafContextBlock on every door. Does not invent a door or an agent.
 * The block's `generated` stamp is the one the card files already carry
 * (see {@link keptStamp}), else the time of this run; a card that would not
 * change is not written, and is listed as unchanged.
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
        // One stamp for the whole run, so every door carries the same block:
        // the one the cards already carry, so a run that changes nothing
        // writes nothing; else now.
        now: keptStamp(dir, targets) ?? new Date().toISOString(),
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
  const written: Array<{ out: string; changed: boolean }> = [];
  const force = options.force === true;
  let refused = 0;
  // `own` names what faf changes in a file it shares with you (a JsonEditError
  // says why it cannot change only that). `write` returns whether it wrote.
  const run = (out: string, write: () => boolean, own = 'its own keys'): void => {
    try {
      written.push({ out, changed: write() });
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
    run(out, () => writeJson(out, projected.a2a, dir, { owns: hasA2ACardMark, mark: 'FAF context extension (https://faf.one/context)', force }) !== 'unchanged');
  }
  if (projected.mcp) {
    const out = join(dir, 'server-card');
    run(out, () => writeJson(out, projected.mcp, dir, { owns: hasServerCardMark, mark: 'FAF context-block (`_meta["one.faf/context"]`)', force }) !== 'unchanged');
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
      return next.changed;
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
        return next.changed;
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
  for (const { out, changed } of written) {
    console.error(`${fafCyan('✓')} ${out}${changed ? '' : ` ${dim('(unchanged)')}`}`);
  }
  if (refused > 0) {process.exit(1);}
}
