import * as assert from 'assert';
import { SceneDetector } from '../../sceneDetector';
import * as vscode from 'vscode';

suite('SceneDetector', () => {
    let detector: SceneDetector;

    setup(() => {
        detector = new SceneDetector();
    });

    test('detectScenes: finds basic Scene class', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

class MyScene(Scene):
    def construct(self):
        pass
`,
            language: 'python'
        });

        const scenes = detector.detectScenes(doc);
        assert.strictEqual(scenes.length, 1);
        assert.strictEqual(scenes[0].name, 'MyScene');
        assert.strictEqual(scenes[0].baseClass, 'Scene');
    });

    test('detectScenes: finds ThreeDScene', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

class My3DScene(ThreeDScene):
    def construct(self):
        pass
`,
            language: 'python'
        });

        const scenes = detector.detectScenes(doc);
        assert.strictEqual(scenes.length, 1);
        assert.strictEqual(scenes[0].name, 'My3DScene');
        assert.strictEqual(scenes[0].baseClass, 'ThreeDScene');
    });

    test('detectScenes: finds multiple scenes', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

class Scene1(Scene):
    def construct(self):
        pass

class Scene2(Scene):
    def construct(self):
        pass

class Scene3(ThreeDScene):
    def construct(self):
        pass
`,
            language: 'python'
        });

        const scenes = detector.detectScenes(doc);
        assert.strictEqual(scenes.length, 3);
        assert.strictEqual(scenes[0].name, 'Scene1');
        assert.strictEqual(scenes[1].name, 'Scene2');
        assert.strictEqual(scenes[2].name, 'Scene3');
    });

    test('detectScenes: ignores non-Scene classes', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

class NotAScene:
    pass

class MyScene(Scene):
    def construct(self):
        pass
`,
            language: 'python'
        });

        const scenes = detector.detectScenes(doc);
        assert.strictEqual(scenes.length, 1);
        assert.strictEqual(scenes[0].name, 'MyScene');
    });

    test('detectScenes: returns correct line numbers (0-based)', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

# comment
class MyScene(Scene):
    def construct(self):
        pass
`,
            language: 'python'
        });

        const scenes = detector.detectScenes(doc);
        assert.strictEqual(scenes.length, 1);
        assert.strictEqual(scenes[0].lineNumber, 3); // 0-based, line 4
    });
});

suite('SceneDetector - Checkpoints', () => {
    let detector: SceneDetector;

    setup(() => {
        detector = new SceneDetector();
    });

    test('detectSceneCheckpoints: finds basic checkpoint comments inside Scene bodies', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

class MyScene(Scene):
    def construct(self):
        # setup circle
        circle = Circle()
        # animate
        self.play(ShowCreation(circle))
`,
            language: 'python'
        });

        const checkpoints = detector.detectSceneCheckpoints(doc);
        assert.ok(checkpoints.length >= 2);
        assert.ok(checkpoints.some(cp => cp.text.includes('setup circle')));
        assert.ok(checkpoints.some(cp => cp.text.includes('animate')));
    });

    test('detectSceneCheckpoints: excludes comments outside Scene bodies', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

# top-level note
class MyScene(Scene):
    # class note
    def construct(self):
        # inside construct
        pass

# trailing note

if __name__ == "__main__":
    # main note
    pass
`,
            language: 'python'
        });

        const checkpoints = detector.detectSceneCheckpoints(doc);
        assert.ok(checkpoints.some(cp => cp.text.includes('class note')));
        assert.ok(checkpoints.some(cp => cp.text.includes('inside construct')));
        assert.ok(!checkpoints.some(cp => cp.text.includes('top-level note')));
        assert.ok(!checkpoints.some(cp => cp.text.includes('trailing note')));
        assert.ok(!checkpoints.some(cp => cp.text.includes('main note')));
    });

    test('detectSceneCheckpoints: excludes shebang', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `#!/usr/bin/env python
from manimlib import *

class MyScene(Scene):
    def construct(self):
        # my checkpoint
        pass
`,
            language: 'python'
        });

        const checkpoints = detector.detectSceneCheckpoints(doc);
        assert.ok(!checkpoints.some(cp => cp.text.includes('usr/bin')));
        assert.ok(checkpoints.some(cp => cp.text.includes('my checkpoint')));
    });

    test('detectSceneCheckpoints: excludes pure separator lines', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

class MyScene(Scene):
    def construct(self):
        ######
        # real checkpoint
        # -----
        pass
`,
            language: 'python'
        });

        const checkpoints = detector.detectSceneCheckpoints(doc);
        assert.ok(checkpoints.some(cp => cp.text.includes('real checkpoint')));
        assert.ok(!checkpoints.some(cp => cp.text.includes('######')));
    });

    test('detectSceneCheckpoints: excludes empty comments', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

class MyScene(Scene):
    def construct(self):
        #
        # real checkpoint
        pass
`,
            language: 'python'
        });

        const checkpoints = detector.detectSceneCheckpoints(doc);
        assert.ok(!checkpoints.some(cp => cp.text.trim() === '#'));
        assert.ok(checkpoints.some(cp => cp.text.includes('real checkpoint')));
    });

    test('detectSceneCheckpoints: excludes TODO/FIXME/HACK/NOTE/XXX', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

class MyScene(Scene):
    def construct(self):
        # TODO: do something
        # FIXME: fix this
        # HACK: hacky solution
        # NOTE: important
        # XXX: watch out
        # real checkpoint
        pass
`,
            language: 'python'
        });

        const checkpoints = detector.detectSceneCheckpoints(doc);
        assert.ok(checkpoints.some(cp => cp.text.includes('real checkpoint')));
        assert.ok(!checkpoints.some(cp => cp.text.includes('TODO')));
        assert.ok(!checkpoints.some(cp => cp.text.includes('FIXME')));
        assert.ok(!checkpoints.some(cp => cp.text.includes('HACK')));
        assert.ok(!checkpoints.some(cp => cp.text.includes('NOTE')));
        assert.ok(!checkpoints.some(cp => cp.text.includes('XXX')));
    });
});

