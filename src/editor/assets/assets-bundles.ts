editor.once('load', () => {
    const INVALID_TYPES = ['script', 'folder', 'bundle'];

    // stores <asset id, [bundle assets]> index for mapping
    // any asset it to the bundles that it's referenced from
    const bundlesIndex = {};

    // stores all bundle assets
    const bundleAssets = [];

    const addToIndex = function (assetIds, bundleAsset) {
        if (!assetIds) {
            return;
        }

        for (let i = 0; i < assetIds.length; i++) {
            if (!bundlesIndex[assetIds[i]]) {
                bundlesIndex[assetIds[i]] = [bundleAsset];
                editor.emit('assets:bundles:insert', bundleAsset, assetIds[i]);
            } else {
                if (bundlesIndex[assetIds[i]].indexOf(bundleAsset) === -1) {
                    bundlesIndex[assetIds[i]].push(bundleAsset);
                    editor.emit('assets:bundles:insert', bundleAsset, assetIds[i]);
                }
            }
        }
    };

    // fill bundlesIndex when a new bundle asset is added
    editor.on('assets:add', (asset) => {
        if (asset.get('type') !== 'bundle') {
            return;
        }

        bundleAssets.push(asset);
        addToIndex(asset.get('data.assets'), asset);

        asset.on('data.assets:set', (assetIds) => {
            addToIndex(assetIds, asset);
        });

        asset.on('data.assets:insert', (assetId) => {
            addToIndex([assetId], asset);
        });

        asset.on('data.assets:remove', (assetId) => {
            if (!bundlesIndex[assetId]) {
                return;
            }
            const idx = bundlesIndex[assetId].indexOf(asset);
            if (idx !== -1) {
                bundlesIndex[assetId].splice(idx, 1);
                editor.emit('assets:bundles:remove', asset, assetId);
                if (!bundlesIndex[assetId].length) {
                    delete bundlesIndex[assetId];
                }
            }
        });
    });

    // remove bundle asset from bundlesIndex when a bundle asset is
    // removed
    editor.on('assets:remove', (asset) => {
        if (asset.get('type') !== 'bundle') {
            return;
        }

        let idx = bundleAssets.indexOf(asset);
        if (idx !== -1) {
            bundleAssets.splice(idx, 1);
        }

        for (const id in bundlesIndex) {
            idx = bundlesIndex[id].indexOf(asset);
            if (idx !== -1) {
                bundlesIndex[id].splice(idx, 1);
                editor.emit('assets:bundles:remove', asset, id);

                if (!bundlesIndex[id].length) {
                    delete bundlesIndex[id];
                }
            }
        }
    });

    /**
     * Returns all of the bundle assets for the specified asset
     *
     * @param {Observer} asset - The asset
     * @returns {Observer[]} The bundles for the asset or an empty array.
     */
    editor.method('assets:bundles:listForAsset', (asset) => {
        return bundlesIndex[asset.get('id')] || [];
    });

    /**
     * Returns a list of all the bundle assets
     *
     * @returns {Observer[]} The bundle assets
     */
    editor.method('assets:bundles:list', () => {
        return bundleAssets.slice();
    });

    /**
     * Returns true if the specified asset id is in a bundle
     *
     * @returns {boolean} True of false
     */
    editor.method('assets:bundles:containAsset', (assetId) => {
        return !!bundlesIndex[assetId];
    });

    const isAssetValid = function (asset, bundleAsset) {
        const id = asset.get('id');
        if (asset.get('source')) {
            return false;
        }
        if (INVALID_TYPES.indexOf(asset.get('type')) !== -1) {
            return false;
        }

        if (bundleAsset) {
            const existingAssetIds = bundleAsset.getRaw('data.assets');
            if (existingAssetIds.indexOf(id) !== -1) {
                return false;
            }
        }

        return true;
    };

    /**
     * Checks if the specified asset is valid to be added to a bundle
     * with the specified existing asset ids
     */
    editor.method('assets:bundles:canAssetBeAddedToBundle', isAssetValid);

    /**
     * Adds assets to the bundle asset. Does not add already existing
     * assets or assets with invalid types.
     *
     * @param {Observer[]} assets - The assets to add to the bundle
     * @param {Observer} bundleAsset - The bundle asset
     */
    editor.method('assets:bundles:addAssets', (assets, bundleAsset) => {
        const validAssets = assets.filter((asset) => {
            return isAssetValid(asset, bundleAsset);
        });

        const len = validAssets.length;
        if (!len) {
            return;
        }

        const undo = function () {
            const asset = editor.call('assets:get', bundleAsset.get('id'));
            if (!asset) {
                return;
            }

            const history = asset.history.enabled;
            asset.history.enabled = false;
            for (let i = 0; i < len; i++) {
                asset.removeValue('data.assets', validAssets[i].get('id'));
            }
            asset.history.enabled = history;
        };

        const redo = function () {
            const asset = editor.call('assets:get', bundleAsset.get('id'));
            if (!asset) {
                return;
            }

            const history = asset.history.enabled;
            asset.history.enabled = false;
            for (let i = 0; i < len; i++) {
                if (isAssetValid(validAssets[i], asset)) {
                    asset.insert('data.assets', validAssets[i].get('id'));
                }
            }
            asset.history.enabled = history;
        };

        redo();

        editor.api.globals.history.add({
            name: `asset.${bundleAsset.get('id')}.data.assets`,
            combine: false,
            undo: undo,
            redo: redo
        });

        return len;
    });

    /**
     * Removes the specified assets from the specified bundle asset
     *
     * @param {Observer[]} assets - The assets to remove
     * @param {Observer} bundleAsset - The bundle asset
     */
    editor.method('assets:bundles:removeAssets', (assets, bundleAsset) => {
        const redo = function () {
            const asset = editor.call('assets:get', bundleAsset.get('id'));
            if (!asset) {
                return;
            }

            const history = asset.history.enabled;
            asset.history.enabled = false;
            for (let i = 0; i < assets.length; i++) {
                asset.removeValue('data.assets', assets[i].get('id'));
            }
            asset.history.enabled = history;
        };

        const undo = function () {
            const asset = editor.call('assets:get', bundleAsset.get('id'));
            if (!asset) {
                return;
            }

            const history = asset.history.enabled;
            asset.history.enabled = false;
            for (let i = 0; i < assets.length; i++) {
                if (isAssetValid(assets[i], asset)) {
                    asset.insert('data.assets', assets[i].get('id'));
                }
            }
            asset.history.enabled = history;
        };

        redo();

        editor.api.globals.history.add({
            name: `asset.${bundleAsset.get('id')}.data.assets`,
            combine: false,
            undo: undo,
            redo: redo
        });
    });

    /**
     * Calculates the file size of a bundle Asset by adding up the file
     * sizes of all the assets it references.
     *
     * @param {Observer} The - bundle asset
     * @returns {number} The file size
     */
    editor.method('assets:bundles:calculateSize', (bundleAsset) => {
        let size = 0;
        const assets = bundleAsset.get('data.assets');
        for (let i = 0; i < assets.length; i++) {
            const asset = editor.call('assets:get', assets[i]);
            if (!asset || !asset.has('file.size')) {
                continue;
            }

            size += asset.get('file.size');
        }
        return size;
    });
});
