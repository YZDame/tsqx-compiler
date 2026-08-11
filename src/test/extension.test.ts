import * as assert from 'assert';
import * as vscode from 'vscode';
import { createDiagnosticEntries } from '../diagnostics';

suite('Extension Test Suite', () => {
	test('registers TSQX commands on activation', async () => {
		const extension = vscode.extensions.getExtension('LYDT.tsqx-compiler');
		assert.ok(extension, 'Extension should be discoverable by id');

		await extension?.activate();

		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('tsqx.compile'));
		assert.ok(commands.includes('tsqx.preview'));
		assert.ok(commands.includes('tsqx.openGeneratedAsy'));
		assert.ok(commands.includes('tsqx.diagnoseToolchain'));
		assert.ok(commands.includes('tsqx.showOutput'));
		assert.ok(commands.includes('tsqx.setup'));
		assert.ok(commands.includes('tsqx.compileWorkspace'));
		assert.ok(commands.includes('tsqx.cleanArtifacts'));
		assert.ok(commands.includes('tsqx.toggleAutoCompile'));
		assert.ok(commands.includes('tsqx.setLanguage'));
	});

	test('exposes default configuration values', () => {
		const config = vscode.workspace.getConfiguration('tsqx');

		assert.strictEqual(config.get('autoCompileOnSave'), true);
		assert.strictEqual(config.get('autoCompileDelay'), 1000);
		assert.strictEqual(config.get('compilationTimeout'), 30);
		assert.deepStrictEqual(config.get('extraTsqxArgs'), ['-p']);
		assert.strictEqual(config.get('outputDirectory'), '');
	});

	test('routes generated Asymptote diagnostics to the ASY file', () => {
		const tsqxPath = '/tmp/figure.tsqx';
		const asyPath = '/tmp/figure.asy';
		const entries = createDiagnosticEntries(tsqxPath, {
			success: false,
			asyPath,
			pdfPath: '/tmp/figure.pdf',
			errors: ['syntax error'],
			warnings: [],
			durationMs: 10,
			issues: [{
				severity: 'error',
				stage: 'asy',
				message: 'syntax error',
				targetPath: asyPath,
				line: 4,
				column: 2,
			}],
		});
		const diagnostics = entries.get(asyPath);
		assert.strictEqual(diagnostics?.length, 1);
		assert.strictEqual(diagnostics?.[0].range.start.line, 3);
		assert.strictEqual(diagnostics?.[0].range.start.character, 1);
		assert.strictEqual(diagnostics?.[0].source, 'TSQX Compiler (asy)');
	});
});
