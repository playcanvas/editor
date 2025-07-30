editor.once('load', () => {
    editor.method('assets:create:script', (args = {}, callback = (asset) => {}) => {

        editor.call('status:clear');

        if (!editor.call('permissions:write')) {
            return;
        }

        const {
            filename = 'script.js',
            parent = editor.call('assets:selected:folder'),
            text
        } = args;

        const isEsmScript = filename.endsWith('.mjs');
        const parentId = parent ? parent.get('id') : null;


        // We need to ensure that the target folder does not already contain an asset with the same name
        const hasExistingEsmScript = isEsmScript && editor.call('assets:list').some((asset) => {
            // get the containing folder of the asset
            const path = asset.get('path').pop();

            const isSameFolder = (path ?? null) === (parentId ?? null);
            const isSameFile = asset.get('name').toLowerCase() === filename.toLowerCase();

            return isSameFile && isSameFolder;
        });

        if (hasExistingEsmScript) {
            editor.call('status:error', `The asset "${filename}" already exists in this location. Please use another name.`);
            return;
        }

        editor.api.globals.assets.createScript({
            filename: filename,
            folder: parent,
            text: text
        }).then((asset) => {
            callback(asset);
        }).catch((err) => {
            editor.call('status:error', err);
        });
    });
});
