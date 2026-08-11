#!/usr/bin/env node

import { createRequire } from 'node:module';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { compileTsqx } = require('../out/compiler.js');
const { FIGURE_TEMPLATES } = require('../out/figureTemplates.js');

const tempDirectory = await mkdtemp(path.join(tmpdir(), 'tsqx-templates-'));
const tsqxPath = process.env.TSQX_PATH || 'tsqx';
const asyPath = process.env.ASY_PATH || 'asy';

try {
	for (let index = 0; index < FIGURE_TEMPLATES.length; index += 1) {
		const template = FIGURE_TEMPLATES[index];
		const sourcePath = path.join(tempDirectory, `template-${index + 1}.tsqx`);
		await writeFile(sourcePath, template.content, 'utf8');
		const result = await compileTsqx(sourcePath, {
			timeout: 30,
			tsqxPath,
			asyPath,
			extraArgs: ['-p'],
		});
		if (!result.success) {
			throw new Error(`${template.label}: ${result.errors.join('; ')}`);
		}
		console.log(`✓ ${template.label}`);
	}
	console.log(`${FIGURE_TEMPLATES.length} template smoke compile(s) passed.`);
} finally {
	await rm(tempDirectory, { recursive: true, force: true });
}
