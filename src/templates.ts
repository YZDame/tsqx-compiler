import * as vscode from 'vscode';
import { FIGURE_TEMPLATES } from './figureTemplates';

export async function openFigureTemplate(): Promise<void> {
  const template = await vscode.window.showQuickPick([...FIGURE_TEMPLATES], {
    title: 'Create a TSQX figure from a template',
  });
  if (!template) {
    return;
  }
  const document = await vscode.workspace.openTextDocument({
    language: 'tsqx',
    content: template.content,
  });
  await vscode.window.showTextDocument(document);
}
