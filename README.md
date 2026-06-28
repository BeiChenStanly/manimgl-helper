# ManimGL Helper

ManimGL Helper 是一个面向 VS Code 的扩展，用来辅助使用 manimgl 进行数学动画开发。它提供场景检测、命令执行、检查点回放、配置文件补全和状态栏入口，帮助你在编辑器内完成更快的迭代。

## 功能

- 在 Python 文件中检测继承自 `Scene` 或其他以 `Scene` 结尾的基类的场景类。
- 在场景类和检查点注释上提供 CodeLens 操作。
- 通过终端运行当前场景、导出单个场景视频、导出当前文件中的全部场景。
- 支持低质量快速导出。
- 支持基于检查点注释从指定位置开始运行，并将相应代码复制到剪贴板，配合 manimgl 的交互式窗口粘贴使用。
- 提供 `custom_config.yml` 的打开与自动创建能力，并为该文件提供悬停说明和补全。
- 在状态栏显示 manimgl 安装状态和当前 Python 场景信息。
- 提供创建新场景文件的命令，以及引导式 walkthrough。

## 安装

1. 在 VS Code 中打开本仓库并安装依赖：

```bash
npm install
```

2. 运行扩展开发构建：

```bash
npm run compile
```

3. 在 VS Code 的扩展开发主机中启动调试，或使用仓库现有的 watch 任务持续编译。

## 使用前提

- 需要 VS Code 1.85.0 或更高版本。
- 需要 Python 环境中可导入 `manimlib`。
- 扩展默认会尝试自动检测 Python 解释器，也可以通过设置手动指定。

## 常用命令

所有命令都可以从命令面板运行，命令前缀为 ManimGL：

- Run Scene (Interactive): 以交互模式运行当前场景。
- Export Scene (Video): 导出当前场景视频。
- Export All Scenes (Video): 导出当前文件中的全部场景。
- Quick Export (Low Quality): 以低质量参数快速导出当前场景。
- Run from Checkpoint: 从检查点注释位置开始运行。
- Select Scene to Run...: 在当前文件的场景列表中选择一个场景运行。
- Check manimgl Installation: 检查当前 Python 环境中的 manimgl 是否可用。
- Open custom_config.yml: 打开或创建工作区根目录下的 `custom_config.yml`。
- Create New Scene File: 创建一个新的 Python 场景文件模板。

## 编辑器内入口

### CodeLens

在 Python 文件中，扩展会在可识别的场景类上方显示两个操作：

- Run Scene
- Export Scene

如果文件中存在检查点注释，还会在注释位置显示 `Run from: ...`。

### 状态栏

- 右侧状态栏会显示当前 manimgl 安装状态。
- 左侧状态栏会显示当前 Python 文件中的场景数量或场景名称。
- 左侧还会显示一个导出按钮，用于快速导出当前场景。

## 配置

扩展提供以下设置项：

- `manimgl-helper.pythonPath`: 手动指定带有 manimgl 的 Python 解释器路径。
- `manimgl-helper.defaultFlags`: 运行 manimgl 时附加的默认 CLI 参数。
- `manimgl-helper.autoCheckVersion`: 激活扩展时是否自动检查 manimgl 安装情况。
- `manimgl-helper.checkpointPasteDelay`: 运行交互式场景后，自动调用 `checkpoint_paste()` 的延迟。
- `manimgl-helper.checkpointReloadDelay`: 热重载时自动调用 `checkpoint_paste()` 的延迟。

## custom_config.yml

扩展内置了 `custom_config.yml` 语言支持，并对该文件提供补全和悬停说明。该说明内容来自扩展内置的配置定义，而不是直接解析外部文档。

## Walkthrough

扩展包含一个入门 walkthrough，内容覆盖：

1. 克隆 manimgl 仓库。
2. 以 editable 模式安装 manimgl。
3. 验证安装结果。
4. 创建第一个场景文件。

## 运行与开发

仓库中可用的脚本：

```bash
npm run compile
npm run watch
npm run lint
npm run test
```

`npm run test` 会先编译，再运行 `out/test/runTest.js`。

## 实现约束

以下行为是当前代码真实支持的范围：

- 场景检测基于类名和基类名称字符串匹配，并不会做完整的 Python 语义分析。
- 检查点功能依赖普通注释行，不处理三引号字符串中的内容。
- 运行和导出命令通过终端调用 `python -m manimlib`。
- `runFromCheckpoint` 会将相关代码复制到剪贴板，然后在交互式流程中配合 `checkpoint_paste()` 使用。

## 许可证

本项目使用 MIT 许可证，见 [LICENSE](LICENSE)。