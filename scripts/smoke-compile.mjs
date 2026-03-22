#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function usage() {
	console.error('Usage: npm run smoke:compile -- /absolute/or/relative/path/to/file.tsqx');
	process.exit(1);
}

const inputArg = process.argv[2];
if (!inputArg) {
	usage();
}

const inputPath = path.resolve(inputArg);
const basename = path.basename(inputPath, path.extname(inputPath));
const tempDir = mkdtempSync(path.join(tmpdir(), 'tsqx-smoke-'));
const localTsqxPath = path.join(tempDir, `${basename}.tsqx`);
const asyPath = path.join(tempDir, `${basename}.asy`);
const pdfPath = path.join(tempDir, `${basename}.pdf`);

const tsqxBin = process.env.TSQX_PATH || 'tsqx';
const asyBin = process.env.ASY_PATH || 'asy';
const extraArgs = (process.env.TSQX_ARGS || '-p').trim().split(/\s+/).filter(Boolean);

try {
	const source = readFileSync(inputPath, 'utf8');
	writeFileSync(localTsqxPath, source, 'utf8');

	const tsqxResult = spawnSync(tsqxBin, extraArgs, {
		input: source,
		encoding: 'utf8',
		timeout: 30_000,
	});

	if (tsqxResult.error) {
		throw tsqxResult.error;
	}
	if (tsqxResult.status !== 0) {
		throw new Error(`tsqx exited with code ${tsqxResult.status}\n${tsqxResult.stderr || ''}`.trim());
	}

	writeFileSync(asyPath, tsqxResult.stdout, 'utf8');

	const asyResult = spawnSync(asyBin, [`${basename}.asy`], {
		cwd: tempDir,
		encoding: 'utf8',
		timeout: 30_000,
	});

	if (asyResult.error) {
		throw asyResult.error;
	}
	if (asyResult.status !== 0) {
		throw new Error(`asy exited with code ${asyResult.status}\n${asyResult.stderr || ''}`.trim());
	}
	if (!existsSync(pdfPath)) {
		throw new Error(`PDF was not generated at ${pdfPath}`);
	}

	const asySize = statSync(asyPath).size;
	const pdfSize = statSync(pdfPath).size;

	console.log(`Input: ${inputPath}`);
	console.log(`ASY: ${asyPath} (${asySize} bytes)`);
	console.log(`PDF: ${pdfPath} (${pdfSize} bytes)`);
	console.log('Smoke compile passed.');
} finally {
	rmSync(tempDir, { recursive: true, force: true });
}
