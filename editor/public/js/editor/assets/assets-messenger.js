editor.once('load', function() {
    'use strict';

    var create = function(data) {
        var assetId = data.asset.id;

        if (data.asset.source === false && data.asset.status !== 'complete')
            return;

        var asset = editor.call('assets:get', assetId);
        if (asset)
            return;

        editor.call('loadAsset', assetId);
    };

    // create new asset
    editor.on('messenger:asset.new', create);

    // remove
    editor.on('messenger:asset.delete', function(data) {
        var asset = editor.call('assets:get', data.asset.id);

        if (! asset)
            return;

        editor.call('assets:remove', asset);
    });
});
