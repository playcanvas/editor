editor.once('load', function() {
    'use strict';

    var create = function(data) {
        var assetId = data.asset.id;

        console.log('label=\"xdu\" method=\"create\" asset=' + JSON.stringify(data.asset));

        if (data.asset.source === false && data.asset.status && data.asset.status !== 'complete') {
            return;
        }

        // todo: data.asset.source_asset_id

        // todo: possibly convert this to a new event `assets:update`
        var asset = editor.call('assets:get', assetId);
        if (asset) {
            console.log('label=\"xdu\" method=\"create\" msg=\"existing\" assetId=' + assetId);
            return;
        }

        editor.call('loadAsset', assetId);
    };

    // create new asset
    editor.on('messenger:asset.new', create);

    // remove
    editor.on('messenger:asset.delete', function(data) {
        var asset = editor.call('assets:get', data.asset.id);
        if (! asset) return;
        editor.call('assets:remove', asset);
    });

    // remove multiple
    editor.on('messenger:assets.delete', function(data) {
        for(var i = 0; i < data.assets.length; i++) {
            var asset = editor.call('assets:get', parseInt(data.assets[i], 10));
            if (! asset) continue;
            editor.call('assets:remove', asset);
        }
    });
});
