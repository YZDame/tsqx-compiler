import * as assert from 'assert';
import * as vscode from 'vscode';

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
		assert.ok(commands.includes('tsqx.toggleAutoCompile'));
		assert.ok(commands.includes('tsqx.setLanguage'));
	});

	test('exposes default configuration values', () => {
		const config = vscode.workspace.getConfiguration('tsqx');

		assert.strictEqual(config.get('autoCompileOnSave'), true);
		assert.strictEqual(config.get('autoCompileDelay'), 1000);
		assert.strictEqual(config.get('compilationTimeout'), 30);
	});
});
