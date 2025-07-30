import { LegacyScriptPreviewOverlay } from './legacy-script-preview-overlay.ts';

editor.once('load', () => {
    const types = new Set(['css', 'html', 'json', 'script', 'shader', 'text']);

    editor.method('assets:edit', async (asset) => {
        const type = asset.get('type');
        const useLegacyScripts = editor.call('settings:project').get('useLegacyScripts');

        if (type === 'script' && useLegacyScripts) {
            const filename = asset.get('filename') || asset.get('name');
            try {
                const text = await editor.api.globals.rest.projects.projectRepoSourcefile('directory', filename).promisify();
                const preview = new LegacyScriptPreviewOverlay({
                    name: filename,
                    code: text
                });
                editor.call('layout.root').append(preview);
            } catch (error) {
                console.error('Error fetching script:', error);
            }
        } else {
            editor.call('picker:codeeditor', asset);
        }
    });

    const attachDblClickHandler = (key, asset) => {
        const gridItem = editor.call('assets:panel:get', asset.get(key));
        if (gridItem) {
            gridItem.element.addEventListener('dblclick', () => {
                editor.call('assets:edit', asset);
            });
        }
    };

    editor.on('assets:add', (asset) => {
        if (types.has(asset.get('type'))) {
            attachDblClickHandler('id', asset);
        }
    });

    editor.on('sourcefiles:add', (file) => {
        attachDblClickHandler('filename', file);
    });
});
