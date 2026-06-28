import * as vscode from 'vscode';
import { ManimglRunner } from './runner';
import { SceneDetector } from './sceneDetector';
import { ManimglInfo } from './versionChecker';

export class StatusBarManager {
    private versionItem: vscode.StatusBarItem;
    private sceneItem: vscode.StatusBarItem;
    private runItem: vscode.StatusBarItem;

    constructor(private runner: ManimglRunner, private detector: SceneDetector) {
        // Version status (right side)
        this.versionItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.versionItem.command = 'manimgl-helper.checkManimgl';
        this.versionItem.tooltip = 'Click to check manimgl installation';

        // Scene status (left side)
        this.sceneItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.sceneItem.tooltip = 'Active manimgl scene';

        // Run button (left side)
        this.runItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            99
        );
        this.runItem.command = 'manimgl-helper.exportScene';
        this.runItem.tooltip = 'Export current scene to video';
        this.runItem.text = '$(play) Export';
    }

    initialize(subscriptions: vscode.Disposable[]): void {
        subscriptions.push(this.versionItem);
        subscriptions.push(this.sceneItem);
        subscriptions.push(this.runItem);
    }

    updateVersionStatus(info: ManimglInfo): void {
        if (info.installed) {
            const gitIcon = info.isGitVersion ? '$(git-branch)' : '$(package)';
            this.versionItem.text = `${gitIcon} manimgl ${info.version || ''}`;
            this.versionItem.backgroundColor = undefined;
        } else {
            this.versionItem.text = '$(warning) manimgl not found';
            this.versionItem.backgroundColor = new vscode.ThemeColor(
                'statusBarItem.warningBackground'
            );
        }
        this.versionItem.show();
    }

    updateSceneStatus(editor: vscode.TextEditor | undefined): void {
        if (!editor || editor.document.languageId !== 'python') {
            this.sceneItem.hide();
            this.runItem.hide();
            return;
        }

        const scenes = this.detector.detectScenes(editor.document);
        if (scenes.length === 0) {
            this.sceneItem.text = '$(symbol-class) No scenes';
            this.sceneItem.show();
            this.runItem.hide();
            return;
        }

        if (scenes.length === 1) {
            this.sceneItem.text = `$(symbol-class) ${scenes[0].name}`;
        } else {
            this.sceneItem.text = `$(symbol-class) ${scenes.length} scenes`;
        }
        this.sceneItem.command = 'manimgl-helper.selectAndRunScene';
        this.sceneItem.tooltip = 'Click to select and run a scene';
        this.sceneItem.show();
        this.runItem.show();
    }

    dispose(): void {
        this.versionItem.dispose();
        this.sceneItem.dispose();
        this.runItem.dispose();
    }
}
