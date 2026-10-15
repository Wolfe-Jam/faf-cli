// Summarise a bun JUnit report: total time, the slowest tests, and any test
// that took 30s or more. Used by the Windows nightly; prints Markdown.
//   node scripts/test-timings.mjs junit.xml [label]
import { readFileSync } from 'fs';

const [file, label = 'Test timings'] = process.argv.slice(2);
const xml = readFileSync(file, 'utf-8');
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const top = xml.match(/<testsuites[^>]*>/)?.[0] ?? '';
const cases = [...xml.matchAll(/<testcase\b[^>]*?(\/>|>[\s\S]*?<\/testcase>)/g)].map(([tag]) => ({
  name: unescape(attr(tag, 'name') ?? '?'),
  file: attr(tag, 'file') ?? '',
  secs: Number(attr(tag, 'time') ?? 0),
  failed: /<failure\b/.test(tag),
  skipped: /<skipped\b/.test(tag),
}));
const ran = cases.filter((c) => !c.skipped);
const slow = [...ran].sort((a, b) => b.secs - a.secs);
const row = (c) => `| ${c.secs.toFixed(1)}s | ${c.failed ? '❌' : '✅'} | ${c.name.replace(/\|/g, '\\|')} | \`${c.file}\` |`;

console.log(`### ${label}`);
console.log('');
console.log(`${ran.length} tests ran in ${Number(attr(top, 'time') ?? 0).toFixed(0)}s · ${cases.filter((c) => c.failed).length} failed · ${cases.length - ran.length} skipped`);
console.log('');
const over = slow.filter((c) => c.secs >= 30);
console.log(over.length ? `**${over.length} test(s) took 30s or more.**` : 'No test took 30s or more.');
console.log('');
console.log('| Time | | Test | File |');
console.log('|---|---|---|---|');
for (const c of slow.slice(0, Math.max(15, over.length))) {console.log(row(c));}
