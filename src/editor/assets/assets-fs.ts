editor.once('load', () => {
    const getIds = function (assets) {
        if (!(assets instanceof Array)) {
            assets = [assets];
        }

        const ids = [];
        for (let i = 0; i < assets.length; i++) {
            ids.push(parseInt(assets[i].get('uniqueId'), 10));
        }

        return ids;
    };

    editor.method('assets:fs:delete', (assets) => {
        editor.call('realtime:send', 'fs', {
            op: 'delete',
            ids: getIds(assets)
        });
    });

    editor.method('assets:fs:move', (assets, assetTo) => {

        const target = assetTo && parseInt(assetTo.get('id'), 10);

        // Get a list of esm scripts at the target location as a Map<name, asset>
        const esmScriptsAtTarget = editor.call('assets:list').reduce((map, asset) => {
            const path = asset.get('path').pop();

            const isSameFolder = (path ?? null) === (target ?? null);

            if (editor.call('assets:isModule', asset) && isSameFolder) {
                map.set(asset.get('name').toLowerCase(), asset);
            }
            return map;
        }, new Map());

        // Get a list of esm scripts that are being moved that match the names of the esm scripts at the target location
        const conflictingAssets = assets.filter((asset) => {
            return editor.call('assets:isModule', asset) && esmScriptsAtTarget.has(asset.get('name').toLowerCase());
        });

        // If there are conflicting ES Module assets, show an error message and return early
        if (conflictingAssets.length > 0) {
            const conflictingAssetNames = conflictingAssets.map(asset => asset.get('name')).join(', ');
            editor.call('status:error', `The assets "${conflictingAssetNames}" already exist in this location. Move Aborted.`);
            return;
        }

        editor.call('realtime:send', 'fs', {
            op: 'move',
            ids: getIds(assets),
            to: assetTo ? parseInt(assetTo.get('uniqueId'), 10) : null
        });
    });

    editor.method('assets:fs:duplicate', (assets) => {
        editor.call('realtime:send', 'fs', {
            op: 'duplicate',
            ids: getIds(assets)
        });
    });
});
