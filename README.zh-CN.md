# TSQX 编译器

[VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=LYDT.tsqx-compiler)
[![最新版本](https://img.shields.io/github/v/release/YZDame/tsqx-compiler)](https://github.com/YZDame/tsqx-compiler/releases/latest)
[![CI](https://github.com/YZDame/tsqx-compiler/actions/workflows/ci.yml/badge.svg)](https://github.com/YZDame/tsqx-compiler/actions/workflows/ci.yml)
[![GitHub Stars](https://img.shields.io/github/stars/YZDame/tsqx-compiler?style=social)](https://github.com/YZDame/tsqx-compiler)
[![许可证](https://img.shields.io/github/license/YZDame/tsqx-compiler)](https://github.com/YZDame/tsqx-compiler/blob/main/LICENSE)

[English](README.md) | 简体中文

在 VS Code 中将 [TSQX](https://github.com/vEnhance/tsqx) 几何图形文件编译为高质量的 PDF 图表（通过 [Asymptote](https://asymptote.sourceforge.io/)），支持**实时预览**、**语法高亮**和**自动编译**。

## 功能特性

- **持久实时预览** — 并排查看矢量预览；刷新时保留面板、缩放比例和滚动位置
- **保存时自动编译** — 默认启用。每次保存 `.tsqx` 文件时，PDF 会自动重新编译和刷新
- **语法高亮** — 完整的 `.tsqx` 文件 TextMate 语法支持：注释、点定义、绘制命令、内置函数、Asymptote 颜色名称和运算符
- **TXT 文件支持** — 右键点击任意 `.txt` 文件，选择"设置为 TSQX 语言"即可获得完整 TSQX 支持
- **内联诊断** — 编译错误和警告直接显示在编辑器的"问题"面板中
- **状态栏** — 显示编译状态和自动编译开关（点击切换开/关）
- **可配置路径** — 如果 `tsqx` 和 `asy` 不在 `$PATH` 中，可以指向自定义的可执行文件
- **首次使用向导** — 检查工具链，并通过向导设置输出位置和自动编译行为
- **项目输出目录** — 可将产物放在源码旁或统一的工作区构建目录中，同时避免同名文件冲突
- **工作区批量编译** — 带进度、取消和结果汇总地编译全部 `.tsqx` 文件
- **模板与代码片段** — 快速创建常见三角形、中心、垂足、圆和绘制结构
- **语言辅助** — 内置函数与点补全、悬停文档、文档大纲和定义跳转
- **SVG 与 PNG 导出** — 通过 Poppler 转换正式 PDF，并可设置 PNG 分辨率

## TSQX 项目导航

- **中文手册与实例**：[tsqx-book](https://github.com/YZDame/tsqx-book)（[语法参考](https://github.com/YZDame/tsqx-book/blob/main/docs/syntax-reference.md)）
- **AI 辅助几何作图**：[tsqx-gen-skill](https://github.com/YZDame/tsqx-gen-skill)
- **语言实现**：[vEnhance/tsqx](https://github.com/vEnhance/tsqx)（上游）

## 快速开始

1. 打开一个 `.tsqx` 文件
2. 点击编辑器工具栏中的**预览**图标（⧉）
3. 编辑器旁打开持久矢量预览——编辑并保存后会刷新内容，不替换面板

## 环境要求

| 工具 | 安装方式 |
|------|---------|
| **tsqx** | `pip install tsqx` 或从仓库 `pip install -e .` |
| **Asymptote** | `brew install asymptote` (macOS) / `apt install asymptote` (Linux) / [Windows 安装程序](https://asymptote.sourceforge.io/) |
| **Poppler** | `brew install poppler`（macOS）/ `apt install poppler-utils`（Linux）；持久预览和 SVG/PNG 导出需要 |
| **VS Code** | ≥ 1.109.0 |

## 命令

| 命令 | 快捷键 | 说明 |
|---------|----------|-------------|
| TSQX: 预览 TSQX 图形 | `Cmd+Shift+Alt+V` / `Ctrl+Shift+Alt+V` | 编译并打开持久矢量预览 |
| TSQX: 打开生成的 PDF | — | 在 VS Code PDF 查看器中打开正式 PDF 产物 |
| TSQX: 导出图形为 SVG | — | 通过 `pdftocairo` 导出矢量 SVG |
| TSQX: 导出图形为 PNG | — | 按设置的 DPI 导出位图 PNG |
| TSQX: 编译 TSQX 文件 | `Cmd+Shift+B` / `Ctrl+Shift+B` | 编译为 ASY 和 PDF |
| TSQX: 打开生成的 ASY | — | 在编辑器旁边打开生成的 `.asy` 文件 |
| TSQX: 诊断工具链 | — | 检查 `tsqx` / `asy` 命令、版本和当前扩展设置 |
| TSQX: 显示编译器输出 | — | 打开详细编译日志 |
| TSQX: 运行首次使用设置 | — | 检查工具并设置输出位置和自动编译行为 |
| TSQX: 编译工作区中的所有文件 | — | 编译工作区内全部 `.tsqx` 文件 |
| TSQX: 清理生成产物 | — | 确认后删除当前文件生成的 ASY 和 PDF |
| TSQX: 从模板新建图形 | — | 选择已核对的作图模板并创建具名 `.tsqx` 文件 |
| TSQX: 切换保存时自动编译 | — | 启用/禁用自动编译 |
| TSQX: 设置当前文件为 TSQX | — | 将 `.txt` 文件标记为 TSQX |

## 设置

```jsonc
{
  "tsqx.autoCompileOnSave": true,   // 保存时自动编译（默认：true）
  "tsqx.autoCompileDelay": 1000,    // 保存后自动编译前的延迟（毫秒）
  "tsqx.compilationTimeout": 30,    // 每次编译的最大秒数
  "tsqx.tsqxPath": "tsqx",          // tsqx 可执行文件路径
  "tsqx.asyPath": "asy",            // Asymptote 可执行文件路径
  "tsqx.pdfConverterPath": "pdftocairo", // 预览/导出使用的 Poppler 转换器
  "tsqx.pngDpi": 144,                // PNG 导出分辨率（72–600 DPI）
  "tsqx.outputDirectory": "",       // 空值：源码旁；例如 ".tsqx-build"
  "tsqx.extraTsqxArgs": ["-p"]      // 额外的 CLI 参数；每个参数单独占一个数组元素
}
```

例如，使用 `["-p", "-s", "200"]` 传入尺寸参数。旧版字符串配置仍然兼容。扩展会直接启动命令，不经过 shell。

相对输出目录以工作区根目录为基准，并保留源码的子目录结构。例如 `chapter1/figures/a.tsqx` 会输出为 `.tsqx-build/chapter1/figures/a.pdf`。同时支持绝对路径以及 `${workspaceFolder}`、`${fileDirname}` 变量。

## 首次使用设置

第一次打开 TSQX 编辑器时，扩展会询问是否运行设置向导。向导会检查已配置的 `tsqx`、`asy` 和 `pdftocairo` 命令，然后选择将产物放在源码旁或 `.tsqx-build` 中，并设置是否保存时自动编译。之后可随时运行 **TSQX: 运行首次使用设置**。

## 语言辅助

补全内容包括有文档依据的 TSQX 几何函数、当前文档已定义的点、颜色和画笔样式。悬停会显示函数签名或最近一次点定义；“大纲”视图列出点定义；“转到定义”可跟踪当前文件中的点引用。静态代码片段前缀包括 `tsqx-triangle`、`tsqx-point`、`tsqx-foot`、`tsqx-fill` 和 `tsqx-asy`。

## 错误诊断与旧版预览

Asymptote 编译错误的行号属于**生成的 `.asy` 文件**，并不必然对应到 `.tsqx` 的同一行。插件会在原始 TSQX 文件显示失败摘要，并在“问题”面板保留精确的 ASY 位置链接；可使用“打开生成的 ASY”定位具体错误。

如果编译失败，已打开的预览会继续显示上一次成功生成的图，同时提示“当前预览并非最新编译结果”。重新编译成功后会刷新并清除提示。

## 预览与导出

持久预览会把当前 PDF 转换成 SVG，存入扩展私有缓存，再显示在专用 Webview 中。保存后会在同一面板刷新，并保留缩放比例和滚动位置。如果找不到 `pdftocairo`，预览命令会回退到 VS Code 的 PDF 查看器。需要直接检查正式 PDF 时，可使用 **TSQX: 打开生成的 PDF**。

## 开发

```bash
npm ci
npm run compile
npm run lint
npm test
```

如果本机已经安装了 `tsqx` 和 `asy`，可以直接做一次真实 smoke test：

```bash
npm run smoke:compile -- /path/to/file.tsqx
npm run smoke:templates
npm run smoke:export -- /path/to/file.pdf
```

例如：

```bash
npm run smoke:compile -- /Users/leyudame/Documents/tsqx/examples/figures/fig1.tsqx
```

发布流程见 [docs/RELEASE.md](./docs/RELEASE.md)。

## 工作原理

1. `tsqx -p < input.tsqx > output.asy` — 生成 Asymptote 源码
2. `asy output.asy` — 编译为 PDF
3. PDF 被转换成缓存 SVG，供持久 Webview 预览；正式 PDF 仍可单独打开

## 活动栏

扩展在活动栏（左侧边栏）中添加了一个 **TSQX** 面板。命令按**创建与编译**、**预览与导出**、**工具与设置**分组，每组都可以折叠或展开：

- **编译当前文件** — 运行 tsqx → asy → pdf 流水线
- **从模板新建图形** — 选择保存位置并创建常见 TSQX 作图文件
- **编译工作区** — 带进度和取消功能地依次编译全部 TSQX 源码
- **实时预览** — 打开或刷新持久 SVG 预览面板
- **打开生成的 PDF** — 在 VS Code 查看器中检查正式 PDF
- **导出为 SVG / PNG** — 将当前图形保存为其他格式
- **清理生成产物** — 确认后删除所选源码生成的 ASY 和 PDF
- **切换自动编译** — 开启/关闭保存时自动编译
- **设置文件为 TSQX** — 将 `.txt` 文件标记为 TSQX

## 开发

```bash
git clone https://github.com/yzdame/tsqx-compiler.git
cd tsqx-compiler
npm install
npm run compile   # 构建一次
npm run watch     # 监视模式，自动重新构建
# 在 VS Code 中按 F5 启动扩展开发宿主
```

## 打包

```bash
npx vsce package
# 生成 tsqx-compiler-x.x.x.vsix
```

## 许可证

[MIT](LICENSE)
