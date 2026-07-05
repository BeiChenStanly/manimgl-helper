import * as vscode from 'vscode';
import { SceneDetector } from './sceneDetector';

type TerminalState = 'idle' | 'launching' | 'ipython';

export class ManimglRunner {
    private detector = new SceneDetector();
    private terminal: vscode.Terminal | undefined;
    private state: TerminalState = 'idle';
    private currentFile: string = '';
    private pendingPasteTimer: NodeJS.Timeout | undefined;
    private terminalCloseDisposable: vscode.Disposable | undefined;

    private getPythonPath(): string {
        const config = vscode.workspace.getConfiguration('manimgl-helper');
        const customPath = config.get<string>('pythonPath', '');
        if (customPath) {
            return customPath;
        }
        // Try VS Code's Python extension setting
        const pythonConfig = vscode.workspace.getConfiguration('python');
        const pythonPath = pythonConfig.get<string>('defaultInterpreterPath', '');
        if (pythonPath) {
            return pythonPath;
        }
        return 'python';
    }

    private getDefaultFlags(): string[] {
        const config = vscode.workspace.getConfiguration('manimgl-helper');
        return config.get<string[]>('defaultFlags', []);
    }

    private getTerminalDelay(): number {
        return vscode.workspace.getConfiguration('manimgl-helper')
            .get<number>('terminalDelay', 1500);
    }

    private disposeTerminal(): void {
        if (this.pendingPasteTimer) {
            clearTimeout(this.pendingPasteTimer);
            this.pendingPasteTimer = undefined;
        }
        if (this.terminalCloseDisposable) {
            this.terminalCloseDisposable.dispose();
            this.terminalCloseDisposable = undefined;
        }
        if (this.terminal) {
            this.terminal.dispose();
            this.terminal = undefined;
        }
        this.state = 'idle';
        this.currentFile = '';
    }

    private ensureTerminal(): vscode.Terminal {
        if (this.terminal) {
            if (this.terminal.exitStatus) {
                this.terminal.dispose();
                this.terminal = undefined;
                this.state = 'idle';
                this.currentFile = '';
            }
        }
        if (!this.terminal) {
            this.terminal = vscode.window.createTerminal('ManimGL');
            this.terminalCloseDisposable = vscode.window.onDidCloseTerminal(t => {
                if (t === this.terminal) {
                    this.state = 'idle';
                    this.currentFile = '';
                    this.terminal = undefined;
                }
            });
        }
        return this.terminal;
    }

    private scheduleCheckpointPaste(): void {
        if (this.pendingPasteTimer) {
            clearTimeout(this.pendingPasteTimer);
        }
        const config = vscode.workspace.getConfiguration('manimgl-helper');
        const delay = (this.state === 'ipython')
            ? config.get<number>('checkpointReloadDelay', 3000)
            : config.get<number>('checkpointPasteDelay', 4000);

        this.pendingPasteTimer = setTimeout(() => {
            if (this.terminal && this.state === 'launching') {
                this.terminal.sendText('checkpoint_paste()');
                this.state = 'ipython';
            }
            this.pendingPasteTimer = undefined;
        }, delay);
    }

    async exportAllScenes(filePath: string): Promise<void> {
        this.disposeTerminal();

        const python = this.getPythonPath();
        const defaultFlags = this.getDefaultFlags();
        const allFlags = [...defaultFlags, '-w', '-a'];

        const fileArg = this.shellQuote(filePath);
        const flagsStr = allFlags.join(' ');

        const command = `${python} -m manimlib ${fileArg} ${flagsStr}`.trim();

        const terminal = vscode.window.createTerminal('ManimGL');
        terminal.show(true);
        const delay = this.getTerminalDelay();
        if (delay > 0) {
            setTimeout(() => {
                if (!terminal.exitStatus) {
                    terminal.sendText(command);
                }
            }, delay);
        } else {
            terminal.sendText(command);
        }
    }

