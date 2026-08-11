import * as vscode from 'vscode';
import * as path from 'path';
import { FIGURE_TEMPLATES } from './figureTemplates';

export async function openFigureTemplate(): Promise<void> {
  const template = await vscode.window.showQuickPick([...FIGURE_TEMPLATES], {
    title: 'Create a TSQX figure from a template',
  });
  if (!template) {
    return;
  }
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const destination = await vscode.window.showSaveDialog({
    defaultUri: workspaceRoot
      ? vscode.Uri.file(path.join(workspaceRoot, template.filename))
      : undefined,
    filters: { 'TSQX figure': ['tsqx'] },
    title: 'Save the new TSQX figure',
  });
  if (!destination) {
    return;
  }
  const destinationPath = destination.fsPath.toLowerCase().endsWith('.tsqx')
    ? destination.fsPath
    : `${destination.fsPath}.tsqx`;
  const destinationUri = vscode.Uri.file(destinationPath);
  await vscode.workspace.fs.writeFile(destinationUri, Buffer.from(template.content, 'utf8'));
  const document = await vscode.workspace.openTextDocument(destinationUri);
  await vscode.window.showTextDocument(document);
}
