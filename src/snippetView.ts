import { readFileSync } from 'node:fs';
import * as vscode from 'vscode';

interface Snippet {
	name: string;
	prefix: string;
	description: string;
	category: string;
	body: string;
}

type SnippetItem = { kind: 'category'; name: string } | { kind: 'snippet'; snippet: Snippet };

function readSnippets(uri: vscode.Uri): Snippet[] {
	const catalog: unknown = JSON.parse(readFileSync(uri.fsPath, 'utf8'));
	if (typeof catalog !== 'object' || catalog === null || Array.isArray(catalog)) {
		throw new Error('Invalid TSQX snippet catalog');
	}

	return Object.entries(catalog).map(([name, entry]: [string, unknown]) => {
		if (typeof entry !== 'object' || entry === null
			|| !('prefix' in entry) || typeof entry.prefix !== 'string'
			|| !('description' in entry) || typeof entry.description !== 'string'
			|| !('category' in entry) || typeof entry.category !== 'string'
			|| !('body' in entry)) {
			throw new Error(`Invalid TSQX snippet: ${name}`);
		}
		const body: unknown = entry.body;
		if (typeof body !== 'string' && !(Array.isArray(body) && body.every(line => typeof line === 'string'))) {
			throw new Error(`Invalid body for TSQX snippet: ${name}`);
		}
		return { name, prefix: entry.prefix, description: entry.description, category: entry.category,
			body: typeof body === 'string' ? body : body.join('\n') };
	});
}

export function registerSnippetView(context: vscode.ExtensionContext): void {
	const snippets = readSnippets(vscode.Uri.joinPath(context.extensionUri, 'snippets', 'tsqx.json'));
	const provider: vscode.TreeDataProvider<SnippetItem> = {
		getChildren(item) {
			if (!item) {
				return [...new Set(snippets.map(snippet => snippet.category))]
					.map(name => ({ kind: 'category', name }));
			}
			return item.kind === 'category'
				? snippets.filter(snippet => snippet.category === item.name).map(snippet => ({ kind: 'snippet', snippet }))
				: [];
		},
		getTreeItem(item) {
			if (item.kind === 'category') {
				const group = new vscode.TreeItem(item.name, vscode.TreeItemCollapsibleState.Collapsed);
				group.id = item.name;
				group.iconPath = new vscode.ThemeIcon('folder');
				return group;
			}
			const { name, prefix, description } = item.snippet;
			const row = new vscode.TreeItem(name);
			row.id = prefix;
			row.iconPath = new vscode.ThemeIcon('symbol-snippet');
			row.description = prefix;
			row.tooltip = description;
			row.command = { command: 'tsqx.insertSnippet', title: 'Insert Snippet', arguments: [prefix] };
			return row;
		},
	};

	context.subscriptions.push(
		vscode.window.registerTreeDataProvider('tsqx-snippets', provider),
		vscode.commands.registerCommand('tsqx.insertSnippet', async (prefix?: string) => {
			const editor = vscode.window.activeTextEditor;
			if (editor?.document.languageId !== 'tsqx') {
				void vscode.window.showInformationMessage('Open a TSQX editor to insert a snippet.');
				return;
			}
			const snippet = prefix
				? snippets.find(item => item.prefix === prefix)
				: (await vscode.window.showQuickPick(snippets.map(item => ({
					label: item.name, description: item.prefix, detail: item.description, snippet: item,
				})), { placeHolder: 'Search TSQX snippets', matchOnDescription: true, matchOnDetail: true }))?.snippet;
			if (snippet && vscode.window.activeTextEditor === editor) {
				await editor.insertSnippet(new vscode.SnippetString(snippet.body));
			}
		})
	);
}
