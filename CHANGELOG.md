# Changelog

All notable changes to the TSQX Compiler extension will be documented in this file.

## [Unreleased]

## [0.4.1] - 2026-08-12

### Changed
- Refresh README badges in the published extension documentation

## [0.4.0] - 2026-08-12

### Changed
- Redesign the Marketplace icon while preserving the TSQX triangle-and-incircle identity
- Organize Activity Bar commands into collapsible create/compile, preview/export, and tools/settings groups

### Fixed
- Update the VS Code extension test runner for current macOS application bundle layouts

## [0.3.1] - 2026-08-11

### Fixed
- Normalize expanded output paths and use portable absolute fixtures on Windows

## [0.3.0] - 2026-08-11

### Changed
- Run `tsqx` and `asy` without a shell and accept argument arrays while retaining legacy string configuration support
- Queue compilation per file so saves during an active compile trigger a final up-to-date rebuild
- Replace generated outputs only after validating non-empty artifacts and recompile stale previews
- Attach Asymptote diagnostics to the generated `.asy` file instead of misleading TSQX source locations

### Added
- First-use setup for validating the toolchain and configuring output and auto-compile behavior
- Configurable output directories with workspace-relative subfolder preservation
- Workspace-wide compilation with progress, cancellation, and result summaries
- Confirmed cleanup of generated ASY and PDF artifacts
- Figure templates and reusable TSQX snippets for common geometry constructions
- Completion for builtins, document points, colors, and pen styles
- Hover documentation, document symbols, and current-file go-to-definition
- Syntax highlighting for numbered points, label flags, and direction modifiers used by the TSQX parser
- Persistent SVG live preview that preserves its panel, zoom, and scroll state across refreshes
- Explicit PDF opening plus SVG and configurable-DPI PNG export commands
- `pdftocairo` diagnosis and safe PDF-conversion fallback behavior
- Resolved executable paths in setup details and `.tsqx`-named files created from templates

### Fixed
- Make status-bar error clicks open compiler output and keep auto-compile toggles scoped to the workspace
- Repair release workflow validation and support manual recovery for an existing tag

### Testing
- Add cross-platform unit jobs and direct coverage for argument parsing, stale outputs, compiler failures, timeouts, atomic output preservation, and per-file scheduling
- Exclude test and development sources from release VSIX packages

## [0.2.0] - 2026-03-22

### Added
- Configurable `tsqx.autoCompileDelay` setting with a default of 1000 ms
- Command to open the generated `.asy` file directly from the extension
- Toolchain diagnosis command for checking `tsqx`, `asy`, and extension settings
- Local smoke test script for real `tsqx` -> `asy` -> `pdf` verification
- GitHub Actions CI and release workflows
- Release process documentation and repository agent guidance

### Fixed
- Asymptote PDF output now targets the source file directory reliably

## [0.1.0] - 2026-03-06

### Added
- Compile TSQX files to Asymptote (.asy) and PDF
- Live PDF preview in side panel
- Auto-compile on save with debounce (default: on)
- TextMate syntax highlighting for `.tsqx` files
- Activity Bar sidebar with compile/preview/toggle commands
- Inline diagnostics (errors and warnings in Problems panel)
- Status bar with compilation status indicator
- Support marking `.txt` files as TSQX language
- Configurable paths for `tsqx` and `asy` executables
- Cross-platform support (macOS, Linux, Windows)
