import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  compileTsqx,
  isOutputStale,
  normalizeExtraArgs,
  splitCommandLine,
} from '../compiler';

test('splitCommandLine preserves quoted and escaped arguments', () => {
  assert.deepEqual(
    splitCommandLine('-p -s "200 wide" --label one\\ two'),
    ['-p', '-s', '200 wide', '--label', 'one two']
  );
  assert.deepEqual(normalizeExtraArgs(['-p', '-s', '200']), ['-p', '-s', '200']);
  assert.deepEqual(normalizeExtraArgs('-p -s 200'), ['-p', '-s', '200']);
  assert.throws(() => splitCommandLine('-p "unfinished'), /Unterminated quote/);
});

test('isOutputStale detects missing, empty, and older outputs', async () => {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tsqx-stale-'));
  try {
    const source = path.join(dir, 'figure.tsqx');
    const output = path.join(dir, 'figure.pdf');
    await fs.promises.writeFile(source, 'source');
    assert.equal(await isOutputStale(source, output), true);
    await fs.promises.writeFile(output, '');
    assert.equal(await isOutputStale(source, output), true);
    await fs.promises.writeFile(output, 'pdf');
    const now = Date.now() / 1000;
    await fs.promises.utimes(source, now - 10, now - 10);
    await fs.promises.utimes(output, now, now);
    assert.equal(await isOutputStale(source, output), false);
    await fs.promises.utimes(source, now + 10, now + 10);
    assert.equal(await isOutputStale(source, output), true);
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

test('compileTsqx passes literal arguments and replaces validated outputs', { skip: process.platform === 'win32' }, async () => {
  const fixture = await createFixture();
  try {
    const tsqx = await createExecutable(fixture.dir, 'fake tsqx', `
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  if (!process.argv.includes('value with spaces')) {
    console.error('missing literal argument');
    process.exit(7);
  }
  process.stdout.write('// generated from: ' + input);
});`);
    const asy = await createExecutable(fixture.dir, 'fake asy', `
import fs from 'node:fs';
const args = process.argv.slice(2);
const outputIndex = args.indexOf('-o');
if (outputIndex < 0 || args[outputIndex + 1] === undefined) process.exit(8);
fs.writeFileSync(args[outputIndex + 1] + '.pdf', '%PDF-new');`);
    await fs.promises.writeFile(fixture.asyPath, 'old asy');
    await fs.promises.writeFile(fixture.pdfPath, 'old pdf');

    const result = await compileTsqx(fixture.sourcePath, {
      timeout: 10,
      tsqxPath: tsqx,
      asyPath: asy,
      extraArgs: ['value with spaces', '$(touch should-not-run)'],
    });

    assert.equal(result.success, true);
    assert.match(await fs.promises.readFile(fixture.asyPath, 'utf8'), /generated from/);
    assert.equal(await fs.promises.readFile(fixture.pdfPath, 'utf8'), '%PDF-new');
    assert.equal((await fs.promises.readdir(fixture.dir)).some(name => name.includes('.tsqx-')), false);
  } finally {
    await fixture.cleanup();
  }
});

test('compileTsqx creates and uses a configured output directory', { skip: process.platform === 'win32' }, async () => {
  const fixture = await createFixture();
  try {
    const outputDirectory = path.join(fixture.dir, 'generated files');
    const tsqx = await createExecutable(fixture.dir, 'output-tsqx', `
process.stdin.resume();
process.stdin.on('end', () => process.stdout.write('// generated'));`);
    const asy = await createExecutable(fixture.dir, 'output-asy', `
import fs from 'node:fs';
const args = process.argv.slice(2);
const outputIndex = args.indexOf('-o');
fs.writeFileSync(args[outputIndex + 1] + '.pdf', '%PDF-output');`);

    const result = await compileTsqx(fixture.sourcePath, {
      timeout: 10,
      tsqxPath: tsqx,
      asyPath: asy,
      extraArgs: [],
      outputDirectory,
    });

    assert.equal(result.success, true);
    assert.equal(result.asyPath, path.join(outputDirectory, 'figure with spaces.asy'));
    assert.equal(result.pdfPath, path.join(outputDirectory, 'figure with spaces.pdf'));
    assert.equal(await fs.promises.readFile(result.pdfPath, 'utf8'), '%PDF-output');
  } finally {
    await fixture.cleanup();
  }
});

test('compileTsqx keeps prior outputs when TSQX fails', { skip: process.platform === 'win32' }, async () => {
  const fixture = await createFixture();
  try {
    const tsqx = await createExecutable(fixture.dir, 'failing-tsqx', `
console.error('figure.tsqx:2.3: invalid point');
process.exit(2);`);
    const asy = await createExecutable(fixture.dir, 'unused-asy', 'process.exit(9);');
    await fs.promises.writeFile(fixture.asyPath, 'old asy');
    await fs.promises.writeFile(fixture.pdfPath, 'old pdf');

    const result = await compileTsqx(fixture.sourcePath, {
      timeout: 10,
      tsqxPath: tsqx,
      asyPath: asy,
      extraArgs: [],
    });

    assert.equal(result.success, false);
    assert.equal(result.issues[0]?.stage, 'tsqx');
    assert.equal(result.issues[0]?.line, 2);
    assert.equal(result.issues[0]?.column, 3);
    assert.equal(await fs.promises.readFile(fixture.asyPath, 'utf8'), 'old asy');
    assert.equal(await fs.promises.readFile(fixture.pdfPath, 'utf8'), 'old pdf');
  } finally {
    await fixture.cleanup();
  }
});

test('compileTsqx updates ASY but keeps prior PDF when Asymptote fails', { skip: process.platform === 'win32' }, async () => {
  const fixture = await createFixture();
  try {
    const tsqx = await createExecutable(fixture.dir, 'working-tsqx', `
process.stdin.resume();
process.stdin.on('end', () => process.stdout.write('// new asy'));`);
    const asy = await createExecutable(fixture.dir, 'failing-asy', `
const source = process.argv[process.argv.length - 1];
console.error(source + ':4.2: syntax error');
process.exit(3);`);
    await fs.promises.writeFile(fixture.asyPath, 'old asy');
    await fs.promises.writeFile(fixture.pdfPath, 'old pdf');

    const result = await compileTsqx(fixture.sourcePath, {
      timeout: 10,
      tsqxPath: tsqx,
      asyPath: asy,
      extraArgs: [],
    });

    assert.equal(result.success, false);
    assert.equal(result.issues[0]?.stage, 'asy');
    assert.equal(result.issues[0]?.targetPath, fixture.asyPath);
    assert.equal(result.issues[0]?.line, 4);
    assert.equal(await fs.promises.readFile(fixture.asyPath, 'utf8'), '// new asy');
    assert.equal(await fs.promises.readFile(fixture.pdfPath, 'utf8'), 'old pdf');
  } finally {
    await fixture.cleanup();
  }
});

test('compileTsqx reports timeouts and removes temporary files', { skip: process.platform === 'win32' }, async () => {
  const fixture = await createFixture();
  try {
    const tsqx = await createExecutable(fixture.dir, 'slow-tsqx', 'setTimeout(() => {}, 1000);');
    const asy = await createExecutable(fixture.dir, 'unused-asy', 'process.exit(9);');
    const result = await compileTsqx(fixture.sourcePath, {
      timeout: 0.05,
      tsqxPath: tsqx,
      asyPath: asy,
      extraArgs: [],
    });
    assert.equal(result.success, false);
    assert.match(result.errors.join('\n'), /timed out/i);
    assert.equal((await fs.promises.readdir(fixture.dir)).some(name => name.includes('.tsqx-')), false);
  } finally {
    await fixture.cleanup();
  }
});

async function createFixture() {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tsqx compiler test '));
  const sourcePath = path.join(dir, 'figure with spaces.tsqx');
  const asyPath = path.join(dir, 'figure with spaces.asy');
  const pdfPath = path.join(dir, 'figure with spaces.pdf');
  await fs.promises.writeFile(sourcePath, 'A B C');
  return {
    dir,
    sourcePath,
    asyPath,
    pdfPath,
    cleanup: () => fs.promises.rm(dir, { recursive: true, force: true }),
  };
}

async function createExecutable(dir: string, name: string, body: string): Promise<string> {
  const executablePath = path.join(dir, `${name}.mjs`);
  await fs.promises.writeFile(executablePath, `#!/usr/bin/env node\n${body}\n`, 'utf8');
  await fs.promises.chmod(executablePath, 0o755);
  return executablePath;
}
