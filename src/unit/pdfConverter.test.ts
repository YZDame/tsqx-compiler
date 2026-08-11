import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { convertPdf } from '../pdfConverter';

test('converts SVG and PNG through literal converter arguments', { skip: process.platform === 'win32' }, async () => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tsqx converter '));
  try {
    const converter = path.join(directory, 'fake converter.mjs');
    await fs.promises.writeFile(converter, `#!/usr/bin/env node
import fs from 'node:fs';
const args = process.argv.slice(2);
if (args[0] === '-svg') {
  fs.writeFileSync(args[2], '<svg>converted</svg>');
} else if (args[0] === '-png') {
  const outputBase = args[args.length - 1];
  fs.writeFileSync(outputBase + '.png', 'PNG converted');
} else {
  process.exit(4);
}
`, 'utf8');
    await fs.promises.chmod(converter, 0o755);
    const pdfPath = path.join(directory, 'source with spaces.pdf');
    const svgPath = path.join(directory, 'output with spaces.svg');
    const pngPath = path.join(directory, 'output with spaces.png');
    await fs.promises.writeFile(pdfPath, '%PDF-fake');

    await convertPdf(pdfPath, svgPath, 'svg', { command: converter, timeoutMs: 10_000 });
    await convertPdf(pdfPath, pngPath, 'png', { command: converter, timeoutMs: 10_000, pngDpi: 200 });

    assert.equal(await fs.promises.readFile(svgPath, 'utf8'), '<svg>converted</svg>');
    assert.equal(await fs.promises.readFile(pngPath, 'utf8'), 'PNG converted');
    assert.equal((await fs.promises.readdir(directory)).some(name => name.includes('.export-')), false);
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
});

test('keeps an existing export when conversion fails', { skip: process.platform === 'win32' }, async () => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tsqx converter failure '));
  try {
    const converter = path.join(directory, 'failing converter.mjs');
    await fs.promises.writeFile(converter, '#!/usr/bin/env node\nprocess.exit(5);\n', 'utf8');
    await fs.promises.chmod(converter, 0o755);
    const pdfPath = path.join(directory, 'source.pdf');
    const svgPath = path.join(directory, 'output.svg');
    await fs.promises.writeFile(pdfPath, '%PDF-fake');
    await fs.promises.writeFile(svgPath, 'old export');

    await assert.rejects(
      convertPdf(pdfPath, svgPath, 'svg', { command: converter, timeoutMs: 10_000 })
    );
    assert.equal(await fs.promises.readFile(svgPath, 'utf8'), 'old export');
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
});
