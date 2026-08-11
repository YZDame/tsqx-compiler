# Changelog

All notable changes to the TSQX Compiler extension will be documented in this file.

## [Unreleased]

### Changed
- Run `tsqx` and `asy` without a shell and accept argument arrays while retaining legacy string configuration support
- Queue compilation per file so saves during an active compile trigger a final up-to-date rebuild
- Replace generated outputs only after validating non-empty artifacts and recompile stale previews
- Attach Asymptote diagnostics to the generated `.asy` file instead of misleading TSQX source locations

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
