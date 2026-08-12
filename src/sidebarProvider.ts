import * as vscode from 'vscode';

interface SidebarCommand {
	kind: 'command';
	label: string;
	command: string;
	icon: string;
	description?: string;
}

interface SidebarGroup {
	kind: 'group';
	id: string;
	label: string;
	icon: string;
	initialState: vscode.TreeItemCollapsibleState;
	children: SidebarCommand[];
}

export type SidebarTreeItem = SidebarGroup | SidebarCommand;

export class TsqxSidebarProvider implements vscode.TreeDataProvider<SidebarTreeItem> {
	private _onDidChangeTreeData = new vscode.EventEmitter<SidebarTreeItem | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: SidebarTreeItem): vscode.TreeItem {
		if (element.kind === 'group') {
			const item = new vscode.TreeItem(element.label, element.initialState);
			item.id = `tsqx.sidebar.${element.id}`;
			item.iconPath = new vscode.ThemeIcon(element.icon);
			item.contextValue = 'tsqxCommandGroup';
			return item;
		}

		const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
		item.command = { command: element.command, title: element.label };
		item.iconPath = new vscode.ThemeIcon(element.icon);
		item.contextValue = 'tsqxCommand';
		if (element.description) {
			item.description = element.description;
		}
		return item;
	}

	getChildren(element?: SidebarTreeItem): SidebarTreeItem[] {
		if (element?.kind === 'group') {
			return element.children;
		}
		if (element) {
			return [];
		}

		const config = vscode.workspace.getConfiguration('tsqx');
		const autoCompile = config.get<boolean>('autoCompileOnSave', true);

		return [
			{
				kind: 'group',
				id: 'create-and-compile',
				label: 'Create & Compile',
				icon: 'tools',
				initialState: vscode.TreeItemCollapsibleState.Expanded,
				children: [
					{ kind: 'command', label: 'New Figure from Template', command: 'tsqx.newFigure', icon: 'new-file' },
					{ kind: 'command', label: 'Compile Current File', command: 'tsqx.compile', icon: 'play' },
					{ kind: 'command', label: 'Compile Workspace', command: 'tsqx.compileWorkspace', icon: 'run-all' },
				],
			},
			{
				kind: 'group',
				id: 'preview-and-export',
				label: 'Preview & Export',
				icon: 'open-preview',
				initialState: vscode.TreeItemCollapsibleState.Expanded,
				children: [
					{ kind: 'command', label: 'Live Preview', command: 'tsqx.preview', icon: 'open-preview' },
					{ kind: 'command', label: 'Open Generated PDF', command: 'tsqx.openPdf', icon: 'file-pdf' },
					{ kind: 'command', label: 'Export as SVG', command: 'tsqx.exportSvg', icon: 'file-media' },
					{ kind: 'command', label: 'Export as PNG', command: 'tsqx.exportPng', icon: 'file-media' },
					{ kind: 'command', label: 'Open Generated ASY', command: 'tsqx.openGeneratedAsy', icon: 'code' },
				],
			},
			{
				kind: 'group',
				id: 'tools-and-settings',
				label: 'Tools & Settings',
				icon: 'settings-gear',
				initialState: vscode.TreeItemCollapsibleState.Collapsed,
				children: [
					{
						kind: 'command',
						label: 'Toggle Auto-Compile',
						command: 'tsqx.toggleAutoCompile',
						icon: autoCompile ? 'eye' : 'eye-closed',
						description: autoCompile ? 'ON' : 'OFF',
					},
					{ kind: 'command', label: 'Clean Generated Artifacts', command: 'tsqx.cleanArtifacts', icon: 'trash' },
					{ kind: 'command', label: 'Diagnose Toolchain', command: 'tsqx.diagnoseToolchain', icon: 'tools' },
					{ kind: 'command', label: 'First-Use Setup', command: 'tsqx.setup', icon: 'gear' },
					{ kind: 'command', label: 'Set File as TSQX', command: 'tsqx.setLanguage', icon: 'file-code' },
				],
			},
		];
	}
}
