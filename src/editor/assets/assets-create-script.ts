editor.once('load', () => {
    // a script's filename stem becomes a JS class name and the pc.createScript
    // argument, so we never auto-suffix on collision; user must pick a unique name
    editor.method('assets:script:checkCollision', (filename, parent) => {
        const parentId = parent ? parent.get('id') : null;
        const collision = editor.call('assets:list').some((asset) => {
            if (asset.get('type') !== 'script') {
                return false;
            }
            const path = asset.get('path');
            const folder = path && path.length ? path[path.length - 1] : null;
            const isSameFolder = (folder ?? null) === (parentId ?? null);
            const isSameFile = asset.get('name').toLowerCase() === filename.toLowerCase();
            return isSameFolder && isSameFile;
        });
        return collision ? `A script named "${filename}" already exists in this folder. Please use another name.` : null;
    });

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

        const collisionError = editor.call('assets:script:checkCollision', filename, parent);
        if (collisionError) {
            editor.call('status:error', collisionError);
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
