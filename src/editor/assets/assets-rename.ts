const TEXT_TYPES = new Set(['css', 'html', 'json', 'script', 'shader', 'text']);

editor.once('load', () => {
    const changeName = function (assetId: string | number, assetName: string) {
        editor.api.globals.rest.assets.assetUpdate(assetId, { name: assetName })
        .on('error', (err, data) => {
            console.warn(`rename error: ${err} ${data}`);
            editor.call('status:error', `Couldn't update the name: ${data}`);
        });
    };

    editor.method('assets:rename', (asset, newName) => {
        const oldName = asset.get('name');
        const id = asset.get('id');
        const type = asset.get('type');
        const path = asset.get('path');
        const parentId = path && path.length ? path[path.length - 1] : null;
        const enforceUnique = TEXT_TYPES.has(type) || type === 'folder';

        // reject if a sibling already has the new name (case-insensitive)
        if (enforceUnique) {
            const collision = editor.call('assets:list').some((item: any) => {
                if (item.get('id') === id) {
                    return false;
                }
                const itemPath = item.get('path');
                const itemParent = itemPath && itemPath.length ? itemPath[itemPath.length - 1] : null;
                if ((itemParent ?? null) !== (parentId ?? null)) {
                    return false;
                }
                return item.get('name').toLowerCase() === newName.toLowerCase();
            });

            if (collision) {
                const message = `An asset named "${newName}" already exists in this folder. Please choose a different name.`;
                editor.call('status:error', message);
                return message;
            }
        }

        editor.api.globals.history?.add({
            name: 'asset rename',
            combine: false,
            undo: function () {
                if (editor.call('assets:get', id)) {
                    changeName(id, oldName);
                }
            },
            redo: function () {
                if (editor.call('assets:get', id)) {
                    changeName(id, newName);
                }
            }
        });

        changeName(id, newName);
        return null;
    });
});
