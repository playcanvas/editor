app.once('load', function() {
    'use strict';

    var validRuntimeAssets = {
        'material': 1, 'model': 1, 'cubemap': 1, 'text': 1, 'json': 1, 'html': 1, 'css': 1, 'script': 1
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
    app.on('messenger:asset.new', create);

    // remove
    app.on('messenger:asset.delete', function(data) {
        var asset = app.call('assets:get', data.asset.id);

        if (! asset)
            return;

        app.call('assets:remove', asset);
    });
});
