import MarkdownIt from 'markdown-it';

interface MonacoModel {
    getValue(): string;
}

editor.once('load', () => {
    const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
    const panel = editor.call('layout.code');

    const previewContainer = document.createElement('div');
    previewContainer.id = 'markdown-preview';
    previewContainer.classList.add('markdown-preview', 'invisible');
    panel.dom.appendChild(previewContainer);

    let currentAssetId: string | null = null;

    const updatePreview = (content: string) => {
        previewContainer.innerHTML = md.render(content);
    };

    editor.on('documents:focus', (id: string) => {
        const asset = editor.call('assets:get', id);
        if (!asset) {
            previewContainer.classList.add('invisible');
            currentAssetId = null;
            return;
        }

        const filename = asset.get('file.filename') || '';
        if (filename.endsWith('.md')) {
            currentAssetId = id;
            previewContainer.classList.remove('invisible');
        } else {
            currentAssetId = null;
            previewContainer.classList.add('invisible');
        }
    });

    editor.on('views:change', (id: string, model: MonacoModel) => {
        if (id === currentAssetId) {
            updatePreview(model.getValue());
        }
    });

    editor.on('views:new', (id: string, model: MonacoModel) => {
        const asset = editor.call('assets:get', id);
        if (asset) {
            const filename = asset.get('file.filename') || '';
            if (filename.endsWith('.md')) {
                updatePreview(model.getValue());
            }
        }
    });

    editor.on('documents:close', (id: string) => {
        if (id === currentAssetId) {
            currentAssetId = null;
            previewContainer.classList.add('invisible');
            previewContainer.innerHTML = '';
        }
    });
});
