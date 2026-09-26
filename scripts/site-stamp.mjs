#!/usr/bin/env node
// Stamp the faf-cli page (public/) with the current release.
//
// Reads the version from package.json and the edition + oneliner from the
// top CHANGELOG entry, and writes public/release.json. public/index.html
// shows it as its "Latest" line, so every release updates the page with
// nothing to remember. Vercel runs this as the build (vercel.json).
//
//   node scripts/site-stamp.mjs            → writes public/release.json
//   SITE_STAMP_OUT=/tmp/x.json node …      → writes there instead

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The release a CHANGELOG + version describe: the top `## [x.y.z]` entry. */
export function releaseFrom(changelog, version) {
  const header = changelog.match(/^## \[(\d+\.\d+\.\d+)\][^\n]*$/m);
  if (!header || header[1] !== version) {
    throw new Error(`top CHANGELOG entry (${header?.[1] ?? 'none'}) is not package.json ${version}`);
  }
  const edition = header[0].match(/—\s*(The [^\n]+ Edition)\s*$/)?.[1] ?? null;
  const body = changelog.slice(header.index + header[0].length);
  const bold = body.match(/^\*\*(.+?)\*\*/m);
  const oneliner = bold ? bold[1].replace(/`/g, '').trim() : null;
  const date = header[0].match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  return { version, edition, oneliner, date };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const release = releaseFrom(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), version);
  const out = process.env.SITE_STAMP_OUT ?? join(root, 'public', 'release.json');
  writeFileSync(out, JSON.stringify(release, null, 2) + '\n');
  console.log(`site-stamp: v${release.version}${release.edition ? ` — ${release.edition}` : ''} → ${out}`);
}
