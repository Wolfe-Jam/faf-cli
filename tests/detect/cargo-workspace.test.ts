/**
 * WJTTC — #269: a Cargo workspace takes its name, type and goal suggestion
 * from the member that names the project.
 *
 * The root Cargo.toml of a workspace has `[workspace]` and no `[package]`.
 * The member is the one named like the folder, else the only member, else the
 * one named by the members' common prefix (axum, axum-core → axum).
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { tempDirs } from '../helpers/temp-dirs.js';
import { mainCrate } from '../../src/detect/cargo.js';
import { detectProjectTypeWithRationale } from '../../src/detect/scanner.js';
import { detectStack } from '../../src/detect/stack.js';
import { interrogateCargo } from '../../src/interrogate/cargo.js';
import { suggestIntent } from '../../src/core/suggest.js';

const temp = tempDirs();
afterAll(() => temp.removeAll());

function repo(files: Record<string, string>, folder = 'repo'): string {
  const root = realpathSync(temp.mkdtemp(join(tmpdir(), 'faf-cargo-ws-')));
  const dir = join(root, folder);
  mkdirSync(dir);
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), text);
  }
  return dir;
}

const crate = (name: string, description?: string) =>
  `[package]\nname = "${name}"\nversion = "0.1.0"\n${description ? `description = "${description}"\n` : ''}`;

/** axum's shape at bfa6686: a glob member list, the main crate a library. */
const AXUM = {
  'Cargo.toml': '[workspace]\nmembers = ["axum", "axum-*"]\nresolver = "2"\n',
  'axum/Cargo.toml': crate('axum', 'HTTP routing and request handling library that focuses on ergonomics and modularity'),
  'axum/src/lib.rs': '',
  'axum-core/Cargo.toml': crate('axum-core', 'Core types and traits for axum'),
  'axum-core/src/lib.rs': '',
  'axum-extra/Cargo.toml': crate('axum-extra'),
  'axum-extra/src/lib.rs': '',
};

describe('BRAKE: a Cargo workspace reads the member that names the project (#269)', () => {
  test('axum: name, library type with its # found:, and the Cargo.toml description as the goal suggestion', () => {
    const dir = repo(AXUM, 'axum-try');
    expect(mainCrate(dir)?.rel).toBe('axum');
    const { type, found } = detectProjectTypeWithRationale(dir);
    expect(type).toBe('library');
    expect(found).toContain('axum/Cargo.toml (workspace member axum): src/lib.rs');
    expect((detectStack(dir) as { project: { name: string } }).project.name).toBe('axum');
    expect(interrogateCargo(dir).project?.goal).toBe('HTTP routing and request handling library that focuses on ergonomics and modularity');
    expect(suggestIntent(dir)['project.goal']?.value).toBe('HTTP routing and request handling library that focuses on ergonomics and modularity');
  });

  test('the member named like the folder wins over the common prefix', () => {
    const dir = repo({
      'Cargo.toml': '[workspace]\nmembers = [\n  "crates/*",  # every crate\n]\n',
      'crates/tool-core/Cargo.toml': crate('tool-core'),
      'crates/mytool/Cargo.toml': crate('mytool', 'A tool that does one thing well'),
      'crates/mytool/src/lib.rs': '',
    }, 'mytool');
    expect(mainCrate(dir)?.name).toBe('mytool');
    expect(detectProjectTypeWithRationale(dir).found).toContain('crates/mytool/Cargo.toml (workspace member mytool): src/lib.rs');
  });

  test('the only member is the project; its [[bin]] makes it a cli', () => {
    const dir = repo({
      'Cargo.toml': '[workspace]\nmembers = ["app"]\n',
      'app/Cargo.toml': `${crate('ripper')}\n[[bin]]\nname = "ripper"\npath = "src/main.rs"\n`,
    });
    const { type, found } = detectProjectTypeWithRationale(dir);
    expect(type).toBe('cli');
    expect(found).toContain('app/Cargo.toml (workspace member ripper) [[bin]]');
    expect((detectStack(dir) as { project: { name: string } }).project.name).toBe('ripper');
  });

  test('no member names the project: the fallback stays, the folder name stays', () => {
    const dir = repo({
      'Cargo.toml': '[workspace]\nmembers = ["alpha", "beta"]\n',
      'alpha/Cargo.toml': crate('alpha'),
      'beta/Cargo.toml': crate('beta'),
    }, 'mixed');
    expect(mainCrate(dir)).toBeNull();
    expect(detectProjectTypeWithRationale(dir).found.join(' ')).toContain('fallback');
    expect((detectStack(dir) as { project: { name: string } }).project.name).toBe('mixed');
  });

  test('a member outside the project (.. or a link out) is not read', () => {
    const outside = repo({ 'Cargo.toml': crate('secret-crate', 'Not part of this project') }, 'outside');
    const dir = repo({
      'Cargo.toml': '[workspace]\nmembers = ["../outside", "linked"]\n',
    });
    symlinkSync(outside, join(dir, 'linked'));
    expect(mainCrate(dir)).toBeNull();
    expect(interrogateCargo(dir)).toEqual({});
  });
});

describe('ENGINE: a single crate reads its own Cargo.toml', () => {
  test('a library crate: its name, and src/lib.rs as the evidence, not the fallback', () => {
    const dir = repo({ 'Cargo.toml': crate('tiny-parse', 'Parse tiny config files'), 'src/lib.rs': '' }, 'checkout');
    const { type, found } = detectProjectTypeWithRationale(dir);
    expect(type).toBe('library');
    expect(found).toContain('Cargo.toml: src/lib.rs');
    expect((detectStack(dir) as { project: { name: string } }).project.name).toBe('tiny-parse');
  });

  test('src/main.rs beside src/lib.rs: no library claim from the crate kind', () => {
    const dir = repo({ 'Cargo.toml': crate('both'), 'src/lib.rs': '', 'src/main.rs': '' });
    expect(detectProjectTypeWithRationale(dir).found.some(f => f.includes('src/lib.rs'))).toBe(false);
  });

  test('a root with [package] and [workspace] is its own project', () => {
    const dir = repo({
      'Cargo.toml': `${crate('rootcrate', 'The root crate')}\n[workspace]\nmembers = ["sub"]\n`,
      'sub/Cargo.toml': crate('sub'),
    });
    expect(mainCrate(dir)?.rel).toBe('');
    expect(mainCrate(dir)?.name).toBe('rootcrate');
  });

  test('a member that inherits its description takes the workspace\'s, never the literal `{ workspace = true }`', () => {
    const inherit = repo({
      'Cargo.toml': '[workspace]\nmembers = ["tool"]\n\n[workspace.package]\ndescription = "One tool for the whole workspace"\n',
      'tool/Cargo.toml': '[package]\nname = "tool"\ndescription = { workspace = true }\n',
    });
    expect(interrogateCargo(inherit).project?.goal).toBe('One tool for the whole workspace');
    const none = repo({
      'Cargo.toml': '[workspace]\nmembers = ["tool"]\n',
      'tool/Cargo.toml': '[package]\nname = "tool"\ndescription = { workspace = true }\n',
    });
    expect(interrogateCargo(none)).toEqual({});
  });
});
