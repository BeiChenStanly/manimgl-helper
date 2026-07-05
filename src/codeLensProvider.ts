import * as vscode from 'vscode';
import { SceneDetector } from './sceneDetector';

export class ManimglCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

    constructor(private detector: SceneDetector) { }

    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    provideCodeLenses(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];

        const scenes = this.detector.detectScenes(document);
        for (const scene of scenes) {
            const range = new vscode.Range(scene.lineNumber, 0, scene.lineNumber, 0);

            codeLenses.push(new vscode.CodeLens(range, {
                title: '🎬 Export Scene',
                command: 'manimgl-helper.exportScene',
                arguments: [{ filePath: document.uri.fsPath, sceneName: scene.name }]
            }));

            codeLenses.push(new vscode.CodeLens(range, {
                title: '▶ Run Scene',
                command: 'manimgl-helper.runScene',
                arguments: [{ filePath: document.uri.fsPath, sceneName: scene.name }]
            }));
        }

        const checkpoints = this.detector.detectSceneCheckpoints(document);
        for (const cp of checkpoints) {
            const range = new vscode.Range(cp.lineNumber, 0, cp.lineNumber, 0);
            const shortText = cp.text.trim().substring(0, 50);

            codeLenses.push(new vscode.CodeLens(range, {
                title: `▶ Run from: ${shortText}`,
                command: 'manimgl-helper.runFromCheckpoint',
                arguments: [{
                    filePath: document.uri.fsPath,
                    lineNumber: cp.lineNumber,
                    checkpointText: cp.text
                }]
            }));
        }

        return codeLenses;
    }
}
