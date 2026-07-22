/**
 * `faf memory` — .fafm soul ops (TS surface, golden-pinned to claude-fafm-sdk 1.0).
 *
 *   faf memory convert <dir> [-o out.fafm] [--namepoint @x]
 *   faf memory ls [--file soul.fafm]
 *   faf memory recall <query> [--file soul.fafm] [--type] [--tag] [--priority] [--limit]
 *   faf memory etch <text> [--id] [--type] [--file soul.fafm]
 *   faf memory show [--file soul.fafm]
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { dim, fafCyan, bold } from '../ui/colors.js';
import { Soul, fromClaudeDir } from '../fafm/index.js';

export interface MemoryOptions {
  file?: string;
  output?: string;
  namepoint?: string;
  id?: string;
  type?: string;
  tag?: string;
  priority?: string;
  limit?: string;
  json?: boolean;
}

function defaultSoulPath(): string {
  return resolve(process.cwd(), 'soul.fafm');
}

function loadSoul(file?: string): Soul {
  const path = resolve(file ?? defaultSoulPath());
  if (!existsSync(path)) {
    console.error(`Error: soul file not found: ${path}\n\n  Run 'faf memory convert <dir>' or 'faf memory etch …' first.`);
    process.exit(2);
  }
  return Soul.load(path);
}

function convertCmd(dir: string | undefined, options: MemoryOptions): void {
  if (!dir) {
    console.error("Error: directory required\n\n  faf memory convert <claude-memory-dir> [-o soul.fafm]");
    process.exit(2);
  }
  const root = resolve(dir);
  try {
    const soul = fromClaudeDir(root, { namepoint: options.namepoint });
    const out = resolve(options.output ?? defaultSoulPath());
    soul.toFile(out);
    console.log(
      `${fafCyan('memory convert')} ${dim('—')} ${soul.facts.length} facts → ${out}`,
    );
    console.log(dim(`  namepoint ${soul.namepoint}  profile ${soul.profile}  index ${soul.index.length}`));
  } catch (e) {
    console.error(`Error: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}

function lsCmd(options: MemoryOptions): void {
  const soul = loadSoul(options.file);
  if (options.json) {
    console.log(JSON.stringify(soul.facts.map((f) => ({
      id: f.id,
      text: f.text,
      type: f.type,
      priority: f.priority,
      tags: f.tags,
    })), null, 2));
    return;
  }
  console.log(`${fafCyan('memory ls')} ${dim(`— ${soul.namepoint} (${soul.facts.length} facts)`)}\n`);
  for (const f of soul.recall()) {
    const id = f.id ? bold(f.id) : dim('(no-id)');
    const meta = [f.type, f.priority].filter(Boolean).join(' · ');
    console.log(`  ${id}  ${f.text.slice(0, 80)}`);
    if (meta) console.log(dim(`         ${meta}`));
  }
}

function recallCmd(query: string | undefined, options: MemoryOptions): void {
  const soul = loadSoul(options.file);
  const tags = options.tag ? options.tag.split(',').map((t) => t.trim()) : undefined;
  const limit = options.limit != null ? parseInt(options.limit, 10) : undefined;
  const hits = soul.recall(query ?? null, {
    tags,
    type: options.type,
    minPriority: options.priority,
    limit: Number.isFinite(limit) ? limit : null,
  });
  if (options.json) {
    console.log(JSON.stringify(hits.map((f) => ({ id: f.id, text: f.text, priority: f.priority })), null, 2));
    return;
  }
  console.log(
    `${fafCyan('memory recall')} ${dim(`— ${hits.length} hit(s)`)}${query ? dim(` for "${query}"`) : ''}\n`,
  );
  for (const f of hits) {
    console.log(`  ${f.id ? bold(f.id) : dim('?')}  ${f.text}`);
  }
}

function etchCmd(text: string | undefined, options: MemoryOptions): void {
  if (!text) {
    console.error('Error: text required\n\n  faf memory etch "a durable fact" [--id slug]');
    process.exit(2);
  }
  const path = resolve(options.file ?? defaultSoulPath());
  const soul = existsSync(path)
    ? Soul.load(path)
    : new Soul(options.namepoint ?? '@local', { profile: 'knowledge' });
  const fact = soul.etch(text, {
    id: options.id,
    type: options.type,
    priority: options.priority,
  });
  soul.toFile(path);
  console.log(`${fafCyan('memory etch')} ${dim('—')} ${fact.id ?? '(no-id)'} → ${path}`);
}

function showCmd(options: MemoryOptions): void {
  const soul = loadSoul(options.file);
  if (options.json) {
    console.log(JSON.stringify(soul.toDoc(), null, 2));
    return;
  }
  console.log(`${fafCyan('memory show')} ${dim(`— ${soul.namepoint}`)}\n`);
  console.log(`  profile     ${soul.profile}`);
  console.log(`  facts       ${soul.facts.length}`);
  console.log(`  index       ${soul.index.length}`);
  console.log(`  created     ${soul.created}`);
  console.log(`  last_etched ${soul.last_etched}`);
  if (soul.index.length) {
    console.log(`\n  ${bold('index')}`);
    for (const line of soul.index.slice(0, 20)) {
      console.log(dim(`    ${line}`));
    }
    if (soul.index.length > 20) console.log(dim(`    … +${soul.index.length - 20} more`));
  }
}

/**
 * `faf memory [subcommand]`
 */
export function memoryCommand(
  subcommand?: string,
  arg?: string,
  options: MemoryOptions = {},
): void {
  // commander may pass options as second arg when no free arg
  if (arg && typeof arg === 'object') {
    options = arg as MemoryOptions;
    arg = undefined;
  }

  switch (subcommand) {
    case 'convert':
      convertCmd(arg, options);
      break;
    case 'ls':
    case 'list':
      lsCmd(options);
      break;
    case 'recall':
      recallCmd(arg, options);
      break;
    case 'etch':
      etchCmd(arg, options);
      break;
    case 'show':
      showCmd(options);
      break;
    case undefined:
    case 'help':
      printHelp();
      break;
    default:
      console.error(`Unknown memory subcommand: ${subcommand}`);
      printHelp();
      process.exit(2);
  }
}

function printHelp(): void {
  console.log(`${fafCyan('faf memory')} ${dim('— .fafm soul ops (knowledge profile)')}\n`);
  console.log('  convert <dir>   Claude Code memory dir → soul.fafm');
  console.log('  etch <text>     Write a fact (creates soul.fafm if needed)');
  console.log('  ls              List facts (ranked)');
  console.log('  recall [query]  Deterministic recall');
  console.log('  show            Soul summary\n');
  console.log(dim('  Options: --file · --output · --namepoint · --id · --type · --tag · --priority · --limit · --json'));
  console.log(dim('  INTEROP: claude-fafm-sdk 1.0 · application/vnd.fafm+yaml v1.1'));
}
