import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { compileTsqx, createDiagnostics } from './compiler';
import { TsqxSidebarProvider } from './sidebarProvider';

const execFileAsync = promisify(execFile);

let diagnosticCollection: vscode.DiagnosticCollection;
let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;
let compileDebounceTimer: ReturnType<typeof setTimeout> | undefined;
let isCompiling = false;
let sidebarProvider: TsqxSidebarProvider;

function isTsqxFile(doc: vscode.TextDocument): boolean {
	return doc.languageId === 'tsqx' || doc.uri.fsPath.endsWith('.tsqx');
}

function getConfig() {
	return vscode.workspace.getConfiguration('tsqx');
}

function getAutoCompileDelay(): number {
	return Math.max(0, getConfig().get<number>('autoCompileDelay', 1000));
}

export function activate(context: vscode.ExtensionContext) {
	// Output channel for detailed logs
	outputChannel = vscode.window.createOutputChannel('TSQX Compiler');
	context.subscriptions.push(outputChannel);

	// Diagnostics
	diagnosticCollection = vscode.languages.createDiagnosticCollection('tsqx');
	context.subscriptions.push(diagnosticCollection);

	// Status bar
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = 'tsqx.toggleAutoCompile';
	context.subscriptions.push(statusBarItem);
	updateStatusBar();
	updateStatusBarVisibility(vscode.window.activeTextEditor);

	// --- Sidebar ---
	sidebarProvider = new TsqxSidebarProvider();
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider('tsqx-commands', sidebarProvider)
	);

	// --- Commands ---

	// Compile: tsqx → asy → pdf (no preview)
	context.subscriptions.push(
		vscode.commands.registerCommand('tsqx.compile', async (uri?: vscode.Uri) => {
			const filePath = resolveFilePath(uri);
			if (!filePath) { return; }
			const result = await compileFile(filePath);
			// If PDF preview is already open, refresh it
			if (result && result.success) {
				refreshOpenPdf(result.pdfPath);
			}
		})
	);

	// Preview: open PDF beside editor (compile first if PDF doesn't exist)
	context.subscriptions.push(
		vscode.commands.registerCommand('tsqx.preview', async (uri?: vscode.Uri) => {
			const filePath = resolveFilePath(uri);
			if (!filePath) { return; }
			const pdfPath = getPdfPath(filePath);
			if (!fs.existsSync(pdfPath)) {
				// PDF doesn't exist yet — compile first
				const result = await compileFile(filePath);
				if (!result || !result.success) { return; }
			}
			openPdfPreview(pdfPath);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('tsqx.openGeneratedAsy', async (uri?: vscode.Uri) => {
			const filePath = resolveFilePath(uri);
			if (!filePath) { return; }
			const asyPath = getAsyPath(filePath);
			if (!fs.existsSync(asyPath)) {
				const result = await compileFile(filePath);
				if (!result || !result.success) { return; }
			}
			const document = await vscode.workspace.openTextDocument(vscode.Uri.file(asyPath));
			await vscode.window.showTextDocument(document, { preview: true, viewColumn: vscode.ViewColumn.Beside });
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('tsqx.diagnoseToolchain', async () => {
			await diagnoseToolchain();
		})
	);

	// Toggle auto-compile
	context.subscriptions.push(
		vscode.commands.registerCommand('tsqx.toggleAutoCompile', async () => {
			const config = getConfig();
			const current = config.get<boolean>('autoCompileOnSave', true);
			await config.update('autoCompileOnSave', !current, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage(
				`TSQX auto-compile on save: ${!current ? 'enabled' : 'disabled'}`
			);
			sidebarProvider.refresh();
		})
	);

	// Set current TXT file as TSQX language
	context.subscriptions.push(
		vscode.commands.registerCommand('tsqx.setLanguage', async () => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				await vscode.languages.setTextDocumentLanguage(editor.document, 'tsqx');
				vscode.window.showInformationMessage('File language set to TSQX');
			}
		})
	);

	// --- Auto-compile on save ---
	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(async (doc) => {
			if (!isTsqxFile(doc)) { return; }
			if (!getConfig().get<boolean>('autoCompileOnSave', true)) { return; }
			const autoCompileDelay = getAutoCompileDelay();

			if (compileDebounceTimer) {
				clearTimeout(compileDebounceTimer);
			}
			compileDebounceTimer = setTimeout(async () => {
				const result = await compileFile(doc.uri.fsPath);
				if (result && result.success) {
					refreshOpenPdf(result.pdfPath);
				}
			}, autoCompileDelay);
		})
	);

	// --- Configuration changes ---
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('tsqx')) {
				updateStatusBar();
				sidebarProvider.refresh();
			}
		})
	);

	// --- Status bar visibility ---
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			updateStatusBarVisibility(editor);
		})
	);

	outputChannel.appendLine('TSQX Compiler extension activated');
}

