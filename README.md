# TSQX Compiler

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/LYDT.tsqx-compiler?label=VS%20Code%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=LYDT.tsqx-compiler)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/LYDT.tsqx-compiler?logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=LYDT.tsqx-compiler)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/LYDT.tsqx-compiler?logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=LYDT.tsqx-compiler)
[![GitHub Stars](https://img.shields.io/github/stars/YZDame/tsqx-compiler?style=social)](https://github.com/YZDame/tsqx-compiler)
[![License](https://img.shields.io/github/license/YZDame/tsqx-compiler)](https://github.com/YZDame/tsqx-compiler/blob/main/LICENSE)

English | [简体中文](README.zh-CN.md)

Compile [TSQX](https://github.com/vEnhance/tsqx) geometry files to high-quality PDF diagrams via [Asymptote](https://asymptote.sourceforge.io/), with **live preview**, **syntax highlighting**, and **auto-compile** — all inside VS Code.

## Features

- **Live Preview** — Click the preview icon in the editor title bar to compile and view the PDF side-by-side.
- **Auto-Compile on Save** — Enabled by default. Every time you save a `.tsqx` file, the PDF is recompiled and refreshed automatically.
- **Syntax Highlighting** — Full TextMate grammar for `.tsqx` files: comments, point definitions, draw commands, built-in functions, Asymptote color names, and operators.
- **TXT File Support** — Right-click any `.txt` file and choose *Set Current File as TSQX* to get full TSQX support.
- **Inline Diagnostics** — Compilation errors and warnings appear directly in the editor's Problems panel.
- **Status Bar** — Shows compilation status and auto-compile toggle (click to switch on/off).
- **Configurable Paths** — Point the extension at custom `tsqx` and `asy` executables if they aren't on `$PATH`.

## Quick Start

1. Open a `.tsqx` file
2. Click the **preview** icon (⧉) in the editor toolbar
3. The compiled PDF opens in a side panel — edit, save, and it refreshes automatically

## Requirements

| Tool | Install |
|------|---------|
| **tsqx** | `pip install tsqx` or `pip install -e .` from this repo |
| **Asymptote** | `brew install asymptote` (macOS) / `apt install asymptote` (Linux) / [Windows installer](https://asymptote.sourceforge.io/) |
| **VS Code** | ≥ 1.109.0 |

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| TSQX: Preview TSQX Figure | `Cmd+Shift+Alt+V` / `Ctrl+Shift+Alt+V` | Compile and open PDF preview |
| TSQX: Compile TSQX File | `Cmd+Shift+B` / `Ctrl+Shift+B` | Compile to ASY and PDF |
| TSQX: Open Generated ASY | — | Open the generated `.asy` file beside the editor |
| TSQX: Diagnose Toolchain | — | Check `tsqx` / `asy` commands, versions, and current extension settings |
| TSQX: Show Compiler Output | — | Open detailed compiler logs |
| TSQX: Toggle Auto Compile on Save | — | Enable / disable auto-compile |
| TSQX: Set Current File as TSQX | — | Mark a `.txt` file as TSQX |

## Settings

```jsonc
{
  "tsqx.autoCompileOnSave": true,   // auto-compile on save (default: true)
  "tsqx.autoCompileDelay": 1000,    // delay in ms before auto-compile after save
  "tsqx.compilationTimeout": 30,    // max seconds per compilation
  "tsqx.tsqxPath": "tsqx",          // path to tsqx executable
  "tsqx.asyPath": "asy",            // path to Asymptote executable
  "tsqx.extraTsqxArgs": ["-p"]      // extra CLI args; each argument is a separate array item
}
```

For example, use `["-p", "-s", "200"]` to pass a size. Legacy string values remain supported. Commands are executed directly without a shell.

## Development

```bash
npm ci
npm run compile
npm run lint
npm test
```

For a real local smoke test against the installed `tsqx` and `asy` toolchain:

```bash
npm run smoke:compile -- /path/to/file.tsqx
```

Example:

```bash
npm run smoke:compile -- /Users/leyudame/Documents/tsqx/examples/figures/fig1.tsqx
```

Release workflow details are documented in [docs/RELEASE.md](./docs/RELEASE.md).

## How It Works

1. `tsqx -p < input.tsqx > output.asy` — generates Asymptote source
2. `asy output.asy` — compiles to PDF
3. The PDF is opened (or refreshed) in VS Code's built-in viewer

## Activity Bar

The extension adds a **TSQX** panel to the Activity Bar (left sidebar) with quick-access buttons:

- **Compile Current File** — run the tsqx → asy → pdf pipeline
- **Preview PDF** — open the PDF in a side panel
- **Toggle Auto-Compile** — switch auto-compile on save on/off
- **Set File as TSQX** — mark a `.txt` file for TSQX support

## Development

```bash
git clone https://github.com/yzdame/tsqx-compiler.git
cd tsqx-compiler
npm install
npm run compile   # build once
npm run watch     # rebuild on change
# Press F5 in VS Code to launch the Extension Development Host
```

## Packaging

```bash
npx vsce package
# Produces tsqx-compiler-x.x.x.vsix
```

## License

[MIT](LICENSE)
