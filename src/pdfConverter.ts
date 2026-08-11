import * as fs from 'fs';
import * as path from 'path';
import { runProcess } from './compiler';

export type ExportFormat = 'svg' | 'png';

export interface PdfConversionOptions {
  command: string;
  timeoutMs: number;
  pngDpi?: number;
}

export async function convertPdf(
  pdfPath: string,
  destinationPath: string,
  format: ExportFormat,
  options: PdfConversionOptions
): Promise<void> {
  const destinationDirectory = path.dirname(destinationPath);
  const basename = path.basename(destinationPath, path.extname(destinationPath));
  await fs.promises.mkdir(destinationDirectory, { recursive: true });
  const tempDirectory = await fs.promises.mkdtemp(path.join(destinationDirectory, `.${basename}.export-`));
  const tempDestination = path.join(tempDirectory, `${basename}.${format}`);

  try {
    if (format === 'svg') {
      await runProcess(options.command, ['-svg', pdfPath, tempDestination], {
        cwd: path.dirname(pdfPath),
        timeoutMs: options.timeoutMs,
      });
    } else {
      const outputBase = path.join(tempDirectory, basename);
      await runProcess(options.command, [
        '-png',
        '-singlefile',
        '-r',
        String(options.pngDpi ?? 144),
        pdfPath,
        outputBase,
      ], {
        cwd: path.dirname(pdfPath),
        timeoutMs: options.timeoutMs,
      });
    }
    await ensureNonEmptyFile(tempDestination);
    await replaceFile(tempDestination, destinationPath);
  } finally {
    await fs.promises.rm(tempDirectory, { recursive: true, force: true });
  }
}

async function ensureNonEmptyFile(filePath: string): Promise<void> {
  const stat = await fs.promises.stat(filePath);
  if (stat.size === 0) {
    throw new Error(`Converted ${path.extname(filePath).slice(1).toUpperCase()} output is empty`);
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
