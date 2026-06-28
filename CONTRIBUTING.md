# Contributing to ManimGL Helper

感谢你考虑为这个扩展贡献代码、文档或问题报告。

## 开发准备

1. 安装依赖：

```bash
npm install
```

2. 持续编译：

```bash
npm run watch
```

3. 或者手动编译：

```bash
npm run compile
```

## 可用脚本

- `npm run compile`: 编译 TypeScript 到 `out/`。
- `npm run watch`: 监听源码并持续编译。
- `npm run lint`: 使用 ESLint 检查 `src`。
- `npm run test`: 编译后运行集成测试入口。
- `npm run package`: 使用 `vsce package` 打包扩展。

## 仓库结构

- `src/`: 扩展源码。
- `src/test/`: 测试入口与测试套件。
- `manimgl-walkthrough/`: 扩展内置的引导文档。
- `schemas/`: `custom_config.yml` 的 JSON schema。
- `snippets/`: Python 代码片段。

## 贡献建议

- 变更应尽量只覆盖真实存在的功能，不要在文档里写未实现的行为。
- 如果你修改了命令、设置项或检查点流程，请同步更新 README 和相关 walkthrough。
- 如果新增或修改了可验证行为，尽量补充或更新测试。

## 提交前检查

建议在提交前至少运行：

```bash
npm run lint
npm run test
```

如果你只改了文档，通常只需要确认 Markdown 内容是否准确。