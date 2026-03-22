import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

export interface CompilationResult {
  success: boolean;
  asyPath: string;
  pdfPath: string;
  errors: string[];
  warnings: string[];
}

export interface CompileOptions {
  timeout: number;
  tsqxPath: string;
  asyPath: string;
  extraArgs: string;
}

export async function compileTsqx(
  tsqxFilePath: string,
  options: CompileOptions
): Promise<CompilationResult> {
  const dir = path.dirname(tsqxFilePath);
  const basename = path.basename(tsqxFilePath, path.extname(tsqxFilePath));
  const asyFilePath = path.join(dir, `${basename}.asy`);
  const pdfPath = path.join(dir, `${basename}.pdf`);
  const pdfOutputBase = path.join(dir, basename);
  const timeoutMs = options.timeout * 1000;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: TSQX → ASY
  try {
    const tsqxCmd = `${shellQuote(options.tsqxPath)} ${options.extraArgs} < ${shellQuote(tsqxFilePath)} > ${shellQuote(asyFilePath)}`;
    const { stderr } = await execAsync(tsqxCmd, {
      timeout: timeoutMs,
      cwd: dir,
      shell: getShell(),
    });
    if (stderr) {
      warnings.push(`tsqx: ${stderr.trim()}`);
    }
  } catch (err: any) {
    const msg = err.stderr?.trim() || err.message;
    errors.push(`tsqx failed: ${msg}`);
    return { success: false, asyPath: asyFilePath, pdfPath, errors, warnings };
  }

  // Step 2: ASY → PDF
  try {
    const asyCmd = `${shellQuote(options.asyPath)} -f pdf -o ${shellQuote(pdfOutputBase)} ${shellQuote(asyFilePath)}`;
    const { stderr } = await execAsync(asyCmd, {
      timeout: timeoutMs,
      cwd: dir,
      shell: getShell(),
    });
    if (stderr) {
      // asy writes progress info to stderr; only treat real errors
      const lines = stderr.split('\n').filter(
        l => l.trim() && !l.includes('Writing') && !l.includes('Output')
      );
      if (lines.length > 0) {
        warnings.push(`asy: ${lines.join('; ')}`);
      }
    }
  } catch (err: any) {
    const msg = err.stderr?.trim() || err.message;
    errors.push(`asy failed: ${msg}`);
    return { success: false, asyPath: asyFilePath, pdfPath, errors, warnings };
  }

  // Verify PDF exists
  if (!fs.existsSync(pdfPath)) {
    errors.push(`PDF was not generated at: ${pdfPath}`);
    return { success: false, asyPath: asyFilePath, pdfPath, errors, warnings };
  }

  return { success: true, asyPath: asyFilePath, pdfPath, errors, warnings };
}

export function createDiagnostics(
  filePath: string,
  result: CompilationResult
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const error of result.errors) {
    // Try to parse "file:line.col: message" or "file:line: message"
    const match = error.match(/(\d+)[.:](\d+):\s*(.+)$/);
    if (match) {
      const line = Math.max(0, parseInt(match[1], 10) - 1);
      const col = Math.max(0, parseInt(match[2], 10) - 1);
      const range = new vscode.Range(line, col, line, col + 20);
      diagnostics.push(
        new vscode.Diagnostic(range, match[3], vscode.DiagnosticSeverity.Error)
      );
    } else {
      const range = new vscode.Range(0, 0, 0, 0);
      diagnostics.push(
        new vscode.Diagnostic(range, error, vscode.DiagnosticSeverity.Error)
      );
    }
  }

  for (const warning of result.warnings) {
    const range = new vscode.Range(0, 0, 0, 0);
    diagnostics.push(
      new vscode.Diagnostic(range, warning, vscode.DiagnosticSeverity.Warning)
    );
  }

  return diagnostics;
}

/** Shell-escape a file path for safe use in bash commands */
function shellQuote(s: string): string {
  if (process.platform === 'win32') {
    return '"' + s.replace(/"/g, '\\"') + '"';
  }
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

/** Return the appropriate shell for the current platform */
function getShell(): string {
  return process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
}
