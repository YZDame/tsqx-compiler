import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export type CompilationStage = 'tsqx' | 'asy' | 'extension';

export interface CompilationIssue {
  severity: 'error' | 'warning';
  stage: CompilationStage;
  message: string;
  targetPath: string;
  line?: number;
  column?: number;
}

export interface CompilationResult {
  success: boolean;
  asyPath: string;
  pdfPath: string;
  errors: string[];
  warnings: string[];
  issues: CompilationIssue[];
  durationMs: number;
}

export interface CompileOptions {
  timeout: number;
  tsqxPath: string;
  asyPath: string;
  extraArgs: readonly string[];
  outputDirectory?: string;
}

export interface OutputPaths {
  asyPath: string;
  pdfPath: string;
}

export interface ProcessResult {
  stdout: string;
  stderr: string;
}

interface ProcessFailure extends Error {
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  timedOut?: boolean;
}

export async function compileTsqx(
  tsqxFilePath: string,
  options: CompileOptions
): Promise<CompilationResult> {
  const startedAt = Date.now();
  const dir = path.dirname(tsqxFilePath);
  const basename = path.basename(tsqxFilePath, path.extname(tsqxFilePath));
  const outputDirectory = options.outputDirectory || dir;
  const { asyPath: asyFilePath, pdfPath } = getOutputPaths(tsqxFilePath, outputDirectory);
  const timeoutMs = options.timeout * 1000;
  const issues: CompilationIssue[] = [];
  await fs.promises.mkdir(outputDirectory, { recursive: true });
  const tempDir = await fs.promises.mkdtemp(path.join(outputDirectory, `.${basename}.tsqx-`));
  const tempAsyPath = path.join(tempDir, `${basename}.asy`);
  const tempPdfBase = path.join(tempDir, basename);
  const tempPdfPath = `${tempPdfBase}.pdf`;

  try {
    let tsqxResult: ProcessResult;
    try {
      const source = await fs.promises.readFile(tsqxFilePath, 'utf8');
      tsqxResult = await runProcess(
        options.tsqxPath,
        [...options.extraArgs],
        { cwd: dir, input: source, timeoutMs }
      );
      await fs.promises.writeFile(tempAsyPath, tsqxResult.stdout, 'utf8');
      await ensureNonEmptyFile(tempAsyPath, 'ASY');
      await replaceFile(tempAsyPath, asyFilePath);
      issues.push(...parseCompilerOutput('tsqx', tsqxResult.stderr, 'warning', tsqxFilePath));
    } catch (error) {
      const failure = normalizeFailure(error);
      issues.push(...issuesForFailure('tsqx', failure, tsqxFilePath));
      return finishResult(false, asyFilePath, pdfPath, issues, startedAt);
    }

    try {
      const asyResult = await runProcess(
        options.asyPath,
        ['-f', 'pdf', '-o', tempPdfBase, asyFilePath],
        { cwd: dir, timeoutMs }
      );
      await ensureNonEmptyFile(tempPdfPath, 'PDF');
      await replaceFile(tempPdfPath, pdfPath);
      issues.push(...parseCompilerOutput('asy', asyResult.stderr, 'warning', asyFilePath));
    } catch (error) {
      const failure = normalizeFailure(error);
      issues.push(...issuesForFailure('asy', failure, asyFilePath));
      return finishResult(false, asyFilePath, pdfPath, issues, startedAt);
    }

    return finishResult(true, asyFilePath, pdfPath, issues, startedAt);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}

export function getOutputPaths(tsqxFilePath: string, outputDirectory?: string): OutputPaths {
  const basename = path.basename(tsqxFilePath, path.extname(tsqxFilePath));
  const directory = outputDirectory || path.dirname(tsqxFilePath);
  return {
    asyPath: path.join(directory, `${basename}.asy`),
    pdfPath: path.join(directory, `${basename}.pdf`),
  };
}

export async function isOutputStale(sourcePath: string, outputPath: string): Promise<boolean> {
  try {
    const [sourceStat, outputStat] = await Promise.all([
      fs.promises.stat(sourcePath),
      fs.promises.stat(outputPath),
    ]);
    return outputStat.size === 0 || sourceStat.mtimeMs > outputStat.mtimeMs;
  } catch {
    return true;
  }
}

export function normalizeExtraArgs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value !== 'string') {
    return ['-p'];
  }
  return splitCommandLine(value);
}

