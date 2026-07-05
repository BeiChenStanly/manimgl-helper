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
        const lines = document.getText().split('\n');
        const scenes = this.detectScenes(document);

        let sceneIndex = 0;
        let activeScene: SceneInfo | undefined = scenes[sceneIndex];
        let activeSceneIndentation = activeScene ? this.getLineIndentation(lines[activeScene.lineNumber]) : 0;
        let inTripleQuote = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            const tripleCount = (trimmed.match(/"""/g) || []).length + (trimmed.match(/'''/g) || []).length;
            const togglesTripleQuote = tripleCount % 2 === 1;
            const lineIsTripleQuoteContent = inTripleQuote || togglesTripleQuote;

            if (togglesTripleQuote) {
                inTripleQuote = !inTripleQuote;
            }

            if (activeScene && i > activeScene.lineNumber && !lineIsTripleQuoteContent) {
                if (trimmed.length > 0) {
                    const indentation = this.getLineIndentation(line);
                    if (indentation <= activeSceneIndentation) {
                        activeScene = undefined;
                    }
                }
            }

            if (sceneIndex < scenes.length && scenes[sceneIndex].lineNumber === i) {
                activeScene = scenes[sceneIndex];
                activeSceneIndentation = this.getLineIndentation(line);
                sceneIndex++;
            }

            if (lineIsTripleQuoteContent) { continue; }

            if (!activeScene || i <= activeScene.lineNumber) { continue; }

            if (!trimmed.startsWith('#')) { continue; }

            const commentContent = trimmed.substring(1).trim();

            if (i === 0 && trimmed.startsWith('#!')) { continue; }

            if (commentContent.length === 0) { continue; }

            if (/^[#\-=_*]{5,}$/.test(commentContent)) { continue; }

            if (/^(type:|noqa|pylint:|TODO|FIXME|HACK|NOTE|XXX):?\s/.test(commentContent)) { continue; }

            checkpoints.push({
                text: line,
                lineNumber: i
            });
        }
        return checkpoints;
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
