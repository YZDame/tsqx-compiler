import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as path from 'node:path';
import { resolveOutputDirectory } from '../outputDirectory';

test('uses the source directory when output configuration is empty', () => {
  const workspace = path.resolve('workspace');
  const source = path.join(workspace, 'figures', 'a.tsqx');
  assert.equal(
    resolveOutputDirectory(source, '', workspace),
    path.join(workspace, 'figures')
  );
});

test('preserves source subfolders under a workspace-relative output root', () => {
  const workspace = path.resolve('workspace');
  const source = path.join(workspace, 'chapter', 'figures', 'a.tsqx');
  assert.equal(
    resolveOutputDirectory(source, '.tsqx-build', workspace),
    path.join(workspace, '.tsqx-build', 'chapter', 'figures')
  );
});

test('expands workspace and file directory variables', () => {
  const workspace = path.resolve('workspace');
  const source = path.join(workspace, 'figures', 'a.tsqx');
  assert.equal(
    resolveOutputDirectory(source, '${workspaceFolder}/generated', workspace),
    path.join(workspace, 'generated', 'figures')
  );
  assert.equal(
    resolveOutputDirectory(source, '${fileDirname}/generated', workspace),
    path.join(workspace, 'figures', 'generated')
  );
});
