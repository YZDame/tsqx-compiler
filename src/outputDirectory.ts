import * as path from 'path';

export function resolveOutputDirectory(
  sourcePath: string,
  configuredDirectory: string,
  workspaceFolder?: string
): string {
  const sourceDirectory = path.dirname(sourcePath);
  const configured = configuredDirectory.trim();
  if (!configured || configured === '${fileDirname}') {
    return sourceDirectory;
  }

  const relativeSourceDirectory = workspaceFolder
    ? safeWorkspaceRelativeDirectory(workspaceFolder, sourceDirectory)
    : '';
  const expanded = configured
    .replaceAll('${fileDirname}', sourceDirectory)
    .replaceAll('${workspaceFolder}', workspaceFolder || sourceDirectory);
  const root = path.isAbsolute(expanded)
    ? path.normalize(expanded)
    : path.resolve(workspaceFolder || sourceDirectory, expanded);

  if (configured.includes('${fileDirname}')) {
    return root;
  }
  return relativeSourceDirectory ? path.join(root, relativeSourceDirectory) : root;
}

function safeWorkspaceRelativeDirectory(workspaceFolder: string, sourceDirectory: string): string {
  const relative = path.relative(workspaceFolder, sourceDirectory);
  if (!relative || relative === '.') {
    return '';
  }
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return '';
  }
  return relative;
}
