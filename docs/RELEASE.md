# Release Workflow

## Local Development

Install dependencies and run the normal verification steps:

```bash
npm ci
npm run compile
npm run lint
npm test
```

For a real local toolchain smoke test with `tsqx` and `asy` installed:

```bash
npm run smoke:compile -- /absolute/path/to/file.tsqx
```

Example:

```bash
npm run smoke:compile -- /Users/leyudame/Documents/tsqx/examples/figures/fig1.tsqx
```

## Small Changes

Small fixes can stay as normal local git commits:

```bash
git add -A
git commit -m "fix: adjust auto compile delay setting"
```

No version bump is required for work that is not being released yet.

## Versioned Releases

When a change should become a public release:

1. Update `CHANGELOG.md`.
2. Bump the version:

```bash
npm version patch
```

Use `minor` or `major` when appropriate.

3. Push the version commit and tag:

```bash
git push origin main --follow-tags
```

If a tag push did not create a GitHub Release, run the **Release** workflow manually and supply the existing tag. Leave **Also publish to the VS Code Marketplace** off when that version is already present there.

## What the Release Workflow Does

Pushing a tag like `v0.1.1` triggers `.github/workflows/release.yml`, which:

- verifies the git tag matches `package.json`
- runs `npm run check`
- builds a `.vsix`
- creates a GitHub Release and uploads the `.vsix`
- publishes to the VS Code Marketplace when `VSCE_PAT` is configured

The workflow can also be started manually for an existing tag. Manual recovery does not publish to the Marketplace unless explicitly requested.

## Required Secrets

- `VSCE_PAT`: Visual Studio Marketplace personal access token

GitHub Release creation uses the default `GITHUB_TOKEN`.
