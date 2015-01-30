editor.once('load', function() {
    'use strict';

    var framework = editor.call('viewport:framework');
    var assetRegistry = framework.context.assets;


    editor.on('assets:add', function (asset) {
        // do only for target assets
        if (asset.source)
            return;

        // raw json data
        asset = asset.json();

        // map for material
        if (asset.type === 'material')
            asset.data = editor.call('material:mapToList', asset);

        // engine material data
        var data = {
            id: asset.id,
            name: asset.name,
            file: asset.file ? {
                filename: asset.file.filename,
                url: asset.file.url,
                hash: asset.file.hash,
                size: asset.file.size
            } : null,
            data: asset.data,
            type: asset.type
        };

        // add to registry
        assetRegistry.createAndAddAsset(asset.id, data);

        // render
        editor.call('viewport:render');
    });
});
