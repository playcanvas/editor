import { Overlay, Element, Panel, Button, Container } from '@playcanvas/pcui';
import './style.scss';

// highlight.js
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';

hljs.registerLanguage('javascript', javascript);

class PreviewLegacyScript extends Overlay {
    constructor(args) {
        args.class = 'preview-legacy-script-overlay';
        args.clickable = true;

        super(args);

        this._domClickableOverlay.removeEventListener('mousedown', this._onMouseDown);
        this._domClickableOverlay.addEventListener('mousedown', () => {
            this.destroy();
        });

        const previewPanel = new Panel({
            class: 'preview-legacy-script-panel',
            headerText: `LEGACY SCRIPT: ${args.name}`
        });
        this.domContent.append(previewPanel.dom);

        const codePreview = new Element({
            class: 'preview-legacy-script'
        });
        const html = hljs.highlight(args.code, { language: 'js' }).value;
        codePreview.dom.innerHTML = `<pre><code class="hljs javascript">${html}</code></pre>`;
        previewPanel.content.append(codePreview);
        const buttonsContainer = new Container({
            class: 'preview-legacy-script-buttons'
        });
        previewPanel.content.append(buttonsContainer);

        const copyButton = new Button({
            class: 'copy-button',
            text: 'COPY'
        });
        copyButton.on('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(args.code);
        });
        previewPanel.content.append(copyButton);

        const closeButton = new Button({
            class: 'close-button',
            icon: 'E373'
        });
        closeButton.on('click', (e) => {
            e.stopPropagation();
            this.destroy();
        });
        previewPanel.header.append(closeButton);
    }
}

export default PreviewLegacyScript;
