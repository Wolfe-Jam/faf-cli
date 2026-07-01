import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { findFafFile, readFaf } from '../interop/faf.js';
import {
  registryName,
  registryTitle,
  registryMeta,
  REGISTRY_PUBLISHER_KEY,
} from '../interop/servercard.js';
import { dim, fafCyan } from '../ui/colors.js';

export interface ServerCardCommandOptions {
  in?: string;
  out?: string;
  faf?: string;
  setVersion?: string;
  generated?: string;
  check?: boolean;
}

/** Canonical field order for a registry server.json — keeps the emit byte-stable
 *  (idempotent) so a repo's B1 test can assert `--check` output == the live file. */
const FIELD_ORDER = [
  '$schema',
  'name',
  'title',
  'description',
  'icons',
  'version',
  'repository',
  'websiteUrl',
  'packages',
  'remotes',
  '_meta',
] as const;

/**
 * `faf server-card` — inject the EMITTED IDENTITY (name + title + _meta) from
 * project.faf into an existing MCP-registry server.json, preserving every
 * release-managed field (description, icons, version, repository, websiteUrl,
 * packages) verbatim. The single CROSS-LANGUAGE server-card emitter: TS, Python,
 * and Rust builds all call it, so identity is composed from ONE source — never
 * forked per repo. (JS repos may instead import `registryTitle`/`registryName`/
 * `registryMeta` directly; the CLI exists so Python/Rust reach the same source.)
 *
 * Patch-mode by design: it does NOT invent packages/version/sha (those are
 * per-release and per-registry — npm vs pypi vs cargo vs mcpb). Bump the version
 * with --set-version (NOT --version, which is the global CLI-version flag);
 * otherwise the existing value is preserved. --check prints to
 * stdout without writing (the idempotency-test hook).
 */
export function serverCardCommand(options: ServerCardCommandOptions = {}): void {
  const fafPath = options.faf ? resolve(options.faf) : findFafFile();
  if (!fafPath || !existsSync(fafPath)) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }
  const data = readFaf(fafPath);

  const inPath = resolve(options.in ?? './server.json');
  if (!existsSync(inPath)) {
    console.error(
      `Error: ${inPath} not found.\n\n  'faf server-card' patches the identity into an existing registry server.json;\n  it does not create packages/icons. Seed a server.json first, then run this.`,
    );
    process.exit(2);
  }
  const existing = JSON.parse(readFileSync(inPath, 'utf-8')) as Record<string, unknown>;

  // Preserve the release-managed `generated` stamp so the emit stays idempotent
  // (no spurious churn on re-run); --generated overrides it at release time.
  const existingMeta = existing._meta as
    | Record<string, { 'one.faf/context'?: { generated?: string } }>
    | undefined;
  const existingGenerated =
    existingMeta?.[REGISTRY_PUBLISHER_KEY]?.['one.faf/context']?.generated;
  const now = options.generated ?? existingGenerated;

  // Compose the identity from faf-cli's single source.
  const name = registryName(data);
  const title = registryTitle(data);
  const emittedMeta = registryMeta(data, { fafPointer: './project.faf', now });

  // Merge: identity from faf-cli; every other field preserved from the live file.
  const merged: Record<string, unknown> = {
    ...existing,
    name,
    ...(options.setVersion ? { version: options.setVersion } : {}),
    _meta: { ...((existing._meta as object) ?? {}), ...emittedMeta },
  };
  if (title) merged.title = title;
  else delete merged.title; // omit when unset — never ship an empty title

  // Rebuild in canonical order (identity slots land in the right place even if the
  // source file lacked a title); carry any repo-specific extra keys after.
  const ordered: Record<string, unknown> = {};
  for (const k of FIELD_ORDER) {
    if (k in merged && merged[k] !== undefined) ordered[k] = merged[k];
  }
  for (const k of Object.keys(merged)) {
    if (!(k in ordered) && merged[k] !== undefined) ordered[k] = merged[k];
  }

  const json = JSON.stringify(ordered, null, 2) + '\n';
  if (options.check) {
    process.stdout.write(json);
    return;
  }
  const outPath = resolve(options.out ?? inPath);
  writeFileSync(outPath, json);
  console.error(
    `${fafCyan('✓')} ${outPath} — name=${name} title=${title ?? '(none)'} ${dim(
      '(identity emitted from faf-cli)',
    )}`,
  );
}
