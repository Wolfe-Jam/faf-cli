/**
 * Cargo.toml interrogation — extract Rust project metadata.
 *
 * The [package].description field is the Rust ecosystem's equivalent of
 * package.json's `description` — a one-line elevator pitch. It maps to
 * `project.goal` (overarching/use-case framing).
 */

import { readRepoFile } from '../core/safe-write.js';
import { cargoField, mainCrate } from '../detect/cargo.js';
import { type ExtractedContext, isValidExtraction } from './types.js';

/** Read the Cargo.toml of the crate that names the project (the root's, or a
 *  workspace member's, #269) and extract per-slot content. Returns {} if
 *  there is none. */
export function interrogateCargo(dir: string): ExtractedContext {
  const crate = mainCrate(dir);
  if (crate === null) {return {};}

  // `description = { workspace = true }`: the member inherits the root's
  // `[workspace.package]` description.
  const inherits = crate.rel !== '' && /^\s*description\s*=\s*\{\s*workspace\s*=\s*true\s*\}/m.test(crate.content);
  const description = inherits
    ? cargoField(readRepoFile(dir, 'Cargo.toml') ?? '', 'description', 'workspace.package')
    : cargoField(crate.content, 'description');
  if (description && isValidExtraction(description)) {
    return { project: { goal: description } };
  }

  return {};
}
