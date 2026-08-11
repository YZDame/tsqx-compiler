import * as vscode from 'vscode';
import { CompilationResult } from './compiler';

export function createDiagnosticEntries(
  tsqxFilePath: string,
  result: CompilationResult
): Map<string, vscode.Diagnostic[]> {
  const entries = new Map<string, vscode.Diagnostic[]>();
  entries.set(tsqxFilePath, []);
  entries.set(result.asyPath, []);

  for (const issue of result.issues) {
    const targetPath = issue.targetPath || tsqxFilePath;
    const line = Math.max(0, (issue.line ?? 1) - 1);
    const column = Math.max(0, (issue.column ?? 1) - 1);
    const range = new vscode.Range(line, column, line, column + 1);
    const severity = issue.severity === 'error'
      ? vscode.DiagnosticSeverity.Error
      : vscode.DiagnosticSeverity.Warning;
    const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
    diagnostic.source = `TSQX Compiler (${issue.stage})`;
    const diagnostics = entries.get(targetPath) ?? [];
    diagnostics.push(diagnostic);
    entries.set(targetPath, diagnostics);
  }

  return entries;
}
