import * as vscode from 'vscode';

interface CommandTreeItem {
	label: string;
	command: string;
	icon: string;
	description?: string;
}

export class TsqxSidebarProvider implements vscode.TreeDataProvider<CommandTreeItem> {
	private _onDidChangeTreeData = new vscode.EventEmitter<CommandTreeItem | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: CommandTreeItem): vscode.TreeItem {
		const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
		item.command = { command: element.command, title: element.label };
		item.iconPath = new vscode.ThemeIcon(element.icon);
		if (element.description) {
			item.description = element.description;
		}
		return item;
	}

	getChildren(): CommandTreeItem[] {
		const config = vscode.workspace.getConfiguration('tsqx');
		const autoCompile = config.get<boolean>('autoCompileOnSave', true);

		return [
			{ label: 'Compile Current File', command: 'tsqx.compile', icon: 'play' },
			{ label: 'Preview PDF', command: 'tsqx.preview', icon: 'open-preview' },
			{ label: 'Open Generated ASY', command: 'tsqx.openGeneratedAsy', icon: 'code' },
			{ label: 'Diagnose Toolchain', command: 'tsqx.diagnoseToolchain', icon: 'tools' },
			{
				label: 'Toggle Auto-Compile',
				command: 'tsqx.toggleAutoCompile',
				icon: autoCompile ? 'eye' : 'eye-closed',
				description: autoCompile ? 'ON' : 'OFF',
			},
			{ label: 'Set File as TSQX', command: 'tsqx.setLanguage', icon: 'file-code' },
		];
	}
}
