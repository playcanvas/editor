editor.once('load', function() {
    'use strict';

    var validRuntimeAssets = {
        'material': 1, 'model': 1, 'cubemap': 1, 'text': 1, 'json': 1, 'html': 1, 'css': 1, 'script': 1, 'texture': 1, 'textureatlas': 1, 'sprite': 1
    };

    var create = function(data) {
        var assetId = null;

        if (data.asset.source || data.asset.status !== 'complete' && ! validRuntimeAssets.hasOwnProperty(data.asset.type))
            return;

        assetId = data.asset.id;
        if (! assetId)
            return;

        editor.call('loadAsset', assetId);
    };

    // create or update
    editor.on('messenger:asset.new', create);

    // remove
    editor.on('messenger:asset.delete', function(data) {
        var asset = editor.call('assets:get', data.asset.id);

        if (! asset)
            return;

        editor.call('assets:remove', asset);
    });
});
