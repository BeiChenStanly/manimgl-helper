# ManimGL Helper

<p align="center">
  <img src="./icon.png" alt="ManimGL Helper" width="128"/>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=BeiChenStanly.manimgl-helper">
    <img src="https://vsmarketplacebadges.dev/version/BeiChenStanly.manimgl-helper.svg?colorB=0078d7" alt="Version"/>
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=BeiChenStanly.manimgl-helper">
    <img src="https://vsmarketplacebadges.dev/installs/BeiChenStanly.manimgl-helper.svg" alt="Installs"/>
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=BeiChenStanly.manimgl-helper">
    <img src="https://vsmarketplacebadges.dev/rating-star/BeiChenStanly.manimgl-helper.svg" alt="Rating"/>
  </a>
  <a href="https://github.com/BeiChenStanly/manimgl-helper/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"/>
  </a>
  <a href="https://github.com/BeiChenStanly/manimgl-helper">
    <img src="https://img.shields.io/badge/GitHub-Repo-181717?logo=github" alt="GitHub"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/VS%20Code-1.85%2B-0078d7?logo=visual-studio-code" alt="VS Code"/>
  <img src="https://img.shields.io/badge/Python-3-3776AB?logo=python" alt="Python 3"/>
  <img src="https://img.shields.io/badge/manimgl-latest-ff69b4" alt="manimgl"/>
  <a href="https://github.com/BeiChenStanly/manimgl-helper/actions">
    <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build"/>
  </a>
</p>

<p align="center">
  <a href="./README.md">English</a>
  简体中文
</p>

面向 VS Code 的扩展，辅助 [manimgl](https://github.com/3b1b/manim) 数学动画开发。提供场景检测、命令执行、检查点回放和配置文件补全，加速编辑器内的迭代流程。

---

## 功能

- **场景检测** — 自动识别继承自 `Scene` 的场景类
- **CodeLens** — 在场景类和检查点上提供一键运行/导出入口
- **命令执行** — 运行当前场景、导出视频（单场景/全部场景/低质量快速导出）
- **检查点回放** — 从注释标记处开始运行，代码自动复制到剪贴板，配合交互窗口使用
- **配置支持** — `custom_config.yml` 自动创建、打开、语法高亮、悬停提示与补全
- **Walkthrough** — 引导完成克隆、安装、验证、创建场景的完整流程

## 环境要求

| 依赖 | 说明 |
|------|------|
| VS Code `>=1.85.0` | 扩展运行环境 |
| Python 3 | 需可导入 `manimlib` |
| manimgl | 数学动画引擎 |

Python 解释器自动检测，也可通过设置手动指定。

## 命令

所有命令通过命令面板执行，前缀 `ManimGL`：

| 命令 | 说明 |
|------|------|
| Run Scene (Interactive) | 交互模式运行当前场景 |
| Export Scene (Video) | 导出当前场景视频 |
| Export All Scenes (Video) | 导出文件全部场景 |
| Quick Export (Low Quality) | 低质量快速导出 |
| Run from Checkpoint | 从检查点位置开始运行 |
| Select Scene to Run... | 选择场景运行 |
| Check manimgl Installation | 检查 manimgl 安装状态 |
| Open custom_config.yml | 打开/创建配置文件 |
| Create New Scene File | 创建场景文件模板 |

## 设置

| 设置项 | 说明 |
|--------|------|
| `manimgl-helper.pythonPath` | 指定 Python 解释器路径 |
| `manimgl-helper.defaultFlags` | manimgl 默认 CLI 参数 |
| `manimgl-helper.autoCheckVersion` | 激活时自动检查安装状态 |
| `manimgl-helper.checkpointPasteDelay` | 交互场景后 `checkpoint_paste()` 延迟 (ms) |
| `manimgl-helper.checkpointReloadDelay` | 热重载时 `checkpoint_paste()` 延迟 (ms) |

## 开发

```bash
npm install         # 安装依赖
npm run compile     # 编译
npm run watch       # 持续编译
npm run lint        # 代码检查
npm run test        # 编译并运行测试
```

## 许可证

[MIT](LICENSE) &copy; BeiChenStanly
