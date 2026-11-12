import * as vscode from 'vscode';
import {
  findBuiltin,
  findDefinition,
  parseDefinitions,
  TSQX_BUILTINS,
  TSQX_COLORS,
} from './languageModel';

const WORD_PATTERN = /[A-Za-z][A-Za-z0-9_']*/;
const HANDBOOK_URL = 'https://github.com/YZDame/tsqx-book/blob/main/docs/syntax-reference.md';

export function registerLanguageFeatures(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = { language: 'tsqx', scheme: '*' };
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(selector, new TsqxCompletionProvider()),
    vscode.languages.registerHoverProvider(selector, new TsqxHoverProvider()),
    vscode.languages.registerDefinitionProvider(selector, new TsqxDefinitionProvider()),
    vscode.languages.registerDocumentSymbolProvider(selector, new TsqxDocumentSymbolProvider()),
  );
}

class TsqxCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(document: vscode.TextDocument): vscode.CompletionItem[] {
    const items = TSQX_BUILTINS.map(item => {
      const completion = new vscode.CompletionItem(item.name, vscode.CompletionItemKind.Function);
      completion.detail = item.signature;
      completion.documentation = new vscode.MarkdownString(
        `${item.description}\n\n[TSQX syntax reference](${HANDBOOK_URL})`
      );
      completion.insertText = new vscode.SnippetString(item.snippet);
      return completion;
    });
    const seenDefinitions = new Set<string>();
    for (const definition of parseDefinitions(document.getText())) {
      if (seenDefinitions.has(definition.name)) {
        continue;
      }
      seenDefinitions.add(definition.name);
      const completion = new vscode.CompletionItem(definition.name, vscode.CompletionItemKind.Variable);
      completion.detail = definition.expression;
      items.push(completion);
    }
    for (const color of TSQX_COLORS) {
      const completion = new vscode.CompletionItem(color, vscode.CompletionItemKind.Color);
      completion.detail = 'TSQX / Asymptote pen';
      items.push(completion);
    }
    return items;
  }
}

class TsqxHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const range = document.getWordRangeAtPosition(position, WORD_PATTERN);
    if (!range) {
      return undefined;
    }
    const word = document.getText(range);
    const builtin = findBuiltin(word);
    if (builtin) {
      const markdown = new vscode.MarkdownString();
      markdown.appendCodeblock(builtin.signature, 'tsqx');
      markdown.appendMarkdown(`\n${builtin.description}\n\n[TSQX syntax reference](${HANDBOOK_URL})`);
      return new vscode.Hover(markdown, range);
    }
    const definition = findDefinition(parseDefinitions(document.getText()), word, position.line);
    if (!definition) {
      return undefined;
    }
    const markdown = new vscode.MarkdownString();
    markdown.appendCodeblock(`${definition.name} = ${definition.expression}`, 'tsqx');
    markdown.appendMarkdown(`\nDefined on line ${definition.line + 1}.`);
    return new vscode.Hover(markdown, range);
  }
}

class TsqxDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location | undefined {
    const range = document.getWordRangeAtPosition(position, WORD_PATTERN);
    if (!range) {
      return undefined;
    }
    const word = document.getText(range);
    const definition = findDefinition(parseDefinitions(document.getText()), word, position.line);
    if (!definition) {
      return undefined;
    }
    return new vscode.Location(
      document.uri,
      new vscode.Range(definition.line, definition.start, definition.line, definition.end)
    );
  }
}

class TsqxDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    return parseDefinitions(document.getText()).map(definition => {
      const range = new vscode.Range(
        definition.line,
        0,
        definition.line,
        document.lineAt(definition.line).text.length
      );
      const selectionRange = new vscode.Range(
        definition.line,
        definition.start,
        definition.line,
        definition.end
      );
      return new vscode.DocumentSymbol(
        definition.name,
        definition.expression,
        vscode.SymbolKind.Variable,
        range,
        selectionRange
      );
    });
  }
}
