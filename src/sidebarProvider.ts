import * as vscode from 'vscode';

type CommandView = 'tsqx-commands' | 'tsqx-preview-export' | 'tsqx-tools';

const commandRows = {
	'tsqx-commands': [
		['New Figure from Template', 'tsqx.newFigure', 'new-file'],
		['Compile Current File', 'tsqx.compile', 'play'],
		['Compile Workspace', 'tsqx.compileWorkspace', 'run-all'],
	],
	'tsqx-preview-export': [
		['Live Preview', 'tsqx.preview', 'open-preview'],
		['Open Generated PDF', 'tsqx.openPdf', 'file-pdf'],
		['Export as SVG', 'tsqx.exportSvg', 'file-media'],
		['Export as PNG', 'tsqx.exportPng', 'file-media'],
		['Open Generated ASY', 'tsqx.openGeneratedAsy', 'code'],
		['Export Standalone ASY', 'tsqx.exportStandaloneAsy', 'export'],
	],
	'tsqx-tools': [
		['Select Diagram Theme', 'tsqx.selectTheme', 'symbol-color'],
		['Toggle Auto-Compile', 'tsqx.toggleAutoCompile', 'eye'],
		['Clean Generated Artifacts', 'tsqx.cleanArtifacts', 'trash'],
		['Show Compiler Output', 'tsqx.showOutput', 'output'],
		['Diagnose Toolchain', 'tsqx.diagnoseToolchain', 'tools'],
		['First-Use Setup', 'tsqx.setup', 'gear'],
		['Set File as TSQX', 'tsqx.setLanguage', 'file-code'],
	],
} as const satisfies Record<CommandView, readonly (readonly [string, string, string])[]>;

export class TsqxSidebarProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
	private readonly changes = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData = this.changes.event;

	constructor(private readonly view: CommandView) {}

	refresh(): void {
		this.changes.fire();
	}

	dispose(): void {
		this.changes.dispose();
	}

	getTreeItem(item: vscode.TreeItem): vscode.TreeItem {
		return item;
	}

	getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
		if (element) {
			return [];
		}

		return commandRows[this.view].map(([label, command, icon]) => {
			const item = new vscode.TreeItem(label);
			item.id = command;
			item.command = { command, title: label };
			item.iconPath = new vscode.ThemeIcon(icon);
			if (command === 'tsqx.toggleAutoCompile') {
				const uri = vscode.window.activeTextEditor?.document.uri;
				const autoCompile = vscode.workspace.getConfiguration('tsqx', uri).get('autoCompileOnSave', true);
				item.description = autoCompile ? 'ON' : 'OFF';
				item.iconPath = new vscode.ThemeIcon(autoCompile ? 'eye' : 'eye-closed');
			} else if (command === 'tsqx.selectTheme') {
				const uri = vscode.window.activeTextEditor?.document.uri;
				const theme = vscode.workspace.getConfiguration('tsqx', uri).get<string>('theme', 'auto');
				item.description = theme;
			}
			return item;
		});
	}
}
