editor.once('load', () => {
    const changeName = function (assetId, assetName) {
        editor.api.globals.rest.assets.assetUpdate(assetId, { name: assetName })
        .on('error', (err, data) => {
            log.error(err + data);
            editor.call('status:error', `Couldn't update the name: ${data}`);
        });
    };

    editor.method('assets:rename', (asset, newName) => {
        const oldName = asset.get('name');
        const id = asset.get('id');
        const assetPath = asset.get('path').join('/');
        const isEsmScript = editor.call('assets:isModule', asset);

        // For ES Modules, check if the target name is already taken
        const nameMatchesExistingAsset = isEsmScript && editor.call('assets:list').some((item) => {
            const itemPath = item.get('path').join('/');
            return item.get('name') === newName && itemPath === assetPath && id;
        });

        // If the target name is already taken, show an error message and return early
        if (nameMatchesExistingAsset) {
            editor.call('status:error', `The name "${newName}” with extension “.mjs” is already taken. Please choose a different name.`);
            return;
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
    });
});