suite('SceneDetector - ImportBlock', () => {
    let detector: SceneDetector;

    setup(() => {
        detector = new SceneDetector();
    });

    test('detectImportBlock: finds standard manimgl import', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

class MyScene(Scene):
    def construct(self):
        pass
`,
            language: 'python'
        });

        const block = detector.detectImportBlock(doc);
        assert.strictEqual(block.startLine, 0);
        assert.strictEqual(block.endLine, 1); // exclusive
    });

    test('detectImportBlock: finds multiple imports', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *
import numpy as np
from pathlib import Path

class MyScene(Scene):
    def construct(self):
        pass
`,
            language: 'python'
        });

        const block = detector.detectImportBlock(doc);
        assert.strictEqual(block.startLine, 0);
        assert.strictEqual(block.endLine, 3);
    });

    test('findContainingScene: finds scene containing given line', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

class SceneA(Scene):
    def construct(self):
        # checkpoint A
        pass

class SceneB(Scene):
    def construct(self):
        # checkpoint B
        pass
`,
            language: 'python'
        });

        // checkpoint A is at line 5, should be in SceneA
        const sceneA = detector.findContainingScene(doc, 5);
        assert.ok(sceneA);
        assert.strictEqual(sceneA!.name, 'SceneA');

        // checkpoint B is at line 10, should be in SceneB
        const sceneB = detector.findContainingScene(doc, 10);
        assert.ok(sceneB);
        assert.strictEqual(sceneB!.name, 'SceneB');
    });

    test('findContainingScene: returns undefined for line before any scene', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `from manimlib import *

# before any scene

class MyScene(Scene):
    def construct(self):
        pass
`,
            language: 'python'
        });

        const scene = detector.findContainingScene(doc, 2); // comment line before class
        assert.strictEqual(scene, undefined);
    });
});
