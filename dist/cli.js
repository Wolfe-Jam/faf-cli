#!/usr/bin/env node
"use strict";
/**
 * 🚀 .faf CLI - Command Line Interface
 * Universal AI Context Format Tooling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
const commander_1 = require("commander");
Object.defineProperty(exports, "program", { enumerable: true, get: function () { return commander_1.program; } });
const chalk_1 = __importDefault(require("chalk"));
const validate_1 = require("./commands/validate");
const init_1 = require("./commands/init");
const score_1 = require("./commands/score");
const sync_1 = require("./commands/sync");
const audit_1 = require("./commands/audit");
const lint_1 = require("./commands/lint");
const version = require('../package.json').version;
// CLI Header
console.log(chalk_1.default.cyan.bold(`
🚀 .faf CLI v${version}
Universal AI Context Format Tooling
`));
commander_1.program
    .name('faf')
    .description('CLI tools for .faf (Foundational AI-Context Format)')
    .version(version);
// 📊 faf init - Generate initial .faf file
commander_1.program
    .command('init')
    .description('Generate initial .faf file from project structure')
    .option('-f, --force', 'Overwrite existing .faf file')
    .option('-t, --template <type>', 'Use specific template (svelte, react, vue, node)', 'auto')
    .option('-o, --output <file>', 'Output file path', '.faf')
    .action(init_1.initFafFile);
// ✅ faf validate - Validate .faf format
commander_1.program
    .command('validate [file]')
    .description('Validate .faf file against schema')
    .option('-s, --schema <version>', 'Schema version to validate against', 'latest')
    .option('-v, --verbose', 'Show detailed validation results')
    .action(validate_1.validateFafFile);
// 🎯 faf score - Calculate completeness score  
commander_1.program
    .command('score [file]')
    .description('Calculate .faf completeness score (0-100%)')
    .option('-d, --details', 'Show detailed scoring breakdown')
    .option('-m, --minimum <score>', 'Minimum required score', '50')
    .action(score_1.scoreFafFile);
// 🔄 faf sync - Sync with project changes
commander_1.program
    .command('sync [file]')
    .description('Sync .faf with package.json and project changes')
    .option('-a, --auto', 'Automatically apply detected changes')
    .option('-d, --dry-run', 'Show changes without applying')
    .action(sync_1.syncFafFile);
// 🔍 faf audit - Check freshness and completeness
commander_1.program
    .command('audit [file]')
    .description('Audit .faf file for staleness and gaps')
    .option('-w, --warn-days <days>', 'Warn if older than N days', '7')
    .option('-e, --error-days <days>', 'Error if older than N days', '30')
    .action(audit_1.auditFafFile);
// 🔧 faf lint - Format compliance checking
commander_1.program
    .command('lint [file]')
    .description('Lint .faf file for format compliance')
    .option('-f, --fix', 'Automatically fix formatting issues')
    .option('--schema-version <version>', 'Validate against specific schema version')
    .action(lint_1.lintFafFile);
// Handle unknown commands
commander_1.program
    .command('*', { noHelp: true })
    .action((cmd) => {
    console.log(chalk_1.default.red(`❌ Unknown command: ${cmd}`));
    console.log(chalk_1.default.yellow('Run "faf --help" to see available commands'));
    process.exit(1);
});
// Parse CLI arguments
commander_1.program.parse(process.argv);
// Show help if no command provided
if (!process.argv.slice(2).length) {
    commander_1.program.outputHelp();
}
//# sourceMappingURL=cli.js.map