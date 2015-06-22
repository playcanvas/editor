app.once('load', function() {
    'use strict';

    var create = function(data) {
        var assetId = null;

        if (data.asset.source) {
            return;
        }

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
