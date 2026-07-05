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
  English
  <a href="./README.zh-CN.md">简体中文</a>
</p>

A VS Code extension to assist [manimgl](https://github.com/3b1b/manim) math animation development. Provides scene detection, command execution, checkpoint replay, and configuration file completion to accelerate the iteration workflow within the editor.

---

## Features

- **Scene Detection** — Automatically identify scene classes inheriting from `Scene`
- **CodeLens** — One-click run/export entry points on scene classes and checkpoints
- **Command Execution** — Run current scene, export video (single scene / all scenes / low-quality quick export)
- **Checkpoint Replay** — Start running from a comment marker; code is automatically copied to clipboard, works with the interactive window
- **Configuration Support** — Auto-create, open, syntax highlight, hover hints, and completion for `custom_config.yml`
- **Walkthrough** — Guide through the complete process of cloning, installing, verifying, and creating scenes

## Requirements

| Dependency | Description |
|------------|-------------|
| VS Code `>=1.85.0` | Extension runtime environment |
| Python 3 | Must be able to import `manimlib` |
| manimgl | Math animation engine |

The Python interpreter is auto-detected, or you can manually specify it via settings.

## Commands

All commands are executed via the Command Palette with the `ManimGL` prefix:

| Command | Description |
|---------|-------------|
| Run Scene (Interactive) | Run the current scene in interactive mode |
| Export Scene (Video) | Export the current scene as video |
| Export All Scenes (Video) | Export all scenes in the file as video |
| Quick Export (Low Quality) | Quick export at low quality |
| Run from Checkpoint | Start running from a checkpoint position |
| Select Scene to Run... | Select a scene to run |
| Check manimgl Installation | Check manimgl installation status |
| Open custom_config.yml | Open / create the configuration file |
| Create New Scene File | Create a scene file from template |

## Settings

| Setting | Description |
|---------|-------------|
| `manimgl-helper.pythonPath` | Specify the Python interpreter path |
| `manimgl-helper.defaultFlags` | Default CLI arguments for manimgl |
| `manimgl-helper.autoCheckVersion` | Automatically check installation status on activation |
| `manimgl-helper.checkpointPasteDelay` | `checkpoint_paste()` delay after interactive scene (ms) |
| `manimgl-helper.checkpointReloadDelay` | `checkpoint_paste()` delay on hot reload (ms) |
| `manimgl-helper.terminalDelay` | Delay before executing command in a new terminal (ms). Set to `0` to disable. Useful when Python extension auto-activates virtual environments. |

## Development

```bash
npm install         # Install dependencies
npm run compile     # Compile
npm run watch       # Watch mode
npm run lint        # Lint
npm run test        # Compile and run tests
```

## License

[MIT](LICENSE) &copy; BeiChenStanly
