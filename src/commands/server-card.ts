import { existsSync, lstatSync } from 'fs';
import { dirname, resolve } from 'path';
import { findFafFile, readFaf } from '../interop/faf.js';
import { REGISTRY_PUBLISHER_KEY, hasRegistryMark, patchServerJson } from '../interop/servercard.js';
import { projectCards } from '../interop/cards.js';
import { readUtf8, resolveInside, safeReplaceOwned, safeWriteFile } from '../core/safe-write.js';
import { JsonEditError } from '../core/json-edit.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface ServerCardCommandOptions {
  in?: string;
  out?: string;
  faf?: string;
  setVersion?: string;
  generated?: string;
  check?: boolean;
  /** With --out: replace an existing file that has no faf identity in it. */
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

/** The `generated` stamp faf's block already has in the file, if any. */
function existingGenerated(text: string): string | undefined {
  try {
    const j = JSON.parse(text.replace(/^\uFEFF/, '')) as {
      _meta?: Record<string, { 'one.faf/context'?: { generated?: unknown } } | undefined>;
    };
    const g = j?._meta?.[REGISTRY_PUBLISHER_KEY]?.['one.faf/context']?.generated;
    return typeof g === 'string' ? g : undefined;
  } catch {
    return undefined; // not JSON: the edit below says so
  }
}

/**
 * `faf server-card` — put the EMITTED IDENTITY (name + title + _meta) from
 * project.faf into an existing MCP-registry server.json, and change nothing
 * else. The single CROSS-LANGUAGE server-card emitter: TS, Python, and Rust
 * builds all call it, so identity is composed from ONE source — never forked
 * per repo. (JS repos may instead import `registryTitle`/`registryName`/
 * `registryMeta`/`patchServerJson` directly; the CLI exists so Python/Rust
 * reach the same source.)
 *
 * An in-place text edit: only the value of `name`, of `title` (when
 * project.faf has one — else the file's own title is kept), of `version`
 * (with --set-version; NOT --version, which is the global CLI-version flag)
 * and faf's context-block keys under `_meta` change, or are added when
 * missing. No field is deleted; key order, large integers and array layout
 * stay byte for byte. A server.json that cannot be edited that way is
 * refused in one line. It does NOT invent packages/version/sha (those are
 * per-release and per-registry). --check prints the result to stdout without
 * writing (the idempotency-test hook). --out writes the result to another
 * file, which faf replaces only when it already carries faf's identity
 * (or with --force).
 */
export function serverCardCommand(options: ServerCardCommandOptions = {}): void {
  const fafPath = options.faf ? resolve(options.faf) : findFafFile();
  if (!fafPath || !existsSync(fafPath)) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }
  const data = readFaf(fafPath);

  const inPath = resolve(options.in ?? './server.json');
  const inRoot = options.in ? dirname(inPath) : process.cwd();
  if (!present(inPath)) {
    console.error(
      `Error: ${inPath} not found.\n\n  'faf server-card' patches the identity into an existing registry server.json;\n  it does not create packages/icons. Seed a server.json first, then run this.`,
    );
    process.exit(2);
  }
  // Resolved before it is read: a server.json that is a link out of the
  // project (or dangles, or leads to a file with another name) is refused.
  const inReal = resolveInside(inRoot, inPath);
  const text = readUtf8(inReal);

  // Preserve the release-managed `generated` stamp so the emit stays idempotent
  // (no spurious churn on re-run); --generated overrides it at release time.
  // One stamp for the whole run, so every block the projector builds agrees.
  const now = options.generated ?? existingGenerated(text) ?? new Date().toISOString();

  // Compose the identity from the one projector (registry target).
  const projected = projectCards({
    faf: data,
    targets: ['registry'],
    opts: { fafPointer: './project.faf', now },
  });
  const name = projected.registry!.name;
  const title = projected.registry!.title;

  let next: { text: string; changed: boolean };
  try {
    next = patchServerJson(text, { name, title, version: options.setVersion, meta: projected.registry!._meta });
  } catch (e) {
    if (!(e instanceof JsonEditError)) {throw e;}
    console.error(`faf: ${inPath}: ${e.message} — faf cannot change only its identity keys, so it left the file unchanged.`);
    process.exit(1);
  }

  if (options.check) {
    process.stdout.write(next.text);
    return;
  }
  const outPath = resolve(options.out ?? inPath);
  const titleNote = title ?? '(none in project.faf — the file\'s own kept)';
  if (outPath === inPath) {
    if (next.changed) {safeWriteFile(inReal, next.text, { root: inRoot, expect: text });}
  } else {
    safeReplaceOwned(outPath, next.text, {
      root: options.out ? dirname(outPath) : process.cwd(),
      owns: hasRegistryMark,
      mark: 'faf identity (`_meta` publisher-provided `one.faf/context`)',
      force: options.force,
    });
  }
  console.error(
    `${fafCyan('✓')} ${outPath} — name=${name} title=${titleNote} ${dim(
      next.changed || outPath !== inPath ? '(identity emitted from faf-cli)' : '(unchanged)',
    )}`,
  );
}