    async runScene(filePath: string, sceneName: string, extraFlags: string[] = []): Promise<void> {
        this.disposeTerminal();

        const python = this.getPythonPath();
        const defaultFlags = this.getDefaultFlags();
        const allFlags = [...defaultFlags, ...extraFlags];

        const fileArg = this.shellQuote(filePath);
        const flagsStr = allFlags.join(' ');

        const command = `${python} -m manimlib ${fileArg} ${sceneName} ${flagsStr}`.trim();

        const terminal = vscode.window.createTerminal('ManimGL');
        terminal.show(true);
        const delay = this.getTerminalDelay();
        if (delay > 0) {
            setTimeout(() => {
                if (!terminal.exitStatus) {
                    terminal.sendText(command);
                }
            }, delay);
        } else {
            terminal.sendText(command);
        }
    }

    async runFromCheckpoint(filePath: string, lineNumber: number, _checkpointText: string): Promise<void> {
        const doc = await vscode.workspace.openTextDocument(filePath);

        const importBlock = this.detector.detectImportBlock(doc);
        const lines = doc.getText().split('\n');

        const containingScene = this.detector.findContainingScene(doc, lineNumber);
        if (!containingScene) {
            vscode.window.showErrorMessage('No Scene class found containing this checkpoint.');
            return;
        }

        // Always stop at the next checkpoint inside the same Scene, but never cross into the next scene.
        const checkpoints = this.detector.detectSceneCheckpoints(doc);
        const nextCheckpoint = checkpoints.find(cp => cp.lineNumber > lineNumber);
        const nextCheckpointLine = nextCheckpoint ? nextCheckpoint.lineNumber : lines.length;

        const scenes = this.detector.detectScenes(doc);
        const nextScene = scenes.find(s => s.lineNumber > lineNumber);
        const nextSceneLine = nextScene ? nextScene.lineNumber : lines.length;

        const endLine = Math.min(nextCheckpointLine, nextSceneLine);

        const customImportLines = lines
            .slice(importBlock.startLine, importBlock.endLine)
            .filter(l => {
                const t = l.trim();
                return t && !t.startsWith('from manimlib') && !t.startsWith('import manimlib');
            });

        const codeLines = lines.slice(lineNumber, endLine);
        const checkpointIndent = codeLines[0].length - codeLines[0].trimStart().length;
        const dedentedCode = codeLines.map(l => {
            if (l.trim().length === 0) { return ''; }
            return l.substring(Math.min(checkpointIndent, l.length - l.trimStart().length));
        });

        const allLines = customImportLines.length > 0
            ? [...customImportLines, '', ...dedentedCode]
            : dedentedCode;
        const code = allLines.join('\n');

        await vscode.env.clipboard.writeText(code);

        const python = this.getPythonPath();
        const fileArg = this.shellQuote(filePath);

        const canHotReload = this.state === 'ipython'
            && this.currentFile === filePath
            && !!this.terminal
            && !this.terminal.exitStatus;

        if (canHotReload) {
            const terminal = this.ensureTerminal();
            terminal.show(true);
            terminal.sendText(`reload(embed_line=${lineNumber + 1})`);
            this.state = 'launching';
            this.scheduleCheckpointPaste();

            vscode.window.showInformationMessage(
                `Hot-reloading to "${_checkpointText.trim()}" in ${containingScene.name}...`
            );
        } else {

            if (this.state !== 'idle') {
                this.disposeTerminal();
            }

            const terminal = this.ensureTerminal();
            terminal.show(true);

            const command = `${python} -m manimlib ${fileArg} ${containingScene.name} -s -e ${lineNumber + 1}`;
            const delay = this.getTerminalDelay();
            if (delay > 0) {
                setTimeout(() => {
                    if (this.terminal && !this.terminal.exitStatus) {
                        terminal.sendText(command);
                        this.state = 'launching';
                        this.currentFile = filePath;
                        this.scheduleCheckpointPaste();
                    }
                }, delay);
            } else {
                terminal.sendText(command);
                this.state = 'launching';
                this.currentFile = filePath;
                this.scheduleCheckpointPaste();
            }

            vscode.window.showInformationMessage(
                `Running "${containingScene.name}" to "${_checkpointText.trim()}"...`
            );
        }
    }

    private shellQuote(str: string): string {
        if (str.includes(' ')) { return `"${str}"`; }
        return str;
    }
}
