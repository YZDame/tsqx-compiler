# AGENTS

This repository contains a VS Code extension for compiling `.tsqx` files into `.asy` and `.pdf`, refreshing previews, and surfacing diagnostics.

## Core Commands

- `npm ci`
- `npm run compile`
- `npm run lint`
- `npm test`
- `npm run smoke:compile -- /path/to/file.tsqx`
- `npm run package:vsix`

## Change Rules

- Keep auto-compile, preview refresh, and diagnostics behavior working together.
- Update both `README.md` and `README.zh-CN.md` when user-facing settings or commands change.
- Do not hardcode local tool paths; use VS Code settings or environment variables in scripts.
- Prefer small, reviewable commits for local changes.

## Release Rules

- Small changes stay as normal local git commits without a version bump.
- Versioned releases must update `CHANGELOG.md` and bump `package.json` with `npm version patch|minor|major`.
- Push the version commit and tag together using `git push origin main --follow-tags`.
- Tag pushes like `v0.1.1` trigger GitHub Release packaging and optional VS Code Marketplace publishing.

## Validation

- Use `npm run smoke:compile -- /path/to/file.tsqx` for a real local toolchain check.
- Run `npm run check` before cutting a release.
- If extension tests require downloading VS Code, mention that dependency when reporting local results.
