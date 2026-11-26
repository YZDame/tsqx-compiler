import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const destination = path.resolve(process.argv[2] || path.join(root, 'dist'));
const staging = await mkdtemp(path.join(tmpdir(), 'dsh-tsqx-package-'));

try {
	await cp(path.join(root, 'plugins/dsh-tsqx-compiler'), staging, { recursive: true });
	await mkdir(path.join(staging, 'lib'));
	for (const file of ['compiler.js', 'themes.js', 'figureTemplates.js']) {
		let content = await readFile(path.join(root, 'out', file), 'utf8');
		if (file === 'compiler.js') {
			content = content.replace(/require\((['"])\.\/themes\1\)/g, 'require("./themes.cjs")');
		}
		await writeFile(path.join(staging, 'lib', file.replace(/\.js$/, '.cjs')), content, 'utf8');
	}
	// The VS Code build uses CommonJS. Keep its package scope inside the ESM plugin.
	await cp(path.join(root, 'assets'), path.join(staging, 'assets'), { recursive: true });
	await cp(path.join(root, 'snippets'), path.join(staging, 'snippets'), { recursive: true });
	await cp(path.join(root, 'LICENSE'), path.join(staging, 'LICENSE'));
	await mkdir(destination, { recursive: true });
	execFileSync(process.execPath, [process.env.npm_execpath, 'pack', '--pack-destination', destination], {
		cwd: staging, stdio: 'inherit',
	});
} finally {
	await rm(staging, { recursive: true, force: true });
}
