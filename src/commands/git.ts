import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { detectStack } from '../detect/stack.js';
import { writeFaf, readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { dim, fafCyan } from '../ui/colors.js';

/** Extract goal from README — first meaningful description line after the title */
function extractGoal(dir: string): string {
  const candidates = ['README.md', 'README.MD', 'readme.md', 'Readme.md'];
  let content = '';
  for (const name of candidates) {
    const p = join(dir, name);
    if (existsSync(p)) { content = readFileSync(p, 'utf-8'); break; }
  }
  if (!content) return '';

  const lines = content.split('\n');
  let pastTitle = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // Skip the title heading
    if (line.startsWith('# ') && !pastTitle) { pastTitle = true; continue; }
    // Skip badges, shields, HTML tags, sub-headings, table rows
    if (line.startsWith('![') || line.startsWith('<') || line.startsWith('|') ||
        line.startsWith('#') || line.startsWith('[![') || line.startsWith('---')) continue;
    // First real sentence — cap at 120 chars
    const clean = line.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').trim();
    if (clean.length > 10) return clean.slice(0, 120);
  }
  return '';
}

/** Detect build tool from repo files */
function detectBuild(dir: string): string {
  if (existsSync(join(dir, 'Dockerfile')) || existsSync(join(dir, 'docker-compose.yml'))) return 'Docker';
  if (existsSync(join(dir, 'Makefile'))) return 'make';
  if (existsSync(join(dir, 'go.mod'))) return 'go build';
  if (existsSync(join(dir, 'Cargo.toml'))) return 'cargo build';
  if (existsSync(join(dir, 'pyproject.toml'))) return 'pip / uv';
  return '';
}

/** Enrich detected data with README-derived fields */
function enrichFromRepo(data: Record<string, unknown>, dir: string): Record<string, unknown> {
  const project = (data.project ?? {}) as Record<string, unknown>;
  const stack = (data.stack ?? {}) as Record<string, unknown>;

  // goal — fill if empty
  if (!project.goal) {
    const goal = extractGoal(dir);
    if (goal) project.goal = goal;
  }

  // build — fill if empty
  if (!stack.build || stack.build === '') {
    const build = detectBuild(dir);
    if (build) stack.build = build;
  }

  // database/connection — slotignored for MCP servers (no database needed)
  if (project.type === 'mcp') {
    if (!stack.database || stack.database === '') stack.database = 'slotignored';
    if (!stack.connection || stack.connection === '') stack.connection = 'slotignored';
  }

  return { ...data, project, stack };
}

function runGit(cloneDir: string, outputPath: string, url: string): void {
  const repoUrl = url.endsWith('.git') ? url : `${url}.git`;
  console.log(dim(`cloning ${url}...`));
  execSync(`git clone --depth 1 ${repoUrl} ${cloneDir}`, { stdio: 'pipe' });

  const raw = detectStack(cloneDir);
  const data = enrichFromRepo(raw as Record<string, unknown>, cloneDir);
  writeFaf(outputPath, data);

  console.log(`${fafCyan('created')} ${outputPath}`);

  const yaml = readFafRaw(outputPath);
  const result = enrichScore(kernel.score(yaml));
  displayScore(result, outputPath);
}

export function gitCommand(url: string, options: { keep?: boolean } = {}): void {
  if (!url) {
    console.error('Error: Please provide a GitHub URL.\n\n  Usage: faf git <url>');
    process.exit(1);
  }

  const repoName = basename(url.replace(/\.git$/, ''));

  if (options.keep) {
    // --keep: clone into cwd/repo-name, keep full repo for faf auto / faf go
    const cloneDir = join(process.cwd(), repoName);
    mkdirSync(cloneDir, { recursive: true });
    runGit(cloneDir, join(cloneDir, 'project.faf'), url);
    console.log(dim(`\n  cd ${repoName} && faf go`));
  } else {
    // Default: clone to tmp, enrich from README, write project.faf in cwd, clean up
    const tmpDir = join(tmpdir(), `faf-git-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tmpDir, { recursive: true });
    try {
      runGit(tmpDir, join(process.cwd(), 'project.faf'), url);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}
