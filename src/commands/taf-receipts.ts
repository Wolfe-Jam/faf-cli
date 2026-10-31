import { spawnSync } from 'child_process';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { bold, dim, fafCyan } from '../ui/colors.js';

/** One Test Receipt as `faf taf receipts` shows it. Counts are null when an
 *  older, hand-written receipt didn't record them. */
export interface Receipt {
  timestamp: string;
  result: string;
  passed: number | null;
  failed: number | null;
  skipped: number | null;
  total: number | null;
  trigger: string | null;
}

export interface ReceiptsOptions {
  limit?: string | number;
  json?: boolean;
  ref?: string;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);

/** One test_history entry as a Receipt, or null when it has no timestamp. */
function toReceipt(raw: unknown): Receipt | null {
  if (typeof raw !== 'object' || raw === null) {return null;}
  const r = raw as Record<string, unknown>;
  const timestamp = r.timestamp instanceof Date ? r.timestamp.toISOString() : str(r.timestamp);
  if (!timestamp) {return null;}
  const t = (typeof r.tests === 'object' && r.tests !== null ? r.tests : {}) as Record<string, unknown>;
  return {
    timestamp,
    result: str(r.result) ?? 'UNKNOWN',
    passed: num(t.passed),
    failed: num(t.failed),
    skipped: num(t.skipped),
    total: num(t.total),
    trigger: str(r.trigger),
  };
}

/** The receipts in a .taf, newest first. Entries without a timestamp are left out. */
export function receiptsFrom(tafYaml: string): { project: string | null; receipts: Receipt[] } {
  const doc = parse(tafYaml) as Record<string, unknown> | null;
  const history: unknown[] = Array.isArray(doc?.test_history) ? doc.test_history : [];
  const receipts = history.map(toReceipt).filter((r): r is Receipt => r !== null);
  // By time, not by text: hand-written receipts mix offsets and formats.
  // A timestamp that isn't a date goes last.
  const at = (r: Receipt) => Date.parse(r.timestamp);
  receipts.sort((a, b) => (Number.isNaN(at(b)) ? -Infinity : at(b)) - (Number.isNaN(at(a)) ? -Infinity : at(a)) || b.timestamp.localeCompare(a.timestamp));
  return { project: str(doc?.project), receipts };
}

/** Where the receipts are: a git ref's .taf (fetched by you, never by faf),
 *  else a .taf in this folder. */
function readTaf(dir: string, ref?: string): { text: string; source: string } | null {
  const refs = ref ? [ref] : ['origin/taf-receipts', 'taf-receipts'];
  for (const r of refs) {
    // --end-of-options: a ref is never read as a git option (--output= writes a file).
    // GIT_NO_LAZY_FETCH: a partial clone fetches a missing blob otherwise (git 2.44+).
    const out = spawnSync('git', ['show', '--end-of-options', `${r}:.taf`], {
      cwd: dir, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, GIT_NO_LAZY_FETCH: '1' },
    });
    if (out.status === 0 && typeof out.stdout === 'string') {return { text: out.stdout, source: r };}
  }
  const local = join(dir, '.taf');
  if (!ref && statSync(local, { throwIfNoEntry: false })?.isFile()) {return { text: readFileSync(local, 'utf-8'), source: '.taf' };}
  return null;
}

/** The time in UTC, to the minute; a date-only or unreadable stamp as written. */
const day = (stamp: string) => {
  const t = Date.parse(stamp);
  if (/^\d{4}-\d{2}-\d{2}$/.test(stamp) || Number.isNaN(t)) {return stamp;}
  return new Date(t).toISOString().replace('T', ' ').slice(0, 16);
};
const counts = (r: Receipt) => {
  if (r.passed === null || r.total === null) {return '—';}
  const extra = [r.failed ? `${r.failed} failed` : '', r.skipped ? `${r.skipped} skipped` : ''].filter(Boolean).join(', ');
  return `${r.passed}/${r.total}${extra ? `  ${extra}` : ''}`;
};

/** --limit: a whole number, 1 or more (default 10). Anything else is one line and exit 1. */
function limitOf(raw: string | number | undefined): number {
  const limit = raw === undefined ? 10 : Number(raw);
  if (!Number.isInteger(limit) || limit < 1) {
    console.error(`${bold('×')} --limit takes a whole number, 1 or more.`);
    process.exit(1);
  }
  return limit;
}

/** The receipts in the .taf found, or one line and exit 1. */
function loadReceipts(dir: string, ref?: string): { source: string; project: string | null; receipts: Receipt[] } {
  if (ref?.startsWith('-')) {
    console.error(`${bold('×')} --ref takes a git ref, not an option: ${ref}`);
    process.exit(1);
  }
  const found = readTaf(dir, ref);
  if (!found) {
    const where = ref ? `${ref}:.taf` : 'origin/taf-receipts, taf-receipts or ./.taf';
    console.error(`${bold('×')} No receipts found (looked in ${where}). Fetch them: git fetch origin taf-receipts`);
    process.exit(1);
  }
  try {
    return { source: found.source, ...receiptsFrom(found.text) };
  } catch (e) {
    console.error(`${bold('×')} ${found.source}: the .taf is not YAML faf can read (${(e as Error).message.split('\n')[0]})`);
    process.exit(1);
  }
}

function printReceipts(source: string, project: string | null, total: number, shown: Receipt[]): void {
  const name = project ? ` — ${project}` : '';
  console.log(`${fafCyan('TAF receipts')}${name} ${dim(`· ${total} on ${source} · times in UTC`)}`);
  if (shown.length === 0) {
    console.log(dim('  no receipts yet'));
    return;
  }
  for (const r of shown) {
    console.log(`  ${day(r.timestamp)}  ${r.result.padEnd(8)}  ${counts(r)}`);
  }
  const tally = new Map<string, number>();
  for (const r of shown) {tally.set(r.result, (tally.get(r.result) ?? 0) + 1);}
  console.log(dim(`  last ${shown.length}: ${[...tally].map(([k, n]) => `${n} ${k}`).join(' · ')}`));
  if (source.startsWith('origin/')) {
    console.log(dim('  as of your last fetch (git fetch origin taf-receipts)'));
  }
}

/** `faf taf receipts` — the Test Receipts in your terminal, newest first. */
export function tafReceipts(options: ReceiptsOptions = {}): void {
  const limit = limitOf(options.limit);
  const { source, project, receipts } = loadReceipts(process.cwd(), options.ref);
  const shown = receipts.slice(0, limit);
  if (options.json) {
    console.log(JSON.stringify({ source, project, total: receipts.length, receipts: shown }, null, 2));
    return;
  }
  printReceipts(source, project, receipts.length, shown);
}
