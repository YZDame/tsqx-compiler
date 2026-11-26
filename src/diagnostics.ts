import * as vscode from 'vscode';
import { CompilationResult } from './compiler';
import { lintTsqxSource } from './languageModel';

export function createSourceLintDiagnostics(sourceText: string): vscode.Diagnostic[] {
  return lintTsqxSource(sourceText).map(warning => {
    const range = new vscode.Range(warning.line, warning.start, warning.line, warning.end);
    const diagnostic = new vscode.Diagnostic(range, warning.message, vscode.DiagnosticSeverity.Warning);
    diagnostic.source = 'TSQX Compiler (lint)';
    return diagnostic;
  });
}

export function createDiagnosticEntries(
  tsqxFilePath: string,
  result: CompilationResult,
  sourceText?: string
): Map<string, vscode.Diagnostic[]> {
  const entries = new Map<string, vscode.Diagnostic[]>();
  entries.set(tsqxFilePath, sourceText ? createSourceLintDiagnostics(sourceText) : []);
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

  // ASY line numbers belong to the generated file, not the original TSQX.
  // Surface a source-level failure without claiming a false line mapping,
  // and keep a navigable link to the precise generated ASY location.
  const asyError = result.success ? undefined : result.issues.find(
    issue => issue.stage === 'asy' && issue.severity === 'error'
  );
  if (asyError) {
    const sourceMessage = asyError.line
      ? `Asymptote compilation failed (generated ASY line ${asyError.line}): ${asyError.message}`
      : `Asymptote compilation failed: ${asyError.message}`;
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 1),
      `${sourceMessage}. Open the generated .asy file to inspect the error.`,
      vscode.DiagnosticSeverity.Error
    );
    diagnostic.source = 'TSQX Compiler (generated ASY)';
    if (asyError.line) {
      const generatedLocation = new vscode.Location(
        vscode.Uri.file(result.asyPath),
        new vscode.Position(
          Math.max(0, asyError.line - 1),
          Math.max(0, (asyError.column ?? 1) - 1)
        )
      );
      diagnostic.relatedInformation = [
        new vscode.DiagnosticRelatedInformation(
          generatedLocation,
          'Generated Asymptote error location (not a TSQX source line).'
        ),
      ];
    }
    entries.get(tsqxFilePath)?.push(diagnostic);
  }

  return entries;
}
