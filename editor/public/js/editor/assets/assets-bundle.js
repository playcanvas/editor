editor.once('load', function () {
    'use strict';

    var INVALID_TYPES = ['script', 'folder', 'bundle'];

    var isAssetValid = function (asset, existingAssetIds) {
        var id = asset.get('id');
        if (existingAssetIds.indexOf(id) !== -1) return false;
        if (asset.get('source')) return false;
        if (INVALID_TYPES.indexOf(asset.get('type')) !== -1) return false;

        return true;
    };

    /**
     * Adds assets to the bundle asset. Does not add already existing
     * assets or assets with invalid types.
     * @param {Observer[]} assets The assets to add to the bundle
     * @param {Observer} bundleAsset The bundle asset
     */
    editor.method('assets:bundle:addAssets', function (assets, bundleAsset) {
        var existingAssetIds = bundleAsset.get('data.assets');
        var validAssets = assets.filter(function (asset) {
            return isAssetValid(asset, existingAssetIds);
        });

        if (! validAssets.length) return;

        var undo = function () {
            var asset = editor.call('assets:get', bundleAsset.get('id'));
            if (! asset) return;

            var history = asset.history.enabled;
            asset.history.enabled = false;
            for (var i = 0; i < validAssets.length; i++) {
                asset.removeValue('data.assets', validAssets[i].get('id'));
            }
            asset.history.enabled = history;
        };

        var redo = function () {
            var asset = editor.call('assets:get', bundleAsset.get('id'));
            if (! asset) return;

            existingAssetIds = asset.get('data.assets');

            var history = asset.history.enabled;
            asset.history.enabled = false;
            for (var i = 0; i < validAssets.length; i++) {
                if (isAssetValid(validAssets[i], existingAssetIds)) {
                    asset.insert('data.assets', validAssets[i].get('id'));
                }
            }
            asset.history.enabled = history;
        };

        var history = bundleAsset.history.enabled;
        bundleAsset.history.enabled = false;
        for (var i = 0; i < validAssets.length; i++) {
            bundleAsset.insert('data.assets', validAssets[i].get('id'));
        }
        bundleAsset.history.enabled = history;

        editor.call('history:add', {
            name: 'asset.' + bundleAsset.get('id') + '.data.assets',
            undo: undo,
            redo: redo
        });
    });
});