/** Resolve file path from URI argument or active editor */
function resolveFilePath(uri?: vscode.Uri): string | undefined {
	if (uri) {
		return uri.fsPath;
	}
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage('No file is open');
		return undefined;
	}
	const filePath = editor.document.uri.fsPath;
	if (path.extname(filePath).toLowerCase() !== '.tsqx' && editor.document.languageId !== 'tsqx') {
		vscode.window.showWarningMessage(
			'Current file is not a TSQX file. Use "TSQX: Set Current File as TSQX" to mark it.'
		);
		return undefined;
	}
	return filePath;
}

/** Get the expected PDF path for a given TSQX file */
function getPdfPath(tsqxFilePath: string): string {
	const dir = path.dirname(tsqxFilePath);
	const basename = path.basename(tsqxFilePath, path.extname(tsqxFilePath));
	return path.join(dir, `${basename}.pdf`);
}

function getAsyPath(tsqxFilePath: string): string {
	const dir = path.dirname(tsqxFilePath);
	const basename = path.basename(tsqxFilePath, path.extname(tsqxFilePath));
	return path.join(dir, `${basename}.asy`);
}

/** Compile a TSQX file and return the result */
async function compileFile(filePath: string) {
	if (isCompiling) {
		outputChannel.appendLine('Skipping compile: already in progress');
		return undefined;
	}
	isCompiling = true;
	updateStatusBar('compiling');
	outputChannel.appendLine(`Compiling: ${filePath}`);

	const config = getConfig();
	const timeout = config.get<number>('compilationTimeout', 30);
	const tsqxPath = config.get<string>('tsqxPath', 'tsqx');
	const asyPath = config.get<string>('asyPath', 'asy');
	const extraArgs = config.get<string>('extraTsqxArgs', '-p');

	try {
		const result = await compileTsqx(filePath, { timeout, tsqxPath, asyPath, extraArgs });

		const diagnostics = createDiagnostics(filePath, result);
		diagnosticCollection.set(vscode.Uri.file(filePath), diagnostics);

		if (result.success) {
			updateStatusBar('success');
			outputChannel.appendLine(`✓ Compiled successfully → ${result.pdfPath}`);
		} else {
			updateStatusBar('error');
			outputChannel.appendLine(`✗ Compilation failed`);
			for (const err of result.errors) {
				outputChannel.appendLine(`  Error: ${err}`);
			}
			vscode.window.showErrorMessage(
				`TSQX compilation failed: ${result.errors[0] || 'unknown error'}`,
				'Show Output'
			).then(choice => {
				if (choice === 'Show Output') {
					outputChannel.show();
				}
			});
		}

		for (const warn of result.warnings) {
			outputChannel.appendLine(`  Warning: ${warn}`);
		}

		return result;
	} catch (e: any) {
		updateStatusBar('error');
		outputChannel.appendLine(`✗ Unexpected error: ${e.message}`);
		vscode.window.showErrorMessage(`TSQX error: ${e.message}`);
		return undefined;
	} finally {
		isCompiling = false;
	}
}

async function diagnoseToolchain(): Promise<void> {
	const config = getConfig();
	const tsqxPath = config.get<string>('tsqxPath', 'tsqx');
	const asyPath = config.get<string>('asyPath', 'asy');
	const extraArgs = config.get<string>('extraTsqxArgs', '-p');
	const timeout = config.get<number>('compilationTimeout', 30);
	const autoCompileOnSave = config.get<boolean>('autoCompileOnSave', true);
	const autoCompileDelay = getAutoCompileDelay();
	const workspaceFolders = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? [];

	outputChannel.clear();
	outputChannel.appendLine('TSQX Toolchain Diagnosis');
	outputChannel.appendLine(`Timestamp: ${new Date().toISOString()}`);
	outputChannel.appendLine('');
	outputChannel.appendLine('Configuration');
	outputChannel.appendLine(`- tsqxPath: ${tsqxPath}`);
	outputChannel.appendLine(`- asyPath: ${asyPath}`);
	outputChannel.appendLine(`- extraTsqxArgs: ${extraArgs}`);
	outputChannel.appendLine(`- compilationTimeout: ${timeout}s`);
	outputChannel.appendLine(`- autoCompileOnSave: ${autoCompileOnSave}`);
	outputChannel.appendLine(`- autoCompileDelay: ${autoCompileDelay}ms`);
	outputChannel.appendLine(`- workspaceFolders: ${workspaceFolders.length > 0 ? workspaceFolders.join(', ') : '(none)'}`);
	outputChannel.appendLine('');

	const tsqxCheck = await runToolCheck('tsqx', tsqxPath, ['--help']);
	const asyCheck = await runToolCheck('asy', asyPath, ['--version']);

	logToolCheck(tsqxCheck);
	logToolCheck(asyCheck);

	outputChannel.show(true);

	const failedChecks = [tsqxCheck, asyCheck].filter(check => !check.ok);
	if (failedChecks.length === 0) {
		vscode.window.showInformationMessage('TSQX toolchain diagnosis passed. See "TSQX Compiler" output for details.');
	} else {
		vscode.window.showWarningMessage(
			`TSQX toolchain diagnosis found ${failedChecks.length} problem(s). See "TSQX Compiler" output for details.`
		);
	}
}

