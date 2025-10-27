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
 */

import { runTAFInit } from './taf-init';
import { runTAFLog } from './taf-log';
import { runTAFValidate } from './taf-validate';
import { runTAFStats } from './taf-stats';

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

Examples:
  faf taf init                              # Create .taf file
  faf taf log --total 173 --passed 173 --failed 0
  faf taf log --minimal --total 10 --passed 10 --failed 0
  faf taf validate                          # Check format
  faf taf stats                             # View statistics

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

Learn more: https://faf.one/docs/taf
`);
}
