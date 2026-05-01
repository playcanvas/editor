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

        const parentId = parent ? parent.get('id') : null;

        // a script's filename stem becomes a JS class name and the pc.createScript
        // argument, so we never auto-suffix on collision; user must pick a unique name
        const hasExistingScript = editor.call('assets:list').some((asset) => {
            if (asset.get('type') !== 'script') {
                return false;
            }
            const path = asset.get('path');
            const folder = path && path.length ? path[path.length - 1] : null;
            const isSameFolder = (folder ?? null) === (parentId ?? null);
            const isSameFile = asset.get('name').toLowerCase() === filename.toLowerCase();
            return isSameFolder && isSameFile;
        });

        if (hasExistingScript) {
            editor.call('status:error', `A script named "${filename}" already exists in this folder. Please use another name.`);
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
