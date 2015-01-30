editor.once('load', function() {
    'use strict';

    editor.on('assets:add', function (asset) {
        if (asset.source) {
            return;
        }

        asset = asset.json();

        var assetData = asset.data;

        if (asset.type === 'material') {
            assetData = editor.call('material:mapToList', asset);
        }

        var framework = editor.call('viewport:framework');
        if (framework) {
            var assetRegistry = framework.context.assets;
            var data = {
                id: asset.id,
                name: asset.name,
                file: asset.file ? {
                    filename: asset.file.filename,
                    url: asset.file.url,
                    hash: asset.file.hash,
                    size: asset.file.size
                } : null,
                data: assetData,
                type: asset.type
            }

            assetRegistry.createAndAddAsset(asset.id, data);

            framework.redraw = true;
        }
    });
});
