import * as crypto from 'crypto';
import * as path from 'path';
import * as vscode from 'vscode';

export class PreviewManager implements vscode.Disposable {
  private readonly panels = new Map<string, vscode.WebviewPanel>();

  show(sourcePath: string, svgPath: string): void {
    const existing = this.panels.get(sourcePath);
    if (existing) {
      existing.reveal(vscode.ViewColumn.Beside, true);
      this.postUpdate(existing, svgPath);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'tsqxPreview',
      `TSQX Preview: ${path.basename(sourcePath)}`,
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(path.dirname(svgPath))],
      }
    );
    panel.webview.html = previewHtml(panel.webview, svgPath);
    panel.onDidDispose(() => this.panels.delete(sourcePath));
    this.panels.set(sourcePath, panel);
  }

  refresh(sourcePath: string, svgPath: string): void {
    const panel = this.panels.get(sourcePath);
    if (panel) {
      this.postUpdate(panel, svgPath);
    }
  }

  showError(sourcePath: string, message: string): void {
    void this.panels.get(sourcePath)?.webview.postMessage({ type: 'error', message });
  }

  isOpen(sourcePath: string): boolean {
    return this.panels.has(sourcePath);
  }

  close(sourcePath: string): void {
    this.panels.get(sourcePath)?.dispose();
  }

  dispose(): void {
    for (const panel of this.panels.values()) {
      panel.dispose();
    }
    this.panels.clear();
  }

  private postUpdate(panel: vscode.WebviewPanel, svgPath: string): void {
    const uri = panel.webview.asWebviewUri(vscode.Uri.file(svgPath));
    void panel.webview.postMessage({
      type: 'update',
      uri: `${uri.toString()}?v=${Date.now()}`,
    });
  }
}

function previewHtml(webview: vscode.Webview, svgPath: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const svgUri = webview.asWebviewUri(vscode.Uri.file(svgPath));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style nonce="${nonce}">
    html, body { height: 100%; margin: 0; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
    body { display: grid; grid-template-rows: auto 1fr; font-family: var(--vscode-font-family); }
    #toolbar { display: flex; gap: 6px; align-items: center; padding: 6px 8px; border-bottom: 1px solid var(--vscode-panel-border); }
    button { color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 0; padding: 4px 9px; cursor: pointer; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    #status { margin-left: auto; opacity: .8; }
    #viewport { overflow: auto; padding: 24px; text-align: center; }
    #figure { display: inline-block; width: 100%; height: auto; transform-origin: top center; background: white; box-shadow: 0 2px 12px rgba(0,0,0,.22); }
    #error { display: none; color: var(--vscode-errorForeground); padding: 8px; }
  </style>
</head>
<body>
  <div id="toolbar">
    <button id="zoomOut" title="Zoom out">−</button>
    <button id="zoomIn" title="Zoom in">+</button>
    <button id="actual" title="Reset preview zoom">Reset</button>
    <button id="fit" title="Fit width">Fit</button>
    <span id="status">100%</span>
  </div>
  <div id="viewport"><div id="error"></div><img id="figure" src="${svgUri.toString()}" alt="TSQX figure preview"></div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const viewport = document.getElementById('viewport');
    const image = document.getElementById('figure');
    const error = document.getElementById('error');
    const status = document.getElementById('status');
    const saved = vscode.getState() || {};
    let zoom = saved.zoom || 1;
    let pendingScroll = { left: saved.left || 0, top: saved.top || 0 };

    function persist() {
      vscode.setState({ zoom, left: viewport.scrollLeft, top: viewport.scrollTop });
    }
    function applyZoom() {
      image.style.width = (zoom * 100) + '%';
      status.textContent = Math.round(zoom * 100) + '%';
      persist();
    }
    function setZoom(next) {
      zoom = Math.min(8, Math.max(0.1, next));
      applyZoom();
    }
    document.getElementById('zoomOut').addEventListener('click', () => setZoom(zoom / 1.2));
    document.getElementById('zoomIn').addEventListener('click', () => setZoom(zoom * 1.2));
    document.getElementById('actual').addEventListener('click', () => setZoom(1));
    document.getElementById('fit').addEventListener('click', () => setZoom(1));
    viewport.addEventListener('scroll', persist, { passive: true });
    image.addEventListener('load', () => {
      error.style.display = 'none';
      image.style.display = 'inline-block';
      applyZoom();
      requestAnimationFrame(() => {
        viewport.scrollLeft = pendingScroll.left;
        viewport.scrollTop = pendingScroll.top;
      });
    });
    window.addEventListener('message', event => {
      if (event.data.type === 'update') {
        pendingScroll = { left: viewport.scrollLeft, top: viewport.scrollTop };
        image.src = event.data.uri;
      } else if (event.data.type === 'error') {
        error.textContent = event.data.message;
        error.style.display = 'block';
      }
    });
    applyZoom();
  </script>
</body>
</html>`;
}
