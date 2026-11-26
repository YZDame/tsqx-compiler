# TSQX Compiler

[VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=LYDT.tsqx-compiler)
[![Release](https://img.shields.io/github/v/release/YZDame/tsqx-compiler)](https://github.com/YZDame/tsqx-compiler/releases/latest)
[![CI](https://github.com/YZDame/tsqx-compiler/actions/workflows/ci.yml/badge.svg)](https://github.com/YZDame/tsqx-compiler/actions/workflows/ci.yml)
[![GitHub Stars](https://img.shields.io/github/stars/YZDame/tsqx-compiler?style=social)](https://github.com/YZDame/tsqx-compiler)
[![License](https://img.shields.io/github/license/YZDame/tsqx-compiler)](https://github.com/YZDame/tsqx-compiler/blob/main/LICENSE)

English | [简体中文](README.zh-CN.md)

Compile [TSQX](https://github.com/vEnhance/tsqx) geometry files to high-quality PDF diagrams via [Asymptote](https://asymptote.sourceforge.io/), with **live preview**, **syntax highlighting**, and **auto-compile** — all inside VS Code.

## Features

- **Persistent Live Preview** — View a vector preview side-by-side; refreshes retain the panel, zoom, and scroll position.
- **Auto-Compile on Save** — Enabled by default. Every time you save a `.tsqx` file, the PDF is recompiled and refreshed automatically.
- **Syntax Highlighting** — Full TextMate grammar for `.tsqx` files: comments, point definitions, draw commands, built-in functions, Asymptote color names, and operators.
- **TXT File Support** — Right-click any `.txt` file and choose *Set Current File as TSQX* to get full TSQX support.
- **Inline Diagnostics** — Compilation errors and warnings appear directly in the editor's Problems panel.
- **Status Bar** — Shows compilation status and auto-compile toggle (click to switch on/off).
- **Configurable Paths** — Point the extension at custom `tsqx` and `asy` executables if they aren't on `$PATH`.
- **First-Use Setup** — Check the toolchain and choose output and auto-compile behavior from a guided setup.
- **Project Output Directory** — Keep generated files beside sources or under a workspace build folder without filename collisions.
- **Workspace Compilation** — Compile every `.tsqx` file with progress, cancellation, and a result summary.
- **Templates and Snippets** — Start common triangle, center, foot, circle, and drawing constructions quickly.
- **Language Assistance** — Built-in and point completion, hover documentation, document outline, and go-to-definition.
- **SVG and PNG Export** — Convert the generated PDF through Poppler with configurable PNG resolution.

## TSQX Ecosystem

- **Chinese handbook and examples:** [tsqx-book](https://github.com/YZDame/tsqx-book) ([syntax reference](https://github.com/YZDame/tsqx-book/blob/main/docs/syntax-reference.md))
- **AI-assisted figure generation:** [tsqx-gen-skill](https://github.com/YZDame/tsqx-gen-skill)
- **Language implementation:** [vEnhance/tsqx](https://github.com/vEnhance/tsqx) (upstream)

## Quick Start

1. Open a `.tsqx` file
2. Click the **preview** icon (⧉) in the editor toolbar
3. A persistent vector preview opens beside the editor — edit, save, and it refreshes without replacing the panel

## Requirements

| Tool | Install |
|------|---------|
| **tsqx** | `pip install tsqx` (upstream package); for editable installation clone [vEnhance/tsqx](https://github.com/vEnhance/tsqx), then run `pip install -e .` **there** |
| **Asymptote** | `brew install asymptote` (macOS) / `apt install asymptote` (Linux) / [Windows installer](https://asymptote.sourceforge.io/) |
| **Poppler** | `brew install poppler` (macOS) / `apt install poppler-utils` (Linux); required for persistent preview and SVG/PNG export |
| **VS Code** | ≥ 1.109.0 |

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| TSQX: Preview TSQX Figure | `Cmd+Shift+Alt+V` / `Ctrl+Shift+Alt+V` | Compile and open the persistent vector preview |
| TSQX: Open Generated PDF | — | Open the formal PDF output in VS Code's PDF viewer |
| TSQX: Export Figure as SVG | — | Export a vector SVG through `pdftocairo` |
| TSQX: Export Figure as PNG | — | Export a raster PNG at the configured DPI |
| TSQX: Compile TSQX File | `Cmd+Shift+B` / `Ctrl+Shift+B` | Compile to ASY and PDF |
| TSQX: Open Generated ASY | — | Open the generated `.asy` file beside the editor |
| TSQX: Export Standalone ASY (Inline Theme) | — | Inline `ldgeo.asy` and the active theme into a self-contained `.asy` file for sharing |
| TSQX: Select Diagram Theme | — | Switch between `auto`, `classic`, `print`, `flexoki`, `colormath`, `slides`, and `none` |
| TSQX: Diagnose Toolchain | — | Check `tsqx` / `asy` commands, versions, and current extension settings |
| TSQX: Show Compiler Output | — | Open detailed compiler logs |
| TSQX: Run First-Use Setup | — | Check tools and configure output and auto-compile behavior |
| TSQX: Compile All Files in Workspace | — | Compile every `.tsqx` file in the workspace |
| TSQX: Clean Generated Artifacts | — | Delete the current file's generated ASY and PDF after confirmation |
| TSQX: New Figure from Template | — | Choose a verified construction template and create a named `.tsqx` file |
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
  "tsqx.pdfConverterPath": "pdftocairo", // Poppler converter used by preview/export
  "tsqx.pngDpi": 144,                // PNG export resolution (72–600 DPI)
  "tsqx.outputDirectory": "",       // empty: beside source; e.g. ".tsqx-build"
  "tsqx.extraTsqxArgs": ["-p"],     // extra CLI args; each argument is a separate array item
  "tsqx.theme": "auto",             // semantic theme: auto / classic / print / flexoki / colormath / slides / none
  "tsqx.scale": "default",          // physical width preset: default / compact (5.5cm) / standard (7.5cm) / wide (11.5cm)
  "tsqx.customLdgeoPath": ""        // optional path to a custom ldgeo.asy (empty uses bundled library)
}
```

For example, use `["-p", "-s", "200"]` to pass a size. Legacy string values remain supported. Commands are executed directly without a shell.

With `"tsqx.theme": "auto"`, the extension first checks ancestor `.tsqxrc.json` (`theme`) and `project.yaml` (`tsqx_theme`) files; otherwise it activates `classic` automatically whenever semantic tokens (`given`, `aux`, `key`, `fill1`, ...) or `ldgeo.asy` helpers (`otherPt`, `check_perp`, ...) appear in the `.tsqx` source (keeping `.tsqx` files zero-boilerplate).

Relative output directories are resolved from the workspace root. The source folder structure is retained below that directory, so `chapter1/figures/a.tsqx` becomes `.tsqx-build/chapter1/figures/a.pdf`. Absolute paths and the `${workspaceFolder}` / `${fileDirname}` variables are also supported.

## First-Use Setup

When the first TSQX editor opens, the extension offers to run setup. It checks the configured `tsqx`, `asy`, and `pdftocairo` commands, then lets you choose whether outputs stay beside source files or under `.tsqx-build`, and whether save-time compilation is enabled. Run **TSQX: Run First-Use Setup** at any time to repeat it.

## Language Assistance

Builtin function completion and hover help include links to the [TSQX syntax reference](https://github.com/YZDame/tsqx-book/blob/main/docs/syntax-reference.md) and [theme guide](https://github.com/YZDame/tsqx-book/blob/main/docs/theme-guide.md).

Completion includes documented TSQX and `ldgeo.asy` geometry functions, points already defined in the current document, semantic theme tokens (`given`, `aux`, `key`, `circ`, `fill1`, ...), colors, and pen styles. Hover shows function signatures, semantic role descriptions, or the nearest preceding point definition. The editor also reports live lint warnings for common TSQX parser traps (missing `/` before stroke styles, parenthesized pen calls after `/`, spaced infix minus, and parenthesized expressions joined directly with `--`).

## Diagnostics and Failed Previews

When Asymptote reports an error, the Problems panel records its exact location in the **generated `.asy`** file and also shows a summary at the start of the original `.tsqx` file, with related information linking to the generated location. This is **not** an exact ASY-to-TSQX line source map. Open **TSQX: Open Generated ASY** to inspect it.

If compilation fails while a live preview is open, the extension keeps the last successful drawing visible and displays a warning that it is **not the latest source output**. A successful recompilation refreshes the drawing and clears the warning.

## Preview and Export

The persistent preview converts the current PDF to SVG in the extension's private cache and displays it in a dedicated Webview. Saving recompiles and refreshes the same panel while preserving its zoom and scroll state. If `pdftocairo` is unavailable, the command falls back to VS Code's PDF viewer. Use **Open Generated PDF** whenever you want to inspect the formal PDF directly.

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
npm run smoke:templates
npm run smoke:export -- /path/to/file.pdf
```

Example:

```bash
npm run smoke:compile -- /Users/leyudame/Documents/tsqx/examples/figures/fig1.tsqx
```

Release workflow details are documented in [docs/RELEASE.md](./docs/RELEASE.md).

## How It Works

1. `tsqx -p < input.tsqx > output.asy` — generates Asymptote source
2. `asy output.asy` — compiles to PDF
3. The PDF is converted to a cached SVG for the persistent Webview preview; the formal PDF remains available separately

## Activity Bar

Open **TSQX** in the Activity Bar. Its four panels can be expanded or collapsed independently.

| Panel | What it contains |
| --- | --- |
| **Build** | Create a figure from a template and compile the current file or workspace |
| **Preview & Export** | Open Live Preview, PDF, or ASY and export SVG or PNG |
| **Snippets** | Browse starting shapes, points and intersections, triangle centers and circles, and drawing styles |
| **Tools & Settings** | Toggle auto-compile, clean outputs, view logs, diagnose the toolchain, run setup, and set the file language |

In a TSQX editor, type `tsqx-` to see suggestions, or run **TSQX: Insert Snippet** to search by name, prefix, or description. You can also select a snippet in the sidebar to insert it. Press **Tab** to move through its placeholders. For example, `tsqx-incircle` draws a triangle's incircle and `tsqx-path-intersections` defines both intersection points of two paths.

## DeepSeek Harness

Install the `dsh-tsqx-compiler-*.tgz` asset from [GitHub Releases](https://github.com/YZDame/tsqx-compiler/releases/latest) using **Add plugin** in DeepSeek Harness. You can paste the tarball URL or use a downloaded copy with `dsh plugin --profile tui add ./dsh-tsqx-compiler-0.1.0.tgz`. The plugin provides the `tsqx_snippets` tool and a skill that can compile figures to ASY and PDF through the session shell. See the [DSH plugin guide](plugins/dsh-tsqx-compiler/README.md) for requirements.

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
