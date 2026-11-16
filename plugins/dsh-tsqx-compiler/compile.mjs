import { stat } from 'node:fs/promises';
import path from 'node:path';
import { compileTsqx } from './lib/compiler.cjs';

const [source] = process.argv.slice(2);
if (process.argv.length !== 3 || !source || path.extname(source).toLowerCase() !== '.tsqx') {
	console.error('Usage: node compile.mjs <file.tsqx>');
	process.exit(2);
}

try {
	const file = path.resolve(source);
	if (!(await stat(file)).isFile()) {
		throw new Error(`Expected a TSQX file: ${file}`);
	}
	const result = await compileTsqx(file, {
		timeout: 30,
		tsqxPath: process.env.TSQX_PATH || 'tsqx',
		asyPath: process.env.ASY_PATH || 'asy',
		extraArgs: ['-p'],
	});
	console.log(JSON.stringify(result, null, 2));
	process.exitCode = result.success ? 0 : 1;
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
}
