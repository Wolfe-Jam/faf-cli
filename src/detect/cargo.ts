/**
 * The crate that names a Rust project (#269).
 *
 * A single crate: the root Cargo.toml's `[package]`. A Cargo workspace root
 * has `[workspace]` and no `[package]`, so the project's name, description
 * and crate kind live in a member. The member that names the project is the
 * one whose `name` is the folder's name, else the only member, else the one
 * named by the members' common prefix (axum, axum-core, axum-extra → axum).
 * No such member: null, and detection falls back as before.
 *
 * Reads go through the repo-file helpers: a member reached by a link out of
 * the project is not seen.
 */

import { basename, join, posix } from 'path';
import { readRepoDir, readRepoFile, repoExists } from '../core/safe-write.js';

export interface CargoCrate {
  /** The crate's folder, relative to the project ('' for the root). */
  rel: string;
  /** Its Cargo.toml text. */
  content: string;
  /** `[package].name`, or null. */
  name: string | null;
}

/** The lines of one TOML table (`[package]`, `[workspace]`), without its header. */
function tableText(content: string, table: string): string | null {
  const lines = content.split('\n');
  let inTable = false;
  let seen = false;
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\[/.test(trimmed)) {
      inTable = trimmed.replace(/\s*#.*$/, '') === `[${table}]`;
      seen ||= inTable;
      continue;
    }
    if (inTable) {out.push(line);}
  }
  return seen ? out.join('\n') : null;
}

/** One string field of a TOML table: `field = "value"` on one line. */
export function cargoField(content: string, field: string, table = 'package'): string | null {
  const text = tableText(content, table);
  if (text === null) {return null;}
  for (const line of text.split('\n')) {
    const m = line.trim().match(new RegExp(`^${field}\\s*=\\s*(.+)$`));
    if (!m) {continue;}
    const value = m[1].trim().replace(/\s*#.*$/, '').trim();
    const quoted = value.match(/^"((?:[^"\\]|\\.)*)"$/) || value.match(/^'((?:[^'\\]|\\.)*)'$/);
    return quoted ? quoted[1] : value;
  }
  return null;
}

/** `[workspace] members = [...]`, as written (paths or one-level globs). */
function workspaceMembers(content: string): string[] {
  const text = tableText(content, 'workspace');
  if (text === null) {return [];}
  const m = text.match(/^\s*members\s*=\s*\[([\s\S]*?)\]/m);
  if (!m) {return [];}
  return [...m[1].replace(/#.*$/gm, '').matchAll(/"([^"]+)"|'([^']+)'/g)].map(x => x[1] ?? x[2]);
}

/** A member pattern → the folders it names. A `*` is expanded in the last
 *  segment only; `..` and absolute paths are not followed. */
function expandMember(dir: string, pattern: string): string[] {
  const p = posix.normalize(pattern.replace(/\\/g, '/')).replace(/\/$/, '');
  if (p.startsWith('/') || p === '..' || p.startsWith('../')) {return [];}
  if (!p.includes('*')) {return [p];}
  const parent = posix.dirname(p);
  const last = posix.basename(p);
  if (parent.includes('*')) {return [];}
  const re = new RegExp(`^${last.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
  const entries = readRepoDir(dir, parent === '.' ? '.' : parent) ?? [];
  return entries
    .filter(e => re.test(e.name) && !e.name.startsWith('.'))
    .map(e => (parent === '.' ? e.name : `${parent}/${e.name}`))
    .sort();
}

/** The longest common prefix of the names, cut back to a whole word. */
function commonPrefix(names: string[]): string {
  let prefix = names[0] ?? '';
  for (const n of names.slice(1)) {
    while (prefix && !n.startsWith(prefix)) {prefix = prefix.slice(0, -1);}
  }
  return prefix.replace(/[-_]+$/, '');
}

/** The workspace members of `root` that are crates, in member order. */
function workspaceCrates(dir: string, root: string): CargoCrate[] {
  const members: CargoCrate[] = [];
  for (const pattern of workspaceMembers(root)) {
    for (const rel of expandMember(dir, pattern)) {
      const content = readRepoFile(dir, join(rel, 'Cargo.toml'));
      if (content === null || tableText(content, 'package') === null || members.some(m => m.rel === rel)) {continue;}
      members.push({ rel, content, name: cargoField(content, 'name') });
    }
  }
  return members;
}

/** The member named like the folder, else the only one, else the one the
 *  common prefix names. */
function pickMember(dir: string, members: CargoCrate[]): CargoCrate | null {
  const named = members.filter(m => m.name);
  if (named.length === 0) {return null;}
  const folder = basename(dir);
  const prefix = commonPrefix(named.map(n => n.name as string));
  return named.find(m => m.name === folder)
    ?? (named.length === 1 ? named[0] : named.find(m => m.name === prefix))
    ?? null;
}

/** The crate that names the project in `dir`, or null (see the file header). */
export function mainCrate(dir: string): CargoCrate | null {
  const root = readRepoFile(dir, 'Cargo.toml');
  if (root === null) {return null;}
  if (tableText(root, 'package') !== null) {
    return { rel: '', content: root, name: cargoField(root, 'name') };
  }
  return pickMember(dir, workspaceCrates(dir, root));
}

/** Where a fact came from, for `# found:`: `Cargo.toml` for a single crate,
 *  `axum/Cargo.toml (workspace member axum)` for a member. */
export function crateSource(crate: CargoCrate): string {
  return crate.rel ? `${crate.rel}/Cargo.toml (workspace member ${crate.name})` : 'Cargo.toml';
}

/** The crate declares a `[[bin]]`. */
export function crateHasBin(crate: CargoCrate): boolean {
  return /^\s*\[\[bin\]\]/m.test(crate.content);
}

/** The crate is a library: `src/lib.rs` or a `[lib]` table. */
export function crateIsLib(dir: string, crate: CargoCrate): string | null {
  if (repoExists(dir, join(crate.rel, 'src/lib.rs'))) {return 'src/lib.rs';}
  if (/^\s*\[lib\]/m.test(crate.content)) {return '[lib]';}
  return null;
}
