// Run the test suite one file at a time, each under a hard time limit (#167).
// Used by the Windows nightly. A test that starts a child process with
// execSync blocks bun itself, so bun's own per-test limit can't fire when that
// child hangs; a limit on the whole file can. A file that runs out of time is
// killed, reported by name, and the next file runs.
//   node scripts/test-per-file.mjs [file ...]   (default: every tests/**/*.test.ts)
//   FAF_TEST_FILE_LIMIT_MS   the limit per file (default 300000, 5 minutes)
// Writes junit.xml (all files merged) after every file, so a run that is cut
// off still leaves a report. Exits 1 if any file failed or ran out of time.
import { spawn, spawnSync } from 'child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join, relative } from 'path';

const limit = Number(process.env.FAF_TEST_FILE_LIMIT_MS) || 300_000;
const outDir = 'junit-files';

function testFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? testFiles(join(dir, e.name)) : e.name.endsWith('.test.ts') ? [join(dir, e.name)] : []))
    .sort();
}

/** Stop a file's bun and every process it started. Returns what the kill reported. */
function killTree(child) {
  if (process.platform === 'win32') {
    const r = spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { encoding: 'utf-8', timeout: 30_000 });
    return `taskkill exit ${r.status ?? r.error?.code}: ${(r.stdout + r.stderr).trim().replace(/\s+/g, ' ') || '(no output)'}`;
  }
  try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
  return 'SIGKILL sent';
}

// After the kill, how long to wait for the process to confirm it exited. The
// 10-16 nightly showed a bun that printed its summary and never exited, and a
// kill that never confirmed; the runner waited on it until the step limit. So
// after this grace the runner moves on whether or not the exit arrives.
const KILL_GRACE_MS = 15_000;

function runFile(file, out) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('bun', ['test', `./${file}`, '--timeout=600000', '--reporter=junit', `--reporter-outfile=${out}`], {
      stdio: 'inherit',
      detached: process.platform !== 'win32',
    });
    let hung = false;
    let done = false;
    const finish = (code) => {
      if (done) {return;}
      done = true;
      clearTimeout(timer);
      // A report on disk means bun ran the tests and then didn't exit.
      resolve({ file, code, hung, reported: existsSync(out), secs: (Date.now() - started) / 1000 });
    };
    const timer = setTimeout(() => {
      hung = true;
      console.log(`\nHUNG (#167): ${file} did not finish within ${limit / 1000}s; killing it`);
      console.log(`  ${killTree(child)}`);
      setTimeout(() => {
        if (!done) {console.log(`  no exit within ${KILL_GRACE_MS / 1000}s of the kill; moving on without it`);}
        finish(null);
      }, KILL_GRACE_MS);
    }, limit);
    child.on('exit', (code) => finish(code));
  });
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One junit.xml from the files run so far; a file that ran out of time is one failed test. */
function writeReport(results) {
  let tests = 0, failures = 0, time = 0;
  const suites = results.map((r) => {
    time += r.secs;
    const out = join(outDir, `${r.index}.xml`);
    if (!r.hung && existsSync(out)) {
      const xml = readFileSync(out, 'utf-8');
      tests += (xml.match(/<testcase\b/g) ?? []).length;
      failures += (xml.match(/<failure\b/g) ?? []).length;
      return (xml.match(/<testsuite\b[\s\S]*<\/testsuite>/) ?? [''])[0];
    }
    tests += 1; failures += 1;
    const why = r.hung
      ? (r.reported ? `ran its tests but did not exit within ${limit / 1000}s (#167)` : `did not finish within ${limit / 1000}s (#167)`)
      : `exited ${r.code} without a report`;
    return `<testsuite name="${esc(r.file)}" tests="1" failures="1" time="${r.secs}">` +
      `<testcase name="${esc(`${r.file} ${why}`)}" file="${esc(r.file)}" time="${r.secs}"><failure message="${esc(why)}"/></testcase></testsuite>`;
  });
  writeFileSync('junit.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites name="bun test" tests="${tests}" failures="${failures}" time="${time}">\n${suites.join('\n')}\n</testsuites>\n`);
}

const files = process.argv.length > 2 ? process.argv.slice(2) : testFiles('tests');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const results = [];
for (const [index, file] of files.entries()) {
  const rel = relative('.', file).replace(/\\/g, '/');
  const r = { index, ...(await runFile(rel, join(outDir, `${index}.xml`))) };
  results.push(r);
  writeReport(results);
}

const hung = results.filter((r) => r.hung);
const failed = results.filter((r) => !r.hung && r.code !== 0);
console.log(`\n${results.length} test files · ${failed.length} failed · ${hung.length} ran out of time`);
for (const r of hung) {console.log(`  hung:   ${r.file}`);}
for (const r of failed) {console.log(`  failed: ${r.file}`);}
process.exit(hung.length || failed.length ? 1 : 0);
