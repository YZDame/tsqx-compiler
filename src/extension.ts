import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
	CompilationResult,
	compileTsqx,
	getOutputPaths,
	isOutputStale,
	normalizeExtraArgs,
} from './compiler';
import { createDiagnosticEntries } from './diagnostics';
import { CompileCoordinator } from './compileCoordinator';
import { resolveOutputDirectory } from './outputDirectory';
import { TsqxSidebarProvider } from './sidebarProvider';

const execFileAsync = promisify(execFile);

let diagnosticCollection: vscode.DiagnosticCollection;
let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;
const compileDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const compileCoordinator = new CompileCoordinator<CompilationResult | undefined>();
const activeCompiles = new Set<string>();
let statusResetTimer: ReturnType<typeof setTimeout> | undefined;
let sidebarProvider: TsqxSidebarProvider;

function isTsqxFile(doc: vscode.TextDocument): boolean {
	return doc.languageId === 'tsqx' || doc.uri.fsPath.endsWith('.tsqx');
}

function getConfig(uri?: vscode.Uri) {
	return vscode.workspace.getConfiguration('tsqx', uri);
}

function getAutoCompileDelay(uri?: vscode.Uri): number {
	return Math.max(0, getConfig(uri).get<number>('autoCompileDelay', 1000));
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
		vscode.commands.registerCommand('tsqx.showOutput', () => {
			outputChannel.show(true);
		})
	);

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
			if (await isOutputStale(filePath, pdfPath)) {
				// Missing or stale PDF — compile first
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
			if (await isOutputStale(filePath, asyPath)) {
				const result = await compileFile(filePath);
				if (!result || !fs.existsSync(asyPath)) { return; }
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

	context.subscriptions.push(
		vscode.commands.registerCommand('tsqx.setup', async () => {
			await runSetupWizard(context);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('tsqx.compileWorkspace', async () => {
			await compileWorkspace();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('tsqx.cleanArtifacts', async (uri?: vscode.Uri) => {
			await cleanArtifacts(uri);
		})
	);

	// Toggle auto-compile
	context.subscriptions.push(
		vscode.commands.registerCommand('tsqx.toggleAutoCompile', async () => {
			const config = getConfig(vscode.window.activeTextEditor?.document.uri);
			const current = config.get<boolean>('autoCompileOnSave', true);
			const target = vscode.workspace.workspaceFolders
				? vscode.ConfigurationTarget.Workspace
				: vscode.ConfigurationTarget.Global;
			await config.update('autoCompileOnSave', !current, target);
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
			if (!getConfig(doc.uri).get<boolean>('autoCompileOnSave', true)) { return; }
			const autoCompileDelay = getAutoCompileDelay(doc.uri);

			const filePath = doc.uri.fsPath;
			const existingTimer = compileDebounceTimers.get(filePath);
			if (existingTimer) {
				clearTimeout(existingTimer);
			}
			const timer = setTimeout(async () => {
				compileDebounceTimers.delete(filePath);
				const result = await compileFile(filePath, true);
				if (result && result.success) {
					refreshOpenPdf(result.pdfPath);
				}
			}, autoCompileDelay);
			compileDebounceTimers.set(filePath, timer);
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
			void maybeOfferSetup(context, editor);
		})
	);

	outputChannel.appendLine('TSQX Compiler extension activated');
	void maybeOfferSetup(context, vscode.window.activeTextEditor);
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
	return getConfiguredOutputPaths(tsqxFilePath).pdfPath;
}

function getAsyPath(tsqxFilePath: string): string {
	return getConfiguredOutputPaths(tsqxFilePath).asyPath;
}

function getConfiguredOutputPaths(tsqxFilePath: string) {
	const outputDirectory = getConfiguredOutputDirectory(tsqxFilePath);
	return getOutputPaths(tsqxFilePath, outputDirectory);
}

function getConfiguredOutputDirectory(tsqxFilePath: string): string {
	const uri = vscode.Uri.file(tsqxFilePath);
	const configured = getConfig(uri).get<string>('outputDirectory', '');
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath;
	return resolveOutputDirectory(tsqxFilePath, configured, workspaceFolder);
}

/** Compile a TSQX file and return the result */
async function compileFile(filePath: string, rerunIfBusy = false, notifyUser = true) {
	return compileCoordinator.run(
		filePath,
		() => performCompile(filePath, notifyUser),
		rerunIfBusy
	);
}

async function performCompile(filePath: string, notifyUser: boolean): Promise<CompilationResult | undefined> {
	activeCompiles.add(filePath);
	updateStatusBar('compiling');
	outputChannel.appendLine(`Compiling: ${filePath}`);

	const fileUri = vscode.Uri.file(filePath);
	const config = getConfig(fileUri);
	const timeout = config.get<number>('compilationTimeout', 30);
	const tsqxPath = config.get<string>('tsqxPath', 'tsqx');
	const asyPath = config.get<string>('asyPath', 'asy');
	const extraArgs = normalizeExtraArgs(config.get<unknown>('extraTsqxArgs', ['-p']));
	const outputDirectory = getConfiguredOutputDirectory(filePath);
	let finalState: 'success' | 'error' = 'error';

	try {
		const result = await compileTsqx(filePath, {
			timeout,
			tsqxPath,
			asyPath,
			extraArgs,
			outputDirectory,
		});

		const diagnosticEntries = createDiagnosticEntries(filePath, result);
		for (const [targetPath, diagnostics] of diagnosticEntries) {
			diagnosticCollection.set(vscode.Uri.file(targetPath), diagnostics);
		}

		if (result.success) {
			finalState = 'success';
			outputChannel.appendLine(`✓ Compiled successfully in ${result.durationMs}ms → ${result.pdfPath}`);
		} else {
			updateStatusBar('error');
			outputChannel.appendLine(`✗ Compilation failed`);
			for (const err of result.errors) {
				outputChannel.appendLine(`  Error: ${err}`);
			}
			if (notifyUser) {
				vscode.window.showErrorMessage(
					`TSQX compilation failed: ${result.errors[0] || 'unknown error'}`,
					'Show Output'
				).then(choice => {
					if (choice === 'Show Output') {
						outputChannel.show();
					}
				});
			}
		}

		for (const warn of result.warnings) {
			outputChannel.appendLine(`  Warning: ${warn}`);
		}

		return result;
	} catch (e: any) {
		outputChannel.appendLine(`✗ Unexpected error: ${e.message}`);
		if (notifyUser) {
			vscode.window.showErrorMessage(`TSQX error: ${e.message}`);
		}
		return undefined;
	} finally {
		activeCompiles.delete(filePath);
		updateStatusBar(activeCompiles.size > 0 ? 'compiling' : finalState);
	}
}

async function compileWorkspace(): Promise<void> {
	if (!vscode.workspace.workspaceFolders) {
		vscode.window.showWarningMessage('Open a folder or workspace before compiling all TSQX files.');
		return;
	}
	const files = await vscode.workspace.findFiles(
		'**/*.tsqx',
		'**/{.git,node_modules}/**'
	);
	if (files.length === 0) {
		vscode.window.showInformationMessage('No TSQX files were found in this workspace.');
		return;
	}

	let succeeded = 0;
	let failed = 0;
	let cancelled = false;
	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: 'Compiling TSQX workspace',
		cancellable: true,
	}, async (progress, token) => {
		for (let index = 0; index < files.length; index += 1) {
			if (token.isCancellationRequested) {
				cancelled = true;
				break;
			}
			const file = files[index];
			progress.report({
				message: vscode.workspace.asRelativePath(file),
				increment: 100 / files.length,
			});
			const result = await compileFile(file.fsPath, false, false);
			if (result?.success) {
				succeeded += 1;
				refreshOpenPdf(result.pdfPath);
			} else {
				failed += 1;
			}
		}
	});

	const summary = `${succeeded} succeeded, ${failed} failed${cancelled ? ', cancelled' : ''}.`;
	outputChannel.appendLine(`Workspace compilation: ${summary}`);
	if (failed > 0) {
		const choice = await vscode.window.showWarningMessage(`TSQX workspace compilation finished: ${summary}`, 'Show Output');
		if (choice === 'Show Output') {
			outputChannel.show(true);
		}
	} else {
		vscode.window.showInformationMessage(`TSQX workspace compilation finished: ${summary}`);
	}
}

async function cleanArtifacts(uri?: vscode.Uri): Promise<void> {
	const filePath = resolveFilePath(uri);
	if (!filePath) {
		return;
	}
	const { asyPath, pdfPath } = getConfiguredOutputPaths(filePath);
	const existing = [asyPath, pdfPath].filter(file => fs.existsSync(file));
	if (existing.length === 0) {
		vscode.window.showInformationMessage('No generated TSQX artifacts were found for this file.');
		return;
	}
	const relativeNames = existing.map(file => vscode.workspace.asRelativePath(file)).join(', ');
	const confirmation = await vscode.window.showWarningMessage(
		`Delete generated artifacts: ${relativeNames}?`,
		{ modal: true },
		'Delete'
	);
	if (confirmation !== 'Delete') {
		return;
	}
	await Promise.all(existing.map(file => fs.promises.rm(file, { force: true })));
	diagnosticCollection.delete(vscode.Uri.file(asyPath));
	vscode.window.showInformationMessage(`Deleted ${existing.length} generated TSQX artifact(s).`);
}

async function runSetupWizard(context: vscode.ExtensionContext): Promise<void> {
	outputChannel.clear();
	outputChannel.appendLine('TSQX First-Use Setup');
	const config = getConfig();
	const tsqxPath = config.get<string>('tsqxPath', 'tsqx');
	const asyPath = config.get<string>('asyPath', 'asy');
	const [tsqxCheck, asyCheck] = await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: 'Checking TSQX toolchain',
	}, () => Promise.all([
		runToolCheck('tsqx', tsqxPath, ['--help']),
		runToolCheck('asy', asyPath, ['--version']),
	]));
	logToolCheck(tsqxCheck);
	logToolCheck(asyCheck);

	if (!tsqxCheck.ok || !asyCheck.ok) {
		outputChannel.show(true);
		const choice = await vscode.window.showWarningMessage(
			'TSQX setup could not find a working tsqx and Asymptote toolchain.',
			'Open Settings',
			'Installation Guide'
		);
		if (choice === 'Open Settings') {
			await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:LYDT.tsqx-compiler');
		} else if (choice === 'Installation Guide') {
			await vscode.env.openExternal(vscode.Uri.parse('https://github.com/YZDame/tsqx-compiler#requirements'));
		}
		return;
	}

	const outputChoice = await vscode.window.showQuickPick([
		{
			label: 'Beside each source file',
			description: 'Keep generated ASY and PDF files next to their TSQX source',
			value: '',
		},
		{
			label: 'Workspace .tsqx-build folder',
			description: 'Keep generated files together while preserving source subfolders',
			value: '.tsqx-build',
		},
		{
			label: 'Configure a custom directory',
			description: 'Open extension settings',
			value: 'custom',
		},
	], {
		title: 'Choose where TSQX should write generated files',
	});
	if (!outputChoice) {
		return;
	}
	if (outputChoice.value === 'custom') {
		await vscode.commands.executeCommand('workbench.action.openSettings', 'tsqx.outputDirectory');
		return;
	}
	const target = vscode.workspace.workspaceFolders
		? vscode.ConfigurationTarget.Workspace
		: vscode.ConfigurationTarget.Global;
	await config.update('outputDirectory', outputChoice.value, target);

	const autoCompileChoice = await vscode.window.showQuickPick([
		{ label: 'Enable auto-compile on save', value: true },
		{ label: 'Compile manually', value: false },
	], { title: 'Choose the default compilation behavior' });
	if (!autoCompileChoice) {
		return;
	}
	await config.update('autoCompileOnSave', autoCompileChoice.value, target);
	await context.globalState.update('setupCompleted', true);
	vscode.window.showInformationMessage('TSQX setup completed. The toolchain check passed.');
}

async function maybeOfferSetup(
	context: vscode.ExtensionContext,
	editor?: vscode.TextEditor
): Promise<void> {
	if (!editor || !isTsqxFile(editor.document)) {
		return;
	}
	if (context.globalState.get<boolean>('setupCompleted', false)) {
		return;
	}
	if (context.globalState.get<boolean>('setupPromptShown', false)) {
		return;
	}
	await context.globalState.update('setupPromptShown', true);
	const choice = await vscode.window.showInformationMessage(
		'Set up the TSQX compiler toolchain and output location?',
		'Run Setup',
		'Later'
	);
	if (choice === 'Run Setup') {
		await runSetupWizard(context);
	}
}

async function diagnoseToolchain(): Promise<void> {
	const config = getConfig();
	const tsqxPath = config.get<string>('tsqxPath', 'tsqx');
	const asyPath = config.get<string>('asyPath', 'asy');
	const extraArgs = normalizeExtraArgs(config.get<unknown>('extraTsqxArgs', ['-p']));
	const timeout = config.get<number>('compilationTimeout', 30);
	const autoCompileOnSave = config.get<boolean>('autoCompileOnSave', true);
	const autoCompileDelay = getAutoCompileDelay();
	const outputDirectory = config.get<string>('outputDirectory', '');
	const workspaceFolders = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? [];

	outputChannel.clear();
	outputChannel.appendLine('TSQX Toolchain Diagnosis');
	outputChannel.appendLine(`Timestamp: ${new Date().toISOString()}`);
	outputChannel.appendLine('');
	outputChannel.appendLine('Configuration');
	outputChannel.appendLine(`- tsqxPath: ${tsqxPath}`);
	outputChannel.appendLine(`- asyPath: ${asyPath}`);
	outputChannel.appendLine(`- extraTsqxArgs: ${JSON.stringify(extraArgs)}`);
	outputChannel.appendLine(`- compilationTimeout: ${timeout}s`);
	outputChannel.appendLine(`- autoCompileOnSave: ${autoCompileOnSave}`);
	outputChannel.appendLine(`- autoCompileDelay: ${autoCompileDelay}ms`);
	outputChannel.appendLine(`- outputDirectory: ${outputDirectory || '(beside source file)'}`);
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
	const autoCompile = getConfig(vscode.window.activeTextEditor?.document.uri)
		.get<boolean>('autoCompileOnSave', true);
	if (statusResetTimer) {
		clearTimeout(statusResetTimer);
		statusResetTimer = undefined;
	}

	switch (state) {
		case 'compiling':
			statusBarItem.text = '$(sync~spin) TSQX Compiling...';
			statusBarItem.command = undefined;
			statusBarItem.backgroundColor = undefined;
			statusBarItem.tooltip = 'Compilation in progress';
			break;
		case 'success':
			statusBarItem.text = '$(check) TSQX';
			statusBarItem.backgroundColor = undefined;
			statusBarItem.tooltip = 'Last compilation succeeded';
			statusBarItem.command = 'tsqx.toggleAutoCompile';
			statusResetTimer = setTimeout(() => updateStatusBar(), 3000);
			break;
		case 'error':
			statusBarItem.text = '$(error) TSQX';
			statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
			statusBarItem.tooltip = 'Last compilation failed. Click for details.';
			statusBarItem.command = 'tsqx.showOutput';
			break;
		default:
			statusBarItem.text = autoCompile ? '$(eye) TSQX Auto' : '$(eye-closed) TSQX';
			statusBarItem.backgroundColor = undefined;
			statusBarItem.tooltip = autoCompile
				? 'Auto-compile on save: ON (click to toggle)'
				: 'Auto-compile on save: OFF (click to toggle)';
			statusBarItem.command = 'tsqx.toggleAutoCompile';
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
	for (const timer of compileDebounceTimers.values()) {
		clearTimeout(timer);
	}
	compileDebounceTimers.clear();
	if (statusResetTimer) {
		clearTimeout(statusResetTimer);
	}
}
