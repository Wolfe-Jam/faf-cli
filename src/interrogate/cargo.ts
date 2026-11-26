/**
 * Cargo.toml interrogation — extract Rust project metadata.
 *
 * The [package].description field is the Rust ecosystem's equivalent of
 * package.json's `description` — a one-line elevator pitch. It maps to
 * `project.goal` (overarching/use-case framing).
 */

import { cargoField, mainCrate } from '../detect/cargo.js';
import { type ExtractedContext, isValidExtraction } from './types.js';

/** Read the Cargo.toml of the crate that names the project (the root's, or a
 *  workspace member's, #269) and extract per-slot content. Returns {} if
 *  there is none. */
export function interrogateCargo(dir: string): ExtractedContext {
  const crate = mainCrate(dir);
  if (crate === null) {return {};}

  const description = cargoField(crate.content, 'description');
  if (description && isValidExtraction(description)) {
    return { project: { goal: description } };
  }

  return {};
}
