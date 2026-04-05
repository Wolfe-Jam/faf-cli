import { Command } from 'commander';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fafCyan, bold } from '../ui/colors.js';

export function bunUpdateCommand() {
  return new Command('bun-update')
    .alias('update')
    .description('Update Bun runtime and dependencies')
    .action(async () => {
      console.log(`${fafCyan('🏎️')}  Running Bun update routine...`);
      
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const scriptPath = join(__dirname, '../../scripts/bun-update.ts');
      
      const proc = spawn('bun', [scriptPath], {
        stdio: 'inherit',
        cwd: join(__dirname, '../..')
      });
      
      proc.on('error', (error) => {
        console.error(`Failed to run update: ${error.message}`);
        console.log(`\nTry running: ${bold('bun scripts/bun-update.ts')}`);
        process.exit(1);
      });
      
      proc.on('exit', (code) => {
        if (code !== 0) {
          process.exit(code || 1);
        }
      });
    });
}