interface ToolCheckResult {
	label: string;
	ok: boolean;
	command: string;
	args: string[];
	summary: string;
	details: string[];
}

async function runToolCheck(label: string, command: string, args: string[]): Promise<ToolCheckResult> {
	try {
		const { stdout, stderr } = await execFileAsync(command, args, { timeout: 10_000 });
		const mergedOutput = [stdout, stderr].filter(Boolean).join('\n');
		const summary = firstUsefulLine(mergedOutput) || 'Command executed successfully.';
		return {
			label,
			ok: true,
			command,
			args,
			summary,
			details: formatOutputDetails(mergedOutput),
		};
	} catch (error: any) {
		const mergedOutput = [error.stdout, error.stderr, error.message].filter(Boolean).join('\n');
		return {
			label,
			ok: false,
			command,
			args,
			summary: firstUsefulLine(mergedOutput) || 'Command failed.',
			details: formatOutputDetails(mergedOutput),
		};
	}
}

function logToolCheck(result: ToolCheckResult): void {
	outputChannel.appendLine(`${result.ok ? '[OK]' : '[FAIL]'} ${result.label}`);
	outputChannel.appendLine(`- command: ${result.command} ${result.args.join(' ')}`.trim());
	outputChannel.appendLine(`- summary: ${result.summary}`);
	if (result.details.length > 0) {
		outputChannel.appendLine('- details:');
		for (const line of result.details) {
			outputChannel.appendLine(`  ${line}`);
		}
	}
	outputChannel.appendLine('');
}

function firstUsefulLine(output: string): string | undefined {
	return output
		.split(/\r?\n/)
		.map(line => line.trim())
		.find(line => line.length > 0);
}

function formatOutputDetails(output: string): string[] {
	return output
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(line => line.length > 0)
		.slice(0, 5);
}

/** Open PDF in a side column (preview only, no compile) */
function openPdfPreview(pdfPath: string) {
	if (!fs.existsSync(pdfPath)) {
		vscode.window.showWarningMessage(`PDF not found: ${pdfPath}`);
		return;
	}
	vscode.commands.executeCommand(
		'vscode.open',
		vscode.Uri.file(pdfPath),
		{ viewColumn: vscode.ViewColumn.Beside, preview: true }
	);
}

/** If the PDF is already open in a tab, close and reopen it to force refresh */
function refreshOpenPdf(pdfPath: string) {
	const pdfUri = vscode.Uri.file(pdfPath);
	for (const tabGroup of vscode.window.tabGroups.all) {
		for (const tab of tabGroup.tabs) {
			if (tab.input instanceof vscode.TabInputCustom || tab.input instanceof vscode.TabInputText) {
				if (tab.input.uri.fsPath === pdfUri.fsPath) {
					vscode.window.tabGroups.close(tab).then(() => {
						vscode.commands.executeCommand(
							'vscode.open', pdfUri,
							{ viewColumn: vscode.ViewColumn.Beside, preview: true }
						);
					});
					return;
				}
			}
		}
	}
	// PDF is not currently open — do nothing (compile-only, no auto-open)
}

function updateStatusBar(state?: 'compiling' | 'success' | 'error'): void {
	const autoCompile = getConfig().get<boolean>('autoCompileOnSave', true);

	switch (state) {
		case 'compiling':
			statusBarItem.text = '$(sync~spin) TSQX Compiling...';
			statusBarItem.backgroundColor = undefined;
			statusBarItem.tooltip = 'Compilation in progress';
			break;
		case 'success':
			statusBarItem.text = '$(check) TSQX';
			statusBarItem.backgroundColor = undefined;
			statusBarItem.tooltip = 'Last compilation succeeded';
			setTimeout(() => updateStatusBar(), 3000);
			break;
		case 'error':
			statusBarItem.text = '$(error) TSQX';
			statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
			statusBarItem.tooltip = 'Last compilation failed. Click for details.';
			break;
		default:
			statusBarItem.text = autoCompile ? '$(eye) TSQX Auto' : '$(eye-closed) TSQX';
			statusBarItem.backgroundColor = undefined;
			statusBarItem.tooltip = autoCompile
				? 'Auto-compile on save: ON (click to toggle)'
				: 'Auto-compile on save: OFF (click to toggle)';
			break;
	}
}

function updateStatusBarVisibility(editor?: vscode.TextEditor): void {
	if (editor && isTsqxFile(editor.document)) {
		statusBarItem.show();
	} else {
		statusBarItem.hide();
	}
}

export function deactivate() {
	if (compileDebounceTimer) {
		clearTimeout(compileDebounceTimer);
	}
}
