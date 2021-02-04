editor.once('load', function () {
    'use strict';

    var create = function (data) {
        if (data.asset.branchId !== config.self.branch.id) return;

        var uniqueId = parseInt(data.asset.id, 10);

        if (data.asset.source === false && data.asset.status && data.asset.status !== 'complete') {
            return;
        }

        // todo: data.asset.source_asset_id

        // todo: possibly convert this to a new event `assets:update`
        var asset = editor.call('assets:getUnique', uniqueId);
        if (asset) {
            return;
        }

        editor.call('loadAsset', uniqueId);
    };

    // create new asset
    editor.on('messenger:asset.new', create);

    // remove
    editor.on('messenger:asset.delete', function (data) {
        var asset = editor.call('assets:getUnique', data.asset.id);
        if (! asset) return;
        editor.call('assets:remove', asset);
    });

    // remove multiple
    editor.on('messenger:assets.delete', function (data) {
        for (var i = 0; i < data.assets.length; i++) {
            var asset = editor.call('assets:getUnique', parseInt(data.assets[i], 10));
            if (! asset) continue;
            editor.call('assets:remove', asset);
        }
    });
});
