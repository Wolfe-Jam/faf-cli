import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { findFafFile, readFaf, writeFaf } from '../interop/faf.js';
import { parse } from 'yaml';
import { fafCyan, dim, bold } from '../ui/colors.js';
import type { FafData } from '../core/types.js';

/** Conductor integration — import/export conductor config */
export function conductorCommand(subcommand?: string, path?: string): void {
  if (subcommand === 'import') {
    conductorImport(path);
  } else if (subcommand === 'export') {
    conductorExport();
  } else {
    console.log(`${fafCyan('conductor')} ${dim('— conductor integration')}\n`);
    console.log(`  ${bold('faf conductor import <path>')} ${dim('— import conductor config into .faf')}`);
    console.log(`  ${bold('faf conductor export')} ${dim('— generate conductor config from .faf')}`);
  }
}

function conductorImport(configPath?: string): void {
  if (!configPath) {
    console.error('Usage: faf conductor import <path>');
    process.exit(2);
  }

  if (!existsSync(configPath)) {
    console.error(`Error: path not found: ${configPath}`);
    process.exit(2);
  }

  const data: FafData = { faf_version: '2.5.0', project: {} };

  // Try to read YAML/JSON files from the config directory or file
  if (existsSync(configPath) && configPath.endsWith('.json')) {
    const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (raw.name) {data.project!.name = raw.name;}
    if (raw.description) {data.project!.goal = raw.description;}
    if (raw.language) {data.project!.main_language = raw.language;}
  } else if (existsSync(configPath) && (configPath.endsWith('.yml') || configPath.endsWith('.yaml'))) {
    const raw = parse(readFileSync(configPath, 'utf-8'));
    if (raw.name) {data.project!.name = raw.name;}
    if (raw.description) {data.project!.goal = raw.description;}
    if (raw.language) {data.project!.main_language = raw.language;}
  } else {
    // Directory: scan for config files
    try {
      const files = readdirSync(configPath);
      for (const file of files) {
        const filePath = join(configPath, file);
        if (file.endsWith('.json')) {
          try {
            const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
            if (raw.name && !data.project!.name) {data.project!.name = raw.name;}
            if (raw.description && !data.project!.goal) {data.project!.goal = raw.description;}
          } catch { /* skip malformed files */ }
        }
      }
    } catch {
      console.error(`Error: could not read directory: ${configPath}`);
      process.exit(2);
    }
  }

  // Merge into existing .faf or create new
  const dir = process.cwd();
  const existing = findFafFile(dir);
  if (existing) {
    const prev = readFaf(existing);
    if (!prev.project) {prev.project = {};}
    if (data.project!.name && !prev.project.name) {prev.project.name = data.project!.name;}
    if (data.project!.goal && !prev.project.goal) {prev.project.goal = data.project!.goal;}
    if (data.project!.main_language && !prev.project.main_language) {prev.project.main_language = data.project!.main_language;}
    writeFaf(existing, prev);
    console.log(`${fafCyan('◆')} conductor import  merged into ${existing}`);
  } else {
    const outPath = join(dir, 'project.faf');
    writeFaf(outPath, data);
    console.log(`${fafCyan('◆')} conductor import  created ${outPath}`);
  }
}

function conductorExport(): void {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const data = readFaf(fafPath);

  const config = {
    name: data.project?.name ?? '',
    description: data.project?.goal ?? '',
    language: data.project?.main_language ?? '',
    stack: data.stack ?? {},
  };

  console.log(JSON.stringify(config, null, 2));
}
