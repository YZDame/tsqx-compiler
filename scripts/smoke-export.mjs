#!/usr/bin/env node

import { createRequire } from 'node:module';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { convertPdf } = require('../out/pdfConverter.js');
const pdfArgument = process.argv[2];
if (!pdfArgument) {
	console.error('Usage: npm run smoke:export -- /absolute/or/relative/path/to/file.pdf');
	process.exit(1);
}

const pdfPath = path.resolve(pdfArgument);
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'tsqx-export-'));
const converter = process.env.PDF_CONVERTER_PATH || 'pdftocairo';
const svgPath = path.join(temporaryDirectory, 'figure.svg');
const pngPath = path.join(temporaryDirectory, 'figure.png');

try {
	await convertPdf(pdfPath, svgPath, 'svg', { command: converter, timeoutMs: 30_000 });
	await convertPdf(pdfPath, pngPath, 'png', { command: converter, timeoutMs: 30_000, pngDpi: 144 });
	console.log(`SVG: ${svgPath} (${(await stat(svgPath)).size} bytes)`);
	console.log(`PNG: ${pngPath} (${(await stat(pngPath)).size} bytes)`);
	console.log('SVG and PNG export smoke test passed.');
} finally {
	await rm(temporaryDirectory, { recursive: true, force: true });
}
