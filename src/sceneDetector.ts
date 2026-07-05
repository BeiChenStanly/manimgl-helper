import * as vscode from 'vscode';

export interface SceneInfo {
    name: string;
    lineNumber: number;   // 0-based
    baseClass?: string;    // e.g., "Scene", "ThreeDScene"
}

export interface CheckpointInfo {
    text: string;          // full comment text including '#'
    lineNumber: number;    // 0-based
}

export interface ImportBlock {
    startLine: number;     // 0-based, inclusive
    endLine: number;       // 0-based, exclusive
}

export class SceneDetector {
    detectScenes(document: vscode.TextDocument): SceneInfo[] {
        const scenes: SceneInfo[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        const sceneRegex = /^\s*class\s+(\w+)\s*\(\s*(\w+)/;

        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(sceneRegex);
            if (match) {
                const className = match[1];
                const baseClass = match[2];
                if (baseClass.endsWith('Scene') || baseClass === 'Scene') {
                    scenes.push({
                        name: className,
                        lineNumber: i,
                        baseClass: baseClass
                    });
                }
            }
        }
        return scenes;
    }

    detectSceneCheckpoints(document: vscode.TextDocument): CheckpointInfo[] {
        const checkpoints: CheckpointInfo[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        let inTripleQuote = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            const tripleCount = (trimmed.match(/"""/g) || []).length + (trimmed.match(/'''/g) || []).length;
            if (tripleCount % 2 === 1) {
                inTripleQuote = !inTripleQuote;
            }

            if (inTripleQuote) { continue; }

            if (!trimmed.startsWith('#')) { continue; }

            const commentContent = trimmed.substring(1).trim();

            if (i === 0 && trimmed.startsWith('#!')) { continue; }

            if (commentContent.length === 0) { continue; }

            if (/^[#\-=_*]{5,}$/.test(commentContent)) { continue; }

            if (/^(type:|noqa|pylint:|TODO|FIXME|HACK|NOTE|XXX):?\s/.test(commentContent)) { continue; }

            if (!this.isCheckpointInsideScene(document, i)) { continue; }

            checkpoints.push({
                text: line,
                lineNumber: i
            });
        }
        return checkpoints;
    }

    private isCheckpointInsideScene(document: vscode.TextDocument, lineNumber: number): boolean {
        const scene = this.findContainingScene(document, lineNumber);
        if (!scene) {
            return false;
        }

        const sceneLineText = document.lineAt(scene.lineNumber).text;
        const sceneIndentation = this.getLineIndentation(sceneLineText);

        const checkpointLineText = document.lineAt(lineNumber).text;
        const checkpointIndentation = this.getLineIndentation(checkpointLineText);
        if (checkpointIndentation <= sceneIndentation) {
            return false;
        }

        const sceneEndLine = this.findBlockEndLine(document, scene.lineNumber, sceneIndentation);
        return lineNumber < sceneEndLine;
    }

    private findBlockEndLine(document: vscode.TextDocument, startLine: number, startIndentation: number): number {
        for (let i = startLine + 1; i < document.lineCount; i++) {
            const text = document.lineAt(i).text;
            const trimmed = text.trim();
            if (trimmed.length === 0) {
                continue;
            }

            const indentation = this.getLineIndentation(text);
            if (indentation <= startIndentation) {
                return i;
            }
        }
        return document.lineCount;
    }

    private getLineIndentation(text: string): number {
        const match = text.match(/^\s*/);
        return match ? match[0].length : 0;
    }

    detectImportBlock(document: vscode.TextDocument): ImportBlock {
        const text = document.getText();
        const lines = text.split('\n');

        let firstImport = -1;
        let lastImport = -1;

        const importRegex = /^\s*(from\s+\w+|import\s+\w+)/;

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (importRegex.test(trimmed)) {
                if (firstImport === -1) { firstImport = i; }
                lastImport = i;
            } else if (firstImport !== -1 && trimmed.length === 0) {
                // skip blank line
            } else if (firstImport !== -1 && trimmed.startsWith('#')) {
                // skip comment
            } else if (firstImport !== -1) {
                break;
            }
        }

        if (firstImport === -1) {
            return { startLine: 0, endLine: 0 };
        }
        return { startLine: firstImport, endLine: lastImport + 1 };
    }

    findContainingScene(document: vscode.TextDocument, lineNumber: number): SceneInfo | undefined {
        const scenes = this.detectScenes(document);
        let containingScene: SceneInfo | undefined;
        for (const scene of scenes) {
            if (scene.lineNumber < lineNumber) {
                containingScene = scene;
            } else {
                break;
            }
        }
        return containingScene;
    }
}
