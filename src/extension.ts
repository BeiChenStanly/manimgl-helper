import * as vscode from 'vscode';
import { ManimglCodeLensProvider } from './codeLensProvider';
import { SceneDetector } from './sceneDetector';
import { ManimglRunner } from './runner';
import { ConfigEditorProvider } from './configEditor';
import { VersionChecker } from './versionChecker';
import { StatusBarManager } from './statusBar';

let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
    const detector = new SceneDetector();
    const runner = new ManimglRunner();
    const versionChecker = new VersionChecker();
    statusBarManager = new StatusBarManager(runner, detector);
    const configDocumentSelector = [
        { language: 'yaml', pattern: '**/custom_config.yml' },
        { language: 'manimgl-config', pattern: '**/custom_config.yml' }
    ] as const;

    const codeLensProvider = new ManimglCodeLensProvider(detector);
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { language: 'python', scheme: 'file' },
            codeLensProvider
        )
    );

    // Run scene in interactive mode
    context.subscriptions.push(
        vscode.commands.registerCommand('manimgl-helper.runScene', async (args?: { filePath: string; sceneName: string }) => {
            if (args && args.filePath && args.sceneName) {
                await runner.runScene(args.filePath, args.sceneName, []);
            } else {
                const editor = vscode.window.activeTextEditor;
                if (!editor || editor.document.languageId !== 'python') {
                    vscode.window.showWarningMessage('Open a Python file with manimgl scenes.');
                    return;
                }
                const scenes = detector.detectScenes(editor.document);
                if (scenes.length === 0) {
                    vscode.window.showWarningMessage('No Scene classes found in this file.');
                    return;
                }
                // If only one scene, run it directly; otherwise let user pick
                const sceneName = scenes.length === 1 ? scenes[0].name : await pickScene(scenes);
                if (sceneName) {
                    await runner.runScene(editor.document.uri.fsPath, sceneName, []);
                }
            }
        })
    );

    // Export scene to video
    context.subscriptions.push(
        vscode.commands.registerCommand('manimgl-helper.exportScene', async (args?: { filePath: string; sceneName: string }) => {
            if (args && args.filePath && args.sceneName) {
                await runner.runScene(args.filePath, args.sceneName, ['-w']);
            } else {
                const editor = vscode.window.activeTextEditor;
                if (!editor || editor.document.languageId !== 'python') { return; }
                const scenes = detector.detectScenes(editor.document);
                if (scenes.length === 0) {
                    vscode.window.showWarningMessage('No Scene classes found in this file.');
                    return;
                }
                const sceneName = scenes.length === 1 ? scenes[0].name : await pickScene(scenes);
                if (sceneName) {
                    await runner.runScene(editor.document.uri.fsPath, sceneName, ['-w']);
                }
            }
        })
    );

    // Export all scenes
    context.subscriptions.push(
        vscode.commands.registerCommand('manimgl-helper.exportAllScenes', async (args?: { filePath: string }) => {
            if (args && args.filePath) {
                await runner.exportAllScenes(args.filePath);
            } else {
                const editor = vscode.window.activeTextEditor;
                if (!editor || editor.document.languageId !== 'python') {
                    vscode.window.showWarningMessage('Open a Python file with manimgl scenes.');
                    return;
                }
                const scenes = detector.detectScenes(editor.document);
                if (scenes.length === 0) {
                    vscode.window.showWarningMessage('No Scene classes found in this file.');
                    return;
                }
                await runner.exportAllScenes(editor.document.uri.fsPath);
            }
        })
    );

    // Quick export (low quality)
    context.subscriptions.push(
        vscode.commands.registerCommand('manimgl-helper.quickExportScene', async (args?: { filePath: string; sceneName: string }) => {
            if (args && args.filePath && args.sceneName) {
                await runner.runScene(args.filePath, args.sceneName, ['-w', '-l']);
            } else {
                const editor = vscode.window.activeTextEditor;
                if (!editor || editor.document.languageId !== 'python') { return; }
                const scenes = detector.detectScenes(editor.document);
                if (scenes.length === 0) {
                    vscode.window.showWarningMessage('No Scene classes found in this file.');
                    return;
                }
                const sceneName = scenes.length === 1 ? scenes[0].name : await pickScene(scenes);
                if (sceneName) {
                    await runner.runScene(editor.document.uri.fsPath, sceneName, ['-w', '-l']);
                }
            }
        })
    );

    // Run from checkpoint
    context.subscriptions.push(
        vscode.commands.registerCommand('manimgl-helper.runFromCheckpoint', async (args?: { filePath: string; lineNumber: number; checkpointText: string }) => {
            if (args && args.filePath) {
                await runner.runFromCheckpoint(args.filePath, args.lineNumber, args.checkpointText);
            } else {
                const editor = vscode.window.activeTextEditor;
                if (!editor || editor.document.languageId !== 'python') { return; }
                const checkpoints = detector.detectSceneCheckpoints(editor.document);
                if (checkpoints.length === 0) {
                    vscode.window.showWarningMessage('No checkpoint comments found inside Scene classes in this file.');
                    return;
                }
                const items = checkpoints.map(cp => ({
                    label: cp.text.trim().substring(0, 60),
                    description: `Line ${cp.lineNumber + 1}`,
                    checkpoint: cp
                }));
                const picked = await vscode.window.showQuickPick(items, { placeHolder: 'Select a checkpoint to run from...' });
                if (picked) {
                    await runner.runFromCheckpoint(editor.document.uri.fsPath, picked.checkpoint.lineNumber, picked.checkpoint.text);
                }
            }
        })
    );

    // Select and run scene (command palette)
    context.subscriptions.push(
        vscode.commands.registerCommand('manimgl-helper.selectAndRunScene', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'python') {
                vscode.window.showWarningMessage('Open a Python file with manimgl scenes.');
                return;
            }
            const scenes = detector.detectScenes(editor.document);
            if (scenes.length === 0) {
                vscode.window.showWarningMessage('No Scene classes found in this file.');
                return;
            }
            const items = scenes.map(s => ({
                label: s.name,
                description: `Line ${s.lineNumber + 1}`,
                detail: s.baseClass ? `extends ${s.baseClass}` : 'extends Scene',
                scene: s
            }));
            const picked = await vscode.window.showQuickPick(items, { placeHolder: 'Select a scene to run (interactive mode)...' });
            if (picked) {
                await runner.runScene(editor.document.uri.fsPath, picked.scene.name, []);
            }
        })
    );

    // Check manimgl installation
    context.subscriptions.push(
        vscode.commands.registerCommand('manimgl-helper.checkManimgl', async () => {
            const info = await versionChecker.check();
            if (info.installed) {
                const gitHint = info.isGitVersion ? '(git version)' : '(pip version — consider installing from git for latest features)';
                vscode.window.showInformationMessage(
                    `manimgl ${info.version} is installed ${gitHint}`,
                    'Open Walkthrough'
                ).then(choice => {
                    if (choice === 'Open Walkthrough') {
                        vscode.commands.executeCommand('workbench.action.openWalkthrough', 'manimgl-helper.manimgl-setup#manimgl-setup');
                    }
                });
            } else {
                const choice = await vscode.window.showErrorMessage(
                    'manimgl is not installed. Run the setup walkthrough to install it.',
                    'Open Walkthrough',
                    'Check Again'
                );
                if (choice === 'Open Walkthrough') {
                    vscode.commands.executeCommand('workbench.action.openWalkthrough', 'manimgl-helper.manimgl-setup#manimgl-setup');
                } else if (choice === 'Check Again') {
                    vscode.commands.executeCommand('manimgl-helper.checkManimgl');
                }
            }
            statusBarManager.updateVersionStatus(info);
        })
    );

    // Open custom_config.yml
    context.subscriptions.push(
        vscode.commands.registerCommand('manimgl-helper.openConfigFile', async () => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('No workspace folder open.');
                return;
            }
            const configPath = vscode.Uri.joinPath(workspaceFolder.uri, 'custom_config.yml');
            try {
                const doc = await vscode.workspace.openTextDocument(configPath);
                await vscode.window.showTextDocument(doc);
            } catch {
                // File doesn't exist, create it
                const defaultConfig = await versionChecker.getDefaultConfig();
                const wsEdit = new vscode.WorkspaceEdit();
                wsEdit.createFile(configPath, { overwrite: false });
                wsEdit.insert(configPath, new vscode.Position(0, 0), defaultConfig);
                await vscode.workspace.applyEdit(wsEdit);
                const doc = await vscode.workspace.openTextDocument(configPath);
                await vscode.window.showTextDocument(doc);
            }
        })
    );

    // Create new scene file
    context.subscriptions.push(
        vscode.commands.registerCommand('manimgl-helper.createScene', async () => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('No workspace folder open.');
                return;
            }
            const fileName = await vscode.window.showInputBox({
                prompt: 'Enter the file name for the new scene',
                value: 'my_scene.py',
                validateInput: (value) => {
                    return value.endsWith('.py') ? undefined : 'File name must end with .py';
                }
            });
            if (!fileName) { return; }

            const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, fileName);
            const sceneTemplate = `from manimlib import *


class MyScene(Scene):
    def construct(self):
        # Your animation code here
        circle = Circle()
        circle.set_fill(BLUE, opacity=0.5)
        self.play(ShowCreation(circle))
        self.wait()
`;
            const wsEdit = new vscode.WorkspaceEdit();
            wsEdit.createFile(fileUri, { overwrite: false });
            wsEdit.insert(fileUri, new vscode.Position(0, 0), sceneTemplate);
            await vscode.workspace.applyEdit(wsEdit);
            const doc = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(doc);
        })
    );

    // custom_config.yml support
    const configEditor = new ConfigEditorProvider();
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            configDocumentSelector,
            configEditor
        )
    );
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            configDocumentSelector,
            configEditor,
            ':',
            ' '
        )
    );

    // Status bar
    statusBarManager.initialize(context.subscriptions);

    // Auto version check
    const config = vscode.workspace.getConfiguration('manimgl-helper');
    if (config.get<boolean>('autoCheckVersion', true)) {
        versionChecker.check().then(info => {
            statusBarManager.updateVersionStatus(info);
            if (!info.installed) {
                vscode.window.showWarningMessage(
                    'manimgl is not installed. Run the setup walkthrough to get started.',
                    'Open Walkthrough'
                ).then(choice => {
                    if (choice === 'Open Walkthrough') {
                        vscode.commands.executeCommand('workbench.action.openWalkthrough', 'manimgl-helper.manimgl-setup#manimgl-setup');
                    }
                });
            }
        });
    }

    // Update status bar on active editor change
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            statusBarManager.updateSceneStatus(editor);
        })
    );
}

export function deactivate() {
    if (statusBarManager) {
        statusBarManager.dispose();
    }
}

async function pickScene(scenes: { name: string; lineNumber: number; baseClass?: string }[]): Promise<string | undefined> {
    const items = scenes.map(s => ({
        label: s.name,
        description: `Line ${s.lineNumber + 1}`,
        detail: s.baseClass ? `extends ${s.baseClass}` : 'extends Scene'
    }));
    const picked = await vscode.window.showQuickPick(items, { placeHolder: 'Select a scene to run...' });
    return picked?.label;
}