export function splitCommandLine(value: string): string[] {
  const args: string[] = [];
  let current = '';
  let quote: '"' | "'" | undefined;
  let escaped = false;

  for (const char of value.trim()) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === '\\' && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) {
        quote = undefined;
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (/\s/.test(char)) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (escaped) {
    current += '\\';
  }
  if (quote) {
    throw new Error('Unterminated quote in tsqx.extraTsqxArgs');
  }
  if (current) {
    args.push(current);
  }
  return args;
}

export function runProcess(
  command: string,
  args: readonly string[],
  options: { cwd: string; input?: string; timeoutMs: number }
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      shell: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let settled = false;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, options.timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.stdin.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code !== 'EPIPE' && !settled) {
        child.kill();
      }
    });
    child.on('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      const failure = error as ProcessFailure;
      failure.stdout = Buffer.concat(stdout).toString('utf8');
      failure.stderr = Buffer.concat(stderr).toString('utf8');
      reject(failure);
    });
    child.on('close', (exitCode) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      const stdoutText = Buffer.concat(stdout).toString('utf8');
      const stderrText = Buffer.concat(stderr).toString('utf8');
      if (exitCode === 0 && !timedOut) {
        resolve({ stdout: stdoutText, stderr: stderrText });
        return;
      }
      const message = timedOut
        ? `Process timed out after ${options.timeoutMs}ms`
        : `Process exited with code ${exitCode}`;
      const failure = new Error(message) as ProcessFailure;
      failure.stdout = stdoutText;
      failure.stderr = stderrText;
      failure.exitCode = exitCode;
      failure.timedOut = timedOut;
      reject(failure);
    });

    if (options.input !== undefined) {
      child.stdin.end(options.input);
    } else {
      child.stdin.end();
    }
  });
}

function parseCompilerOutput(
  stage: CompilationStage,
  output: string,
  severity: 'error' | 'warning',
  fallbackPath: string
): CompilationIssue[] {
  return output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => stage !== 'asy' || (!line.includes('Writing') && !line.includes('Output')))
    .map(line => {
      const match = line.match(/^(.*?):\s*(\d+)(?:[.:](\d+))?:\s*(.*)$/);
      if (!match) {
        return { severity, stage, message: line, targetPath: fallbackPath };
      }
      return {
        severity,
        stage,
        message: match[4] || line,
        targetPath: fallbackPath,
        line: Number.parseInt(match[2], 10),
        column: match[3] ? Number.parseInt(match[3], 10) : 1,
      };
    });
}

function issuesForFailure(
  stage: CompilationStage,
  failure: ProcessFailure,
  targetPath: string
): CompilationIssue[] {
  const details = [failure.stderr, failure.stdout].filter(Boolean).join('\n').trim();
  const parsed = parseCompilerOutput(stage, details, 'error', targetPath);
  if (parsed.length > 0) {
    return parsed;
  }
  return [{
    severity: 'error',
    stage,
    message: failure.message,
    targetPath,
  }];
}

function normalizeFailure(error: unknown): ProcessFailure {
  return error instanceof Error ? error as ProcessFailure : new Error(String(error));
}

async function ensureNonEmptyFile(filePath: string, label: string): Promise<void> {
  const stat = await fs.promises.stat(filePath);
  if (stat.size === 0) {
    throw new Error(`${label} output is empty`);
  }
}

async function replaceFile(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    await fs.promises.rename(sourcePath, destinationPath);
  } catch (error: any) {
    if (process.platform !== 'win32' || !['EEXIST', 'EPERM'].includes(error?.code)) {
      throw error;
    }
    await fs.promises.rm(destinationPath, { force: true });
    await fs.promises.rename(sourcePath, destinationPath);
  }
}

function finishResult(
  success: boolean,
  asyPath: string,
  pdfPath: string,
  issues: CompilationIssue[],
  startedAt: number
): CompilationResult {
  return {
    success,
    asyPath,
    pdfPath,
    issues,
    errors: issues.filter(issue => issue.severity === 'error').map(issue => issue.message),
    warnings: issues.filter(issue => issue.severity === 'warning').map(issue => issue.message),
    durationMs: Date.now() - startedAt,
  };
}
