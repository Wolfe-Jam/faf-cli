/**
 * faf taf - Testing Activity Feed commands
 *
 * Git-friendly testing timeline - automatic test logging
 *
 * Commands:
 * - faf taf init       Initialize .taf file
 * - faf taf log        Log a test run
 * - faf taf validate   Validate .taf format
 * - faf taf stats      Show test statistics
 * - faf taf stars      Star rating and badge
 */

import { runTAFInit } from './taf-init';
import { runTAFLog } from './taf-log';
import { runTAFValidate } from './taf-validate';
import { runTAFStats } from './taf-stats';
import { runTAFStars } from './taf-stars';

export async function tafCommand(args: string[]): Promise<void> {
  const subcommand = args[0];
  const subcommandArgs = args.slice(1);

  switch (subcommand) {
    case 'init':
      await runTAFInit(subcommandArgs);
      break;

    case 'log':
      await runTAFLog(subcommandArgs);
      break;

    case 'validate':
      await runTAFValidate();
      break;

    case 'stats':
      await runTAFStats();
      break;

    case 'stars':
      await runTAFStars(subcommandArgs);
      break;

    case undefined:
    case 'help':
    case '--help':
    case '-h':
      showTAFHelp();
      break;

    default:
      console.error(`❌ Unknown taf command: ${subcommand}`);
      console.log('\nAvailable commands:');
      showTAFHelp();
      process.exit(1);
  }
}

function showTAFHelp(): void {
  console.log(`
📊 faf taf - Testing Activity Feed

Commands:
  faf taf init              Initialize .taf file
  faf taf log               Log a test run
  faf taf validate          Validate .taf format
  faf taf stats             Show test statistics
  faf taf stars             Star rating and badge

Examples:
  faf taf init                              # Create .taf file
  npm test | faf taf log                    # Auto-parse Jest/Vitest output
  faf taf log --total 173 --passed 173 --failed 0
  faf taf log --minimal --total 10 --passed 10 --failed 0
  faf taf validate                          # Check format
  faf taf stats                             # View statistics
  faf taf stars                             # Star rating
  faf taf stars --output stars.svg          # Generate badge

Options:
  faf taf init:
    --project <name>      Project name (default: from package.json)
    --force, -f           Overwrite existing .taf

  faf taf log:
    --total <n>           Total test count (required)
    --passed <n>          Passing test count (required)
    --failed <n>          Failed test count (required)
    --skipped <n>         Skipped test count
    --minimal, -m         Use minimal mode (5-10 lines)
    --command <cmd>       Test command used
    --trigger <text>      What triggered the run
    --issues <list>       Comma-separated issues
    --root-cause <text>   Root cause analysis
    --resolution <text>   How it was fixed
    --env-variance <type> Environment variance type (see below)
    --env-notes <text>    Additional environment notes

  Environment variance types:
    background_execution  Test running in background shell
    unstable_cwd          Working directory changing during test
    missing_dependencies  Required dependencies not found
    parallel_execution    Tests running in parallel when sequential expected
    resource_contention   System resources constrained
    network_unavailable   Network-dependent tests without network
    timing_sensitive      Race conditions or timing issues
    other                 Custom variance

Learn more: https://faf.one/docs/taf
`);
}
