import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
    console.log('FAF - AI Context Manager extension is now active!');

    // Check if .faf file exists in workspace
    updateFafContext();

    // Watch for .faf file changes
    const watcher = vscode.workspace.createFileSystemWatcher('**/.faf');
    watcher.onDidCreate(() => updateFafContext());
    watcher.onDidDelete(() => updateFafContext());
    watcher.onDidChange(() => updateFafContext());

    // Register commands
    const commands = [
        vscode.commands.registerCommand('faf.init', initProject),
        vscode.commands.registerCommand('faf.score', checkScore),
        vscode.commands.registerCommand('faf.trust', buildTrust),
        vscode.commands.registerCommand('faf.bisync', syncContext),
        vscode.commands.registerCommand('faf.status', showStatus),
        vscode.commands.registerCommand('faf.share', shareFile),
        vscode.commands.registerCommand('faf.faq', showFaq),
        vscode.commands.registerCommand('faf.index', showIndex)
    ];

    context.subscriptions.push(...commands, watcher);

    // Create status bar item if enabled
    if (vscode.workspace.getConfiguration('faf').get('showStatusBar', true)) {
        createStatusBarItem(context);
    }
}

function updateFafContext() {
    const hasFafFile = findFafFile() !== null;
    vscode.commands.executeCommand('setContext', 'faf.hasFile', hasFafFile);
}

function findFafFile(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return null;

    for (const folder of workspaceFolders) {
        const fafPath = path.join(folder.uri.fsPath, '.faf');
        if (fs.existsSync(fafPath)) {
            return fafPath;
        }
    }
    return null;
}

async function runFafCommand(command: string, args: string[] = []): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const terminal = vscode.window.createTerminal({
        name: 'FAF',
        cwd: workspaceFolder.uri.fsPath
    });

    const fullCommand = `faf ${command} ${args.join(' ')}`.trim();
    terminal.sendText(fullCommand);
    terminal.show();
}

async function initProject() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const fafPath = path.join(workspaceFolder.uri.fsPath, '.faf');
    
    if (fs.existsSync(fafPath)) {
        const choice = await vscode.window.showQuickPick([
            { label: '🆕 Create New', description: 'Create a fresh .faf file', value: '--new' },
            { label: '🔄 Keep Existing', description: 'Use the current .faf file', value: 'cancel' },
            { label: '🚀 Force Replace', description: 'Overwrite existing file', value: '--force' }
        ], {
            placeHolder: 'A .faf file already exists. What would you like to do?'
        });

        if (!choice || choice.value === 'cancel') return;
        
        if (choice.value === '--new' || choice.value === '--force') {
            await runFafCommand('init', [choice.value]);
        }
    } else {
        await runFafCommand('init');
    }
}

async function checkScore() {
    const fafFile = findFafFile();
    if (!fafFile) {
        vscode.window.showWarningMessage('No .faf file found. Run "FAF: Init Project" first.');
        return;
    }
    await runFafCommand('score');
}

async function buildTrust() {
    const fafFile = findFafFile();
    if (!fafFile) {
        vscode.window.showWarningMessage('No .faf file found. Run "FAF: Init Project" first.');
        return;
    }
    await runFafCommand('trust');
}

async function syncContext() {
    const fafFile = findFafFile();
    if (!fafFile) {
        vscode.window.showWarningMessage('No .faf file found. Run "FAF: Init Project" first.');
        return;
    }
    
    const autoSync = vscode.workspace.getConfiguration('faf').get('autoSync', true);
    if (autoSync) {
        vscode.window.showInformationMessage('🔄 Auto bi-sync is enabled - context stays synchronized!');
    }
    
    await runFafCommand('bisync');
}

async function showStatus() {
    const fafFile = findFafFile();
    if (!fafFile) {
        vscode.window.showWarningMessage('No .faf file found. Run "FAF: Init Project" first.');
        return;
    }
    await runFafCommand('status');
}

async function shareFile() {
    const fafFile = findFafFile();
    if (!fafFile) {
        vscode.window.showWarningMessage('No .faf file found. Run "FAF: Init Project" first.');
        return;
    }
    
    const choice = await vscode.window.showQuickPick([
        { label: '📋 Copy to Clipboard', description: 'Copy .faf content to clipboard', value: 'clipboard' },
        { label: '📧 Show Share Instructions', description: 'How to share with team', value: 'instructions' }
    ], {
        placeHolder: 'How would you like to share your .faf file?'
    });

    if (choice?.value === 'clipboard') {
        try {
            const content = fs.readFileSync(fafFile, 'utf-8');
            await vscode.env.clipboard.writeText(content);
            vscode.window.showInformationMessage('📋 .faf content copied to clipboard!');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to copy .faf content');
        }
    } else if (choice?.value === 'instructions') {
        vscode.window.showInformationMessage('Send them the .faf 🚀 - Just share the .faf file with your team for instant AI context!');
    }
}

async function showFaq() {
    await runFafCommand('faq');
}

async function showIndex() {
    await runFafCommand('index');
}

function createStatusBarItem(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    
    const updateStatusBar = async () => {
        const fafFile = findFafFile();
        if (!fafFile) {
            statusBarItem.hide();
            return;
        }

        try {
            // Try to get trust score from cache or run quick check
            const workspaceFolder = path.dirname(fafFile);
            const { stdout } = await execAsync('faf score --json', { cwd: workspaceFolder });
            const scoreData = JSON.parse(stdout);
            
            const trustScore = scoreData.contextScore || 0;
            const aiScore = scoreData.aiCompatibilityScore || 0;
            
            statusBarItem.text = `🧡 FAF ${trustScore}% | 🩵 AI ${aiScore}%`;
            statusBarItem.tooltip = 'FAF Context Score | AI Compatibility - Click to check status';
            statusBarItem.command = 'faf.status';
            statusBarItem.show();
        } catch {
            // Fallback display
            statusBarItem.text = '🧡 FAF Ready';
            statusBarItem.tooltip = 'FAF AI Context Manager - Click to check status';
            statusBarItem.command = 'faf.status';
            statusBarItem.show();
        }
    };

    // Update immediately and watch for changes
    updateStatusBar();
    
    const watcher = vscode.workspace.createFileSystemWatcher('**/.faf');
    watcher.onDidChange(updateStatusBar);
    watcher.onDidCreate(updateStatusBar);
    watcher.onDidDelete(updateStatusBar);

    context.subscriptions.push(statusBarItem, watcher);
}

export function deactivate() {
    console.log('FAF - AI Context Manager extension deactivated');
}